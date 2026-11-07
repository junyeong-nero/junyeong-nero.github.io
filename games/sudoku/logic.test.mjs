import test from 'node:test';
import assert from 'node:assert/strict';
import { GIVENS, N, PEERS, SIZE, countSolutions, generate, solve } from './logic.js';

function assertValidSolution(g) {
  assert.equal(g.length, SIZE);
  for (let i = 0; i < SIZE; i++) {
    assert.ok(g[i] >= 1 && g[i] <= N);
    for (const j of PEERS[i]) assert.notEqual(g[i], g[j], `cell ${i} conflicts with ${j}`);
  }
}

test('peers: 20 per cell', () => {
  assert.ok(PEERS.every((p) => p.length === 20));
});

test('same seed and level gives same puzzle', () => {
  assert.deepEqual(generate(99, 'hard'), generate(99, 'hard'));
  assert.notDeepEqual(generate(1).puzzle, generate(2).puzzle);
});

test('puzzles are valid, consistent with the solution, and uniquely solvable', () => {
  const stats = {};
  for (const level of Object.keys(GIVENS)) {
    const counts = [];
    const t0 = performance.now();
    for (let seed = 0; seed < 20; seed++) {
      const { puzzle, solution } = generate(seed * 7919 + 1, level);
      assertValidSolution(solution);
      puzzle.forEach((v, i) => { if (v) assert.equal(v, solution[i]); });
      assert.equal(countSolutions(puzzle), 1, `${level} seed ${seed}`);
      assert.deepEqual(solve(puzzle), solution);
      counts.push(puzzle.filter(Boolean).length);
    }
    stats[level] = { minGivens: Math.min(...counts), maxGivens: Math.max(...counts), msPerPuzzle: ((performance.now() - t0) / 20).toFixed(1) };
  }
  console.log(stats);
  // 목표 개수(+1, 대칭 쌍으로 지우니 홀짝이 어긋날 수 있음) 안쪽, 하 > 중 > 상 순으로 많다
  for (const level of Object.keys(GIVENS)) {
    assert.ok(stats[level].minGivens >= GIVENS[level], level);
  }
  assert.ok(stats.easy.maxGivens <= GIVENS.easy + 1 && stats.normal.maxGivens <= GIVENS.normal + 1);
  assert.ok(stats.easy.minGivens > stats.normal.maxGivens && stats.normal.minGivens > stats.hard.maxGivens);
});

test('countSolutions detects multiple solutions and contradictions', () => {
  assert.equal(countSolutions(new Array(SIZE).fill(0)), 2);
  const bad = new Array(SIZE).fill(0);
  bad[0] = 5;
  bad[1] = 5;
  assert.equal(countSolutions(bad), 0);
});
