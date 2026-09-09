import type { Direction } from './types.js';

const DIR_DELTA: Record<Direction, [number, number]> = {
  Up:    [0, -1],
  Down:  [0, 1],
  Left:  [-1, 0],
  Right: [1, 0],
};

const ALL_DIRS: Direction[] = ['Up', 'Down', 'Left', 'Right'];

const OPPOSITE: Record<Direction, Direction> = {
  Up: 'Down',
  Down: 'Up',
  Left: 'Right',
  Right: 'Left',
};

export function findPath(
  start: { x: number; y: number },
  target: { x: number; y: number },
  blocked: Set<string>,
  cols: number,
  rows: number,
  currentDirection?: Direction
): Direction[] | null {

  if (start.x === target.x && start.y === target.y) return [];

  const targetKey = `${target.x},${target.y}`;
  if (blocked.has(targetKey)) return null;

  // BFS queue: [x, y]
  const queue: Array<[number, number]> = [[start.x, start.y]];
  const visited = new Set<string>();
  visited.add(`${start.x},${start.y}`);

  // parent map: key -> [parentX, parentY]
  const parent = new Map<string, [number, number]>();

  while (queue.length > 0) {
    const [cx, cy] = queue.shift()!;
    const cKey = `${cx},${cy}`;

    for (const dir of ALL_DIRS) {
      if (cx === start.x && cy === start.y && currentDirection !== undefined) {
        if (dir === OPPOSITE[currentDirection]) continue;
      }

      const [dx, dy] = DIR_DELTA[dir];
      const nx = cx + dx;
      const ny = cy + dy;

      if (nx < 0 || nx >= cols || ny < 0 || ny >= rows) continue;

      const nKey = `${nx},${ny}`;
      if (visited.has(nKey)) continue;
      if (blocked.has(nKey)) continue;

      visited.add(nKey);
      parent.set(nKey, [cx, cy]);

      if (nx === target.x && ny === target.y) {
        return reconstructPath(parent, cKey, dir);
      }

      queue.push([nx, ny] as [number, number]);
    }
  }

  return null;
}

function reconstructPath(
  parent: Map<string, [number, number]>,
  fromKey: string,
  lastDir: Direction
): Direction[] {

  const steps: Direction[] = [];

  const [sx, sy] = fromKey.split(',').map(Number);
  let current: [number, number] | undefined = [sx, sy];
  while (current !== undefined) {
    const key = `${current[0]},${current[1]}`;
    const prev = parent.get(key);
    if (prev === undefined) break;
    const dx = current[0] - prev[0];
    const dy = current[1] - prev[1];
    let dir: Direction;
    if (dx === 1) dir = 'Right';
    else if (dx === -1) dir = 'Left';
    else if (dy === 1) dir = 'Down';
    else dir = 'Up';
    steps.push(dir);
    current = prev;
  }

  steps.reverse();
  steps.push(lastDir);
  return steps;
}
