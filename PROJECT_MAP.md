# PROJECT_MAP — Snake Game + Local Qwen Agent

> Reconciled against local source checkpoint `fec2ee4`, current runtime evidence, and the latest GitHub `main` available before this local checkpoint on 2026-09-09.
> Purpose: fast onboarding for fresh OpenCode / ChatGPT sessions without broad repository rediscovery.

## 0. Authority

Implementation truth:

```text
CURRENT LOCAL RUNTIME EVIDENCE
> CURRENT LOCAL SOURCE
> local git diff / git status
> latest GitHub main source
> latest GitHub PROJECT_MAP.md
> handoff / current conversation evidence
> old assumptions
```
- If this file conflicts with source, source wins and this file should be updated.
- `AGENTS.md` governs OpenCode workflow, Git safety, testing, permissions, and security.
- Do not infer runtime behavior from legacy duplicate files.
- Cosmetic CSS-only work usually does not require an architecture-map update.
- Absence from GitHub does not prove absence from the local working tree.

---

## 1. Current Stack / Active Runtime

```text
Project: D:\Projects\snake-game
Frontend: Vanilla TypeScript + Vite + Canvas 2D
LM Studio: http://127.0.0.1:1234
Dev app: http://127.0.0.1:5173/
Canvas: 640×240
Grid size: 20 px
Board: 32×12 = 384 cells
```

Active object graph:

```text
src/main.ts
├─ GameEngine          → src/game/engine.ts
├─ Renderer            → src/game/renderer.ts
├─ InputHandler        → src/game/input.ts
├─ AgentController     → src/agent/agent-controller.ts
│  ├─ LmStudioClient      → src/agent/lm-studio-client.ts
│  ├─ SafetyLayer         → src/agent/safety-layer.ts
│  ├─ StrategyExecutor    → src/agent/strategy-executor.ts
│  ├─ AgentMemory         → src/agent/agent-memory.ts
│  ├─ PathPlanner         → src/agent/path-planner.ts
│  ├─ SnakeSimulator      → src/agent/snake-simulator.ts
│  ├─ SafeFoodValidator   → src/agent/safe-food-validator.ts
│  ├─ DangerMonitor       → src/agent/danger-monitor.ts
│  └─ StagnationBudget    → src/agent/stagnation-budget.ts
└─ AgentPanel          → src/agent-panel.ts
```

### Active UI ownership

```text
UI implementation: src/agent-panel.ts
UI styling:        src/style.css
Bootstrap/import:  src/main.ts
Panel order:       Thinking | Snake | Control
Desktop ratio:     2 : 6 : 2
```

Desktop grid uses:

```text
minmax(0, 2fr) minmax(0, 6fr) minmax(0, 2fr)
```

so long Thinking content cannot expand its track and squeeze Control.

Current game frame:

```text
logical canvas: 640×240
aspect ratio:    8:3
middle-column width retained
game frame vertically centered
left/right panels remain full-height
```

The shorter visible frame is the actual current playable game area, not a crop of a hidden 32×24 board.

### Local-only legacy / duplicate risk

These files are not present on the pushed GitHub checkpoint previously inspected, but remain known local untracked files:

```text
src/agent/AgentPanel.jsx
src/agent/AgentPanel.css
src/agent/LMStudioClient.ts
src/agent/promptBuilder.ts
```

Absence from GitHub does not prove absence from:

```text
D:\Projects\snake-game
```

If a task could touch these paths, check current imports / local evidence first.

Do not treat them as active runtime files unless the current local import graph proves otherwise.

Do not edit, delete, stage, or adopt them into the formal architecture as a side effect of unrelated work.

---

## 2. Git Snapshot / Safety

Current local source checkpoint:

```text
fec2ee4 feat: use half-height board and align runtime UI
```

Major source-state changes represented by this checkpoint include:

```text
src/main.ts
→ canvas height 480 → 240
→ current logical game geometry becomes 640×240 / 32×12

src/agent/agent-controller.ts
→ Agent COLS = 32
→ Agent ROWS = 12
→ fixes confirmed stale 24-row Agent-world mismatch

src/style.css
→ shorter 8:3 game frame
→ frame aligned vertically in the middle column

src/game/renderer.ts
→ start-screen vertical text placement adjusted for shorter canvas
```

The previous important source checkpoint:

```text
5c52212 feat: default to safe food and expose danger telemetry
```

remains historically important because it introduced:

```text
default EAT_SAFE_FOOD
Danger episode telemetry
Danger episode UI rendering
```

but it is no longer the current local source checkpoint.

Repository:

```text
origin/main → https://github.com/spiraleyeld/ai-snake-game-agent
```

Important:

> GitHub `main` is only the latest pushed checkpoint. Current local source may be newer.

Before relying on GitHub-only absence/presence for local-file decisions, obtain:

```powershell
git status --short
```

when the distinction matters.

Before important Git actions:

```powershell
git status --short
git log --oneline --decorate -8
```

Never casually use:

```text
git add .
git add -A
git reset --hard
git restore .
git clean -fd
```

Stage explicit intended files only.

---

## 3. GameEngine Semantics

Source:

```text
src/game/engine.ts
```

Directions:

```text
Up | Down | Left | Right
```

Game states:

```text
Start | Playing | Paused | GameOver
```

Fresh `start()`:

```text
3-segment snake near center
initial direction Right
score 0
speed 150 ms
seeded RNG state reset when seed != null
spawnFood()
```

Logical tick:

```text
apply queued direction
→ compute new head
→ wall collision check
→ current full-body collision check
→ add head
→ if food: score++, grow, spawn food
→ else: remove tail
```

Important collision semantic:

> The current tail cell is still occupied during collision checking. Tail removal happens only after the new head is accepted.

Agent physical movement normally uses manual mode:

```text
engine.setManualMode(true)
engine.setDirection(direction)
engine.step()
```

When manual mode is on, normal animation-loop `engine.tick()` does not move the snake.

### Current board geometry

GameEngine derives physical board bounds from canvas dimensions and grid size.

Current source/runtime:

```text
canvas = 640×240
grid   = 20
cols   = 32
rows   = 12
```

Wall collision and food-spawn bounds therefore operate on the current 32×12 board.

---

## 4. Deterministic Food RNG

Deterministic seed support is IMPLEMENTED in `GameEngine`.

```text
private _seed: number | null
private _rngState: number
setSeed(seed | null)
getSeed()
private random()
spawnFood() uses random()
```

Behavior:

```text
seed === null → Math.random()
seed !== null → deterministic local PRNG
start() resets _rngState from _seed
initial food and later food both use the same RNG path
```

Use:

```js
window.__snakeDebug.setSeed(1001)
window.__snakeDebug.restart()
```

`setSeed(null)` restores normal non-deterministic food spawning.

Important limitation:

> The same seed guarantees reproducibility only for the same execution path and board geometry. Different planners or board dimensions can change occupied cells and food-candidate rejection behavior.

---

## 5. Current UI / Pause Flow

Source:

```text
src/agent-panel.ts
src/style.css
src/agent/agent-controller.ts
src/game/renderer.ts
```

Visible AI flow:

```text
INITIAL
→ START AGENT
→ AGENT ACTIVE + PAUSE
↔ RESUME
→ GAME OVER
→ RESTART AGENT
```

The PAUSE slot is rendered even before Start, but disabled, to avoid action-row layout shift.

AgentPanel owns a local async timer loop:

```text
controller.runStep()
→ delay based on speed selector
→ next runStep()
```

Pause safety:

* AgentPanel stops scheduling the local loop while paused.
* AgentController rejects `runStep()` while paused.
* Movement helpers guard against physical stepping while paused.
* An async Qwen response may finish while paused, but completion must not itself move the snake.

Current desktop layout:

```text
AGENT THINKING | SNAKE | AGENT CONTROL
      2        |   6   |       2
```

Current center-game presentation:

```text
game frame width: middle-column width
game frame ratio: 8:3
game frame: vertically centered
left/right panels: full-height
```

The visual frame now corresponds to the current 640×240 playable board.

Control values are intentionally compact; ordinary stat/diagnostic values use smaller tabular numeric text.

Thinking text uses wrapping rules so long JSON / identifiers do not expand the left grid track.

Start-screen blue/gray instructional text is positioned for the shorter 240 px canvas rather than the historical 480 px canvas.

---

## 6. Real LM Studio Thinking Streaming

`AGENT THINKING` displays real SSE reasoning from LM Studio.

```text
choices[0].delta.reasoning_content
→ LmStudioClient callback
→ AgentController.currentInfo.thinking
→ updateUI()
→ AgentPanel.updateDisplay()
→ Thinking panel DOM
```

Final response content is accumulated from:

```text
choices[0].delta.content
```

Do not replace this with fake timeout / typing animation thinking.

---

## 7. Primary Agent Architecture

Core separation:

```text
Qwen = slow high-level strategy / exception reasoning
Local TypeScript = fast navigation / simulation / safety evidence
SafetyLayer = immediate legality gate
GameEngine = physical state transition
```

Qwen must not become the normal per-tick primitive Snake driver.

Current normal policy path:

```text
ActiveStrategy
├─ SAFE_CHASE
│  └─ StrategyExecutor weighted local Greedy
│
└─ EAT_SAFE_FOOD
   └─ evaluateFoodPath()
      ├─ BFS to food
      ├─ full path simulation
      └─ post-food tail-reachability heuristic
      → safe path[0]

candidate
→ validateDirection()
→ executeStrategyMove()
→ engine.setDirection()
→ engine.step()
```

If EAT_SAFE_FOOD cannot produce a confirmed safe non-empty path, normal runtime falls back to the current weighted Greedy `StrategyExecutor` for that tick.

### Board-dimension synchronization

Current physical board:

```text
32×12
```

Current AgentController constants:

```text
COLS = 32
ROWS = 12
```

Important architecture debt:

> GameEngine physical dimensions and AgentController logical dimensions are not currently derived from one shared source of truth.

During the 32×24 → 32×12 migration, `GameEngine` correctly derived 12 rows from the shorter canvas while `AgentController` temporarily remained hard-coded at 24 rows.

That produced a confirmed runtime bug:

```text
Agent Safety/planner world: y = 0..23
GameEngine physical world:  y = 0..11
```

The Agent could therefore treat `y >= 12` as legal while GameEngine treated the same move as a wall collision.

Current source checkpoint `fec2ee4` fixes this mismatch:

```text
Agent COLS = 32
Agent ROWS = 12
```

Future board-geometry changes must explicitly verify Engine and Agent dimensions remain synchronized.

---

## 8. ActiveStrategy / Policies

Source:

```text
src/agent/types.ts
src/agent/agent-controller.ts
```

```ts
export type StrategyPolicy = 'SAFE_CHASE' | 'EAT_SAFE_FOOD';

export interface ActiveStrategy {
  policy: StrategyPolicy;
  params: {
    foodWeight: number;
    openSpaceWeight: number;
    wallPenalty: number;
    bodyPenalty: number;
    recentVisitPenalty: number;
  };
  startedAtStep: number;
}
```

Default strategy created at normal game / local benchmark initialization:

```text
policy              EAT_SAFE_FOOD
foodWeight          1.0
openSpaceWeight     0.4
wallPenalty         0.3
bodyPenalty         0.8
recentVisitPenalty  0.0
```

`createDefaultStrategy()` is the shared default-strategy factory.

SAFE_CHASE remains implemented and Qwen-selectable; only the default initialization policy changed.

Current implemented strategic tools remain:

```text
SAFE_CHASE
EAT_SAFE_FOOD
```

Future names such as:

```text
CREATE_SPACE
FOLLOW_TAIL
ESCAPE
SAFE_CYCLE
```

are NOT implemented yet.

---

## 9. SAFE_CHASE / StrategyExecutor

Source:

```text
src/agent/strategy-executor.ts
```

For each legal immediate direction, the executor scores:

```text
food progress
+ body-aware open-space score
- wall risk
- body proximity risk
- recent-visit penalty
```

Then it chooses the highest-scoring immediate direction.

### Body-aware open space is implemented

`countOpenSpace()` receives `snakeBody`, builds a `bodySet`, and blocks body cells during flood fill.

```text
countOpenSpace(nx, ny, snakeBody, cols, rows)
```

The flood fill is capped at 200 cells for performance.

On the current 384-cell board, that cap still means the metric is not a complete full-board reachable-area measurement in all large-open-space states.

SAFE_CHASE remains a one-step Greedy policy.

It does not itself represent a committed multi-step detour or dedicated survival planner.

---

## 10. EAT_SAFE_FOOD / Local Planner

### `path-planner.ts`

Pure deterministic BFS:

```text
findPath(start, target, blocked, cols, rows, currentDirection?)
→ Direction[] | null
```

Characteristics:

* deterministic direction order: Up, Down, Left, Right
* prevents immediate 180° reversal at the start node when current direction is supplied
* respects board bounds and blocked cells
* does not mutate GameEngine

### `snake-simulator.ts`

`simulatePath()` virtually executes a full Direction path using engine-like semantics:

* opposite requested direction is ignored and current direction executes
* wall collision invalidates simulation
* current full body is checked before tail removal
* food consumption causes growth / no tail pop
* no RNG
* no GameEngine mutation

### `safe-food-validator.ts`

`evaluateFoodPath()` performs:

```text
1. BFS head → food
2. simulate complete food path
3. verify food was actually eaten
4. post-food head → tail reachability heuristic
```

Food-path reasons:

```text
SAFE
NO_FOOD
NO_FOOD_PATH
SIMULATION_INVALID
FOOD_NOT_REACHED
NO_TAIL_ESCAPE
```

For the post-food heuristic only, the current tail cell is temporarily removed from the blocked set before head→tail BFS.

Important:

> Tail reachability is a heuristic, not a proof of long-term survival.

Runtime EAT_SAFE_FOOD replans every tick and executes only:

```text
path[0]
```

---

## 11. Safety Layer

Source:

```text
src/agent/safety-layer.ts
```

Immediate legality checks include:

```text
180° reversal
wall collision
current snake-body collision
```

Normal ActiveStrategy path:

```text
candidate
→ validateDirection()
→ if requested direction is legal: execute it
→ if rejected: SafetyLayer may return fallback direction
```

Current controller behavior is stricter than merely executing the fallback:

> If SafetyLayer overrides an ActiveStrategy candidate, the controller can invalidate the active strategy and fall back toward the higher-level Qwen path on a later tick.

`pickSafeDirection()` also exists for the legacy/Qwen-plan failure path.

Its internal open-space fallback is a separate heuristic and should not be confused with:

```text
StrategyExecutor.countOpenSpace()
```

Current SafetyLayer dimensions must remain consistent with:

```text
32×12
```

---

## 12. Revisit Awareness

AgentController stores recent successful head positions:

```text
recentHeadPositions
max length = 32
```

StrategyExecutor penalizes candidate cells found in recent head history.

More recent matches receive a larger penalty.

This is a score penalty, not a hard ban.

Revisit awareness helps local behavior but does not replace route planning or survival planning.

---

## 13. LOOP Detection

The LOOP detector lifecycle is connected and no longer has the old `lastLoopScore` reset bug.

After a successful ActiveStrategy move:

```text
if score increased OR lastLoopScore === -1:
    reset loop history
    stepsSinceLastScore = 0
    lastLoopScore = current score
else:
    stepsSinceLastScore++
    record full ordered strategy-state signature
    detectLoop()
```

`resetLoopHistory()` clears history and sets:

```text
lastLoopScore = -1
```

State signature includes:

```text
head
direction
food
score
full ordered snake body
recent head positions
all five strategy params
```

LOOP detection uses its own fixed `STAGNATION_THRESHOLD` gate and is independent of dynamic stagnation-budget categories.

On LOOP:

```text
_lastTrigger = LOOP_DETECTED
preserve failedStrategy
capture trigger snapshot
activeStrategy = null
→ optimizeStrategy() on following flow
```

---

## 14. Progress Watchdog / Dynamic Stagnation

Controller tracks:

```text
progressFoodTarget
bestFoodDistance
stepsSinceProgress
_effectiveStagnationThreshold
_stagnationCategory
```

Progress is currently based on Manhattan distance to the current food.

Progress reset conditions:

* food eaten / score increases
* new food target appears
* current food distance improves below previous best

Those resets restore:

```text
stepsSinceProgress = 0
_effectiveStagnationThreshold = 80
_stagnationCategory = NORMAL
```

### StagnationMode

```ts
'FIXED' | 'DYNAMIC'
```

Normal:

```text
runStep()
→ DYNAMIC
```

Benchmark paths explicitly pass:

```text
FIXED
```

### FIXED

Preserves old behavior:

```text
stepsSinceProgress >= 80
→ STAGNATION_DETECTED
```

### DYNAMIC — current runtime behavior

DYNAMIC starts with effective threshold 80.

Only when:

```text
stepsSinceProgress >= _effectiveStagnationThreshold
```

does the controller evaluate current boundary evidence:

```text
evaluateFoodPath(pre-move state)
+ Danger telemetry computed from the same pre-move tick
→ stagnationBudget(...)
```

Important:

> `updateProgressTracking(state, newStateAfterMove, ...)` is called after a successful move, but distance checks and `evaluateFoodPath()` currently use the pre-move `state`.

`newStateAfterMove` is used for score-increase detection, not for the boundary food-path evaluation.

Pure budget categories:

```text
NORMAL        → 80
REORGANIZING  → clamp(round(reachableCells × 0.25), 80, 200)
PRESSURED     → 40
EMERGENCY     → 0
```

Current controller wiring is intentionally narrower:

> Only REORGANIZING can extend an already-reached runtime boundary above 80.

Current DYNAMIC logic:

```text
if category === REORGANIZING
and returned threshold > current stepsSinceProgress:
    persist larger effective threshold
    do not trigger yet
else:
    STAGNATION_DETECTED
```

Therefore:

* `PRESSURED = 40` does NOT create an early 40-step runtime trigger.
* `EMERGENCY = 0` does NOT make Danger directly trigger Qwen.
* Danger/DEAD_END does not currently bypass the 80-step boundary.

On STAGNATION:

```text
_lastTrigger = STAGNATION_DETECTED
preserve failedStrategy
capture trigger snapshot
activeStrategy = null
reset progress / loop tracking
→ optimizeStrategy() in following flow
```

---

## 15. Danger Monitor / Episode Telemetry

Source:

```text
src/agent/danger-monitor.ts
src/agent/agent-controller.ts
```

`assessDanger()` is pure local deterministic logic.

Per normal pre-move tick it computes:

```text
legalMoveCount
survivableMoveCount
reachableCells
dangerLevel
```

For each legal current move it simulates one step and counts whether the resulting state still has at least one legal follow-up move.

Danger levels:

```text
SAFE                 survivableMoveCount >= 2
LOW_MOBILITY         survivableMoveCount == 1
DEAD_END_IMMINENT    survivableMoveCount == 0
```

Reachable cells use a body-aware flood fill from the current head, with the head itself excluded from blockers.

### Episode telemetry

```text
currentLowMobilityStreak
maxLowMobilityStreak
lastLowStreakBeforeDeadEnd
deadEndEventCount
```

Semantics:

```text
LOW_MOBILITY
→ current streak++
→ max update

SAFE
→ current streak reset to 0

first transition into DEAD_END_IMMINENT
→ capture prior LOW streak
→ deadEndEventCount++
→ current streak reset

repeated DEAD_END ticks
→ do not increment event count again
```

These four values are exposed through:

```text
AgentInfo
updateUI()
AgentPanel
```

Lifecycle note:

* `initializeLocalRun()` resets strategy/progress/loop state but does not clear all four episode counters.
* Full controller `reset()` clears them.
* Therefore they are controller-session telemetry unless a full reset occurs.

Current active AgentPanel displays:

```text
Danger
Mobility = legal / survivable
Reachable
Mobility Streak
Max Mobility Streak
Last Low Streak Before Dead End
Dead End Events
```

Important:

> Danger is telemetry/evidence only. It does not currently trigger Qwen or directly override normal policy selection.

### Historical Danger evidence warning

The board has changed from:

```text
32×24 / 768 cells
```

to:

```text
32×12 / 384 cells
```

Therefore historical absolute values such as:

```text
Reachable = 21
Max Mobility Streak = 21
Max Mobility Streak = 33
```

must not be turned directly into new 32×12 trigger thresholds.

Absolute reachable-cell thresholds are especially sensitive to board geometry.

Future Danger research should prefer normalized or trend-based evidence where appropriate, for example:

```text
reachable ratio
reachable-space trend
survivable-move trend
distance-to-death
safe-food failure reason
```

---

## 16. Qwen Strategy Optimization Flow

Qwen high-level strategy optimization is event-driven, not called every tick.

Current high-level failure triggers:

```text
LOOP_DETECTED
STAGNATION_DETECTED
```

Both preserve `failedStrategy`, then `optimizeStrategy()` builds a strategy update prompt.

Local Planner Evidence included in strategy planning:

```text
Food Path Exists
Food Path Length
Food Path Safe
Food Path Reason
```

Qwen may return exactly one implemented policy:

```text
SAFE_CHASE
EAT_SAFE_FOOD
```

Returned policy + params become the next `activeStrategy`.

All five numeric params remain required:

```text
foodWeight
openSpaceWeight
wallPenalty
bodyPenalty
recentVisitPenalty
```

They remain useful for SAFE_CHASE and Greedy fallback behavior.

`LmStudioClient.getStrategyUpdate()` validates:

* policy is one of the implemented policies
* all five params are finite numbers
* numeric params are clamped to `0.0..2.0`
* reason is text and rejected if too long

Thinking streams through:

```text
reasoning_content
```

while final JSON is parsed from normal:

```text
content
```

### Important non-triggers

```text
Danger Watchdog     → does NOT trigger Qwen
LOW_MOBILITY        → does NOT trigger Qwen
DEAD_END_IMMINENT   → does NOT trigger Qwen
PRESSURED=40        → does NOT create a Qwen trigger
EMERGENCY=0         → does NOT create a Qwen trigger
```

### Intended strategic direction

Qwen should remain a high-level strategist.

Current implemented strategic toolbox:

```text
EAT_SAFE_FOOD
SAFE_CHASE
```

Potential future high-level modes:

```text
CREATE_SPACE
FOLLOW_TAIL
ESCAPE
```

Potential future completion/endgame mode:

```text
SAFE_CYCLE / HAMILTONIAN
```

These future modes must not be described as implemented until real controller behavior exists.

---

## 17. Legacy Primitive Qwen Plan Path

The older primitive move-plan path still exists:

```text
plannedMoves: Direction[]
PlanResponse moves[1..6]
replan()
executePlannedMove()
```

It is not the healthy primary local-policy path.

It can still be reached when:

* there is no active strategy / recovery strategy
* the primitive plan is empty
* food-change logic requests replanning

Primitive Qwen moves still pass through:

```text
validateDirection()
```

before physical execution.

If SafetyLayer overrides a planned move, the remaining plan is discarded and a later tick replans.

If Qwen fails to produce a primitive plan, controller uses:

```text
pickSafeDirection()
```

as fallback.

Telemetry fields:

```text
Plan Len
Plan Left
Moves/LLM
```

refer to this primitive plan path.

Do not reuse `plannedMoves` for normal local BFS routes unless telemetry semantics are intentionally redesigned.

---

## 18. `runStep()` Current High-Level Flow

Normal call:

```text
runStep(undefined, 'DYNAMIC')
```

High-level flow:

```text
1. guard engine/running/pause/state
2. compute legal moves
3. assessDanger() once for current pre-move state
4. update Danger episode telemetry
5. if no legal moves → game over
6. if directionSource exists → benchmark injection path
7. else if activeStrategy exists:
     EAT_SAFE_FOOD → safe path[0] when available
     otherwise / fallback → weighted Greedy
     → validateDirection()
     → executeStrategyMove()
     → LOOP + progress/stagnation tracking
8. if failedStrategy exists → optimizeStrategy()
9. otherwise primitive Qwen plannedMoves path / safe fallback
```

### Benchmark injection exception

When `directionSource` is supplied, the candidate is sent directly to:

```text
engine.setDirection(direction)
engine.step()
```

That injected benchmark path does not pass through:

```text
validateDirection()
```

and does not run the normal ActiveStrategy loop/progress lifecycle for that step.

Do not generalize:

```text
all local directions pass SafetyLayer
```

to this benchmark injection path.

---

## 19. Debug API

Source:

```text
src/main.ts
src/global.d.ts
```

Exposes:

```text
window.__snakeDebug
```

with:

```text
getState()
setManualMode(enabled)
setDirection(direction)
step()
reset()
getAgentInfo()
setSeed(seed | null)
restart()
runLocalBenchmark(seed, maxSteps)
runSafeBfsBenchmark(seed, maxSteps)
```

Runtime note:

> `window.__snakeDebug.getAgentInfo()` returns the controller's richer runtime `AgentInfo`, but `src/global.d.ts` currently declares an older/narrower `AgentDebugInfo` shape.

The declaration may omit newer:

```text
Thinking
stagnation
Danger
Danger episode fields
```

`getState()` includes:

```text
snake
food
direction
score
highScore
paused
gameOver
gameStarted
speed
manualMode
seed
```

For normal runtime manual testing:

```text
START AGENT
```

must be pressed.

For benchmark-console runs, use the debug benchmark entrypoint instead of pressing START AGENT.

Important reset distinction:

```text
window.__snakeDebug.reset()
≠
full AgentController.reset()
```

Do not assume debug reset clears controller-level telemetry or episode counters.

A fresh page/controller is the reliable clean boundary when controller-level state independence matters.

---

## 20. Benchmarks

### `runLocalBenchmark(seed, maxSteps)`

* initializes a deterministic seeded run
* uses shared default EAT_SAFE_FOOD strategy
* calls `runStep(undefined, 'FIXED')`
* reports explicit termination reason instead of treating all failures as engine game-over

### `runSafeBfsBenchmark(seed, maxSteps)`

* initializes deterministic seeded run
* injects a local `directionSource`
* evaluates Safe-BFS every step
* uses safe food path when available
* otherwise uses StrategyExecutor Greedy fallback
* calls `runStep(directionSource, 'FIXED')`
* tracks safe-BFS usage and fallback reasons

Benchmark stagnation semantics are not identical:

* `runLocalBenchmark()` uses normal ActiveStrategy lifecycle with `runStep(undefined, 'FIXED')`, preserving the fixed 80-step stagnation watchdog.
* `runSafeBfsBenchmark()` supplies `directionSource`; `runStep()` therefore takes the benchmark-injection branch and returns before normal LOOP/progress/stagnation tracking.

Therefore SafeBFS does not generate new:

```text
STAGNATION_DETECTED
LOOP_DETECTED
```

through the normal lifecycle.

Benchmark termination reasons include:

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
LOOP
STAGNATION
```

as equivalent to engine GameOver.

### Board-geometry comparability warning

Current local benchmark geometry:

```text
32×12 / 384 cells
```

Historical results collected under:

```text
32×24 / 768 cells
```

are not directly comparable to new results.

This is true even when:

```text
seed
policy
maxSteps
```

appear identical.

The state space, occupancy ratio, mobility, reachable-cell counts, food candidate rejection behavior, and time-to-fill are different.

Historical SAFE_CHASE-default runs are also not directly comparable with the current EAT_SAFE_FOOD default.

---

## 21. Current Automated Tests

`package.json` currently exposes:

```text
npm run test:danger
npm run test:stagnation
npm run build
```

Current fixture files:

```text
src/agent/__tests__/danger-monitor-fixtures.ts
src/agent/__tests__/stagnation-budget-fixtures.ts
```

There is not currently a package script for a full:

```text
path-planner
snake-simulator
safe-food
CREATE_SPACE
FOLLOW_TAIL
ESCAPE
```

fixture suite.

BUILD PASS is not runtime proof.

---

## 22. Trigger / Diagnostic Telemetry

AgentInfo / active Control UI includes trigger and live-state diagnostics such as:

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

Trigger-time snapshot fields preserve evidence when LOOP/STAGNATION fires:

```text
snapshotStepsSinceProgress
snapshotFoodDistCurrent
snapshotFoodDistBest
snapshotRecentUnique
```

Live stagnation telemetry is separate from trigger snapshots:

```text
liveNoProgress
effectiveStagnationThreshold
stagnationCategory
```

Do not confuse a trigger snapshot with current live state.

---

## 23. Current Known Limitations / Open Work

These are NOT implemented as completed runtime features:

```text
Danger-based Qwen trigger
LOW_MOBILITY persistence trigger
PRE_TRAP / SituationAssessment trigger
multi-step danger lookahead beyond current one-step survivability
dedicated survival / escape planner
FOLLOW_TAIL policy
CREATE_SPACE policy
ESCAPE policy
Hamiltonian / safe-cycle endgame mode
A* planner
formal board-full WIN / completion semantics
full fixed GameSnapshot planner fixture suite
```

Current important limitations:

1. **Safe food is heuristic, not proof.** Head→tail reachability after eating can still lead to later death.

2. **SAFE_CHASE is still one-step Greedy.** Body-aware open space is useful but not a route/survival planner.

3. **Danger is observational.** DEAD_END_IMMINENT can be detected when no survivable move already exists and does not currently trigger Qwen.

4. **PRESSURED=40 is provisional pure logic only.** Current runtime does not use it as an early trigger.

5. **No dedicated survival fallback planner exists.** Unsafe food still falls back to Greedy behavior in EAT_SAFE_FOOD.

6. **Debug type declaration drift remains.** Runtime `getAgentInfo()` exposes more fields than `src/global.d.ts`.

7. **Board dimensions currently have duplicate ownership.** GameEngine derives dimensions from canvas/grid geometry while AgentController uses explicit COLS/ROWS constants. They are currently synchronized at 32×12, but a stale Agent `ROWS=24` value caused a confirmed runtime wall-collision bug during the half-height migration.

8. **Current Danger thresholds/evidence were historically observed on a different board geometry.** Absolute 32×24 evidence must not be copied directly into 32×12 trigger rules.

Future policy names must remain marked FUTURE until real deterministic executor/controller behavior exists.

---

## 24. Current Recommended Research / Development Order

Do not mix these into one OpenCode patch.

Two research axes must remain separate:

```text
A. Capability
   What high-level tools can Qwen choose?

B. Trigger / Situation Assessment
   When should Qwen be asked to choose again?
```

Do not add a new policy and a new trigger in the same experiment unless the interaction itself is the explicit research target.

Suggested order from current `fec2ee4` source state:

```text
0. Establish a controlled 32×12 research baseline
   - confirm benchmark semantics
   - distinguish adaptive vs fixed-policy evidence
   - audit board-full / WIN semantics before completion work

1. CREATE_SPACE
   - design as a deterministic local policy
   - primary objective: improve future usable space, not food progress
   - implement locally first
   - add focused fixtures / controlled states
   - compare against EAT_SAFE_FOOD / SAFE_CHASE under controlled conditions
   - only then expose it to Qwen

2. FOLLOW_TAIL
   - implement as a semantically distinct deterministic policy
   - use tail/body structure to reorganize safely and buy time
   - fixture / benchmark before Qwen integration

3. Death-window telemetry research
   - collect evidence before changing triggers
   - measure survivableMoveCount
   - reachable-space trend / normalized reachable evidence
   - safe-food rejection reason
   - LOW_MOBILITY persistence
   - policy active at each point
   - distance-to-death / recovery

4. PRE_TRAP / SituationAssessment
   - telemetry first
   - validate predictive value and false-positive rate
   - only then consider PRE_TRAP → Qwen optimization

5. ESCAPE
   - design from observed failure states
   - multi-step survival reasoning rather than another renamed Greedy
   - fixture / controlled benchmark
   - Qwen integration only after local evidence

6. SAFE_CYCLE / Hamiltonian completion mode
   - treat primarily as endgame/completion capability
   - keep separate from normal Qwen primitive control
   - pair with explicit board-full completion semantics if required
```

Current intended strategic architecture:

```text
Qwen
→ chooses high-level policy / parameters
→ local deterministic executor
→ SafetyLayer
→ GameEngine
```

Potential mature strategic toolbox:

```text
EAT_SAFE_FOOD
CREATE_SPACE
FOLLOW_TAIL
ESCAPE
```

with:

```text
SAFE_CHASE
```

remaining as a general-purpose heuristic/fallback if still useful.

Potential endgame/completion mode:

```text
SAFE_CYCLE / HAMILTONIAN
```

Qwen should not regress into normal per-tick primitive direction control.

---

## 25. Success Criteria for Future Planner Changes

Prefer evidence from:

```text
fixed fixtures
deterministic seed batches
controlled policy comparisons
runtime death/recovery episodes
```

Useful measures:

```text
median food collected
median survival steps
LOOP/STAGNATION frequency
Qwen calls
Qwen calls per food
safe-BFS usage
fallback reasons
engine game-over vs non-game-over termination
Danger transition counts
recovery after LOW_MOBILITY
distance from warning signal to death
```

Because the current board is 32×12, normalized measures can be more useful than historical absolute thresholds:

```text
reachable ratio
body occupancy ratio
reachable trend
survivable-move trend
```

Most important capability question:

> Can local deterministic logic safely solve states that require temporarily moving away from food, reorganizing around the body, or explicitly surviving danger without turning Qwen into a primitive per-tick driver?

Most important trigger question:

> Does death usually have a deterministic, observable pre-trap / space-collapse window early enough for a strategy change to matter?

Do not judge a planner from one lucky high-score run.

---

## 26. OpenCode Session Discipline

The local Qwen can context-drift in long sessions.

Warning signs:

```text
re-reads same files
repeats Thought / Grep / Read loops
opens legacy paths
re-checks after BUILD PASS
starts a second verification pass without need
```

When observed:

```text
Esc
/new
```

### Audit mode

Audit prompts may include:

```text
runtime evidence
source relationships
hypotheses
classification
decision criteria
```

because audit exists to discover the cause/design.

Still:

```text
use symbol search first
read narrow ranges only
avoid full-file reads
inspect 1–3 relevant files
STOP when evidence is sufficient
```

### Implementation mode — single-point strike

Once audit/root cause/design is confirmed:

```text
GPT owns reasoning
Local Qwen executes one confirmed small change
```

Implementation prompts should normally be short:

```text
one task
one file when possible
one symbol/change
minimal verification
STOP
```

Do not restate the full audit into the implementation prompt.

If implementation unexpectedly requires wider scope:

```text
STOP
report blocker / required file
start a fresh session if needed
```

Recommended workflow:

```text
/new
→ locate known symbol
→ narrow read
→ one small patch
→ minimum required build/test
→ report
→ STOP
```

After BUILD PASS:

```text
no unnecessary source re-read
no broad Grep
no "one more verification"
no optional cleanup
```

For UI-only work, do not broadly read PROJECT_MAP or the source tree unless architecture context is actually required.

---

## 27. Runtime / Test Discipline

* BUILD PASS ≠ RUNTIME PASS.
* EDIT PASS ≠ BUILD PASS.
* TEST PASS ≠ RUNTIME PASS.
* Manual runtime observation is preferred for actual Snake/Qwen behavior when practical.
* Avoid Playwright while Snake is actively using LM Studio / the same GPU.
* If reload/navigation resets Score, Steps, or LLM Calls, the before/after sample is invalid.
* Prefer pure TypeScript fixtures for deterministic local logic.
* Do not rerun expensive old benchmarks unless a behavior-changing patch invalidates the comparison.
* Do not infer 32×12 behavior from old 32×24 runtime statistics without a controlled reason.

---

## 28. Fast File Guide

| Task                                             | Read first                                |
| ------------------------------------------------ | ----------------------------------------- |
| Bootstrap / debug API / canvas geometry          | `src/main.ts`, `src/global.d.ts`          |
| Engine / collision / RNG                         | `src/game/engine.ts`, `src/game/types.ts` |
| Agent primary flow / triggers / Agent dimensions | `src/agent/agent-controller.ts`           |
| Strategy types                                   | `src/agent/types.ts`                      |
| SAFE_CHASE scoring                               | `src/agent/strategy-executor.ts`          |
| Immediate legality                               | `src/agent/safety-layer.ts`               |
| BFS                                              | `src/agent/path-planner.ts`               |
| Virtual path simulation                          | `src/agent/snake-simulator.ts`            |
| Safe food validation                             | `src/agent/safe-food-validator.ts`        |
| Danger assessment                                | `src/agent/danger-monitor.ts`             |
| Dynamic stagnation budget                        | `src/agent/stagnation-budget.ts`          |
| LM SSE / strategy response                       | `src/agent/lm-studio-client.ts`           |
| Active Control / Thinking DOM                    | `src/agent-panel.ts`                      |
| Active layout / UI styling                       | `src/style.css`                           |
| Start/game Canvas rendering                      | `src/game/renderer.ts`                    |
| Workflow / Git / tests                           | `AGENTS.md`                               |

Avoid broad repository discovery if the task maps cleanly to this table.

---

## 29. PROJECT_MAP Update Policy

Update this file when code changes affect:

```text
active runtime files/imports
board/canvas geometry
Agent/GameEngine dimension ownership or synchronization
GameEngine lifecycle or RNG
StrategyPolicy / ActiveStrategy schema
SAFE_CHASE behavior
EAT_SAFE_FOOD behavior
CREATE_SPACE / FOLLOW_TAIL / ESCAPE implementation
planner/simulator/safe-food modules
LOOP / progress / stagnation semantics
Danger semantics or trigger wiring
SituationAssessment / PRE_TRAP semantics
Qwen strategy optimization
primitive plannedMoves fallback semantics
SafetyLayer responsibility
benchmark semantics/debug APIs
SAFE_CYCLE / completion semantics
active-vs-legacy UI ownership
major telemetry fields
```

Usually do NOT update this file for:

```text
font-size tweaks
padding / spacing
small color changes
start-screen text position polish
minor CSS cosmetics
```

A layout change should only be documented when it affects current runtime ownership/geometry strongly enough to mislead a fresh session.

---

## 30. New Session Startup

Use this mental model:

```text
1. Read PROJECT_MAP.md first.
2. Read AGENTS.md for OpenCode workflow discipline.
3. Treat CURRENT LOCAL SOURCE / RUNTIME as higher authority.
4. Check local git status when local-vs-GitHub distinction matters.
5. Ignore legacy duplicate files unless explicitly relevant.
6. Read only ACTIVE files needed for the current task.
7. Do not mix architecture phases in one patch.
8. If source changes architecture, reconcile PROJECT_MAP at an appropriate checkpoint.
```

For board-related work, explicitly verify both:

```text
GameEngine physical dimensions
Agent logical dimensions
```

Do not assume changing canvas geometry automatically updates AgentController constants.

---

## 31. High-Confidence Anchors

```text
Current local source checkpoint: fec2ee4
Entry:                    src/main.ts
Framework:                Vanilla TypeScript + Vite + Canvas 2D
Canvas:                   640×240
Grid:                     20 px
Board:                    32×12 / 384 cells
Agent board constants:    COLS=32 / ROWS=12
AgentController:          src/agent/agent-controller.ts
Default policy:           EAT_SAFE_FOOD
Implemented policies:     SAFE_CHASE | EAT_SAFE_FOOD
Greedy executor:          src/agent/strategy-executor.ts
BFS planner:              src/agent/path-planner.ts
Virtual simulator:        src/agent/snake-simulator.ts
Safe-food validator:      src/agent/safe-food-validator.ts
Danger monitor:           src/agent/danger-monitor.ts
Stagnation budget:        src/agent/stagnation-budget.ts
LM client:                src/agent/lm-studio-client.ts
Active UI:                src/agent-panel.ts + src/style.css
Renderer:                 src/game/renderer.ts
Panel layout:             Thinking | Snake | Control = 2:6:2
Game frame:               8:3, vertically centered
LM streaming:             reasoning_content + content SSE
Normal stagnation mode:   DYNAMIC
Local benchmark stagnation: FIXED = 80
SafeBFS injection:         bypasses normal LOOP/progress/stagnation lifecycle
Danger trigger Qwen:      NO
PRESSURED=40 early use:   NO
CREATE_SPACE:             NOT IMPLEMENTED
FOLLOW_TAIL:              NOT IMPLEMENTED
ESCAPE:                   NOT IMPLEMENTED
SAFE_CYCLE/Hamiltonian:   NOT IMPLEMENTED
Debug API:                window.__snakeDebug
Legacy moves[1..6]:       fallback path, not healthy primary control
```

---

# Core Principle

```text
Qwen decides high-level strategy.
Local TypeScript decides navigation and local safety evidence.
SafetyLayer validates immediate normal-runtime candidates.
GameEngine owns physical state transitions.
```

Target direction:

```text
Qwen chooses what objective should matter now.
Local deterministic planners decide how to execute it safely.
```

Do not regress Qwen into normal per-tick primitive direction control.