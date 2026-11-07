import test from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, SIZE, TARGET, generateBoard } from './board.js';

test('same seed gives same board', () => {
  assert.deepEqual(generateBoard(42).values, generateBoard(42).values);
  assert.notDeepEqual(generateBoard(1).values, generateBoard(2).values);
});

test('every board is fully clearable by its solution order', () => {
  for (let seed = 0; seed < 300; seed++) {
    const { values, solution } = generateBoard(seed);
    assert.equal(values.length, SIZE);
    assert.ok(values.every((v) => v >= 1 && v <= 9));
    const removed = new Array(SIZE).fill(false);
    for (const group of solution) {
      const rows = group.map((i) => Math.floor(i / COLS));
      const cols = group.map((i) => i % COLS);
      let sum = 0;
      for (let r = Math.min(...rows); r <= Math.max(...rows); r++)
        for (let c = Math.min(...cols); c <= Math.max(...cols); c++) {
          const i = r * COLS + c;
          if (!removed[i]) sum += values[i];
        }
      assert.equal(sum, TARGET, `seed ${seed}`);
      group.forEach((i) => { removed[i] = true; });
    }
    assert.ok(removed.every(Boolean));
  }
});

test('digit distribution covers 1..9', () => {
  const counts = new Array(10).fill(0);
  for (let seed = 0; seed < 50; seed++) generateBoard(seed).values.forEach((v) => counts[v]++);
  for (let d = 1; d <= 9; d++) assert.ok(counts[d] > 0);
  console.log('distribution', counts.slice(1).map((c) => (c / (50 * ROWS * COLS)).toFixed(3)).join(' '));
});
