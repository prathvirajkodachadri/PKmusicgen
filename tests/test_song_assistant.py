import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.generation.song_assistant import AISongAssistant


def test_song_assistant_random_prompt():
    assistant = AISongAssistant()
    prompt_data = assistant.get_random_prompt()
    assert "prompt" in prompt_data
    assert len(prompt_data["prompt"]) > 5
    assert "genre" in prompt_data
    print(f"Random prompt: {prompt_data['prompt']}")


def test_song_assistant_generate_plan():
    assistant = AISongAssistant()
    plan = assistant.generate_song_plan("Neon night highway drive in Tokyo", genre="synthwave", mood="epic")
    assert "title" in plan
    assert "chords" in plan
    assert "bpm" in plan
    assert "structure" in plan
    assert len(plan["structure"]) >= 6

    # Verify sections exist (Intro, Verse, Chorus, etc.)
    section_names = [s["section"] for s in plan["structure"]]
    assert "Intro" in section_names
    assert "Verse 1" in section_names
    assert "Chorus" in section_names

    # Check lyrics exist
    for s in plan["structure"]:
        assert len(s["lyrics"]) > 0

    print(f"Song plan '{plan['title']}' generated with {len(plan['structure'])} sections")


if __name__ == "__main__":
    test_song_assistant_random_prompt()
    test_song_assistant_generate_plan()
    print("All song_assistant tests passed")
