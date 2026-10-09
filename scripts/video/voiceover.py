"""Write the demo voiceover script (ElevenLabs, with emotion tags) and matching SRT subtitles.

    python3 scripts/video/voiceover.py

Timings follow out/video/playerpulse-demo.mp4 (81 s; trim the first 1 s) plus the 6 s outro.
Every figure is from TESTING.md or the demo data.
"""
from pathlib import Path

OUT = Path(__file__).resolve().parents[2] / "docs" / "video"
WPS = 2.6  # natural narration pace, words per second

# (start s, end s, scene, ElevenLabs v3 emotion tag, line as it should be spoken)
CUES = [
    (1.0, 7.5, "Landing hero", "[curious, warm]",
     "After every patch, players flood Steam, Discord and in-game chat, in Azerbaijani, Russian and English."),
    (7.5, 14.0, "How it works · two verdicts", "[confident]",
     "PlayerPulse reads every message, checks it against your gameplay telemetry, and gives each complaint a verdict."),
    (14.0, 20.0, "Results vs baselines", "[proud, measured]",
     "Test pack: five of five planted bugs, zero false alarms. Keyword filters? Fifty-nine percent."),
    (20.0, 25.0, "FAQ · closing CTA", "[friendly]",
     "No guesswork, no spreadsheets. Let's open the live product."),
    (25.0, 32.0, "Sign in (zoom on form)", "[calm]",
     "Every studio signs in to its own workspace. Your players' data stays yours."),
    (32.0, 41.0, "Overview · funnel zoom", "[intrigued]",
     "Here's the whole patch at a glance. Look at level four: completion fell from eighty percent to forty-three, while deaths stayed flat."),
    (41.0, 47.0, "Overview · categories, top 3", "[serious]",
     "Flat deaths with a collapsing finish rate is not a difficulty problem. That's a blocker bug."),
    (47.0, 50.0, "Issues list", "[decisive]",
     "Ranked by players lost, not by noise."),
    (50.0, 62.0, "Issue #1 detail · evidence", "[focused, clear]",
     "Number one: Twin Bridges, two thousand nine hundred forty-six players lost. The cause is quoted from the patch notes, "
     "and every claim links back to the player's own words, translated."),
    (62.0, 67.5, "Dismissed with proof", "[reassuring, slight smile]",
     "The 'level three is impossible' crowd? Completion eighty-five to eighty-four. Dismissed, with proof."),
    (67.5, 73.0, "Tasks board", "[upbeat]",
     "Real issues become tasks, tagged P-zero to P-two, ready for your board."),
    (73.0, 80.0, "Player voices", "[warm]",
     "Every player still heard, grouped by what they're talking about. About twenty cents per hundred messages."),
    (80.0, 81.3, "Back to overview", "[confident]",
     "Thirty seconds a run."),
    (81.3, 87.3, "Outro (playerpulse-outro.mp4)", "[excited, punchy]",
     "Player complaints in. Real bugs out. This is PlayerPulse."),
]


def ts(t: float, sep: str = ",") -> str:
    m, s = divmod(t, 60)
    h, m = divmod(m, 60)
    return f"{int(h):02d}:{int(m):02d}:{int(s):02d}{sep}{int(round((s - int(s)) * 1000)):03d}"


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    with open(OUT / "subtitles.srt", "w") as f:
        for i, (a, b, _, _, line) in enumerate(CUES, 1):
            f.write(f"{i}\n{ts(a)} --> {ts(b)}\n{line}\n\n")

    rows, warn = [], []
    for i, (a, b, scene, emo, line) in enumerate(CUES, 1):
        words = len(line.split())
        need = words / WPS
        ok = need <= (b - a) + 0.4
        if not ok:
            warn.append(f"cue {i} needs {need:.1f}s, has {b - a:.1f}s")
        rows.append(f"| {i} | {ts(a, '.')[3:8]}–{ts(b, '.')[3:8]} | {scene} | `{emo}` | {line} | {words} | {'✅' if ok else '⚠'} |")

    md = [
        "# PlayerPulse demo: voiceover script",
        "",
        "Video: `playerpulse-demo.mp4` (81 s; trim the first 1 s in CapCut) + `playerpulse-outro.mp4` (6 s) = **87 s**.",
        "One narrator, conversational, mid-pace. The bracketed tags are ElevenLabs v3 audio tags; keep them in the text.",
        "Numbers are written the way they should be spoken. Every figure comes from `TESTING.md` or the demo data.",
        "",
        "| # | Time | Scene | Emotion | Line | Words | Fits |",
        "|---|---|---|---|---|---|---|",
        *rows,
        "",
        "## Paste into ElevenLabs (v3), one take",
        "",
        "```",
        *[f"{emo} {line}\n[short pause]" for _, _, _, emo, line in CUES],
        "```",
        "",
        "Or generate one clip per cue and drop each at its start time in CapCut; the timings above are the cue starts.",
        "",
        "## Subtitles",
        "",
        "`docs/video/subtitles.srt` has the same cues and timings without the emotion tags. CapCut: Text → Auto captions → Import file.",
    ]
    (OUT / "voiceover.md").write_text("\n".join(md) + "\n")
    print("\n".join(warn) if warn else f"all {len(CUES)} cues fit at {WPS} words/s")


if __name__ == "__main__":
    main()
