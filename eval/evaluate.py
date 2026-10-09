"""
PlayerPulse evaluation harness (stdlib only, Python 3.8+).

Scores your system's output against the answer key and compares it with three
baselines that represent how studios triage feedback today.

Examples
  # baselines only (works right now, before your system exists)
  python evaluate.py --scenario A

  # your system vs baselines (one or more prediction files)
  python evaluate.py --scenario A --pred out/pp_A.json
  python evaluate.py --scenario A --pred out/pp_A_no_telemetry.json --pred out/pp_A.json

  # held-out scenario (do NOT tune prompts on it)
  python evaluate.py --scenario B --pred out/pp_B.json

  # score a teammate's hand-sorting sheet (CSV with id,category,level)
  python evaluate.py --scenario A --pred-csv manual_triage/filled_sheet.csv --name "Human (timed)"

Writes a markdown report to results/scenario_<X>_<split>.md
"""
import argparse
import csv
import json
import re
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent
REAL = ("bug", "balance")
CATS = ("bug", "balance", "skill_issue", "noise")


# ----------------------------------------------------------------------------
# loading
# ----------------------------------------------------------------------------
def load(scenario):
    d = ROOT / "data" / f"scenario_{scenario}"
    with open(d / "messages.csv", encoding="utf-8") as f:
        messages = list(csv.DictReader(f))
    with open(d / "telemetry.csv", encoding="utf-8") as f:
        telemetry = list(csv.DictReader(f))
    game = json.load(open(d / "game_info.json", encoding="utf-8"))
    with open(ROOT / "answer_key" / f"scenario_{scenario}_labels.csv", encoding="utf-8") as f:
        labels = {r["id"]: r for r in csv.DictReader(f)}
    issues = json.load(open(ROOT / "answer_key" / f"scenario_{scenario}_issues.json", encoding="utf-8"))["issues"]
    return messages, telemetry, game, labels, issues


def to_int(x):
    try:
        return int(x)
    except (TypeError, ValueError):
        return None


# ----------------------------------------------------------------------------
# baselines (how it is done today)
# ----------------------------------------------------------------------------
LEVEL_RE = re.compile(
    r"(?:level|lvl|lv|mission|missiya|səviyyə|seviyye|уровень|уровне|уровня|миссия|миссии)\s*[-#]?\s*(\d{1,2})"
    r"|(\d{1,2})\s*[-]?\s*(?:cü|cu|ci|cı|ü|u|i|ı|-й|-м|й|м)?\s*(?:level|lvl|səviyyə|seviyye|уровень|уровне|missiya|mission|миссия|миссии)",
    re.IGNORECASE,
)
BUG_RE = re.compile(
    r"bug|crash|glitch|broken|clip|fell through|falling through|fall through|ctd|freez|froze|disconnect|desync|"
    r"doesn't work|not working|not loading|doesn't save|overlap|baq|çökür|xarab|işləmir|dondu|bağlanır|"
    r"баг|вылет|краш|сломан|глюк|провал|не работает|не сохраняет|дисконнект|рассинхрон",
    re.IGNORECASE,
)
HARD_RE = re.compile(
    r"too hard|impossible|unbeatable|unfair|nerf|çətin|mümkün deyil|keçilmir|ədalətsiz|сложн|невозможн|нечестн|понерф",
    re.IGNORECASE,
)


def detect_level(text):
    m = LEVEL_RE.search(text)
    if not m:
        return None
    return to_int(m.group(1) or m.group(2))


def issues_from_message_preds(msg_preds, min_messages=1, default_category=None):
    groups = defaultdict(list)
    for p in msg_preds:
        if p["category"] in REAL:
            groups[p.get("level")].append(p)
    issues = []
    for lv, ps in groups.items():
        if len(ps) < min_messages:
            continue
        cat = default_category or Counter(p["category"] for p in ps).most_common(1)[0][0]
        issues.append({"title": f"complaints about level {lv}", "category": cat, "level": lv,
                       "status": "reported", "message_ids": [p["id"] for p in ps], "_n": len(ps)})
    issues.sort(key=lambda i: -i["_n"])
    for k, i in enumerate(issues, 1):
        i["priority"] = k
    return issues


def baseline_keyword(messages, telemetry):
    preds = []
    for m in messages:
        t = m["text"]
        cat = "bug" if BUG_RE.search(t) else ("balance" if HARD_RE.search(t) else "noise")
        preds.append({"id": m["id"], "category": cat, "level": detect_level(t)})
    return {"system": "Baseline: keyword filter", "messages": preds, "issues": issues_from_message_preds(preds)}


def baseline_volume(messages, telemetry):
    preds = []
    for m in messages:
        lv = detect_level(m["text"])
        preds.append({"id": m["id"], "category": "bug" if lv is not None else "noise", "level": lv})
    return {"system": "Baseline: most-mentioned levels", "messages": preds,
            "issues": issues_from_message_preds(preds, min_messages=5, default_category="bug")}


def baseline_telemetry(messages, telemetry, drop=0.05):
    patches = sorted({r["patch"] for r in telemetry}, key=lambda p: [int(x) for x in p.split(".")])
    prev, cur = patches[0], patches[-1]
    t = {(r["patch"], int(r["level"])): r for r in telemetry}
    out = []
    for (p, lv), r in t.items():
        if p != cur:
            continue
        d = float(t[(prev, lv)]["completion_rate"]) - float(r["completion_rate"])
        if d >= drop:
            out.append({"title": f"completion drop on level {lv}", "category": "unknown", "level": lv,
                        "status": "reported", "message_ids": [], "_lost": int(r["players_started"]) * d})
    out.sort(key=lambda i: -i["_lost"])
    for k, i in enumerate(out, 1):
        i["priority"] = k
    return {"system": "Baseline: analytics drop-off alert only", "messages": None, "issues": out}


BASELINES = [baseline_keyword, baseline_volume, baseline_telemetry]


# ----------------------------------------------------------------------------
# scoring
# ----------------------------------------------------------------------------
def map_issue(p, labels, gt_issues):
    ids = [i for i in (p.get("message_ids") or []) if i in labels]
    if ids:
        votes = Counter(labels[i]["issue_id"] for i in ids)
        top = max(votes.values())
        cands = sorted([k for k, v in votes.items() if v == top])
        return cands[0], len(ids)
    lv = to_int(p.get("level"))
    at_level = [g for g in gt_issues if g["level"] == lv]
    real = [g for g in at_level if g["category"] in REAL]
    if real:
        return real[0]["issue_id"], 0
    if at_level:
        return at_level[0]["issue_id"], 0
    return "NOISE", 0


def score(pred, labels, gt_issues, split_ids):
    gt = {g["issue_id"]: g for g in gt_issues}
    real_ids = [g["issue_id"] for g in gt_issues if g["category"] in REAL]
    rank = {g["issue_id"]: g["priority_rank"] for g in gt_issues if g["category"] in REAL}
    top3 = {i for i, r in rank.items() if r <= 3}

    issues = pred.get("issues") or []
    reported = [i for i in issues if i.get("status", "reported") not in ("dismissed", "watch")]
    dismissed = [i for i in issues if i.get("status") == "dismissed"]
    watch = [i for i in issues if i.get("status") == "watch"]
    for p in watch:
        p["_gt"] = map_issue(p, labels, gt_issues)[0]
    if pred.get("_only_ids"):
        split_ids = [i for i in split_ids if i in pred["_only_ids"]]
    reported = sorted(reported, key=lambda i: (i.get("priority") if i.get("priority") is not None else 999))

    found, false_alarms, dups, cat_ok, cat_total, evidence = [], [], 0, 0, 0, []
    for p in reported:
        gid, n_ev = map_issue(p, labels, gt_issues)
        p["_gt"] = gid
        if gid in real_ids:
            if gid in found:
                dups += 1
            else:
                found.append(gid)
                evidence.append(n_ev)
                if p.get("category") in REAL:
                    cat_total += 1
                    cat_ok += int(p.get("category") == gt[gid]["category"])
        else:
            false_alarms.append(p)
    missed = [i for i in real_ids if i not in found]

    good_dismiss, bad_dismiss = [], []
    for p in dismissed:
        gid, _ = map_issue(p, labels, gt_issues)
        p["_gt"] = gid
        (bad_dismiss if gid in real_ids else good_dismiss).append(p)

    res = {
        "system": pred.get("system", "unnamed"),
        "real_total": len(real_ids),
        "found": found,
        "missed": missed,
        "false_alarms": false_alarms,
        "duplicates": dups,
        "top1": bool(found) and rank.get(reported[0]["_gt"]) == 1 if reported else False,
        "top3": len(top3 & {p["_gt"] for p in reported[:3]}),
        "cat_ok": cat_ok,
        "cat_total": cat_total,
        "evidence": (sum(evidence) / len(evidence)) if evidence else 0.0,
        "good_dismiss": good_dismiss,
        "bad_dismiss": bad_dismiss,
        "watch": watch,
    }

    msgs = pred.get("messages")
    if msgs:
        mp = {m["id"]: m for m in msgs if m.get("id") in split_ids}
        n = len(split_ids)
        correct = 0
        conf = Counter()
        skill_flagged = skill_total = real_missed = real_total = 0
        lv_ok = lv_total = 0
        for mid in split_ids:
            g = labels[mid]
            p = mp.get(mid, {"category": "noise", "level": None})
            pc = p.get("category", "noise")
            conf[(g["category"], pc)] += 1
            correct += int(pc == g["category"])
            if g["category"] == "skill_issue":
                skill_total += 1
                skill_flagged += int(pc in REAL)
            if g["category"] in REAL:
                real_total += 1
                real_missed += int(pc not in REAL)
            if g["level"]:
                lv_total += 1
                lv_ok += int(to_int(p.get("level")) == int(g["level"]))
        res.update({
            "msg_n": n, "msg_covered": len(mp), "msg_acc": correct / n if n else 0,
            "skill_flagged": skill_flagged, "skill_total": skill_total,
            "real_missed": real_missed, "real_msg_total": real_total,
            "lvl_acc": lv_ok / lv_total if lv_total else 0, "confusion": conf,
        })
    return res


# ----------------------------------------------------------------------------
# report
# ----------------------------------------------------------------------------
def pct(x):
    return f"{100 * x:.0f}%"


def table(results):
    head = ("| System | Real issues found | False alarms | Duplicates | #1 priority right | Top-3 match | "
            "Bug vs balance right | Player reports linked per issue | Message category accuracy | "
            "\"Too hard\" complaints wrongly flagged | Level read correctly |")
    sep = "|" + "---|" * 11
    rows = [head, sep]
    for r in results:
        m = "msg_acc" in r
        rows.append("| " + " | ".join([
            r["system"],
            f"{len(r['found'])}/{r['real_total']}",
            str(len(r["false_alarms"])),
            str(r["duplicates"]),
            "yes" if r["top1"] else "no",
            f"{r['top3']}/3",
            f"{r['cat_ok']}/{r['cat_total']}" if r["cat_total"] else "n/a",
            f"{r['evidence']:.1f}",
            pct(r["msg_acc"]) if m else "n/a",
            f"{r['skill_flagged']}/{r['skill_total']}" if m else "n/a",
            pct(r["lvl_acc"]) if m else "n/a",
        ]) + " |")
    return "\n".join(rows)


def details(r, gt):
    out = [f"### {r['system']}"]
    if r["missed"]:
        out.append("- **Missed real issues:** " + "; ".join(f"{i} ({gt[i]['title']})" for i in r["missed"]))
    if r["false_alarms"]:
        out.append("- **False alarms:** " + "; ".join(
            f"'{p.get('title', '?')}' (level {p.get('level')}) -> actually {p['_gt']}" for p in r["false_alarms"]))
    if r["good_dismiss"]:
        out.append("- **Correctly dismissed (verified as not a real issue):** " + "; ".join(
            f"'{p.get('title', '?')}' -> {p['_gt']}" for p in r["good_dismiss"]))
    if r["bad_dismiss"]:
        out.append("- **Wrongly dismissed real issues:** " + "; ".join(
            f"'{p.get('title', '?')}' -> {p['_gt']}" for p in r["bad_dismiss"]))
    if r["watch"]:
        out.append("- **Watch list (not counted as reported):** " + "; ".join(
            f"'{p.get('title', '?')}' -> {p['_gt']}" for p in r["watch"]))
    if "msg_acc" in r:
        out.append(f"- Messages scored: {r['msg_n']} (system returned {r['msg_covered']}); "
                   f"real-issue reports missed: {r['real_missed']}/{r['real_msg_total']}")
        conf = r["confusion"]
        out.append("")
        out.append("| true \\ predicted | " + " | ".join(CATS) + " |")
        out.append("|---|" + "---|" * len(CATS))
        for t in CATS:
            out.append(f"| {t} | " + " | ".join(str(conf[(t, p)]) for p in CATS) + " |")
    return "\n".join(out)


def read_pred_csv(path, name):
    with open(path, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    msgs = [{"id": r["id"].strip(), "category": (r.get("category") or "noise").strip().lower(),
             "level": to_int((r.get("level") or "").strip())} for r in rows if (r.get("category") or "").strip()]
    return {"system": name or Path(path).stem, "messages": msgs,
            "issues": issues_from_message_preds(msgs, min_messages=2),
            "_only_ids": {r["id"].strip() for r in rows}}


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--scenario", choices=["A", "B"], required=True)
    ap.add_argument("--split", choices=["dev", "test", "heldout", "all"], default=None,
                    help="default: test for A, heldout for B")
    ap.add_argument("--pred", action="append", default=[], help="prediction JSON (repeatable)")
    ap.add_argument("--pred-csv", action="append", default=[], help="message-level CSV with id,category,level")
    ap.add_argument("--name", default=None, help="display name for --pred-csv")
    ap.add_argument("--no-baselines", action="store_true")
    args = ap.parse_args()

    split = args.split or ("test" if args.scenario == "A" else "heldout")
    messages, telemetry, game, labels, gt_issues = load(args.scenario)
    split_ids = [m["id"] for m in messages if split == "all" or labels[m["id"]]["split"] == split]
    split_msgs = [m for m in messages if m["id"] in set(split_ids)]

    preds = []
    if not args.no_baselines:
        preds += [b(split_msgs, telemetry) for b in BASELINES]
    for p in args.pred:
        d = json.load(open(p, encoding="utf-8"))
        d.setdefault("system", Path(p).stem)
        preds.append(d)
    for p in args.pred_csv:
        preds.append(read_pred_csv(p, args.name))

    results = [score(p, labels, gt_issues, split_ids) for p in preds]
    gt = {g["issue_id"]: g for g in gt_issues}

    report = [f"# PlayerPulse evaluation - scenario {args.scenario} ({game['game']}), split: {split}",
              f"Messages in split: {len(split_ids)} | real issues planted: {results[0]['real_total'] if results else '?'}",
              "", table(results), "", "## Details (use these as failure examples)", ""]
    report += [details(r, gt) + "\n" for r in results]
    report.append("## Ground truth (real issues, by priority)")
    for g in sorted([g for g in gt_issues if g["category"] in REAL], key=lambda g: g["priority_rank"]):
        report.append(f"{g['priority_rank']}. {g['issue_id']} [{g['category']}] level {g['level']}: {g['title']} "
                      f"(est. players lost: {g['players_lost_estimate']})")
    text = "\n".join(report)

    out = ROOT / "results"
    out.mkdir(exist_ok=True)
    path = out / f"scenario_{args.scenario}_{split}.md"
    path.write_text(text, encoding="utf-8")
    print(text)
    print(f"\nreport written to {path}")


if __name__ == "__main__":
    main()
