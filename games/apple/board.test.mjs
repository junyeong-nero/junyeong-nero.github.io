import test from 'node:test';
import assert from 'node:assert/strict';
import { COLS, ROWS, SIZE, TARGET, LEVELS, generateBoard } from './board.js';

const levels = Object.keys(LEVELS);

test('same seed and level gives same board', () => {
  for (const level of levels) {
    assert.deepEqual(generateBoard(42, level).values, generateBoard(42, level).values);
    assert.notDeepEqual(generateBoard(1, level).values, generateBoard(2, level).values);
  }
  assert.deepEqual(generateBoard(7).values, generateBoard(7, 'normal').values);
});

test('every board is fully clearable by its solution order', () => {
  for (const level of levels) {
    for (let seed = 0; seed < 150; seed++) {
      const { values, solution } = generateBoard(seed, level);
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
        assert.equal(sum, TARGET, `${level} seed ${seed}`);
        group.forEach((i) => { removed[i] = true; });
      }
      assert.ok(removed.every(Boolean));
    }
  }
});

// 시작 판에서 바로 지울 수 있는 "붙어 있는 2개 짝" 수: 쉬울수록 많아야 한다
function adjacentPairs(values) {
  let n = 0;
  for (let i = 0; i < SIZE; i++) {
    if (i % COLS < COLS - 1 && values[i] + values[i + 1] === TARGET) n++;
    if (i + COLS < SIZE && values[i] + values[i + COLS] === TARGET) n++;
  }
  return n;
}

test('easy < normal < hard in group size, easy > normal > hard in adjacent pairs', () => {
  const stats = {};
  for (const level of levels) {
    let groups = 0;
    let pairs = 0;
    for (let seed = 0; seed < 50; seed++) {
      const board = generateBoard(seed, level);
      groups += board.solution.length;
      pairs += adjacentPairs(board.values);
    }
    stats[level] = { avgGroup: (50 * SIZE) / groups, adjacentPairs: pairs / 50 };
  }
  console.log(stats);
  assert.ok(stats.easy.avgGroup < stats.normal.avgGroup && stats.normal.avgGroup < stats.hard.avgGroup);
  assert.ok(stats.easy.adjacentPairs > stats.normal.adjacentPairs && stats.normal.adjacentPairs > stats.hard.adjacentPairs);
});

test('digit distribution covers 1..9', () => {
  for (const level of levels) {
    const counts = new Array(10).fill(0);
    for (let seed = 0; seed < 50; seed++) generateBoard(seed, level).values.forEach((v) => counts[v]++);
    for (let d = 1; d <= 9; d++) assert.ok(counts[d] > 0, `${level} digit ${d}`);
    console.log(level, counts.slice(1).map((c) => (c / (50 * ROWS * COLS)).toFixed(3)).join(' '));
  }
});
