"""
Base model abstraction for audio generation models
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, Any, List, Optional, Union
import numpy as np


@dataclass
class GenerationRequest:
    prompt: str
    negative_prompt: Optional[str] = None
    duration: float = 10.0
    seed: int = -1
    num_variations: int = 1
    guidance_scale: float = 7.0
    temperature: float = 1.0
    sample_rate: int = 44100
    model_id: str = "procedural-dsp"
    audio_conditioning: Optional[Any] = None
    category: Optional[str] = None
    bpm: Optional[int] = None
    key: Optional[str] = None
    genre: Optional[str] = None
    mood: Optional[str] = None
    texture: Optional[str] = None
    instrumentation: Optional[List[str]] = None


@dataclass
class GenerationResult:
    audio_data: np.ndarray  # shape (channels, samples) or (samples,)
    sample_rate: int
    duration: float
    seed: int
    generation_time: float
    metadata: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ModelMetadata:
    id: str
    name: str
    description: str
    huggingface_repo: Optional[str] = None
    license: str = "MIT"
    license_url: Optional[str] = None
    commercial_use: str = "yes"  # "yes", "yes_under_1M", "no"
    commercial_note: Optional[str] = None
    vram_gb: float = 0.0
    vram_note: Optional[str] = None
    cpu_support: bool = True
    text_to_audio: bool = True
    audio_conditioning: bool = False
    max_duration: float = 60.0
    sample_rate: int = 44100
    recommended_gpu: Optional[str] = None
    size_gb: float = 0.0
    type: str = "general"
    installed: bool = False
    local_path: Optional[str] = None


class AudioGenerationModel(ABC):
    """Abstract base class for all audio generation models"""

    def __init__(self, model_id: str, model_path: Optional[str] = None, device: str = "cpu"):
        self.model_id = model_id
        self.model_path = model_path
        self.device = device
        self._is_loaded = False

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    @abstractmethod
    def load(self) -> bool:
        """Load model weights and pipeline into memory/device"""
        pass

    @abstractmethod
    def unload(self) -> bool:
        """Unload model from memory and clear GPU cache if applicable"""
        pass

    @abstractmethod
    def generate(self, request: GenerationRequest) -> List[GenerationResult]:
        """Generate audio from request. Returns a list of GenerationResult (one per variation)"""
        pass

    def get_model_info(self) -> Dict[str, Any]:
        """Return runtime status of this model instance"""
        return {
            "model_id": self.model_id,
            "model_path": self.model_path,
            "device": self.device,
            "is_loaded": self._is_loaded
        }
