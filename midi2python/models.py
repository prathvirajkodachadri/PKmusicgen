"""
Data models for MIDI parsing and conversion.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any, Dict, List, Optional, Tuple


@dataclass
class NoteEvent:
    """Represents a musical note with timing information."""

    note: int
    channel: int
    start_tick: int
    duration_ticks: int
    velocity: int
    track_index: int
    end_tick: int = field(init=False)

    def __post_init__(self) -> None:
        self.end_tick = self.start_tick + self.duration_ticks

    @property
    def start_beats(self) -> float:
        """Start time in beats (relative to ticks_per_beat)."""
        return self.start_tick / 480.0  # default, overridden by context

    def duration_beats(self, ticks_per_beat: int) -> float:
        """Duration in beats."""
        return self.duration_ticks / ticks_per_beat if ticks_per_beat else 0

    def note_name(self) -> str:
        """Return note name like C4."""
        from .utils import midi_note_to_name

        return midi_note_to_name(self.note)


@dataclass
class ParsedMessage:
    """Represents a MIDI message with absolute and delta timing."""

    type: str
    is_meta: bool
    time: int  # delta time
    abs_tick: int  # absolute tick
    data: Dict[str, Any] = field(default_factory=dict)
    channel: Optional[int] = None

    def to_dict(self) -> Dict[str, Any]:
        """Return dict representation including type and data."""
        d = {"type": self.type, "time": self.time}
        d.update(self.data)
        if self.channel is not None and "channel" not in d:
            d["channel"] = self.channel
        return d


@dataclass
class TrackData:
    """Represents a parsed MIDI track."""

    index: int
    name: str = ""
    messages: List[ParsedMessage] = field(default_factory=list)
    notes: List[NoteEvent] = field(default_factory=list)
    instrument_name: str = ""
    program_numbers: List[int] = field(default_factory=list)
    channels: List[int] = field(default_factory=list)
    is_drum: bool = False

    @property
    def note_count(self) -> int:
        return len(self.notes)


@dataclass
class MidiFileData:
    """Represents a fully parsed MIDI file."""

    path: str
    ticks_per_beat: int
    type: int
    tracks: List[TrackData] = field(default_factory=list)
    tempo_changes: List[Tuple[int, int]] = field(default_factory=list)  # (abs_tick, tempo)
    time_signatures: List[Tuple[int, Tuple[int, int, int, int]]] = field(
        default_factory=list
    )  # (abs_tick, (numerator, denominator, clocks_per_click, notated_32nd))
    key_signatures: List[Tuple[int, str]] = field(default_factory=list)  # (abs_tick, key)
    total_ticks: int = 0

    @property
    def track_count(self) -> int:
        return len(self.tracks)

    @property
    def first_tempo_bpm(self) -> Optional[float]:
        """Return first tempo in BPM if available."""
        if not self.tempo_changes:
            return None
        # tempo is microseconds per beat
        tempo = self.tempo_changes[0][1]
        if tempo == 0:
            return None
        return 60_000_000 / tempo

    @property
    def first_time_signature(self) -> Optional[Tuple[int, int]]:
        """Return first time signature as (numerator, denominator)."""
        if not self.time_signatures:
            return None
        _, (num, den, _, _) = self.time_signatures[0]
        return (num, den)

    @property
    def first_key_signature(self) -> Optional[str]:
        if not self.key_signatures:
            return None
        return self.key_signatures[0][1]
