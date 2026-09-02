"""
Presets API
"""
from fastapi import APIRouter, HTTPException
from pathlib import Path
import json
from typing import Dict, List

from ...generation.prompt_builder import PromptBuilder
from ...generation.horror_mode import HorrorSoundDesigner
from ...generation.film_bgm import FilmBGMGenerator
from ...core.config import get_config

router = APIRouter(prefix="/api/presets", tags=["presets"])

@router.get("/")
async def list_all_presets():
    cfg = get_config()
    presets_dir = Path(cfg.get('paths', {}).get('presets_dir', './presets'))
    
    result = {}
    
    if not presets_dir.exists():
        return {"presets": result}
    
    for json_file in presets_dir.glob("*.json"):
        category = json_file.stem
        try:
            with open(json_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
            result[category] = data
        except Exception as e:
            result[category] = {"error": str(e)}
    
    return {"presets": result, "count": len(result)}

@router.get("/{category}")
async def get_preset_category(category: str):
    cfg = get_config()
    presets_dir = Path(cfg.get('paths', {}).get('presets_dir', './presets'))
    preset_file = presets_dir / f"{category}.json"
    
    if not preset_file.exists():
        raise HTTPException(status_code=404, detail=f"Preset category {category} not found")
    
    try:
        with open(preset_file, 'r', encoding='utf-8') as f:
            data = json.load(f)
        return {"category": category, "presets": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load presets: {e}")

@router.get("/horror/list")
async def list_horror_presets():
    designer = HorrorSoundDesigner()
    return {"presets": designer.list_presets()}

@router.post("/horror/build")
async def build_horror_prompt(data: Dict):
    designer = HorrorSoundDesigner()
    try:
        prompt = designer.build_prompt(
            mood=data.get("mood", "terrifying"),
            texture=data.get("texture", "metallic"),
            movement=data.get("movement", "slowly evolving"),
            frequency=data.get("frequency", "deep"),
            duration=data.get("duration", 8),
            extra=data.get("extra"),
            preset=data.get("preset")
        )
        return {"prompt": prompt}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/film_bgm/build")
async def build_film_bgm_prompt(data: Dict):
    gen = FilmBGMGenerator()
    try:
        prompt = gen.build_prompt(
            scene_description=data.get("scene_description", ""),
            emotion=data.get("emotion", "tension"),
            genre=data.get("genre", "cinematic"),
            duration=data.get("duration", 20),
            bpm=data.get("bpm"),
            key=data.get("key"),
            intensity=data.get("intensity", "medium"),
            instrumentation=data.get("instrumentation"),
            reference_mood=data.get("reference_mood"),
            extra=data.get("extra")
        )
        variations = gen.generate_variations(prompt, count=data.get("variations", 3))
        return {"prompt": prompt, "variations": variations}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/builder/build")
async def build_custom_prompt(data: Dict):
    builder = PromptBuilder()
    try:
        prompt = builder.build(
            genre=data.get("genre"),
            mood=data.get("mood"),
            texture=data.get("texture"),
            instrumentation=data.get("instrumentation"),
            tempo=data.get("tempo"),
            key=data.get("key"),
            bpm=data.get("bpm"),
            duration=data.get("duration"),
            extra_descriptors=data.get("extra_descriptors"),
            custom_prompt=data.get("custom_prompt"),
            scene_description=data.get("scene_description"),
            emotion=data.get("emotion"),
            intensity=data.get("intensity")
        )
        return {"prompt": prompt}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/builder/options")
async def get_builder_options():
    builder = PromptBuilder()
    return {
        "genres": builder.GENRES,
        "moods": builder.MOODS,
        "textures": builder.TEXTURES,
        "instruments": builder.INSTRUMENTS,
        "tempos": builder.TEMPOS,
        "keys": builder.KEYS
    }
