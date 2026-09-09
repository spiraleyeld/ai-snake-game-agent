import type { Direction, SafetyResult } from './types.js';

const OPPOSITES: Record<Direction, Direction> = {
  Up: 'Down',
  Down: 'Up',
  Left: 'Right',
  Right: 'Left',
};

export function getLegalMoves(
  headX: number,
  headY: number,
  cols: number,
  rows: number,
  currentDirection: Direction,
  snakeBody: { x: number; y: number }[]
): Direction[] {
  const legal: Direction[] = [];

  for (const dir of ['Up', 'Down', 'Left', 'Right'] as Direction[]) {
    if (!isLegal(dir, headX, headY, cols, rows, currentDirection, snakeBody)) {
      continue;
    }
    legal.push(dir);
  }

  return legal;
}

function isLegal(
  dir: Direction,
  headX: number,
  headY: number,
  cols: number,
  rows: number,
  currentDirection: Direction,
  snakeBody: { x: number; y: number }[]
): boolean {
  if (dir === OPPOSITES[currentDirection]) return false;

  let nx = headX;
  let ny = headY;
  switch (dir) {
    case 'Up': ny -= 1; break;
    case 'Down': ny += 1; break;
    case 'Left': nx -= 1; break;
    case 'Right': nx += 1; break;
  }

  if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) return false;

  for (const seg of snakeBody) {
    if (seg.x === nx && seg.y === ny) return false;
  }

  return true;
}

export function validateDirection(
  requested: Direction,
  headX: number,
  headY: number,
  cols: number,
  rows: number,
  currentDirection: Direction,
  snakeBody: { x: number; y: number }[]
): SafetyResult {
  const legal = getLegalMoves(headX, headY, cols, rows, currentDirection, snakeBody);

  if (legal.includes(requested)) {
    return { executed: requested, requested, reason: 'OK' };
  }

  if (legal.length === 0) {
    return {
      executed: currentDirection,
      requested,
      reason: `No legal moves; head at (${headX},${headY})`,
    };
  }

  const fallback = legal[0];
  return {
    executed: fallback,
    requested,
    reason: `${requested} collision prevented -> ${fallback}`,
  };
}

export function pickSafeDirection(
  headX: number,
  headY: number,
  cols: number,
  rows: number,
  currentDirection: Direction,
  snakeBody: { x: number; y: number }[]
): Direction {
  const legal = getLegalMoves(headX, headY, cols, rows, currentDirection, snakeBody);
  if (legal.length === 0) return currentDirection;

  // Prefer direction that keeps most open space (simple heuristic)
  let best = legal[0];
  let bestSpace = -1;

  for (const dir of legal) {
    let nx = headX;
    let ny = headY;
    switch (dir) {
      case 'Up': ny -= 1; break;
      case 'Down': ny += 1; break;
      case 'Left': nx -= 1; break;
      case 'Right': nx += 1; break;
    }

    const space = countOpenSpace(nx, ny, cols, rows);
    if (space > bestSpace) {
      bestSpace = space;
      best = dir;
    }
  }

  return best;
}

function countOpenSpace(
  startX: number,
  startY: number,
  cols: number,
  rows: number
): number {
  let count = 0;
  const visited = new Set<string>();
  const queue: [number, number][] = [[startX, startY]];

  while (queue.length > 0 && count < 200) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
    count++;

    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return count;
}
