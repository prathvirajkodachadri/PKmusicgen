"""
MusicGen Model Wrapper (facebook/musicgen-small, facebook/musicgen-medium)
Uses HuggingFace transformers pipeline
"""
import time
import logging
from pathlib import Path
from typing import List, Optional
import numpy as np

from .base_model import AudioGenerationModel, GenerationRequest, GenerationResult
from ..core.errors import ModelNotInstalledError, GenerationFailedError

logger = logging.getLogger("pkmusicgen.models.musicgen")


class MusicGenModel(AudioGenerationModel):
    """Wrapper for Meta MusicGen models via Hugging Face Transformers"""

    def __init__(self, model_id: str = "musicgen-medium", model_path: Optional[str] = None, device: str = "cpu"):
        super().__init__(model_id=model_id, model_path=model_path, device=device)
        self.processor = None
        self.model = None

    def load(self) -> bool:
        try:
            import torch
            from transformers import AutoProcessor, MusicgenForConditionalGeneration

            repo_or_path = self.model_path if (self.model_path and Path(self.model_path).exists() and any(Path(self.model_path).iterdir())) else "facebook/musicgen-small" if "small" in self.model_id else "facebook/musicgen-medium"

            # Check if local path exists or if download is needed
            if self.model_path and not Path(self.model_path).exists():
                raise ModelNotInstalledError(self.model_id)

            logger.info(f"Loading MusicGen from {repo_or_path} onto {self.device}")
            self.processor = AutoProcessor.from_pretrained(repo_or_path)
            self.model = MusicgenForConditionalGeneration.from_pretrained(
                repo_or_path,
                torch_dtype=torch.float32 if self.device == "cpu" else torch.float16
            )
            self.model.to(self.device)
            self._is_loaded = True
            return True

        except (ImportError, Exception) as e:
            logger.warning(f"MusicGen failed to load directly: {e}")
            if isinstance(e, ModelNotInstalledError):
                raise e
            raise ModelNotInstalledError(self.model_id)

    def unload(self) -> bool:
        try:
            import torch
            import gc
            self.model = None
            self.processor = None
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
            sr = 32000  # MusicGen native sample rate

            inputs = self.processor(
                text=[request.prompt],
                padding=True,
                return_tensors="pt",
            ).to(self.device)

            # Max new tokens based on duration (MusicGen produces ~50 tokens/sec)
            max_tokens = int(request.duration * 50)
            max_tokens = max(50, min(max_tokens, 1500))

            base_seed = request.seed if request.seed >= 0 else int(time.time() * 1000) % 1_000_000_000

            for idx in range(request.num_variations):
                current_seed = base_seed + idx
                torch.manual_seed(current_seed)

                audio_values = self.model.generate(
                    **inputs,
                    max_new_tokens=max_tokens,
                    guidance_scale=request.guidance_scale,
                    temperature=request.temperature,
                    do_sample=True
                )

                # audio_values shape: (batch, channels, samples) -> (1, 1, samples)
                audio_np = audio_values[0].detach().cpu().numpy()
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
            logger.error(f"MusicGen generation failed: {e}", exc_info=True)
            raise GenerationFailedError(str(e))
