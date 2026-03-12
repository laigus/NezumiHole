"""Count image assets and update TypeScript constants.

Usage:
    python deploy_assets.py

Scans public/food-illustrations/ and public/card-backgrounds/, then updates
FOOD_ILLUSTRATION_COUNT and CARD_BG_COUNT in src/types/index.ts.
"""

import re
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent.parent.parent
TYPES_FILE = PROJECT_ROOT / "src" / "types" / "index.ts"

ASSET_DIRS = {
    "FOOD_ILLUSTRATION_COUNT": PROJECT_ROOT / "public" / "food-illustrations",
    "CARD_BG_COUNT": PROJECT_ROOT / "public" / "card-backgrounds",
}


def count_pngs(directory):
    if not directory.exists():
        return 0
    return len(list(directory.glob("*.png")))


def update_constant(content, name, value):
    pattern = rf"(export\s+const\s+{name}\s*=\s*)\d+"
    new = rf"\g<1>{value}"
    updated, n = re.subn(pattern, new, content)
    return updated, n > 0


def main():
    if not TYPES_FILE.exists():
        print(f"Error: {TYPES_FILE} not found")
        return

    content = TYPES_FILE.read_text(encoding="utf-8")
    changed = False

    for const_name, asset_dir in ASSET_DIRS.items():
        count = count_pngs(asset_dir)
        content, did_update = update_constant(content, const_name, count)
        status = "updated" if did_update else "unchanged"
        print(f"  {const_name} = {count} ({status}) <- {asset_dir.name}/")
        if did_update:
            changed = True

    if changed:
        TYPES_FILE.write_text(content, encoding="utf-8")
        print("Done: src/types/index.ts updated")
    else:
        print("Done: no changes needed")


if __name__ == "__main__":
    main()
