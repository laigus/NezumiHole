---
name: process-image-assets
description: >-
  Process image assets for NezumiHole project: split composite grid images into
  individual files, compress/resize PNGs, and place them into the correct public
  directory. Use when the user provides new image assets (illustrations, card
  backgrounds, icons) or asks to add/update images in the project.
---

# Process Image Assets

Handles three image processing workflows for NezumiHole:
1. **Split** — grid/composite images into individual files
2. **Compress** — resize large PNGs to web-friendly sizes
3. **Auto-deploy** — place processed images into `public/` and update code constants

## Prerequisites

- Python 3 with Pillow and numpy: `pip install Pillow numpy -i https://mirrors.aliyun.com/pypi/simple/`
- Source images go in `素材/` directory

## Workflow 1: Split Composite Grid Image

When the user provides a single image containing multiple items arranged in a grid (e.g., 4x3 card backgrounds):

```bash
python scripts/split_grid.py "素材/source.png" public/card-backgrounds/card 4 3
```

Script auto-detects card boundaries via alpha channel analysis, crops each cell, and saves as `card-1.png`, `card-2.png`, etc.

## Workflow 2: Compress & Resize Images

When the user provides multiple large images (e.g., AI-generated food illustrations):

```bash
python scripts/compress_images.py "素材/food*.png" public/food-illustrations/food 400
```

Resizes images to max width (default 400px), preserves aspect ratio and transparency, optimizes PNG output.

## Workflow 3: Auto-Deploy (Update Code Constants)

After adding images to `public/`, update the count constant in `src/types/index.ts`:

- `FOOD_ILLUSTRATION_COUNT` — number of files in `public/food-illustrations/`
- `CARD_BG_COUNT` — number of files in `public/card-backgrounds/`

Run the deploy script to count files and patch the TypeScript:

```bash
python scripts/deploy_assets.py
```

## Directory Structure

```
public/
├── food-illustrations/   # food-1.png ~ food-N.png (transparent PNG, ~400px wide)
└── card-backgrounds/     # card-1.png ~ card-N.png (transparent PNG, card shapes)
```

## Key Constraints

- Output format: PNG with transparency preserved
- Naming: `{prefix}-{1-indexed}.png` (e.g., `food-1.png`, `card-1.png`)
- Compression target: individual file < 150 KB
- Always use virtual environment or system Python with Pillow installed
- Use Chinese pip mirror: `-i https://mirrors.aliyun.com/pypi/simple/`
