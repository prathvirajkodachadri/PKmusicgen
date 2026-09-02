"""
Logging setup
"""
import logging
import os
from pathlib import Path
from logging.handlers import RotatingFileHandler
from typing import Optional

def setup_logging(log_dir: Optional[Path] = None, level: str = "INFO") -> logging.Logger:
    if log_dir is None:
        from .config import get_config
        cfg = get_config()
        log_dir = Path(cfg.get('paths', {}).get('logs_dir', './logs'))
    
    log_dir = Path(log_dir)
    log_dir.mkdir(parents=True, exist_ok=True)
    
    log_file = log_dir / "app.log"
    
    # Root logger
    logger = logging.getLogger("pkmusicgen")
    logger.setLevel(getattr(logging, level.upper(), logging.INFO))
    
    # Avoid duplicate handlers
    if logger.handlers:
        return logger
    
    # Formatter
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )
    
    # File handler (rotating 5MB, 3 backups)
    fh = RotatingFileHandler(log_file, maxBytes=5*1024*1024, backupCount=3, encoding='utf-8')
    fh.setLevel(logging.DEBUG)
    fh.setFormatter(formatter)
    logger.addHandler(fh)
    
    # Console handler
    ch = logging.StreamHandler()
    ch.setLevel(getattr(logging, level.upper(), logging.INFO))
    ch.setFormatter(formatter)
    logger.addHandler(ch)
    
    # Reduce noise from libs
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
    
    logger.info("Logging initialized, log file: %s", log_file)
    return logger

def get_logger(name: str = "pkmusicgen") -> logging.Logger:
    return logging.getLogger(name)
