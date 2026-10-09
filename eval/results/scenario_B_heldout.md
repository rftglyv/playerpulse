# PlayerPulse evaluation - scenario B (Hollow Harbor (fictional)), split: heldout
Messages in split: 66 | real issues planted: 4

| System | Real issues found | False alarms | Duplicates | #1 priority right | Top-3 match | Bug vs balance right | Player reports linked per issue | Message category accuracy | "Too hard" complaints wrongly flagged | Level read correctly |
|---|---|---|---|---|---|---|---|---|---|---|
| Baseline: keyword filter | 4/4 | 2 | 1 | no | 1/3 | 2/4 | 4.5 | 38% | 14/15 | 64% |
| Baseline: most-mentioned levels | 3/4 | 1 | 0 | no | 2/3 | 2/3 | 6.3 | 50% | 9/15 | 64% |
| Baseline: analytics drop-off alert only | 3/4 | 0 | 0 | yes | 3/3 | n/a | 0.0 | n/a | n/a | n/a |
| PlayerPulse extract_v1 (with telemetry) | 4/4 | 0 | 0 | yes | 3/3 | 4/4 | 8.8 | 98% | 1/15 | 100% |

## Details (use these as failure examples)

### Baseline: keyword filter
- **False alarms:** 'complaints about level 2' (level 2) -> actually B-SKILL-02; 'complaints about level 6' (level 6) -> actually B-SKILL-06
- Messages scored: 66 (system returned 66); real-issue reports missed: 22/35

| true \ predicted | bug | balance | skill_issue | noise |
|---|---|---|---|---|
| bug | 8 | 2 | 0 | 16 |
| balance | 0 | 3 | 0 | 6 |
| skill_issue | 2 | 12 | 0 | 1 |
| noise | 2 | 0 | 0 | 14 |

### Baseline: most-mentioned levels
- **Missed real issues:** B-ISS-04 (Flashlight key stops working after remapping controls (Lighthouse) - no telemetry signal)
- **False alarms:** 'complaints about level 2' (level 2) -> actually B-SKILL-02
- Messages scored: 66 (system returned 66); real-issue reports missed: 12/35

| true \ predicted | bug | balance | skill_issue | noise |
|---|---|---|---|---|
| bug | 18 | 0 | 0 | 8 |
| balance | 5 | 0 | 0 | 4 |
| skill_issue | 9 | 0 | 0 | 6 |
| noise | 1 | 0 | 0 | 15 |

### Baseline: analytics drop-off alert only
- **Missed real issues:** B-ISS-04 (Flashlight key stops working after remapping controls (Lighthouse) - no telemetry signal)

### PlayerPulse extract_v1 (with telemetry)
- **Correctly dismissed (verified as not a real issue):** '"Storm Pier (mission 6) is too hard" complaints' -> B-SKILL-06; '"Silent Warehouse (stealth) (mission 2) is too hard" complaints' -> B-SKILL-02
- **Watch list (not counted as reported):** 'Other problem on Silent Warehouse (stealth) (mission 2)' -> B-SKILL-02
- Messages scored: 66 (system returned 66); real-issue reports missed: 0/35

| true \ predicted | bug | balance | skill_issue | noise |
|---|---|---|---|---|
| bug | 26 | 0 | 0 | 0 |
| balance | 0 | 9 | 0 | 0 |
| skill_issue | 1 | 0 | 14 | 0 |
| noise | 0 | 0 | 0 | 16 |

## Ground truth (real issues, by priority)
1. B-ISS-02 [balance] level 3: Ammo drops in Flooded Market reduced too much in 2.1 (est. players lost: 801)
2. B-ISS-01 [bug] level 5: Co-op partner desyncs and disconnects on the Cargo Lift elevator, since 2.1 (est. players lost: 587)
3. B-ISS-03 [bug] level 7: Harbor Master key item never spawns after the cutscene - soft lock (est. players lost: 482)
4. B-ISS-04 [bug] level 4: Flashlight key stops working after remapping controls (Lighthouse) - no telemetry signal (est. players lost: 0)