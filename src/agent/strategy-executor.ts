import type { Direction } from './types.js';
import type { ActiveStrategy } from './types.js';
import { getLegalMoves } from './safety-layer.js';

export function nextMove(
  headX: number,
  headY: number,
  snakeBody: { x: number; y: number }[],
  foodX: number | null,
  foodY: number | null,
  currentDirection: Direction,
  strategy: ActiveStrategy,
  cols: number,
  rows: number,
  recentHeadPositions: { x: number; y: number }[] = []
): Direction | null {

  const legal = getLegalMoves(headX, headY, cols, rows, currentDirection, snakeBody);

  if (legal.length === 0) return null;

  const params = strategy.params;
  let bestDir: Direction | null = null;
  let bestScore = -Infinity;

  for (const dir of legal) {
    let nx = headX;
    let ny = headY;
    switch (dir) {
      case 'Up': ny -= 1; break;
      case 'Down': ny += 1; break;
      case 'Left': nx -= 1; break;
      case 'Right': nx += 1; break;
    }

  const score = evaluateScore(
    nx, ny, headX, headY,
    snakeBody, foodX, foodY,
    params, cols, rows,
    recentHeadPositions
  );

    if (score > bestScore) {
      bestScore = score;
      bestDir = dir;
    } else if (score === bestScore && bestDir !== null) {
      if (dir === currentDirection && bestDir !== currentDirection) {
        bestDir = dir;
      }
    }
  }

  return bestDir;
}

function evaluateScore(
  nx: number, ny: number,
  headX: number, headY: number,
  snakeBody: { x: number; y: number }[],
  foodX: number | null, foodY: number | null,
  params: ActiveStrategy['params'],
  cols: number, rows: number,
  recentHeadPositions: { x: number; y: number }[] = []
): number {

  let score = 0;

  // Food progress: negative Manhattan distance change (lower distance = higher score)
  if (foodX !== null && foodY !== null) {
    const currentDist = Math.abs(headX - foodX) + Math.abs(headY - foodY);
    const newDist = Math.abs(nx - foodX) + Math.abs(ny - foodY);
    const progress = currentDist - newDist; // positive if closer, negative if farther
    score += progress * params.foodWeight;
  }

  // Open space: flood fill from new position (capped at 200 for performance)
  const openSpace = countOpenSpace(nx, ny, snakeBody, cols, rows);
  score += openSpace * params.openSpaceWeight;

  // Wall risk: inverse of minimum distance to any wall edge
  const minWallDist = Math.min(nx, ny, (cols - 1 - nx), (rows - 1 - ny));
  const wallRisk = minWallDist > 0 ? 1 / minWallDist : 10;
  score -= wallRisk * params.wallPenalty;

  // Body risk: inverse of minimum distance to any body segment from new position
  let minBodyDist = Infinity;
  for (const seg of snakeBody) {
    const dist = Math.abs(seg.x - nx) + Math.abs(seg.y - ny);
    if (dist < minBodyDist && dist > 0) {
      minBodyDist = dist;
    }
  }
  const bodyRisk = minBodyDist !== Infinity ? 1 / minBodyDist : 0;
  score -= bodyRisk * params.bodyPenalty;

  // Revisit penalty: penalize cells recently visited by snake head
  if (recentHeadPositions.length > 0 && params.recentVisitPenalty !== undefined && params.recentVisitPenalty > 0) {
    for (let i = 0; i < recentHeadPositions.length; i++) {
      const pos = recentHeadPositions[i];
      if (pos.x === nx && pos.y === ny) {
        // newer visits (higher index) penalize more
        const recencyWeight = 1 + (i / recentHeadPositions.length);
        score -= params.recentVisitPenalty * recencyWeight;
      }
    }
  }

  return score;
}

function countOpenSpace(
  startX: number,
  startY: number,
  snakeBody: { x: number; y: number }[],
  cols: number,
  rows: number
): number {
  const bodySet = new Set<string>();
  for (const seg of snakeBody) {
    bodySet.add(`${seg.x},${seg.y}`);
  }

  let count = 0;
  const visited = new Set<string>();
  const queue: [number, number][] = [[startX, startY]];

  while (queue.length > 0 && count < 200) {
    const [x, y] = queue.shift()!;
    const key = `${x},${y}`;
    if (visited.has(key)) continue;
    visited.add(key);

    if (x < 0 || x >= cols || y < 0 || y >= rows) continue;
    if (bodySet.has(key)) continue;
    count++;

    queue.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return count;
}
