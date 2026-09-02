"""
Hardware detection: GPU, CUDA, VRAM, CPU, RAM
"""
import platform
import psutil
import os
from dataclasses import dataclass, asdict
from typing import Optional, Dict, Any

@dataclass
class HardwareInfo:
    os_name: str
    os_version: str
    cpu: str
    cpu_count: int
    ram_total_gb: float
    ram_available_gb: float
    gpu_name: Optional[str] = None
    gpu_vram_gb: Optional[float] = None
    gpu_count: int = 0
    cuda_available: bool = False
    cuda_version: Optional[str] = None
    torch_version: Optional[str] = None
    torch_cuda_available: bool = False
    ffmpeg_available: bool = False
    python_version: str = platform.python_version()
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)

def detect_hardware() -> HardwareInfo:
    """Detect system hardware, safe without torch"""
    info = HardwareInfo(
        os_name=platform.system(),
        os_version=platform.version(),
        cpu=platform.processor() or platform.machine(),
        cpu_count=psutil.cpu_count(logical=True) or 1,
        ram_total_gb=round(psutil.virtual_memory().total / (1024**3), 2),
        ram_available_gb=round(psutil.virtual_memory().available / (1024**3), 2),
    )
    
    # Try torch detection
    try:
        import torch
        info.torch_version = torch.__version__
        info.torch_cuda_available = torch.cuda.is_available()
        info.cuda_available = torch.cuda.is_available()
        if torch.cuda.is_available():
            info.gpu_count = torch.cuda.device_count()
            # Get first GPU
            try:
                props = torch.cuda.get_device_properties(0)
                info.gpu_name = props.name
                info.gpu_vram_gb = round(props.total_memory / (1024**3), 2)
                info.cuda_version = torch.version.cuda
            except Exception:
                pass
        else:
            # Try to detect NVIDIA via other means
            info.gpu_name = _detect_nvidia_smi()
    except ImportError:
        info.gpu_name = _detect_nvidia_smi()
        info.torch_version = None
    except Exception:
        pass
    
    # FFmpeg check
    info.ffmpeg_available = _check_ffmpeg()
    
    return info

def _detect_nvidia_smi() -> Optional[str]:
    try:
        import subprocess
        result = subprocess.run(
            ["nvidia-smi", "--query-gpu=name", "--format=csv,noheader"],
            capture_output=True, text=True, timeout=5
        )
        if result.returncode == 0 and result.stdout.strip():
            return result.stdout.strip().split("\n")[0]
    except Exception:
        pass
    return None

def _check_ffmpeg() -> bool:
    try:
        import shutil
        return shutil.which("ffmpeg") is not None
    except Exception:
        return False

def get_vram_info() -> Dict[str, Any]:
    """Get detailed VRAM usage if torch available"""
    try:
        import torch
        if not torch.cuda.is_available():
            return {"available": False, "reason": "CUDA not available"}
        result = {}
        for i in range(torch.cuda.device_count()):
            props = torch.cuda.get_device_properties(i)
            allocated = torch.cuda.memory_allocated(i) / (1024**3)
            reserved = torch.cuda.memory_reserved(i) / (1024**3)
            result[f"gpu_{i}"] = {
                "name": props.name,
                "total_gb": round(props.total_memory / (1024**3), 2),
                "allocated_gb": round(allocated, 2),
                "reserved_gb": round(reserved, 2),
                "free_gb": round(props.total_memory / (1024**3) - reserved, 2)
            }
        return result
    except Exception as e:
        return {"available": False, "error": str(e)}

def is_low_vram(vram_gb: Optional[float], threshold: float = 8.0) -> bool:
    if vram_gb is None:
        return True
    return vram_gb < threshold
