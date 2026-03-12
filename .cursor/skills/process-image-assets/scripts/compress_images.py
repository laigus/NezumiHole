"""Compress and resize PNG images for web use.

Usage:
    python compress_images.py <glob_pattern> <output_prefix> [max_width]

Example:
    python compress_images.py "素材/食物*.png" public/food-illustrations/food 400
    -> food-1.png, food-2.png, ... (resized to 400px width)

Default max_width is 400px. Preserves transparency.
"""

import sys
import glob
import re
from pathlib import Path
from PIL import Image


def natural_sort_key(s):
    return [int(c) if c.isdigit() else c.lower() for c in re.split(r"(\d+)", str(s))]


def compress(src_path, out_path, max_width=400):
    img = Image.open(src_path).convert("RGBA")
    w, h = img.size
    if w > max_width:
        ratio = max_width / w
        new_size = (max_width, int(h * ratio))
        img = img.resize(new_size, Image.LANCZOS)
    img.save(str(out_path), optimize=True)
    return img.size, out_path.stat().st_size


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    pattern = sys.argv[1]
    prefix = sys.argv[2]
    max_width = int(sys.argv[3]) if len(sys.argv) > 3 else 400

    files = sorted(glob.glob(pattern), key=natural_sort_key)
    if not files:
        print(f"No files matched: {pattern}")
        sys.exit(1)

    out_dir = Path(prefix).parent
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = Path(prefix).name

    total_bytes = 0
    for i, src in enumerate(files, 1):
        out = out_dir / f"{stem}-{i}.png"
        size, nbytes = compress(src, out, max_width)
        total_bytes += nbytes
        kb = nbytes / 1024
        print(f"  {out.name}: {size[0]}x{size[1]} ({kb:.1f} KB) <- {Path(src).name}")

    total_mb = total_bytes / (1024 * 1024)
    print(f"Done: {len(files)} files, {total_mb:.1f} MB total -> {out_dir}")


if __name__ == "__main__":
    main()
