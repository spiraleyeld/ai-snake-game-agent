import { Direction, GameState } from './types.js';
import { GameEngine } from './engine.js';

const COLORS = {
  bg: '#0d1117',
  gridLine: '#161b22',
  snakeHead: '#3fb950',
  snakeBody: '#2ea043',
  snakeBorder: '#1a7f37',
  food: '#f85149',
  foodGlow: 'rgba(248, 81, 73, 0.3)',
  textPrimary: '#e6edf3',
  textSecondary: '#8b949e',
  accent: '#58a6ff',
  overlayBg: 'rgba(13, 17, 23, 0.85)',
};

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private engine: GameEngine;

  constructor(canvas: HTMLCanvasElement, engine: GameEngine) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    if (!this.ctx) throw new Error('Could not get canvas context');
    this.engine = engine;
  }

  render(): void {
    const ctx = this.ctx;
    const gs = this.engine.gridSize;
    const cols = Math.floor(this.canvas.width / gs);
    const rows = Math.floor(this.canvas.height / gs);

    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawGrid(cols, rows);
    this.drawFood();
    this.drawSnake();
    this.drawOverlay();
  }

  private drawGrid(cols: number, rows: number): void {
    const ctx = this.ctx;
    const gs = this.engine.gridSize;
    ctx.strokeStyle = COLORS.gridLine;
    ctx.lineWidth = 0.5;
    for (let x = 0; x <= cols; x++) {
      ctx.beginPath();
      ctx.moveTo(x * gs, 0);
      ctx.lineTo(x * gs, this.canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y <= rows; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * gs);
      ctx.lineTo(this.canvas.width, y * gs);
      ctx.stroke();
    }
  }

  private drawSnake(): void {
    const ctx = this.ctx;
    const gs = this.engine.gridSize;
    const snake = this.engine.snake;

    for (let i = snake.length - 1; i >= 0; i--) {
      const seg = snake[i];
      const x = seg.x * gs;
      const y = seg.y * gs;
      const padding = 1;

      if (i === 0) {
        ctx.fillStyle = COLORS.snakeHead;
        ctx.shadowColor = 'rgba(63, 185, 80, 0.4)';
        ctx.shadowBlur = 8;
      } else {
        const ratio = Math.max(0.6, 1 - (i / snake.length) * 0.4);
        ctx.fillStyle = COLORS.snakeBody;
        ctx.globalAlpha = ratio;
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
      }

      const radius = 3;
      ctx.beginPath();
      ctx.roundRect(x + padding, y + padding, gs - padding * 2, gs - padding * 2, radius);
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.shadowBlur = 0;

      if (i === 0) {
        this.drawEyes(seg);
      }
    }
  }

  private drawEyes(head: { x: number; y: number }): void {
    const ctx = this.ctx;
    const gs = this.engine.gridSize;
    const dir = this.engine.direction;
    const cx = head.x * gs + gs / 2;
    const cy = head.y * gs + gs / 2;

    let eye1: { x: number; y: number } = { x: cx, y: cy };
    let eye2: { x: number; y: number } = { x: cx, y: cy };
    const offset = 4;
    const fwd = 3;

    switch (dir) {
      case Direction.Up:
        eye1 = { x: cx - offset, y: cy - fwd };
        eye2 = { x: cx + offset, y: cy - fwd };
        break;
      case Direction.Down:
        eye1 = { x: cx - offset, y: cy + fwd };
        eye2 = { x: cx + offset, y: cy + fwd };
        break;
      case Direction.Left:
        eye1 = { x: cx - fwd, y: cy - offset };
        eye2 = { x: cx - fwd, y: cy + offset };
        break;
      case Direction.Right:
        eye1 = { x: cx + fwd, y: cy - offset };
        eye2 = { x: cx + fwd, y: cy + offset };
        break;
    }

    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(eye1.x, eye1.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eye2.x, eye2.y, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawFood(): void {
    const ctx = this.ctx;
    const gs = this.engine.gridSize;
    const food = this.engine.food;
    if (!food) return;

    const x = food.x * gs + gs / 2;
    const y = food.y * gs + gs / 2;
    const r = gs / 2 - 3;

    ctx.shadowColor = COLORS.foodGlow;
    ctx.shadowBlur = 15;
    ctx.fillStyle = COLORS.food;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(x - r * 0.25, y - r * 0.25, r * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  private drawOverlay(): void {
    const ctx = this.ctx;
    const state = this.engine.gameState;
    if (state === GameState.Playing) return;

    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.fillStyle = COLORS.overlayBg;
    ctx.fillRect(0, 0, w, h);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (state === GameState.Start) {
      this.drawTitle();
      ctx.font = 'bold 28px "Courier New", monospace';
      ctx.fillStyle = COLORS.accent;
      ctx.fillText('WAITING FOR AGENT', w / 2, h / 2 + 50);

      ctx.font = '14px "Courier New", monospace';
      ctx.fillStyle = COLORS.textSecondary;
      ctx.fillText('Arrow Keys / WASD to move', w / 2, h / 2 + 90);
      ctx.fillText('Space to pause', w / 2, h / 2 + 115);
    } else if (state === GameState.Paused) {
      ctx.font = 'bold 36px "Courier New", monospace';
      ctx.fillStyle = COLORS.textPrimary;
      ctx.fillText('PAUSED', w / 2, h / 2 - 20);

      ctx.font = '18px "Courier New", monospace';
      ctx.fillStyle = COLORS.textSecondary;
      ctx.fillText('Press SPACE to Resume', w / 2, h / 2 + 30);
    } else if (state === GameState.GameOver) {
      const score = this.engine.getScore();

      ctx.font = 'bold 40px "Courier New", monospace';
      ctx.fillStyle = COLORS.food;
      ctx.fillText('GAME OVER', w / 2, h / 2 - 60);

      ctx.font = 'bold 24px "Courier New", monospace';
      ctx.fillStyle = COLORS.textPrimary;
      ctx.fillText(`Score: ${score.current}`, w / 2, h / 2 - 10);

      if (score.current >= score.high && score.current > 0) {
        ctx.font = 'bold 18px "Courier New", monospace';
        ctx.fillStyle = '#f0c040';
        ctx.fillText('NEW HIGH SCORE!', w / 2, h / 2 + 25);
      }

      ctx.font = '16px "Courier New", monospace';
      ctx.fillStyle = COLORS.textSecondary;
      ctx.fillText(`High Score: ${score.high}`, w / 2, h / 2 + 55);

      ctx.font = 'bold 20px "Courier New", monospace';
      ctx.fillStyle = COLORS.accent;
      ctx.fillText('Press ENTER to Restart', w / 2, h / 2 + 100);
    }
  }

  private drawTitle(): void {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.font = 'bold 56px "Courier New", monospace';
    ctx.fillStyle = COLORS.snakeHead;
    ctx.shadowColor = 'rgba(63, 185, 80, 0.5)';
    ctx.shadowBlur = 20;
    ctx.textAlign = 'center';
    ctx.fillText('SNAKE', w / 2, h / 2 - 70);
    ctx.shadowBlur = 0;

    ctx.font = '14px "Courier New", monospace';
    ctx.fillStyle = COLORS.textSecondary;
    ctx.fillText('CLASSIC ARCADE', w / 2, h / 2 - 35);
  }
}
