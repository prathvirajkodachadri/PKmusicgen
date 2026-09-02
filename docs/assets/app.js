// midi-to-python — in-browser converter
// Runs the real MIDI → Python conversion pipeline inside the browser using Pyodide + mido.
// No file is uploaded; everything is processed locally.

const PYODIDE_VERSION = "v0.26.4";
const PYODIDE_INDEX = `https://cdn.jsdelivr.net/pyodide/${PYODIDE_VERSION}/full/`;

const els = {
  status: document.getElementById("status"),
  dropzone: document.getElementById("dropzone"),
  fileInput: document.getElementById("file-input"),
  fileMeta: document.getElementById("file-meta"),
  metaName: document.getElementById("meta-name"),
  metaSize: document.getElementById("meta-size"),
  metaTracks: document.getElementById("meta-tracks"),
  metaTpb: document.getElementById("meta-tpb"),
  metaTempo: document.getElementById("meta-tempo"),
  mode: document.getElementById("mode"),
  comments: document.getElementById("comments"),
  convertBtn: document.getElementById("convert-btn"),
  copyBtn: document.getElementById("copy-btn"),
  downloadBtn: document.getElementById("download-btn"),
  output: document.getElementById("output"),
  outputCode: document.getElementById("output-code"),
  lineCount: document.getElementById("line-count"),
  alert: document.getElementById("alert"),
};

const state = {
  pyodide: null,
  busy: false,
  currentFile: null,
  currentBytes: null, // Uint8Array of MIDI
  currentName: null,
  currentCode: null,
};

function setStatus(text, kind = "") {
  els.status.textContent = text;
  els.status.className = "status" + (kind ? " " + kind : "");
}

function showAlert(text, kind = "") {
  els.alert.hidden = false;
  els.alert.textContent = text;
  els.alert.className = "alert" + (kind ? " " + kind : "");
}

function clearAlert() {
  els.alert.hidden = true;
  els.alert.textContent = "";
  els.alert.className = "alert";
}

function humanSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(2) + " MB";
}

function escapeHtml(s) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// ---------- Pyodide bootstrap ----------

async function loadPyodideAndMido() {
  setStatus("Loading Python runtime…");
  const script = document.createElement("script");
  script.src = PYODIDE_INDEX + "pyodide.js";
  script.onload = async () => {
    try {
      const pyodide = await window.loadPyodide({ indexURL: PYODIDE_INDEX });
      state.pyodide = pyodide;
      setStatus("Installing mido…", "busy");
      await pyodide.loadPackage(["mido"]);
      setStatus("Ready — drop a MIDI file", "ready");
      els.convertBtn.disabled = !state.currentBytes;
    } catch (err) {
      console.error(err);
      setStatus("Failed to load runtime", "error");
      showAlert(
        "Could not load the Python runtime. Check your network connection and reload the page. " +
          "Error: " + (err && err.message ? err.message : err),
        "error"
      );
    }
  };
  script.onerror = () => {
    setStatus("Failed to load runtime", "error");
    showAlert("Could not download the Python runtime. Check your network and reload.", "error");
  };
  document.head.appendChild(script);
}

// ---------- Python pipeline (port of midi2python) ----------
// The functions below mirror the Python implementation in `midi2python/`
// (parser.py, generator.py, models.py, utils.py) so the in-browser behavior
// matches the CLI exactly.

const PY_PIPELINE = String.raw`
import io
import os
import re
import json
from collections import defaultdict
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Tuple, Optional, Any

import mido


# ----------------- Models -----------------

@dataclass
class ParsedMessage:
    type: str
    is_meta: bool
    time: int           # delta time
    abs_tick: int
    data: dict
    channel: Optional[int]


@dataclass
class NoteEvent:
    note: int
    channel: int
    start_tick: int
    duration_ticks: int
    velocity: int
    track_index: int


@dataclass
class TrackData:
    index: int
    name: str = ""
    instrument_name: str = ""
    is_drum: bool = False
    channels: List[int] = field(default_factory=list)
    program_numbers: List[int] = field(default_factory=list)
    notes: List[NoteEvent] = field(default_factory=list)
    messages: List[ParsedMessage] = field(default_factory=list)


@dataclass
class MidiFileData:
    path: str
    ticks_per_beat: int
    type: int
    tracks: List[TrackData] = field(default_factory=list)
    total_ticks: int = 0
    tempo_changes: List[Tuple[int, int]] = field(default_factory=list)
    time_signatures: List[Tuple[int, Tuple[int, int, int, int]]] = field(default_factory=list)
    key_signatures: List[Tuple[int, str]] = field(default_factory=list)

    @property
    def track_count(self) -> int:
        return len(self.tracks)

    @property
    def first_tempo_bpm(self):
        return 60_000_000 / self.tempo_changes[0][1] if self.tempo_changes else None

    @property
    def first_time_signature(self):
        return tuple(self.time_signatures[0][1][:2]) if self.time_signatures else None

    @property
    def first_key_signature(self):
        return self.key_signatures[0][1] if self.key_signatures else None


# ----------------- Utils -----------------

NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]

GENERAL_MIDI = [
    "Acoustic Grand Piano","Bright Acoustic Piano","Electric Grand Piano","Honky-tonk Piano",
    "Electric Piano 1","Electric Piano 2","Harpsichord","Clavinet","Celesta","Glockenspiel",
    "Music Box","Vibraphone","Marimba","Xylophone","Tubular Bells","Dulcimer","Drawbar Organ",
    "Percussive Organ","Rock Organ","Church Organ","Reed Organ","Accordion","Harmonica",
    "Tango Accordion","Acoustic Guitar (nylon)","Acoustic Guitar (steel)","Electric Guitar (jazz)",
    "Electric Guitar (clean)","Electric Guitar (muted)","Overdriven Guitar","Distortion Guitar",
    "Guitar Harmonics","Acoustic Bass","Electric Bass (finger)","Electric Bass (pick)",
    "Fretless Bass","Slap Bass 1","Slap Bass 2","Synth Bass 1","Synth Bass 2","Violin",
    "Viola","Cello","Contrabass","Tremolo Strings","Pizzicato Strings","Orchestral Harp",
    "Timpani","String Ensemble 1","String Ensemble 2","Synth Strings 1","Synth Strings 2",
    "Choir Aahs","Voice Oohs","Synth Voice","Orchestra Hit","Trumpet","Trombone","Tuba",
    "Muted Trumpet","French Horn","Brass Section","Synth Brass 1","Synth Brass 2","Soprano Sax",
    "Alto Sax","Tenor Sax","Baritone Sax","Oboe","English Horn","Bassoon","Clarinet",
    "Piccolo","Flute","Recorder","Pan Flute","Blown Bottle","Shakuhachi","Whistle",
    "Ocarina","Lead 1 (square)","Lead 2 (sawtooth)","Lead 3 (calliope)","Lead 4 (chiff)",
    "Lead 5 (charang)","Lead 6 (voice)","Lead 7 (fifths)","Lead 8 (bass + lead)",
    "Pad 1 (new age)","Pad 2 (warm)","Pad 3 (polysynth)","Pad 4 (choir)","Pad 5 (bowed)",
    "Pad 6 (metallic)","Pad 7 (halo)","Pad 8 (sweep)","FX 1 (rain)","FX 2 (soundtrack)",
    "FX 3 (crystal)","FX 4 (atmosphere)","FX 5 (brightness)","FX 6 (goblins)",
    "FX 7 (echoes)","FX 8 (sci-fi)","Sitar","Banjo","Shamisen","Koto","Kalimba","Bagpipe",
    "Fiddle","Shanai","Tinkle Bell","Agogo","Steel Drums","Woodblock","Taiko Drum",
    "Melodic Tom","Synth Drum","Reverse Cymbal","Guitar Fret Noise","Breath Noise","Seashore",
    "Bird Tweet","Telephone Ring","Helicopter","Applause","Gunshot",
]


def midi_note_to_name(n: int) -> str:
    if not 0 <= n <= 127:
        return f"Note{n}"
    octave = (n // 12) - 1
    return f"{NOTE_NAMES[n % 12]}{octave}"


def get_program_name(p: int) -> str:
    if 0 <= p < len(GENERAL_MIDI):
        return GENERAL_MIDI[p]
    return f"Program {p}"


def sanitize_filename(name: str) -> str:
    name = (name or "output").strip()
    name = re.sub(r"[^\w\-. ]+", "_", name)
    name = name.replace(" ", "_")
    return name or "output"


def tempo_to_bpm(tempo_us: int) -> float:
    if not tempo_us:
        return 120.0
    return 60_000_000.0 / tempo_us


def ticks_to_beats(ticks: int, tpb: int) -> float:
    return ticks / tpb if tpb else 0.0


# ----------------- Parser -----------------

def parse_midi_bytes(data: bytes, path: str = "<uploaded>.mid") -> MidiFileData:
    mid = mido.MidiFile(file=io.BytesIO(data))
    midi_data = MidiFileData(path=path, ticks_per_beat=mid.ticks_per_beat, type=mid.type)

    total_ticks = 0
    for ti, track in enumerate(mid.tracks):
        td = TrackData(index=ti)
        abs_tick = 0
        active: Dict[Tuple[int, int], Tuple[int, int]] = {}
        track_name = ""
        for msg in track:
            abs_tick += msg.time
            if abs_tick > total_ticks:
                total_ticks = abs_tick

            try:
                msg_dict = msg.dict()
            except Exception:
                msg_dict = {}

            is_meta = getattr(msg, "is_meta", False) or msg.type in (
                "set_tempo","time_signature","key_signature","track_name",
                "lyrics","marker","cue_point","instrument_name","end_of_track",
            )

            data_d: Dict[str, Any] = {}
            channel = getattr(msg, "channel", None)
            if channel is not None:
                td.channels = list(set(td.channels + [channel]))

            for k, v in msg_dict.items():
                if k in ("type", "time"):
                    continue
                data_d[k] = v

            if msg.type == "track_name":
                track_name = data_d.get("name","") or getattr(msg, "name","")
                td.name = track_name
            elif msg.type == "instrument_name":
                td.instrument_name = data_d.get("name","") or getattr(msg, "name","")
            elif msg.type == "program_change":
                prog = data_d.get("program", getattr(msg, "program", 0))
                td.program_numbers.append(prog)
                if channel in (9, 10):
                    td.is_drum = True
            elif msg.type == "set_tempo":
                tempo = data_d.get("tempo", getattr(msg, "tempo", 500000))
                midi_data.tempo_changes.append((abs_tick, tempo))
            elif msg.type == "time_signature":
                num = data_d.get("numerator", 4)
                den = data_d.get("denominator", 4)
                clk = data_d.get("clocks_per_click", 24)
                nt = data_d.get("notated_32nd_notes_per_beat", 8)
                midi_data.time_signatures.append((abs_tick, (num, den, clk, nt)))
            elif msg.type == "key_signature":
                key = data_d.get("key", getattr(msg, "key", "C"))
                midi_data.key_signatures.append((abs_tick, key))

            if msg.type == "note_on":
                note = data_d.get("note", getattr(msg, "note", 0))
                vel = data_d.get("velocity", getattr(msg, "velocity", 0))
                ch = channel if channel is not None else 0
                key = (ch, note)
                if vel > 0:
                    active[key] = (abs_tick, vel)
                else:
                    if key in active:
                        st, sv = active.pop(key)
                        dur = abs_tick - st
                        if dur >= 0:
                            td.notes.append(NoteEvent(note, ch, st, dur, sv, ti))
            elif msg.type == "note_off":
                note = data_d.get("note", getattr(msg, "note", 0))
                ch = channel if channel is not None else 0
                key = (ch, note)
                if key in active:
                    st, sv = active.pop(key)
                    dur = abs_tick - st
                    if dur >= 0:
                        td.notes.append(NoteEvent(note, ch, st, dur, sv, ti))

            td.messages.append(ParsedMessage(
                type=msg.type, is_meta=is_meta, time=msg.time,
                abs_tick=abs_tick, data=data_d, channel=channel,
            ))

        for (ch, n), (st, sv) in active.items():
            dur = abs_tick - st
            if dur > 0:
                td.notes.append(NoteEvent(n, ch, st, dur, sv, ti))

        if not td.name:
            td.name = f"Track {ti}"
        midi_data.tracks.append(td)

    midi_data.total_ticks = total_ticks
    return midi_data


# ----------------- Generator -----------------

def _escape_string(s: str) -> str:
    return repr(s)


def _message_to_code(msg) -> str:
    parts = []
    data = dict(msg.data)
    if msg.channel is not None and "channel" not in data and not msg.is_meta:
        parts.append(f"channel={msg.channel}")
    for key, value in sorted(data.items()):
        if key == "channel" and msg.channel is not None:
            if f"channel={msg.channel}" not in parts:
                parts.append(f"channel={value}")
            continue
        if isinstance(value, (bytes, bytearray)):
            parts.append(f"{key}={list(value)}")
        elif isinstance(value, str):
            parts.append(f"{key}={_escape_string(value)}")
        else:
            parts.append(f"{key}={value!r}")
    parts.append(f"time={msg.time}")
    args = ", ".join(parts)
    if msg.is_meta:
        return f'MetaMessage("{msg.type}", {args})' if args else f'MetaMessage("{msg.type}")'
    return f'Message("{msg.type}", {args})' if args else f'Message("{msg.type}")'


def _generate_header(source_midi: str, mode: str, md: MidiFileData, include_comments: bool) -> str:
    src = os.path.basename(source_midi)
    h = (
        '"""\n'
        f'Generated by MIDI-to-Python.\n\n'
        f'Source MIDI: {src}\n'
        f'Conversion mode: {mode}\n'
        f'Ticks per beat: {md.ticks_per_beat}\n'
        f'Tracks: {md.track_count}\n'
        f'Type: {md.type}\n'
        '"""\n\n'
        "from mido import MidiFile, MidiTrack, Message, MetaMessage\n\n"
    )
    return h


def generate_exact_code(md: MidiFileData, source_path: str, output_py_path: str, include_comments: bool) -> str:
    lines: List[str] = []
    lines.append(_generate_header(source_path, "exact", md, include_comments))
    if include_comments:
        lines.append("# MIDI file configuration\n")
    lines.append(f"TICKS_PER_BEAT = {md.ticks_per_beat}")
    lines.append(f"MIDI_TYPE = {md.type}\n")

    output_base = os.path.splitext(os.path.basename(output_py_path))[0]
    recreated = sanitize_filename(f"{output_base}_recreated.mid")
    lines.append(f'OUTPUT_MIDI = "{recreated}"\n')

    if include_comments:
        lines.append("# Create MIDI file\n")
    lines.append("mid = MidiFile(ticks_per_beat=TICKS_PER_BEAT, type=MIDI_TYPE)\n")

    for ti, track in enumerate(md.tracks):
        if include_comments:
            lines.append(f"# Track {ti}: {track.name}")
            if track.program_numbers:
                names = [get_program_name(p) for p in track.program_numbers]
                lines.append(f"#   Instruments: {', '.join(names)}")
            if track.channels:
                lines.append(f"#   Channels: {track.channels}")
            lines.append(f"#   Notes: {len(track.notes)}")
            lines.append(f"#   Messages: {len(track.messages)}\n")
        lines.append(f"track_{ti} = MidiTrack()")
        for msg in track.messages:
            lines.append(f"track_{ti}.append({_message_to_code(msg)})")
        lines.append(f"mid.tracks.append(track_{ti})\n")

    lines.append("# Save the recreated MIDI file")
    lines.append("mid.save(OUTPUT_MIDI)")
    lines.append('print(f"Recreated MIDI saved to {OUTPUT_MIDI}")')
    lines.append('print(f"Tracks: {len(mid.tracks)}")')
    lines.append('print(f"Ticks per beat: {mid.ticks_per_beat}")')
    lines.append('print(f"Type: {mid.type}")\n')
    lines.append('def get_midi():\n    """Return the recreated MidiFile object."""\n    return mid\n')
    return "\n".join(lines)


def generate_readable_code(md: MidiFileData, source_path: str, output_py_path: str, include_comments: bool) -> str:
    lines: List[str] = []
    # _generate_header() already emits the mido import; don't duplicate it.
    lines.append(_generate_header(source_path, "readable", md, include_comments))
    lines.append('NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]\n')
    lines.append(
        'def note_name(midi_note: int) -> str:\n'
        '    """Convert MIDI note number to note name (e.g., 60 -> C4)."""\n'
        '    if not 0 <= midi_note <= 127:\n'
        '        return f"Note{midi_note}"\n'
        '    octave = (midi_note // 12) - 1\n'
        '    return f"{NOTE_NAMES[midi_note % 12]}{octave}"\n\n'
    )
    if include_comments:
        lines.append("# MIDI Configuration\n")
    lines.append(f"TICKS_PER_BEAT = {md.ticks_per_beat}")
    lines.append(f"MIDI_TYPE = {md.type}")
    if md.tempo_changes:
        first_tempo = md.tempo_changes[0][1]
        bpm = tempo_to_bpm(first_tempo)
        lines.append(f"TEMPO = {first_tempo}  # microseconds per beat, {bpm:.2f} BPM")
        lines.append(f"TEMPO_BPM = {bpm:.2f}")
    else:
        lines.append("TEMPO = 500000  # default 120 BPM")
        lines.append("TEMPO_BPM = 120.0")
    if md.time_signatures:
        _, (num, den, clk, nt) = md.time_signatures[0]
        lines.append(f"TIME_SIGNATURE = ({num}, {den})  # {num}/{den}")
    else:
        lines.append("TIME_SIGNATURE = (4, 4)")
    if md.key_signatures:
        _, key = md.key_signatures[0]
        lines.append(f'KEY_SIGNATURE = "{key}"')
    else:
        lines.append('KEY_SIGNATURE = "C"  # default')
    lines.append("")

    output_base = os.path.splitext(os.path.basename(output_py_path))[0]
    recreated = sanitize_filename(f"{output_base}_recreated.mid")
    lines.append(f'OUTPUT_MIDI = "{recreated}"\n')

    if include_comments:
        lines.append("# Musical Analysis")
        lines.append(f"# Total tracks: {md.track_count}")
        lines.append(f"# Total ticks: {md.total_ticks}")
        if md.first_tempo_bpm:
            lines.append(f"# Tempo: {md.first_tempo_bpm:.2f} BPM")
        if md.first_time_signature:
            ts = md.first_time_signature
            lines.append(f"# Time Signature: {ts[0]}/{ts[1]}")
        if md.first_key_signature:
            lines.append(f"# Key Signature: {md.first_key_signature}")
        lines.append("")

    lines.append("mid = MidiFile(ticks_per_beat=TICKS_PER_BEAT, type=MIDI_TYPE)\n")

    for ti, track in enumerate(md.tracks):
        if include_comments:
            lines.append(f"# {'='*60}")
            lines.append(f"# Track {ti}: {track.name}")
            lines.append(f"# {'='*60}")
            for prog in track.program_numbers:
                lines.append(f"# Instrument: {get_program_name(prog)} (program {prog})")
            if track.channels:
                lines.append(f"# Channels: {track.channels}")
            if track.is_drum:
                lines.append("# Drum track")
            lines.append(f"# Notes: {len(track.notes)}")
            lines.append(f"# Messages: {len(track.messages)}")
            if track.notes:
                ns = sorted(track.notes, key=lambda n: n.note)
                lo = midi_note_to_name(ns[0].note)
                hi = midi_note_to_name(ns[-1].note)
                lines.append(f"# Note range: {lo} ({ns[0].note}) to {hi} ({ns[-1].note})")
            lines.append("")

        lines.append(f"track_{ti} = MidiTrack()  # {track.name}")

        if track.notes:
            grouped = defaultdict(list)
            for n in track.notes:
                grouped[n.start_tick].append(n)
            if include_comments:
                lines.append(f"# Musical notes for track {ti}: {track.name}")
                lines.append("# Format: (note_name, midi_number, start_beats, duration_beats, velocity, channel)")
            lines.append(f"notes_{ti} = [")
            for note in track.notes[:200]:
                name = midi_note_to_name(note.note)
                sb = ticks_to_beats(note.start_tick, md.ticks_per_beat)
                db = ticks_to_beats(note.duration_ticks, md.ticks_per_beat)
                lines.append(
                    f'    ("{name}", {note.note}, {sb:.3f}, {db:.3f}, {note.velocity}, {note.channel}),  # tick {note.start_tick}'
                )
            if len(track.notes) > 200:
                lines.append(f"    # ... and {len(track.notes) - 200} more notes")
            lines.append("]\n")

        if include_comments:
            lines.append(f"# Reconstruct track {ti} with accurate timing")
        for msg in track.messages:
            beats = ticks_to_beats(msg.abs_tick, md.ticks_per_beat)
            comment = ""
            if include_comments:
                if msg.type in ("note_on", "note_off"):
                    n = msg.data.get("note")
                    if n is not None:
                        comment = f"  # {midi_note_to_name(n)} at {beats:.2f} beats (tick {msg.abs_tick})"
                elif msg.type == "program_change":
                    p = msg.data.get("program", 0)
                    comment = f"  # {get_program_name(p)}"
                elif msg.type == "set_tempo":
                    t = msg.data.get("tempo", 500000)
                    comment = f"  # {tempo_to_bpm(t):.2f} BPM"
                elif msg.type == "time_signature":
                    n = msg.data.get("numerator", 4)
                    d = msg.data.get("denominator", 4)
                    comment = f"  # Time sig: {n}/{d}"
                elif msg.type == "key_signature":
                    k = msg.data.get("key", "C")
                    comment = f"  # Key: {k}"
            lines.append(f"track_{ti}.append({_message_to_code(msg)}){comment}")
        lines.append(f"mid.tracks.append(track_{ti})\n")

    lines.append("# Save the recreated MIDI file")
    lines.append("mid.save(OUTPUT_MIDI)")
    lines.append('print(f"Recreated MIDI saved to {OUTPUT_MIDI}")')
    lines.append('print(f"Tracks: {len(mid.tracks)}")')
    lines.append('print(f"Ticks per beat: {mid.ticks_per_beat}")')
    lines.append('print(f"Tempo: {TEMPO_BPM} BPM")')
    lines.append('print(f"Time Signature: {TIME_SIGNATURE}")')
    lines.append('print(f"Key Signature: {KEY_SIGNATURE}")\n')
    lines.append('def get_midi():\n    """Return the recreated MidiFile object."""\n    return mid\n')
    return "\n".join(lines)


# ----------------- Web entry point -----------------

def web_convert(name: str, data: bytes, mode: str, include_comments: bool) -> dict:
    if mode not in ("exact", "readable"):
        raise ValueError("Invalid mode. Must be 'exact' or 'readable'.")
    md = parse_midi_bytes(data, name)
    base = os.path.splitext(os.path.basename(name))[0] or "output"
    base = sanitize_filename(base)
    output_py = f"{base}.py"
    if mode == "exact":
        code = generate_exact_code(md, name, output_py, include_comments)
    else:
        code = generate_readable_code(md, name, output_py, include_comments)
    try:
        compile(code, "<generated>", "exec")
    except SyntaxError as e:
        raise RuntimeError(f"Generated code has syntax error: {e}") from e

    info = {
        "name": name,
        "size": len(data),
        "ticks_per_beat": md.ticks_per_beat,
        "type": md.type,
        "tracks": md.track_count,
        "total_ticks": md.total_ticks,
        "tempo_bpm": round(md.first_tempo_bpm, 2) if md.first_tempo_bpm else None,
        "time_signature": list(md.first_time_signature) if md.first_time_signature else None,
        "key_signature": md.first_key_signature,
        "code": code,
        "line_count": code.count("\n") + 1,
    }
    return info
`;

let pipelineInited = false;
async function initPipeline() {
  if (pipelineInited) return;
  await state.pyodide.runPythonAsync(PY_PIPELINE);
  pipelineInited = true;
}

// ---------- File handling ----------

function isMidiName(name) {
  return /\.(midi?|mids)$/i.test(name || "");
}

async function handleFile(file) {
  clearAlert();
  if (!file) return;
  if (!isMidiName(file.name)) {
    showAlert("Please choose a .mid, .midi, or .mids file.", "error");
    return;
  }
  const buf = new Uint8Array(await file.arrayBuffer());
  state.currentFile = file;
  state.currentBytes = buf;
  state.currentName = file.name;
  state.currentCode = null;

  els.metaName.textContent = file.name;
  els.metaSize.textContent = humanSize(file.size);
  els.metaTracks.textContent = "—";
  els.metaTpb.textContent = "—";
  els.metaTempo.textContent = "—";
  els.fileMeta.hidden = false;
  els.convertBtn.disabled = !state.pyodide;
  els.copyBtn.disabled = true;
  els.downloadBtn.disabled = true;
  els.outputCode.textContent = "// Click \"Convert to Python\" to generate the script…";
  els.lineCount.textContent = "0 lines";
  showAlert("File ready. Click \"Convert to Python\".", "success");
}

async function runConversion() {
  if (!state.pyodide) {
    showAlert("Python runtime is still loading. Please wait a moment.", "error");
    return;
  }
  if (!state.currentBytes) {
    showAlert("Choose a MIDI file first.", "error");
    return;
  }
  if (state.busy) return;
  state.busy = true;
  els.convertBtn.disabled = true;
  setStatus("Converting…", "busy");
  clearAlert();
  try {
    await initPipeline();

    // Hand the MIDI bytes to Python.
    state.pyodide.FS.writeFile("/input.mid", state.currentBytes);
    const resultJson = await state.pyodide.runPythonAsync(
      `import json; json.dumps(web_convert("/input.mid", open("/input.mid","rb").read(), ${JSON.stringify(els.mode.value)}, ${els.comments.checked ? "True" : "False"}))`
    );
    const info = JSON.parse(resultJson);

    state.currentCode = info.code;
    els.outputCode.textContent = info.code;
    els.lineCount.textContent = info.line_count.toLocaleString() + " lines";
    els.metaTracks.textContent = String(info.tracks);
    els.metaTpb.textContent = String(info.ticks_per_beat);
    els.metaTempo.textContent = info.tempo_bpm ? `${info.tempo_bpm} BPM` : "—";
    els.copyBtn.disabled = false;
    els.downloadBtn.disabled = false;
    showAlert("Conversion complete. Your MIDI file was not uploaded.", "success");
    setStatus("Ready", "ready");
  } catch (err) {
    console.error(err);
    showAlert("Conversion failed: " + (err && err.message ? err.message : err), "error");
    setStatus("Error", "error");
    els.outputCode.textContent = "# Conversion failed. See the error above.";
  } finally {
    state.busy = false;
    els.convertBtn.disabled = false;
  }
}

async function copyCode() {
  if (!state.currentCode) return;
  try {
    await navigator.clipboard.writeText(state.currentCode);
    showAlert("Copied to clipboard.", "success");
  } catch {
    // Fallback: select the text
    const range = document.createRange();
    range.selectNodeContents(els.outputCode);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    showAlert("Press Ctrl/Cmd+C to copy the selected code.", "success");
  }
}

function downloadCode() {
  if (!state.currentCode) return;
  const base = (state.currentName || "song").replace(/\.(midi?|mids)$/i, "");
  const filename = `${base}.py`;
  const blob = new Blob([state.currentCode], { type: "text/x-python;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------- Wire up events ----------

els.fileInput.addEventListener("change", (e) => {
  const f = e.target.files && e.target.files[0];
  if (f) handleFile(f);
});

["dragenter", "dragover"].forEach((ev) =>
  els.dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    els.dropzone.classList.add("is-drag");
  })
);
["dragleave", "drop"].forEach((ev) =>
  els.dropzone.addEventListener(ev, (e) => {
    e.preventDefault();
    e.stopPropagation();
    els.dropzone.classList.remove("is-drag");
  })
);
els.dropzone.addEventListener("drop", (e) => {
  const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) handleFile(f);
});
els.dropzone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    els.fileInput.click();
  }
});

els.convertBtn.addEventListener("click", runConversion);
els.copyBtn.addEventListener("click", copyCode);
els.downloadBtn.addEventListener("click", downloadCode);

// Boot
loadPyodideAndMido();
