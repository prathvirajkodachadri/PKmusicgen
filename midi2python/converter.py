"""
Main converter logic - orchestrates parsing and code generation.
"""

from __future__ import annotations

import os
import sys
from typing import Optional

from .generator import generate_exact_code, generate_readable_code
from .parser import MidiParseError, parse_midi_file, get_midi_info_summary
from .utils import sanitize_filename


class ConversionError(Exception):
    """Raised when conversion fails."""

    pass


def convert_midi_to_python(
    input_path: str,
    output_path: Optional[str] = None,
    mode: str = "exact",
    include_comments: bool = True,
    encoding: str = "utf-8",
    stdout: bool = False,
) -> str:
    """
    Convert MIDI file to Python script.

    Args:
        input_path: Path to input MIDI file
        output_path: Path to output Python file (optional)
        mode: Conversion mode - "exact" or "readable"
        include_comments: Whether to include comments in generated code
        encoding: File encoding for output
        stdout: If True, return code instead of writing to file

    Returns:
        Generated Python code as string

    Raises:
        FileNotFoundError: If input file doesn't exist
        MidiParseError: If MIDI parsing fails
        ConversionError: If conversion fails
        IOError: If output file cannot be written
    """
    # Validate mode
    if mode not in ("exact", "readable"):
        raise ConversionError(f"Invalid mode: {mode}. Must be 'exact' or 'readable'")

    # Parse MIDI
    try:
        midi_data = parse_midi_file(input_path)
    except FileNotFoundError:
        raise
    except MidiParseError:
        raise
    except Exception as e:
        raise MidiParseError(f"Failed to parse MIDI file: {e}") from e

    # Determine output path
    if output_path is None and not stdout:
        base = os.path.splitext(os.path.basename(input_path))[0]
        # Sanitize base
        base = sanitize_filename(base)
        if not base.endswith(".py"):
            base = os.path.splitext(base)[0]  # remove any ext
        output_path = f"{base}.py"
        # If input_path has directory, place output in same dir? Use cwd for simplicity
        # Actually place in current directory or same as input? Use current directory
        # To be predictable, use input directory if possible
        input_dir = os.path.dirname(os.path.abspath(input_path))
        if input_dir and os.path.isdir(input_dir):
            output_path = os.path.join(os.getcwd(), f"{base}.py")
            # If input is in cwd, this is same; else use cwd anyway for simplicity
            # Let's use cwd to avoid confusion, but we can also use input dir if output_path is None?
            # We'll use input dir's base name in cwd for now, but also check if we want to preserve dir
            # Simpler: if input_path contains directory, output in same directory as input
            # Actually common tool behavior: output in current directory unless specified
            # We'll implement: if input has directory, output in that directory
            # For this function, if output_path is None, we create in same dir as input if input dir exists
            # Let's adjust: use directory of input_path
            output_path = os.path.join(
                os.path.dirname(input_path) if os.path.dirname(input_path) else ".",
                f"{base}.py",
            )

    # Generate code
    try:
        if mode == "exact":
            code = generate_exact_code(
                midi_data=midi_data,
                source_path=input_path,
                output_py_path=output_path or "output.py",
                include_comments=include_comments,
            )
        else:  # readable
            code = generate_readable_code(
                midi_data=midi_data,
                source_path=input_path,
                output_py_path=output_path or "output.py",
                include_comments=include_comments,
            )
    except Exception as e:
        raise ConversionError(f"Failed to generate Python code: {e}") from e

    # Validate generated code syntax
    try:
        compile(code, "<generated>", "exec")
    except SyntaxError as e:
        raise ConversionError(f"Generated code has syntax error: {e}") from e

    # Write to file if not stdout
    if not stdout:
        if output_path is None:
            raise ConversionError("Output path is required when stdout is False")
        try:
            # Ensure directory exists
            out_dir = os.path.dirname(os.path.abspath(output_path))
            if out_dir and not os.path.exists(out_dir):
                os.makedirs(out_dir, exist_ok=True)

            with open(output_path, "w", encoding=encoding, newline="\n") as f:
                f.write(code)
        except OSError as e:
            raise IOError(f"Unable to write output file: {output_path} - {e}") from e

    return code


def print_conversion_info(input_path: str, output_path: str, midi_data, mode: str) -> None:
    """Print conversion info for CLI display."""
    info = get_midi_info_summary(midi_data)

    print("MIDI-to-Python Converter")
    print("------------------------")
    print(f"Input: {input_path}")
    print(f"Tracks: {info['tracks']}")
    print(f"Ticks per beat: {info['ticks_per_beat']}")
    if info["tempo_bpm"]:
        print(f"Tempo: {info['tempo_bpm']:.2f} BPM")
    else:
        print("Tempo: Not specified (default 120 BPM)")
    if info["time_signature"]:
        ts = info["time_signature"]
        print(f"Time Signature: {ts[0]}/{ts[1]}")
    if info["key_signature"]:
        print(f"Key Signature: {info['key_signature']}")
    print(f"Mode: {mode}")
    print("")
    print(f"Generated: {output_path}")
