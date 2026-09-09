import type { Direction, Position } from '../game/types.js';
import { findPath } from './path-planner.js';
import { simulatePath } from './snake-simulator.js';

export type FoodPathReason =
  | 'SAFE'
  | 'NO_FOOD'
  | 'NO_FOOD_PATH'
  | 'SIMULATION_INVALID'
  | 'FOOD_NOT_REACHED'
  | 'NO_TAIL_ESCAPE';

export interface FoodPathEvaluation {
  safe: boolean;
  reason: FoodPathReason;
  path: Direction[] | null;
}

function buildBlocked(snake: Position[]): Set<string> {
  const blocked = new Set<string>();
  for (let i = 1; i < snake.length; i++) {
    blocked.add(`${snake[i].x},${snake[i].y}`);
  }
  return blocked;
}

export function evaluateFoodPath(
  snake: Position[],
  food: Position | null,
  currentDirection: Direction,
  cols: number,
  rows: number,
): FoodPathEvaluation {

  // STEP 1 — Find path to current food
  if (!food) {
    return { safe: false, reason: 'NO_FOOD', path: null };
  }

  const blocked = buildBlocked(snake);
  const head = snake[0];

  const foodPath = findPath(head, food, blocked, cols, rows, currentDirection);

  if (!foodPath) {
    return { safe: false, reason: 'NO_FOOD_PATH', path: null };
  }

  // STEP 2 — Simulate the complete food path
  const result = simulatePath(snake, food, foodPath, cols, rows, currentDirection);

  if (!result.valid) {
    return { safe: false, reason: 'SIMULATION_INVALID', path: foodPath };
  }

  if (result.ateFood !== true) {
    return { safe: false, reason: 'FOOD_NOT_REACHED', path: foodPath };
  }

  // STEP 3 — Post-food tail reachability heuristic
  const finalSnake = result.snake;
  const postFoodHead = finalSnake[0];
  const postFoodTail = finalSnake[finalSnake.length - 1];

  let finalDirection: Direction;
  if (foodPath.length > 0) {
    finalDirection = foodPath[foodPath.length - 1];
  } else {
    finalDirection = currentDirection;
  }

  const postBlocked = buildBlocked(finalSnake);
  // Temporarily remove the tail from blocked for this heuristic only
  const tailKey = `${postFoodTail.x},${postFoodTail.y}`;
  postBlocked.delete(tailKey);

  const tailPath = findPath(postFoodHead, postFoodTail, postBlocked, cols, rows, finalDirection);

  if (!tailPath) {
    return { safe: false, reason: 'NO_TAIL_ESCAPE', path: foodPath };
  }

  return { safe: true, reason: 'SAFE', path: foodPath };
}
