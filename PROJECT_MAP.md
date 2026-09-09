# PROJECT_MAP — Snake Game + Local Qwen Agent

> Current architecture/state map for fast onboarding.
> Reconciled through 2026-09-10 against pushed GitHub source plus current runtime evidence.
> Latest pushed architecture source checkpoint: `6f0c8eb`.
> Latest pushed documentation checkpoint: `4a1415e`.
> Detailed benchmark evidence lives in `BENCHMARK_NOTES.md`.
> OpenCode workflow / Git / context rules live in `AGENTS.md`.

---

## 0. Authority

Technical truth order:

```text
CURRENT LOCAL RUNTIME EVIDENCE
> CURRENT LOCAL SOURCE
> local git diff / git status
> latest GitHub main source
> PROJECT_MAP.md
> AGENTS.md
> current handoff / conversation evidence
> old assumptions
```

Rules:

```text
Source wins over PROJECT_MAP.
Local source/runtime wins over GitHub when they differ.
GitHub absence does not prove local-file absence.
AGENTS.md governs OpenCode workflow discipline.
PROJECT_MAP.md describes architecture/state.
```

Do not infer active runtime ownership from legacy duplicate files.

---

## 1. Current Stack / Runtime

```text
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
```

Current physical geometry:

```text
cols = 32
rows = 12
```

Current AgentController board constants:

```text
COLS = 32
ROWS = 12
```

Important architecture debt:

```text
GameEngine derives board geometry from canvas/grid.
AgentController still owns explicit COLS/ROWS constants.
```

These are not yet derived from one shared source of truth.

Any future board-size change must verify both sides.

---

## 2. Active Runtime Ownership

Primary runtime object graph:

```text
src/main.ts
├─ GameEngine              → src/game/engine.ts
├─ Renderer                → src/game/renderer.ts
├─ InputHandler            → src/game/input.ts
├─ AgentController         → src/agent/agent-controller.ts
│  ├─ LmStudioClient         → src/agent/lm-studio-client.ts
│  ├─ SafetyLayer            → src/agent/safety-layer.ts
│  ├─ StrategyExecutor       → src/agent/strategy-executor.ts
│  ├─ AgentMemory            → src/agent/agent-memory.ts
│  ├─ PathPlanner            → src/agent/path-planner.ts
│  ├─ SnakeSimulator         → src/agent/snake-simulator.ts
│  ├─ SafeFoodValidator      → src/agent/safe-food-validator.ts
│  ├─ DangerMonitor          → src/agent/danger-monitor.ts
│  ├─ DangerEpisodeTracker   → src/agent/danger-episode-tracker.ts
│  └─ StagnationBudget       → src/agent/stagnation-budget.ts
└─ AgentPanel              → src/agent-panel.ts
```

### Active UI

```text
Implementation:
src/agent-panel.ts

Styling:
src/style.css

Bootstrap/import:
src/main.ts
```

Desktop layout:

```text
Thinking | Snake | Control
   2     |   6   |    2
```

Current game frame:

```text
logical canvas = 640×240
aspect ratio = 8:3
middle-column width retained
game frame vertically centered
side panels remain full-height
```

### Known local legacy / duplicate risk

Known local untracked duplicate/legacy paths include:

```text
src/agent/AgentPanel.jsx
src/agent/AgentPanel.css
src/agent/LMStudioClient.ts
src/agent/promptBuilder.ts
```

Do not treat these as active unless the current local import graph proves otherwise.

Do not adopt, delete, stage, or modify them as a side effect of unrelated work.

---

## 3. Architecture Invariant

Core separation:

```text
Qwen
= slow high-level strategy / exception reasoning

Local TypeScript
= deterministic navigation / planning / simulation

SafetyLayer
= immediate legality

GameEngine
= physical state transition
```

Primary control model:

```text
Qwen
→ ActiveStrategy
→ local deterministic planner/executor
→ SafetyLayer
→ GameEngine
```

Do not regress Qwen into the normal per-tick primitive direction controller.

Qwen decides:

```text
what objective / strategy should matter now
```

Local TypeScript decides:

```text
how to execute that strategy each tick
```

---

## 4. GameEngine Semantics

Source:

```text
src/game/engine.ts
```

Directions:

```text
Up
Down
Left
Right
```

Game states:

```text
Start
Playing
Paused
GameOver
```

Fresh `start()`:

```text
3-segment snake near center
initial direction = Right
score = 0
speed = 150 ms
seeded RNG state resets when seed != null
spawnFood()
```

Logical tick:

```text
apply queued direction
→ compute new head
→ wall collision check
→ current full-body collision check
→ add new head
→ if food:
     score++
     grow
     spawn food
  else:
     remove tail
```

Important collision rule:

```text
Current tail is still occupied during collision checking.
Tail removal happens only after the new head is accepted.
```

Agent movement normally uses manual mode:

```text
engine.setManualMode(true)
engine.setDirection(direction)
engine.step()
```

When manual mode is enabled:

```text
normal animation-loop engine.tick()
does not move the snake
```

---

## 5. Deterministic Food RNG

GameEngine implements seeded food RNG.

Relevant state/API:

```text
_seed
_rngState
setSeed(seed | null)
getSeed()
random()
spawnFood()
```

Behavior:

```text
seed === null
→ Math.random()

seed !== null
→ deterministic local PRNG

start()
→ resets RNG state from seed
```

Debug use:

```js
window.__snakeDebug.setSeed(1001)
window.__snakeDebug.restart()
```

`setSeed(null)` restores non-deterministic food spawning.

Important:

```text
Same seed is reproducible only under the same board geometry
and execution path.
```

Different policies may alter occupied cells and therefore alter food-candidate rejection behavior.

---

## 6. Active Strategies

Current policy type:

```ts
export type StrategyPolicy =
  | 'SAFE_CHASE'
  | 'EAT_SAFE_FOOD'
  | 'CREATE_SPACE';
```

Current implemented policies:

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

Default:

```text
EAT_SAFE_FOOD
```

`createDefaultStrategy(policy?)` accepts an optional implemented policy.

Without an argument:

```text
EAT_SAFE_FOOD
```

ActiveStrategy contains:

```text
policy
params
startedAtStep
```

Current strategy params:

```text
foodWeight
openSpaceWeight
wallPenalty
bodyPenalty
recentVisitPenalty
```

Default params:

```text
foodWeight          1.0
openSpaceWeight     0.4
wallPenalty         0.3
bodyPenalty         0.8
recentVisitPenalty  0.0
```

Not implemented:

```text
FOLLOW_TAIL
ESCAPE
SAFE_CYCLE / HAMILTONIAN
```

---

## 7. EAT_SAFE_FOOD

Primary local planner path:

```text
evaluateFoodPath()
```

Supporting modules:

```text
src/agent/path-planner.ts
src/agent/snake-simulator.ts
src/agent/safe-food-validator.ts
```

Flow:

```text
1. BFS head → food
2. simulate complete candidate path
3. verify food is actually eaten
4. verify post-food head → tail reachability heuristic
```

Possible reasons:

```text
SAFE
NO_FOOD
NO_FOOD_PATH
SIMULATION_INVALID
FOOD_NOT_REACHED
NO_TAIL_ESCAPE
```

When safe:

```text
execute path[0]
```

The entire route is not blindly committed.

The policy replans every tick.

If no confirmed safe food path exists:

```text
fallback to StrategyExecutor weighted local behavior
for that tick
```

Important:

```text
post-food head→tail reachability
is a heuristic
not a proof of long-term survival
```

---

## 8. SAFE_CHASE / CREATE_SPACE

Source:

```text
src/agent/strategy-executor.ts
```

### SAFE_CHASE

SAFE_CHASE is a deterministic weighted one-step Greedy policy.

Candidate scoring includes:

```text
food progress
+ body-aware open-space score
- wall risk
- body proximity risk
- recent-visit penalty
```

Existing `countOpenSpace()`:

```text
body-aware flood fill
cap = 200
```

Current board:

```text
384 cells
```

Therefore large reachable areas can plateau at 200.

SAFE_CHASE is not:

```text
multi-step survival planning
committed detour planning
tail-following
escape planning
```

### CREATE_SPACE

CREATE_SPACE is semantically distinct.

Primary objective:

```text
maximize exact uncapped body-aware reachable space
```

Secondary tie-break:

```text
better food progress
```

Final tie:

```text
preserve deterministic existing tie behavior
```

Flow:

```text
legal candidates
→ exact uncapped reachable-space count
→ choose largest space
→ if equal, prefer better food progress
→ deterministic final tie behavior
```

CREATE_SPACE intentionally does not reuse the capped SAFE_CHASE open-space metric as its primary objective.

Example:

```text
210 reachable cells
vs
350 reachable cells
```

must remain distinguishable.

Current benchmark conclusion:

```text
CREATE_SPACE whole-run:
poor fit

CREATE_SPACE as temporary STAGNATION recovery:
promising
```

Detailed evidence:

```text
BENCHMARK_NOTES.md
```

---

## 9. Path Planner / Simulator / Safe Food

### PathPlanner

Source:

```text
src/agent/path-planner.ts
```

API:

```text
findPath(
  start,
  target,
  blocked,
  cols,
  rows,
  currentDirection?
)
→ Direction[] | null
```

Characteristics:

```text
pure deterministic BFS
direction order:
Up, Down, Left, Right

prevents immediate 180° reversal
when currentDirection is supplied

respects board bounds
does not mutate GameEngine
```

### SnakeSimulator

Source:

```text
src/agent/snake-simulator.ts
```

`simulatePath()` follows engine-like semantics:

```text
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
```

### SafeFoodValidator

Source:

```text
src/agent/safe-food-validator.ts
```

Post-food heuristic temporarily removes the current tail cell from blockers before head→tail BFS.

This is intentionally only a survival heuristic.

---

## 10. SafetyLayer

Source:

```text
src/agent/safety-layer.ts
```

Immediate checks include:

```text
180° reversal
wall collision
current body collision
```

Normal local-strategy path:

```text
candidate
→ validateDirection()
→ requested direction if legal
→ otherwise SafetyLayer fallback when available
```

Normal runtime behavior may invalidate a strategy after a SafetyLayer override.

Fixed-policy benchmark exception:

```text
SafetyLayer may override immediate direction
but fixed policy identity remains active
```

Therefore:

```text
fixed policy ≠ fixed direction
```

`pickSafeDirection()` also exists as a local fallback path.

Its open-space heuristic is separate from:

```text
SAFE_CHASE countOpenSpace()
CREATE_SPACE exact uncapped reachable-space ordering
```

---

## 11. LOOP / Progress / Stagnation

### LOOP

Controller tracks rich strategy-state signatures including:

```text
head
direction
food
score
full ordered snake body
recent head history
all five strategy params
```

On normal LOOP detection:

```text
_lastTrigger = LOOP_DETECTED
preserve failedStrategy
capture trigger snapshot
activeStrategy = null
→ later optimizeStrategy()
```

In explicit fixed-policy benchmark mode:

```text
_lastTrigger = LOOP_DETECTED
activeStrategy remains intact
Qwen remains disabled
```

The benchmark may still terminate on LOOP.

### Progress tracking

Current progress evidence includes:

```text
progressFoodTarget
bestFoodDistance
stepsSinceProgress
_effectiveStagnationThreshold
_stagnationCategory
```

Progress is currently based on Manhattan distance to food.

Progress resets when:

```text
food eaten
new food appears
current distance improves beyond previous best
```

Base threshold:

```text
80
```

### StagnationMode

```ts
'FIXED' | 'DYNAMIC'
```

Normal runtime:

```text
DYNAMIC
```

Benchmark paths:

```text
FIXED
```

FIXED:

```text
stepsSinceProgress >= 80
→ STAGNATION_DETECTED
```

Dynamic budget categories:

```text
NORMAL        → 80
REORGANIZING  → clamp(round(reachableCells × 0.25), 80, 200)
PRESSURED     → 40
EMERGENCY     → 0
```

Current controller semantics are intentionally narrower:

```text
Only REORGANIZING may extend an already-reached boundary above 80.
```

Therefore:

```text
PRESSURED = 40
does NOT create an early 40-step runtime trigger

EMERGENCY = 0
does NOT create direct Qwen triggering

Danger
does NOT bypass the current stagnation boundary
```

Normal STAGNATION:

```text
_lastTrigger = STAGNATION_DETECTED
preserve failedStrategy
capture trigger snapshot
activeStrategy = null
reset progress/loop tracking
→ optimizeStrategy()
```

Explicit fixed-policy benchmark:

```text
STAGNATION may be recorded/terminate benchmark
but policy identity remains intact
and Qwen is disabled
```

---

## 12. DangerMonitor / DangerEpisodeTracker

### DangerMonitor

Source:

```text
src/agent/danger-monitor.ts
```

`assessDanger()` is pure single-tick deterministic logic.

Outputs:

```text
legalMoveCount
survivableMoveCount
reachableCells
dangerLevel
```

Danger levels:

```text
SAFE
→ survivableMoveCount >= 2

LOW_MOBILITY
→ survivableMoveCount == 1

DEAD_END_IMMINENT
→ survivableMoveCount == 0
```

`reachableCells` uses body-aware flood fill from the current head.

DangerMonitor owns no cross-tick state.

### DangerEpisodeTracker

Source:

```text
src/agent/danger-episode-tracker.ts
```

Current architecture:

```text
DangerMonitor
→ current-tick assessment

DangerEpisodeTracker
→ cross-tick Danger episode state

AgentController
→ orchestration / consumption
```

Current API:

```text
processTick(dangerLevel, reachableCells)
getState()
reset()
```

Tracked state includes:

```text
previousDangerLevel
currentLowMobilityStreak
maxLowMobilityStreak
lastLowStreakBeforeDeadEnd
deadEndEventCount
maxLowMobilityReachableDrop
lastLowMobilityReachableDropBeforeDeadEnd
```

### LOW_MOBILITY episode semantics

```text
LOW_MOBILITY
→ current streak++
→ update max streak

SAFE
→ current streak = 0

first transition into DEAD_END_IMMINENT
→ capture previous LOW streak
→ deadEndEventCount++
→ current streak = 0

repeated DEAD_END ticks
→ do not increment event count again
```

### Reachable-space episode-drop telemetry

At LOW_MOBILITY episode start:

```text
capture reachableCells baseline
```

During the same episode:

```text
track maximum drop relative to that episode start
```

Exposed metrics:

```text
maxLowMobilityReachableDrop
lastLowMobilityReachableDropBeforeDeadEnd
```

Do not use accumulated negative deltas.

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
implementation:
PASS

build:
PASS

runtime benchmark evidence for reachable-drop fields:
PENDING
```

### Trigger semantics

Danger remains observational.

None of these currently directly trigger Qwen:

```text
LOW_MOBILITY
DEAD_END_IMMINENT
reachable-space drop
deadEndEventCount
LOW_MOBILITY streak
```

Current Qwen high-level triggers remain:

```text
LOOP_DETECTED
STAGNATION_DETECTED
```

---

## 13. Current Trigger Research

A real normal-runtime death was observed with:

```text
Strategy = EAT_SAFE_FOOD
Score = 103
Steps = 2246
Last Trigger = -
Live Stag = 18 / 80
LLM Calls = 0
Danger = DEAD_END_IMMINENT
Reachable = 1
GAME-OVER
```

This proves:

```text
Some deaths occur before LOOP/STAGNATION
has time to summon Qwen.
```

It does NOT prove:

```text
DEAD_END_IMMINENT → Qwen
```

should be implemented.

At DEAD_END_IMMINENT, recovery may already be too late.

### LOW_MOBILITY evidence

Controlled evidence shows:

```text
NO_MOVE runs may have long LOW_MOBILITY streaks
but MAX_STEPS controls may also have equally long or longer streaks
```

Therefore:

```text
LOW_MOBILITY streak alone
has warning value
but poor specificity
```

Do not currently implement arbitrary thresholds such as:

```text
streak >= 3
streak >= 5
streak >= 8
```

### Current research axis

Current next signal:

```text
reachable-space deterioration during LOW_MOBILITY episodes
```

Research question:

```text
Does reachable-space collapse provide earlier
and more specific warning than LOW_MOBILITY duration alone?
```

PRE_TRAP remains:

```text
NOT IMPLEMENTED
```

Detailed experiment evidence:

```text
BENCHMARK_NOTES.md
```

---

## 14. Qwen High-Level Strategy Flow

Qwen strategy optimization remains event-driven.

Normal high-level triggers:

```text
LOOP_DETECTED
STAGNATION_DETECTED
```

Current implemented Qwen-selectable policies:

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

Flow:

```text
trigger
→ preserve failedStrategy
→ optimizeStrategy()
→ prompt Qwen with local evidence
→ validate strategy response
→ create fresh ActiveStrategy
→ local TypeScript executes subsequent ticks
```

Local evidence available to optimization includes:

```text
Food Path Exists
Food Path Length
Food Path Safe
Food Path Reason
```

Qwen response still includes:

```text
policy
foodWeight
openSpaceWeight
wallPenalty
bodyPenalty
recentVisitPenalty
reason
```

`LmStudioClient` validates:

```text
implemented policy
finite numeric params
accepted numeric range
bounded reason text
```

CREATE_SPACE integration path:

```text
prompt option
→ LM response validator
→ AgentController assignment
→ local CREATE_SPACE executor
```

Status:

```text
code path:
PASS

CREATE_SPACE fixtures:
PASS

build:
PASS

natural normal-runtime Qwen selection:
NOT YET CAPTURED
```

Qwen remains high-level only.

---

## 15. Legacy Primitive Qwen Plan

Legacy path still exists:

```text
plannedMoves: Direction[]
PlanResponse moves[1..6]
replan()
executePlannedMove()
```

This is not the preferred healthy architecture path.

It may still be reached when normal strategy flow has no usable ActiveStrategy/plan.

Primitive Qwen moves still pass through:

```text
validateDirection()
```

before physical execution.

If Qwen primitive planning fails:

```text
pickSafeDirection()
```

may be used as fallback.

Telemetry such as:

```text
Plan Len
Plan Left
Moves/LLM
```

belongs to this legacy primitive-plan path.

Do not reuse `plannedMoves` for normal local deterministic BFS paths unless telemetry semantics are intentionally redesigned.

Fixed-policy benchmarks gate this Qwen path out.

---

## 16. `runStep()` High-Level Runtime Flow

Normal:

```text
runStep(undefined, 'DYNAMIC')
```

Current flow:

```text
1. guard engine/running/pause/state

2. compute legal moves

3. assessDanger()
   using current pre-move state

4. feed:
   dangerLevel
   reachableCells
   into DangerEpisodeTracker

5. if no legal moves:
   → NO_MOVE / game-over path

6. if directionSource exists:
   → benchmark injection path

7. else if activeStrategy exists:

   EAT_SAFE_FOOD
   → evaluateFoodPath()
   → safe path[0]
   → otherwise weighted local fallback

   SAFE_CHASE
   → weighted StrategyExecutor

   CREATE_SPACE
   → exact uncapped space-first StrategyExecutor

   candidate
   → validateDirection()
   → executeStrategyMove()
   → LOOP / progress / stagnation tracking

8. if failedStrategy exists
   and not fixed-policy:
   → optimizeStrategy()

9. otherwise when allowed:
   → legacy primitive Qwen plan / replan / local fallback
```

### Benchmark injection exception

When `directionSource` is supplied:

```text
candidate
→ engine.setDirection()
→ engine.step()
```

This injected path does not follow the same normal:

```text
SafetyLayer
ActiveStrategy
LOOP
progress
stagnation
```

lifecycle.

Do not claim every local benchmark direction goes through SafetyLayer.

---

## 17. Benchmarks / Experiment Evidence

Detailed benchmark history:

```text
BENCHMARK_NOTES.md
```

PROJECT_MAP keeps only architecture-relevant semantics.

### runLocalBenchmark(seed, maxSteps, policy?)

Without explicit policy:

```text
initial strategy = EAT_SAFE_FOOD
_fixedPolicy = false
existing adaptive benchmark behavior preserved
```

With explicit policy:

```text
_fixedPolicy = true
Qwen disabled
policy identity fixed
SafetyLayer may still change immediate direction
```

Supported:

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

Important:

```text
fixed policy ≠ fixed direction
```

Possible termination:

```text
ENGINE_GAME_OVER
LOOP_DETECTED
STAGNATION_DETECTED
NO_MOVE
MAX_STEPS
```

### runRecoveryBenchmark(seed, maxSteps, recoverySteps = 40)

Benchmark-only lifecycle:

```text
fixed EAT_SAFE_FOOD
→ first STAGNATION
→ assign fresh CREATE_SPACE ActiveStrategy
→ reset progress / trigger state
→ run CREATE_SPACE for recoverySteps
→ ignore repeated STAGNATION termination while recovery is active
→ assign fresh EAT_SAFE_FOOD
→ reset progress / trigger state
→ continue
```

Only one recovery episode.

Qwen is disabled for the whole run.

Important implementation invariant:

```text
The recovery phase must change activeStrategy itself.

A local phase label alone does not change the policy
executed by runStep().
```

During active CREATE_SPACE recovery:

```text
STAGNATION_DETECTED does not prematurely terminate
the benchmark before recoverySteps are exhausted.
```

This is benchmark-only behavior.

Normal runtime does not automatically perform a fixed 40-step CREATE_SPACE recovery.

### runSafeBfsBenchmark(seed, maxSteps)

Uses `directionSource` benchmark injection.

Therefore it is not apples-to-apples with fixed-policy `runLocalBenchmark()`.

### Current benchmark conclusion

```text
EAT_SAFE_FOOD
→ preferred current default

SAFE_CHASE
→ poor controlled fixed-policy performance

CREATE_SPACE whole-run
→ poor fit

CREATE_SPACE 40-step STAGNATION recovery
→ promising
→ corrected runtime benchmark:
   3/25 triggered
   3/3 completed
   3/3 improved
   22/22 non-triggered cases identical to baseline
→ sample remains small

NO_MOVE
→ unresolved failure class

LOW_MOBILITY streak alone
→ poor PRE_TRAP specificity

reachable-space LOW_MOBILITY episode drop
→ implemented
→ BUILD PASS
→ runtime evidence pending
```

---

## 18. Local Benchmark Danger Telemetry

Current `LocalBenchmarkResult` exposes:

```text
maxLowMobilityStreak
lastLowStreakBeforeDeadEnd
deadEndEventCount
maxLowMobilityReachableDrop
lastLowMobilityReachableDropBeforeDeadEnd
```

These are observational research fields.

They do not change:

```text
policy execution
SafetyLayer semantics
Qwen trigger semantics
benchmark termination semantics
```

Current wiring:

```text
BUILD PASS
```

Runtime evidence for reachable-drop fields:

```text
PENDING
```

---

## 19. Debug API

Source:

```text
src/main.ts
src/global.d.ts
```

Global entrypoint:

```text
window.__snakeDebug
```

Relevant methods:

```text
getState()
setManualMode(enabled)
setDirection(direction)
step()
reset()
getAgentInfo()
setSeed(seed | null)
restart()

runLocalBenchmark(
  seed,
  maxSteps,
  policy?
)

runRecoveryBenchmark(
  seed,
  maxSteps,
  recoverySteps?
)

runSafeBfsBenchmark(
  seed,
  maxSteps
)
```

Supported explicit benchmark policies:

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

Runtime `AgentInfo` may expose richer telemetry than the pushed global debug type declaration models.

Do not assume:

```text
window.__snakeDebug.reset()
```

is identical to every internal controller-reset boundary.

Use the intended benchmark initialization/fresh controller when telemetry isolation matters.

---

## 20. UI / Thinking / Pause

### Thinking streaming

LM Studio SSE reasoning path:

```text
choices[0].delta.reasoning_content
→ LmStudioClient callback
→ AgentController.currentInfo.thinking
→ updateUI()
→ AgentPanel.updateDisplay()
→ Thinking DOM
```

Final response content:

```text
choices[0].delta.content
```

Do not replace real thinking streaming with fake animation.

### Pause flow

Visible flow:

```text
INITIAL
→ START AGENT
→ AGENT ACTIVE
↔ PAUSED
→ GAME OVER
→ RESTART AGENT
```

AgentPanel owns the local async run loop.

Pause protection exists in both:

```text
AgentPanel scheduling
AgentController runStep()
```

An async Qwen response may finish while paused, but completion must not itself move the snake.

### Active diagnostic UI

Current UI includes fields such as:

```text
Last Trigger
No Progress
Live Stag
Budget
Food Dist
Unique Heads
Danger
Mobility
Reachable
Mobility Streak
Max Mobility Streak
Last Low Streak Before Dead End
Dead End Events
```

Trigger-time snapshots are distinct from live stagnation telemetry.

Do not confuse historical trigger snapshot values with current live state.

---

## 21. Revisit Awareness

AgentController stores recent successful head positions.

Current history length:

```text
32
```

StrategyExecutor applies a recency-weighted penalty to candidate cells found in that history.

This is:

```text
a score penalty
```

not:

```text
a hard ban
```

Revisit awareness helps local Greedy behavior but does not replace:

```text
route planning
survival planning
escape planning
```

---

## 22. Current Known Limitations

Not currently implemented:

```text
Danger-based Qwen trigger
LOW_MOBILITY trigger
reachable-drop trigger
PRE_TRAP / SituationAssessment trigger
multi-step danger lookahead
dedicated survival planner
FOLLOW_TAIL
ESCAPE
SAFE_CYCLE / Hamiltonian
A*
formal board-full WIN semantics
full fixed GameSnapshot planner fixture suite
```

Important current limitations:

### Safe food

```text
Safe food validation is heuristic,
not a proof of survival.
```

### SAFE_CHASE

```text
one-step Greedy
not survival planning
```

### CREATE_SPACE

```text
implemented
poor as whole-run policy
promising as temporary STAGNATION recovery
```

### Recovery evidence

```text
corrected runtime benchmark:
3 actual STAGNATION recovery episodes
3/3 completed
3/3 improved

22 non-triggered cases:
identical to baseline

promising
but not broad proof
```

### NO_MOVE

```text
remains unresolved
can occur before STAGNATION recovery
```

### Trigger timing

Confirmed runtime evidence shows:

```text
death can occur while
Last Trigger = -
Live Stag is far below 80
Qwen calls = 0
```

### Danger

```text
observational only
```

### Reachable-drop telemetry

```text
implemented
BUILD PASS
runtime evidence pending
```

### Board dimensions

```text
still duplicated between
GameEngine-derived geometry
and AgentController constants
```

### AgentController size

`src/agent/agent-controller.ts` remains a large high-context orchestration file.

Further extraction should be incremental.

Do not split it broadly only to reduce line count.

---

## 23. Current Development Direction

Keep these two axes separate.

```text
A. Capability
What high-level deterministic tools can Qwen select?

B. Trigger / Situation Assessment
When should Qwen be asked to select again?
```

Do not normally add a new policy and new trigger in the same experiment.

### Completed capability

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

### Current research

```text
death-window / reachable-space deterioration telemetry
```

Question:

```text
Can we detect a repeatable pre-trap state early enough
for a strategy change to matter?
```

### After evidence

Potential next work:

```text
PRE_TRAP / SituationAssessment
FOLLOW_TAIL
ESCAPE
SAFE_CYCLE / Hamiltonian
```

Recommended order is evidence-driven rather than fixed if new runtime evidence changes priorities.

---

## 24. AgentController Decomposition Direction

AgentController remains:

```text
the orchestration layer
```

It should keep responsibilities such as:

```text
runtime flow
strategy lifecycle
Qwen high-level decision flow
SafetyLayer integration
trigger coordination
```

Cohesive self-contained state machines/algorithms may move into owned helpers.

Completed example:

```text
DangerEpisodeTracker
```

Current pattern:

```text
AgentController
→ owns helper
→ passes current evidence
→ consumes helper snapshot
```

Preferred future extraction rule:

```text
one cohesive responsibility
→ focused audit
→ focused extraction
→ BUILD PASS
→ STOP
```

Do not perform a broad multi-module rewrite.

Likely future extraction candidate:

```text
benchmark-specific lifecycle / harness
```

but only after a focused coupling audit.

The recent recovery benchmark bug confirms that benchmark lifecycle code
is behaviorally meaningful and should not be treated as disposable test glue.

Loop/stagnation trigger lifecycle is more coupled and should not be the first broad extraction target.

---

## 25. Fast File Guide

| Task | Read first |
| --- | --- |
| Bootstrap / debug API / canvas | `src/main.ts`, `src/global.d.ts` |
| Engine / collision / RNG | `src/game/engine.ts`, `src/game/types.ts` |
| Agent orchestration / triggers | `src/agent/agent-controller.ts` |
| Strategy policy types | `src/agent/types.ts` |
| SAFE_CHASE / CREATE_SPACE | `src/agent/strategy-executor.ts` |
| Immediate legality | `src/agent/safety-layer.ts` |
| BFS planner | `src/agent/path-planner.ts` |
| Virtual simulation | `src/agent/snake-simulator.ts` |
| Safe-food validation | `src/agent/safe-food-validator.ts` |
| Single-tick Danger | `src/agent/danger-monitor.ts` |
| Cross-tick Danger episodes | `src/agent/danger-episode-tracker.ts` |
| Stagnation budget | `src/agent/stagnation-budget.ts` |
| LM strategy/SSE validation | `src/agent/lm-studio-client.ts` |
| Qwen assignment/runtime flow | `src/agent/agent-controller.ts` |
| Active UI | `src/agent-panel.ts` |
| Active styling | `src/style.css` |
| Canvas rendering | `src/game/renderer.ts` |
| Benchmark evidence | `BENCHMARK_NOTES.md` |
| OpenCode/Git workflow | `AGENTS.md` |

For `agent-controller.ts`:

```text
locate exact symbol
→ narrow read
```

Do not full-read it for a narrow task unless genuinely necessary.

---

## 26. Documentation Ownership

### PROJECT_MAP.md

Owns:

```text
current architecture
active files
runtime ownership
strategy semantics
trigger semantics
important engine behavior
benchmark API semantics
current limitations
research direction
```

### BENCHMARK_NOTES.md

Owns:

```text
seed-level benchmark evidence
scores
step counts
recovery deltas
death-window experiment results
experimental comparisons that remain relevant
```

Invalidated benchmark conclusions should be replaced by corrected evidence rather than retained as active evidence.

### AGENTS.md

Owns:

```text
OpenCode workflow
session discipline
context discipline
Git safety
PowerShell rules
build/test operating rules
```

Do not duplicate large sections across all three documents.

---

## 27. PROJECT_MAP Renewal Policy

Update PROJECT_MAP when changes affect:

```text
active runtime ownership
new modules
strategy policies
AgentController runtime flow
Qwen responsibilities
SafetyLayer responsibility
GameEngine semantics
LOOP / stagnation semantics
Danger semantics
Danger episode ownership
PRE_TRAP semantics
planner architecture
benchmark/debug API semantics
active-vs-legacy ownership
major telemetry ownership
```

Usually do not update it for:

```text
font tweaks
padding
small colors
minor layout cosmetics
small copy changes
```

Renew when roughly:

```text
2–4 meaningful architecture changes accumulate
or
a fresh consumer would be materially misled
or
before an important architecture checkpoint/handoff
```

Detailed benchmark results should go to:

```text
BENCHMARK_NOTES.md
```

Workflow-rule changes should go to:

```text
AGENTS.md
```

---

## 28. High-Confidence Anchors

```text
Repository:
https://github.com/spiraleyeld/ai-snake-game-agent

Local:
D:\Projects\snake-game

Latest pushed architecture source checkpoint:
6f0c8eb

Latest pushed documentation checkpoint:
4a1415e

Frontend:
Vanilla TypeScript + Vite + Canvas 2D

Canvas:
640×240

Grid:
20 px

Board:
32×12 / 384 cells

Agent constants:
COLS = 32
ROWS = 12

Default policy:
EAT_SAFE_FOOD

Implemented policies:
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE

CREATE_SPACE:
implemented
exact uncapped reachable-space primary
food-progress tie-break
deterministic

CREATE_SPACE whole-run:
poor fit

CREATE_SPACE STAGNATION recovery:
promising
corrected benchmark semantics
3/25 triggered
3/3 completed
3/3 improved
22/22 non-triggered identical
sample still small

Recovery benchmark:
first STAGNATION
→ fresh CREATE_SPACE ActiveStrategy
→ 40-step recovery
→ repeated STAGNATION ignored during recovery
→ fresh EAT_SAFE_FOOD

DangerMonitor:
src/agent/danger-monitor.ts
pure single-tick assessment

DangerEpisodeTracker:
src/agent/danger-episode-tracker.ts
cross-tick Danger episode state
implemented/pushed

Reachable-drop telemetry:
implemented/pushed
BUILD PASS
runtime evidence pending

Qwen normal triggers:
LOOP_DETECTED
STAGNATION_DETECTED

Danger trigger Qwen:
NO

LOW_MOBILITY trigger:
NO

Reachable-drop trigger:
NO

PRE_TRAP:
NOT IMPLEMENTED

Current trigger problem:
real runtime death observed before
LOOP/STAGNATION summoned Qwen

Qwen role:
high-level strategy / exception reasoning

Local TypeScript role:
deterministic per-tick execution

SafetyLayer:
immediate legality

GameEngine:
physical state transition

Active UI:
src/agent-panel.ts
src/style.css
src/main.ts

Legacy primitive Qwen moves:
fallback path
not healthy primary architecture

Detailed benchmark evidence:
BENCHMARK_NOTES.md

OpenCode workflow:
AGENTS.md
```

---

# Core Principle

```text
Qwen decides high-level strategy.

Local TypeScript executes deterministic navigation
and local safety reasoning.

SafetyLayer validates immediate legality.

GameEngine owns physical state transitions.
```

Target architecture:

```text
Qwen chooses what objective matters now.
Local deterministic systems decide how to execute it safely.
```

`AgentController` remains the orchestration layer.

Cohesive deterministic state machines may live in focused helper modules.

Do not regress Qwen into normal per-tick primitive direction control.