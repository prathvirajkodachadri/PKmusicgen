import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent.parent))

from backend.core.hardware import detect_hardware, get_vram_info, is_low_vram

def test_detect_hardware():
    info = detect_hardware()
    assert info.cpu_count >= 1
    assert info.ram_total_gb > 0
    assert info.os_name != ""
    print(f"Hardware: {info.cpu_count} cores, {info.ram_total_gb}GB RAM, GPU: {info.gpu_name}")

def test_vram_info():
    info = get_vram_info()
    # Should return dict even if no GPU
    assert isinstance(info, dict)
    print(f"VRAM info: {info}")

def test_low_vram():
    assert is_low_vram(None) == True
    assert is_low_vram(4.0) == True
    assert is_low_vram(16.0) == False
    print("Low VRAM check OK")

if __name__ == "__main__":
    test_detect_hardware()
    test_vram_info()
    test_low_vram()
    print("All hardware tests passed")
