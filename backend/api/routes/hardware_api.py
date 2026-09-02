"""
Hardware detection API
"""
from fastapi import APIRouter
from ...core.hardware import detect_hardware, get_vram_info

router = APIRouter(prefix="/api/hardware", tags=["hardware"])

@router.get("/")
async def get_hardware_info():
    info = detect_hardware()
    return info.to_dict()

@router.get("/vram")
async def get_vram():
    return get_vram_info()

@router.get("/check")
async def hardware_check():
    """Quick health check"""
    info = detect_hardware()
    vram = get_vram_info()
    
    status = {
        "hardware": info.to_dict(),
        "vram": vram,
        "checks": {
            "cuda_available": info.cuda_available,
            "ffmpeg_available": info.ffmpeg_available,
            "gpu_detected": info.gpu_name is not None,
            "ram_ok": info.ram_total_gb >= 8,
            "python_version_ok": True
        },
        "recommendations": []
    }
    
    if not info.cuda_available:
        status["recommendations"].append("GPU acceleration unavailable. CPU mode enabled. Generation will be slower.")
    
    if not info.ffmpeg_available:
        status["recommendations"].append("FFmpeg not found. Some export features may require FFmpeg. Install FFmpeg and add to PATH.")
    
    if info.ram_total_gb < 8:
        status["recommendations"].append(f"Low RAM: {info.ram_total_gb}GB. Recommended 16GB+ for larger models.")
    
    if info.gpu_vram_gb and info.gpu_vram_gb < 8:
        status["recommendations"].append(f"Low VRAM: {info.gpu_vram_gb}GB. Use procedural-dsp or stable-audio-open-1.0 with low VRAM mode. ACE-Step and YuE need 12GB+.")
    
    return status
