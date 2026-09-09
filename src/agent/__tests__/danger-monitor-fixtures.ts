// @ts-expect-error - node built-in, types not in tsconfig but available via @types/node
import assert from 'node:assert/strict';
import { assessDanger } from '../danger-monitor.js';

// Fixture A — SAFE OPEN SPACE (5x5)
{
  const snake = [
    { x: 2, y: 2 },
    { x: 1, y: 2 },
    { x: 0, y: 2 }
  ];
  const result = assessDanger(2, 2, 'Right', snake, null, 5, 5);

  assert.strictEqual(result.legalMoveCount, 3);
  assert.strictEqual(result.survivableMoveCount, 3);
  assert.strictEqual(result.reachableCells, 23);
  assert.strictEqual(result.dangerLevel, 'SAFE');

  console.log('Fixture A: PASS');
}

// Fixture B — TAIL POP CREATES SURVIVAL (4x4)
{
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 2 }
  ];
  const result = assessDanger(0, 0, 'Left', snake, null, 4, 4);

  assert.strictEqual(result.legalMoveCount, 1);
  assert.strictEqual(result.survivableMoveCount, 1);
  assert.strictEqual(result.reachableCells, 2);
  assert.strictEqual(result.dangerLevel, 'LOW_MOBILITY');

  console.log('Fixture B: PASS');
}

// Fixture C — FOOD GROWTH TURNS SAME PATH INTO TRAP (4x4)
{
  const snake = [
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 2 }
  ];
  const result = assessDanger(0, 0, 'Left', snake, { x: 0, y: 1 }, 4, 4);

  assert.strictEqual(result.legalMoveCount, 1);
  assert.strictEqual(result.survivableMoveCount, 0);
  assert.strictEqual(result.reachableCells, 2);
  assert.strictEqual(result.dangerLevel, 'DEAD_END_IMMINENT');

  console.log('Fixture C: PASS');
}

// Fixture D — CURRENT TAIL IS STILL OCCUPIED (3x3)
{
  const snake = [
    { x: 1, y: 1 },
    { x: 1, y: 2 },
    { x: 0, y: 2 },
    { x: 0, y: 1 }
  ];
  const result = assessDanger(1, 1, 'Up', snake, null, 3, 3);

  assert.strictEqual(result.legalMoveCount, 2);
  assert.strictEqual(result.survivableMoveCount, 2);
  assert.strictEqual(result.reachableCells, 6);
  assert.strictEqual(result.dangerLevel, 'SAFE');

  console.log('Fixture D: PASS');
}

// Fixture E — ZERO LEGAL MOVES (3x3)
{
  const snake = [
    { x: 1, y: 1 },
    { x: 0, y: 1 },
    { x: 0, y: 0 },
    { x: 1, y: 0 },
    { x: 2, y: 0 },
    { x: 2, y: 1 },
    { x: 2, y: 2 },
    { x: 1, y: 2 },
    { x: 0, y: 2 }
  ];
  const result = assessDanger(1, 1, 'Right', snake, null, 3, 3);

  assert.strictEqual(result.legalMoveCount, 0);
  assert.strictEqual(result.survivableMoveCount, 0);
  assert.strictEqual(result.reachableCells, 1);
  assert.strictEqual(result.dangerLevel, 'DEAD_END_IMMINENT');

  console.log('Fixture E: PASS');
}

// Fixture F — FLOOD FILL START CELL (4x4) + IMMUTABILITY CHECK
{
  const snake = [
    { x: 1, y: 1 },
    { x: 0, y: 1 }
  ];

  const originalSnake = JSON.parse(JSON.stringify(snake));

  const result = assessDanger(1, 1, 'Right', snake, null, 4, 4);

  assert.deepStrictEqual(snake, originalSnake, 'snake array should not be mutated');

  for (let i = 0; i < snake.length; i++) {
    assert.strictEqual(snake[i].x, originalSnake[i].x);
    assert.strictEqual(snake[i].y, originalSnake[i].y);
  }

  assert.strictEqual(result.legalMoveCount, 3);
  assert.strictEqual(result.survivableMoveCount, 3);
  assert.strictEqual(result.reachableCells, 15);
  assert.strictEqual(result.dangerLevel, 'SAFE');

  console.log('Fixture F: PASS');
}

console.log('\nDanger Watchdog fixtures: 6/6 PASS');
