import sys
from pathlib import Path
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.api.main import app

client = TestClient(app)


def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ok"
    assert data["free_tier"] is True


def test_config():
    res = client.get("/api/config")
    assert res.status_code == 200
    data = res.json()
    assert "app" in data
    assert "generation" in data


def test_models_api():
    res = client.get("/api/models/")
    assert res.status_code == 200
    data = res.json()
    assert "models" in data
    assert len(data["models"]) > 0


def test_random_prompt_endpoint():
    res = client.get("/api/generate/random_prompt")
    assert res.status_code == 200
    data = res.json()
    assert "prompt" in data


def test_song_assistant_endpoint():
    res = client.post("/api/generate/song_assistant", json={"prompt": "Midnight highway drive", "genre": "synthwave"})
    assert res.status_code == 200
    data = res.json()
    assert "title" in data
    assert "structure" in data


def test_generate_sync_and_effects():
    # 1. Generate sync procedural audio
    payload = {
        "prompt": "Lofi hip hop chill beat, warm piano",
        "duration": 1.0,
        "seed": 42,
        "num_variations": 1,
        "model_id": "procedural-dsp",
        "sample_rate": 44100,
        "bit_depth": 16,
        "normalize": True
    }
    res = client.post("/api/generate/sync", json=payload)
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert len(data["results"]) == 1
    sample_id = data["results"][0]["id"]
    assert sample_id > 0

    # 2. Get audio file from library
    file_res = client.get(f"/api/library/file/{sample_id}")
    assert file_res.status_code == 200

    # 3. Apply audio effects
    fx_payload = {
        "sample_id": sample_id,
        "reverb": 0.5,
        "bass_boost": 4.0,
        "spatial_8d": True,
        "normalize": True,
        "fade_in": 0.1,
        "fade_out": 0.1
    }
    fx_res = client.post("/api/generate/effects", json=fx_payload)
    assert fx_res.status_code == 200
    fx_data = fx_res.json()
    assert fx_data["id"] > 0
    assert "file_url" in fx_data


def test_frontend_routes():
    res = client.get("/")
    assert res.status_code == 200
    assert "PKmusicgen" in res.text

    css_res = client.get("/style.css")
    assert css_res.status_code == 200

    js_res = client.get("/app.js")
    assert js_res.status_code == 200


if __name__ == "__main__":
    test_health()
    test_config()
    test_models_api()
    test_random_prompt_endpoint()
    test_song_assistant_endpoint()
    test_generate_sync_and_effects()
    test_frontend_routes()
    print("All api_endpoints tests passed")
