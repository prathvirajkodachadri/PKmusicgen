"""
MIDI file parser - converts MIDI files into structured data.
"""

from __future__ import annotations

import os
from typing import Dict, List, Tuple

import mido

from .models import MidiFileData, NoteEvent, ParsedMessage, TrackData
from .utils import sanitize_filename


class MidiParseError(Exception):
    """Raised when MIDI parsing fails."""

    pass


def parse_midi_file(file_path: str) -> MidiFileData:
    """
    Parse a MIDI file into structured data.

    Args:
        file_path: Path to MIDI file (.mid or .midi)

    Returns:
        MidiFileData with all tracks and messages parsed

    Raises:
        MidiParseError: If file cannot be parsed
        FileNotFoundError: If file doesn't exist
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Input file does not exist: {file_path}")

    # Basic extension check but allow any file mido can parse
    _, ext = os.path.splitext(file_path)
    ext = ext.lower()
    if ext not in (".mid", ".midi", ".mids", ""):
        # Still try to parse, but warn via exception if fails
        pass

    try:
        mid = mido.MidiFile(file_path)
    except Exception as e:
        raise MidiParseError(f"Unsupported or corrupt MIDI file: {file_path} - {e}") from e

    # Prepare data structure
    midi_data = MidiFileData(
        path=file_path,
        ticks_per_beat=mid.ticks_per_beat,
        type=mid.type,
    )

    total_ticks = 0

    for track_idx, track in enumerate(mid.tracks):
        track_data = TrackData(index=track_idx)
        abs_tick = 0
        active_notes: Dict[Tuple[int, int], Tuple[int, int]] = {}  # (channel, note) -> (start_tick, velocity)
        channels_set = set()
        program_numbers = []

        # For track name detection
        track_name = ""

        for msg in track:
            abs_tick += msg.time
            # Track total ticks for file
            if abs_tick > total_ticks:
                total_ticks = abs_tick

            # Parse message data
            is_meta = msg.is_meta if hasattr(msg, "is_meta") else msg.type in (
                "set_tempo",
                "time_signature",
                "key_signature",
                "track_name",
                "lyrics",
                "marker",
                "cue_point",
                "instrument_name",
                "end_of_track",
            )

            data: Dict = {}
            channel = None

            # Extract attributes safely
            try:
                msg_dict = msg.dict()
            except Exception:
                # Fallback to manual extraction
                msg_dict = {}

            # Common handling
            if hasattr(msg, "channel"):
                channel = getattr(msg, "channel")
                if channel is not None:
                    channels_set.add(channel)

            # Store all attributes except type and time for reconstruction
            for key, value in msg_dict.items():
                if key in ("type", "time"):
                    continue
                data[key] = value

            # Special handling for meta messages
            if msg.type == "track_name":
                track_name = data.get("name", "") or getattr(msg, "name", "")
                track_data.name = track_name
            elif msg.type == "instrument_name":
                track_data.instrument_name = data.get("name", "") or getattr(msg, "name", "")
            elif msg.type == "program_change":
                prog = data.get("program", getattr(msg, "program", 0))
                program_numbers.append(prog)
                if channel == 9 or channel == 10:  # drums (0-indexed 9 is channel 10)
                    track_data.is_drum = True
            elif msg.type == "set_tempo":
                tempo = data.get("tempo", getattr(msg, "tempo", 500000))
                midi_data.tempo_changes.append((abs_tick, tempo))
            elif msg.type == "time_signature":
                numerator = data.get("numerator", 4)
                denominator = data.get("denominator", 4)
                clocks = data.get("clocks_per_click", 24)
                notated = data.get("notated_32nd_notes_per_beat", 8)
                midi_data.time_signatures.append(
                    (abs_tick, (numerator, denominator, clocks, notated))
                )
            elif msg.type == "key_signature":
                key = data.get("key", getattr(msg, "key", "C"))
                midi_data.key_signatures.append((abs_tick, key))

            # Handle note events for readable analysis
            if msg.type == "note_on":
                note = data.get("note", getattr(msg, "note", 0))
                velocity = data.get("velocity", getattr(msg, "velocity", 0))
                ch = channel if channel is not None else 0
                key = (ch, note)
                if velocity > 0:
                    # Note start
                    active_notes[key] = (abs_tick, velocity)
                else:
                    # Note on with velocity 0 = note off
                    if key in active_notes:
                        start_tick, start_vel = active_notes.pop(key)
                        duration = abs_tick - start_tick
                        if duration >= 0:
                            note_event = NoteEvent(
                                note=note,
                                channel=ch,
                                start_tick=start_tick,
                                duration_ticks=duration,
                                velocity=start_vel,
                                track_index=track_idx,
                            )
                            track_data.notes.append(note_event)
            elif msg.type == "note_off":
                note = data.get("note", getattr(msg, "note", 0))
                ch = channel if channel is not None else 0
                key = (ch, note)
                if key in active_notes:
                    start_tick, start_vel = active_notes.pop(key)
                    duration = abs_tick - start_tick
                    if duration >= 0:
                        note_event = NoteEvent(
                            note=note,
                            channel=ch,
                            start_tick=start_tick,
                            duration_ticks=duration,
                            velocity=start_vel,
                            track_index=track_idx,
                        )
                        track_data.notes.append(note_event)

            # Store parsed message with absolute tick
            parsed_msg = ParsedMessage(
                type=msg.type,
                is_meta=is_meta,
                time=msg.time,
                abs_tick=abs_tick,
                data=data,
                channel=channel,
            )
            track_data.messages.append(parsed_msg)

        # Handle any lingering active notes (no note_off found)
        for (ch, note), (start_tick, velocity) in active_notes.items():
            duration = abs_tick - start_tick
            if duration > 0:
                note_event = NoteEvent(
                    note=note,
                    channel=ch,
                    start_tick=start_tick,
                    duration_ticks=duration,
                    velocity=velocity,
                    track_index=track_idx,
                )
                track_data.notes.append(note_event)

        track_data.channels = sorted(channels_set)
        track_data.program_numbers = program_numbers

        # If no name, generate one
        if not track_data.name:
            if track_data.is_drum:
                track_data.name = f"Drums {track_idx}"
            elif program_numbers:
                from .utils import get_program_name

                track_data.name = get_program_name(program_numbers[0])
            else:
                track_data.name = f"Track {track_idx}"

        # Sort notes by start tick for consistency
        track_data.notes.sort(key=lambda n: (n.start_tick, n.note))

        midi_data.tracks.append(track_data)

    midi_data.total_ticks = total_ticks

    # Sort global events by tick
    midi_data.tempo_changes.sort(key=lambda x: x[0])
    midi_data.time_signatures.sort(key=lambda x: x[0])
    midi_data.key_signatures.sort(key=lambda x: x[0])

    return midi_data


def get_midi_info_summary(midi_data: MidiFileData) -> Dict:
    """Get summary info for CLI display."""
    info = {
        "tracks": midi_data.track_count,
        "ticks_per_beat": midi_data.ticks_per_beat,
        "type": midi_data.type,
        "total_ticks": midi_data.total_ticks,
        "tempo_bpm": midi_data.first_tempo_bpm,
        "time_signature": midi_data.first_time_signature,
        "key_signature": midi_data.first_key_signature,
    }
    return info
