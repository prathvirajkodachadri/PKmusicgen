"""
Professional prompt builder - constructs optimized prompts from structured fields
"""
from typing import Dict, List, Optional
import json
from pathlib import Path

class PromptBuilder:
    """Builds prompts from genre, mood, texture, instrumentation etc"""
    
    GENRES = ["cinematic", "horror", "folk", "electronic", "ambient", "experimental", "trailer", "classical", "drum", "bass", "synth"]
    MOODS = ["dark", "emotional", "mysterious", "tense", "epic", "sad", "peaceful", "aggressive", "terrifying", "suspenseful", "ethereal"]
    TEXTURES = ["organic", "metallic", "analog", "acoustic", "distorted", "atmospheric", "dry", "wet", "granular", "smooth"]
    INSTRUMENTS = ["strings", "piano", "bass", "percussion", "synth", "guitar", "flute", "drone", "brass", "choir", "pads", "plucks"]
    TEMPOS = ["slow", "medium", "fast", "very slow", "very fast"]
    KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B", "Cm", "Dm", "Em", "Am"]
    
    def __init__(self):
        self.presets_dir = Path(__file__).parent.parent.parent / "presets"
    
    def build(
        self,
        genre: Optional[str] = None,
        mood: Optional[str] = None,
        texture: Optional[str] = None,
        instrumentation: Optional[List[str]] = None,
        tempo: Optional[str] = None,
        key: Optional[str] = None,
        bpm: Optional[int] = None,
        duration: Optional[float] = None,
        extra_descriptors: Optional[List[str]] = None,
        custom_prompt: Optional[str] = None,
        scene_description: Optional[str] = None,
        emotion: Optional[str] = None,
        intensity: Optional[str] = None
    ) -> str:
        """
        Build final prompt from structured fields.
        If custom_prompt provided, returns it (advanced mode).
        """
        if custom_prompt and custom_prompt.strip():
            # Still enhance with duration if provided
            prompt = custom_prompt.strip()
            if duration and "second" not in prompt.lower():
                prompt += f", {duration} seconds"
            return prompt
        
        parts = []
        
        if genre:
            # Map genre to descriptive
            genre_map = {
                "cinematic": "modern cinematic",
                "horror": "dark horror cinematic",
                "folk": "folk acoustic organic",
                "electronic": "electronic synth",
                "ambient": "ambient atmospheric",
                "experimental": "experimental abstract",
                "trailer": "epic trailer cinematic",
                "classical": "classical orchestral",
                "drum": "percussive drum",
                "bass": "deep bass",
                "synth": "synthesizer electronic"
            }
            parts.append(genre_map.get(genre.lower(), genre))
        
        if mood:
            parts.append(f"{mood} mood")
        
        if texture:
            parts.append(f"{texture} texture")
        
        if instrumentation:
            if isinstance(instrumentation, str):
                instrumentation = [instrumentation]
            for inst in instrumentation:
                parts.append(inst)
        
        if tempo:
            parts.append(f"{tempo} tempo")
        
        if bpm:
            parts.append(f"{bpm} BPM")
        
        if key:
            parts.append(f"in {key}")
        
        if scene_description:
            parts.append(scene_description)
        
        if emotion:
            parts.append(f"{emotion} emotion")
        
        if intensity:
            parts.append(f"{intensity} intensity")
        
        if extra_descriptors:
            parts.extend(extra_descriptors)
        
        # Add quality boosters
        quality_terms = ["high quality", "professional", "detailed"]
        # Only add if not too long
        if len(parts) < 8:
            parts.extend(quality_terms[:1])
        
        if duration:
            parts.append(f"{duration} seconds")
        
        # Construct final
        prompt = ", ".join(parts)
        
        # Clean up
        prompt = prompt.replace("  ", " ").strip()
        if not prompt.endswith("."):
            # No period needed, but ensure not empty
            pass
        
        return prompt
    
    def build_from_preset(self, preset_name: str, category: str = None) -> str:
        """Load preset JSON and build prompt"""
        try:
            # Try category subfolder
            if category:
                preset_path = self.presets_dir / category / f"{preset_name}.json"
                if not preset_path.exists():
                    preset_path = self.presets_dir / f"{preset_name}.json"
            else:
                preset_path = self.presets_dir / f"{preset_name}.json"
            
            if not preset_path.exists():
                # Try all presets
                for p in self.presets_dir.rglob(f"{preset_name}.json"):
                    preset_path = p
                    break
            
            if preset_path.exists():
                with open(preset_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                # If it's a list of presets, find matching
                if isinstance(data, list):
                    for item in data:
                        if item.get('id') == preset_name or item.get('name', '').lower() == preset_name.lower():
                            return item.get('prompt', '')
                    # Return first prompt if not found
                    return data[0].get('prompt', '') if data else preset_name
                elif isinstance(data, dict):
                    return data.get('prompt', data.get('description', preset_name))
            
            return preset_name
        except Exception:
            return preset_name
    
    def get_available_presets(self) -> Dict[str, List[str]]:
        """List all preset files"""
        result = {}
        if not self.presets_dir.exists():
            return result
        
        for json_file in self.presets_dir.glob("*.json"):
            category = json_file.stem
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                if isinstance(data, list):
                    result[category] = [item.get('id', item.get('name', f'preset_{i}')) for i, item in enumerate(data)]
                else:
                    result[category] = [category]
            except Exception:
                result[category] = []
        
        return result

def build_prompt(
    genre: str = None,
    mood: str = None,
    texture: str = None,
    instrumentation: List[str] = None,
    custom_prompt: str = None,
    **kwargs
) -> str:
    builder = PromptBuilder()
    return builder.build(
        genre=genre,
        mood=mood,
        texture=texture,
        instrumentation=instrumentation,
        custom_prompt=custom_prompt,
        **kwargs
    )
