"""
SQLite database for sample library
"""
import sqlite3
import json
from pathlib import Path
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from datetime import datetime
import logging

logger = logging.getLogger("pkmusicgen.database")

@dataclass
class SampleRecord:
    id: Optional[int] = None
    filename: str = ""
    filepath: str = ""
    prompt: str = ""
    negative_prompt: Optional[str] = None
    model_id: str = "procedural-dsp"
    seed: int = 0
    duration: float = 10.0
    sample_rate: int = 44100
    bit_depth: int = 16
    channels: int = 2
    bpm: Optional[int] = None
    key: Optional[str] = None
    category: Optional[str] = None
    tags: str = ""  # comma separated
    favorite: bool = False
    file_size: int = 0
    peak_db: float = 0.0
    rms_db: float = 0.0
    creation_date: str = ""
    generation_time: float = 0.0
    extra_metadata: str = ""  # JSON string

class Database:
    def __init__(self, db_path: Path = None):
        if db_path is None:
            from ..core.config import get_config
            cfg = get_config()
            db_path = Path(cfg.get('paths', {}).get('db_path', './data/library.db'))
        self.db_path = Path(db_path)
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self._init_tables()
    
    def _get_conn(self):
        conn = sqlite3.connect(str(self.db_path))
        conn.row_factory = sqlite3.Row
        return conn
    
    def _init_tables(self):
        conn = self._get_conn()
        try:
            conn.execute("""
            CREATE TABLE IF NOT EXISTS samples (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                filename TEXT NOT NULL,
                filepath TEXT NOT NULL,
                prompt TEXT,
                negative_prompt TEXT,
                model_id TEXT,
                seed INTEGER,
                duration REAL,
                sample_rate INTEGER,
                bit_depth INTEGER,
                channels INTEGER,
                bpm INTEGER,
                key TEXT,
                category TEXT,
                tags TEXT,
                favorite BOOLEAN DEFAULT 0,
                file_size INTEGER,
                peak_db REAL,
                rms_db REAL,
                creation_date TEXT,
                generation_time REAL,
                extra_metadata TEXT
            )
            """)
            conn.execute("CREATE INDEX IF NOT EXISTS idx_filename ON samples(filename)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_model ON samples(model_id)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_category ON samples(category)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_favorite ON samples(favorite)")
            conn.execute("CREATE INDEX IF NOT EXISTS idx_creation ON samples(creation_date)")
            conn.commit()
            logger.info(f"Database initialized at {self.db_path}")
        finally:
            conn.close()
    
    def add_sample(self, record: SampleRecord) -> int:
        conn = self._get_conn()
        try:
            if not record.creation_date:
                record.creation_date = datetime.now().isoformat()
            
            cur = conn.execute("""
            INSERT INTO samples (
                filename, filepath, prompt, negative_prompt, model_id, seed,
                duration, sample_rate, bit_depth, channels, bpm, key, category,
                tags, favorite, file_size, peak_db, rms_db, creation_date,
                generation_time, extra_metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                record.filename, record.filepath, record.prompt, record.negative_prompt,
                record.model_id, record.seed, record.duration, record.sample_rate,
                record.bit_depth, record.channels, record.bpm, record.key, record.category,
                record.tags, int(record.favorite), record.file_size, record.peak_db,
                record.rms_db, record.creation_date, record.generation_time, record.extra_metadata
            ))
            conn.commit()
            return cur.lastrowid
        finally:
            conn.close()
    
    def get_sample(self, sample_id: int) -> Optional[SampleRecord]:
        conn = self._get_conn()
        try:
            cur = conn.execute("SELECT * FROM samples WHERE id = ?", (sample_id,))
            row = cur.fetchone()
            if row:
                return self._row_to_record(row)
            return None
        finally:
            conn.close()
    
    def list_samples(
        self,
        search: str = None,
        category: str = None,
        model_id: str = None,
        favorite_only: bool = False,
        tags: str = None,
        limit: int = 100,
        offset: int = 0,
        order_by: str = "creation_date DESC"
    ) -> List[SampleRecord]:
        conn = self._get_conn()
        try:
            query = "SELECT * FROM samples WHERE 1=1"
            params = []
            
            if search:
                query += " AND (filename LIKE ? OR prompt LIKE ? OR tags LIKE ?)"
                like = f"%{search}%"
                params.extend([like, like, like])
            
            if category:
                query += " AND category = ?"
                params.append(category)
            
            if model_id:
                query += " AND model_id = ?"
                params.append(model_id)
            
            if favorite_only:
                query += " AND favorite = 1"
            
            if tags:
                query += " AND tags LIKE ?"
                params.append(f"%{tags}%")
            
            # Validate order_by to prevent injection
            allowed_order = ["creation_date DESC", "creation_date ASC", "filename ASC", "filename DESC", "duration ASC", "duration DESC"]
            if order_by not in allowed_order:
                order_by = "creation_date DESC"
            
            query += f" ORDER BY {order_by} LIMIT ? OFFSET ?"
            params.extend([limit, offset])
            
            cur = conn.execute(query, params)
            rows = cur.fetchall()
            return [self._row_to_record(r) for r in rows]
        finally:
            conn.close()
    
    def count_samples(self, search: str = None, category: str = None, model_id: str = None, favorite_only: bool = False) -> int:
        conn = self._get_conn()
        try:
            query = "SELECT COUNT(*) as cnt FROM samples WHERE 1=1"
            params = []
            if search:
                query += " AND (filename LIKE ? OR prompt LIKE ? OR tags LIKE ?)"
                like = f"%{search}%"
                params.extend([like, like, like])
            if category:
                query += " AND category = ?"
                params.append(category)
            if model_id:
                query += " AND model_id = ?"
                params.append(model_id)
            if favorite_only:
                query += " AND favorite = 1"
            cur = conn.execute(query, params)
            row = cur.fetchone()
            return row["cnt"] if row else 0
        finally:
            conn.close()
    
    def update_sample(self, sample_id: int, updates: Dict[str, Any]) -> bool:
        if not updates:
            return False
        # Only allow certain fields
        allowed = {"filename", "tags", "category", "favorite", "bpm", "key", "prompt"}
        filtered = {k: v for k, v in updates.items() if k in allowed}
        if not filtered:
            return False
        
        conn = self._get_conn()
        try:
            set_clause = ", ".join([f"{k} = ?" for k in filtered.keys()])
            params = list(filtered.values()) + [sample_id]
            conn.execute(f"UPDATE samples SET {set_clause} WHERE id = ?", params)
            conn.commit()
            return True
        finally:
            conn.close()
    
    def delete_sample(self, sample_id: int) -> bool:
        conn = self._get_conn()
        try:
            # Get filepath first to delete file
            cur = conn.execute("SELECT filepath FROM samples WHERE id = ?", (sample_id,))
            row = cur.fetchone()
            if row:
                fp = Path(row["filepath"])
                if fp.exists():
                    try:
                        fp.unlink()
                    except Exception as e:
                        logger.warning(f"Failed to delete file {fp}: {e}")
            conn.execute("DELETE FROM samples WHERE id = ?", (sample_id,))
            conn.commit()
            return True
        finally:
            conn.close()
    
    def toggle_favorite(self, sample_id: int) -> bool:
        conn = self._get_conn()
        try:
            cur = conn.execute("SELECT favorite FROM samples WHERE id = ?", (sample_id,))
            row = cur.fetchone()
            if not row:
                return False
            new_val = 0 if row["favorite"] else 1
            conn.execute("UPDATE samples SET favorite = ? WHERE id = ?", (new_val, sample_id))
            conn.commit()
            return bool(new_val)
        finally:
            conn.close()
    
    def _row_to_record(self, row) -> SampleRecord:
        return SampleRecord(
            id=row["id"],
            filename=row["filename"],
            filepath=row["filepath"],
            prompt=row["prompt"],
            negative_prompt=row["negative_prompt"],
            model_id=row["model_id"],
            seed=row["seed"],
            duration=row["duration"],
            sample_rate=row["sample_rate"],
            bit_depth=row["bit_depth"],
            channels=row["channels"],
            bpm=row["bpm"],
            key=row["key"],
            category=row["category"],
            tags=row["tags"],
            favorite=bool(row["favorite"]),
            file_size=row["file_size"],
            peak_db=row["peak_db"],
            rms_db=row["rms_db"],
            creation_date=row["creation_date"],
            generation_time=row["generation_time"],
            extra_metadata=row["extra_metadata"]
        )

# Singleton
_db_instance = None

def get_db(db_path: Path = None) -> Database:
    global _db_instance
    if _db_instance is None:
        _db_instance = Database(db_path)
    return _db_instance

def init_db(db_path: Path = None):
    return get_db(db_path)
