// Fixed 32x12 Hamiltonian cycle
// COLS=32, ROWS=12, CYCLE_LENGTH=384
// Pattern: start (0,0), serpentine rows over x=1..31, return upward through x=0

export const COLS = 32;
export const ROWS = 12;
export const CYCLE_LENGTH = 384;

/**
 * Get the cycle index for a given (x, y) coordinate.
 * Returns -1 if the coordinate is outside the grid or not part of the cycle.
 */
export function getCellCycleIndex(x: number, y: number): number {
  // Bounds check
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return -1;

  // Starting cell
  if (x === 0 && y === 0) return 0;

  // Upward column 0: (0, 11) -> (0, 1)
  if (x === 0 && y >= 1 && y <= 11) {
    return CYCLE_LENGTH - y;
  }

  // Serpentine rows over x=1..31
  if (x >= 1 && x <= 31 && y >= 0 && y <= 11) {
    const rowStart = 1 + y * 31;

    if (y % 2 === 1) {
      // Odd rows: leftward from x=31 to x=1
      return rowStart + (30 - (x - 1));
    } else {
      // Even rows: rightward from x=1 to x=31
      return rowStart + (x - 1);
    }
  }

  return -1;
}

/**
 * Get the next cell in the cycle from a given index.
 */
export function getNextCellFromCycle(index: number): { x: number; y: number } {
  const nextIndex = (index + 1) % CYCLE_LENGTH;
  return getCellFromCycleIndex(nextIndex);
}

/**
 * Get the direction to move from current cell to reach the next cell in the cycle.
 */
export function getNextDirection(x: number, y: number): 'Up' | 'Down' | 'Left' | 'Right' {
  const currIdx = getCellCycleIndex(x, y);

  if (currIdx < 0) {
    throw new Error(`Cell (${x}, ${y}) is not part of the Hamiltonian cycle`);
  }

  const next = getNextCellFromCycle(currIdx);
  const dx = next.x - x;
  const dy = next.y - y;

  if (dx === 1) return 'Right';
  if (dx === -1) return 'Left';
  if (dy === 1) return 'Down';
  if (dy === -1) return 'Up';

  throw new Error(`Invalid cycle transition from (${x}, ${y}) to (${next.x}, ${next.y})`);
}

/**
 * Internal: convert a cycle index back to (x, y) coordinates.
 */
function getCellFromCycleIndex(index: number): { x: number; y: number } {
  // Starting cell
  if (index === 0) return { x: 0, y: 0 };

  // Upward column 0: indices CYCLE_LENGTH-12 .. CYCLE_LENGTH-6 => (0,11)..(0,1)
  if (index >= CYCLE_LENGTH - ROWS + 1 && index < CYCLE_LENGTH) {
    const y = CYCLE_LENGTH - index;
    return { x: 0, y };
  }

  // Serpentine rows
  const adjustedIndex = index - 1;
  const row = Math.floor(adjustedIndex / 31);
  const offsetInRow = adjustedIndex % 31;

  if (row < 0 || row >= ROWS) {
    throw new Error(`Cycle index ${index} is out of range`);
  }

  const yPos = row;

  if (yPos % 2 === 1) {
    // Odd rows: leftward, offset 0 => x=31, offset 60 => x=1
    const x = 31 - offsetInRow;
    return { x, y: yPos };
  } else {
    // Even rows: rightward, offset 0 => x=1, offset 59 => x=31
    const x = 1 + offsetInRow;
    return { x, y: yPos };
  }
}
