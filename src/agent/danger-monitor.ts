import type { Direction, Position } from '../game/types.js';
import { getLegalMoves } from './safety-layer.js';
import { simulatePath } from './snake-simulator.js';

export type DangerLevel = 'SAFE' | 'LOW_MOBILITY' | 'DEAD_END_IMMINENT';

export interface DangerAssessment {
  legalMoveCount: number;
  survivableMoveCount: number;
  reachableCells: number;
  dangerLevel: DangerLevel;
}

function floodFill(
  headX: number,
  headY: number,
  snakeBody: Position[],
  cols: number,
  rows: number
): number {
  const blocked = new Set<string>();
  for (let i = 1; i < snakeBody.length; i++) {
    blocked.add(`${snakeBody[i].x},${snakeBody[i].y}`);
  }

  let count = 0;
  const visited = new Set<string>();
  const queue: [number, number][] = [[headX, headY]];

  while (queue.length > 0) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
    if (blocked.has(key)) continue;

    count++;
    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return count;
}

export function assessDanger(
  headX: number,
  headY: number,
  currentDirection: Direction,
  snakeBody: Position[],
  food: Position | null,
  cols: number,
  rows: number
): DangerAssessment {
  const legalMoves = getLegalMoves(headX, headY, cols, rows, currentDirection, snakeBody);

  let survivableMoveCount = 0;

  for (const dir of legalMoves) {
    const result = simulatePath(snakeBody, food, [dir], cols, rows, currentDirection);

    if (!result.valid) continue;

    const postLegalMoves = getLegalMoves(
      result.snake[0].x,
      result.snake[0].y,
      cols,
      rows,
      dir,
      result.snake
    );

    if (postLegalMoves.length > 0) {
      survivableMoveCount++;
    }
  }

  const reachableCells = floodFill(headX, headY, snakeBody, cols, rows);

  let dangerLevel: DangerLevel;
  if (survivableMoveCount >= 2) {
    dangerLevel = 'SAFE';
  } else if (survivableMoveCount === 1) {
    dangerLevel = 'LOW_MOBILITY';
  } else {
    dangerLevel = 'DEAD_END_IMMINENT';
  }

  return {
    legalMoveCount: legalMoves.length,
    survivableMoveCount,
    reachableCells,
    dangerLevel,
  };
}
