"""
Film BGM Mode - converts scene description + emotion + genre into optimized prompts
"""
from typing import Dict, List, Optional
from .prompt_builder import PromptBuilder

class FilmBGMGenerator:
    """Generates BGM prompts for film composers"""
    
    EMOTION_MAP = {
        "tension and supernatural fear": "dark tense horror supernatural, dissonant strings, low drone, unsettling texture, slow evolving, minor key",
        "tension": "tense, suspenseful, low strings, subtle percussion, building intensity",
        "fear": "fearful, dark, sub bass, dissonant, unsettling, horror ambience",
        "sadness": "sad, melancholic, slow piano, emotional strings, minor key, soft",
        "joy": "joyful, uplifting, major key, bright, energetic, happy",
        "love": "romantic, emotional, warm strings, soft piano, tender",
        "anger": "aggressive, heavy, distorted, intense, driving percussion",
        "mystery": "mysterious, enigmatic, subtle textures, sparse instrumentation, ethereal",
        "epic": "epic, heroic, powerful orchestral, brass, choir, dramatic percussion",
        "peaceful": "peaceful, calm, serene, soft pads, gentle, ambient",
        "horror": "horror, terrifying, dark drone, metallic resonance, sub bass rumble, tense atmosphere",
        "suspense": "suspenseful, anticipating, low pulse, ticking, building tension"
    }
    
    GENRE_MAP = {
        "modern cinematic horror": "modern cinematic horror, hybrid orchestral, sound design, dark hybrid trailer",
        "cinematic": "cinematic orchestral, film score, professional",
        "trailer": "trailer epic, massive percussion, braams, risers, hits",
        "folk": "folk acoustic, organic, traditional-inspired, dry recording",
        "electronic": "electronic, synth, modern, sound design",
        "ambient": "ambient, atmospheric, texture, drone, evolving",
        "classical": "classical orchestral, strings, woodwinds, timeless"
    }
    
    def __init__(self):
        self.builder = PromptBuilder()
    
    def build_prompt(
        self,
        scene_description: str,
        emotion: str,
        genre: str = "cinematic",
        duration: float = 20,
        bpm: Optional[int] = None,
        key: Optional[str] = None,
        intensity: str = "medium",
        instrumentation: Optional[List[str]] = None,
        reference_mood: Optional[str] = None,
        extra: Optional[str] = None
    ) -> str:
        """Convert film BGM inputs into optimized generation prompt"""
        
        parts = []
        
        # Scene -> descriptive (keep core but enhance)
        if scene_description:
            # Truncate if too long
            scene = scene_description.strip()
            if len(scene) > 200:
                scene = scene[:200]
            parts.append(f"Scene: {scene}")
        
        # Emotion mapping
        emotion_lower = emotion.lower() if emotion else ""
        emotion_prompt = self.EMOTION_MAP.get(emotion_lower)
        if not emotion_prompt:
            # Try partial match
            for k, v in self.EMOTION_MAP.items():
                if k in emotion_lower or emotion_lower in k:
                    emotion_prompt = v
                    break
            if not emotion_prompt:
                emotion_prompt = emotion  # use raw
        
        parts.append(emotion_prompt)
        
        # Genre
        genre_lower = genre.lower() if genre else "cinematic"
        genre_prompt = self.GENRE_MAP.get(genre_lower, genre)
        parts.append(genre_prompt)
        
        # Intensity
        intensity_map = {
            "low": "subtle, soft, minimal, low intensity",
            "medium": "moderate intensity, balanced",
            "high": "high intensity, powerful, driving",
            "very high": "extremely intense, massive, overwhelming"
        }
        parts.append(intensity_map.get(intensity.lower(), intensity))
        
        # Instrumentation
        if instrumentation:
            parts.append(", ".join(instrumentation))
        
        # BPM
        if bpm:
            parts.append(f"{bpm} BPM")
            if bpm < 70:
                parts.append("slow tempo")
            elif bpm > 130:
                parts.append("fast tempo")
        
        # Key
        if key:
            parts.append(f"in {key}")
        
        # Reference mood
        if reference_mood:
            parts.append(f"mood like {reference_mood}")
        
        # Extra
        if extra:
            parts.append(extra)
        
        # Duration and quality
        parts.append(f"{duration} seconds")
        parts.append("film score, professional mix, high quality, no vocals")
        
        # Join
        prompt = ", ".join([p for p in parts if p])
        
        return prompt
    
    def generate_variations(self, base_prompt: str, count: int = 3) -> List[str]:
        """Generate several variations of BGM prompt for batch generation"""
        variations = []
        
        # Variation strategies
        strategies = [
            base_prompt,
            base_prompt + ", darker, more tension",
            base_prompt + ", more atmospheric, spacious reverb",
            base_prompt + ", more percussive, driving rhythm",
            base_prompt + ", minimal, subtle, less is more",
            base_prompt + ", epic, larger, more orchestral",
        ]
        
        for i in range(min(count, len(strategies))):
            variations.append(strategies[i])
        
        # If need more, duplicate with slight changes
        while len(variations) < count:
            variations.append(f"{base_prompt}, variation {len(variations)+1}")
        
        return variations[:count]

def build_film_bgm_prompt(**kwargs) -> str:
    gen = FilmBGMGenerator()
    return gen.build_prompt(**kwargs)
