"""
ACE-Step 3.5B Model Wrapper (ACE-Step/ACE-Step-v1-3.5B)
Apache 2.0 commercial music generation foundation model
"""
import time
import logging
from pathlib import Path
from typing import List, Optional
import numpy as np

from .base_model import AudioGenerationModel, GenerationRequest, GenerationResult
from ..core.errors import ModelNotInstalledError, GenerationFailedError

logger = logging.getLogger("pkmusicgen.models.ace_step")


class ACEStepModel(AudioGenerationModel):
    """Wrapper for ACE-Step 3.5B Open Source Music Generation Model"""

    def __init__(self, model_id: str = "ace-step-3.5b", model_path: Optional[str] = None, device: str = "cpu"):
        super().__init__(model_id=model_id, model_path=model_path, device=device)
        self.model = None

    def load(self) -> bool:
        if self.model_path and not Path(self.model_path).exists():
            raise ModelNotInstalledError(self.model_id)

        try:
            repo_or_path = self.model_path if (self.model_path and Path(self.model_path).exists() and any(Path(self.model_path).iterdir())) else "ACE-Step/ACE-Step-v1-3.5B"
            logger.info(f"Checking ACE-Step from {repo_or_path}")

            # If model weights not downloaded locally
            if not self.model_path or not Path(self.model_path).exists():
                raise ModelNotInstalledError(self.model_id)

            self._is_loaded = True
            return True

        except Exception as e:
            if isinstance(e, ModelNotInstalledError):
                raise e
            logger.warning(f"ACE-Step failed to load: {e}")
            raise ModelNotInstalledError(self.model_id)

    def unload(self) -> bool:
        self.model = None
        self._is_loaded = False
        return True

    def generate(self, request: GenerationRequest) -> List[GenerationResult]:
        if not self._is_loaded:
            self.load()

        try:
            # Placeholder for ACE-Step weights inference
            sr = 44100
            start_time = time.time()
            results = []
            base_seed = request.seed if request.seed >= 0 else int(time.time() * 1000) % 1_000_000_000

            for idx in range(request.num_variations):
                current_seed = base_seed + idx
                samples = int(request.duration * sr)
                t = np.linspace(0, request.duration, samples, endpoint=False)
                audio_np = np.vstack([np.sin(2 * np.pi * 440 * t) * 0.5, np.sin(2 * np.pi * 440 * t) * 0.5])
                gen_time = max(0.01, (time.time() - start_time) / (idx + 1))

                results.append(GenerationResult(
                    audio_data=audio_np,
                    sample_rate=sr,
                    duration=request.duration,
                    seed=current_seed,
                    generation_time=gen_time,
                    metadata={"model": self.model_id, "prompt": request.prompt}
                ))

            return results
        except Exception as e:
            raise GenerationFailedError(str(e))
