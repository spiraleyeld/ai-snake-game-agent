import type { GameEngine } from '../game/engine.js';
import type { Direction, AgentConfig, AgentStatus, ActiveStrategy } from './types.js';
import { DEFAULT_CONFIG } from './types.js';
import { LmStudioClient } from './lm-studio-client.js';
import { validateDirection, getLegalMoves, pickSafeDirection } from './safety-layer.js';
import { AgentMemory } from './agent-memory.js';
import { nextMove as strategyNextMove } from './strategy-executor.js';

const COLS = 32;
const ROWS = 24;

export interface AgentCallbacks {
  onStatusChange?: (status: AgentStatus) => void;
  onUpdate?: (info: AgentInfo) => void;
}

export interface AgentInfo {
  model: string;
  score: number;
  highScore: number;
  steps: number;
  currentDirection: Direction;
  qwenRequested: string;
  qwenExecuted: string;
  safetyReason: string;
  risk: number;
  strategy: string;
  status: AgentStatus;
  planRemaining: number;
  llmCalls: number;
  planLength: number;
  movesPerLlm: number;
  lastLlmLatency: number;
  thinking: string;
  stagnationSteps: number;
  foodDistanceRatio: string;
  recentUniqueRatio: string;
  lastTrigger: string;
  snapshotStepsSinceProgress: number | null;
  snapshotFoodDistCurrent: number | null;
  snapshotFoodDistBest: number | null;
  snapshotRecentUnique: number | null;
}

export class AgentController {
  private config: AgentConfig;
  private client: LmStudioClient;
  private memory: AgentMemory;
  private engine: GameEngine | null = null;
  private callbacks: AgentCallbacks;
  private running: boolean = false;
  private _agentStatus: AgentStatus = 'idle';
  private steps: number = 0;
  private currentInfo: AgentInfo;

  // Plan queue for short-horizon execution
  private plannedMoves: Direction[] = [];
  private lastFoodPos: { x: number; y: number } | null = null;

  // Persistent strategy (Phase 2)
  private activeStrategy: ActiveStrategy | null = null;

  // Loop/stagnation detection for persistent strategies
  private STAGNATION_THRESHOLD = 80;
  private HISTORY_SIZE = 160;
  private LOOP_REPEAT_THRESHOLD = 2;
  private loopHistory: string[] = [];
  private lastLoopScore: number = -1;
  private stepsSinceLastScore: number = 0;

  // Recent head position history for SAFE_CHASE stagnation escaping
  private recentHeadPositions: { x: number; y: number }[] = [];

  // Progress watchdog for stagnation detection
  private progressFoodTarget: { x: number; y: number } | null = null;
  private bestFoodDistance: number = Infinity;
  private stepsSinceProgress: number = 0;

  // Telemetry tracking
  private llmCallsCount: number = 0;
  private currentPlanLength: number = 0;
  private movesFromCurrentPlan: number = 0;
  private _paused: boolean = false;

  // Failed strategy capture for optimization
  private failedStrategy: ActiveStrategy | null = null;
  private failureReason: string | null = null;

  // Last trigger reason (persisted, not cleared after optimization)
  private _lastTrigger: string = '-';

  constructor(config?: Partial<AgentConfig>, callbacks?: AgentCallbacks) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.client = new LmStudioClient(this.config.lmStudioUrl, this.config.modelName);
    this.memory = new AgentMemory();
    this.callbacks = callbacks || {};
    this.currentInfo = this.getDefaultInfo();
  }

  private getDefaultInfo(): AgentInfo {
    return {
      model: this.config.modelName,
      score: 0,
      highScore: 0,
      steps: 0,
      currentDirection: 'Right',
      qwenRequested: '-',
      qwenExecuted: '-',
      safetyReason: '-',
      risk: 0,
      strategy: '-',
      status: 'idle',
      planRemaining: 0,
      llmCalls: 0,
      planLength: 0,
      movesPerLlm: 0,
      lastLlmLatency: 0,
      thinking: '',
      stagnationSteps: 0,
      foodDistanceRatio: '-',
      recentUniqueRatio: '-',
      lastTrigger: '-',
      snapshotStepsSinceProgress: null,
      snapshotFoodDistCurrent: null,
      snapshotFoodDistBest: null,
      snapshotRecentUnique: null,
    };
  }

  setEngine(engine: GameEngine): void {
    this.engine = engine;
  }

  setOnUpdate(callback: ((info: AgentInfo) => void) | undefined): void {
    this.callbacks.onUpdate = callback;
  }

  setSpeedMultiplier(_multiplier: number): void {
  }

  private createDefaultSafeChaseStrategy(): ActiveStrategy {
    return {
      policy: 'SAFE_CHASE',
      params: {
        foodWeight: 1.0,
        openSpaceWeight: 0.4,
        wallPenalty: 0.3,
        bodyPenalty: 0.8,
        recentVisitPenalty: 0.0,
      },
      startedAtStep: 0,
    };
  }

  get activeStrategyValue(): ActiveStrategy | null { return this.activeStrategy; }

  get paused(): boolean { return this._paused; }
  set paused(value: boolean) { this._paused = value; }

  get agentStatus(): AgentStatus { return this._agentStatus; }
  get info(): AgentInfo { return { ...this.currentInfo }; }
  get memoryData() { return this.memory.data; }

  // Diagnostic getters for agent-panel telemetry display
  get stagnationSteps(): number { return this.stepsSinceProgress; }
  get bestFoodDistValue(): number { return this.bestFoodDistance; }
  get recentHeadPositionsLength(): number { return this.recentHeadPositions.length; }
  get lastTrigger(): string { return this._lastTrigger; }

  // Compute unique head count from recentHeadPositions for telemetry
  getRecentUniqueCount(): number {
    const seen = new Set<string>();
    for (const p of this.recentHeadPositions) {
      seen.add(`${p.x},${p.y}`);
    }
    return seen.size;
  }

  async startGame(): Promise<boolean> {
    if (!this.engine) return false;

    const connected = await this.client.getModels().then(models => models.length > 0);
    if (!connected) {
      this.setStatus('idle');
      return false;
    }

    this._paused = false;
    this.steps = 0;
    this.plannedMoves = [];
    this.lastFoodPos = null;
    this.activeStrategy = this.createDefaultSafeChaseStrategy();
    this.memory.resetForNewGame();
    this.resetLoopHistory();
    this.resetProgressTracking();
    this.recentHeadPositions = [];
    this.engine.start();
    this.engine.setManualMode(true);
    this.setStatus('playing');
    this.running = true;

    const state = this.engine.getState ? this.engine.getState() : null;
    if (state) {
      this.currentInfo.score = state.score;
      this.currentInfo.highScore = state.highScore || 0;
      this.updateUI();
    }

    return true;
  }

  async runStep(): Promise<boolean> {
    if (!this.engine || !this.running || this._paused) return false;

    const state = this.getCurrentState();
    if (!state) return false;

    const head = state.snake[0];
    const legalMoves = getLegalMoves(head.x, head.y, COLS, ROWS, state.direction, state.snake);

    if (legalMoves.length === 0) {
      this.running = false;
      this.setStatus('game-over');
      this.memory.recordGameEnd(state.score, 'No legal moves');
      return false;
    }

    // Phase 2: Persistent strategy execution path
    if (this.activeStrategy) {
      const candidate = strategyNextMove(
        head.x,
        head.y,
        state.snake,
        state.food?.x || null,
        state.food?.y || null,
        state.direction,
        this.activeStrategy,
        COLS,
        ROWS,
        this.recentHeadPositions
      );

      if (candidate !== null) {
        const safetyResult = validateDirection(
          candidate,
          head.x, head.y, COLS, ROWS, state.direction, state.snake
        );

        if (safetyResult.executed === candidate) {
          const moved = this.executeStrategyMove(candidate, state);

          if (moved && this.activeStrategy) {
            // Record head position after successful movement
            const newStateAfterMove = this.getCurrentState();
            if (newStateAfterMove) {
              const newHead = newStateAfterMove.snake[0];
              this.recentHeadPositions.push({ x: newHead.x, y: newHead.y });
              while (this.recentHeadPositions.length > 32) {
                this.recentHeadPositions.shift();
              }

              const scoreIncreased = state.score < newStateAfterMove.score;

              if (scoreIncreased || this.lastLoopScore === -1) {
                this.resetLoopHistory();
                this.stepsSinceLastScore = 0;
              } else {
                this.stepsSinceLastScore++;
                this.recordStrategyState(head, state);

                if (this.detectLoop()) {
                  this._lastTrigger = 'LOOP_DETECTED';
                  this.failedStrategy = this.activeStrategy ? { ...this.activeStrategy } : null;
                  this.failureReason = 'LOOP_DETECTED';
                  this.captureTriggerSnapshot();
                  this.resetLoopHistory();
                  this.stepsSinceLastScore = 0;
                  this.activeStrategy = null;
                }
              }

              // Progress watchdog: stagnation detection
              const progressStagnated = this.updateProgressTracking(state, newStateAfterMove);
              if (progressStagnated) {
                this._lastTrigger = 'STAGNATION_DETECTED';
                this.failedStrategy = this.activeStrategy ? { ...this.activeStrategy } : null;
                this.failureReason = 'STAGNATION_DETECTED';
                this.captureTriggerSnapshot();
                this.activeStrategy = null;
                this.resetProgressTracking();
                this.resetLoopHistory();
              }
            }
          }

          return moved;
        } else {
          // Safety layer overrode strategy candidate — disable strategy, fall back to Qwen path next tick
          this.resetLoopHistory();
          this.stepsSinceLastScore = 0;
          this.activeStrategy = null;
          this.resetProgressTracking();
        }
      } else {
        // Strategy executor returned null — disable strategy, fall back to Qwen path next tick
        this.resetLoopHistory();
        this.stepsSinceLastScore = 0;
        this.activeStrategy = null;
        this.resetProgressTracking();
      }
    }

    // Optimization: try to recover from failed strategy before Qwen fallback
    if (this.failedStrategy) {
      const optimized = await this.optimizeStrategy(state);
      if (optimized) {
        return false;
      }
    }

    // Check replan conditions (Qwen fallback path)
    const foodChanged = this.shouldReplan(state);

    if (this.plannedMoves.length === 0 || foodChanged) {
      await this.replan(state);
    } else {
      return this.executePlannedMove(head, state, legalMoves);
    }

    // After replanning, execute the first move of the new plan
    if (this.plannedMoves.length > 0) {
      if (this._paused) return false;
      return this.executePlannedMove(head, state, legalMoves);
    }

    // Qwen failed to produce a plan - use safe fallback
    const fallback = pickSafeDirection(head.x, head.y, COLS, ROWS, state.direction, state.snake);
    this.currentInfo.qwenRequested = 'ERROR';
    this.currentInfo.qwenExecuted = fallback;
    this.currentInfo.safetyReason = 'Qwen plan error -> safe fallback';
    this.currentInfo.strategy = 'Fallback to safe move';

    if (this._paused) return false;
    return this.executeWithFallback(fallback, state);
  }

  private shouldReplan(state: GameSnapshot): boolean {
    // Replan if food position changed (food was eaten)
    if (state.food && (!this.lastFoodPos || this.lastFoodPos.x !== state.food.x || this.lastFoodPos.y !== state.food.y)) {
      return true;
    }
    return false;
  }

  private async replan(state: GameSnapshot): Promise<void> {
    const prompt = this.buildPrompt(state);

    this.setStatus('thinking');
    this.currentInfo.thinking = '';
    this.updateUI();

    const startTime = performance.now();
    this.llmCallsCount++;

    const response = await this.client.getDirection(prompt, (latestThinking: string) => {
      this.currentInfo.thinking = latestThinking;
      this.updateUI();
    });

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    if (response && response.moves.length > 0) {
      this.plannedMoves = [...response.moves];
      this.currentPlanLength = response.moves.length;
      this.movesFromCurrentPlan = 0;

      // Update last food position for replan detection
      if (state.food) {
        this.lastFoodPos = { x: state.food.x, y: state.food.y };
      }

      // Set info to show first planned move as "Qwen wants"
      const firstMove = this.plannedMoves[0];
      this.currentInfo.qwenRequested = firstMove;
      this.currentInfo.risk = response.risk;
      this.currentInfo.strategy = response.strategy || '-';
      this.currentInfo.thinking = response.thinking || '';

      // Update UI to show plan queue length
      this.updateUI();
    } else {
      this.plannedMoves = [];
      this.lastFoodPos = null;
    }

    // Update telemetry in info
    this.currentInfo.llmCalls = this.llmCallsCount;
    this.currentInfo.planLength = this.currentPlanLength;
    this.currentInfo.movesPerLlm = this.movesFromCurrentPlan;
    this.currentInfo.lastLlmLatency = latencyMs;
  }

  private executePlannedMove(head: { x: number; y: number }, state: GameSnapshot, _legalMoves: Direction[]): boolean {
    if (this._paused) return false;

    const plannedDir = this.plannedMoves[0];

    // Safety validate the planned move
    const safetyResult = validateDirection(
      plannedDir,
      head.x, head.y, COLS, ROWS, state.direction, state.snake
    );

    // If safety layer rejected/overrode a planned move, discard remaining plan and replan next tick
    if (safetyResult.executed !== plannedDir) {
      this.plannedMoves = [];
      this.lastFoodPos = null;
      this.movesFromCurrentPlan = 0;
    }

    this.currentInfo.qwenRequested = plannedDir;
    this.currentInfo.qwenExecuted = safetyResult.executed;
    this.currentInfo.safetyReason = safetyResult.reason;

    // Apply direction and step
    this.engine!.setDirection(safetyResult.executed);
    const moved = this.engine!.step();

    if (moved) {
      this.steps++;
      this.currentInfo.steps = this.steps;
      this.movesFromCurrentPlan++;
      this.memory.addMove(head.x, head.y, safetyResult.executed, state.score, state.food?.x || null, state.food?.y || null);

      // Pop the executed move from plan queue
      this.plannedMoves.shift();
    }

    // Update score and direction info
    const newState = this.getCurrentState();
    if (newState) {
      this.currentInfo.score = newState.score;
      this.currentInfo.highScore = newState.highScore || 0;
      this.currentInfo.currentDirection = safetyResult.executed;

      if (state.score < newState.score) {
        this.stepsSinceLastScore = 0;
      } else {
        this.stepsSinceLastScore++;
      }
    }

    // Update plan remaining count in info
    this.currentInfo.planRemaining = this.plannedMoves.length;

    // Update telemetry
    this.currentInfo.llmCalls = this.llmCallsCount;
    this.currentInfo.planLength = this.currentPlanLength;
    this.currentInfo.movesPerLlm = this.movesFromCurrentPlan;

    // Check if game over after move
    if (!moved && this.isGameOver()) {
      this.running = false;
      const deathReason = this.getDeathReason(state);
      this.setStatus('game-over');
      this.memory.recordGameEnd(state.score, deathReason);
    } else {
      // Set status to executing-plan while we have moves left
      if (this.plannedMoves.length > 0) {
        this.setStatus('executing-plan');
      }
    }

    this.updateUI();
    return moved;
  }

  private executeStrategyMove(candidate: Direction, state: GameSnapshot): boolean {
    if (this._paused) return false;

    const head = state.snake[0];

    this.currentInfo.qwenRequested = candidate;
    this.currentInfo.qwenExecuted = candidate;
    this.currentInfo.safetyReason = 'StrategyExecutor -> OK';
    this.currentInfo.strategy = this.activeStrategy?.policy || '-';

    this.engine!.setDirection(candidate);
    const moved = this.engine!.step();

    if (moved) {
      this.steps++;
      this.currentInfo.steps = this.steps;
      this.memory.addMove(head.x, head.y, candidate, state.score, state.food?.x || null, state.food?.y || null);
    }

    const newState = this.getCurrentState();
    if (newState) {
      this.currentInfo.score = newState.score;
      this.currentInfo.highScore = newState.highScore || 0;
      this.currentInfo.currentDirection = candidate;
    }

    this.currentInfo.planRemaining = 0;
    this.currentInfo.llmCalls = this.llmCallsCount;
    this.currentInfo.planLength = 0;
    this.currentInfo.movesPerLlm = 0;

    if (!moved && this.isGameOver()) {
      this.running = false;
      const deathReason = this.getDeathReason(state);
      this.setStatus('game-over');
      this.memory.recordGameEnd(state.score, deathReason);
    } else {
      if (this.activeStrategy) {
        this.setStatus('executing-plan');
      }
    }

    this.updateUI();
    return moved;
  }

  private executeWithFallback(fallback: Direction, state: GameSnapshot): boolean {
    if (this._paused) return false;

    const head = state.snake[0];

    this.engine!.setDirection(fallback);
    const moved = this.engine!.step();

    if (moved) {
      this.steps++;
      this.currentInfo.steps = this.steps;
      this.memory.addMove(head.x, head.y, fallback, state.score, state.food?.x || null, state.food?.y || null);
    }

    const newState = this.getCurrentState();
    if (newState) {
      this.currentInfo.score = newState.score;
      this.currentInfo.highScore = newState.highScore || 0;
      this.currentInfo.currentDirection = fallback;

      if (state.score < newState.score) {
        this.stepsSinceLastScore = 0;
      } else {
        this.stepsSinceLastScore++;
      }
    }

    this.updateUI();

    if (!moved && this.isGameOver()) {
      this.running = false;
      const deathReason = this.getDeathReason(state);
      this.setStatus('game-over');
      this.memory.recordGameEnd(state.score, deathReason);
    }

    return moved;
  }

  stop(): void {
    this.running = false;
    this.plannedMoves = [];
    if (this.agentStatus !== 'game-over') {
      this.engine?.setManualMode(false);
      this.engine?.start();
      this.setStatus('idle');
    }
  }

  reset(): void {
    this.stop();
    this.steps = 0;
    this.plannedMoves = [];
    this.lastFoodPos = null;
    this.activeStrategy = null;
    this.llmCallsCount = 0;
    this.currentPlanLength = 0;
    this.movesFromCurrentPlan = 0;
    this.resetLoopHistory();
    this.resetProgressTracking();
    this.failedStrategy = null;
    this.failureReason = null;
    this.recentHeadPositions = [];
    this.currentInfo = this.getDefaultInfo();
    this.updateUI();
  }

  private resetProgressTracking(): void {
    this.progressFoodTarget = null;
    this.bestFoodDistance = Infinity;
    this.stepsSinceProgress = 0;
  }

  private resetLoopHistory(): void {
    this.loopHistory = [];
    this.lastLoopScore = -1;
  }

  private captureTriggerSnapshot(): void {
    const uniqueCount = this.getRecentUniqueCount();
    const histLen = this.recentHeadPositions.length;
    const state = this.getCurrentState();
    let currentDist: number | null = null;
    if (state && state.food) {
      const head = state.snake[0];
      currentDist = Math.abs(state.food.x - head.x) + Math.abs(state.food.y - head.y);
    }
    this.currentInfo.snapshotStepsSinceProgress = this.stepsSinceProgress;
    this.currentInfo.snapshotFoodDistCurrent = currentDist;
    this.currentInfo.snapshotFoodDistBest = this.bestFoodDistance < Infinity ? Math.round(this.bestFoodDistance) : null;
    this.currentInfo.snapshotRecentUnique = histLen > 0 ? uniqueCount : null;
  }

  private computeStateSignature(head: { x: number; y: number }, direction: Direction, food: { x: number; y: number } | null, score: number): string {
    return `${head.x},${head.y},${direction},${food ? food.x : -1},${food ? food.y : -1},${score}`;
  }

  private detectLoop(): boolean {
    if (this.stepsSinceLastScore < this.STAGNATION_THRESHOLD) {
      return false;
    }

    const history = this.loopHistory;
    if (history.length < this.LOOP_REPEAT_THRESHOLD) {
      return false;
    }

    const lastSignature = history[history.length - 1];
    let totalCount = 0;

    const windowStart = Math.max(0, history.length - this.HISTORY_SIZE);
    for (let i = windowStart; i < history.length; i++) {
      if (history[i] === lastSignature) {
        totalCount++;
      }
    }

    return totalCount >= this.LOOP_REPEAT_THRESHOLD;
  }

  private recordStrategyState(head: { x: number; y: number }, state: GameSnapshot): void {
    const signature = this.computeStateSignature(
      head,
      state.direction,
      state.food,
      state.score
    );

    this.loopHistory.push(signature);

    if (this.loopHistory.length > this.HISTORY_SIZE) {
      this.loopHistory.shift();
    }
  }

  private updateProgressTracking(state: GameSnapshot, newState: GameSnapshot | null): boolean {
    const food = state.food;
    if (!food || !this.activeStrategy) {
      return false;
    }

    // Score increase means food was eaten — fully reset tracking
    if (newState && state.score < newState.score) {
      this.progressFoodTarget = null;
      this.bestFoodDistance = Infinity;
      this.stepsSinceProgress = 0;
      return false;
    }

    // If a new food appeared (different from tracked target), reset tracking
    if (this.progressFoodTarget === null || this.progressFoodTarget.x !== food.x || this.progressFoodTarget.y !== food.y) {
      this.progressFoodTarget = { x: food.x, y: food.y };
      const head = state.snake[0];
      this.bestFoodDistance = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);
      this.stepsSinceProgress = 0;
      return false;
    }

    // Same food target is still active — check for progress
    const head = state.snake[0];
    const currentDist = Math.abs(food.x - head.x) + Math.abs(food.y - head.y);

    if (currentDist < this.bestFoodDistance) {
      this.bestFoodDistance = currentDist;
      this.stepsSinceProgress = 0;
    } else {
      this.stepsSinceProgress++;
    }

    // Stagnation detected: no progress toward food for STAGNATION_THRESHOLD steps
    if (this.stepsSinceProgress >= this.STAGNATION_THRESHOLD) {
      return true;
    }

    return false;
  }

  private async optimizeStrategy(state: GameSnapshot): Promise<boolean> {
    const failed = this.failedStrategy;
    if (!failed) return false;

    const head = state.snake[0];
    const snakeLength = state.snake.length;

    let prompt = `Your SAFE_CHASE strategy stagnated/looped. Adjust ONLY the weights below, do NOT change moves or directions.\n\nFailed params:\nfoodWeight: ${failed.params.foodWeight}\nopenSpaceWeight: ${failed.params.openSpaceWeight}\nwallPenalty: ${failed.params.wallPenalty}\nbodyPenalty: ${failed.params.bodyPenalty}\nrecentVisitPenalty: ${failed.params.recentVisitPenalty}\n\nrecentVisitPenalty penalizes recently visited head cells. Higher values help escape repeated local loops.\n\nBoard state:\nHead: (${head.x}, ${head.y})\nDirection: ${state.direction}\nScore: ${state.score}\nSnake length: ${snakeLength}\n`;

    if (state.food) {
      prompt += `Food: (${state.food.x}, ${state.food.y})\n`;
    }

    if (this.failureReason) {
      prompt += `\nFailure reason: ${this.failureReason}`;
    }

    prompt += `\n\nRespond with compact JSON only:\n{"policy":"SAFE_CHASE","params":{"foodWeight":1.0,"openSpaceWeight":0.4,"wallPenalty":0.3,"bodyPenalty":0.8,"recentVisitPenalty":0.0},"reason":"short explanation"}`;

    this.setStatus('thinking');
    this.currentInfo.thinking = '';
    this.updateUI();

    const startTime = performance.now();
    this.llmCallsCount++;

    const response = await this.client.getStrategyUpdate(prompt, (latestThinking: string) => {
      this.currentInfo.thinking = latestThinking;
      this.updateUI();
    });

    const endTime = performance.now();
    const latencyMs = Math.round(endTime - startTime);

    if (response && response.policy === 'SAFE_CHASE' && response.params) {
      this.activeStrategy = {
        policy: 'SAFE_CHASE',
        params: response.params,
        startedAtStep: this.steps,
      };
      this.resetLoopHistory();
      this.resetProgressTracking();
      this.failedStrategy = null;
      this.failureReason = null;

      this.currentInfo.llmCalls = this.llmCallsCount;
      this.currentInfo.lastLlmLatency = latencyMs;
      this.updateUI();
      return true;
    } else {
      this.failedStrategy = null;
      this.failureReason = null;
      return false;
    }
  }

  private buildPrompt(state: GameSnapshot): string {
    const head = state.snake[0];
    const food = state.food;
    const recentMoves = this.memory.getRecentMoves().slice(-3);

    let prompt = `You are playing Snake on a ${COLS}x${ROWS} grid.\n`;
    prompt += `Head: (${head.x}, ${head.y})\n`;
    prompt += `Direction: ${state.direction}\n`;
    prompt += `Score: ${state.score}\n`;

    if (food) {
      prompt += `Food: (${food.x}, ${food.y})\n`;
    }

    // Show last 3 moves concisely
    if (recentMoves.length > 0) {
      prompt += `Recent moves:\n`;
      for (const m of recentMoves) {
        prompt += `  Head(${m.headX},${m.headY}) dir=${m.direction} score=${m.score}\n`;
      }
    }

    // Strategy memory
    if (this.memory.data.strategyMemory) {
      prompt += `\nStrategy: ${this.memory.data.strategyMemory}\n`;
    }

    // Reflection lessons
    const lessons = this.memory.getReflectionLessons();
    if (lessons.length > 0) {
      prompt += `\nLessons from past games:\n`;
      for (let i = 0; i < lessons.length; i++) {
        prompt += `${i + 1}. ${lessons[i]}\n`;
      }
    }

    // Legal moves hint
    const legalMoves = getLegalMoves(head.x, head.y, COLS, ROWS, state.direction, state.snake);
    if (legalMoves.length < 4) {
      prompt += `\nLegal moves: ${legalMoves.join(', ')}\n`;
    }

    // Ask for multi-move plan
    prompt += `\nRespond with compact JSON only (no markdown, no explanation):\n{"moves": ["Up","Down","Left","Right"], "risk": 0.0-1.0, "strategy": "short sentence"}`;
    prompt += `\nmoves must contain 1 to 6 directions from: Up, Down, Left, Right`;

    return prompt;
  }

  private setStatus(status: AgentStatus): void {
    this._agentStatus = status;
    this.currentInfo.status = status;
    this.callbacks.onStatusChange?.(status);
    this.updateUI();
  }

  private getCurrentState(): GameSnapshot | null {
    if (!this.engine) return null;

    const snake = this.engine.snake || [];
    if (snake.length === 0) return null;

    return {
      snake,
      food: this.engine.food,
      direction: this.engine.direction as Direction,
      score: this.engine.score,
      highScore: this.engine.highScore,
    };
  }

  private isGameOver(): boolean {
    if (!this.engine) return true;
    const gs = (this.engine as any)._gameState;
    return gs === 'GameOver';
  }

  private getDeathReason(state: GameSnapshot): string {
    const head = state.snake[0];
    if (head.x <= 0 || head.x >= COLS - 1 || head.y <= 0 || head.y >= ROWS - 1) {
      return 'Wall collision';
    }
    return 'Self collision';
  }

  private updateUI(): void {
    // Populate diagnostic telemetry fields
    this.currentInfo.stagnationSteps = this.stepsSinceProgress;

    const foodDistRatio = this.bestFoodDistance < Infinity
      ? `${this.getBestFoodDistanceDisplay()}`
      : '-';
    this.currentInfo.foodDistanceRatio = foodDistRatio;

    const uniqueCount = this.getRecentUniqueCount();
    const histLen = this.recentHeadPositions.length;
    this.currentInfo.recentUniqueRatio = histLen > 0 ? `${uniqueCount} / ${histLen}` : '-';

    this.currentInfo.lastTrigger = this._lastTrigger;

    this.callbacks.onUpdate?.({ ...this.currentInfo });
  }

  private getBestFoodDistanceDisplay(): string {
    const state = this.getCurrentState();
    if (!state || !state.food) return `${Math.round(this.bestFoodDistance)} / -`;
    const head = state.snake[0];
    const currentDist = Math.abs(state.food.x - head.x) + Math.abs(state.food.y - head.y);
    return `${currentDist} / ${Math.round(this.bestFoodDistance)}`;
  }
}

interface GameSnapshot {
  snake: { x: number; y: number }[];
  food: { x: number; y: number } | null;
  direction: Direction;
  score: number;
  highScore: number;
}
