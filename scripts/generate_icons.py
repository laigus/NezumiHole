"""Generate Tauri app icons from hamster-icon.png"""
from pathlib import Path
from PIL import Image
import struct
import io

PROJECT_ROOT = Path(__file__).resolve().parent.parent
SRC_IMG = PROJECT_ROOT / "public" / "hamster-icon.png"
ICONS_DIR = PROJECT_ROOT / "src-tauri" / "icons"

ICONS_DIR.mkdir(parents=True, exist_ok=True)

img = Image.open(SRC_IMG).convert("RGBA")

# Make it square by padding with transparent pixels
w, h = img.size
size = max(w, h)
square = Image.new("RGBA", (size, size), (0, 0, 0, 0))
square.paste(img, ((size - w) // 2, (size - h) // 2))

# PNG icons for Tauri
png_sizes = {
    "32x32.png": 32,
    "128x128.png": 128,
    "128x128@2x.png": 256,
}

for name, px in png_sizes.items():
    resized = square.resize((px, px), Image.LANCZOS)
    resized.save(ICONS_DIR / name, "PNG", optimize=True)
    print(f"  {name} ({px}x{px})")

# ICO file (Windows) — manual binary construction
def build_ico(source: Image.Image, sizes: list[int], out_path: Path):
    entries = []
    for s in sizes:
        resized = source.resize((s, s), Image.LANCZOS)
        buf = io.BytesIO()
        resized.save(buf, format="PNG")
        entries.append((s, buf.getvalue()))

    header = struct.pack("<HHH", 0, 1, len(entries))
    data_offset = 6 + 16 * len(entries)
    dir_entries = b""
    img_data = b""

    for s, png_bytes in entries:
        w = 0 if s >= 256 else s
        h = 0 if s >= 256 else s
        dir_entries += struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32,
                                   len(png_bytes), data_offset + len(img_data))
        img_data += png_bytes

    out_path.write_bytes(header + dir_entries + img_data)
    return out_path.stat().st_size

ico_sizes = [16, 24, 32, 48, 64, 256]
ico_bytes = build_ico(square, ico_sizes, ICONS_DIR / "icon.ico")
print(f"  icon.ico ({'/'.join(str(s) for s in ico_sizes)}) — {ico_bytes} bytes")

# ICNS file (macOS) — simplified: just save as PNG, Tauri handles it
# For proper ICNS we just save the 512px PNG and let Tauri convert
icon_512 = square.resize((512, 512), Image.LANCZOS)
icon_512.save(ICONS_DIR / "icon.icns.png", "PNG", optimize=True)

# Actually for Tauri 2 on macOS, icon.png works too
icon_512.save(ICONS_DIR / "icon.png", "PNG", optimize=True)
print(f"  icon.png (512x512)")

# Also copy to public for web favicon
favicon = square.resize((64, 64), Image.LANCZOS)
favicon.save(PROJECT_ROOT / "public" / "favicon.png", "PNG", optimize=True)
print(f"  favicon.png (64x64)")

print("Done!")
