#!/usr/bin/env python3
"""
MIDI-to-Python Converter - Main entry point.

This script converts MIDI files into executable Python scripts using Mido.

Usage:
    python midi_to_python.py input.mid
    python midi_to_python.py input.mid -o output.py --mode readable
"""

from midi2python.cli import main

if __name__ == "__main__":
    raise SystemExit(main())
