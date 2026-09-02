import sys
from pathlib import Path
import tempfile
import os

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.database.db import Database, SampleRecord

def test_db_create():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        db = Database(db_path)
        assert db_path.exists()
        print("DB created")

def test_add_and_get():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        db = Database(db_path)
        
        record = SampleRecord(
            filename="test.wav",
            filepath="/tmp/test.wav",
            prompt="test prompt",
            model_id="procedural-dsp",
            seed=123,
            duration=5.0,
            sample_rate=44100,
            bit_depth=16,
            channels=2,
            category="drums",
            tags="test,drum"
        )
        
        id = db.add_sample(record)
        assert id > 0
        
        fetched = db.get_sample(id)
        assert fetched is not None
        assert fetched.filename == "test.wav"
        assert fetched.prompt == "test prompt"
        print(f"Added and fetched sample {id}")

def test_list_and_search():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        db = Database(db_path)
        
        for i in range(5):
            r = SampleRecord(
                filename=f"test_{i}.wav",
                filepath=f"/tmp/test_{i}.wav",
                prompt=f"prompt {i} {'drum' if i%2==0 else 'bass'}",
                model_id="procedural-dsp",
                seed=i,
                duration=2.0,
                category="drums" if i%2==0 else "bass"
            )
            db.add_sample(r)
        
        all_samples = db.list_samples(limit=10)
        assert len(all_samples) == 5
        
        drums = db.list_samples(category="drums")
        assert len(drums) == 3
        
        search = db.list_samples(search="bass")
        # Should find bass prompts
        assert len(search) >= 2
        
        print(f"List: {len(all_samples)}, drums: {len(drums)}, search bass: {len(search)}")

def test_favorite_and_delete():
    with tempfile.TemporaryDirectory() as tmpdir:
        db_path = Path(tmpdir) / "test.db"
        db = Database(db_path)
        
        r = SampleRecord(filename="fav.wav", filepath="/tmp/fav.wav", prompt="fav", model_id="test", seed=1, duration=1)
        id = db.add_sample(r)
        
        # Toggle favorite
        fav = db.toggle_favorite(id)
        assert fav == True
        
        fetched = db.get_sample(id)
        assert fetched.favorite == True
        
        # Delete
        db.delete_sample(id)
        assert db.get_sample(id) is None
        print("Favorite and delete OK")

if __name__ == "__main__":
    test_db_create()
    test_add_and_get()
    test_list_and_search()
    test_favorite_and_delete()
    print("All database tests passed")
