# Examples

This directory contains example generated Python files.

## Workflow

```bash
pip install -r requirements.txt

python midi_to_python.py my_song.mid -o my_song.py

python my_song.py
```

Expected flow:

```
my_song.mid
     ↓
midi_to_python.py
     ↓
my_song.py
     ↓
my_song_recreated.mid
```

## Example: Generated File

See `generated_example.py` for an example of what the converter outputs.

The generated file is standalone and does not require the original MIDI file.

Running it recreates the MIDI:

```bash
python examples/generated_example.py
# Creates: generated_example_recreated.mid
```
