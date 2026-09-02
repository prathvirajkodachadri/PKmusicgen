"""
midi2python - Convert MIDI files into executable Python scripts.

A Python library and CLI tool that converts MIDI (.mid/.midi) files
into standalone Python scripts using the Mido library.
"""

__version__ = "0.1.0"
__author__ = "midi-to-python contributors"

from .converter import convert_midi_to_python
from .parser import parse_midi_file
from .models import MidiFileData, TrackData, NoteEvent, ParsedMessage

__all__ = [
    "__version__",
    "convert_midi_to_python",
    "parse_midi_file",
    "MidiFileData",
    "TrackData",
    "NoteEvent",
    "ParsedMessage",
]
