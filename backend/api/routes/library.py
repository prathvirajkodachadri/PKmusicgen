"""
Library / Sample browser API
"""
from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional, List
from pathlib import Path

from ...database.db import get_db

router = APIRouter(prefix="/api/library", tags=["library"])

class SampleUpdateModel(BaseModel):
    filename: Optional[str] = None
    tags: Optional[str] = None
    category: Optional[str] = None
    favorite: Optional[bool] = None
    bpm: Optional[int] = None
    key: Optional[str] = None
    prompt: Optional[str] = None

@router.get("/")
async def list_samples(
    search: Optional[str] = None,
    category: Optional[str] = None,
    model_id: Optional[str] = None,
    favorite_only: bool = False,
    tags: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    offset: int = Query(0, ge=0),
    order_by: str = Query("creation_date DESC")
):
    db = get_db()
    samples = db.list_samples(
        search=search,
        category=category,
        model_id=model_id,
        favorite_only=favorite_only,
        tags=tags,
        limit=limit,
        offset=offset,
        order_by=order_by
    )
    total = db.count_samples(search=search, category=category, model_id=model_id, favorite_only=favorite_only)
    
    # Convert to dict
    result = []
    for s in samples:
        result.append({
            "id": s.id,
            "filename": s.filename,
            "filepath": s.filepath,
            "prompt": s.prompt,
            "negative_prompt": s.negative_prompt,
            "model_id": s.model_id,
            "seed": s.seed,
            "duration": s.duration,
            "sample_rate": s.sample_rate,
            "bit_depth": s.bit_depth,
            "channels": s.channels,
            "bpm": s.bpm,
            "key": s.key,
            "category": s.category,
            "tags": s.tags,
            "favorite": s.favorite,
            "file_size": s.file_size,
            "peak_db": s.peak_db,
            "rms_db": s.rms_db,
            "creation_date": s.creation_date,
            "generation_time": s.generation_time,
            "file_url": f"/api/library/file/{s.id}"
        })
    
    return {"samples": result, "total": total, "limit": limit, "offset": offset}

@router.get("/{sample_id}")
async def get_sample(sample_id: int):
    db = get_db()
    s = db.get_sample(sample_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sample not found")
    return {
        "id": s.id,
        "filename": s.filename,
        "filepath": s.filepath,
        "prompt": s.prompt,
        "negative_prompt": s.negative_prompt,
        "model_id": s.model_id,
        "seed": s.seed,
        "duration": s.duration,
        "sample_rate": s.sample_rate,
        "bit_depth": s.bit_depth,
        "channels": s.channels,
        "bpm": s.bpm,
        "key": s.key,
        "category": s.category,
        "tags": s.tags,
        "favorite": s.favorite,
        "file_size": s.file_size,
        "peak_db": s.peak_db,
        "rms_db": s.rms_db,
        "creation_date": s.creation_date,
        "generation_time": s.generation_time,
        "file_url": f"/api/library/file/{s.id}",
        "extra_metadata": s.extra_metadata
    }

@router.put("/{sample_id}")
async def update_sample(sample_id: int, updates: SampleUpdateModel):
    db = get_db()
    s = db.get_sample(sample_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    update_dict = {k: v for k, v in updates.dict().items() if v is not None}
    if not update_dict:
        return {"message": "No updates"}
    
    success = db.update_sample(sample_id, update_dict)
    if not success:
        raise HTTPException(status_code=400, detail="Update failed")
    
    return {"message": "Updated", "id": sample_id}

@router.delete("/{sample_id}")
async def delete_sample(sample_id: int):
    db = get_db()
    s = db.get_sample(sample_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    success = db.delete_sample(sample_id)
    if not success:
        raise HTTPException(status_code=500, detail="Delete failed")
    
    return {"message": "Deleted", "id": sample_id}

@router.post("/{sample_id}/favorite")
async def toggle_favorite(sample_id: int):
    db = get_db()
    s = db.get_sample(sample_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    new_val = db.toggle_favorite(sample_id)
    return {"id": sample_id, "favorite": new_val}

@router.get("/file/{sample_id}")
async def get_file(sample_id: int):
    db = get_db()
    s = db.get_sample(sample_id)
    if not s:
        raise HTTPException(status_code=404, detail="Sample not found")
    
    fp = Path(s.filepath)
    if not fp.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")
    
    return FileResponse(str(fp), media_type="audio/wav", filename=s.filename)

@router.get("/categories/list")
async def list_categories():
    """List distinct categories"""
    db = get_db()
    conn = db._get_conn()
    try:
        cur = conn.execute("SELECT DISTINCT category FROM samples WHERE category IS NOT NULL AND category != ''")
        rows = cur.fetchall()
        cats = [r["category"] for r in rows if r["category"]]
        return {"categories": cats}
    finally:
        conn.close()

@router.get("/stats/overview")
async def stats_overview():
    db = get_db()
    conn = db._get_conn()
    try:
        cur = conn.execute("SELECT COUNT(*) as total, SUM(file_size) as total_size, AVG(duration) as avg_duration FROM samples")
        row = cur.fetchone()
        cur2 = conn.execute("SELECT COUNT(*) as fav FROM samples WHERE favorite=1")
        fav_row = cur2.fetchone()
        return {
            "total_samples": row["total"] or 0,
            "total_size_bytes": row["total_size"] or 0,
            "avg_duration": row["avg_duration"] or 0,
            "favorites": fav_row["fav"] or 0
        }
    finally:
        conn.close()
