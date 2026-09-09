import type { Direction, GameStateType, Position, Score } from './types.js';
import { Direction as Dir, GameState as GS } from './types.js';

const GRID_SIZE = 20;
const INITIAL_SPEED = 150;
const MIN_SPEED = 60;
const SPEED_DECREMENT = 3;

export interface EngineConfig {
  canvasWidth: number;
  canvasHeight: number;
}

export class GameEngine {
  private _snake: Position[] = [];
  private _direction: Direction = Dir.Right;
  private _nextDirection: Direction = Dir.Right;
  private _food: Position | null = null;
  private _score: number = 0;
  private _highScore: number = parseInt(localStorage.getItem('snakeHighScore') || '0', 10);
  private _gameState: GameStateType = GS.Start;
  private _speed: number = INITIAL_SPEED;
  private _lastTick: number = 0;
  private _manualMode: boolean = false;
  private _config: EngineConfig;
  private _seed: number | null = null;
  private _rngState: number = 0;

  constructor(config: EngineConfig) {
    this._config = config;
  }

  get gridSize(): number { return GRID_SIZE; }
  get snake(): Position[] { return this._snake; }
  get direction(): Direction { return this._direction; }
  get food(): Position | null { return this._food; }
  get score(): number { return this._score; }
  get highScore(): number { return this._highScore; }
  get gameState(): GameStateType { return this._gameState; }
  get speed(): number { return this._speed; }
  get manualMode(): boolean { return this._manualMode; }

  setManualMode(enabled: boolean): void {
    this._manualMode = enabled;
    if (enabled) {
      this._lastTick = performance.now();
    }
  }

  setSeed(seed: number | null): void {
    if (seed === null) {
      this._seed = null;
    } else {
      this._seed = seed | 0;
    }
  }

  getSeed(): number | null {
    return this._seed;
  }

  resetToStart(): void {
    this._snake = [];
    this._direction = Dir.Right;
    this._nextDirection = Dir.Right;
    this._food = null;
    this._score = 0;
    this._speed = INITIAL_SPEED;
    this._gameState = GS.Start;
  }

  setDirection(dir: Direction): void {
    const opposites: Record<string, Direction> = {
      [Dir.Up]: Dir.Down,
      [Dir.Down]: Dir.Up,
      [Dir.Left]: Dir.Right,
      [Dir.Right]: Dir.Left,
    };
    if (dir !== opposites[this._direction]) {
      this._nextDirection = dir;
    }
  }

  start(): void {
    const cols = Math.floor(this._config.canvasWidth / GRID_SIZE);
    const rows = Math.floor(this._config.canvasHeight / GRID_SIZE);
    const startX = Math.floor(cols / 2);
    const startY = Math.floor(rows / 2);

    this._snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this._direction = Dir.Right;
    this._nextDirection = Dir.Right;
    this._score = 0;
    this._speed = INITIAL_SPEED;
    this._gameState = GS.Playing;
    this._lastTick = performance.now();
    if (this._seed !== null) {
      this._rngState = this._seed | 0;
    }
    this.spawnFood();
  }

  pause(): void {
    if (this._gameState === GS.Playing) {
      this._gameState = GS.Paused;
    } else if (this._gameState === GS.Paused) {
      this._gameState = GS.Playing;
      this._lastTick = performance.now();
    }
  }

  restart(): void {
    this.start();
  }

  private random(): number {
    if (this._seed === null) {
      return Math.random();
    }
    let t = this._rngState += 0x6D2B79F5;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  tick(now: number): boolean {
    if (this._gameState !== GS.Playing) return false;

    if (this._manualMode) {
      this._lastTick = now;
      return false;
    }

    const elapsed = now - this._lastTick;
    if (elapsed < this._speed) return false;
    this._lastTick = now;

    return this._doTick();
  }

  step(): boolean {
    if (this._gameState !== GS.Playing) return false;
    this._lastTick = performance.now();
    return this._doTick();
  }

  private _doTick(): boolean {
    this._direction = this._nextDirection;

    const head = this._snake[0];
    let newHead: Position = { x: head.x + 1, y: head.y };

    switch (this._direction) {
      case Dir.Up:
        newHead = { x: head.x, y: head.y - 1 };
        break;
      case Dir.Down:
        newHead = { x: head.x, y: head.y + 1 };
        break;
      case Dir.Left:
        newHead = { x: head.x - 1, y: head.y };
        break;
      case Dir.Right:
        newHead = { x: head.x + 1, y: head.y };
        break;
    }

    const cols = Math.floor(this._config.canvasWidth / GRID_SIZE);
    const rows = Math.floor(this._config.canvasHeight / GRID_SIZE);

    if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
      this._gameState = GS.GameOver;
      return false;
    }

    for (const segment of this._snake) {
      if (segment.x === newHead.x && segment.y === newHead.y) {
        this._gameState = GS.GameOver;
        return false;
      }
    }

    this._snake.unshift(newHead);

    if (this._food && newHead.x === this._food.x && newHead.y === this._food.y) {
      this._score++;
      const newSpeed = Math.max(MIN_SPEED, INITIAL_SPEED - this._score * SPEED_DECREMENT);
      this._speed = newSpeed;
      this.spawnFood();

      if (this._score > this._highScore) {
        this._highScore = this._score;
        localStorage.setItem('snakeHighScore', String(this._highScore));
      }
    } else {
      this._snake.pop();
    }

    return true;
  }

  private spawnFood(): void {
    const cols = Math.floor(this._config.canvasWidth / GRID_SIZE);
    const rows = Math.floor(this._config.canvasHeight / GRID_SIZE);
    const occupied = new Set(this._snake.map(s => `${s.x},${s.y}`));

    let attempts = 0;
    while (attempts < 1000) {
      const x = Math.floor(this.random() * cols);
      const y = Math.floor(this.random() * rows);
      const key = `${x},${y}`;
      if (!occupied.has(key)) {
        this._food = { x, y };
        return;
      }
      attempts++;
    }
  }

  getScore(): Score {
    return { current: this._score, high: this._highScore };
  }

  getState(): { score: number; highScore: number } | null {
    if (this._gameState === GS.Start) return null;
    return { score: this._score, highScore: this._highScore };
  }
}
