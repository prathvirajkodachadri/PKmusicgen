"""
Generation module
"""
from .prompt_builder import PromptBuilder, build_prompt
from .variation import apply_variation, generate_variations
from .film_bgm import FilmBGMGenerator
from .horror_mode import HorrorSoundDesigner
from .song_assistant import AISongAssistant

__all__ = [
    "PromptBuilder",
    "build_prompt",
    "apply_variation",
    "generate_variations",
    "FilmBGMGenerator",
    "HorrorSoundDesigner",
    "AISongAssistant"
]
