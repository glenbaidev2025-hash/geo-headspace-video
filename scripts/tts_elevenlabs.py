#!/usr/bin/env python3
"""Generate per-segment voiceover with ElevenLabs and write a timeline for Remotion.

Usage:
  export ELEVENLABS_API_KEY=...
  python3 scripts/tts_elevenlabs.py voice/<slug>.json [--only S01,S03] [--timeline-only]

Output (public/audio/<slug>/):
  S01.mp3, S02.mp3, ...   one file per segment
  timeline.json           [{id, file, start_s, duration_s, text}], plus total_s
  <slug>_full.mp3         concatenated preview (needs ffmpeg)

Standard library only. Needs ffprobe (from ffmpeg) to measure durations:
  brew install ffmpeg
"""
import argparse
import json
import os
import shutil
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

API = "https://api.elevenlabs.io/v1/text-to-speech/{voice_id}?output_format=mp3_44100_128"
ROOT = Path(__file__).resolve().parent.parent


def tts(cfg: dict, text: str, out: Path, key: str) -> None:
    body = {"text": text, "model_id": cfg.get("model_id", "eleven_v4")}
    if cfg.get("language_code"):
        body["language_code"] = cfg["language_code"]
    if cfg.get("voice_settings"):
        body["voice_settings"] = cfg["voice_settings"]
    req = urllib.request.Request(
        API.format(voice_id=cfg["voice_id"]),
        data=json.dumps(body).encode("utf-8"),
        headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=180) as r:
            out.write_bytes(r.read())
    except urllib.error.HTTPError as e:
        detail = e.read().decode("utf-8", "replace")
        sys.exit(f"ElevenLabs error {e.code} on {out.name}: {detail}")


def duration(path: Path) -> float:
    if not shutil.which("ffprobe"):
        sys.exit("ffprobe not found. Install ffmpeg (brew install ffmpeg) to measure durations.")
    r = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
        capture_output=True, text=True, check=True,
    )
    return round(float(r.stdout.strip()), 3)


def concat(files: list, gap: float, out: Path) -> None:
    if not shutil.which("ffmpeg"):
        print("ffmpeg not found; skipped full preview.")
        return
    inputs, filters = [], []
    for i, f in enumerate(files):
        inputs += ["-i", str(f)]
        filters.append(f"[{i}:a]apad=pad_dur={gap}[a{i}]")
    chain = "".join(f"[a{i}]" for i in range(len(files)))
    fc = ";".join(filters) + f";{chain}concat=n={len(files)}:v=0:a=1[out]"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", fc, "-map", "[out]", str(out)], check=True)


def load_dotenv() -> None:
    """Read KEY=VALUE lines from <repo>/.env into the environment (does not override)."""
    env = ROOT / ".env"
    if not env.exists():
        return
    for line in env.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


def main() -> None:
    load_dotenv()
    ap = argparse.ArgumentParser()
    ap.add_argument("config")
    ap.add_argument("--only", help="comma-separated segment ids to (re)generate")
    ap.add_argument("--timeline-only", action="store_true", help="skip TTS; measure existing files")
    a = ap.parse_args()

    cfg = json.loads(Path(a.config).read_text(encoding="utf-8"))
    slug = cfg["slug"]
    out_dir = ROOT / "public" / "audio" / slug
    out_dir.mkdir(parents=True, exist_ok=True)
    only = set(a.only.split(",")) if a.only else None

    if not a.timeline_only:
        key = os.environ.get("ELEVENLABS_API_KEY")
        if not key:
            sys.exit("Set ELEVENLABS_API_KEY in the environment or in <repo>/.env first.")
        if not cfg.get("voice_id") or "Voice ID" in cfg["voice_id"]:
            sys.exit("Fill in voice_id in the config.")
        for seg in cfg["segments"]:
            if only and seg["id"] not in only:
                continue
            print(f"TTS {seg['id']} ...")
            tts(cfg, seg["text"], out_dir / f"{seg['id']}.mp3", key)

    gap = float(cfg.get("gap_s", 0.35))
    t, items, files = 0.0, [], []
    for seg in cfg["segments"]:
        f = out_dir / f"{seg['id']}.mp3"
        if not f.exists():
            sys.exit(f"Missing {f}")
        d = duration(f)
        items.append({"id": seg["id"], "file": f"audio/{slug}/{f.name}", "start_s": round(t, 3), "duration_s": d, "text": seg["text"]})
        files.append(f)
        t += d + gap
    timeline = {"slug": slug, "gap_s": gap, "total_s": round(t, 3), "segments": items}
    (out_dir / "timeline.json").write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
    concat(files, gap, out_dir / f"{slug}_full.mp3")
    print(f"Done: {len(items)} segments, {t:.1f}s -> {out_dir / 'timeline.json'}")


if __name__ == "__main__":
    main()
