"""
Tests for MIDI parser.
"""

import os
import tempfile

import mido
import pytest

from midi2python.parser import MidiParseError, parse_midi_file


def create_simple_midi(ticks_per_beat=480, type=1):
    """Helper to create a simple MIDI file in memory."""
    mid = mido.MidiFile(ticks_per_beat=ticks_per_beat, type=type)
    track = mido.MidiTrack()
    track.append(mido.MetaMessage("track_name", name="Test Track", time=0))
    track.append(mido.Message("program_change", program=0, channel=0, time=0))
    track.append(mido.Message("note_on", note=60, velocity=64, channel=0, time=0))
    track.append(mido.Message("note_off", note=60, velocity=64, channel=0, time=480))
    track.append(mido.MetaMessage("end_of_track", time=0))
    mid.tracks.append(track)
    return mid


def test_parse_simple_midi():
    mid = create_simple_midi()
    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        assert data.ticks_per_beat == 480
        assert data.track_count == 1
        assert len(data.tracks[0].notes) == 1
        assert data.tracks[0].notes[0].note == 60
    finally:
        os.unlink(temp_path)


def test_parse_empty_midi():
    mid = mido.MidiFile(ticks_per_beat=480, type=1)
    track = mido.MidiTrack()
    track.append(mido.MetaMessage("end_of_track", time=0))
    mid.tracks.append(track)

    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        assert data.track_count == 1
        assert len(data.tracks[0].notes) == 0
    finally:
        os.unlink(temp_path)


def test_parse_multiple_tracks():
    mid = mido.MidiFile(ticks_per_beat=480, type=1)
    for i in range(3):
        track = mido.MidiTrack()
        track.append(mido.MetaMessage("track_name", name=f"Track {i}", time=0))
        track.append(mido.Message("note_on", note=60 + i, velocity=64, channel=i, time=0))
        track.append(mido.Message("note_off", note=60 + i, velocity=64, channel=i, time=480))
        mid.tracks.append(track)

    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        assert data.track_count == 3
        assert data.tracks[0].name == "Track 0"
        assert data.tracks[1].name == "Track 1"
    finally:
        os.unlink(temp_path)


def test_parse_multiple_channels():
    mid = mido.MidiFile(ticks_per_beat=480)
    track = mido.MidiTrack()
    for ch in range(4):
        track.append(mido.Message("note_on", note=60 + ch, velocity=64, channel=ch, time=0))
        track.append(mido.Message("note_off", note=60 + ch, velocity=64, channel=ch, time=120))
    mid.tracks.append(track)

    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        assert len(data.tracks[0].channels) == 4
        assert set(data.tracks[0].channels) == {0, 1, 2, 3}
    finally:
        os.unlink(temp_path)


def test_parse_tempo_changes():
    mid = mido.MidiFile(ticks_per_beat=480)
    track = mido.MidiTrack()
    track.append(mido.MetaMessage("set_tempo", tempo=500000, time=0))
    track.append(mido.Message("note_on", note=60, velocity=64, time=0))
    track.append(mido.Message("note_off", note=60, velocity=64, time=480))
    track.append(mido.MetaMessage("set_tempo", tempo=600000, time=0))
    mid.tracks.append(track)

    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        assert len(data.tempo_changes) == 2
        assert data.tempo_changes[0][1] == 500000
        assert data.tempo_changes[1][1] == 600000
        assert data.first_tempo_bpm == pytest.approx(120.0)
    finally:
        os.unlink(temp_path)


def test_parse_program_changes():
    mid = mido.MidiFile()
    track = mido.MidiTrack()
    track.append(mido.Message("program_change", program=0, channel=0, time=0))
    track.append(mido.Message("program_change", program=40, channel=1, time=0))
    mid.tracks.append(track)

    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        assert 0 in data.tracks[0].program_numbers
        assert 40 in data.tracks[0].program_numbers
    finally:
        os.unlink(temp_path)


def test_parse_control_changes():
    mid = mido.MidiFile()
    track = mido.MidiTrack()
    track.append(mido.Message("control_change", control=7, value=100, channel=0, time=0))
    track.append(mido.Message("control_change", control=10, value=64, channel=0, time=0))
    mid.tracks.append(track)

    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        cc_messages = [m for m in data.tracks[0].messages if m.type == "control_change"]
        assert len(cc_messages) == 2
    finally:
        os.unlink(temp_path)


def test_parse_nonexistent_file():
    with pytest.raises(FileNotFoundError):
        parse_midi_file("/nonexistent/path/file.mid")


def test_parse_invalid_file():
    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False, mode="w") as f:
        f.write("not a midi file")
        temp_path = f.name

    try:
        with pytest.raises(MidiParseError):
            parse_midi_file(temp_path)
    finally:
        os.unlink(temp_path)


def test_parse_type0_midi():
    mid = mido.MidiFile(ticks_per_beat=480, type=0)
    track = mido.MidiTrack()
    track.append(mido.Message("note_on", note=60, velocity=64, time=0))
    track.append(mido.Message("note_off", note=60, velocity=64, time=480))
    mid.tracks.append(track)

    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        assert data.type == 0
    finally:
        os.unlink(temp_path)


def test_parse_drums():
    mid = mido.MidiFile()
    track = mido.MidiTrack()
    # Channel 9 is drums (10th channel)
    track.append(mido.Message("note_on", note=38, velocity=100, channel=9, time=0))
    track.append(mido.Message("note_off", note=38, velocity=0, channel=9, time=240))
    track.append(mido.Message("note_on", note=42, velocity=80, channel=9, time=0))
    track.append(mido.Message("note_off", note=42, velocity=0, channel=9, time=240))
    mid.tracks.append(track)

    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        assert 9 in data.tracks[0].channels
        assert len(data.tracks[0].notes) == 2
    finally:
        os.unlink(temp_path)


def test_parse_time_signature_and_key():
    mid = mido.MidiFile()
    track = mido.MidiTrack()
    track.append(mido.MetaMessage("time_signature", numerator=3, denominator=4, time=0))
    track.append(mido.MetaMessage("key_signature", key="G", time=0))
    mid.tracks.append(track)

    with tempfile.NamedTemporaryFile(suffix=".mid", delete=False) as f:
        mid.save(f.name)
        temp_path = f.name

    try:
        data = parse_midi_file(temp_path)
        assert len(data.time_signatures) == 1
        assert data.time_signatures[0][1][0] == 3
        assert len(data.key_signatures) == 1
        assert data.key_signatures[0][1] == "G"
    finally:
        os.unlink(temp_path)
