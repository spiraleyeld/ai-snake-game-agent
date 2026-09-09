# PROJECT_MAP — Snake Game + Local Qwen Agent

> Reconciled against GitHub `main`, current local source, and runtime evidence through 2026-09-09.
> Latest pushed architecture checkpoint: `af1d924` — `feat: add create-space strategy and recovery benchmarking`.
> GitHub `main` now includes CREATE_SPACE, fixed-policy benchmarking, recovery benchmarking, Qwen CREATE_SPACE integration, and this renewed PROJECT_MAP.
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

Current pushed architecture checkpoint:

```text
af1d924 feat: add create-space strategy and recovery benchmarking
```

This checkpoint includes:

```text
CREATE_SPACE deterministic local policy
CREATE_SPACE focused fixtures
fixed-policy runLocalBenchmark(policy?)
runRecoveryBenchmark()
debug API / global type updates
Qwen CREATE_SPACE prompt / validation / controller assignment
renewed PROJECT_MAP
```

GitHub `main` and this PROJECT_MAP now describe the same architecture checkpoint.

The previous source checkpoint:

```text
fec2ee4 feat: use half-height board and align runtime UI
```

remains historically important because it introduced the current 32×12 runtime geometry.

Major source-state changes represented by `fec2ee4` include:

```text
src/main.ts
→ canvas height 480 → 240
→ logical geometry 640×240 / 32×12

src/agent/agent-controller.ts
→ Agent COLS = 32
→ Agent ROWS = 12
→ fixed stale 24-row Agent-world mismatch

src/style.css
→ shorter 8:3 game frame
→ frame aligned vertically in middle column

src/game/renderer.ts
→ start-screen vertical text placement adjusted
```

The previous important checkpoint:

```text
5c52212 feat: default to safe food and expose danger telemetry
```

remains historically important because it introduced:

```text
default EAT_SAFE_FOOD
Danger episode telemetry
Danger episode UI rendering
```

Repository:

```text
origin/main → https://github.com/spiraleyeld/ai-snake-game-agent
```

Important:

> GitHub `main` is the latest pushed checkpoint. Current local source may become newer again after future uncommitted work.

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

- AgentPanel stops scheduling the local loop while paused.
- AgentController rejects `runStep()` while paused.
- Movement helpers guard against physical stepping while paused.
- An async Qwen response may finish while paused, but completion must not itself move the snake.

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

The visual frame corresponds to the current 640×240 playable board.

Control values are intentionally compact; ordinary stat/diagnostic values use smaller tabular numeric text.

Thinking text uses wrapping rules so long JSON / identifiers do not expand the left grid track.

Start-screen instructional text is positioned for the shorter 240 px canvas rather than the historical 480 px canvas.

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
├─ EAT_SAFE_FOOD
│  └─ evaluateFoodPath()
│     ├─ BFS to food
│     ├─ full path simulation
│     └─ post-food tail-reachability heuristic
│     → safe path[0]
│
├─ SAFE_CHASE
│  └─ StrategyExecutor weighted one-step Greedy
│
└─ CREATE_SPACE
   └─ StrategyExecutor deterministic space-first branch
      ├─ primary: maximize exact uncapped body-aware reachable space
      ├─ secondary: better food progress on equal space
      └─ deterministic tie behavior

candidate
→ validateDirection()
→ SafetyLayer may override immediate direction
→ executeStrategyMove()
→ GameEngine
```

If EAT_SAFE_FOOD cannot produce a confirmed safe non-empty path, normal runtime falls back to the weighted Greedy `StrategyExecutor` for that tick.

CREATE_SPACE is semantically distinct from SAFE_CHASE.

It is not merely SAFE_CHASE with larger `openSpaceWeight`.

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

Current source fixes this mismatch:

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

Current strategy policy type:

```ts
export type StrategyPolicy =
  | 'SAFE_CHASE'
  | 'EAT_SAFE_FOOD'
  | 'CREATE_SPACE';
```

`ActiveStrategy` contains:

```text
policy
params
startedAtStep
```

Strategy params remain:

```text
foodWeight
openSpaceWeight
wallPenalty
bodyPenalty
recentVisitPenalty
```

`createDefaultStrategy(policy?)` can construct a fresh `ActiveStrategy` for a currently implemented policy.

When the policy argument is omitted:

```text
default = EAT_SAFE_FOOD
```

Current default params:

```text
foodWeight          1.0
openSpaceWeight     0.4
wallPenalty         0.3
bodyPenalty         0.8
recentVisitPenalty  0.0
```

Current implemented strategic tools:

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

### CREATE_SPACE semantics

Primary objective:

```text
maximize exact uncapped body-aware reachable space
```

Secondary tie-break:

```text
if reachable-space counts tie
→ prefer better food progress
```

Final tie:

```text
preserve deterministic existing tie behavior
```

CREATE_SPACE does not replace the normal default.

Normal game initialization still begins with:

```text
EAT_SAFE_FOOD
```

Future policy names still not implemented:

```text
FOLLOW_TAIL
ESCAPE
SAFE_CYCLE / HAMILTONIAN
```

---

## 9. SAFE_CHASE / CREATE_SPACE / StrategyExecutor

Source:

```text
src/agent/strategy-executor.ts
```

### SAFE_CHASE

For each legal immediate direction, SAFE_CHASE scores:

```text
food progress
+ body-aware open-space score
- wall risk
- body proximity risk
- recent-visit penalty
```

Then it chooses the highest-scoring immediate direction.

Existing `countOpenSpace()`:

```text
body-aware flood fill
cap = 200 cells
```

On the current 384-cell board, that cap means SAFE_CHASE open-space scoring is not a complete full-board reachable-area measurement in large-open-space states.

SAFE_CHASE remains a one-step Greedy policy.

It does not itself represent a committed multi-step detour or dedicated survival planner.

### CREATE_SPACE

CREATE_SPACE has a dedicated deterministic branch.

It does not use a weighted sum as its primary decision.

Flow:

```text
1. enumerate legal candidate moves
2. compute exact uncapped body-aware reachable space for each candidate
3. select the candidate with the largest reachable region
4. if equal, prefer better food progress
5. preserve deterministic tie behavior afterward
```

CREATE_SPACE uses an uncapped reachable-space helper.

This avoids the SAFE_CHASE plateau where regions such as:

```text
210 cells
vs
350 cells
```

would both appear as:

```text
200
```

The existing capped SAFE_CHASE helper was intentionally left unchanged.

---

## 10. EAT_SAFE_FOOD / Local Planner

### `path-planner.ts`

Pure deterministic BFS:

```text
findPath(start, target, blocked, cols, rows, currentDirection?)
→ Direction[] | null
```

Characteristics:

- deterministic direction order: Up, Down, Left, Right
- prevents immediate 180° reversal at the start node when current direction is supplied
- respects board bounds and blocked cells
- does not mutate GameEngine

### `snake-simulator.ts`

`simulatePath()` virtually executes a full Direction path using engine-like semantics:

- opposite requested direction is ignored and current direction executes
- wall collision invalidates simulation
- current full body is checked before tail removal
- food consumption causes growth / no tail pop
- no RNG
- no GameEngine mutation

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

Normal runtime behavior:

> If SafetyLayer overrides an ActiveStrategy candidate, the controller may invalidate the active strategy and later return toward the higher-level Qwen path.

Fixed-policy benchmark exception:

> During an explicit fixed-policy benchmark, SafetyLayer may still override the actual immediate direction, but the policy identity is preserved for the next tick.

Therefore:

```text
fixed policy ≠ fixed direction
```

`pickSafeDirection()` also exists for local fallback / legacy-Qwen-plan failure paths.

Its internal open-space heuristic is separate from:

```text
StrategyExecutor.countOpenSpace()
```

and separate from CREATE_SPACE's exact uncapped reachable-space ordering.

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

LOOP detection uses its own fixed threshold gate and is independent of dynamic stagnation-budget categories.

Normal runtime on LOOP:

```text
_lastTrigger = LOOP_DETECTED
preserve failedStrategy
capture trigger snapshot
activeStrategy = null
→ optimizeStrategy() on following flow
```

Fixed-policy benchmark exception:

```text
_lastTrigger = LOOP_DETECTED
activeStrategy remains unchanged
Qwen path remains disabled
```

However:

> The outer benchmark loop may still terminate on `LOOP_DETECTED`.

Therefore fixed-policy means policy identity is preserved, not that benchmark termination rules are disabled.

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

- food eaten / score increases
- new food target appears
- current food distance improves below previous best

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

Preserves fixed-threshold behavior:

```text
stepsSinceProgress >= 80
→ STAGNATION_DETECTED
```

### DYNAMIC — current normal runtime behavior

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

- `PRESSURED = 40` does NOT create an early 40-step runtime trigger.
- `EMERGENCY = 0` does NOT make Danger directly trigger Qwen.
- Danger / DEAD_END does not currently bypass the 80-step boundary.

Normal runtime on STAGNATION:

```text
_lastTrigger = STAGNATION_DETECTED
preserve failedStrategy
capture trigger snapshot
activeStrategy = null
reset progress / loop tracking
→ optimizeStrategy()
```

Fixed-policy benchmark exception:

```text
_lastTrigger = STAGNATION_DETECTED
activeStrategy remains unchanged
Qwen remains disabled
```

The outer benchmark may still terminate on STAGNATION.

`runRecoveryBenchmark()` deliberately intercepts the first STAGNATION and converts it into a controlled CREATE_SPACE recovery episode.

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

These values are exposed through:

```text
AgentInfo
updateUI()
AgentPanel
```

Lifecycle note:

- `initializeLocalRun()` resets strategy/progress/loop state but does not clear all four episode counters.
- Full controller `reset()` clears them.
- Therefore they are controller-session telemetry unless a full reset occurs.

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

The board changed from:

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

Future Danger research should prefer normalized or trend-based evidence where appropriate:

```text
reachable ratio
reachable-space trend
survivable-move trend
distance-to-death
safe-food failure reason
```

### Current real-runtime trigger-timing evidence

A normal runtime death has now been observed with:

```text
Strategy = EAT_SAFE_FOOD
Last Trigger = -
Live Stag = 18 / 80
LLM Calls = 0
Danger = DEAD_END_IMMINENT
Reachable = 1
Status = GAME-OVER
```

This proves:

> Some deaths occur before the current LOOP / STAGNATION Qwen trigger path has time to activate.

It does NOT yet prove which earlier Danger-related signal should become a trigger.

---

## 16. Qwen Strategy Optimization Flow

Qwen high-level strategy optimization remains event-driven.

Current high-level failure triggers:

```text
LOOP_DETECTED
STAGNATION_DETECTED
```

Both preserve `failedStrategy`, then normal runtime may enter `optimizeStrategy()`.

Local Planner Evidence included in strategy planning:

```text
Food Path Exists
Food Path Length
Food Path Safe
Food Path Reason
```

Qwen may now return exactly one implemented high-level policy:

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

Integration path:

```text
AgentController optimization prompt
→ CREATE_SPACE listed as an available policy
→ LmStudioClient strategy response
→ validPolicies accepts CREATE_SPACE
→ optimizeStrategy() accepts CREATE_SPACE
→ activeStrategy.policy = CREATE_SPACE
→ subsequent ticks execute local CREATE_SPACE logic
```

All five numeric params remain required:

```text
foodWeight
openSpaceWeight
wallPenalty
bodyPenalty
recentVisitPenalty
```

They remain useful for SAFE_CHASE / Greedy fallback behavior.

CREATE_SPACE uses its own space-first primary ordering even though an `ActiveStrategy` still contains the param object.

`LmStudioClient.getStrategyUpdate()` validates:

- policy is one of the implemented policies
- all five params are finite numbers
- numeric params are clamped to the existing accepted range
- reason is text and rejected if too long

Thinking streams through:

```text
reasoning_content
```

while final JSON is parsed from:

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

### Qwen architectural constraint

Qwen remains a high-level strategist.

Current high-level toolbox:

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

CREATE_SPACE execution is local deterministic TypeScript.

Qwen does NOT become the normal per-tick direction generator.

### Evidence status

CREATE_SPACE Qwen code-path integration:

```text
PASS
```

Focused CREATE_SPACE fixtures:

```text
PASS
```

Build:

```text
PASS
```

Natural normal-runtime episode where Qwen independently selected CREATE_SPACE:

```text
NOT YET CAPTURED
```

Potential future high-level modes:

```text
FOLLOW_TAIL
ESCAPE
```

Potential future completion/endgame mode:

```text
SAFE_CYCLE / HAMILTONIAN
```

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

It can still be reached in normal non-fixed runtime when:

- there is no active strategy / recovery strategy
- the primitive plan is empty
- food-change logic requests replanning
- normal fallback flow reaches the legacy path

Primitive Qwen moves still pass through:

```text
validateDirection()
```

before physical execution.

If SafetyLayer overrides a planned move, the remaining plan is discarded and a later tick may replan.

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

Fixed-policy benchmark modes explicitly gate Qwen optimization / replanning out.

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
5. if no legal moves → game over / NO_MOVE path
6. if directionSource exists → benchmark injection path
7. else if activeStrategy exists:
     EAT_SAFE_FOOD
       → safe path[0] when available
       → otherwise StrategyExecutor fallback

     SAFE_CHASE
       → weighted StrategyExecutor

     CREATE_SPACE
       → exact uncapped space-first StrategyExecutor branch

     → validateDirection()
     → executeStrategyMove()
     → LOOP + progress/stagnation tracking

8. if failedStrategy exists and not fixed-policy mode:
     → optimizeStrategy()

9. otherwise, when allowed:
     → primitive Qwen plannedMoves / replan / safe fallback
```

### Fixed-policy benchmark mode

AgentController contains benchmark-only state:

```text
_fixedPolicy
```

When `runLocalBenchmark()` is called with an explicit policy:

```text
policy identity = fixed
direction = not fixed
```

During that fixed-policy run:

```text
LOOP/STAGNATION
→ may still be detected
→ activeStrategy is NOT cleared

SafetyLayer override
→ actual immediate direction may change
→ activeStrategy is preserved

strategy candidate === null
→ local pickSafeDirection()
→ activeStrategy preserved

optimizeStrategy()
→ gated out

replan()
→ gated out
```

Therefore:

> Fixed policy does not bypass SafetyLayer and does not mean fixed direction.

The outer benchmark loop may still terminate on:

```text
LOOP_DETECTED
STAGNATION_DETECTED
NO_MOVE
ENGINE_GAME_OVER
MAX_STEPS
```

`_fixedPolicy` is reset when initialization occurs without an explicit policy and during controller reset.

Normal runtime remains unchanged.

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

and does not run the normal ActiveStrategy loop/progress/stagnation lifecycle for that step.

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

with runtime/debug methods including:

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

`runLocalBenchmark()` optional policy:

```text
EAT_SAFE_FOOD
SAFE_CHASE
CREATE_SPACE
```

If policy is omitted:

```text
existing non-fixed-policy EAT_SAFE_FOOD benchmark behavior is preserved
```

If an explicit policy is provided:

```text
fixed-policy mode is enabled
```

`runRecoveryBenchmark()` is a controlled research entrypoint.

`src/global.d.ts` has been updated so the benchmark/debug declarations match the current:

```text
runLocalBenchmark(policy?)
runRecoveryBenchmark(...)
```

API shapes.

The broader runtime `AgentInfo` object may still contain richer telemetry than the declared debug-info type.

For normal runtime manual testing:

```text
START AGENT
```

must be pressed.

For benchmark-console runs, use the debug benchmark entrypoints instead of pressing START AGENT.

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

### `runLocalBenchmark(seed, maxSteps, policy?)`

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

SafetyLayer may still override actual direction.

LOOP/STAGNATION may still terminate the benchmark even though policy identity is preserved.

### `runRecoveryBenchmark(seed, maxSteps, recoverySteps = 40)`

Controlled deterministic recovery harness:

```text
start fixed EAT_SAFE_FOOD

→ first STAGNATION_DETECTED
→ fresh CREATE_SPACE
→ resetProgressTracking()
→ _lastTrigger = '-'

→ run CREATE_SPACE for recoverySteps

→ fresh EAT_SAFE_FOOD
→ resetProgressTracking()
→ _lastTrigger = '-'

→ continue benchmark
```

Only one CREATE_SPACE recovery episode is allowed per run.

Later STAGNATION terminates normally.

LOOP / NO_MOVE / GameEngine termination semantics remain unchanged.

Qwen is disabled for the entire recovery benchmark.

Return value extends `BenchmarkResult` with:

```text
recoveryTriggered
recoveryCompleted
```

Important:

> The automatic 40-step CREATE_SPACE recovery lifecycle is a benchmark experiment only.

Normal runtime does NOT automatically run CREATE_SPACE for exactly 40 steps after STAGNATION.

Normal runtime instead uses:

```text
LOOP / STAGNATION
→ Qwen high-level optimization
→ Qwen may choose CREATE_SPACE
```

### `runSafeBfsBenchmark(seed, maxSteps)`

Behavior remains unchanged.

It:

- initializes deterministic seeded run
- injects a local `directionSource`
- evaluates Safe-BFS each step
- uses safe food path when available
- otherwise uses StrategyExecutor Greedy fallback
- tracks Safe-BFS usage / fallback reasons

Because it uses the `directionSource` injection path, it does not follow the same normal ActiveStrategy lifecycle.

Therefore it is not apples-to-apples with fixed-policy `runLocalBenchmark()`.

### Benchmark termination reasons

Include:

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

### Fixed-policy evidence — 500-step comparison

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

> At a 500-step horizon, EAT_SAFE_FOOD and CREATE_SPACE were not meaningfully separated by survival.

SAFE_CHASE performed substantially worse in this controlled batch.

### Fixed-policy evidence — 2000-step comparison

Same seeds:

```text
1001–1005
```

maxSteps:

```text
2000
```

Results:

```text
EAT_SAFE_FOOD
average score: 93.8
average steps: 1841.4

CREATE_SPACE
average score: 56.8
average steps: 1170.6
STAGNATION_DETECTED: 5/5
```

Interpretation:

> CREATE_SPACE is not supported by current evidence as a whole-run primary policy.

It is better positioned as a temporary recovery / reorganization capability.

### CREATE_SPACE recovery evidence

Controlled recovery evidence currently covers:

```text
seeds 1001–1005
+
seeds 2001–2020
=
25 controlled seeds
```

Baseline termination counts across those 25 seeds:

```text
MAX_STEPS:            16
NO_MOVE:               6
STAGNATION_DETECTED:   3
```

Recovery termination counts:

```text
MAX_STEPS:            19
NO_MOVE:               6
STAGNATION_DETECTED:   0
```

Only three baseline runs actually reached STAGNATION:

```text
1001
1002
2009
```

All three:

```text
triggered CREATE_SPACE recovery
completed the 40-step recovery window
improved score
improved survival steps
converted STAGNATION termination → MAX_STEPS
```

Triggered-case improvements:

```text
1001
Baseline:  96 / 1736 / STAGNATION_DETECTED
Recovery: 104 / 2000 / MAX_STEPS
Δ score: +8
Δ steps: +264

1002
Baseline:  88 / 1875 / STAGNATION_DETECTED
Recovery:  93 / 2000 / MAX_STEPS
Δ score: +5
Δ steps: +125

2009
Baseline:  64 / 1198 / STAGNATION_DETECTED
Recovery:  93 / 2000 / MAX_STEPS
Δ score: +29
Δ steps: +802
```

Average improvement among the three actual recovery episodes:

```text
+14 score
+397 steps
```

The other 22 seeds did not trigger recovery.

Their baseline and recovery results remained identical.

This is useful control evidence:

> When STAGNATION does not occur, the recovery harness does not disturb normal fixed EAT_SAFE_FOOD behavior.

Current evidence therefore supports:

```text
CREATE_SPACE as whole-run primary policy:
poor fit

CREATE_SPACE as short STAGNATION recovery:
promising
```

However:

```text
actual recovery episodes = 3
```

so this is still preliminary evidence rather than proof of universal recovery effectiveness.

### Unresolved failure class

Several controlled runs terminated through:

```text
NO_MOVE
```

before STAGNATION recovery could trigger.

Current recovery evidence therefore does NOT demonstrate a solution for:

```text
rapid trap
NO_MOVE
death-before-trigger
```

### Board-geometry comparability warning

Current benchmark geometry:

```text
32×12 / 384 cells
```

Historical results collected under:

```text
32×24 / 768 cells
```

are not directly comparable.

The state space, occupancy ratio, mobility, reachable-cell counts, food candidate rejection behavior, and time-to-fill are different.

Historical SAFE_CHASE-default runs are also not directly comparable with the current EAT_SAFE_FOOD default.

---

## 21. Current Automated Tests

`package.json` currently exposes:

```text
npm run test:danger
npm run test:stagnation
npm run test:create-space
npm run build
```

Current focused fixture files include:

```text
src/agent/__tests__/danger-monitor-fixtures.ts
src/agent/__tests__/stagnation-budget-fixtures.ts
src/agent/__tests__/create-space-fixtures.ts
```

CREATE_SPACE fixtures verify:

```text
Fixture A:
SPACE beats FOOD

- one legal move is closer to food
- another has strictly more exact reachable space
- CREATE_SPACE must choose the larger-space move
```

```text
Fixture B:
FOOD breaks a SPACE tie

- two candidate moves have equal reachable space
- one has better food progress
- CREATE_SPACE must choose the better-food move
```

```text
Fixture C:
SAFE_CHASE regression

- existing SAFE_CHASE weighted behavior remains intact
```

Current CREATE_SPACE fixture status:

```text
3/3 PASS
```

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

The current UI can therefore reveal an important class of failure:

```text
Danger already collapsed
while
Last Trigger is still '-'
and
Live Stag is still far below 80
```

This is now a real observed runtime phenomenon, not just a theoretical concern.

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
ESCAPE policy
Hamiltonian / safe-cycle endgame mode
A* planner
formal board-full WIN / completion semantics
full fixed GameSnapshot planner fixture suite
```

CREATE_SPACE is now IMPLEMENTED.

Current important limitations:

1. **Safe food is heuristic, not proof.**

   Head→tail reachability after eating can still lead to later death.

2. **SAFE_CHASE is still one-step Greedy.**

   Body-aware open space is useful but not a route/survival planner.

3. **CREATE_SPACE is not a whole-run replacement for EAT_SAFE_FOOD.**

   Longer fixed-policy evidence shows substantially worse long-run score/survival when CREATE_SPACE is used continuously.

4. **CREATE_SPACE recovery evidence is promising but still small.**

   Current controlled evidence contains only three actual STAGNATION recovery episodes.

   All three succeeded, but 3/3 is not enough to claim universal reliability.

5. **The 40-step automatic recovery lifecycle exists only in `runRecoveryBenchmark()`.**

   Normal runtime does not automatically run CREATE_SPACE for exactly 40 steps after STAGNATION.

6. **Normal Qwen CREATE_SPACE integration is code-complete, but natural selection evidence is incomplete.**

   Qwen can be prompted to choose CREATE_SPACE, the LM response validator accepts it, and AgentController can assign it.

   A natural normal-runtime episode where Qwen independently chose CREATE_SPACE has not yet been captured.

7. **Danger remains observational.**

   DEAD_END_IMMINENT does not directly trigger Qwen.

8. **Current trigger timing can be too late.**

   A real runtime death was observed with:

```text
Strategy = EAT_SAFE_FOOD
Last Trigger = -
Live Stag = 18 / 80
LLM Calls = 0
Danger = DEAD_END_IMMINENT
Reachable = 1
GAME-OVER
```

   Therefore some deaths occur before LOOP/STAGNATION can summon Qwen.

9. **NO_MOVE remains an unresolved failure class.**

   Controlled recovery runs contain multiple NO_MOVE terminations where STAGNATION recovery never triggered.

10. **No dedicated survival fallback planner exists.**

    Unsafe food still ultimately relies on current local fallback behavior.

11. **Debug type declaration drift may still exist for rich AgentInfo telemetry.**

    Benchmark/debug method signatures are synced, but runtime AgentInfo can expose more telemetry fields than the debug declaration models.

12. **Board dimensions still have duplicate ownership.**

    GameEngine derives board size from canvas/grid geometry while AgentController has explicit COLS/ROWS constants.

13. **Historical Danger evidence used a different board geometry.**

    Absolute 32×24 thresholds must not be copied directly into 32×12 trigger rules.

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

### 0. Controlled 32×12 baseline — ESTABLISHED

Current benchmark tooling now distinguishes:

```text
normal adaptive runtime
fixed-policy benchmark
SafeBFS injection benchmark
temporary recovery benchmark
```

Current controlled benchmark semantics are sufficient for small deterministic strategy comparisons.

Board-full / formal WIN semantics remain open.

### 1. CREATE_SPACE capability — IMPLEMENTED / INITIAL EVIDENCE COMPLETE

Completed:

```text
deterministic local CREATE_SPACE policy
exact uncapped space-first objective
focused fixtures
fixed-policy benchmark
temporary STAGNATION recovery benchmark
Qwen high-level policy integration
```

Current conclusion:

```text
whole-run CREATE_SPACE:
poor fit

temporary STAGNATION recovery:
promising
```

Natural normal-runtime Qwen selection of CREATE_SPACE still needs observation.

### 2. Death-window telemetry research — CURRENT NEXT

A real runtime death demonstrates:

```text
DEAD_END_IMMINENT
Reachable = 1
Live Stag = 18 / 80
Last Trigger = -
LLM Calls = 0
GAME-OVER
```

Therefore existing LOOP/STAGNATION triggers can be too late.

Next research should inspect the window BEFORE collapse using existing telemetry:

```text
survivableMoveCount
reachableCells
reachable ratio
reachable-space trend
LOW_MOBILITY persistence
safe-food rejection reason
active policy
distance-to-death
```

Do not immediately hardcode:

```text
DEAD_END_IMMINENT → Qwen
```

At DEAD_END_IMMINENT, recovery may already be impossible.

### 3. PRE_TRAP / SituationAssessment

Telemetry first.

Identify earlier candidate signals such as:

```text
persistent LOW_MOBILITY
survivableMoveCount deterioration
rapid reachable-space collapse
repeated safe-food failure
```

Then measure:

```text
lead time before death
false-positive rate
recovery success
extra Qwen calls
```

Only after evidence should PRE_TRAP become a Qwen trigger.

### 4. FOLLOW_TAIL

Implement as a semantically distinct deterministic policy.

Intent:

```text
use tail/body structure
reorganize safely
buy time
avoid immediate food obsession
```

Fixture / benchmark before Qwen integration.

### 5. ESCAPE

Design from observed failure states.

Must perform multi-step survival reasoning rather than become another renamed Greedy policy.

Fixture / controlled benchmark before Qwen integration.

### 6. SAFE_CYCLE / Hamiltonian completion mode

Treat as a separate endgame/completion capability.

Pair with explicit board-full completion semantics if required.

Current intended architecture remains:

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

remaining as a general-purpose heuristic / fallback if still useful.

Potential endgame/completion mode:

```text
SAFE_CYCLE / HAMILTONIAN
```

Qwen should not regress into normal per-tick primitive direction control.

---

## 25. Success Criteria for Future Planner / Trigger Changes

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
LOOP frequency
STAGNATION frequency
NO_MOVE frequency
Qwen calls
Qwen calls per food
recoveryTriggered
recoveryCompleted
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

### Current CREATE_SPACE capability evidence

Whole-run CREATE_SPACE:

```text
not preferred
```

Current STAGNATION recovery evidence:

```text
3 actual recovery episodes
3 triggered
3 completed
3 improved score
3 improved survival
3 converted STAGNATION → MAX_STEPS
```

This is promising but not yet statistically broad.

### Current trigger evidence

The question:

> Does death usually have a deterministic, observable pre-trap / space-collapse window early enough for a strategy change to matter?

now has at least one strong real-runtime motivation:

```text
GAME-OVER occurred
while
Last Trigger = -
Live Stag = 18 / 80
LLM Calls = 0
Danger = DEAD_END_IMMINENT
Reachable = 1
```

This proves:

> The current 80-step stagnation route is not sufficient to expose every dangerous state to Qwen.

It does NOT yet prove which earlier signal should become the trigger.

The next experiment should measure the death window rather than immediately implement a threshold.

Most important capability question:

> Can local deterministic logic safely solve states that require temporarily moving away from food, reorganizing around the body, or explicitly surviving danger without turning Qwen into a primitive per-tick driver?

Most important trigger question:

> Is there a repeatable warning window before NO_MOVE / DEAD_END where a high-level strategy switch still has enough time to help?

Do not judge a planner from one lucky high-score run.

---

## 26. OpenCode Session Discipline

The local Qwen can context-drift in long sessions.

Observed context capacity:

```text
~40960 tokens
```

A full read of a large controller plus PROJECT_MAP / broad repository search can overflow that context.

Warning signs:

```text
re-reads same files
repeats Thought / Grep / Read loops
opens legacy paths
reads PROJECT_MAP for a focused implementation task
runs broad Grep across the repo
re-checks after BUILD PASS
starts a second verification pass without need
manually simulates BFS / large state search in reasoning
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

because audit exists to discover cause/design.

Still:

```text
use symbol search first
read narrow ranges only
avoid full-file reads
inspect 1–3 relevant files
STOP when evidence is sufficient
```

If the task targets a large file:

```text
locate exact symbol
→ narrow range read
→ STOP when answer is known
```

Do not read PROJECT_MAP for a focused symbol-level implementation unless it is actually needed.

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

- BUILD PASS ≠ RUNTIME PASS.
- EDIT PASS ≠ BUILD PASS.
- TEST PASS ≠ RUNTIME PASS.
- Manual runtime observation is preferred for actual Snake/Qwen behavior when practical.
- Avoid Playwright while Snake is actively using LM Studio / the same GPU.
- If reload/navigation resets Score, Steps, or LLM Calls, the before/after sample is invalid.
- Prefer pure TypeScript fixtures for deterministic local logic.
- Do not rerun expensive old benchmarks unless a behavior-changing patch invalidates the comparison.
- Do not infer 32×12 behavior from old 32×24 runtime statistics without a controlled reason.
- Benchmark batches should be kept small enough to avoid browser/OpenCode context instability.
- If a runtime batch partially completes, preserve completed seeds and resume only remaining seeds when evidence supports doing so.
- Do not treat `qwenRequested` / `qwenExecuted` telemetry fields as proof that Qwen was actually called; those names are also used in local strategy / fallback paths.

---

## 28. Fast File Guide

| Task | Read first |
| --- | --- |
| Bootstrap / debug API / canvas geometry | `src/main.ts`, `src/global.d.ts` |
| Engine / collision / RNG | `src/game/engine.ts`, `src/game/types.ts` |
| Agent primary flow / triggers / Agent dimensions | `src/agent/agent-controller.ts` |
| Strategy types | `src/agent/types.ts` |
| SAFE_CHASE / CREATE_SPACE execution | `src/agent/strategy-executor.ts` |
| Immediate legality | `src/agent/safety-layer.ts` |
| BFS | `src/agent/path-planner.ts` |
| Virtual path simulation | `src/agent/snake-simulator.ts` |
| Safe food validation | `src/agent/safe-food-validator.ts` |
| Danger assessment | `src/agent/danger-monitor.ts` |
| Dynamic stagnation budget | `src/agent/stagnation-budget.ts` |
| LM SSE / strategy response validation | `src/agent/lm-studio-client.ts` |
| Qwen strategy assignment / trigger flow | `src/agent/agent-controller.ts` |
| Active Control / Thinking DOM | `src/agent-panel.ts` |
| Active layout / UI styling | `src/style.css` |
| Start/game Canvas rendering | `src/game/renderer.ts` |
| Workflow / Git / tests | `AGENTS.md` |

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
1. Read latest PROJECT_MAP.md first.
2. Read latest AGENTS.md for OpenCode workflow discipline.
3. Treat CURRENT LOCAL SOURCE / RUNTIME as higher authority.
4. Check local git status when local-vs-GitHub distinction matters.
5. Ignore legacy duplicate files unless explicitly relevant.
6. Read only ACTIVE files needed for the current task.
7. For large files, locate exact symbols and read narrow ranges only.
8. Do not mix architecture phases in one patch.
9. If source changes architecture, reconcile PROJECT_MAP at an appropriate checkpoint.
```

For board-related work, explicitly verify both:

```text
GameEngine physical dimensions
Agent logical dimensions
```

Do not assume changing canvas geometry automatically updates AgentController constants.

For Qwen integration work, preserve:

```text
Qwen = high-level policy choice
Local TypeScript = per-tick execution
SafetyLayer = immediate legality
GameEngine = physical state
```

---

## 31. High-Confidence Anchors

```text
Current pushed architecture checkpoint:
                          af1d924

GitHub main:
                          includes CREATE_SPACE
                          fixed-policy benchmark
                          recovery benchmark
                          Qwen CREATE_SPACE integration
                          renewed PROJECT_MAP

Entry:
                          src/main.ts

Framework:
                          Vanilla TypeScript + Vite + Canvas 2D

Canvas:
                          640×240

Grid:
                          20 px

Board:
                          32×12 / 384 cells

Agent board constants:
                          COLS=32 / ROWS=12

AgentController:
                          src/agent/agent-controller.ts

Default policy:
                          EAT_SAFE_FOOD

Implemented policies:
                          EAT_SAFE_FOOD
                          SAFE_CHASE
                          CREATE_SPACE

CREATE_SPACE:
                          IMPLEMENTED
                          deterministic space-first
                          exact uncapped reachable-space primary
                          food-progress tie-break

CREATE_SPACE whole-run evidence:
                          poor fit vs EAT_SAFE_FOOD at 2000-step horizon

CREATE_SPACE recovery evidence:
                          promising
                          3/3 triggered STAGNATION episodes completed
                          all 3 improved score and survival

Qwen CREATE_SPACE:
                          CODE-PATH IMPLEMENTED
                          prompt option
                          LM validation
                          controller assignment
                          local execution
                          natural normal-runtime selection not yet captured

Greedy executor:
                          src/agent/strategy-executor.ts

BFS planner:
                          src/agent/path-planner.ts

Virtual simulator:
                          src/agent/snake-simulator.ts

Safe-food validator:
                          src/agent/safe-food-validator.ts

Danger monitor:
                          src/agent/danger-monitor.ts

Stagnation budget:
                          src/agent/stagnation-budget.ts

LM client:
                          src/agent/lm-studio-client.ts

Active UI:
                          src/agent-panel.ts + src/style.css

Renderer:
                          src/game/renderer.ts

Panel layout:
                          Thinking | Snake | Control = 2:6:2

Game frame:
                          8:3, vertically centered

LM streaming:
                          reasoning_content + content SSE

Normal stagnation mode:
                          DYNAMIC

Fixed benchmark stagnation:
                          FIXED = 80

runLocalBenchmark:
                          optional fixed policy
                          EAT_SAFE_FOOD | SAFE_CHASE | CREATE_SPACE

runRecoveryBenchmark:
                          IMPLEMENTED
                          first STAGNATION
                          → CREATE_SPACE bounded recovery
                          → EAT_SAFE_FOOD
                          benchmark-only experiment

SafeBFS injection:
                          bypasses normal LOOP/progress/stagnation lifecycle

Danger trigger Qwen:
                          NO

PRESSURED=40 early runtime trigger:
                          NO

PRE_TRAP trigger:
                          NOT IMPLEMENTED

Current trigger issue:
                          real runtime death observed before
                          LOOP/STAGNATION Qwen trigger
                          DEAD_END_IMMINENT / Reachable=1
                          while Live Stag=18/80 and LLM Calls=0

FOLLOW_TAIL:
                          NOT IMPLEMENTED

ESCAPE:
                          NOT IMPLEMENTED

SAFE_CYCLE/Hamiltonian:
                          NOT IMPLEMENTED

Debug API:
                          window.__snakeDebug

Legacy moves[1..6]:
                          fallback path
                          not healthy primary control
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
