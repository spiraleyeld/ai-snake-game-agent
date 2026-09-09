import { GameEngine } from './game/engine.js';
import { Renderer } from './game/renderer.js';
import { InputHandler } from './game/input.js';
import { GameState as GS } from './game/types.js';
import type { DebugState, Direction } from './game/types.js';
import { AgentController } from './agent/agent-controller.js';
import type { BenchmarkResult, SafeBfsBenchmarkResult } from './agent/agent-controller.js';
import { AgentPanel } from './agent-panel.js';
import './style.css';

const CANVAS_WIDTH = 640;
const CANVAS_HEIGHT = 480;

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

const engine = new GameEngine({ canvasWidth: CANVAS_WIDTH, canvasHeight: CANVAS_HEIGHT });
const renderer = new Renderer(canvas, engine);
new InputHandler(engine);

const agentController = new AgentController();
agentController.setEngine(engine);
const agentPanel = new AgentPanel();
agentPanel.init(agentController);

window.__snakeDebug = {
  getState: (): DebugState => ({
    snake: engine.snake.map(s => ({ ...s })),
    food: engine.food ? { ...engine.food } : null,
    direction: engine.direction,
    score: engine.score,
    highScore: engine.highScore,
    paused: engine.gameState === GS.Paused,
    gameOver: engine.gameState === GS.GameOver,
    gameStarted: engine.gameState !== GS.Start,
    speed: engine.speed,
    manualMode: engine.manualMode,
    seed: engine.getSeed(),
  }),
  setManualMode: (enabled: boolean): void => {
    engine.setManualMode(enabled);
  },
  setDirection: (direction: Direction): void => {
    engine.setDirection(direction);
  },
  step: (): boolean => engine.step(),
  reset: (): void => engine.resetToStart(),
  getAgentInfo: () => agentController.info,
  setSeed: (seed: number | null): void => {
    engine.setSeed(seed);
  },
  restart: (): void => engine.restart(),
  runLocalBenchmark: (seed: number, maxSteps: number): Promise<BenchmarkResult> => agentController.runLocalBenchmark(seed, maxSteps),
  runSafeBfsBenchmark: (seed: number, maxSteps: number): Promise<SafeBfsBenchmarkResult> => agentController.runSafeBfsBenchmark(seed, maxSteps),
};

const scoreDisplay = document.getElementById('score-display')!;
const highScoreDisplay = document.getElementById('high-score-display')!;

function updateHUD(): void {
  const score = engine.getScore();
  scoreDisplay.textContent = `Score: ${score.current}`;
  highScoreDisplay.textContent = `Best: ${score.high}`;
}

let lastHighScore = engine.highScore;

function gameLoop(now: number): void {
  requestAnimationFrame(gameLoop);

  if (engine.gameState === GS.Playing) {
    engine.tick(now);
  }

  renderer.render();
  updateHUD();

  if (engine.highScore !== lastHighScore) {
    lastHighScore = engine.highScore;
    localStorage.setItem('snakeHighScore', String(lastHighScore));
  }
}

updateHUD();
requestAnimationFrame(gameLoop);
