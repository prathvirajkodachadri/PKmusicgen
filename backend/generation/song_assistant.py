"""
AI Song Structure and Lyric Generator
Generates full musical structure, chord progressions, tempos, keys, and lyrics.
"""
import random
from typing import Dict, Any, List, Optional


class AISongAssistant:
    """Intelligent musical song architecture and lyric assistant"""

    KEYS = ["C Major", "A Minor", "G Major", "E Minor", "D Major", "B Minor", "F Major", "D Minor", "E-flat Major", "C Minor"]

    GENRE_INFO = {
        "lofi": {
            "bpm": [72, 78, 84, 88],
            "chords": "Am9 - Dm9 - G13 - Cmaj7",
            "vibe": "Chill, nostalgic, vinyl warmth, mellow electric piano",
            "rhyme_scheme": "AABB",
            "themes": ["rainy day memories", "midnight city lights", "late night coffee thoughts", "drifting into dreams"]
        },
        "synthwave": {
            "bpm": [116, 120, 124, 128],
            "chords": "Am - F - C - G (or Dm - Bb - F - C)",
            "vibe": "Neon horizons, retro 80s analog arpeggios, gated reverb drums",
            "rhyme_scheme": "AABB",
            "themes": ["cybernetic highways", "neon reflections in the rain", "chasing midnight in Tokyo", "digital nostalgia"]
        },
        "cinematic": {
            "bpm": [65, 80, 95, 110],
            "chords": "Dm - Bb - Gm - A (Minor epic progression)",
            "vibe": "Epic orchestral strings, low brass braams, dramatic taiko hits",
            "rhyme_scheme": "ABCB",
            "themes": ["the rise of champions", "echoes of forgotten kingdoms", "standing at the edge of destiny", "the quiet before the storm"]
        },
        "edm": {
            "bpm": [126, 128, 130, 132],
            "chords": "F - G - Am - Em",
            "vibe": "Punchy 4-on-the-floor kick, euphoric supersaw leads, massive buildup",
            "rhyme_scheme": "AABB",
            "themes": ["electric festival energy", "dancing under laser lights", "unstoppable momentum", "higher frequency connection"]
        },
        "rock": {
            "bpm": [120, 135, 145, 160],
            "chords": "E5 - G5 - A5 - C5",
            "vibe": "Overdriven guitars, punchy acoustic drums, driving bassline",
            "rhyme_scheme": "ABAB",
            "themes": ["breaking free from the ordinary", "fire in the dark", "riding through the storm", "unbreakable spirit"]
        },
        "horror": {
            "bpm": [50, 60, 70],
            "chords": "D#dim - Dm - C#dim - Dm (Dissonant minor clusters)",
            "vibe": "Terrifying sub bass, metallic scrapes, discordant whispers",
            "rhyme_scheme": "ABCB",
            "themes": ["shadows in the corridor", "the midnight whisper", "cold breath in the dark", "forgotten asylum echoes"]
        },
        "folk": {
            "bpm": [90, 105, 120],
            "chords": "G - D - Em - C (or traditional raga Drone C - G)",
            "vibe": "Organic acoustic percussion, acoustic plucks, natural earthy resonance",
            "rhyme_scheme": "AABB",
            "themes": ["monsoon over the hills", "earth and river celebrations", "festive village rhythms", "harvest sunrise"]
        }
    }

    RANDOM_PROMPTS = [
        {"prompt": "Lofi hip hop chill beat, warm electric piano chords, soft vinyl crackle, laidback boom bap groove, 80 bpm", "category": "lofi", "genre": "lofi", "mood": "peaceful", "bpm": 80, "key": "A Minor"},
        {"prompt": "80s retro synthwave, driving analog bassline, punchy gated reverb drums, neon synth lead, 122 bpm", "category": "synthwave", "genre": "synthwave", "mood": "epic", "bpm": 122, "key": "D Minor"},
        {"prompt": "Massive cinematic trailer cue, deep brass braams, low orchestral strings, building percussion, tension impact, 90 bpm", "category": "cinematic", "genre": "cinematic", "mood": "tense", "bpm": 90, "key": "D Minor"},
        {"prompt": "Dark horror ambience, deep sub bass drone, metallic resonance, eerie whisper textures, slow evolving suspense", "category": "horror", "genre": "horror", "mood": "terrifying", "bpm": 60, "key": "C Minor"},
        {"prompt": "Energetic South Indian folk percussion ensemble, powerful Tamate frame drums, crisp Chende hits, festive rhythm, 128 bpm", "category": "folk", "genre": "folk", "mood": "aggressive", "bpm": 128, "key": "G Major"},
        {"prompt": "Lush emotional piano and cello duet, melancholic melody, gentle dynamics, beautiful cinematic film score", "category": "classical", "genre": "classical", "mood": "sad", "bpm": 70, "key": "E Minor"},
        {"prompt": "High energy cyberpunk electronic groove, industrial distorted bass, driving 4 on the floor beat, glitch textures, 130 bpm", "category": "electronic", "genre": "electronic", "mood": "aggressive", "bpm": 130, "key": "F Minor"},
        {"prompt": "Deep soothing ambient meditation soundscape, Tibetan singing bowl overtone, warm ethereal pads, zero beats, deep sleep", "category": "ambient", "genre": "ambient", "mood": "peaceful", "bpm": 55, "key": "C Major"},
        {"prompt": "808 trap beat, rolling sub bass, snappy rimshot snare, fast hi-hat rolls, dark melodic synth pluck, 140 bpm", "category": "trap", "genre": "electronic", "mood": "dark", "bpm": 140, "key": "C Minor"}
    ]

    def get_random_prompt(self) -> Dict[str, Any]:
        """Return a curated creative prompt template"""
        return random.choice(self.RANDOM_PROMPTS)

    def generate_song_plan(self, prompt: str, genre: Optional[str] = None, mood: Optional[str] = None) -> Dict[str, Any]:
        """Generate full song arrangement and lyrics"""
        genre_key = "lofi"
        if genre and genre.lower() in self.GENRE_INFO:
            genre_key = genre.lower()
        else:
            for g in self.GENRE_INFO:
                if g in prompt.lower():
                    genre_key = g
                    break

        info = self.GENRE_INFO.get(genre_key, self.GENRE_INFO["lofi"])
        bpm = random.choice(info["bpm"])
        key = random.choice(self.KEYS)
        theme = random.choice(info["themes"])

        title_words = [w.capitalize() for w in prompt.split()[:4] if len(w) > 3]
        title = " ".join(title_words) if title_words else f"{genre_key.capitalize()} AI Symphony"

        # Construct Lyrics & Structure
        structure = [
            {
                "section": "Intro",
                "bars": 8,
                "description": f"Sparse instrumentation, introducing the {key} chord harmony ({info['chords']}) with subtle atmosphere.",
                "lyrics": "(Instrumental atmosphere building...)"
            },
            {
                "section": "Verse 1",
                "bars": 16,
                "description": "Bass and main groove enter. Warm melodic storytelling.",
                "lyrics": f"Drifting through the quiet light,\nEchoes in the velvet night.\nEvery heartbeat finds the line,\nTracing steps through endless time."
            },
            {
                "section": "Pre-Chorus",
                "bars": 8,
                "description": "Rising filter modulation, snare rolls, building dynamic anticipation.",
                "lyrics": f"Can you feel the currents rise?\nSparks across the open skies."
            },
            {
                "section": "Chorus",
                "bars": 16,
                "description": "Full dynamic drop, main vocal hook and lead synthesizer / orchestra.",
                "lyrics": f"We are the rhythm in the glow,\nFlowing where the rivers go.\nBright as the fire, deep as the sound,\nWalking on sacred ground."
            },
            {
                "section": "Verse 2",
                "bars": 16,
                "description": "Secondary harmonic movement, rhythmic variations and counter-melodies.",
                "lyrics": f"Shadows dance upon the wall,\nHearing every distant call.\nNeon ribbons in the breeze,\nWhispering ancient melodies."
            },
            {
                "section": "Bridge",
                "bars": 8,
                "description": "Emotional pivot, stripped back beat with expressive solo chords.",
                "lyrics": f"Hold the moment, let it stay,\nBefore the dawn takes it away."
            },
            {
                "section": "Final Chorus",
                "bars": 16,
                "description": "Climactic energy with maximum production layers.",
                "lyrics": f"We are the rhythm in the glow,\nFlowing where the rivers go!\nBright as the fire, deep as the sound,\nWalking on sacred ground!"
            },
            {
                "section": "Outro",
                "bars": 8,
                "description": "Gradual reverb tail fade out with lingering harmonic echo.",
                "lyrics": "(Soft fading echo into silence...)"
            }
        ]

        return {
            "title": title,
            "prompt": prompt,
            "genre": genre_key,
            "bpm": bpm,
            "key": key,
            "chords": info["chords"],
            "vibe": info["vibe"],
            "theme": theme,
            "structure": structure,
            "suggested_generation_prompt": f"{genre_key} music track, {info['vibe']}, key {key}, {bpm} bpm, {theme}"
        }
