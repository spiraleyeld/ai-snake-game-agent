import type { AgentMemoryData, MoveRecord } from './types.js';

const MEMORY_KEY = 'snakeAgentMemory';
const MAX_RECENT_MOVES = 5;

export class AgentMemory {
  private _data: AgentMemoryData;

  constructor() {
    const saved = localStorage.getItem(MEMORY_KEY);
    if (saved) {
      try {
        this._data = JSON.parse(saved);
      } catch {
        this._data = this.defaultData();
      }
    } else {
      this._data = this.defaultData();
    }
  }

  private defaultData(): AgentMemoryData {
    return {
      bestScore: 0,
      gamesPlayed: 0,
      recentMoves: [],
      strategyMemory: '',
      lastDeathReason: '',
      reflectionLessons: [],
    };
  }

  save(): void {
    localStorage.setItem(MEMORY_KEY, JSON.stringify(this._data));
  }

  get data(): AgentMemoryData { return this._data; }

  addMove(headX: number, headY: number, direction: string, score: number, foodX: number | null, foodY: number | null): void {
    this._data.recentMoves.push({
      headX, headY, direction: direction as any, score, foodX, foodY,
    });
    if (this._data.recentMoves.length > MAX_RECENT_MOVES) {
      this._data.recentMoves = this._data.recentMoves.slice(-MAX_RECENT_MOVES);
    }
  }

  recordGameEnd(score: number, deathReason: string): void {
    this._data.gamesPlayed++;
    if (score > this._data.bestScore) {
      this._data.bestScore = score;
    }
    this._data.lastDeathReason = deathReason;
    this.save();
  }

  setStrategyMemory(memory: string): void {
    this._data.strategyMemory = memory.slice(0, 120);
    this.save();
  }

  getRecentMoves(): MoveRecord[] {
    return [...this._data.recentMoves];
  }

  getReflectionLessons(): string[] {
    return [...this._data.reflectionLessons];
  }

  setReflectionLessons(lessons: string[]): void {
    this._data.reflectionLessons = lessons.slice(0, 3);
    this.save();
  }

  resetForNewGame(): void {
    this._data.recentMoves = [];
    this.save();
  }
}
