import type { DebugState, Direction } from './game/types.js';
import type { BenchmarkResult, SafeBfsBenchmarkResult } from './agent/agent-controller.js';

interface SnakeDebugAPI {
  getState: () => DebugState;
  setManualMode: (enabled: boolean) => void;
  setDirection: (direction: Direction) => void;
  step: () => boolean;
  reset: () => void;
  getAgentInfo: () => AgentDebugInfo | null;
  setSeed: (seed: number | null) => void;
  restart: () => void;
  runLocalBenchmark: (seed: number, maxSteps: number) => Promise<BenchmarkResult>;
  runSafeBfsBenchmark: (seed: number, maxSteps: number) => Promise<SafeBfsBenchmarkResult>;
}

interface AgentDebugInfo {
  model: string;
  score: number;
  highScore: number;
  steps: number;
  currentDirection: string;
  qwenRequested: string;
  qwenExecuted: string;
  safetyReason: string;
  risk: number;
  strategy: string;
  status: string;
  planRemaining: number;
  llmCalls: number;
  planLength: number;
  movesPerLlm: number;
  lastLlmLatency: number;
}

interface SnakeAgentAPI {
  startGame: () => Promise<boolean>;
  stopGame: () => void;
  setSpeedMultiplier: (multiplier: number) => void;
  reset: () => void;
  getInfo: () => AgentDebugInfo | null;
}

declare global {
  interface Window {
    __snakeDebug: SnakeDebugAPI | undefined;
    __snakeAgent?: SnakeAgentAPI;
  }
}

export {};
