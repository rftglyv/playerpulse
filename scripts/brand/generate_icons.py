"""Generate every PlayerPulse web icon from one definition of the mark (logo 03a).

The mark: brand-blue speech bubble with an 8x7 pixel heart. Heart pixels are white; the
ordered-dither pixels in the upper rows are soft blue #DBEAFE (4.24:1 on the bubble).

    python3 scripts/brand/generate_icons.py

Writes into apps/web: app/icon.svg, app/favicon.ico, app/apple-icon.png,
public/brand/mark.svg, public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png.
"""
from __future__ import annotations

from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
WEB = ROOT / "apps" / "web"

BLUE = "#2563EB"
WHITE = "#FFFFFF"
SOFT = "#DBEAFE"

# Bubble outline on a 64x64 grid: (start, then cubic/line segments).
BUBBLE = [
    ("M", (12, 6)),
    ("C", (26, 3), (44, 3), (54, 8)),
    ("C", (60, 14), (60, 34), (54, 40)),
    ("C", (44, 44), (30, 44), (22, 43)),
    ("L", (10, 55)),
    ("L", (13, 42)),
    ("C", (6, 39), (4, 30), (5, 19)),
    ("C", (5, 13), (7, 8), (12, 6)),
]
BUBBLE_D = "M12 6 C 26 3, 44 3, 54 8 C 60 14, 60 34, 54 40 C 44 44, 30 44, 22 43 L 10 55 L 13 42 C 6 39, 4 30, 5 19 C 5 13, 7 8, 12 6 Z"

MASK = ["01100110", "11111111", "11111111", "11111111", "01111110", "00111100", "00011000"]
BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]
CELL, GAP = 4.6, 0.7
OX, OY = 32 - 8 * CELL / 2, 24 - 7 * CELL / 2


def is_dither(x: int, y: int) -> bool:
    return not ((0.35 + (y / len(MASK)) * 0.65) * 16 > BAYER[y % 4][x % 4])


def heart_cells():
    for y, row in enumerate(MASK):
        for x, on in enumerate(row):
            if on == "1":
                yield OX + x * CELL, OY + y * CELL, SOFT if is_dither(x, y) else WHITE


def mark_svg() -> str:
    rects = "".join(
        f'<rect x="{x:.2f}" y="{y:.2f}" width="{CELL - GAP:.2f}" height="{CELL - GAP:.2f}" rx="0.5" fill="{c}"/>'
        for x, y, c in heart_cells()
    )
    return (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">'
        f'<path d="{BUBBLE_D}" fill="{BLUE}"/>{rects}</svg>\n'
    )


def bubble_points(steps: int = 40):
    pts, cur = [], None
    for seg in BUBBLE:
        kind = seg[0]
        if kind == "M":
            cur = seg[1]
            pts.append(cur)
        elif kind == "L":
            cur = seg[1]
            pts.append(cur)
        else:
            p0, (p1, p2, p3) = cur, seg[1:]
            for i in range(1, steps + 1):
                t = i / steps
                mt = 1 - t
                pts.append((
                    mt**3 * p0[0] + 3 * mt**2 * t * p1[0] + 3 * mt * t**2 * p2[0] + t**3 * p3[0],
                    mt**3 * p0[1] + 3 * mt**2 * t * p1[1] + 3 * mt * t**2 * p2[1] + t**3 * p3[1],
                ))
            cur = p3
    return pts


def render(size: int, scale: float = 1.0, bg: str | None = None) -> Image.Image:
    """Draw the mark at `size` px. `scale` < 1 pads it (for maskable/apple tiles)."""
    ss = 8  # supersample for clean anti-aliasing
    big = size * ss
    img = Image.new("RGBA", (big, big), bg or (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    unit = big / 64 * scale
    off = (big - 64 * unit) / 2
    tx = lambda p: (off + p[0] * unit, off + p[1] * unit)
    d.polygon([tx(p) for p in bubble_points()], fill=BLUE)
    for x, y, c in heart_cells():
        x0, y0 = tx((x, y))
        x1, y1 = tx((x + CELL - GAP, y + CELL - GAP))
        d.rounded_rectangle([x0, y0, x1, y1], radius=0.5 * unit, fill=c)
    return img.resize((size, size), Image.LANCZOS)


def main():
    (WEB / "public" / "brand").mkdir(parents=True, exist_ok=True)
    svg = mark_svg()
    (WEB / "app" / "icon.svg").write_text(svg)
    (WEB / "public" / "brand" / "mark.svg").write_text(svg)

    # favicon.ico with the classic sizes; small sizes drawn directly at that size
    icos = [render(s) for s in (16, 32, 48)]
    icos[2].save(WEB / "app" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)], append_images=icos[:2])

    render(192).save(WEB / "public" / "icon-192.png")
    render(512).save(WEB / "public" / "icon-512.png")
    # maskable: white tile, mark inside the 80% safe zone
    render(512, scale=0.72, bg="#FFFFFF").save(WEB / "public" / "icon-maskable-512.png")
    # Apple touch icon: opaque white tile, iOS rounds the corners itself
    render(180, scale=0.78, bg="#FFFFFF").convert("RGB").save(WEB / "app" / "apple-icon.png")
    print("icons written")


if __name__ == "__main__":
    main()
