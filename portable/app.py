"""Minimal clean PKmusicgen portable entry point."""
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))


def main() -> None:
    print("=" * 60)
    print("PKmusicgen Portable - Real AI Music Generator")
    print("=" * 60)
    print()
    print("Portable project initialized.")
    print("Next stage: connect and validate ACE-Step 1.5 inference.")
    print(f"Models:  {ROOT / 'models'}")
    print(f"Outputs: {ROOT / 'outputs'}")


if __name__ == "__main__":
    main()
