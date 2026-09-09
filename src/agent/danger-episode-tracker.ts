import type { DangerLevel } from './danger-monitor.js';

export interface DangerEpisodeState {
  previousDangerLevel: DangerLevel | '-';
  currentLowMobilityStreak: number;
  maxLowMobilityStreak: number;
  lastLowStreakBeforeDeadEnd: number;
  deadEndEventCount: number;
  maxLowMobilityReachableDrop: number;
  lastLowMobilityReachableDropBeforeDeadEnd: number;
}

export class DangerEpisodeTracker {
  private previousDangerLevel: DangerLevel | '-' = '-';
  private currentLowMobilityStreak: number = 0;
  private maxLowMobilityStreak: number = 0;
  private lastLowStreakBeforeDeadEnd: number = 0;
  private deadEndEventCount: number = 0;
  private maxLowMobilityReachableDrop: number = 0;
  private lastLowMobilityReachableDropBeforeDeadEnd: number = 0;

  // Internal episode tracking for reachable drop
  private _lowMobilityEpisodeActive: boolean = false;
  private _startReachableCells: number = 0;
  private _currentDrop: number = 0;

  processTick(dangerLevel: DangerLevel | '-', reachableCells: number): void {
    const currentDanger = dangerLevel;
    if (currentDanger === 'LOW_MOBILITY') {
      this.currentLowMobilityStreak += 1;
      if (this.currentLowMobilityStreak > this.maxLowMobilityStreak) {
        this.maxLowMobilityStreak = this.currentLowMobilityStreak;
      }

      if (!this._lowMobilityEpisodeActive) {
        this._startReachableCells = reachableCells;
        this._currentDrop = 0;
        this._lowMobilityEpisodeActive = true;
      } else {
        const drop = this._startReachableCells - reachableCells;
        if (drop > this._currentDrop) {
          this._currentDrop = drop;
        }
        if (this._currentDrop > this.maxLowMobilityReachableDrop) {
          this.maxLowMobilityReachableDrop = this._currentDrop;
        }
      }

    } else {
      if (currentDanger === 'SAFE') {
        this.currentLowMobilityStreak = 0;
      }
      this._lowMobilityEpisodeActive = false;
    }

    if (currentDanger === 'DEAD_END_IMMINENT' && this.previousDangerLevel !== 'DEAD_END_IMMINENT') {
      this.lastLowStreakBeforeDeadEnd = this.currentLowMobilityStreak;
      this.deadEndEventCount += 1;
      this.lastLowMobilityReachableDropBeforeDeadEnd = this._currentDrop;

      this.currentLowMobilityStreak = 0;
      this._lowMobilityEpisodeActive = false;
    } else if (currentDanger === 'DEAD_END_IMMINENT' && this.previousDangerLevel === 'DEAD_END_IMMINENT') {
    }

    this.previousDangerLevel = currentDanger;
  }

  getState(): DangerEpisodeState {
    return {
      previousDangerLevel: this.previousDangerLevel,
      currentLowMobilityStreak: this.currentLowMobilityStreak,
      maxLowMobilityStreak: this.maxLowMobilityStreak,
      lastLowStreakBeforeDeadEnd: this.lastLowStreakBeforeDeadEnd,
      deadEndEventCount: this.deadEndEventCount,
      maxLowMobilityReachableDrop: this.maxLowMobilityReachableDrop,
      lastLowMobilityReachableDropBeforeDeadEnd: this.lastLowMobilityReachableDropBeforeDeadEnd,
    };
  }

  reset(): void {
    this.previousDangerLevel = '-';
    this.currentLowMobilityStreak = 0;
    this.maxLowMobilityStreak = 0;
    this.lastLowStreakBeforeDeadEnd = 0;
    this.deadEndEventCount = 0;
    this.maxLowMobilityReachableDrop = 0;
    this.lastLowMobilityReachableDropBeforeDeadEnd = 0;
    this._lowMobilityEpisodeActive = false;
    this._startReachableCells = 0;
    this._currentDrop = 0;
  }
}
