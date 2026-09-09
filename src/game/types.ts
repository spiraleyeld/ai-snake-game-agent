export type Direction = 'Up' | 'Down' | 'Left' | 'Right';

export const Direction: { readonly Up: Direction; readonly Down: Direction; readonly Left: Direction; readonly Right: Direction } = Object.freeze({
  Up: 'Up',
  Down: 'Down',
  Left: 'Left',
  Right: 'Right',
});

export type GameStateType = 'Start' | 'Playing' | 'Paused' | 'GameOver';

export const GameState: { readonly Start: GameStateType; readonly Playing: GameStateType; readonly Paused: GameStateType; readonly GameOver: GameStateType } = Object.freeze({
  Start: 'Start',
  Playing: 'Playing',
  Paused: 'Paused',
  GameOver: 'GameOver',
});

export interface Position {
  x: number;
  y: number;
}

export interface Score {
  current: number;
  high: number;
}

export interface DebugState {
  snake: Position[];
  food: Position | null;
  direction: Direction;
  score: number;
  highScore: number;
  paused: boolean;
  gameOver: boolean;
  gameStarted: boolean;
  speed: number;
  manualMode: boolean;
  seed: number | null;
}

export interface AgentState {
  mode: 'PLAYER' | 'QWEN_AGENT';
  model: string;
  score: number;
  bestScore: number;
  steps: number;
  currentDirection: Direction;
  qwenDecision: string;
  risk: number;
  strategy: string;
  status: 'IDLE' | 'THINKING' | 'PLAYING' | 'GAME_OVER';
  requestedDirection?: Direction;
  executedDirection?: Direction;
  reason?: string;
}

export interface AgentMemory {
  bestScore: number;
  gamesPlayed: number;
  recentMoves: Array<{ head: Position; direction: Direction }>;
  strategyMemory: string[];
  lastDeathReason: string;
}
