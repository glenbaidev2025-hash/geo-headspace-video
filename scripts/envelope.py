#!/usr/bin/env python3
"""Per-frame loudness envelope for voice segments, used to drive talking mouths in Remotion.

Usage:
  python3 scripts/envelope.py <slug> [--fps 30] [--ids N01,N02]

Reads public/audio/<slug>/timeline.json and writes public/audio/<slug>/envelope.json:
  {"fps": 30, "segments": {"N01": [0.0, 0.42, ...], ...}}   one value (0..1) per frame of each segment

Needs ffmpeg. Standard library only.
"""
import argparse
import array
import json
import math
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
RATE = 16000


def envelope(path: Path, fps: int) -> list:
    raw = subprocess.run(
        ["ffmpeg", "-loglevel", "error", "-i", str(path), "-ac", "1", "-ar", str(RATE), "-f", "s16le", "-"],
        capture_output=True, check=True,
    ).stdout
    pcm = array.array("h", raw)
    hop = RATE // fps
    rms = []
    for i in range(0, len(pcm), hop):
        chunk = pcm[i:i + hop]
        rms.append(math.sqrt(sum(x * x for x in chunk) / max(1, len(chunk))) if chunk else 0.0)
    ref = sorted(rms)[int(len(rms) * 0.95)] if rms else 1.0
    ref = ref or 1.0
    return [round(min(1.0, v / ref), 3) for v in rms]


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("slug")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--ids", help="comma-separated segment ids (default: all)")
    a = ap.parse_args()
    d = ROOT / "public" / "audio" / a.slug
    tl = json.loads((d / "timeline.json").read_text(encoding="utf-8"))
    ids = set(a.ids.split(",")) if a.ids else None
    out = {"fps": a.fps, "segments": {}}
    for s in tl["segments"]:
        if ids and s["id"] not in ids:
            continue
        out["segments"][s["id"]] = envelope(ROOT / "public" / s["file"], a.fps)
    (d / "envelope.json").write_text(json.dumps(out, separators=(",", ":")), encoding="utf-8")
    print(f"Wrote {d / 'envelope.json'} ({len(out['segments'])} segments)")


if __name__ == "__main__":
    main()
