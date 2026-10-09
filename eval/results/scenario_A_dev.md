# PlayerPulse evaluation - scenario A (Ember Trail (fictional)), split: dev
Messages in split: 46 | real issues planted: 5

| System | Real issues found | False alarms | Duplicates | #1 priority right | Top-3 match | Bug vs balance right | Player reports linked per issue | Message category accuracy | "Too hard" complaints wrongly flagged | Level read correctly |
|---|---|---|---|---|---|---|---|---|---|---|
| Baseline: keyword filter | 4/5 | 2 | 0 | no | 1/3 | 4/4 | 2.8 | 57% | 6/8 | 77% |
| Baseline: most-mentioned levels | 1/5 | 1 | 0 | yes | 1/3 | 1/1 | 7.0 | 63% | 7/8 | 77% |
| Baseline: analytics drop-off alert only | 3/5 | 0 | 0 | yes | 3/3 | n/a | 0.0 | n/a | n/a | n/a |

## Details (use these as failure examples)

### Baseline: keyword filter
- **Missed real issues:** A-ISS-05 (Russian localisation text overlaps / is cut off in the Archive level)
- **False alarms:** 'complaints about level None' (level None) -> actually NOISE; 'complaints about level 3' (level 3) -> actually A-SKILL-03
- Messages scored: 46 (system returned 46); real-issue reports missed: 10/23

| true \ predicted | bug | balance | skill_issue | noise |
|---|---|---|---|---|
| bug | 11 | 0 | 0 | 7 |
| balance | 0 | 2 | 0 | 3 |
| skill_issue | 1 | 5 | 0 | 2 |
| noise | 2 | 0 | 0 | 13 |

### Baseline: most-mentioned levels
- **Missed real issues:** A-ISS-02 (Crash to desktop when opening inventory during the Frost Keep boss fight); A-ISS-03 (Magma Warden boss HP/damage buff in 1.4 made the fight far too hard); A-ISS-04 (Old Mill checkpoint shows 'saved' but progress is lost on reload); A-ISS-05 (Russian localisation text overlaps / is cut off in the Archive level)
- **False alarms:** 'complaints about level 3' (level 3) -> actually A-SKILL-03
- Messages scored: 46 (system returned 46); real-issue reports missed: 6/23

| true \ predicted | bug | balance | skill_issue | noise |
|---|---|---|---|---|
| bug | 15 | 0 | 0 | 3 |
| balance | 2 | 0 | 0 | 3 |
| skill_issue | 7 | 0 | 0 | 1 |
| noise | 1 | 0 | 0 | 14 |

### Baseline: analytics drop-off alert only
- **Missed real issues:** A-ISS-04 (Old Mill checkpoint shows 'saved' but progress is lost on reload); A-ISS-05 (Russian localisation text overlaps / is cut off in the Archive level)

## Ground truth (real issues, by priority)
1. A-ISS-01 [bug] level 4: Player falls through the floor after the second bridge (collision), since 1.4 (est. players lost: 2946)
2. A-ISS-03 [balance] level 6: Magma Warden boss HP/damage buff in 1.4 made the fight far too hard (est. players lost: 462)
3. A-ISS-02 [bug] level 7: Crash to desktop when opening inventory during the Frost Keep boss fight (est. players lost: 333)
4. A-ISS-04 [bug] level 2: Old Mill checkpoint shows 'saved' but progress is lost on reload (est. players lost: 229)
5. A-ISS-05 [bug] level 9: Russian localisation text overlaps / is cut off in the Archive level (est. players lost: 3)