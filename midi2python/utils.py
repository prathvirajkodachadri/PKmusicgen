"""
Utility functions for MIDI-to-Python conversion.
"""

from __future__ import annotations

import re
import os
from typing import Dict, List, Optional, Tuple

# MIDI note names
NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
# General MIDI program names (first 16 for example, full list for readability)
GM_PROGRAM_NAMES = [
    "Acoustic Grand Piano",
    "Bright Acoustic Piano",
    "Electric Grand Piano",
    "Honky-tonk Piano",
    "Electric Piano 1",
    "Electric Piano 2",
    "Harpsichord",
    "Clavinet",
    "Celesta",
    "Glockenspiel",
    "Music Box",
    "Vibraphone",
    "Marimba",
    "Xylophone",
    "Tubular Bells",
    "Dulcimer",
    "Drawbar Organ",
    "Percussive Organ",
    "Rock Organ",
    "Church Organ",
    "Reed Organ",
    "Accordion",
    "Harmonica",
    "Tango Accordion",
    "Acoustic Guitar (nylon)",
    "Acoustic Guitar (steel)",
    "Electric Guitar (jazz)",
    "Electric Guitar (clean)",
    "Electric Guitar (muted)",
    "Overdriven Guitar",
    "Distortion Guitar",
    "Guitar harmonics",
    "Acoustic Bass",
    "Electric Bass (finger)",
    "Electric Bass (pick)",
    "Fretless Bass",
    "Slap Bass 1",
    "Slap Bass 2",
    "Synth Bass 1",
    "Synth Bass 2",
    "Violin",
    "Viola",
    "Cello",
    "Contrabass",
    "Tremolo Strings",
    "Pizzicato Strings",
    "Orchestral Harp",
    "Timpani",
    "String Ensemble 1",
    "String Ensemble 2",
    "SynthStrings 1",
    "SynthStrings 2",
    "Choir Aahs",
    "Voice Oohs",
    "Synth Voice",
    "Orchestra Hit",
    "Trumpet",
    "Trombone",
    "Tuba",
    "Muted Trumpet",
    "French Horn",
    "Brass Section",
    "SynthBrass 1",
    "SynthBrass 2",
    "Soprano Sax",
    "Alto Sax",
    "Tenor Sax",
    "Baritone Sax",
    "Oboe",
    "English Horn",
    "Bassoon",
    "Clarinet",
    "Piccolo",
    "Flute",
    "Recorder",
    "Pan Flute",
    "Blown Bottle",
    "Shakuhachi",
    "Whistle",
    "Ocarina",
    "Lead 1 (square)",
    "Lead 2 (sawtooth)",
    "Lead 3 (calliope)",
    "Lead 4 (chiff)",
    "Lead 5 (charang)",
    "Lead 6 (voice)",
    "Lead 7 (fifths)",
    "Lead 8 (bass + lead)",
    "Pad 1 (new age)",
    "Pad 2 (warm)",
    "Pad 3 (polysynth)",
    "Pad 4 (choir)",
    "Pad 5 (bowed)",
    "Pad 6 (metallic)",
    "Pad 7 (halo)",
    "Pad 8 (sweep)",
    "FX 1 (rain)",
    "FX 2 (soundtrack)",
    "FX 3 (crystal)",
    "FX 4 (atmosphere)",
    "FX 5 (brightness)",
    "FX 6 (goblins)",
    "FX 7 (echoes)",
    "FX 8 (sci-fi)",
    "Sitar",
    "Banjo",
    "Shamisen",
    "Koto",
    "Kalimba",
    "Bag pipe",
    "Fiddle",
    "Shanai",
    "Tinkle Bell",
    "Agogo",
    "Steel Drums",
    "Woodblock",
    "Taiko Drum",
    "Melodic Tom",
    "Synth Drum",
    "Reverse Cymbal",
    "Guitar Fret Noise",
    "Breath Noise",
    "Seashore",
    "Bird Tweet",
    "Telephone Ring",
    "Helicopter",
    "Applause",
    "Gunshot",
]


def midi_note_to_name(note_number: int) -> str:
    """Convert MIDI note number to note name like C4, F#3."""
    if not 0 <= note_number <= 127:
        return f"Note{note_number}"
    octave = (note_number // 12) - 1
    name = NOTE_NAMES[note_number % 12]
    return f"{name}{octave}"


def note_name_to_midi(note_name: str) -> int:
    """Convert note name like C4 to MIDI number. Supports sharps."""
    # Regex for note name
    m = re.match(r"^([A-Ga-g])(#?)(-?\d+)$", note_name.strip())
    if not m:
        raise ValueError(f"Invalid note name: {note_name}")
    letter = m.group(1).upper()
    sharp = m.group(2)
    octave = int(m.group(3))

    base = {"C": 0, "D": 2, "E": 4, "F": 5, "G": 7, "A": 9, "B": 11}[letter]
    if sharp:
        base += 1
    midi = (octave + 1) * 12 + base
    if not 0 <= midi <= 127:
        raise ValueError(f"Note out of MIDI range: {note_name} -> {midi}")
    return midi


def sanitize_identifier(name: str, fallback: str = "track") -> str:
    """Sanitize string to be a valid Python identifier."""
    if not name:
        return fallback
    # Replace invalid chars with underscore
    sanitized = re.sub(r"[^0-9a-zA-Z_]", "_", name)
    # Ensure doesn't start with digit
    if sanitized and sanitized[0].isdigit():
        sanitized = "_" + sanitized
    # Remove consecutive underscores and strip
    sanitized = re.sub(r"_+", "_", sanitized).strip("_")
    if not sanitized:
        return fallback
    # Avoid Python keywords
    import keyword

    if keyword.iskeyword(sanitized):
        sanitized = sanitized + "_"
    return sanitized.lower()


def sanitize_filename(filename: str) -> str:
    """Sanitize filename to prevent path traversal and invalid chars."""
    # Remove directory components
    filename = os.path.basename(filename)
    # Replace dangerous characters
    filename = re.sub(r'[<>:"/\\|?*\x00-\x1f]', "_", filename)
    # Prevent empty or dot files
    if not filename or filename in (".", ".."):
        return "output.mid"
    # Limit length
    if len(filename) > 255:
        name, ext = os.path.splitext(filename)
        filename = name[: 255 - len(ext)] + ext
    return filename


def ticks_to_beats(ticks: int, ticks_per_beat: int) -> float:
    """Convert ticks to beats."""
    if ticks_per_beat == 0:
        return 0.0
    return ticks / ticks_per_beat


def beats_to_ticks(beats: float, ticks_per_beat: int) -> int:
    """Convert beats to ticks."""
    return int(round(beats * ticks_per_beat))


def tempo_to_bpm(tempo: int) -> float:
    """Convert tempo (microseconds per beat) to BPM."""
    if tempo == 0:
        return 0.0
    return 60_000_000 / tempo


def bpm_to_tempo(bpm: float) -> int:
    """Convert BPM to tempo (microseconds per beat)."""
    if bpm <= 0:
        return 500000  # default 120 BPM
    return int(round(60_000_000 / bpm))


def get_program_name(program: int) -> str:
    """Get General MIDI program name."""
    if 0 <= program < len(GM_PROGRAM_NAMES):
        return GM_PROGRAM_NAMES[program]
    return f"Program {program}"


def group_notes_by_start_time(notes) -> Dict[int, List]:
    """Group notes by their start tick."""
    from collections import defaultdict

    grouped: Dict[int, List] = defaultdict(list)
    for note in notes:
        grouped[note.start_tick].append(note)
    return dict(grouped)


def detect_chords(notes, time_tolerance: int = 10) -> List[Tuple[int, List]]:
    """
    Detect chords as groups of notes starting at nearly the same time.

    Returns list of (start_tick, notes_list) where len(notes_list) > 1.
    """
    grouped = group_notes_by_start_time(notes)
    chords = []
    for tick, nlist in sorted(grouped.items()):
        if len(nlist) > 1:
            chords.append((tick, nlist))
    return chords


def estimate_measures(total_ticks: int, ticks_per_beat: int, beats_per_measure: int = 4) -> int:
    """Estimate number of measures/bars."""
    if ticks_per_beat == 0 or beats_per_measure == 0:
        return 0
    ticks_per_measure = ticks_per_beat * beats_per_measure
    return (total_ticks + ticks_per_measure - 1) // ticks_per_measure
