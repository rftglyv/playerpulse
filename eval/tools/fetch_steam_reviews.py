"""
Fetch real public Steam reviews for the real-data test (run on your own laptop;
needs internet). Output uses the same columns as data/scenario_*/messages.csv,
so PlayerPulse can run on it directly (community-only mode, no telemetry).

    python tools/fetch_steam_reviews.py --appid 123456 --since 2026-09-20 --until 2026-09-27 --out real_data/steam_123456.csv

How to use it for testing:
  1. Pick a game that shipped a buggy patch and later published hotfix notes.
  2. Fetch reviews from the patch date until the hotfix date.
  3. Run PlayerPulse on the CSV.
  4. Fill real_data/hotfix_check_template.csv: for each item in the studio's hotfix
     notes, did PlayerPulse surface it, and how many hours before the hotfix was
     announced did the first player report appear?
"""
import argparse
import csv
import json
import time
import urllib.parse
import urllib.request
from datetime import datetime, timezone


def fetch(appid, since_ts, until_ts, language, max_reviews):
    cursor = "*"
    out = []
    while len(out) < max_reviews:
        q = urllib.parse.urlencode({
            "json": 1, "filter": "recent", "language": language, "review_type": "all",
            "purchase_type": "all", "num_per_page": 100, "cursor": cursor,
        })
        url = f"https://store.steampowered.com/appreviews/{appid}?{q}"
        req = urllib.request.Request(url, headers={"User-Agent": "PlayerPulse-hackathon-test/1.0"})
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read().decode("utf-8"))
        reviews = data.get("reviews") or []
        if not reviews:
            break
        oldest = None
        for rv in reviews:
            ts = int(rv.get("timestamp_created", 0))
            oldest = ts if oldest is None else min(oldest, ts)
            if since_ts <= ts <= until_ts:
                out.append(rv)
        if oldest is not None and oldest < since_ts:
            break  # sorted newest first: we are past the window
        new_cursor = data.get("cursor")
        if not new_cursor or new_cursor == cursor:
            break
        cursor = new_cursor
        time.sleep(1.0)  # be polite
    return out[:max_reviews]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--appid", required=True)
    ap.add_argument("--since", required=True, help="YYYY-MM-DD (UTC)")
    ap.add_argument("--until", required=True, help="YYYY-MM-DD (UTC, inclusive)")
    ap.add_argument("--language", default="all", help="all, english, russian, ...")
    ap.add_argument("--max", type=int, default=2000)
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    since = int(datetime.fromisoformat(a.since).replace(tzinfo=timezone.utc).timestamp())
    until = int(datetime.fromisoformat(a.until).replace(tzinfo=timezone.utc).timestamp()) + 86399
    reviews = fetch(a.appid, since, until, a.language, a.max)

    with open(a.out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=["id", "timestamp", "channel", "author", "text", "language", "voted_up"])
        w.writeheader()
        for n, rv in enumerate(sorted(reviews, key=lambda r: r["timestamp_created"]), 1):
            w.writerow({
                "id": f"S{n:04d}",
                "timestamp": datetime.fromtimestamp(rv["timestamp_created"], tz=timezone.utc).isoformat(timespec="minutes"),
                "channel": "steam_review",
                "author": f"steam_{rv.get('recommendationid', n)}",
                "text": (rv.get("review") or "").replace("\r", " ").strip(),
                "language": rv.get("language", ""),
                "voted_up": rv.get("voted_up", ""),
            })
    print(f"wrote {len(reviews)} reviews to {a.out}")


if __name__ == "__main__":
    main()
