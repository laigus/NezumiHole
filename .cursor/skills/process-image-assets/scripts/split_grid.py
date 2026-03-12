"""Split a composite grid image into individual cells.

Usage:
    python split_grid.py <source> <output_prefix> [cols] [rows]

Example:
    python split_grid.py "素材/cards.png" public/card-backgrounds/card 4 3
    -> card-1.png, card-2.png, ... card-12.png

If cols/rows are omitted, auto-detects grid layout from alpha channel.
"""

import sys
from pathlib import Path
from PIL import Image
import numpy as np


def find_bands(profile, threshold=30):
    has = profile > threshold
    changes = np.diff(has.astype(int))
    starts = (np.where(changes == 1)[0] + 1).tolist()
    ends = (np.where(changes == -1)[0] + 1).tolist()
    if has[0]:
        starts = [0] + starts
    if has[-1]:
        ends = ends + [len(has)]
    return list(zip(starts, ends))


def split_auto(img):
    """Auto-detect grid cells from alpha channel."""
    alpha = np.array(img)[:, :, 3]
    row_profile = np.max(alpha, axis=1)
    col_profile = np.max(alpha, axis=0)
    row_bands = find_bands(row_profile)
    col_bands = find_bands(col_profile)
    return row_bands, col_bands


def split_uniform(img, cols, rows):
    """Split into uniform grid cells."""
    w, h = img.size
    tw, th = w // cols, h // rows
    row_bands = [(r * th, (r + 1) * th) for r in range(rows)]
    col_bands = [(c * tw, (c + 1) * tw) for c in range(cols)]
    return row_bands, col_bands


def main():
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)

    source = sys.argv[1]
    prefix = sys.argv[2]
    cols = int(sys.argv[3]) if len(sys.argv) > 3 else None
    rows = int(sys.argv[4]) if len(sys.argv) > 4 else None

    img = Image.open(source).convert("RGBA")
    print(f"Source: {img.size[0]}x{img.size[1]} {img.mode}")

    if cols and rows:
        row_bands, col_bands = split_uniform(img, cols, rows)
    else:
        row_bands, col_bands = split_auto(img)

    print(f"Grid: {len(col_bands)} cols x {len(row_bands)} rows = {len(col_bands) * len(row_bands)} cells")

    out_dir = Path(prefix).parent
    out_dir.mkdir(parents=True, exist_ok=True)
    stem = Path(prefix).name

    idx = 1
    pad = 2
    for ry0, ry1 in row_bands:
        for cx0, cx1 in col_bands:
            y0, y1 = max(0, ry0 - pad), min(img.height, ry1 + pad)
            x0, x1 = max(0, cx0 - pad), min(img.width, cx1 + pad)
            tile = img.crop((x0, y0, x1, y1))
            bbox = tile.getbbox()
            if bbox:
                card = tile.crop(bbox)
            else:
                card = tile
            out = out_dir / f"{stem}-{idx}.png"
            card.save(str(out), optimize=True)
            kb = out.stat().st_size / 1024
            print(f"  {out.name}: {card.size[0]}x{card.size[1]} ({kb:.1f} KB)")
            idx += 1

    print(f"Done: {idx - 1} files saved to {out_dir}")


if __name__ == "__main__":
    main()
