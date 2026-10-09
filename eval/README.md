# PlayerPulse test pack

Test data and a scoring script for PlayerPulse: it turns player complaints plus gameplay data (telemetry) into verified, prioritised issues.

Everything in `data/` is **synthetic**: two fictional games, fictional players, planted issues. The answer key says exactly what is planted, so every number you report comes from a real, repeatable run.

## Folder map

| Path | What it is |
|---|---|
| `data/scenario_A/` | **Ember Trail**: 2D platformer, 10 levels, patch 1.4. 180 messages (46 dev, 134 test) |
| `data/scenario_B/` | **Hollow Harbor**: co-op shooter, 8 missions, patch 2.1. 66 messages. **Held out: never tune on it** |
| `data/*/messages.csv` | `id, timestamp, channel, author, text`: Discord, Steam and in-game posts in Azerbaijani, Russian, English and mixed |
| `data/*/telemetry.csv` | Per level, previous vs current patch: `players_started, players_completed, completion_rate, deaths_per_player, restarts_per_player, error_reports, median_minutes` |
| `data/*/game_info.json` | Level names (so "the bridge level" means level 4) and patch notes |
| `answer_key/` | Labels for every message plus the planted issues and their true priority. **Your app must never read this folder. Don't deploy it.** |
| `evaluate.py` | Scores your output and compares it with 3 baselines. Python 3.8+, no installs |
| `manual_triage/sheet_to_fill.csv` | 60 messages for the timed human baseline |
| `tools/fetch_steam_reviews.py` | Pulls real public Steam reviews for the real-data test (run on your laptop) |
| `real_data/hotfix_check_template.csv` | Fill-in table for the real-data test |
| `examples/predictions_example.json` | **The exact output format your app must write** (the IDs in it are illustrative only) |
| `tools/generate_data.py` | How the data was made (re-run gives identical files) |

## What's planted

**Scenario A (Ember Trail, patch 1.4)**

| # | Level | Type | Issue | Telemetry signature |
|---|---|---|---|---|
| 1 | 4 Twin Bridges | bug | Fall through the floor after the 2nd bridge | completion 80→43%, deaths flat. A blocker, not difficulty |
| 2 | 6 Magma Warden | balance | Boss buffed too much | deaths/player 4.1→8.3, completion 70→51% |
| 3 | 7 Frost Keep | bug | Crash opening inventory in boss fight | error reports 4→418 |
| 4 | 2 Old Mill | bug | Checkpoint save lost on reload | restarts 1.1→1.8, completion barely moves |
| 5 | 9 Archive | bug | Russian text overlaps the UI | none. Cosmetic |
| ✗ | 3 Thorn Canyon | skill issue | "Impossible / broken" complaints (22, the loudest group) | nothing changed. **Should be dismissed** |
| ✗ | 5 Clocktower | skill issue | "Timer too short" | nothing changed. **Should be dismissed** |

Plus 60 noise posts (toxicity, feature requests, praise, price and account complaints, vague "so buggy").

Hard cases on purpose: sarcasm ("10/10 physics, gravity mode unlocked"), level by name not number, code-switching (`ikinci mostdan sonra проваливаюсь`), one specific-sounding false bug ("wall jump doesn't work" on level 3, where telemetry is normal).

**Scenario B (held out):** a soft-lock bug (key never spawns, mission 7), a co-op disconnect bug (mission 5), an ammo nerf (balance, mission 3), and a controls bug with no telemetry signal (mission 4). Plus two "too hard" groups with normal telemetry (missions 2 and 6).

**True priority** = players lost: players who started the level on the new patch × the drop in completion rate. Issues with no telemetry effect rank last.

## The rule your pipeline should follow

> **Telemetry doesn't silence bugs; it settles arguments.**

- **Specific technical bug** (crash, falling through the map, save lost, item missing, text overlap, controls not responding): always report it. Telemetry only sets its priority.
- **"Too hard / impossible / unfair / broken" with no specific technical symptom:** check telemetry for that level.
  - Deaths per player up ≥1.4× **or** completion down ≥5 points → **confirmed balance issue**.
  - Otherwise → **dismiss as skill issue** and show the numbers ("completion 85%→84%, deaths 3.2→3.3").
- **A bug claim from a single player with no telemetry signal** → `"status": "watch"`, not reported yet.

## Suggested pipeline

1. **Extract (AI)**, in batches of ~20 messages. Give the model `game_info.json` (level names and patch notes). Ask for JSON only:

   ```json
   {"id": "A004", "level": 4, "mechanic": "collision", "symptom": "falls through floor after second bridge",
    "category": "bug | difficulty_claim | noise", "specific_technical_symptom": true, "confidence": 0.0}
   ```

   Prompt rules worth stating explicitly:
   - Messages can be Azerbaijani, Russian, English or mixed.
   - Sarcasm counts as a report if it describes a real symptom.
   - Map level names to numbers using the level list.
   - Toxicity, praise, feature requests, price or account complaints, and vague "so buggy" with no detail are `noise`.
2. **Group**: same level + same mechanic/symptom. Use code, or one AI call over the extracted list.
3. **Verify (code, not AI)**: apply the rule above using `telemetry.csv`. Compute `players_lost_estimate` and sort.
4. **Ticket (AI)**: title, evidence quotes, telemetry evidence, likely cause from the patch notes, reproduction steps.
5. **Write** `predictions.json` in the format of `examples/predictions_example.json`. Every message gets a category from `bug, balance, skill_issue, noise`. Every issue gets `status` from `reported, dismissed, watch`, a `priority`, and `message_ids`.

## How to test (do these in order)

```bash
# 1. Baselines: already measured below, re-run anytime
python evaluate.py --scenario A

# 2. Your system on scenario A test split (tune prompts ONLY on the dev split)
python evaluate.py --scenario A --pred out/pp_A.json

# 3. Proof that telemetry matters: run once with telemetry switched off
python evaluate.py --scenario A --pred out/pp_A_no_telemetry.json --pred out/pp_A.json

# 4. Held-out scenario, never seen during tuning
python evaluate.py --scenario B --pred out/pp_B.json

# 5. Human baseline: a teammate fills manual_triage/sheet_to_fill.csv
#    (category = bug/balance/skill_issue/noise, level = number) WITH A TIMER,
#    allowed to look at telemetry.csv. Record minutes taken.
python evaluate.py --scenario A --pred-csv manual_triage/sheet_to_fill.csv --name "Human, 60 msgs, XX min"
```

Each run writes a markdown report to `results/`. The **Details** section lists missed issues, false alarms and dismissals by name. Those are your failure examples.

**Real data (step 6):** pick a game with a known buggy patch and published hotfix notes. Fetch reviews between the patch and the hotfix with `tools/fetch_steam_reviews.py`, run PlayerPulse in community-only mode, then fill `real_data/hotfix_check_template.csv`. The headline number is "PlayerPulse surfaced X of Y hotfixed bugs, the first report appearing Z hours before the fix was announced."

## Metrics

| Column | Meaning |
|---|---|
| Real issues found | Planted bugs/balance issues matched by at least one reported issue (matched by majority of its `message_ids`) |
| False alarms | Reported issues that are actually skill-issue complaints or noise |
| Duplicates | Extra reported issues for an already-found real issue |
| #1 priority right / Top-3 match | Your priority order vs true players-lost order |
| Bug vs balance right | Correct type on found issues |
| Player reports linked per issue | Evidence attached to each found issue (analytics alone = 0) |
| Message category accuracy | 4-way label accuracy per message |
| "Too hard" complaints wrongly flagged | Skill-issue messages you labelled bug or balance |
| Level read correctly | Level extracted correctly (many messages use names, not numbers) |

## Baseline results (measured with this script)

**Scenario A, test split (134 messages, 5 real issues)**

| System | Real issues found | False alarms | #1 right | Top-3 | Message accuracy | "Too hard" wrongly flagged | Level correct |
|---|---|---|---|---|---|---|---|
| Keyword filter | 5/5 | 2 | no | 2/3 | 59% | 16/23 | 56% |
| Most-mentioned levels | 4/5 | 1 | yes | 2/3 | 55% | 13/23 | 56% |
| Analytics drop-off alert only | 3/5 | 0 | yes | 3/3 | n/a | n/a | n/a |

**Scenario B, held out (66 messages, 4 real issues)**

| System | Real issues found | False alarms | #1 right | Top-3 | Message accuracy | "Too hard" wrongly flagged | Level correct |
|---|---|---|---|---|---|---|---|
| Keyword filter | 4/4 | 2 | no | 1/3 | 38% | 14/15 | 64% |
| Most-mentioned levels | 3/4 | 1 | no | 2/3 | 50% | 9/15 | 64% |
| Analytics drop-off alert only | 3/4 | 0 | yes | 3/3 | n/a | n/a | n/a |

How to read them:
- **Keyword filters catch everything but flag the loud "impossible" crowd as bugs.**
- **Counting mentions ranks the loudest level, not the most damaging one.**
- **Analytics alone gets the priority right but misses bugs that don't move completion,** and can't say what is wrong (0 player reports attached).

PlayerPulse has to beat all three at once.

## Honesty notes (put these on the testing slide)

- The data is synthetic and was written by the team, with planted issues. Say so.
- True priority is defined by a telemetry formula. State the formula.
- Tune only on scenario A **dev**. Report A **test** and B **held out**.
- Show at least two real failures from the Details section and what you changed.

## Disclosure text (paste into the submission form)

> Test data (two fictional games with synthetic player messages and telemetry) and the evaluation script were generated with Claude (Anthropic) during the hackathon. Planted issues and labels are in `answer_key/`. The app does not read the answer key.
