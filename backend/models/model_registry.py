"""
Model Registry - loads model specifications, metadata, and licensing info
"""
import json
import logging
from pathlib import Path
from typing import Dict, List, Optional
from dataclasses import asdict

from .base_model import ModelMetadata

logger = logging.getLogger("pkmusicgen.models.registry")

_registry_instance: Optional["ModelRegistry"] = None


class ModelRegistry:
    """Manages available model descriptors loaded from presets/model_registry.json"""

    def __init__(self, registry_file: Optional[Path] = None, models_dir: Optional[Path] = None):
        if registry_file is None:
            # Look in presets directory relative to project root
            base_dir = Path(__file__).parent.parent.parent
            registry_file = base_dir / "presets" / "model_registry.json"

        self.registry_file = Path(registry_file)
        self.models_dir = Path(models_dir) if models_dir else Path(__file__).parent.parent.parent / "models"
        self._models: Dict[str, ModelMetadata] = {}
        self.load_registry()

    def load_registry(self) -> None:
        """Load metadata for all models from JSON definition file"""
        self._models.clear()
        if not self.registry_file.exists():
            logger.warning(f"Registry file not found: {self.registry_file}, creating default entries")
            self._add_default_models()
            return

        try:
            with open(self.registry_file, "r", encoding="utf-8") as f:
                data = json.load(f)

            for item in data:
                meta = ModelMetadata(
                    id=item.get("id"),
                    name=item.get("name", item.get("id")),
                    description=item.get("description", ""),
                    huggingface_repo=item.get("huggingface_repo"),
                    license=item.get("license", "MIT"),
                    license_url=item.get("license_url"),
                    commercial_use=item.get("commercial_use", "yes"),
                    commercial_note=item.get("commercial_note"),
                    vram_gb=float(item.get("vram_gb", 0)),
                    vram_note=item.get("vram_note"),
                    cpu_support=bool(item.get("cpu_support", True)),
                    text_to_audio=bool(item.get("text_to_audio", True)),
                    audio_conditioning=bool(item.get("audio_conditioning", False)),
                    max_duration=float(item.get("max_duration", 60)),
                    sample_rate=int(item.get("sample_rate", 44100)),
                    recommended_gpu=item.get("recommended_gpu"),
                    size_gb=float(item.get("size_gb", 0)),
                    type=item.get("type", "general"),
                    installed=bool(item.get("installed", False)),
                    local_path=item.get("local_path")
                )
                self._models[meta.id] = meta

            # Ensure procedural-dsp is always available and marked installed
            if "procedural-dsp" in self._models:
                self._models["procedural-dsp"].installed = True

        except Exception as e:
            logger.error(f"Failed to load registry from {self.registry_file}: {e}", exc_info=True)
            self._add_default_models()

    def _add_default_models(self) -> None:
        """Add fallback default models if JSON file fails to load"""
        procedural = ModelMetadata(
            id="procedural-dsp",
            name="Procedural DSP (Built-in Fallback)",
            description="Pure DSP synthesis fallback that always works offline, no download needed.",
            license="MIT",
            commercial_use="yes",
            commercial_note="Fully commercial safe, no restrictions",
            vram_gb=0,
            cpu_support=True,
            text_to_audio=True,
            max_duration=60,
            sample_rate=44100,
            type="fallback",
            installed=True
        )
        self._models[procedural.id] = procedural

    def list_models(self) -> List[ModelMetadata]:
        """Return list of all registered models"""
        return list(self._models.values())

    def get(self, model_id: str) -> Optional[ModelMetadata]:
        """Get model metadata by ID"""
        return self._models.get(model_id)

    def list_commercial(self) -> List[ModelMetadata]:
        """Return models permitted for commercial use"""
        return [m for m in self._models.values() if m.commercial_use in ("yes", "yes_under_1M")]

    def to_dict_list(self) -> List[Dict]:
        """Convert all models to dictionary format for JSON API"""
        return [asdict(m) for m in self._models.values()]


def get_registry(models_dir: Optional[Path] = None) -> ModelRegistry:
    """Get or create singleton ModelRegistry instance"""
    global _registry_instance
    if _registry_instance is None or models_dir is not None:
        _registry_instance = ModelRegistry(models_dir=models_dir)
    return _registry_instance
