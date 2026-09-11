# PROJECT_MAP — Snake Game + Local Qwen Agent

> Current architecture/state map for fast onboarding.
> Reconciled through 2026-09-11 against current local source/runtime evidence.
> Current local production source checkpoint: `72ed55c` — `Add Hamiltonian-safe strategy foundation`.
> `72ed55c` has been committed locally; push to GitHub has NOT yet been verified.
> Latest previously verified pushed architecture source checkpoint: `6f0c8eb`.
> Latest previously verified pushed documentation checkpoint: `4a1415e`.
> Detailed benchmark evidence belongs in `BENCHMARK_NOTES.md`.
> OpenCode workflow / Git / context rules live in `AGENTS.md`.

---

## 0. Authority

Technical truth order:

~~~text
CURRENT LOCAL RUNTIME EVIDENCE
> CURRENT LOCAL SOURCE
> local git diff / git status
> latest GitHub main source
> PROJECT_MAP.md
> AGENTS.md
> current handoff / conversation evidence
> old assumptions
~~~

Rules:

~~~text
Source wins over PROJECT_MAP.

Local source/runtime wins over GitHub
when they differ.

GitHub absence does not prove
local/untracked absence.

AGENTS.md governs OpenCode workflow discipline.

PROJECT_MAP.md describes current architecture/state.
~~~

Current checkpoint caution:

~~~text
Local production source checkpoint:
72ed55c

Push status:
NOT YET VERIFIED

PROJECT_MAP.md:
currently being renewed after 72ed55c

Untracked research artifacts may still exist locally.
Their existence does NOT make them active runtime source.
~~~

Do not infer active ownership from legacy or untracked duplicate files.

---

## 1. Current Stack / Runtime

~~~text
Project:
D:\Projects\snake-game

Repository:
https://github.com/spiraleyeld/ai-snake-game-agent

Frontend:
Vanilla TypeScript + Vite + Canvas 2D

LM Studio:
http://127.0.0.1:1234

Dev app:
http://127.0.0.1:5173/

Canvas:
640×240

Grid:
20 px

Board:
32×12
384 cells
~~~

Current physical geometry:

~~~text
cols = 32
rows = 12
~~~

AgentController board constants:

~~~text
COLS = 32
ROWS = 12
~~~

Hamiltonian helper is intentionally fixed to:

~~~text
32×12
384 cells
~~~

Architecture debt:

~~~text
GameEngine derives board geometry from canvas/grid.

AgentController still owns explicit COLS/ROWS constants.

Hamiltonian cycle helper also owns fixed 32×12 geometry.
~~~

Any future board-size change must verify all three.

---

## 2. Active Runtime Ownership

Primary runtime object graph:

~~~text
src/main.ts
├─ GameEngine
│  → src/game/engine.ts
│
├─ Renderer
│  → src/game/renderer.ts
│
├─ InputHandler
│  → src/game/input.ts
│
├─ AgentController
│  → src/agent/agent-controller.ts
│
│  ├─ LmStudioClient
│  │  → src/agent/lm-studio-client.ts
│  │
│  ├─ SafetyLayer
│  │  → src/agent/safety-layer.ts
│  │
│  ├─ StrategyExecutor
│  │  → src/agent/strategy-executor.ts
│  │  └─ HamiltonianCycle32x12
│  │     → src/agent/hamiltonian-cycle-32x12.ts
│  │
│  ├─ AgentMemory
│  │  → src/agent/agent-memory.ts
│  │
│  ├─ PathPlanner
│  │  → src/agent/path-planner.ts
│  │
│  ├─ SnakeSimulator
│  │  → src/agent/snake-simulator.ts
│  │
│  ├─ SafeFoodValidator
│  │  → src/agent/safe-food-validator.ts
│  │
│  ├─ DangerMonitor
│  │  → src/agent/danger-monitor.ts
│  │
│  ├─ DangerEpisodeTracker
│  │  → src/agent/danger-episode-tracker.ts
│  │
│  └─ StagnationBudget
│     → src/agent/stagnation-budget.ts
│
└─ AgentPanel
   → src/agent-panel.ts
~~~

Important ownership distinction:

~~~text
hamiltonian-cycle-32x12.ts
= active production source
= deterministic helper used by StrategyExecutor

bench-hamiltonian-prep.ts
= possible untracked historical research artifact
= NOT imported by active production runtime
= NOT a StrategyPolicy
= NOT part of checkpoint 72ed55c
~~~

### Active UI

~~~text
Implementation:
src/agent-panel.ts

Styling:
src/style.css

Bootstrap/import:
src/main.ts
~~~

Desktop layout:

~~~text
Thinking | Snake | Control
   2     |   6   |    2
~~~

Current game frame:

~~~text
logical canvas = 640×240
aspect ratio = 8:3
middle-column width retained
game frame vertically centered
side panels remain full-height
~~~

### Known legacy / duplicate risk

Known local legacy/duplicate paths have included:

~~~text
src/agent/AgentPanel.jsx
src/agent/AgentPanel.css
src/agent/LMStudioClient.ts
src/agent/promptBuilder.ts
~~~

Do not treat these as active unless current imports prove otherwise.

Do not adopt, delete, stage, or modify them as a side effect of unrelated work.

---

## 3. Architecture Invariant

Core separation:

~~~text
Qwen
= slow high-level strategy / exception reasoning

Local TypeScript
= deterministic navigation / planning / simulation

SafetyLayer
= immediate legality

GameEngine
= physical state transition
~~~

Primary control model:

~~~text
Qwen
→ ActiveStrategy
→ local deterministic planner/executor
→ SafetyLayer
→ GameEngine
~~~

Do not regress Qwen into normal per-tick primitive direction control.

Qwen decides:

~~~text
what objective / strategy should matter now
~~~

Local TypeScript decides:

~~~text
how to execute that objective each tick
~~~

SafetyLayer decides:

~~~text
whether an immediate proposed move is legal
~~~

GameEngine decides:

~~~text
what physically happens after a move
~~~

---

## 4. Target Architecture

Current design target:

~~~text
Game State
    ↓
Situation / Context
    ↓
Qwen high-level decision
    ↓
Strategy selection
    ↓
Deterministic TypeScript navigation
    ↓
SafetyLayer
    ↓
GameEngine
~~~

Desired high-level strategy family:

~~~text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
HAMILTONIAN_SAFE
future structural recovery / preparation capability
~~~

Important:

~~~text
Not every target capability is currently production-integrated.
~~~

Current Hamiltonian status:

~~~text
HAMILTONIAN_SAFE executor support:
IMPLEMENTED

Automatic runtime switching into HAMILTONIAN_SAFE:
NOT IMPLEMENTED

Reliable Hamiltonian recovery / preparation:
NOT IMPLEMENTED

Qwen production selection of HAMILTONIAN_SAFE:
NOT IMPLEMENTED
~~~

Qwen should eventually choose among reliable high-level deterministic capabilities.

Qwen should not compensate for missing deterministic capabilities by issuing normal per-tick primitive moves.

---

## 5. GameEngine Semantics

Source:

~~~text
src/game/engine.ts
~~~

Directions:

~~~text
Up
Down
Left
Right
~~~

Game states:

~~~text
Start
Playing
Paused
GameOver
~~~

Fresh `start()`:

~~~text
3-segment snake near center
initial direction = Right
score = 0
speed = 150 ms
seeded RNG state resets when seed != null
spawnFood()
~~~

Logical tick:

~~~text
apply queued direction
→ compute new head
→ wall collision check
→ collision check against CURRENT FULL snake body
→ add new head
→ if food:
     score++
     grow
     spawn food
  else:
     remove tail
~~~

Critical collision rule:

~~~text
Current tail is still occupied during collision checking.

Tail removal happens only after the new head is accepted.

Moving into the current tail cell therefore collides.
~~~

Agent movement normally uses manual mode:

~~~text
engine.setManualMode(true)
engine.setDirection(direction)
engine.step()
~~~

When manual mode is enabled:

~~~text
normal animation-loop engine.tick()
does not move the snake
~~~

---

## 6. Deterministic Food RNG

GameEngine implements seeded food RNG.

Relevant state/API:

~~~text
_seed
_rngState
setSeed(seed | null)
getSeed()
random()
spawnFood()
~~~

Behavior:

~~~text
seed === null
→ Math.random()

seed !== null
→ deterministic local PRNG

start()
→ resets RNG state from seed
~~~

Debug use:

~~~javascript
window.__snakeDebug.setSeed(1001)
window.__snakeDebug.restart()
~~~

`setSeed(null)` restores non-deterministic food spawning.

Important:

~~~text
Same seed is reproducible only under the same board geometry
and the same execution path.

Different policies change occupied cells and therefore
can change later food placement behavior.
~~~

---

## 7. Strategy Policy State

Type source:

~~~text
src/agent/types.ts
~~~

Current type-level StrategyPolicy:

~~~text
SAFE_CHASE
EAT_SAFE_FOOD
CREATE_SPACE
HAMILTONIAN_SAFE
~~~

Production controller/Qwen lifecycle remains narrower.

Normal controller strategy creation / Qwen optimization currently centers on:

~~~text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
~~~

`HAMILTONIAN_SAFE` currently has:

~~~text
type support:
YES

executor support:
YES

automatic runtime selection:
NO

normal Qwen strategy selection:
NO
~~~

Default normal policy:

~~~text
EAT_SAFE_FOOD
~~~

ActiveStrategy contains:

~~~text
policy
params
startedAtStep
~~~

Current generic strategy params:

~~~text
foodWeight
openSpaceWeight
wallPenalty
bodyPenalty
recentVisitPenalty
~~~

Default params:

~~~text
foodWeight          1.0
openSpaceWeight     0.4
wallPenalty         0.3
bodyPenalty         0.8
recentVisitPenalty  0.0
~~~

Still not implemented as production policies:

~~~text
FOLLOW_TAIL
ESCAPE
HAMILTONIAN_PREP
general multi-step structural recovery
~~~

---

## 8. EAT_SAFE_FOOD

Primary local food planner:

~~~text
evaluateFoodPath()
~~~

Supporting modules:

~~~text
src/agent/path-planner.ts
src/agent/snake-simulator.ts
src/agent/safe-food-validator.ts
~~~

Flow:

~~~text
1. BFS head → food
2. simulate complete candidate path
3. verify food is actually eaten
4. verify post-food head → tail reachability heuristic
~~~

Possible reasons:

~~~text
SAFE
NO_FOOD
NO_FOOD_PATH
SIMULATION_INVALID
FOOD_NOT_REACHED
NO_TAIL_ESCAPE
~~~

When safe:

~~~text
execute path[0]
~~~

The entire route is not blindly committed.

The policy replans every tick.

If no confirmed safe food path exists:

~~~text
fallback to StrategyExecutor weighted local behavior
for that tick
~~~

Important:

~~~text
post-food head→tail reachability
is a heuristic

not a proof of long-term survival
~~~

---

## 9. SAFE_CHASE

Source:

~~~text
src/agent/strategy-executor.ts
~~~

SAFE_CHASE is deterministic weighted one-step Greedy.

Candidate scoring includes:

~~~text
food progress
+ body-aware open-space score
- wall risk
- body proximity risk
- recent-visit penalty
~~~

Existing `countOpenSpace()`:

~~~text
body-aware flood fill
cap = 200
~~~

Board:

~~~text
384 cells
~~~

Therefore:

~~~text
large reachable regions may plateau at 200
~~~

SAFE_CHASE is not:

~~~text
multi-step survival planning
tail-following
escape planning
Hamiltonian recovery
~~~

---

## 10. CREATE_SPACE

Source:

~~~text
src/agent/strategy-executor.ts
~~~

CREATE_SPACE is semantically distinct from SAFE_CHASE.

Primary objective:

~~~text
maximize exact uncapped body-aware reachable space
~~~

Secondary tie-break:

~~~text
better food progress
~~~

Final tie:

~~~text
deterministic existing tie behavior
~~~

Flow:

~~~text
legal candidates
→ exact uncapped reachable-space count
→ choose largest space
→ if equal, prefer food progress
→ deterministic final tie
~~~

CREATE_SPACE intentionally does not reuse SAFE_CHASE's capped open-space score as its primary objective.

Current evidence:

~~~text
CREATE_SPACE whole-run:
poor fit

CREATE_SPACE as temporary STAGNATION recovery:
promising in a small corrected sample
~~~

Detailed benchmark evidence belongs in:

~~~text
BENCHMARK_NOTES.md
~~~

---

## 11. Hamiltonian Production Checkpoint

Current local production source checkpoint:

~~~text
72ed55c
Add Hamiltonian-safe strategy foundation
~~~

Committed files:

~~~text
src/agent/hamiltonian-cycle-32x12.ts
src/agent/strategy-executor.ts
src/agent/types.ts
~~~

Commit scope:

~~~text
3 files changed
127 insertions
1 deletion
~~~

Build before checkpoint:

~~~text
npm run build
PASS
~~~

Current push status:

~~~text
NOT YET VERIFIED
~~~

Do not describe `72ed55c` as pushed until latest GitHub main is checked.

---

## 12. Hamiltonian Cycle Helper

Source:

~~~text
src/agent/hamiltonian-cycle-32x12.ts
~~~

Purpose:

~~~text
fixed directed Hamiltonian cycle
for the current 32×12 / 384-cell board
~~~

Exports include:

~~~text
COLS
ROWS
CYCLE_LENGTH

getCellCycleIndex(x, y)
getCellFromCycleIndex(cycleIndex)
getNextCellFromCycle(cycleIndex)
getNextDirection(x, y)
~~~

Current topology:

~~~text
start:
(0,0)

serpentine rows:
x = 1..31

return path:
column x = 0
from bottom back upward
~~~

Critical corrected mapping:

~~~text
(0,11) → 373
...
(0,1)  → 383
~~~

Inverse mapping:

~~~text
373 → (0,11)
383 → (0,1)
~~~

Closure:

~~~text
index 383 = (0,1)
→ index 0 = (0,0)
~~~

These cells are Manhattan-adjacent.

Previous x=0 forward/inverse mapping inconsistency was repaired before checkpoint.

Validation evidence collected during repair:

~~~text
MAPPING:
PASS

TOPOLOGY:
PASS

CLOSED:
PASS

BUILD:
PASS
~~~

The helper is deterministic and board-state independent.

It does not itself decide:

~~~text
when to enter Hamiltonian mode
whether the snake is currently compatible
how to recover compatibility
how future food growth should be handled
~~~

---

## 13. HAMILTONIAN_SAFE Executor

Source:

~~~text
src/agent/strategy-executor.ts
~~~

Current branch:

~~~text
strategy.policy === HAMILTONIAN_SAFE
~~~

The executor computes current Hamiltonian body-order slack.

For each body segment `j`:

~~~text
d_j =
  (segCycleIndex
   - headCycleIndex
   + CYCLE_LENGTH)
  % CYCLE_LENGTH

slack_j =
  d_j - (snake.length - j)
~~~

Current minimum:

~~~text
minSlack =
minimum slack_j over body segments
~~~

Current executor contract:

~~~text
IF:
minSlack >= 0

AND:
cycle direction is in current legal moves

THEN:
return cycleDir

ELSE:
return null
~~~

Equivalent code semantics:

~~~text
if (minSlack >= 0 && legal.includes(cycleDir))
    return cycleDir

return null
~~~

Important:

~~~text
HAMILTONIAN_SAFE does NOT fall back to legal[0].
~~~

This prevents failed Hamiltonian admission from silently continuing under arbitrary legal movement while still claiming Hamiltonian-safe execution.

---

## 14. Hamiltonian Admission Meaning

Current executor admission condition:

~~~text
currentMinSlack >= 0
AND
cycleDir is immediately legal
~~~

This is:

~~~text
a deterministic current-state executor guard
~~~

It must not be described as:

~~~text
a complete mathematical proof
of indefinite future safety under all food/growth sequences
~~~

Immediate cycle-step legality matters because GameEngine checks collision against the current full body before tail removal.

---

## 15. Hamiltonian Failure Lifecycle

When `HAMILTONIAN_SAFE` is active and executor admission fails:

~~~text
StrategyExecutor
→ returns null
~~~

Normal non-fixed runtime:

~~~text
candidate == null
→ strategy lifecycle exits current ActiveStrategy
→ existing replan / Qwen / fallback path continues
~~~

Fixed-policy paths differ:

~~~text
candidate == null
→ pickSafeDirection() may provide local fallback
→ fixed policy identity may remain active
~~~

Therefore:

~~~text
normal runtime semantics
≠
fixed-policy benchmark semantics
~~~

Do not infer production behavior from fixed-policy fallback behavior.

---

## 16. Missing Hamiltonian Orchestration

Current source HAS:

~~~text
fixed 32×12 Hamiltonian helper
HAMILTONIAN_SAFE StrategyPolicy type
HAMILTONIAN_SAFE deterministic executor
current-state admission guard
~~~

Current source DOES NOT HAVE:

~~~text
automatic Hamiltonian switching
Qwen selection of HAMILTONIAN_SAFE
AgentController Hamiltonian admission trigger
Hamiltonian benchmark admission telemetry
Hamiltonian PREP runtime hook
Hamiltonian recovery state machine
multi-step Hamiltonian structural reorganization
~~~

Current status:

~~~text
Hamiltonian executor capability:
IMPLEMENTED

Hamiltonian production orchestration:
NOT IMPLEMENTED

Hamiltonian compatibility recovery:
NOT SOLVED
~~~

---

## 17. PathPlanner

Source:

~~~text
src/agent/path-planner.ts
~~~

API:

~~~text
findPath(
  start,
  target,
  blocked,
  cols,
  rows,
  currentDirection?
)
→ Direction[] | null
~~~

Characteristics:

~~~text
pure deterministic BFS

direction order:
Up, Down, Left, Right

prevents immediate 180° reversal
when currentDirection is supplied

respects board bounds

does not mutate GameEngine
~~~

---

## 18. SnakeSimulator

Source:

~~~text
src/agent/snake-simulator.ts
~~~

`simulatePath()` follows engine-like semantics:

~~~text
opposite direction request
→ ignored / current direction executes

wall collision
→ invalid simulation

body collision
→ checked against current full body

food consumption
→ growth / no tail pop

no RNG

no GameEngine mutation
~~~

The simulator is reusable deterministic infrastructure.

Historical Hamiltonian PREP research reused it, but current production runtime does not import that PREP prototype.

---

## 19. SafeFoodValidator

Source:

~~~text
src/agent/safe-food-validator.ts
~~~

Safe-food validation uses deterministic local evidence.

Post-food heuristic temporarily removes the current tail cell from blockers before head→tail BFS.

Important:

~~~text
safe-food validation
= useful survival heuristic

not:
formal long-term survival proof
~~~

---

## 20. SafetyLayer

Source:

~~~text
src/agent/safety-layer.ts
~~~

Immediate checks include:

~~~text
180° reversal
wall collision
current body collision
~~~

Normal local strategy path:

~~~text
StrategyExecutor candidate
→ validateDirection()
→ execute if accepted
~~~

`getLegalMoves()` is also used by deterministic local logic.

Important wording:

~~~text
getLegalMoves()
= immediate legal-move evidence

validateDirection()
= normal runtime SafetyLayer validation
~~~

Do not equate every `getLegalMoves()` call with a complete SafetyLayer lifecycle.

`pickSafeDirection()` remains available as a local fallback.

---

## 21. DangerMonitor

Source:

~~~text
src/agent/danger-monitor.ts
~~~

Current outputs:

~~~text
legalMoveCount
survivableMoveCount
reachableCells
dangerLevel
~~~

Danger levels:

~~~text
SAFE
→ survivableMoveCount >= 2

LOW_MOBILITY
→ survivableMoveCount == 1

DEAD_END_IMMINENT
→ survivableMoveCount == 0
~~~

`reachableCells`:

~~~text
body-aware flood fill from current head
~~~

Current production source DOES NOT expose:

~~~text
perimeterReachable
escapeAfterOneMove
~~~

Those belonged to later research instrumentation and were removed before the clean production checkpoint.

DangerMonitor remains deterministic current-state analysis.

---

## 22. DangerEpisodeTracker

Source:

~~~text
src/agent/danger-episode-tracker.ts
~~~

Ownership:

~~~text
DangerMonitor
→ current-tick assessment

DangerEpisodeTracker
→ cross-tick Danger episode history

AgentController
→ orchestration / UI / benchmark consumption
~~~

Current state includes:

~~~text
previousDangerLevel

currentLowMobilityStreak
maxLowMobilityStreak

lastLowStreakBeforeDeadEnd
deadEndEventCount

maxLowMobilityReachableDrop
lastLowMobilityReachableDropBeforeDeadEnd
~~~

Current source DOES NOT contain later research-only per-tick drop fields such as:

~~~text
maxLegalMoveDrop
maxSurvivableMoveDrop
maxReachableCellDrop
maxReachableCellDropFreeCellsBefore
~~~

Danger episode tracking remains observational.

---

## 23. Danger and Qwen

Danger does not directly trigger Qwen.

Current architecture:

~~~text
Danger telemetry
→ UI / stagnation-budget context / telemetry
~~~

It does not currently perform:

~~~text
if danger == X
→ call Qwen immediately
~~~

Current normal Qwen triggers remain primarily:

~~~text
LOOP_DETECTED
STAGNATION_DETECTED
~~~

Do not invent a direct Danger→Qwen trigger.

---

## 24. LOOP / Progress / Stagnation

Controller tracks strategy state history.

Known trigger signals:

~~~text
LOOP_DETECTED
STAGNATION_DETECTED
~~~

Progress state:

~~~text
progressFoodTarget
bestFoodDistance
stepsSinceProgress
_effectiveStagnationThreshold
_stagnationCategory
~~~

Progress currently uses Manhattan distance to food.

Resets when:

~~~text
food eaten
new food appears
current food distance improves beyond previous best
~~~

Base stagnation threshold:

~~~text
80
~~~

### StagnationMode

~~~typescript
'FIXED' | 'DYNAMIC'
~~~

Normal runtime:

~~~text
DYNAMIC
~~~

Benchmark paths:

~~~text
FIXED
~~~

FIXED behavior:

~~~text
stepsSinceProgress >= 80
→ STAGNATION_DETECTED
~~~

Dynamic budget input can include:

~~~text
DangerLevel
survivableMoveCount
reachableCells
safe-food evidence
~~~

via:

~~~text
src/agent/stagnation-budget.ts
~~~

Known categories:

~~~text
NORMAL
REORGANIZING
PRESSURED
EMERGENCY
~~~

Current controller semantics:

~~~text
REORGANIZING may extend
an already-reached stagnation boundary.

PRESSURED / EMERGENCY do not currently
bypass the normal boundary to create
an immediate early Qwen trigger.
~~~

Therefore:

~~~text
Danger does NOT currently bypass
the stagnation boundary.
~~~

---

## 25. Qwen High-Level Strategy Flow

Qwen remains event-driven and high-level.

Normal production triggers:

~~~text
LOOP_DETECTED
STAGNATION_DETECTED
~~~

Normal Qwen-selectable strategies currently center on:

~~~text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
~~~

Current flow:

~~~text
trigger
→ preserve failedStrategy
→ optimizeStrategy()
→ provide local planner evidence
→ Qwen selects high-level strategy/params
→ validate response
→ create fresh ActiveStrategy
→ local TypeScript executes subsequent ticks
~~~

Local evidence includes:

~~~text
Food Path Exists
Food Path Length
Food Path Safe
Food Path Reason
~~~

Current important limitation:

~~~text
Qwen does NOT currently consume:

Hamiltonian admission
Hamiltonian slack
packing density
perimeter reachability
escapeAfterOneMove
PREP state
~~~

Qwen currently does not select `HAMILTONIAN_SAFE`.

---

## 26. Legacy Primitive Qwen Plan

Legacy primitive plan path still exists:

~~~text
plannedMoves: Direction[]
PlanResponse moves[1..6]
replan()
executePlannedMove()
~~~

This is not the preferred healthy architecture path.

Primitive Qwen moves still pass through:

~~~text
validateDirection()
~~~

before execution.

If primitive planning fails:

~~~text
pickSafeDirection()
~~~

may provide fallback.

Do not redesign the architecture around primitive per-tick Qwen direction control.

---

## 27. `runStep()` High-Level Flow

Normal call:

~~~text
runStep(undefined, 'DYNAMIC')
~~~

Current high-level flow:

~~~text
1. guard engine/running/pause/state

2. compute legal moves

3. assessDanger()
   → dangerLevel
   → legalMoveCount
   → survivableMoveCount
   → reachableCells

4. update DangerEpisodeTracker

5. if no legal moves:
   → game-over path

6. if directionSource exists:
   → benchmark injection path

7. else if ActiveStrategy exists:

   EAT_SAFE_FOOD
   → evaluateFoodPath()
   → safe path[0]
   → otherwise StrategyExecutor fallback

   SAFE_CHASE
   → StrategyExecutor

   CREATE_SPACE
   → StrategyExecutor

   HAMILTONIAN_SAFE
   → StrategyExecutor
   → current-state Hamiltonian admission guard

   candidate
   → validateDirection()
   → executeStrategyMove()
   → LOOP / progress / stagnation tracking

8. if failedStrategy exists
   and not fixed-policy:
   → optimizeStrategy()

9. otherwise when allowed:
   → legacy primitive Qwen plan / local fallback
~~~

### Benchmark injection exception

When `directionSource` is supplied:

~~~text
directionSource(state)
→ engine.setDirection()
→ engine.step()
~~~

This injected path does not execute the full normal:

~~~text
ActiveStrategy
StrategyExecutor
SafetyLayer
LOOP
progress
stagnation
~~~

lifecycle.

Do not claim every benchmark-injected move represents normal production orchestration.

---

## 28. Benchmark / Debug API

Ownership:

~~~text
src/main.ts
src/global.d.ts
src/agent/agent-controller.ts
~~~

Global browser entrypoint:

~~~text
window.__snakeDebug
~~~

Relevant methods include:

~~~text
getState()
setManualMode(enabled)
setDirection(direction)
step()
reset()
getAgentInfo()
setSeed(seed | null)
restart()
~~~

Current `runLocalBenchmark()` high-level signature:

~~~text
runLocalBenchmark(
  seed,
  maxSteps,
  policy?
)
~~~

Current normal benchmark policy argument is centered on:

~~~text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
~~~

There is NO current:

~~~text
prepStartStep
~~~

There is NO current PREP runtime benchmark hook.

Other benchmark methods include:

~~~text
runRecoveryBenchmark(
  seed,
  maxSteps,
  recoverySteps?
)

runSafeBfsBenchmark(
  seed,
  maxSteps
)
~~~

Important:

~~~text
window.__snakeDebug
is a browser runtime API.

Do not invoke it as though it were
a PowerShell or Node global object.
~~~

---

## 29. Current LocalBenchmarkResult

Current production `LocalBenchmarkResult` contains:

~~~text
maxLowMobilityStreak
lastLowStreakBeforeDeadEnd
deadEndEventCount

maxLowMobilityReachableDrop
lastLowMobilityReachableDropBeforeDeadEnd
~~~

Current production source DOES NOT expose historical research fields such as:

~~~text
minHamiltonianSlack
finalHamiltonianSlack

firstAdmissibleStep
firstAdmissibleScore
firstAdmissionLostStep
admissionRegainedCount
admissibleTicks

finalReachableFreeRatio
reachableFreeRatioSnapshots

perimeterReachableSnapshots
escapeAfterOneMoveSnapshots
packingDensitySnapshots

maxLegalMoveDrop
maxSurvivableMoveDrop
maxReachableCellDrop
maxReachableCellDropRatio

prepStartSlack
prepBestSlack
prepAdmissionStep
~~~

Do not describe those as current benchmark API fields.

---

## 30. Historical Hamiltonian / PREP Research

A larger local research branch previously added temporary telemetry and PREP wiring.

Historical research concepts included:

~~~text
historical Hamiltonian minimum slack
current-state Hamiltonian slack

first admission
first admission loss
admission regain
admissible ticks

reachableFreeRatio
perimeterReachable
escapeAfterOneMove
packingDensity

per-tick Danger move/reachable drops

prepStartStep
prepStartSlack
prepBestSlack
prepAdmissionStep

one-step greedy Hamiltonian PREP
~~~

These were experimental instruments.

They were intentionally excluded from the clean production checkpoint `72ed55c`.

Detailed seed evidence, if retained, belongs in:

~~~text
BENCHMARK_NOTES.md
~~~

not in current-runtime API descriptions.

---

## 31. Invalidated / Superseded Research Conclusions

Several historical conclusions must not be treated as current architecture truth.

### A. Historical minimum reused as current admission state

An experimental benchmark accumulated:

~~~text
minHamiltonianSlack
=
minimum slack ever seen so far
~~~

Some later lifetime/regain telemetry reused that historical minimum as though it represented current state.

Consequence:

~~~text
once historical minimum became negative
it could never recover to non-negative
~~~

Therefore conclusions based on:

~~~text
admissionRegainedCount
admissibleTicks
full admission lifetime
~~~

were structurally misleading.

Those fields were removed.

### B. PREP objective mismatch

The one-step PREP prototype and benchmark did not establish a sufficiently trustworthy equivalence between:

~~~text
the exact admission condition
and
the optimized experimental slack objective
~~~

Therefore:

~~~text
"0/4 proves Hamiltonian recovery is impossible"
~~~

is not accepted.

At most:

~~~text
that specific prototype did not demonstrate
successful admission recovery
under the tested setup
~~~

### C. Perimeter / escape metric risk

Experimental `perimeterReachable` instrumentation had a correctness risk in how visited/blocked cells interacted with perimeter detection.

Therefore old perimeter/escape conclusions are not high-confidence production evidence.

These metrics were removed from current source.

---

## 32. `bench-hamiltonian-prep.ts`

Possible local untracked artifact:

~~~text
src/agent/bench-hamiltonian-prep.ts
~~~

Current status:

~~~text
NOT active production runtime

NOT imported by current AgentController

NOT a StrategyPolicy

NOT part of checkpoint 72ed55c

NOT automatically deleted
because it is untracked research material
~~~

Do not list it in the active runtime object graph.

If research is revisited, inspect current local status/source first.

---

## 33. Current Hamiltonian Research Question

The main unresolved Hamiltonian problem is not:

~~~text
"Can we add more telemetry?"
~~~

The missing capability is:

~~~text
How can the snake reach or preserve
Hamiltonian-compatible body ordering
before switching to HAMILTONIAN_SAFE?
~~~

Current executor can follow the cycle when admission holds.

Missing capability:

~~~text
reliable structural reorganization
or
another deterministic compatibility-transition mechanism
~~~

This remains a design/research problem.

---

## 34. Current Development Direction

Keep two axes separate.

### Axis A — deterministic capability

Question:

~~~text
What reliable high-level tools can Qwen choose?
~~~

Current deterministic capabilities:

~~~text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
HAMILTONIAN_SAFE executor
~~~

Important missing capability:

~~~text
reliable structural reorganization /
Hamiltonian compatibility recovery
~~~

Possible future research:

~~~text
multi-step structural reorganization

tail-aware cycle-order repair

state-space planning over body ordering

another deterministic endgame transition method
~~~

These are design directions only.

Do not assume a one-step greedy slack optimizer is the answer.

### Axis B — Qwen objective switching

Question:

~~~text
When should Qwen switch objectives?
~~~

Current production triggers:

~~~text
LOOP_DETECTED
STAGNATION_DETECTED
~~~

Before wiring Hamiltonian into Qwen:

~~~text
the deterministic capability must be reliable

the admission contract must be clear

failure/fallback behavior must be defined
~~~

Do not expose dozens of experimental telemetry numbers to Qwen merely because they can be measured.

---

## 35. Desired High-Level Behavior

Conceptual target:

~~~text
early game:
→ efficiently pursue food

when local structure becomes troublesome:
→ reorganize / escape

after successful reorganization:
→ reassess

if space remains generous:
→ continue freer food pursuit

if late-game structure genuinely requires conservation:
→ prepare for conservative endgame behavior

when Hamiltonian admission is valid:
→ HAMILTONIAN_SAFE
~~~

Important:

~~~text
escape / CREATE_SPACE success
≠
automatic Hamiltonian switch
~~~

Desired target sequence:

~~~text
efficient free play
→ structural reorganization when necessary
→ verified current Hamiltonian admission
→ HAMILTONIAN_SAFE
~~~

This is a design target.

It is not fully implemented.

---

## 36. Recovery / Reorganization

Current production local reorganization tool:

~~~text
CREATE_SPACE
~~~

Evidence:

~~~text
whole-run use:
poor fit

temporary recovery use:
promising but limited
~~~

Hamiltonian-specific recovery:

~~~text
NOT SOLVED
~~~

Historical one-step PREP:

~~~text
research-only
not production
not retained in active runtime
~~~

Do not rename historical PREP experiments into a production feature.

---

## 37. Benchmark Lessons That Still Hold

Broad lessons that remain architecture-relevant:

~~~text
EAT_SAFE_FOOD remains the preferred normal default.

SAFE_CHASE is insufficient as the only long-run policy.

Whole-run CREATE_SPACE is not a replacement for normal food pursuit.

Temporary CREATE_SPACE recovery showed some promising evidence.

NO_MOVE remains an unresolved failure class.

LOW_MOBILITY streak alone is not a proven universal early trigger.

More observational telemetry does not automatically improve Qwen decisions.

A Hamiltonian executor is useful only if compatibility/admission can be reached and managed reliably.
~~~

Exact seed tables, scores, and step counts belong in:

~~~text
BENCHMARK_NOTES.md
~~~

---

## 38. What Has NOT Been Proven

Do not claim:

~~~text
Hamiltonian slack alone guarantees indefinite survival.

Current admission guard proves all future food growth is safe.

Qwen currently understands Hamiltonian admission.

Qwen currently selects HAMILTONIAN_SAFE.

Automatic Hamiltonian switching exists.

Reliable HAMILTONIAN_PREP exists.

The old one-step PREP experiment proves
Hamiltonian recovery is impossible.

reachableFreeRatio has a universal death threshold.

packingDensity has a universal trigger threshold.

perimeterReachable is a reliable death predictor.

escapeAfterOneMove is a reliable trap predictor.

Danger directly triggers Qwen.

LOW_MOBILITY directly triggers Qwen.
~~~

---

## 39. Known Current Limitations

Not currently solved / production-integrated:

~~~text
Danger-based direct Qwen trigger
LOW_MOBILITY direct trigger
reachable-drop direct trigger
PRE_TRAP trigger
multi-step danger lookahead
dedicated survival planner
FOLLOW_TAIL
ESCAPE policy

automatic Hamiltonian transition
Hamiltonian Qwen selection
reliable Hamiltonian recovery/preparation

formal board-full WIN semantics
shared board-dimension source of truth
~~~

### Safe food

~~~text
heuristic
not a long-term proof
~~~

### SAFE_CHASE

~~~text
one-step Greedy
not survival planning
~~~

### CREATE_SPACE

~~~text
implemented
poor whole-run fit
limited positive recovery evidence
~~~

### NO_MOVE

~~~text
still unresolved
~~~

### Danger

~~~text
observational/contextual
not direct Qwen trigger
~~~

### Hamiltonian

~~~text
cycle helper:
IMPLEMENTED

executor:
IMPLEMENTED

current-state admission guard:
IMPLEMENTED

automatic admission lifecycle:
NOT IMPLEMENTED

Qwen selection:
NOT IMPLEMENTED

compatibility recovery:
NOT SOLVED
~~~

---

## 40. UI / Thinking / Pause

### Thinking streaming

LM Studio SSE reasoning path:

~~~text
choices[0].delta.reasoning_content
→ LmStudioClient callback
→ AgentController.currentInfo.thinking
→ updateUI()
→ AgentPanel.updateDisplay()
→ Thinking DOM
~~~

Final response content:

~~~text
choices[0].delta.content
~~~

Do not replace real thinking streaming with fake animation.

### Pause flow

Visible flow:

~~~text
INITIAL
→ START AGENT
→ AGENT ACTIVE
↔ PAUSED
→ GAME OVER
→ RESTART AGENT
~~~

AgentPanel owns the local async run loop.

Pause protection exists in:

~~~text
AgentPanel scheduling
AgentController runStep()
~~~

An async Qwen response may finish while paused, but completion must not itself move the snake.

---

## 41. Revisit Awareness

AgentController stores recent successful head positions.

Current history length:

~~~text
32
~~~

StrategyExecutor applies a recency-weighted penalty to recently visited candidate cells.

This is:

~~~text
a score penalty
~~~

not:

~~~text
a hard ban
~~~

Revisit awareness does not replace:

~~~text
route planning
survival planning
escape planning
structural recovery
~~~

---

## 42. Fast File Guide

| Task | Read first |
| --- | --- |
| Bootstrap / debug API / canvas | `src/main.ts`, `src/global.d.ts` |
| Engine / collision / RNG | `src/game/engine.ts`, `src/game/types.ts` |
| Agent orchestration / triggers / benchmarks | `src/agent/agent-controller.ts` |
| Strategy policy types | `src/agent/types.ts` |
| SAFE_CHASE / CREATE_SPACE / HAMILTONIAN_SAFE execution | `src/agent/strategy-executor.ts` |
| Hamiltonian cycle/index/direction | `src/agent/hamiltonian-cycle-32x12.ts` |
| Immediate legality | `src/agent/safety-layer.ts` |
| BFS planner | `src/agent/path-planner.ts` |
| Virtual simulation | `src/agent/snake-simulator.ts` |
| Safe-food validation | `src/agent/safe-food-validator.ts` |
| Single-tick Danger | `src/agent/danger-monitor.ts` |
| Cross-tick Danger episodes | `src/agent/danger-episode-tracker.ts` |
| Stagnation budget | `src/agent/stagnation-budget.ts` |
| LM strategy/SSE validation | `src/agent/lm-studio-client.ts` |
| Active UI | `src/agent-panel.ts` |
| Active styling | `src/style.css` |
| Canvas rendering | `src/game/renderer.ts` |
| Benchmark evidence | `BENCHMARK_NOTES.md` |
| OpenCode / Git workflow | `AGENTS.md` |

For `agent-controller.ts`:

~~~text
locate exact symbol
→ narrow read
~~~

Do not broad-read the whole file for a narrow task unless genuinely necessary.

---

## 43. Documentation Ownership

### PROJECT_MAP.md

Owns:

~~~text
current architecture
active files
runtime ownership
strategy semantics
trigger semantics
important engine behavior
Hamiltonian production architecture
current benchmark/debug API semantics
current limitations
production vs research-only boundaries
current development direction
~~~

### BENCHMARK_NOTES.md

Owns:

~~~text
seed-level benchmark evidence
scores
step counts
recovery deltas
death-window experiments
historical Hamiltonian admission tests
historical PREP experiment results
experimental comparisons
invalidated measurement notes
~~~

Do not overload PROJECT_MAP with every seed row.

### AGENTS.md

Owns:

~~~text
OpenCode workflow
NEW / SAME session discipline
context discipline
Git safety
PowerShell rules
build/test/runtime evidence rules
~~~

---

## 44. PROJECT_MAP Renewal Policy

Update PROJECT_MAP when changes affect:

~~~text
active runtime ownership
new modules
strategy policies
AgentController flow
Qwen responsibilities
SafetyLayer responsibility
GameEngine semantics
LOOP / stagnation semantics
Danger semantics
Hamiltonian semantics
planner architecture
benchmark/debug API
production vs research-only ownership
major telemetry ownership
~~~

Usually do not update for:

~~~text
font tweaks
padding
colors
minor copy
small cosmetic UI work
~~~

Renew when:

~~~text
~2–4 meaningful architecture changes accumulate

or

a fresh consumer would be materially misled

or

before an important architecture checkpoint/handoff
~~~

---

## 45. Git / Checkpoint State

Previously verified pushed checkpoints:

~~~text
architecture source:
6f0c8eb

documentation:
4a1415e
~~~

Current local production source checkpoint:

~~~text
72ed55c
Add Hamiltonian-safe strategy foundation
~~~

Current checkpoint contents:

~~~text
src/agent/hamiltonian-cycle-32x12.ts
src/agent/strategy-executor.ts
src/agent/types.ts
~~~

Build:

~~~text
PASS
~~~

Push status:

~~~text
NOT YET VERIFIED
~~~

Current tracked working-tree state before this PROJECT_MAP renewal was being cleaned so that architecture/research formatting churn would not enter the source checkpoint.

Known untracked research/temporary artifacts may include:

~~~text
agent-controller-head.ts

benchmark JSON outputs

screenshots

visual-review artifacts

qwen-test.js

agent_test_controls.md

src/agent/bench-hamiltonian-prep.ts

legacy duplicate UI/client files
~~~

Do not stage them automatically.

Before docs commit:

~~~text
git status --short

git add PROJECT_MAP.md

git diff --cached --stat

git diff --cached -- PROJECT_MAP.md
~~~

Do not use casually:

~~~text
git add .
git add -A
git reset --hard
git clean -fd
git restore .
~~~

After push:

~~~text
verify latest GitHub main
~~~

---

## 46. High-Confidence Anchors

~~~text
Repository:
https://github.com/spiraleyeld/ai-snake-game-agent

Local:
D:\Projects\snake-game

Previously verified pushed architecture checkpoint:
6f0c8eb

Previously verified pushed documentation checkpoint:
4a1415e

Current local production source checkpoint:
72ed55c

Current local checkpoint push status:
NOT VERIFIED

Frontend:
Vanilla TypeScript + Vite + Canvas 2D

Board:
32×12 / 384 cells

Default normal policy:
EAT_SAFE_FOOD

Normal production Qwen policy set:
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE

Type/executor support also includes:
HAMILTONIAN_SAFE

Qwen normal triggers:
LOOP_DETECTED
STAGNATION_DETECTED

Danger-triggered Qwen:
NO

PRE_TRAP:
NOT IMPLEMENTED

Hamiltonian cycle helper:
IMPLEMENTED

Hamiltonian mapping/topology repair:
PASS

Hamiltonian executor:
IMPLEMENTED

Hamiltonian executor admission:
minSlack >= 0
AND
cycleDir is immediately legal

Hamiltonian admission failure:
return null

Hamiltonian arbitrary legal[0] fallback:
NO

Automatic Hamiltonian switching:
NO

Qwen HAMILTONIAN_SAFE selection:
NO

Hamiltonian benchmark telemetry in AgentController:
NO

PREP runtime hook:
NO

Current prepStartStep API:
NO

Reliable Hamiltonian recovery:
NOT SOLVED

perimeterReachable current production telemetry:
NO

escapeAfterOneMove current production telemetry:
NO

per-tick Danger drop research telemetry:
NO

Qwen role:
high-level strategy / exception reasoning

Local TypeScript:
deterministic execution

SafetyLayer:
immediate legality

GameEngine:
physical state transition

Active UI:
src/agent-panel.ts
src/style.css
src/main.ts

Detailed benchmark evidence:
BENCHMARK_NOTES.md

OpenCode workflow:
AGENTS.md
~~~

---

# Core Principle

~~~text
Qwen decides high-level strategy.

Local TypeScript executes deterministic navigation
and local safety reasoning.

SafetyLayer validates immediate legality.

GameEngine owns physical state transitions.
~~~

Current strategic lesson:

~~~text
More telemetry does not automatically make Qwen smarter.

Qwen becomes more useful when it can choose among
reliable deterministic capabilities.

Therefore:

build trustworthy capabilities first,
then expose the right high-level choice to Qwen.
~~~

Current target:

~~~text
efficient free play
→ structural reorganization when needed
→ verified Hamiltonian-compatible current state
→ HAMILTONIAN_SAFE
~~~

The missing core capability is:

~~~text
reliable multi-step structural reorganization /
Hamiltonian compatibility recovery
~~~

Do not promote failed or invalidated research heuristics into production architecture.

Do not regress Qwen into normal per-tick primitive control.