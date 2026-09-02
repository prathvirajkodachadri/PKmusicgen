"""
Round-trip tests: MIDI -> Python -> MIDI
"""

import os
import subprocess
import sys
import tempfile

import mido
import pytest

from midi2python.converter import convert_midi_to_python
from midi2python.parser import parse_midi_file


def create_midi_file(**kwargs):
    """Helper to create MIDI file with various options."""
    ticks_per_beat = kwargs.get("ticks_per_beat", 480)
    mid_type = kwargs.get("type", 1)
    mid = mido.MidiFile(ticks_per_beat=ticks_per_beat, type=mid_type)
    return mid


def compare_midi_files(original_path, recreated_path):
    """Compare two MIDI files for key attributes."""
    orig = mido.MidiFile(original_path)
    rec = mido.MidiFile(recreated_path)

    assert orig.ticks_per_beat == rec.ticks_per_beat, "Ticks per beat mismatch"
    assert orig.type == rec.type, "MIDI type mismatch"
    assert len(orig.tracks) == len(rec.tracks), "Track count mismatch"

    for i, (otrack, rtrack) in enumerate(zip(orig.tracks, rec.tracks)):
        assert len(otrack) == len(rtrack), f"Track {i} message count mismatch"

        for j, (omsg, rmsg) in enumerate(zip(otrack, rtrack)):
            assert omsg.type == rmsg.type, f"Track {i} message {j} type mismatch: {omsg.type} vs {rmsg.type}"
            assert omsg.time == rmsg.time, f"Track {i} message {j} time mismatch"

            # Compare important attributes
            if hasattr(omsg, "note"):
                assert omsg.note == rmsg.note, f"Note mismatch at track {i} msg {j}"
            if hasattr(omsg, "velocity"):
                assert omsg.velocity == rmsg.velocity
            if hasattr(omsg, "channel"):
                assert omsg.channel == rmsg.channel
            if hasattr(omsg, "program"):
                assert omsg.program == rmsg.program
            if hasattr(omsg, "control"):
                assert omsg.control == rmsg.control
                assert omsg.value == rmsg.value
            if omsg.type == "set_tempo":
                assert omsg.tempo == rmsg.tempo


def run_generated_python(py_path, cwd=None):
    """Run generated Python file and return exit code."""
    result = subprocess.run(
        [sys.executable, py_path],
        cwd=cwd or os.path.dirname(py_path),
        capture_output=True,
        text=True,
        timeout=10,
    )
    return result


def test_roundtrip_single_note_exact():
    mid = mido.MidiFile(ticks_per_beat=480, type=1)
    track = mido.MidiTrack()
    track.append(mido.Message("program_change", program=0, channel=0, time=0))
    track.append(mido.Message("note_on", note=60, velocity=64, channel=0, time=0))
    track.append(mido.Message("note_off", note=60, velocity=64, channel=0, time=480))
    mid.tracks.append(track)

    with tempfile.TemporaryDirectory() as tmpdir:
        midi_path = os.path.join(tmpdir, "test.mid")
        py_path = os.path.join(tmpdir, "test.py")
        mid.save(midi_path)

        # Convert
        convert_midi_to_python(midi_path, py_path, mode="exact")

        # Run generated Python
        result = run_generated_python(py_path, cwd=tmpdir)
        assert result.returncode == 0, f"Generated Python failed: {result.stderr}"

        # Check recreated MIDI exists
        recreated_path = os.path.join(tmpdir, "test_recreated.mid")
        assert os.path.exists(recreated_path), "Recreated MIDI not found"

        # Compare
        compare_midi_files(midi_path, recreated_path)


def test_roundtrip_multiple_notes_exact():
    mid = mido.MidiFile(ticks_per_beat=480)
    track = mido.MidiTrack()
    for note in [60, 62, 64, 65, 67]:
        track.append(mido.Message("note_on", note=note, velocity=64, channel=0, time=0))
        track.append(mido.Message("note_off", note=note, velocity=64, channel=0, time=240))
    mid.tracks.append(track)

    with tempfile.TemporaryDirectory() as tmpdir:
        midi_path = os.path.join(tmpdir, "multi.mid")
        py_path = os.path.join(tmpdir, "multi.py")
        mid.save(midi_path)

        convert_midi_to_python(midi_path, py_path, mode="exact")
        result = run_generated_python(py_path, cwd=tmpdir)
        assert result.returncode == 0

        recreated_path = os.path.join(tmpdir, "multi_recreated.mid")
        compare_midi_files(midi_path, recreated_path)


def test_roundtrip_multiple_tracks_exact():
    mid = mido.MidiFile(ticks_per_beat=480, type=1)
    for i in range(3):
        track = mido.MidiTrack()
        track.append(mido.Message("program_change", program=i * 10, channel=i, time=0))
        track.append(mido.Message("note_on", note=60 + i, velocity=64, channel=i, time=0))
        track.append(mido.Message("note_off", note=60 + i, velocity=64, channel=i, time=480))
        mid.tracks.append(track)

    with tempfile.TemporaryDirectory() as tmpdir:
        midi_path = os.path.join(tmpdir, "tracks.mid")
        py_path = os.path.join(tmpdir, "tracks.py")
        mid.save(midi_path)

        convert_midi_to_python(midi_path, py_path, mode="exact")
        result = run_generated_python(py_path, cwd=tmpdir)
        assert result.returncode == 0

        recreated_path = os.path.join(tmpdir, "tracks_recreated.mid")
        compare_midi_files(midi_path, recreated_path)


def test_roundtrip_multiple_channels_exact():
    mid = mido.MidiFile(ticks_per_beat=480)
    track = mido.MidiTrack()
    for ch in range(4):
        track.append(mido.Message("note_on", note=60 + ch, velocity=64, channel=ch, time=0))
        track.append(mido.Message("note_off", note=60 + ch, velocity=64, channel=ch, time=120))
    mid.tracks.append(track)

    with tempfile.TemporaryDirectory() as tmpdir:
        midi_path = os.path.join(tmpdir, "channels.mid")
        py_path = os.path.join(tmpdir, "channels.py")
        mid.save(midi_path)

        convert_midi_to_python(midi_path, py_path, mode="exact")
        result = run_generated_python(py_path, cwd=tmpdir)
        assert result.returncode == 0

        recreated_path = os.path.join(tmpdir, "channels_recreated.mid")
        compare_midi_files(midi_path, recreated_path)


def test_roundtrip_tempo_changes_exact():
    mid = mido.MidiFile(ticks_per_beat=480)
    track = mido.MidiTrack()
    track.append(mido.MetaMessage("set_tempo", tempo=500000, time=0))
    track.append(mido.Message("note_on", note=60, velocity=64, time=0))
    track.append(mido.Message("note_off", note=60, velocity=64, time=480))
    track.append(mido.MetaMessage("set_tempo", tempo=600000, time=0))
    track.append(mido.Message("note_on", note=62, velocity=64, time=0))
    track.append(mido.Message("note_off", note=62, velocity=64, time=480))
    mid.tracks.append(track)

    with tempfile.TemporaryDirectory() as tmpdir:
        midi_path = os.path.join(tmpdir, "tempo.mid")
        py_path = os.path.join(tmpdir, "tempo.py")
        mid.save(midi_path)

        convert_midi_to_python(midi_path, py_path, mode="exact")
        result = run_generated_python(py_path, cwd=tmpdir)
        assert result.returncode == 0

        recreated_path = os.path.join(tmpdir, "tempo_recreated.mid")
        compare_midi_files(midi_path, recreated_path)


def test_roundtrip_control_changes_exact():
    mid = mido.MidiFile()
    track = mido.MidiTrack()
    track.append(mido.Message("control_change", control=7, value=100, channel=0, time=0))
    track.append(mido.Message("control_change", control=10, value=64, channel=0, time=0))
    track.append(mido.Message("note_on", note=60, velocity=64, channel=0, time=0))
    track.append(mido.Message("note_off", note=60, velocity=64, channel=0, time=480))
    track.append(mido.Message("pitchwheel", pitch=2000, channel=0, time=0))
    mid.tracks.append(track)

    with tempfile.TemporaryDirectory() as tmpdir:
        midi_path = os.path.join(tmpdir, "cc.mid")
        py_path = os.path.join(tmpdir, "cc.py")
        mid.save(midi_path)

        convert_midi_to_python(midi_path, py_path, mode="exact")
        result = run_generated_python(py_path, cwd=tmpdir)
        assert result.returncode == 0

        recreated_path = os.path.join(tmpdir, "cc_recreated.mid")
        compare_midi_files(midi_path, recreated_path)


def test_roundtrip_readable_mode():
    mid = mido.MidiFile(ticks_per_beat=480)
    track = mido.MidiTrack()
    track.append(mido.MetaMessage("track_name", name="Melody", time=0))
    track.append(mido.Message("program_change", program=0, channel=0, time=0))
    track.append(mido.Message("note_on", note=60, velocity=64, channel=0, time=0))
    track.append(mido.Message("note_off", note=60, velocity=64, channel=0, time=480))
    track.append(mido.Message("note_on", note=64, velocity=64, channel=0, time=0))
    track.append(mido.Message("note_off", note=64, velocity=64, channel=0, time=480))
    mid.tracks.append(track)

    with tempfile.TemporaryDirectory() as tmpdir:
        midi_path = os.path.join(tmpdir, "readable.mid")
        py_path = os.path.join(tmpdir, "readable.py")
        mid.save(midi_path)

        convert_midi_to_python(midi_path, py_path, mode="readable")
        result = run_generated_python(py_path, cwd=tmpdir)
        assert result.returncode == 0, f"Readable mode failed: {result.stderr}"

        recreated_path = os.path.join(tmpdir, "readable_recreated.mid")
        assert os.path.exists(recreated_path)
        # For readable mode, we still check basic properties
        orig = mido.MidiFile(midi_path)
        rec = mido.MidiFile(recreated_path)
        assert orig.ticks_per_beat == rec.ticks_per_beat
        assert len(orig.tracks) == len(rec.tracks)


def test_roundtrip_drums():
    mid = mido.MidiFile()
    track = mido.MidiTrack()
    track.append(mido.Message("note_on", note=36, velocity=100, channel=9, time=0))
    track.append(mido.Message("note_off", note=36, velocity=0, channel=9, time=240))
    track.append(mido.Message("note_on", note=38, velocity=100, channel=9, time=0))
    track.append(mido.Message("note_off", note=38, velocity=0, channel=9, time=240))
    track.append(mido.Message("note_on", note=42, velocity=80, channel=9, time=0))
    track.append(mido.Message("note_off", note=42, velocity=0, channel=9, time=240))
    mid.tracks.append(track)

    with tempfile.TemporaryDirectory() as tmpdir:
        midi_path = os.path.join(tmpdir, "drums.mid")
        py_path = os.path.join(tmpdir, "drums.py")
        mid.save(midi_path)

        convert_midi_to_python(midi_path, py_path, mode="exact")
        result = run_generated_python(py_path, cwd=tmpdir)
        assert result.returncode == 0

        recreated_path = os.path.join(tmpdir, "drums_recreated.mid")
        compare_midi_files(midi_path, recreated_path)


def test_roundtrip_empty_midi():
    mid = mido.MidiFile(ticks_per_beat=480)
    track = mido.MidiTrack()
    track.append(mido.MetaMessage("end_of_track", time=0))
    mid.tracks.append(track)

    with tempfile.TemporaryDirectory() as tmpdir:
        midi_path = os.path.join(tmpdir, "empty.mid")
        py_path = os.path.join(tmpdir, "empty.py")
        mid.save(midi_path)

        convert_midi_to_python(midi_path, py_path, mode="exact")
        result = run_generated_python(py_path, cwd=tmpdir)
        assert result.returncode == 0

        recreated_path = os.path.join(tmpdir, "empty_recreated.mid")
        assert os.path.exists(recreated_path)
