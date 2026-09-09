# PROJECT_MAP — Snake Game + Local Qwen Agent

> Reconciled against GitHub `main` source plus the uploaded current PROJECT_MAP on 2026-09-09.
> Purpose: fast onboarding for fresh OpenCode / ChatGPT sessions without broad repository rediscovery.

## 0. Authority

Implementation truth:

```text
CURRENT LOCAL SOURCE / RUNTIME EVIDENCE
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

---

## 1. Current Stack / Active Runtime

```text
Project: D:\Projects\snake-game
Frontend: Vanilla TypeScript + Vite + Canvas 2D
LM Studio: http://127.0.0.1:1234
Dev app: http://127.0.0.1:5173/
Canvas: 640×480
Grid size: 20 px
Board: 32×24 = 768 cells
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

Desktop grid uses `minmax(0, 2fr) minmax(0, 6fr) minmax(0, 2fr)` so long Thinking content cannot expand its track and squeeze Control.

### Local-only legacy / duplicate risk

These files are **not present on the current GitHub `main` branch**, but they were previously observed as local untracked/legacy files:

```text
src/agent/AgentPanel.jsx
src/agent/AgentPanel.css
src/agent/LMStudioClient.ts
src/agent/promptBuilder.ts
```

Absence from GitHub does **not** prove absence from `D:\Projects\snake-game`.
If a task could touch these paths, check local `git status --short` / current imports first.

Do not treat them as active runtime files unless the current local import graph proves otherwise, and do not edit/delete them as a side effect of unrelated work.

---

## 2. Git Snapshot / Safety

Current source checkpoint:

```text
d64b405 feat: checkpoint safe local planner and agent runtime
```
`PROJECT_MAP.md` may have newer documentation-only commits on top of this source checkpoint.

Use the current GitHub `main` HEAD / `git log` when the exact latest branch commit matters.


Repository:

```text
origin/main → https://github.com/spiraleyeld/ai-snake-game-agent
```

`PROJECT_MAP.md` is tracked in that checkpoint.

Important:

> GitHub `main` is only the latest pushed checkpoint. Local `D:\Projects\snake-game` may contain newer modified or untracked files that GitHub cannot see.

Before relying on GitHub-only absence/presence for local-file decisions, obtain local `git status --short` when the distinction matters.

Before any Git action:

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

Stage only explicitly intended files.

---

## 3. GameEngine Semantics

Source: `src/game/engine.ts`

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

When manual mode is on, the normal animation-loop `engine.tick()` does not move the snake.

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

> The same seed guarantees reproducibility for the same execution path. Different planners can diverge in snake shape and therefore consume/reject food candidates differently.

---

## 5. Current UI / Pause Flow

Source: `src/agent-panel.ts`, `src/style.css`, `src/agent/agent-controller.ts`

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
- Movement helpers also guard against physical stepping while paused.
- An async Qwen response may finish while paused, but completion must not itself move the snake.

Current desktop layout:

```text
AGENT THINKING | SNAKE | AGENT CONTROL
      2        |   6   |       2
```

Control values are intentionally compact; ordinary stat/diagnostic values use smaller tabular numeric text. Thinking text uses wrapping rules so long JSON / identifiers do not expand the left grid track.

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

---

## 8. ActiveStrategy / Policies

Source: `src/agent/types.ts`, `src/agent/agent-controller.ts`

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

Default strategy created at game/benchmark initialization:

```text
policy              SAFE_CHASE
foodWeight          1.0
openSpaceWeight     0.4
wallPenalty         0.3
bodyPenalty         0.8
recentVisitPenalty  0.0
```

Default runtime policy has NOT been changed to EAT_SAFE_FOOD.

---

## 9. SAFE_CHASE / StrategyExecutor

Source: `src/agent/strategy-executor.ts`

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

The flood fill is still capped at 200 cells for performance.

SAFE_CHASE remains a one-step Greedy policy. It does not itself represent a committed multi-step detour.

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
- no RNG and no GameEngine mutation

### `safe-food-validator.ts`

`evaluateFoodPath()` performs:

```text
1. BFS head → food
2. simulate complete food path
3. verify food was actually eaten
4. post-food head → tail reachability heuristic
```

Food path reasons:

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

Runtime EAT_SAFE_FOOD replans every tick and executes only `path[0]`.

---

## 11. Safety Layer

Source: `src/agent/safety-layer.ts`

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

Current controller behavior is stricter than merely executing the fallback: if SafetyLayer overrides an ActiveStrategy candidate, the controller disables the active strategy and falls back toward the Qwen path on a later tick.

`pickSafeDirection()` also exists for the legacy/Qwen-plan failure path. Its internal open-space fallback is a separate heuristic and should not be confused with `StrategyExecutor.countOpenSpace()`.

---

## 12. Revisit Awareness

AgentController stores recent successful head positions:

```text
recentHeadPositions
max length = 32
```

StrategyExecutor penalizes candidate cells found in recent head history. More recent matches receive a larger penalty.

This is a score penalty, not a hard ban.

Revisit awareness helps local behavior but does not replace route planning or survival planning.

---

## 13. LOOP Detection

The LOOP detector lifecycle is currently connected and no longer has the old `lastLoopScore` reset bug.

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

`resetLoopHistory()` clears history and sets `lastLoopScore = -1`.

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

Normal `runStep()` defaults to `DYNAMIC`.

Benchmark paths explicitly pass `FIXED`.

### FIXED

Preserves old behavior exactly:

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

does the controller evaluate the current boundary evidence:

```text
evaluateFoodPath(pre-move `state`)
+ Danger telemetry computed from that same pre-move tick
→ stagnationBudget(...)
```

Important:

> `updateProgressTracking(state, newStateAfterMove, ...)` is called after a successful move, but its distance checks and `evaluateFoodPath()` currently use the **pre-move `state`**. `newStateAfterMove` is used for score-increase detection, not for the boundary food-path evaluation.

Pure budget categories are:

```text
NORMAL        → 80
REORGANIZING  → clamp(round(reachableCells × 0.25), 80, 200)
PRESSURED     → 40
EMERGENCY     → 0
```

But current controller wiring is intentionally narrower:

> Only REORGANIZING can extend an already-reached runtime boundary above 80.

Current DYNAMIC logic:

```text
if category === REORGANIZING
and returned threshold > current stepsSinceProgress:
    persist the larger effective threshold
    do not trigger yet
else:
    STAGNATION_DETECTED
```

Therefore:

- `PRESSURED = 40` exists in pure budget logic but does NOT create an early 40-step runtime trigger.
- `EMERGENCY = 0` exists in pure budget logic but does NOT make Danger directly trigger Qwen.
- Danger/DEAD_END does not currently bypass the 80-step boundary.

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

Source: `src/agent/danger-monitor.ts`, `src/agent/agent-controller.ts`

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

### Episode telemetry already stored in AgentController

```text
currentLowMobilityStreak
maxLowMobilityStreak
lastLowStreakBeforeDeadEnd
deadEndEventCount
```

Semantics:

```text
LOW_MOBILITY → current streak++ and max update
SAFE → current streak reset to 0
first transition into DEAD_END_IMMINENT
  → capture prior LOW streak
  → deadEndEventCount++
  → current streak reset
repeated DEAD_END ticks do not increment again
```

These four values are exposed through `AgentInfo` / `updateUI()`.

Lifecycle note:

- `initializeLocalRun()` resets strategy/progress/loop state but does **not** clear these four episode counters.
- Full controller `reset()` clears `currentLowMobilityStreak`, `maxLowMobilityStreak`, `lastLowStreakBeforeDeadEnd`, and `deadEndEventCount`.
- Therefore these counters are controller-session telemetry unless a full reset occurs; do not assume each `startGame()` / benchmark initialization begins from zero.

Current active AgentPanel displays:

```text
Danger
Mobility = legal / survivable
Reachable
```

The four episode counters above are NOT currently rendered in `src/agent-panel.ts`.

Important:

> Danger is telemetry/evidence only. It does not currently trigger Qwen or directly override normal policy selection.

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

All five numeric params are still required for both policies because they remain useful to SAFE_CHASE and Greedy fallback behavior.

`LmStudioClient.getStrategyUpdate()` validates:

- policy is one of the two implemented policies
- all five params are finite numbers
- numeric params are clamped to `0.0..2.0`
- reason is text and is rejected if too long

Thinking streams through `reasoning_content` while final JSON is parsed from normal `content`.

### Important non-triggers

```text
Danger Watchdog     → does NOT trigger Qwen
LOW_MOBILITY        → does NOT trigger Qwen
DEAD_END_IMMINENT   → does NOT trigger Qwen
PRESSURED=40        → does NOT create a Qwen trigger
EMERGENCY=0         → does NOT create a Qwen trigger
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

It can still be reached when there is no active strategy / recovery strategy, when the primitive plan is empty, or when food-change logic requests replanning.

Primitive Qwen moves still pass through `validateDirection()` before physical execution. If SafetyLayer overrides a planned move, the remaining plan is discarded and a later tick replans.

If Qwen fails to produce a primitive plan, controller uses `pickSafeDirection()` as fallback.

Telemetry fields:

```text
Plan Len
Plan Left
Moves/LLM
```

refer to this primitive plan path. Do not reuse `plannedMoves` for normal local BFS routes unless telemetry semantics are intentionally redesigned.

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

That injected benchmark path does NOT pass through `validateDirection()` and does not run the normal ActiveStrategy loop/progress lifecycle for that step.

Do not generalize “all local directions pass SafetyLayer” to this benchmark injection path.

---

## 19. Debug API

Source: `src/main.ts`, `src/global.d.ts`

Exposes `window.__snakeDebug`:

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

> `window.__snakeDebug.getAgentInfo()` returns the controller's richer runtime `AgentInfo`, but `src/global.d.ts` currently declares an older/narrower `AgentDebugInfo` shape and does not list all newer Thinking, stagnation, Danger, and episode-counter fields.

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

For normal runtime manual testing, START AGENT must be pressed.

For benchmark-console runs, use the debug benchmark entrypoint instead of pressing START AGENT.

---

## 20. Benchmarks

### `runLocalBenchmark(seed, maxSteps)`

- initializes a deterministic seeded run
- uses the default SAFE_CHASE strategy
- calls `runStep(undefined, 'FIXED')`
- reports explicit termination reason instead of treating all failures as engine game-over

### `runSafeBfsBenchmark(seed, maxSteps)`

- initializes a deterministic seeded run
- injects a local `directionSource`
- evaluates Safe-BFS every step
- uses safe food path when available
- otherwise uses StrategyExecutor Greedy fallback
- calls `runStep(directionSource, 'FIXED')`
- tracks safe-BFS usage and fallback reasons

Benchmark stagnation semantics are **not identical**:

- `runLocalBenchmark()` uses the normal ActiveStrategy lifecycle with `runStep(undefined, 'FIXED')`, so its stagnation watchdog preserves the fixed 80-step behavior.
- `runSafeBfsBenchmark()` also passes `'FIXED'`, but because it supplies `directionSource`, `runStep()` takes the benchmark-injection branch and returns before normal LOOP/progress/stagnation tracking. Therefore SafeBFS does **not** generate new `STAGNATION_DETECTED` / `LOOP_DETECTED` events through that normal lifecycle.

Benchmark termination reasons include:

```text
ENGINE_GAME_OVER
LOOP_DETECTED
STAGNATION_DETECTED
NO_MOVE
MAX_STEPS
```

Do not treat `NO_MOVE`, LOOP, or STAGNATION as equivalent to engine GameOver.

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

There is not currently a package script for a full path-planner / simulator / safe-food fixture suite.

BUILD PASS is not runtime proof.

---

## 22. Trigger / Diagnostic Telemetry

AgentInfo / active Control UI currently includes trigger and live state diagnostics such as:

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

Do not confuse a trigger snapshot with the current live state.

---

## 23. Current Known Limitations / Open Work

These are NOT implemented as completed runtime features:

```text
Danger-based Qwen trigger
LOW_MOBILITY persistence trigger
multi-step danger lookahead beyond the current one-step survivability check
survival / escape planner when food route is unsafe
FOLLOW_TAIL policy
CREATE_SPACE policy
Hamiltonian / safe-cycle endgame mode
A* planner
full fixed GameSnapshot planner fixture suite
Danger episode counters rendered in AgentPanel
```

Current important limitations:

1. **Safe food is heuristic, not proof.** Head→tail reachability after eating can still lead to later death.
2. **SAFE_CHASE is still one-step Greedy.** Body-aware open space is fixed, but it is not a route planner.
3. **Danger is observational.** DEAD_END_IMMINENT may be detected when no survivable move already exists, and does not currently trigger Qwen.
4. **PRESSURED=40 is provisional pure logic only.** Current runtime does not use it as an early trigger.
5. **No dedicated survival fallback planner yet.** Unsafe food currently falls back to Greedy behavior in EAT_SAFE_FOOD.
6. **Debug type declaration drift.** Runtime `getAgentInfo()` exposes more fields than the current `AgentDebugInfo` declaration in `src/global.d.ts`.

Future policy names such as `CREATE_SPACE` / `FOLLOW_TAIL` must be marked FUTURE until real controller behavior exists.

---

## 24. Current Recommended Next Work

Do not mix these into one OpenCode patch.

Suggested order from the current source state:

```text
1. Finish Danger episode observability
   - optionally render current/max/pre-dead/dead-end counters

2. Collect runtime death episodes
   - determine whether LOW_MOBILITY persists before DEAD_END

3. Decide Danger intervention from evidence
   - persistence trigger if LOW streak is meaningful
   - otherwise consider 2–3 step local lookahead

4. Add deterministic micro fixtures for planner failure states

5. Add real survival / escape fallback only when failure evidence justifies it

6. Re-evaluate default policy (SAFE_CHASE vs EAT_SAFE_FOOD) separately

7. Only later consider additional policies / A* / Hamiltonian mode
```

Do not hardwire PRESSURED=40 into runtime merely because the pure budget module returns 40.

---

## 25. Success Criteria for Future Planner Changes

Prefer evidence from fixed fixtures + deterministic seed batches.

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
```

Most important capability question:

> Can local logic safely solve states that require temporarily moving away from food or reorganizing around the body without turning Qwen into a primitive per-tick driver?

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

Recommended session:

```text
/new
→ read PROJECT_MAP.md
→ read AGENTS.md only when workflow/safety rules matter
→ locate symbols first
→ read only narrow ranges in 1–2 ACTIVE files
→ make one small patch
→ run the minimum required test/build
→ report evidence
→ STOP
```

For UI-only work, do not broadly read PROJECT_MAP / whole source tree unless architecture context is actually required.

After BUILD PASS, do not re-read the same source just to reassure yourself.

---

## 27. Runtime / Test Discipline

- BUILD PASS ≠ RUNTIME PASS.
- Manual runtime observation is preferred for real Snake/Qwen behavior when practical.
- Avoid Playwright while Snake is actively using LM Studio / the same GPU.
- If reload/navigation resets Score, Steps, or LLM Calls, the before/after sample is invalid.
- Prefer pure TypeScript fixtures for deterministic local logic.
- Do not rerun expensive old benchmarks unless a behavior-changing patch invalidates the comparison.

---

## 28. Fast File Guide

| Task | Read first |
|---|---|
| Bootstrap / debug API | `src/main.ts`, `src/global.d.ts` |
| Engine / collision / RNG | `src/game/engine.ts`, `src/game/types.ts` |
| Agent primary flow / triggers | `src/agent/agent-controller.ts` |
| Strategy types | `src/agent/types.ts` |
| SAFE_CHASE scoring | `src/agent/strategy-executor.ts` |
| Immediate legality | `src/agent/safety-layer.ts` |
| BFS | `src/agent/path-planner.ts` |
| Virtual path simulation | `src/agent/snake-simulator.ts` |
| Safe food validation | `src/agent/safe-food-validator.ts` |
| Danger assessment | `src/agent/danger-monitor.ts` |
| Dynamic stagnation budget | `src/agent/stagnation-budget.ts` |
| LM SSE / strategy response | `src/agent/lm-studio-client.ts` |
| Active Control / Thinking DOM | `src/agent-panel.ts` |
| Active layout / UI styling | `src/style.css` |
| Workflow / Git / tests | `AGENTS.md` |

Avoid broad repository discovery if the task maps cleanly to this table.

---

## 29. PROJECT_MAP Update Policy

Update this file when code changes affect:

```text
active runtime files/imports
GameEngine lifecycle or RNG
StrategyPolicy / ActiveStrategy schema
SAFE_CHASE behavior
EAT_SAFE_FOOD behavior
planner/simulator/safe-food modules
LOOP / progress / stagnation semantics
Danger semantics or trigger wiring
Qwen strategy optimization
primitive plannedMoves fallback semantics
SafetyLayer responsibility
benchmark semantics/debug APIs
active-vs-legacy UI ownership
major telemetry fields
```

Usually do NOT update this file for:

```text
font-size tweaks
padding / spacing
small color changes
minor CSS polish
```

---

## 30. New Session Startup

Use this mental model:

```text
1. Read PROJECT_MAP.md first.
2. Treat CURRENT SOURCE CODE as higher authority.
3. Ignore legacy duplicate files unless explicitly relevant.
4. Read only the ACTIVE files needed for the current task.
5. Do not mix architecture phases in one patch.
6. If source changes architecture, update PROJECT_MAP.md in a separate small documentation task.
```

---

## 31. High-Confidence Anchors

```text
Entry:                    src/main.ts
Framework:                Vanilla TypeScript + Vite + Canvas 2D
Board:                    32×24 / 768 cells
AgentController:          src/agent/agent-controller.ts
Default policy:           SAFE_CHASE
Implemented policies:     SAFE_CHASE | EAT_SAFE_FOOD
Greedy executor:          src/agent/strategy-executor.ts
BFS planner:              src/agent/path-planner.ts
Virtual simulator:        src/agent/snake-simulator.ts
Safe-food validator:      src/agent/safe-food-validator.ts
Danger monitor:           src/agent/danger-monitor.ts
Stagnation budget:        src/agent/stagnation-budget.ts
LM client:                src/agent/lm-studio-client.ts
Active UI:                src/agent-panel.ts + src/style.css
Panel layout:             Thinking | Snake | Control = 2:6:2
LM streaming:             reasoning_content + content SSE
Normal stagnation mode:   DYNAMIC
Local benchmark stagnation: FIXED = 80
SafeBFS injection:         bypasses normal LOOP/progress/stagnation lifecycle
Danger trigger Qwen:      NO
PRESSURED=40 early use:   NO
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

Do not regress from this separation.
