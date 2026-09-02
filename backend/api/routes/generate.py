"""
Generation API routes
"""
import asyncio
import time
import uuid
import soundfile as sf
import numpy as np
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, BackgroundTasks
from pydantic import BaseModel, Field
import logging

from ...core.config import get_config, is_offline_mode
from ...core.errors import ModelNotInstalledError, InsufficientVRAMError, GenerationFailedError, InvalidPromptError
from ...models.base_model import GenerationRequest
from ...models.model_registry import get_registry
from ...audio.export import export_wav, ExportConfig, generate_filename
from ...audio.analysis import analyze_audio
from ...audio.processing import apply_reverb, apply_bass_boost, apply_8d_spatializer, normalize_audio, fade_in_out, trim_silence
from ...generation.song_assistant import AISongAssistant
from ...database.db import get_db, SampleRecord

logger = logging.getLogger("pkmusicgen.api.generate")

router = APIRouter(prefix="/api/generate", tags=["generate"])

# In-memory model cache
_model_cache = {}
_generation_tasks = {}  # task_id -> status


class GenerateRequestModel(BaseModel):
    prompt: str = Field(..., max_length=1000, description="Text prompt")
    negative_prompt: Optional[str] = Field(None, max_length=500)
    duration: float = Field(10.0, ge=0.5, le=240)
    seed: int = Field(-1, description="-1 for random")
    num_variations: int = Field(1, ge=1, le=10)
    model_id: str = Field("procedural-dsp")
    guidance_scale: float = Field(7.0, ge=1.0, le=20.0)
    temperature: float = Field(1.0, ge=0.1, le=2.0)
    sample_rate: int = Field(44100, description="44100 or 48000")
    bit_depth: int = Field(16, description="16 or 24")
    category: Optional[str] = None
    tags: Optional[str] = None
    # Prompt builder fields
    genre: Optional[str] = None
    mood: Optional[str] = None
    texture: Optional[str] = None
    instrumentation: Optional[List[str]] = None
    # Processing
    normalize: bool = False
    fade_in: float = 0.0
    fade_out: float = 0.0


class GenerateResponseModel(BaseModel):
    task_id: str
    status: str
    message: str


class EffectsRequestModel(BaseModel):
    sample_id: int
    reverb: float = Field(0.0, ge=0.0, le=1.0)
    bass_boost: float = Field(0.0, ge=0.0, le=15.0)
    spatial_8d: bool = False
    normalize: bool = True
    fade_in: float = Field(0.0, ge=0.0, le=5.0)
    fade_out: float = Field(0.0, ge=0.0, le=5.0)


class SongAssistantRequestModel(BaseModel):
    prompt: str
    genre: Optional[str] = None
    mood: Optional[str] = None


def _get_model_instance(model_id: str, models_dir: Path = None):
    """Get or create model instance"""
    if model_id in _model_cache:
        return _model_cache[model_id]

    cfg = get_config()
    models_dir = Path(cfg.get('paths', {}).get('model_dir', './models'))
    model_path = models_dir / model_id

    # Registry check
    registry = get_registry(models_dir=models_dir)
    entry = registry.get(model_id)
    if not entry:
        raise HTTPException(status_code=404, detail=f"Model {model_id} not found in registry")

    # Instantiate appropriate class
    if model_id == "procedural-dsp":
        from ...models.procedural_model import ProceduralDSPModel
        instance = ProceduralDSPModel(model_id=model_id, model_path=str(model_path) if model_path.exists() else None, device="cpu")
    elif model_id.startswith("stable-audio"):
        from ...models.stable_audio_model import StableAudioOpenModel
        device = "cpu"
        try:
            import torch
            if torch.cuda.is_available():
                device = "cuda"
        except:
            pass
        instance = StableAudioOpenModel(model_id=model_id, model_path=str(model_path) if model_path.exists() else None, device=device)
    elif model_id.startswith("ace-step"):
        from ...models.ace_step_model import ACEStepModel
        device = "cpu"
        try:
            import torch
            if torch.cuda.is_available():
                device = "cuda"
        except:
            pass
        instance = ACEStepModel(model_id=model_id, model_path=str(model_path) if model_path.exists() else None, device=device)
    elif model_id.startswith("musicgen"):
        from ...models.musicgen_model import MusicGenModel
        device = "cpu"
        try:
            import torch
            if torch.cuda.is_available():
                device = "cuda"
        except:
            pass
        instance = MusicGenModel(model_id=model_id, model_path=str(model_path) if model_path.exists() else None, device=device)
    else:
        from ...models.procedural_model import ProceduralDSPModel
        instance = ProceduralDSPModel(model_id=model_id, model_path=None, device="cpu")

    _model_cache[model_id] = instance
    return instance


@router.post("/", response_model=GenerateResponseModel)
async def generate_audio(request: GenerateRequestModel, background_tasks: BackgroundTasks):
    """Start generation (async)"""
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    if is_offline_mode():
        cfg = get_config()
        models_dir = Path(cfg.get('paths', {}).get('model_dir', './models'))
        model_path = models_dir / request.model_id
        registry = get_registry(models_dir=models_dir)
        entry = registry.get(request.model_id)
        if entry and entry.id != "procedural-dsp":
            if not model_path.exists() or not any(model_path.iterdir()):
                raise HTTPException(status_code=400, detail=f"Offline Mode ON and model {request.model_id} not installed")

    task_id = str(uuid.uuid4())
    _generation_tasks[task_id] = {
        "status": "queued",
        "progress": 0,
        "request": request.model_dump(),
        "created_at": time.time(),
        "results": []
    }

    background_tasks.add_task(_run_generation, task_id, request)
    return GenerateResponseModel(task_id=task_id, status="queued", message="Generation queued")


def _run_generation(task_id: str, request: GenerateRequestModel):
    """Background generation task"""
    try:
        _generation_tasks[task_id]["status"] = "loading_model"
        _generation_tasks[task_id]["progress"] = 10

        cfg = get_config()
        output_dir = Path(cfg.get('paths', {}).get('output_dir', './outputs'))
        output_dir.mkdir(parents=True, exist_ok=True)

        try:
            model = _get_model_instance(request.model_id)
            model.load()
        except ModelNotInstalledError as e:
            _generation_tasks[task_id]["status"] = "failed"
            _generation_tasks[task_id]["error"] = e.user_message
            logger.error(f"Model not installed: {e}")
            return
        except InsufficientVRAMError as e:
            _generation_tasks[task_id]["status"] = "failed"
            _generation_tasks[task_id]["error"] = e.user_message
            return
        except Exception as e:
            _generation_tasks[task_id]["status"] = "failed"
            _generation_tasks[task_id]["error"] = f"Failed to load model: {str(e)}"
            logger.error(f"Model load failed: {e}", exc_info=True)
            return

        _generation_tasks[task_id]["status"] = "generating"
        _generation_tasks[task_id]["progress"] = 30

        final_prompt = request.prompt
        if request.genre or request.mood or request.texture or request.instrumentation:
            from ...generation.prompt_builder import build_prompt
            built = build_prompt(
                genre=request.genre,
                mood=request.mood,
                texture=request.texture,
                instrumentation=request.instrumentation,
                custom_prompt=request.prompt if request.prompt else None,
                duration=request.duration
            )
            final_prompt = built

        gen_req = GenerationRequest(
            prompt=final_prompt,
            negative_prompt=request.negative_prompt,
            duration=request.duration,
            seed=request.seed,
            num_variations=request.num_variations,
            guidance_scale=request.guidance_scale,
            temperature=request.temperature,
            sample_rate=request.sample_rate,
            model_id=request.model_id
        )

        try:
            results = model.generate(gen_req)
        except Exception as e:
            _generation_tasks[task_id]["status"] = "failed"
            _generation_tasks[task_id]["error"] = f"Generation failed: {str(e)}"
            logger.error(f"Generation failed: {e}", exc_info=True)
            return

        _generation_tasks[task_id]["progress"] = 70
        _generation_tasks[task_id]["status"] = "exporting"

        exported = []
        db = get_db()

        for idx, result in enumerate(results):
            filename = generate_filename(
                prompt=final_prompt,
                model_id=request.model_id,
                seed=result.seed,
                index=idx,
                prefix=request.category
            )
            file_path = output_dir / filename

            export_cfg = ExportConfig(
                sample_rate=request.sample_rate,
                bit_depth=request.bit_depth,
                normalize=request.normalize,
                fade_in=request.fade_in,
                fade_out=request.fade_out,
                trim_silence=False
            )

            try:
                exported_path = export_wav(result.audio_data, result.sample_rate, file_path, export_cfg)
                analysis = analyze_audio(result.audio_data, result.sample_rate)

                file_size = exported_path.stat().st_size if exported_path.exists() else 0
                record = SampleRecord(
                    filename=filename,
                    filepath=str(exported_path),
                    prompt=final_prompt,
                    negative_prompt=request.negative_prompt,
                    model_id=request.model_id,
                    seed=result.seed,
                    duration=result.duration,
                    sample_rate=export_cfg.sample_rate,
                    bit_depth=export_cfg.bit_depth,
                    channels=2,
                    category=request.category,
                    tags=request.tags or "",
                    file_size=file_size,
                    peak_db=analysis.get("peak_db", 0),
                    rms_db=analysis.get("rms_db", 0),
                    generation_time=result.generation_time,
                    extra_metadata=str(result.metadata)
                )
                db_id = db.add_sample(record)

                exported.append({
                    "id": db_id,
                    "filename": filename,
                    "filepath": str(exported_path),
                    "prompt": final_prompt,
                    "model_id": request.model_id,
                    "seed": result.seed,
                    "duration": result.duration,
                    "sample_rate": export_cfg.sample_rate,
                    "generation_time": result.generation_time,
                    "analysis": analysis,
                    "file_url": f"/api/library/file/{db_id}"
                })
            except Exception as e:
                logger.error(f"Export failed for variation {idx}: {e}", exc_info=True)
                continue

        _generation_tasks[task_id]["status"] = "completed"
        _generation_tasks[task_id]["progress"] = 100
        _generation_tasks[task_id]["results"] = exported
        _generation_tasks[task_id]["completed_at"] = time.time()

        if cfg.get('models', {}).get('unload_after_generation', False):
            try:
                model.unload()
            except:
                pass

    except Exception as e:
        _generation_tasks[task_id]["status"] = "failed"
        _generation_tasks[task_id]["error"] = str(e)
        logger.error(f"Generation task {task_id} failed: {e}", exc_info=True)


@router.get("/status/{task_id}")
async def get_generation_status(task_id: str):
    if task_id not in _generation_tasks:
        raise HTTPException(status_code=404, detail="Task not found")
    return _generation_tasks[task_id]


@router.post("/sync")
async def generate_sync(request: GenerateRequestModel):
    """Synchronous generation (blocking)"""
    if not request.prompt or not request.prompt.strip():
        raise HTTPException(status_code=400, detail="Prompt cannot be empty")

    task_id = str(uuid.uuid4())
    _generation_tasks[task_id] = {
        "status": "queued",
        "progress": 0,
        "request": request.model_dump(),
        "created_at": time.time(),
        "results": []
    }

    _run_generation(task_id, request)

    task = _generation_tasks[task_id]
    if task["status"] == "failed":
        raise HTTPException(status_code=500, detail=task.get("error", "Generation failed"))

    return task


@router.get("/variations")
async def get_variation_presets():
    from ...generation.variation import get_variation_buttons
    return get_variation_buttons()


@router.post("/variation/{sample_id}/{variation_type}")
async def generate_variation_from_sample(sample_id: int, variation_type: str):
    """Generate variation from existing sample"""
    db = get_db()
    sample = db.get_sample(sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    from ...generation.variation import apply_variation

    new_prompt = apply_variation(sample.prompt, variation_type)

    req = GenerateRequestModel(
        prompt=new_prompt,
        duration=sample.duration,
        seed=-1,
        num_variations=1,
        model_id=sample.model_id,
        sample_rate=sample.sample_rate,
        category=sample.category,
        tags=sample.tags
    )

    task_id = str(uuid.uuid4())
    _generation_tasks[task_id] = {
        "status": "queued",
        "progress": 0,
        "request": req.model_dump(),
        "created_at": time.time(),
        "results": []
    }

    _run_generation(task_id, req)

    task = _generation_tasks[task_id]
    if task["status"] == "failed":
        raise HTTPException(status_code=500, detail=task.get("error", "Generation failed"))

    return task


@router.get("/random_prompt")
async def get_random_prompt():
    """Get instant creative prompt template"""
    assistant = AISongAssistant()
    return assistant.get_random_prompt()


@router.post("/song_assistant")
async def get_song_structure_and_lyrics(req: SongAssistantRequestModel):
    """AI song structure, chord progression, and lyric ideas"""
    assistant = AISongAssistant()
    return assistant.generate_song_plan(prompt=req.prompt, genre=req.genre, mood=req.mood)


@router.post("/effects")
async def apply_audio_effects(req: EffectsRequestModel):
    """Apply studio audio effects (Reverb, Bass Boost, 8D Spatializer, Normalizer, Fade)"""
    db = get_db()
    sample = db.get_sample(req.sample_id)
    if not sample:
        raise HTTPException(status_code=404, detail="Sample not found")

    src_path = Path(sample.filepath)
    if not src_path.exists():
        raise HTTPException(status_code=404, detail="Audio file not found on disk")

    try:
        audio, sr = sf.read(str(src_path))
        # Ensure (channels, samples) format for processing
        if audio.ndim == 1:
            arr = np.vstack([audio, audio])
        elif audio.ndim == 2:
            arr = audio.T if audio.shape[0] > audio.shape[1] else audio
        else:
            arr = audio[0]

        # Apply Reverb
        if req.reverb > 0.01:
            arr = apply_reverb(arr, sr, room_size=req.reverb, wet_level=req.reverb * 0.5)

        # Apply Bass Boost
        if req.bass_boost > 0.1:
            arr = apply_bass_boost(arr, sr, gain_db=req.bass_boost)

        # Apply 8D Spatializer
        if req.spatial_8d:
            arr = apply_8d_spatializer(arr, sr, speed_hz=0.2)

        # Fade In/Out
        if req.fade_in > 0 or req.fade_out > 0:
            arr = fade_in_out(arr, sr, fade_in=req.fade_in, fade_out=req.fade_out)

        # Normalize
        if req.normalize:
            arr = normalize_audio(arr, target_peak=0.98)

        # Generate new filename & save
        cfg = get_config()
        output_dir = Path(cfg.get('paths', {}).get('output_dir', './outputs'))
        new_filename = f"fx_{int(time.time())}_{sample.filename}"
        new_filepath = output_dir / new_filename

        export_cfg = ExportConfig(sample_rate=sr, bit_depth=16, normalize=False)
        exported_path = export_wav(arr, sr, new_filepath, export_cfg)

        analysis = analyze_audio(arr, sr)
        file_size = exported_path.stat().st_size if exported_path.exists() else 0

        # Save record
        record = SampleRecord(
            filename=new_filename,
            filepath=str(exported_path),
            prompt=f"{sample.prompt} [FX: Reverb {int(req.reverb*100)}%, Bass +{req.bass_boost}dB{' , 8D' if req.spatial_8d else ''}]",
            model_id=sample.model_id,
            seed=sample.seed,
            duration=len(arr[0]) / sr if arr.ndim == 2 else len(arr) / sr,
            sample_rate=sr,
            bit_depth=16,
            channels=2,
            category=sample.category,
            tags=(sample.tags or "") + ",fx",
            file_size=file_size,
            peak_db=analysis.get("peak_db", 0),
            rms_db=analysis.get("rms_db", 0),
            generation_time=0.05
        )
        new_id = db.add_sample(record)

        return {
            "id": new_id,
            "filename": new_filename,
            "filepath": str(exported_path),
            "file_url": f"/api/library/file/{new_id}",
            "analysis": analysis,
            "duration": record.duration
        }

    except Exception as e:
        logger.error(f"Failed to apply effects: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Effects processing failed: {str(e)}")
