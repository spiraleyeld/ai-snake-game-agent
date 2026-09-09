# BENCHMARK_NOTES — Snake Agent Experiments

> Detailed benchmark and experiment evidence supporting current architecture decisions.
> Current board geometry: 32×12 / 384 cells.
> Use PROJECT_MAP.md for current architecture and ownership.
> Use this file for benchmark evidence and experimental interpretation.
> Invalidated benchmark conclusions are replaced by corrected evidence rather than retained as active results.

---

## 1. Benchmark Modes

### runLocalBenchmark(seed, maxSteps, policy?)

Without explicit policy:

```text
initial strategy = EAT_SAFE_FOOD
_fixedPolicy = false
existing non-fixed-policy EAT_SAFE_FOOD benchmark behavior is preserved
Qwen may still be reachable through normal failure flow
```

With explicit policy:

```text
fresh ActiveStrategy
_fixedPolicy = true
same GameEngine lifecycle
same SafetyLayer path
Qwen disabled for entire fixed-policy run
```

Supported explicit fixed policies:

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

Important:

```text
fixed policy ≠ fixed direction
```

SafetyLayer may still override the immediate direction while preserving policy identity.

LOOP / STAGNATION may still terminate the benchmark.

Termination reasons include:

```text
ENGINE_GAME_OVER
LOOP_DETECTED
STAGNATION_DETECTED
NO_MOVE
MAX_STEPS
```

Do not treat:

```text
NO_MOVE
LOOP_DETECTED
STAGNATION_DETECTED
```

as equivalent to engine GameOver.

---

## 2. Fixed-Policy Evidence — 500-Step Comparison

Seeds:

```text
1001–1005
```

maxSteps:

```text
500
```

Results:

```text
EAT_SAFE_FOOD
average score: 33.4
average steps: 500
MAX_STEPS: 5/5

CREATE_SPACE
average score: 32.2
average steps: 500
MAX_STEPS: 5/5

SAFE_CHASE
average score: 4.0
average steps: 129
LOOP_DETECTED: 5/5
```

Interpretation:

```text
At the 500-step horizon,
EAT_SAFE_FOOD and CREATE_SPACE were not separated by survival,
because both hit MAX_STEPS in all 5 seeds.
```

Do not interpret this as proof that long-run survival is equivalent.

SAFE_CHASE was substantially worse in this batch.

---

## 3. Fixed-Policy Evidence — 2000-Step Comparison

Seeds:

```text
1001–1005
```

maxSteps:

```text
2000
```

### EAT_SAFE_FOOD

```text
1001 → score 96 / steps 1736 / STAGNATION_DETECTED
1002 → score 88 / steps 1875 / STAGNATION_DETECTED
1003 → score 97 / steps 2000 / MAX_STEPS
1004 → score 83 / steps 1596 / NO_MOVE
1005 → score 105 / steps 2000 / MAX_STEPS

average score: 93.8
average steps: 1841.4
```

### CREATE_SPACE

```text
1001 → score 63
1002 → score 49
1003 → score 76
1004 → score 51
1005 → score 45

average score: 56.8
average steps: 1170.6
STAGNATION_DETECTED: 5/5
MAX_STEPS: 0/5
```

Interpretation:

```text
CREATE_SPACE is not supported by current evidence
as a whole-run primary policy.
```

Current best role:

```text
temporary recovery / reorganization capability
```

rather than default whole-run control.

---

## 4. CREATE_SPACE Recovery Benchmark

### runRecoveryBenchmark(seed, maxSteps, recoverySteps = 40)

Corrected controlled lifecycle:

```text
start fixed EAT_SAFE_FOOD

→ first STAGNATION_DETECTED
→ assign fresh CREATE_SPACE ActiveStrategy
→ resetProgressTracking()
→ _lastTrigger = '-'

→ run CREATE_SPACE for recoverySteps
→ repeated STAGNATION does not terminate
  while CREATE_SPACE recovery is active

→ assign fresh EAT_SAFE_FOOD ActiveStrategy
→ resetProgressTracking()
→ _lastTrigger = '-'

→ continue benchmark
```

Only one CREATE_SPACE recovery episode is allowed per run.

Later STAGNATION outside the recovery phase terminates normally.

Qwen is disabled for the entire recovery benchmark.

Important implementation invariant:

```text
The benchmark must update activeStrategy itself.

Changing only a local phase variable does not change
the strategy executed by runStep().
```

Important harness invariant:

```text
STAGNATION_DETECTED during active CREATE_SPACE recovery
must not terminate the benchmark before recoverySteps
are exhausted.
```

This 40-step automatic recovery lifecycle is benchmark-only.

Normal runtime does not automatically switch to CREATE_SPACE for 40 steps.

---

## 5. Corrected CREATE_SPACE Recovery Evidence

Controlled seeds:

```text
1001–1005
+
2001–2020
=
25 seeds
```

Parameters:

```text
maxSteps: 2000
recoverySteps: 40
baseline policy: EAT_SAFE_FOOD
recovery policy: CREATE_SPACE
```

Baseline termination counts:

```text
MAX_STEPS:            16
NO_MOVE:               6
STAGNATION_DETECTED:   3
```

Corrected recovery termination counts:

```text
MAX_STEPS:            19
NO_MOVE:               6
STAGNATION_DETECTED:   0
```

Recovery trigger coverage:

```text
triggered:   3/25
completed:   3/3 triggered
not triggered: 22/25
```

Only these baseline runs reached STAGNATION and triggered recovery:

```text
1001
1002
2009
```

All three completed the full recovery episode.

### Seed 1001

```text
Baseline:
score 96
steps 1736
STAGNATION_DETECTED

Corrected recovery:
score 105
steps 2000
MAX_STEPS

Δ score: +9
Δ steps: +264
```

### Seed 1002

```text
Baseline:
score 88
steps 1875
STAGNATION_DETECTED

Corrected recovery:
score 93
steps 2000
MAX_STEPS

Δ score: +5
Δ steps: +125
```

### Seed 2009

```text
Baseline:
score 64
steps 1198
STAGNATION_DETECTED

Corrected recovery:
score 95
steps 2000
MAX_STEPS

Δ score: +31
Δ steps: +802
```

Average improvement among actual recovery episodes:

```text
average Δ score:
+15.0

average Δ steps:
+397
```

The other 22 seeds did not trigger recovery.

Their baseline and recovery outcomes were identical.

This is important control evidence:

```text
22/22 non-triggered runs were unchanged.
```

Interpretation:

```text
CREATE_SPACE as whole-run primary policy:
poor fit

CREATE_SPACE as short STAGNATION recovery:
promising
```

Current evidence strength:

```text
actual recovery episodes = 3

triggered:
3/3 completed
3/3 improved

non-triggered:
22/22 identical to baseline
```

Therefore:

```text
The recovery effect is repeatable in the three
currently observed STAGNATION cases,
but the sample of actual recovery episodes remains small.
```

Do not generalize this into proof that CREATE_SPACE solves all late-game failures.

---

## 6. Known NO_MOVE Failure Seeds

Known NO_MOVE seeds include:

```text
1004
2005
2006
2008
2014
2015
```

These cases terminated before STAGNATION recovery could help.

Current CREATE_SPACE recovery evidence therefore does NOT solve:

```text
rapid trap
NO_MOVE
death-before-trigger
```

This remains a separate failure class.

The corrected recovery benchmark preserves this distinction:

```text
Recovery improved STAGNATION cases.

It did not change NO_MOVE cases that never triggered recovery.
```

---

## 7. LOW_MOBILITY Death-Window Evidence

Known fixed EAT_SAFE_FOOD NO_MOVE runs:

### Seed 1004

```text
score: 83
steps: 1596
termination: NO_MOVE

maxLowMobilityStreak: 16
lastLowStreakBeforeDeadEnd: 7
deadEndEventCount: 1
```

### Seed 2005

```text
score: 85
steps: 1596
termination: NO_MOVE

maxLowMobilityStreak: 14
lastLowStreakBeforeDeadEnd: 1
deadEndEventCount: 1
```

### Seed 2006

```text
score: 77
steps: 1443
termination: NO_MOVE

maxLowMobilityStreak: 9
lastLowStreakBeforeDeadEnd: 9
deadEndEventCount: 1
```

### Seed 2008

```text
score: 92
steps: 1916
termination: NO_MOVE

maxLowMobilityStreak: 18
lastLowStreakBeforeDeadEnd: 8
deadEndEventCount: 1
```

Known MAX_STEPS controls:

### Seed 1003

```text
score: 97
steps: 2000
termination: MAX_STEPS

maxLowMobilityStreak: 19
lastLowStreakBeforeDeadEnd: 0
deadEndEventCount: 0
```

### Seed 1005

```text
score: 105
steps: 2000
termination: MAX_STEPS

maxLowMobilityStreak: 16
lastLowStreakBeforeDeadEnd: 0
deadEndEventCount: 0
```

Interpretation:

```text
LOW_MOBILITY persistence has warning value,
but poor specificity.
```

Surviving MAX_STEPS controls can have LOW_MOBILITY streaks as long as or longer than death runs.

Therefore thresholds such as:

```text
currentLowMobilityStreak >= 3
currentLowMobilityStreak >= 5
currentLowMobilityStreak >= 8
```

are not currently justified as PRE_TRAP triggers.

Also:

```text
lastLowStreakBeforeDeadEnd
deadEndEventCount
```

are mainly post-event diagnostics rather than early-warning triggers.

---

## 8. Reachable-Space Drop Telemetry

Current implementation adds:

```text
maxLowMobilityReachableDrop
lastLowMobilityReachableDropBeforeDeadEnd
```

Semantics:

```text
LOW_MOBILITY episode begins
→ capture reachableCells at episode start

episode continues
→ compare current reachableCells to episode-start value
→ track largest drop

transition to DEAD_END_IMMINENT
→ preserve that episode drop
```

Important design rule:

```text
Do not sum every negative delta across the run.
```

Example:

```text
100 → 80 → 100 → 80
```

must not become:

```text
40 total deterioration
```

The metric is episode-relative.

Current evidence status:

```text
implementation: PASS
build: PASS
runtime benchmark evidence: NOT YET COLLECTED
```

Next comparison should use:

```text
known NO_MOVE / death seeds
vs
MAX_STEPS controls
```

and inspect:

```text
maxLowMobilityReachableDrop
lastLowMobilityReachableDropBeforeDeadEnd
```

before designing PRE_TRAP semantics.

---

## 9. Real Runtime Death Evidence

Observed normal-runtime death:

```text
Strategy = EAT_SAFE_FOOD
Score = 103
Steps = 2246
Status = GAME-OVER
Last Trigger = -
Live Stag = 18 / 80
LLM Calls = 0
Danger = DEAD_END_IMMINENT
Reachable = 1
```

Interpretation:

```text
Some deaths occur before LOOP/STAGNATION
has enough time to summon Qwen.
```

This proves trigger timing can be too late.

It does NOT prove:

```text
DEAD_END_IMMINENT → Qwen
```

should be implemented.

At DEAD_END_IMMINENT, recovery may already be too late.

The research target is the warning window before collapse.

---

## 10. Current Trigger Research Conclusion

Current evidence supports:

```text
LOW_MOBILITY streak:
warning value
poor specificity

reachable-space episode drop:
implemented
evidence pending

DEAD_END_IMMINENT:
too late in at least some situations

PRE_TRAP:
not implemented
```

Current research question:

```text
Does reachable-space collapse during LOW_MOBILITY
provide earlier and more specific warning
than LOW_MOBILITY streak duration alone?
```

Do not implement a trigger threshold before controlled evidence exists.

---

## 11. Board-Geometry Comparability

Current geometry:

```text
32×12
384 cells
```

Historical geometry:

```text
32×24
768 cells
```

Do not directly compare absolute values across these board sizes.

Geometry affects:

```text
state space
occupancy ratio
reachable-cell count
mobility
food candidate rejection
time-to-fill
death timing
```

Historical SAFE_CHASE-default runs are also not directly comparable to current EAT_SAFE_FOOD-default runs.

Prefer normalized evidence where useful:

```text
reachable ratio
body occupancy ratio
reachable trend
survivable-move trend
```

---

## 12. Current Benchmark Conclusions

High-confidence conclusions:

```text
EAT_SAFE_FOOD
→ current preferred default

SAFE_CHASE
→ poor fixed-policy benchmark performance
→ remains heuristic/fallback capability

CREATE_SPACE whole-run
→ poor fit

CREATE_SPACE short STAGNATION recovery
→ promising
→ corrected runtime:
   3/25 triggered
   3/3 completed
   3/3 improved
   22/22 non-triggered identical to baseline
→ evidence still small because only 3 recovery episodes occurred

NO_MOVE
→ unresolved failure class
→ unaffected in current recovery benchmark when no STAGNATION trigger occurs

LOW_MOBILITY streak alone
→ insufficiently specific for PRE_TRAP

reachable-space episode drop
→ current next evidence axis
→ implementation/build complete
→ runtime evidence pending
```

Do not judge future planner or trigger changes from one lucky high-score run.

Prefer controlled seeded comparisons with explicit lifecycle semantics.