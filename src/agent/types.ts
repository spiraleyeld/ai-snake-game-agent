export type AgentMode = 'PLAYER' | 'QWEN_AGENT';

export interface AgentConfig {
  lmStudioUrl: string;
  modelName: string;
  speedMultiplier: number;
}

export const DEFAULT_CONFIG: AgentConfig = {
  lmStudioUrl: 'http://127.0.0.1:1234',
  modelName: 'Qwen3.6-35B',
  speedMultiplier: 1,
};

export interface QwenResponse {
  direction: Direction;
  risk: number;
  strategy: string;
}

export type Direction = 'Up' | 'Down' | 'Left' | 'Right';

export type AgentStatus = 'idle' | 'thinking' | 'playing' | 'game-over' | 'connecting' | 'executing-plan';

export interface AgentTelemetry {
  llmCalls: number;
  planLength: number;
  movesPerLlm: number;
  lastLlmLatency: number;
  planLeft: number;
}

export interface SafetyResult {
  executed: Direction;
  requested: Direction;
  reason: string;
}

export interface ReflectionLesson {
  lesson: string;
}

export interface AgentMemoryData {
  bestScore: number;
  gamesPlayed: number;
  recentMoves: MoveRecord[];
  strategyMemory: string;
  lastDeathReason: string;
  reflectionLessons: string[];
}

export interface MoveRecord {
  headX: number;
  headY: number;
  direction: Direction;
  score: number;
  foodX: number | null;
  foodY: number | null;
}

export interface PlanResponse {
  moves: Direction[];
  risk: number;
  strategy: string;
  thinking?: string;
}

export interface StrategyUpdateResponse {
  policy: 'SAFE_CHASE';
  params: ActiveStrategyParams;
  reason: string;
  thinking?: string;
}

export type StrategyPolicy = 'SAFE_CHASE';

export interface ActiveStrategyParams {
  foodWeight: number;
  openSpaceWeight: number;
  wallPenalty: number;
  bodyPenalty: number;
  recentVisitPenalty: number;
}

export interface ActiveStrategy {
  policy: StrategyPolicy;
  params: ActiveStrategyParams;
  startedAtStep: number;
}
