"""Turn a recorded screencast into a smooth 60 fps video with eased zoom-ins on actions.

    python3 scripts/video/render.py <capture_dir> <out.mp4>

capture_dir holds frames/NNNNN.jpg, frames.json ([{t, file}]) and zooms.json
([{t0, t1, x, y, scale}]) written by record.mjs. Each zoom eases in over EASE seconds,
holds, and eases out, centred on (x, y) and clamped to the frame.
"""
import json
import subprocess
import sys
from pathlib import Path

import imageio_ffmpeg
from PIL import Image

FPS = 60
EASE = 0.7  # seconds to zoom in / out


def ease(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return 1 - (1 - t) ** 3 if t < 1 else 1.0  # ease-out cubic


def smooth(t: float) -> float:
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def zoom_k(t: float, zooms):
    """Return (k, zoom) where k in 0..1 is how far into the strongest active zoom we are."""
    best = (0.0, None)
    for z in zooms:
        if t < z["t0"] - 0.01 or t > z["t1"] + EASE:
            continue
        if t < z["t0"] + EASE:
            k = smooth((t - z["t0"]) / EASE)
        elif t <= z["t1"]:
            k = 1.0
        else:
            k = 1 - smooth((t - z["t1"]) / EASE)
        if k > best[0]:
            best = (k, z)
    return best


def target_box(z, W, H):
    """Final crop box for a zoom, clamped to the frame once (so the glide never bends)."""
    cw, ch = W / z["scale"], H / z["scale"]
    left = min(max(z["x"] - cw / 2, 0), W - cw)
    top = min(max(z["y"] - ch / 2, 0), H - ch)
    return left, top, left + cw, top + ch


def main(cap: Path, out: str):
    frames = json.loads((cap / "frames.json").read_text())
    zooms = json.loads((cap / "zooms.json").read_text())
    first = Image.open(cap / "frames" / frames[0]["file"])
    W, H = first.size
    t0, t1 = frames[0]["t"], frames[-1]["t"]
    total = int((t1 - t0) * FPS) + 1

    ff = imageio_ffmpeg.get_ffmpeg_exe()
    enc = subprocess.Popen(
        [ff, "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-c:v", "libx264", "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out],
        stdin=subprocess.PIPE,
    )
    fi, cache_file, cache_img = 0, None, None
    for k in range(total):
        t = t0 + k / FPS
        while fi + 1 < len(frames) and frames[fi + 1]["t"] <= t:
            fi += 1
        f = frames[fi]["file"]
        if f != cache_file:
            cache_img, cache_file = Image.open(cap / "frames" / f).convert("RGB"), f
        img = cache_img
        k, z = zoom_k(t, zooms)
        if z is not None and k > 0.001:
            # glide the whole box from the full frame to the target box: x, y, width, height move together
            tl, tt, tr, tb = target_box(z, W, H)
            box = (tl * k, tt * k, W + (tr - W) * k, H + (tb - H) * k)
            img = img.resize((W, H), Image.LANCZOS, box=box)
        enc.stdin.write(img.tobytes())
    enc.stdin.close()
    enc.wait()
    print(f"{out}: {total / FPS:.1f} s at {FPS} fps, {len(frames)} captured frames, {len(zooms)} zooms")


if __name__ == "__main__":
    main(Path(sys.argv[1]), sys.argv[2])
