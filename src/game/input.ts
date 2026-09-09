import { Direction, GameState as GS } from './types.js';
import { GameEngine } from './engine.js';

export class InputHandler {
  private engine: GameEngine;

  constructor(engine: GameEngine) {
    this.engine = engine;
    window.addEventListener('keydown', (e) => this.handleKey(e));
  }

  private handleKey(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();

    switch (key) {
      case 'arrowup':
      case 'w':
        e.preventDefault();
        this.engine.setDirection(Direction.Up);
        break;
      case 'arrowdown':
      case 's':
        e.preventDefault();
        this.engine.setDirection(Direction.Down);
        break;
      case 'arrowleft':
      case 'a':
        e.preventDefault();
        this.engine.setDirection(Direction.Left);
        break;
      case 'arrowright':
      case 'd':
        e.preventDefault();
        this.engine.setDirection(Direction.Right);
        break;
      case ' ':
        e.preventDefault();
        if (this.engine.gameState === GS.Playing || this.engine.gameState === GS.Paused) {
          this.engine.pause();
        }
        break;
      case 'enter':
        if (this.engine.gameState === GS.Start || this.engine.gameState === GS.GameOver) {
          e.preventDefault();
          this.engine.restart();
        }
        break;
    }
  }
}
