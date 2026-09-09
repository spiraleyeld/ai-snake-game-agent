import type { Direction, Position } from '../game/types.js';

function isOpposite(a: Direction, b: Direction): boolean {
  return (a === 'Up' && b === 'Down') || (a === 'Down' && b === 'Up') || (a === 'Left' && b === 'Right') || (a === 'Right' && b === 'Left');
}

export interface PathSimulationResult {
  snake: Position[];
  valid: boolean;
  ateFood: boolean;
}

export function simulatePath(
  snake: Position[],
  food: Position | null,
  path: Direction[],
  cols: number,
  rows: number,
  initialDirection: Direction,
): PathSimulationResult {
  const currentSnake = [...snake];
  let currentFood = food ? { ...food } : null;
  let ateFood = false;
  let currentDirection: Direction = initialDirection;

  for (const requestedDir of path) {
    const head = currentSnake[0];
    let executedDirection: Direction;

    if (isOpposite(currentDirection, requestedDir)) {
      executedDirection = currentDirection;
    } else {
      executedDirection = requestedDir;
    }

    let newHead: Position;

    switch (executedDirection) {
      case 'Up':
        newHead = { x: head.x, y: head.y - 1 };
        break;
      case 'Down':
        newHead = { x: head.x, y: head.y + 1 };
        break;
      case 'Left':
        newHead = { x: head.x - 1, y: head.y };
        break;
      case 'Right':
        newHead = { x: head.x + 1, y: head.y };
        break;
    }

    if (newHead.x < 0 || newHead.x >= cols || newHead.y < 0 || newHead.y >= rows) {
      return { snake: currentSnake, valid: false, ateFood };
    }

    for (const segment of currentSnake) {
      if (segment.x === newHead.x && segment.y === newHead.y) {
        return { snake: currentSnake, valid: false, ateFood };
      }
    }

    currentSnake.unshift(newHead);

    if (currentFood && newHead.x === currentFood.x && newHead.y === currentFood.y) {
      ateFood = true;
      currentFood = null;
    } else {
      currentSnake.pop();
    }

    currentDirection = executedDirection;
  }

  return { snake: currentSnake, valid: true, ateFood };
}
