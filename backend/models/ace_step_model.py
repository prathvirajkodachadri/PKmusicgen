"""Real ACE-Step 1.5 local music-generation adapter."""
import inspect
import logging
import os
import time
from pathlib import Path
from typing import List, Optional

import soundfile as sf

from .base_model import AudioGenerationModel, GenerationRequest, GenerationResult
from ..core.errors import ModelNotInstalledError, GenerationFailedError

logger = logging.getLogger("pkmusicgen.models.ace_step")
DEFAULT_CONFIG = "acestep-v15-turbo"
DEFAULT_LM = "acestep-5Hz-lm-1.7B"


class ACEStepModel(AudioGenerationModel):
    """Adapter around the real ACE-Step 1.5 inference API."""

    def __init__(self, model_id: str = "ace-step-1.5", model_path: Optional[str] = None, device: str = "cpu"):
        super().__init__(model_id=model_id, model_path=model_path, device=device)
        self.dit_handler = None
        self.llm_handler = None
        self._generate_music = None
        self._GenerationParams = None
        self._GenerationConfig = None

    @staticmethod
    def _device_available(device: str) -> str:
        try:
            import torch
            if device == "cuda" and torch.cuda.is_available(): return "cuda"
            if device == "xpu" and hasattr(torch, "xpu") and torch.xpu.is_available(): return "xpu"
            if device == "mps" and hasattr(torch.backends, "mps") and torch.backends.mps.is_available(): return "mps"
            if device == "cpu": return "cpu"
            if torch.cuda.is_available(): return "cuda"
        except Exception:
            pass
        return "cpu"

    @staticmethod
    def _filter_kwargs(callable_obj, values: dict) -> dict:
        try:
            params = inspect.signature(callable_obj).parameters
            return {k: v for k, v in values.items() if k in params}
        except (TypeError, ValueError):
            return values

    def load(self) -> bool:
        if self._is_loaded:
            return True
        model_root = Path(self.model_path) if self.model_path else None
        if not model_root or not model_root.exists():
            raise ModelNotInstalledError(self.model_id)

        checkpoints_dir = model_root / "checkpoints"
        if not checkpoints_dir.exists():
            checkpoints_dir = model_root
        if not any(checkpoints_dir.iterdir()):
            raise ModelNotInstalledError(self.model_id)

        os.environ["ACESTEP_CHECKPOINTS_DIR"] = str(checkpoints_dir.resolve())
        try:
            from acestep.handler import AceStepHandler
            from acestep.llm_inference import LLMHandler
            from acestep.inference import GenerationParams, GenerationConfig, generate_music

            self.device = self._device_available(self.device)
            self.dit_handler = AceStepHandler()
            init_kwargs = self._filter_kwargs(self.dit_handler.initialize_service, {
                "project_root": str(model_root.resolve()),
                "config_path": DEFAULT_CONFIG,
                "device": self.device,
                "offload_to_cpu": self.device == "cpu",
            })
            status = self.dit_handler.initialize_service(**init_kwargs)
            if isinstance(status, tuple) and len(status) >= 2 and not status[1]:
                raise RuntimeError(str(status[0]))

            self.llm_handler = LLMHandler()
            lm_kwargs = self._filter_kwargs(self.llm_handler.initialize, {
                "checkpoint_dir": str(checkpoints_dir.resolve()),
                "lm_model_path": DEFAULT_LM,
                "backend": "pt",
                "device": self.device,
                "offload_to_cpu": self.device == "cpu",
            })
            lm_status, lm_ok = self.llm_handler.initialize(**lm_kwargs)
            if not lm_ok:
                raise RuntimeError(str(lm_status))

            self._generate_music = generate_music
            self._GenerationParams = GenerationParams
            self._GenerationConfig = GenerationConfig
            self._is_loaded = True
            logger.info("Real ACE-Step 1.5 loaded successfully")
            return True
        except ModelNotInstalledError:
            raise
        except Exception as exc:
            self.unload()
            logger.exception("ACE-Step 1.5 initialization failed")
            raise GenerationFailedError(f"ACE-Step 1.5 could not be initialized: {exc}") from exc

    def unload(self) -> bool:
        try:
            if self.llm_handler is not None and hasattr(self.llm_handler, "unload"):
                self.llm_handler.unload()
        except Exception:
            logger.exception("Error unloading ACE-Step LM")
        try:
            if self.dit_handler is not None and hasattr(self.dit_handler, "unload"):
                self.dit_handler.unload()
        except Exception:
            logger.exception("Error unloading ACE-Step DiT")
        self.llm_handler = None
        self.dit_handler = None
        self._generate_music = None
        self._GenerationParams = None
        self._GenerationConfig = None
        self._is_loaded = False
        try:
            import torch
            if torch.cuda.is_available(): torch.cuda.empty_cache()
        except Exception:
            pass
        return True

    def generate(self, request: GenerationRequest) -> List[GenerationResult]:
        if not self._is_loaded:
            self.load()
        started = time.time()
        save_dir = Path(self.model_path or "./models") / "generated"
        save_dir.mkdir(parents=True, exist_ok=True)
        try:
            params_values = {
                "task_type": "text2music",
                "caption": request.prompt,
                "lyrics": "",
                "duration": request.duration,
                "inference_steps": 8,
                "guidance_scale": request.guidance_scale,
                "seed": request.seed,
                "thinking": False,
                "instrumental": True,
            }
            params = self._GenerationParams(**self._filter_kwargs(self._GenerationParams, params_values))
            use_random = request.seed < 0
            seeds = None if use_random else [request.seed + i for i in range(request.num_variations)]
            config = self._GenerationConfig(**self._filter_kwargs(self._GenerationConfig, {
                "batch_size": request.num_variations,
                "seeds": seeds,
                "use_random_seed": use_random,
                "audio_format": "wav",
            }))
            result = self._generate_music(self.dit_handler, self.llm_handler, params=params, config=config, save_dir=str(save_dir))
            if not result.success:
                raise RuntimeError(result.error or result.status_message or "ACE-Step generation failed")

            outputs = []
            for idx, audio_info in enumerate(result.audios):
                path = audio_info.get("path") if isinstance(audio_info, dict) else str(audio_info)
                if not path or not Path(path).exists():
                    raise RuntimeError(f"ACE-Step returned no readable audio path for variation {idx + 1}")
                audio, sr = sf.read(path, dtype="float32", always_2d=True)
                audio = audio.T
                outputs.append(GenerationResult(
                    audio_data=audio,
                    sample_rate=sr,
                    duration=audio.shape[-1] / float(sr),
                    seed=request.seed + idx if request.seed >= 0 else int(time.time_ns() % 2**31) + idx,
                    generation_time=time.time() - started,
                    metadata={"model": "ACE-Step 1.5", "prompt": request.prompt, "source_path": path, "upstream_metadata": audio_info},
                ))
            return outputs
        except Exception as exc:
            logger.exception("ACE-Step generation failed")
            raise GenerationFailedError(str(exc)) from exc
