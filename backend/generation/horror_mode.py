"""
Horror Sound Design Mode - presets for horror drones, ambiences, etc.
"""

from typing import Dict, List, Optional

class HorrorSoundDesigner:
    """Constructs optimized horror prompts from structured descriptors"""
    
    MOODS = {
        "terrifying": "extremely terrifying, dread, overwhelming fear, horror",
        "creepy": "creepy, unsettling, eerie, uncanny",
        "tense": "tense, suspenseful, anxious, anticipating",
        "dark": "dark, black, abyssal, void",
        "mysterious": "mysterious, unknown, enigmatic",
        "aggressive": "aggressive, hostile, attacking",
        "sad": "sad horror, melancholic dread, sorrowful"
    }
    
    TEXTURES = {
        "metallic": "metallic resonance, metal scrape, iron, steel texture",
        "organic": "organic, flesh-like, breathing, visceral",
        "distorted": "distorted, saturated, crushed, broken",
        "granular": "granular, glitchy, fragmented",
        "smooth": "smooth, continuous, even",
        "whisper": "whisper-like, breathy, vocal texture, indistinct voices",
        "noisy": "noisy, harsh, static"
    }
    
    MOVEMENTS = {
        "slowly evolving": "slowly evolving, gradual change, morphing, long development",
        "pulsing": "pulsing, rhythmic, heartbeat-like, repetitive",
        "static": "static, unchanging, drone, held",
        "random": "random, unpredictable, chaotic, irregular",
        "rising": "rising, building, increasing intensity, riser",
        "falling": "falling, descending, downer, decreasing"
    }
    
    FREQUENCIES = {
        "deep": "deep, sub bass, low frequency, rumble, 30Hz, subwoofer",
        "mid": "mid frequency, present, focused",
        "high": "high frequency, shrill, piercing, upper range",
        "wide": "wide frequency, full spectrum, broadband"
    }
    
    PRESETS = {
        "horror_drone": {
            "name": "Horror Drone",
            "description": "Deep sustained horror drone",
            "mood": "terrifying",
            "texture": "metallic",
            "movement": "slowly evolving",
            "frequency": "deep",
            "extra": "sub bass, dark ambience, tense atmosphere, no melody"
        },
        "dark_ambience": {
            "name": "Dark Ambience",
            "description": "Dark atmospheric horror ambience",
            "mood": "dark",
            "texture": "organic",
            "movement": "slowly evolving",
            "frequency": "wide",
            "extra": "atmospheric, spacious, reverb, distant, unsettling"
        },
        "sub_bass_rumble": {
            "name": "Sub-Bass Rumble",
            "description": "Low frequency sub-bass tension",
            "mood": "tense",
            "texture": "smooth",
            "movement": "static",
            "frequency": "deep",
            "extra": "subwoofer, low end, rumble, vibration, infrasound"
        },
        "metallic_scrape": {
            "name": "Metallic Scrape",
            "description": "Harsh metallic scraping texture",
            "mood": "aggressive",
            "texture": "metallic",
            "movement": "random",
            "frequency": "mid",
            "extra": "scrape, screech, metal on metal, harsh"
        },
        "reverse_impact": {
            "name": "Reverse Impact",
            "description": "Reverse cinematic impact",
            "mood": "tense",
            "texture": "distorted",
            "movement": "rising",
            "frequency": "wide",
            "extra": "reverse, sucking, build to hit, cinematic"
        },
        "whisper_texture": {
            "name": "Whisper-like Texture",
            "description": "Breathy whisper horror texture",
            "mood": "creepy",
            "texture": "whisper",
            "movement": "random",
            "frequency": "mid",
            "extra": "whispering, indistinct voices, breath, close"
        },
        "sudden_impact": {
            "name": "Sudden Impact",
            "description": "Jump scare sudden hit",
            "mood": "terrifying",
            "texture": "distorted",
            "movement": "static",
            "frequency": "wide",
            "extra": "sudden, jump scare, massive hit, short, stinger"
        },
        "suspense_pulse": {
            "name": "Suspense Pulse",
            "description": "Tension pulse for suspense",
            "mood": "tense",
            "texture": "smooth",
            "movement": "pulsing",
            "frequency": "deep",
            "extra": "pulse, heartbeat, ticking, clock, rhythmic tension"
        },
        "low_freq_tension": {
            "name": "Low-Frequency Tension",
            "description": "Deep low tension bed",
            "mood": "tense",
            "texture": "smooth",
            "movement": "slowly evolving",
            "frequency": "deep",
            "extra": "low frequency tension, sub, minimal, pressure"
        },
        "distorted_cinematic": {
            "name": "Distorted Cinematic Texture",
            "description": "Heavily distorted cinematic horror",
            "mood": "aggressive",
            "texture": "distorted",
            "movement": "slowly evolving",
            "frequency": "wide",
            "extra": "distorted, cinematic, hybrid, trailer horror, heavy"
        }
    }
    
    def build_prompt(
        self,
        mood: str = "terrifying",
        texture: str = "metallic",
        movement: str = "slowly evolving",
        frequency: str = "deep",
        duration: float = 8,
        extra: str = None,
        preset: str = None
    ) -> str:
        """Build horror prompt from descriptors"""
        
        if preset and preset in self.PRESETS:
            p = self.PRESETS[preset]
            mood = p.get("mood", mood)
            texture = p.get("texture", texture)
            movement = p.get("movement", movement)
            frequency = p.get("frequency", frequency)
            extra = p.get("extra", extra) if not extra else extra + ", " + p.get("extra", "")
        
        parts = []
        
        # Mood
        mood_prompt = self.MOODS.get(mood.lower(), mood)
        parts.append(mood_prompt)
        
        # Texture
        texture_prompt = self.TEXTURES.get(texture.lower(), texture)
        parts.append(texture_prompt)
        
        # Movement
        movement_prompt = self.MOVEMENTS.get(movement.lower(), movement)
        parts.append(movement_prompt)
        
        # Frequency
        freq_prompt = self.FREQUENCIES.get(frequency.lower(), frequency)
        parts.append(freq_prompt)
        
        # Extra
        if extra:
            parts.append(extra)
        
        # Duration + quality
        parts.append(f"{duration} seconds")
        parts.append("horror sound design, cinematic, professional, high quality, no vocals, no melody, sound effect")
        
        return ", ".join(parts)
    
    def list_presets(self) -> List[Dict]:
        return [{"id": k, **v} for k, v in self.PRESETS.items()]

def build_horror_prompt(**kwargs) -> str:
    designer = HorrorSoundDesigner()
    return designer.build_prompt(**kwargs)
