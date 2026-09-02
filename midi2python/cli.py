"""
Command-line interface for MIDI-to-Python converter.
"""

from __future__ import annotations

import argparse
import os
import sys
from typing import Optional

from . import __version__
from .converter import convert_midi_to_python, print_conversion_info
from .parser import MidiParseError, parse_midi_file


def create_parser() -> argparse.ArgumentParser:
    """Create argument parser for CLI."""
    parser = argparse.ArgumentParser(
        prog="midi_to_python",
        description="Convert MIDI files into executable Python scripts using Mido",
        epilog="Example: python midi_to_python.py song.mid -o song.py --mode readable",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )

    parser.add_argument(
        "input",
        nargs="?",
        help="Input MIDI file (.mid or .midi)",
    )

    parser.add_argument(
        "-o",
        "--output",
        dest="output",
        help="Output Python file (default: <input>.py)",
    )

    parser.add_argument(
        "--mode",
        choices=["exact", "readable"],
        default="exact",
        help="Conversion mode: exact (default) preserves MIDI data accurately, readable generates human-friendly musical structures",
    )

    parser.add_argument(
        "--encoding",
        default="utf-8",
        help="Output file encoding (default: utf-8)",
    )

    parser.add_argument(
        "--no-comments",
        action="store_true",
        help="Do not include comments in generated code",
    )

    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Write generated code to stdout instead of file",
    )

    parser.add_argument(
        "--version",
        action="version",
        version=f"%(prog)s {__version__}",
    )

    parser.add_argument(
        "--debug",
        action="store_true",
        help="Show full traceback on errors (for debugging)",
    )

    return parser


def main(argv: Optional[list] = None) -> int:
    """Main CLI entry point. Returns exit code."""
    parser = create_parser()
    args = parser.parse_args(argv)

    # Handle missing input
    if not args.input:
        parser.print_help()
        print("\nError: input file is required.", file=sys.stderr)
        return 2

    input_path = args.input
    output_path = args.output
    mode = args.mode
    encoding = args.encoding
    include_comments = not args.no_comments
    use_stdout = args.stdout
    debug = args.debug

    # Validate input file exists
    if not os.path.exists(input_path):
        print(f"Error: input file does not exist: {input_path}", file=sys.stderr)
        return 1

    # Validate encoding
    try:
        "".encode(encoding)
    except LookupError:
        print(f"Error: unsupported encoding: {encoding}", file=sys.stderr)
        return 1

    # If output not specified and not stdout, generate default
    if not output_path and not use_stdout:
        base = os.path.splitext(os.path.basename(input_path))[0]
        # Remove any path unsafe chars
        from .utils import sanitize_filename

        base = sanitize_filename(base)
        # Remove extension if present
        base = os.path.splitext(base)[0] or "output"
        output_path = f"{base}.py"
        # Place in same directory as input if input has directory
        input_dir = os.path.dirname(input_path)
        if input_dir:
            output_path = os.path.join(input_dir, f"{base}.py")

    # Check if input and output are same file
    if output_path and os.path.abspath(input_path) == os.path.abspath(output_path):
        print(f"Error: input and output files must be different", file=sys.stderr)
        return 1

    try:
        # For info display, parse file first (if not stdout, converter will parse again - optimize by parsing once)
        # But converter parses again; we can parse here for info and pass to print function
        # To avoid double parsing, we parse here and then generate
        midi_data = parse_midi_file(input_path)

        # Convert
        code = convert_midi_to_python(
            input_path=input_path,
            output_path=output_path,
            mode=mode,
            include_comments=include_comments,
            encoding=encoding,
            stdout=use_stdout,
        )

        if use_stdout:
            # Write to stdout
            sys.stdout.write(code)
            if not code.endswith("\n"):
                sys.stdout.write("\n")
        else:
            # Print info
            assert output_path is not None
            print_conversion_info(input_path, output_path, midi_data, mode)

        return 0

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        if debug:
            import traceback

            traceback.print_exc()
        return 1
    except MidiParseError as e:
        print(f"Error: unsupported MIDI file: {e}", file=sys.stderr)
        if debug:
            import traceback

            traceback.print_exc()
        return 1
    except IOError as e:
        print(f"Error: unable to write output file: {e}", file=sys.stderr)
        if debug:
            import traceback

            traceback.print_exc()
        return 1
    except Exception as e:
        # Generic error
        if debug:
            import traceback

            traceback.print_exc()
        else:
            print(f"Error: {e}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
