import type { DangerLevel } from './danger-monitor.js';
import type { FoodPathReason } from './safe-food-validator.js';

export type StagnationCategory = 'NORMAL' | 'REORGANIZING' | 'PRESSURED' | 'EMERGENCY';

export interface StagnationBudgetResult {
  threshold: number;
  category: StagnationCategory;
}

const baseline = 80;
const pressured = 40;
const maxReorganizing = 200;
const minReorganizing = 80;
const reachableFraction = 0.25;

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function stagnationBudget(
  dangerLevel: DangerLevel,
  survivableMoveCount: number,
  reachableCells: number,
  foodPathSafe: boolean,
  foodPathReason: FoodPathReason
): StagnationBudgetResult {

  // Rule 1: DEAD_END_IMMINENT or survivableMoveCount === 0
  if (dangerLevel === 'DEAD_END_IMMINENT' || survivableMoveCount === 0) {
    return { threshold: 0, category: 'EMERGENCY' };
  }

  // Rule 2: LOW_MOBILITY or survivableMoveCount === 1
  if (dangerLevel === 'LOW_MOBILITY' || survivableMoveCount === 1) {
    return { threshold: pressured, category: 'PRESSURED' };
  }

  // Rule 3: food path is safe
  if (foodPathSafe === true) {
    return { threshold: baseline, category: 'NORMAL' };
  }

  // Rule 4: SAFE danger + unsafe food + NO_TAIL_ESCAPE or NO_FOOD_PATH
  if (dangerLevel === 'SAFE' && !foodPathSafe &&
      (foodPathReason === 'NO_TAIL_ESCAPE' || foodPathReason === 'NO_FOOD_PATH')) {
    const threshold = clamp(
      Math.round(reachableCells * reachableFraction),
      minReorganizing,
      maxReorganizing
    );
    return { threshold, category: 'REORGANIZING' };
  }

  // Rule 5: otherwise
  return { threshold: baseline, category: 'NORMAL' };
}
