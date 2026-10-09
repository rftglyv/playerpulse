# PlayerPulse evaluation - scenario A (Ember Trail (fictional)), split: test
Messages in split: 134 | real issues planted: 5

| System | Real issues found | False alarms | Duplicates | #1 priority right | Top-3 match | Bug vs balance right | Player reports linked per issue | Message category accuracy | "Too hard" complaints wrongly flagged | Level read correctly |
|---|---|---|---|---|---|---|---|---|---|---|
| Baseline: keyword filter | 5/5 | 2 | 1 | no | 2/3 | 5/5 | 8.6 | 59% | 16/23 | 56% |
| Baseline: most-mentioned levels | 4/5 | 1 | 0 | yes | 2/3 | 3/4 | 8.5 | 55% | 13/23 | 56% |
| Baseline: analytics drop-off alert only | 3/5 | 0 | 0 | yes | 3/3 | n/a | 0.0 | n/a | n/a | n/a |
| PlayerPulse extract_v1 (community-only) | 4/5 | 0 | 0 | yes | 2/3 | 4/4 | 17.2 | 89% | 0/23 | 100% |
| PlayerPulse extract_v1 (with telemetry) | 5/5 | 0 | 0 | yes | 3/3 | 5/5 | 17.8 | 100% | 0/23 | 100% |

## Details (use these as failure examples)

### Baseline: keyword filter
- **False alarms:** 'complaints about level 3' (level 3) -> actually A-SKILL-03; 'complaints about level 5' (level 5) -> actually A-SKILL-05
- Messages scored: 134 (system returned 134); real-issue reports missed: 27/66

| true \ predicted | bug | balance | skill_issue | noise |
|---|---|---|---|---|
| bug | 34 | 0 | 0 | 17 |
| balance | 0 | 5 | 0 | 10 |
| skill_issue | 7 | 9 | 0 | 7 |
| noise | 5 | 0 | 0 | 40 |

### Baseline: most-mentioned levels
- **Missed real issues:** A-ISS-05 (Russian localisation text overlaps / is cut off in the Archive level)
- **False alarms:** 'complaints about level 3' (level 3) -> actually A-SKILL-03
- Messages scored: 134 (system returned 134); real-issue reports missed: 29/66

| true \ predicted | bug | balance | skill_issue | noise |
|---|---|---|---|---|
| bug | 31 | 0 | 0 | 20 |
| balance | 6 | 0 | 0 | 9 |
| skill_issue | 13 | 0 | 0 | 10 |
| noise | 2 | 0 | 0 | 43 |

### Baseline: analytics drop-off alert only
- **Missed real issues:** A-ISS-04 (Old Mill checkpoint shows 'saved' but progress is lost on reload); A-ISS-05 (Russian localisation text overlaps / is cut off in the Archive level)

### PlayerPulse extract_v1 (community-only)
- **Missed real issues:** A-ISS-03 (Magma Warden boss HP/damage buff in 1.4 made the fight far too hard)
- **Watch list (not counted as reported):** '"Clocktower (level 5) is too hard" complaints' -> A-SKILL-05; '"Thorn Canyon (level 3) is too hard" complaints' -> A-SKILL-03; '"Magma Warden (boss) (level 6) is too hard" complaints' -> A-ISS-03; 'Controls problem on Thorn Canyon (level 3)' -> A-SKILL-03
- Messages scored: 134 (system returned 134); real-issue reports missed: 15/66

| true \ predicted | bug | balance | skill_issue | noise |
|---|---|---|---|---|
| bug | 51 | 0 | 0 | 0 |
| balance | 0 | 0 | 15 | 0 |
| skill_issue | 0 | 0 | 23 | 0 |
| noise | 0 | 0 | 0 | 45 |

### PlayerPulse extract_v1 (with telemetry)
- **Correctly dismissed (verified as not a real issue):** '"Clocktower (level 5) is too hard" complaints' -> A-SKILL-05; '"Thorn Canyon (level 3) is too hard" complaints' -> A-SKILL-03
- **Watch list (not counted as reported):** 'Controls problem on Thorn Canyon (level 3)' -> A-SKILL-03
- Messages scored: 134 (system returned 134); real-issue reports missed: 0/66

| true \ predicted | bug | balance | skill_issue | noise |
|---|---|---|---|---|
| bug | 51 | 0 | 0 | 0 |
| balance | 0 | 15 | 0 | 0 |
| skill_issue | 0 | 0 | 23 | 0 |
| noise | 0 | 0 | 0 | 45 |

## Ground truth (real issues, by priority)
1. A-ISS-01 [bug] level 4: Player falls through the floor after the second bridge (collision), since 1.4 (est. players lost: 2946)
2. A-ISS-03 [balance] level 6: Magma Warden boss HP/damage buff in 1.4 made the fight far too hard (est. players lost: 462)
3. A-ISS-02 [bug] level 7: Crash to desktop when opening inventory during the Frost Keep boss fight (est. players lost: 333)
4. A-ISS-04 [bug] level 2: Old Mill checkpoint shows 'saved' but progress is lost on reload (est. players lost: 229)
5. A-ISS-05 [bug] level 9: Russian localisation text overlaps / is cut off in the Archive level (est. players lost: 3)