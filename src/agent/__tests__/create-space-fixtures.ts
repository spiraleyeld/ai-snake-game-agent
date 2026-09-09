// @ts-expect-error - node built-in, types not in tsconfig but available via @types/node
import assert from 'node:assert/strict';
import { nextMove } from '../strategy-executor.js';

function countOpenSpaceUncapped(
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

  while (queue.length > 0) {
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

// Fixture A — SPACE beats FOOD (5x4)
// Head at (3,0), body at (3,1),(4,1). Food at (4,0). Direction=Up.
// Left -> (2,0); Right -> (4,0) [food]. SpaceLeft > SpaceRight.
{
  const snake = [
    { x: 3, y: 0 },
    { x: 3, y: 1 },
    { x: 4, y: 1 }
  ];

  // Explicit premise assertions using test-local uncapped body-aware reachable-space counter
  const spaceLeft = countOpenSpaceUncapped(2, 0, snake, 5, 4);
  const spaceRight = countOpenSpaceUncapped(4, 0, snake, 5, 4);
  console.log(`Fixture A: spaceLeft=${spaceLeft}, spaceRight=${spaceRight}`);
  assert.ok(spaceLeft > spaceRight, 'space(spacePreferredMove) > space(foodPreferredMove)');

  const foodProgressLeft = 1 - Math.abs(3 - 4) - Math.abs(0 - 0); // currentDist=1, newDist=2 => progress=-1
  const foodProgressRight = 1 - Math.abs(4 - 4) - Math.abs(0 - 0); // currentDist=1, newDist=0 => progress=1
  assert.ok(foodProgressRight > foodProgressLeft, 'foodPreferredMove is actually closer to food');

  const result = nextMove(
    3, 0,           // headX, headY
    snake,            // snakeBody
    4, 0,             // foodX, foodY
    'Up',             // currentDirection
    { policy: 'CREATE_SPACE' as const, params: {} as any, startedAtStep: 0 },
    5, 4              // cols=5, rows=4
  );

  assert.strictEqual(result, 'Left', 'CREATE_SPACE must choose the larger-space move (Left) over food-closer move (Right)');
  console.log('Fixture A: PASS — SPACE beats FOOD');
}

// Fixture B — FOOD breaks a SPACE tie (5x4)
// Head at (2,1), body trails left. Food at (3,2).
// Right and Up have equal reachable space; Right is closer to food.
{
  const snake = [
    { x: 2, y: 1 },
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ];

  // Explicit premise assertions using test-local uncapped body-aware reachable-space counter
  const spaceUp = countOpenSpaceUncapped(2, 0, snake, 5, 4);
  const spaceRight = countOpenSpaceUncapped(3, 1, snake, 5, 4);
  console.log(`Fixture B: spaceUp=${spaceUp}, spaceRight=${spaceRight}`);
  assert.strictEqual(spaceUp, spaceRight, 'space(moveA) === space(moveB)');

  const foodProgressUp = 2 - Math.abs(2 - 3) - Math.abs(0 - 2); // currentDist=2, newDist=3 => progress=-1
  const foodProgressRight = 2 - Math.abs(3 - 3) - Math.abs(1 - 2); // currentDist=2, newDist=1 => progress=1
  assert.ok(foodProgressRight > foodProgressUp, 'one move has better food progress');

  const result = nextMove(
    2, 1,             // headX, headY
    snake,              // snakeBody
    3, 2,               // foodX, foodY
    'Right',            // currentDirection
    { policy: 'CREATE_SPACE' as const, params: {} as any, startedAtStep: 0 },
    5, 4                // cols=5, rows=4
  );

  assert.strictEqual(result, 'Right', 'CREATE_SPACE must choose the better-food move when space is tied');
  console.log('Fixture B: PASS — FOOD breaks SPACE tie');
}

// Fixture C — SAFE_CHASE regression (7x5)
// Head at (5,2), body trails left along row 2. Food at (6,2).
// Right gets closer to food but Up has better open space connectivity; weighted scoring favors Up.
{
  const snake = [
    { x: 5, y: 2 },
    { x: 4, y: 2 },
    { x: 3, y: 2 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
    { x: 0, y: 2 }
  ];

  const result = nextMove(
    5, 2,               // headX, headY
    snake,                // snakeBody
    6, 2,                 // foodX, foodY
    'Right',              // currentDirection
    { policy: 'SAFE_CHASE' as const, params: { foodWeight: 3, openSpaceWeight: 1, wallPenalty: 1, bodyPenalty: 0.1, recentVisitPenalty: 0 }, startedAtStep: 0 },
    7, 5                  // cols, rows
  );

  assert.strictEqual(result, 'Up', 'SAFE_CHASE must choose Up (better open space connectivity)');
  console.log('Fixture C: PASS — SAFE_CHASE regression');
}

console.log('\nCREATE_SPACE fixtures: 3/3 PASS');
