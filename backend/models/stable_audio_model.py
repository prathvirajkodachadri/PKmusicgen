"""
Stable Audio Open 1.0 Model Wrapper (stabilityai/stable-audio-open-1.0)
Uses Diffusers pipeline
"""
import time
import logging
from pathlib import Path
from typing import List, Optional
import numpy as np

from .base_model import AudioGenerationModel, GenerationRequest, GenerationResult
from ..core.errors import ModelNotInstalledError, GenerationFailedError

logger = logging.getLogger("pkmusicgen.models.stable_audio")


class StableAudioOpenModel(AudioGenerationModel):
    """Wrapper for Stability AI Stable Audio Open 1.0"""

    def __init__(self, model_id: str = "stable-audio-open-1.0", model_path: Optional[str] = None, device: str = "cpu"):
        super().__init__(model_id=model_id, model_path=model_path, device=device)
        self.pipe = None

    def load(self) -> bool:
        if self.model_path and not Path(self.model_path).exists():
            raise ModelNotInstalledError(self.model_id)

        try:
            import torch
            from diffusers import StableAudioPipeline

            repo_or_path = self.model_path if (self.model_path and Path(self.model_path).exists() and any(Path(self.model_path).iterdir())) else "stabilityai/stable-audio-open-1.0"

            logger.info(f"Loading StableAudioPipeline from {repo_or_path} onto {self.device}")
            self.pipe = StableAudioPipeline.from_pretrained(
                repo_or_path,
                torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
            )
            self.pipe.to(self.device)
            self._is_loaded = True
            return True

        except (ImportError, Exception) as e:
            logger.warning(f"Stable Audio failed to load: {e}")
            if isinstance(e, ModelNotInstalledError):
                raise e
            raise ModelNotInstalledError(self.model_id)

    def unload(self) -> bool:
        try:
            import torch
            import gc
            self.pipe = None
            self._is_loaded = False
            gc.collect()
            if torch.cuda.is_available():
                torch.cuda.empty_cache()
            return True
        except Exception:
            self._is_loaded = False
            return True

    def generate(self, request: GenerationRequest) -> List[GenerationResult]:
        if not self._is_loaded:
            self.load()

        try:
            import torch

            start_time = time.time()
            results = []
            sr = 44100

            base_seed = request.seed if request.seed >= 0 else int(time.time() * 1000) % 1_000_000_000
            generator = torch.Generator(device=self.device)

            for idx in range(request.num_variations):
                current_seed = base_seed + idx
                generator.manual_seed(current_seed)

                output = self.pipe(
                    prompt=request.prompt,
                    negative_prompt=request.negative_prompt or "",
                    audio_end_in_s=min(request.duration, 47.0),
                    num_inference_steps=50,
                    guidance_scale=request.guidance_scale,
                    generator=generator
                )

                audio_np = output.audios[0]  # shape: (channels, samples)
                gen_time = max(0.01, (time.time() - start_time) / (idx + 1))

                results.append(GenerationResult(
                    audio_data=audio_np,
                    sample_rate=sr,
                    duration=audio_np.shape[-1] / sr,
                    seed=current_seed,
                    generation_time=gen_time,
                    metadata={"model": self.model_id, "prompt": request.prompt}
                ))

            return results

        except Exception as e:
            logger.error(f"Stable Audio generation failed: {e}", exc_info=True)
            raise GenerationFailedError(str(e))
