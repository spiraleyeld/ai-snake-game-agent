// @ts-expect-error - node built-in, types not in tsconfig but available via @types/node
import assert from 'node:assert/strict';

import { stagnationBudget } from '../stagnation-budget.js';

let pass = 0;
let fail = 0;

function test(name: string, fn: () => void) {
  try {
    fn();
    pass++;
    console.log(`  PASS ${name}`);
  } catch (e) {
    fail++;
    console.error(`  FAIL ${name}: ${(e as Error).message}`);
  }
}

// A: SAFE, survivable=3, reachable=500, foodPathSafe=true → NORMAL, 80
test('A: SAFE + foodPathSafe=true', () => {
  const result = stagnationBudget(
    'SAFE', 3, 500, true, 'SAFE'
  );
  assert.strictEqual(result.category, 'NORMAL');
  assert.strictEqual(result.threshold, 80);
});

// B: SAFE, survivable=2, reachable=625, foodPathSafe=false, reason=NO_TAIL_ESCAPE → REORGANIZING, 156
test('B: SAFE + NO_TAIL_ESCAPE', () => {
  const result = stagnationBudget(
    'SAFE', 2, 625, false, 'NO_TAIL_ESCAPE'
  );
  assert.strictEqual(result.category, 'REORGANIZING');
  assert.strictEqual(result.threshold, 156);
});

// C: SAFE, survivable=2, reachable=545, foodPathSafe=false, reason=NO_FOOD_PATH → REORGANIZING, 136
test('C: SAFE + NO_FOOD_PATH', () => {
  const result = stagnationBudget(
    'SAFE', 2, 545, false, 'NO_FOOD_PATH'
  );
  assert.strictEqual(result.category, 'REORGANIZING');
  assert.strictEqual(result.threshold, 136);
});

// D: LOW_MOBILITY, survivable=1, reachable=600, foodPathSafe=false, reason=NO_TAIL_ESCAPE → PRESSURED, 40
test('D: LOW_MOBILITY', () => {
  const result = stagnationBudget(
    'LOW_MOBILITY', 1, 600, false, 'NO_TAIL_ESCAPE'
  );
  assert.strictEqual(result.category, 'PRESSURED');
  assert.strictEqual(result.threshold, 40);
});

// E: SAFE + NO_TAIL_ESCAPE with reachable=600 → REORGANIZING, 150; reachable=100 → NORMAL, 80
test('E.1: SAFE + NO_TAIL_ESCAPE reachable=600', () => {
  const result = stagnationBudget(
    'SAFE', 2, 600, false, 'NO_TAIL_ESCAPE'
  );
  assert.strictEqual(result.category, 'REORGANIZING');
  assert.strictEqual(result.threshold, 150);
});

test('E.2: SAFE + NO_TAIL_ESCAPE reachable=100', () => {
  const result = stagnationBudget(
    'SAFE', 2, 100, false, 'NO_TAIL_ESCAPE'
  );
  assert.strictEqual(result.category, 'REORGANIZING');
  assert.strictEqual(result.threshold, 80);
});

// F: DEAD_END_IMMINENT, survivable=0 → EMERGENCY, 0
test('F: DEAD_END_IMMINENT', () => {
  const result = stagnationBudget(
    'DEAD_END_IMMINENT', 0, 600, false, 'NO_TAIL_ESCAPE'
  );
  assert.strictEqual(result.category, 'EMERGENCY');
  assert.strictEqual(result.threshold, 0);
});

// G: SAFE + NO_TAIL_ESCAPE with reachable=600 but reason=SIMULATION_INVALID → NORMAL, 80 (Rule 5)
test('G: SAFE + SIMULATION_INVALID', () => {
  const result = stagnationBudget(
    'SAFE', 2, 600, false, 'SIMULATION_INVALID'
  );
  assert.strictEqual(result.category, 'NORMAL');
  assert.strictEqual(result.threshold, 80);
});

// Mutation check: input object must not be mutated
test('Mutation: input not mutated', () => {
  const dangerLevel = 'SAFE';
  const survivableMoveCount = 2;
  const reachableCells = 500;
  const foodPathSafe = false;
  const foodPathReason = 'NO_TAIL_ESCAPE' as const;

  const result = stagnationBudget(
    dangerLevel, survivableMoveCount, reachableCells, foodPathSafe, foodPathReason
  );

  assert.strictEqual(result.category, 'REORGANIZING');
  assert.strictEqual(dangerLevel, 'SAFE');
  assert.strictEqual(survivableMoveCount, 2);
  assert.strictEqual(reachableCells, 500);
  assert.strictEqual(foodPathSafe, false);
  assert.strictEqual(foodPathReason, 'NO_TAIL_ESCAPE');
});

console.log(`\nDynamic Stagnation fixtures: ${pass}/${pass + fail} PASS`);
