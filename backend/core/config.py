"""
Configuration loader for PKmusicgen
"""
import os
import yaml
from pathlib import Path
from typing import Any, Dict

CONFIG_PATH = Path(__file__).parent.parent.parent / "config.yaml"

_default_config_cache = None

def load_config(config_path: Path = None) -> Dict[str, Any]:
    """Load config.yaml with environment overrides"""
    global _default_config_cache
    path = config_path or CONFIG_PATH
    if not path.exists():
        # Return minimal defaults if no config file
        return _minimal_defaults()
    
    with open(path, 'r', encoding='utf-8') as f:
        config = yaml.safe_load(f) or {}
    
    # Resolve relative paths to absolute
    root = path.parent
    paths_cfg = config.get('paths', {})
    for key in ['model_dir', 'output_dir', 'samples_dir', 'presets_dir', 'logs_dir', 'db_path']:
        if key in paths_cfg:
            p = Path(paths_cfg[key])
            if not p.is_absolute():
                paths_cfg[key] = str((root / p).resolve())
    
    # Ensure directories exist
    for dir_key in ['model_dir', 'output_dir', 'samples_dir', 'presets_dir', 'logs_dir']:
        if dir_key in paths_cfg:
            Path(paths_cfg[dir_key]).mkdir(parents=True, exist_ok=True)
    if 'db_path' in paths_cfg:
        Path(paths_cfg['db_path']).parent.mkdir(parents=True, exist_ok=True)
    
    _default_config_cache = config
    return config

def get_config() -> Dict[str, Any]:
    global _default_config_cache
    if _default_config_cache is None:
        return load_config()
    return _default_config_cache

def _minimal_defaults() -> Dict[str, Any]:
    return {
        "app": {"name": "PKmusicgen", "version": "1.0.0", "host": "127.0.0.1", "port": 7860, "offline_mode": False},
        "paths": {
            "model_dir": "./models",
            "output_dir": "./outputs",
            "samples_dir": "./samples",
            "presets_dir": "./presets",
            "logs_dir": "./logs",
            "db_path": "./data/library.db"
        },
        "audio": {"default_sample_rate": 44100, "default_bit_depth": 16, "default_duration": 10},
        "generation": {"default_model": "procedural-dsp", "default_seed": -1}
    }

def is_offline_mode() -> bool:
    cfg = get_config()
    return cfg.get('app', {}).get('offline_mode', False)

def update_config(updates: Dict[str, Any], config_path: Path = None):
    """Update config file with new values (shallow merge for top-level keys)"""
    path = config_path or CONFIG_PATH
    current = load_config(path)
    # Deep merge
    def deep_merge(a, b):
        for k, v in b.items():
            if k in a and isinstance(a[k], dict) and isinstance(v, dict):
                deep_merge(a[k], v)
            else:
                a[k] = v
    deep_merge(current, updates)
    with open(path, 'w', encoding='utf-8') as f:
        yaml.safe_dump(current, f, default_flow_style=False, sort_keys=False)
    global _default_config_cache
    _default_config_cache = current
    return current
