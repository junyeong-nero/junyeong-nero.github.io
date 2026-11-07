// 스도쿠 생성/풀이 (DOM 없음, node 테스트 가능)
import { mulberry32, shuffle } from '../shared/rng.js';

export const N = 9;
export const SIZE = N * N;
export const MAX_MISTAKES = 3;

// 난이도 = 처음에 주어지는 숫자 개수. 정답이 하나뿐인 범위에서 이 개수까지 지운다.
export const GIVENS = { easy: 38, normal: 31, hard: 26 };

const rowOf = (i) => Math.floor(i / N);
const colOf = (i) => i % N;
const boxOf = (i) => Math.floor(rowOf(i) / 3) * 3 + Math.floor(colOf(i) / 3);
const ALL = 0x3fe; // 숫자 d → 비트 1<<d (d = 1..9)
const bitCount = (m) => { let c = 0; while (m) { m &= m - 1; c++; } return c; };

// 같은 행/열/박스에 있는 칸 (자기 자신 제외)
export const PEERS = Array.from({ length: SIZE }, (_, i) => {
  const out = [];
  for (let j = 0; j < SIZE; j++) {
    if (j !== i && (rowOf(j) === rowOf(i) || colOf(j) === colOf(i) || boxOf(j) === boxOf(i))) out.push(j);
  }
  return out;
});

// 백트래킹 탐색: 후보가 가장 적은 칸부터 채운다. onSolution이 true를 돌려주면 멈춘다.
// order(mask) → 시도할 숫자 순서 (생성할 때는 무작위)
function search(grid, onSolution, order = (digits) => digits) {
  const g = grid.slice();
  const rows = new Array(N).fill(0);
  const cols = new Array(N).fill(0);
  const boxes = new Array(N).fill(0);
  for (let i = 0; i < SIZE; i++) {
    const d = g[i];
    if (!d) continue;
    const bit = 1 << d;
    if ((rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]) & bit) return; // 이미 모순
    rows[rowOf(i)] |= bit;
    cols[colOf(i)] |= bit;
    boxes[boxOf(i)] |= bit;
  }
  let stop = false;
  const step = () => {
    let best = -1;
    let bestMask = 0;
    let bestCount = 10;
    for (let i = 0; i < SIZE; i++) {
      if (g[i]) continue;
      const mask = ALL & ~(rows[rowOf(i)] | cols[colOf(i)] | boxes[boxOf(i)]);
      const c = bitCount(mask);
      if (c < bestCount) {
        best = i;
        bestMask = mask;
        bestCount = c;
        if (c <= 1) break;
      }
    }
    if (best === -1) {
      stop = onSolution(g) === true;
      return;
    }
    if (bestCount === 0) return;
    const digits = [];
    for (let d = 1; d <= N; d++) if (bestMask & (1 << d)) digits.push(d);
    const r = rowOf(best);
    const c = colOf(best);
    const b = boxOf(best);
    for (const d of order(digits)) {
      const bit = 1 << d;
      g[best] = d;
      rows[r] |= bit;
      cols[c] |= bit;
      boxes[b] |= bit;
      step();
      rows[r] &= ~bit;
      cols[c] &= ~bit;
      boxes[b] &= ~bit;
      g[best] = 0;
      if (stop) return;
    }
  };
  step();
}

// 해의 개수 (limit개에서 멈춤)
export function countSolutions(grid, limit = 2) {
  let n = 0;
  search(grid, () => ++n >= limit);
  return n;
}

export function solve(grid) {
  let found = null;
  search(grid, (g) => { found = g.slice(); return true; });
  return found;
}

// 시드가 같으면 같은 퍼즐 (두 플레이어가 같은 판을 받는다)
// → { puzzle: 0은 빈칸, solution }
export function generate(seed, level = 'normal') {
  const rand = mulberry32(seed);
  const target = GIVENS[level] ?? GIVENS.normal;
  // 한 번에 목표까지 못 지우는 판도 있어서(특히 상) 몇 번 만들어 가장 가까운 판을 고른다
  let best = null;
  for (let attempt = 0; attempt < 30; attempt++) {
    const board = carve(rand, target);
    if (!best || board.givens < best.givens) best = board;
    if (best.givens <= target + 1) break;
  }
  return { puzzle: best.puzzle, solution: best.solution };
}

function carve(rand, target) {
  let solution = null;
  search(new Array(SIZE).fill(0), (g) => { solution = g.slice(); return true; }, (digits) => shuffle(rand, digits));

  // 가운데 대칭 쌍으로 지우되, 정답이 하나로 유지될 때만 지운다
  const puzzle = solution.slice();
  let givens = SIZE;
  const order = shuffle(rand, Array.from({ length: 41 }, (_, i) => i)); // 0..40 (40 = 정중앙)
  for (const i of order) {
    if (givens <= target) break;
    const j = SIZE - 1 - i;
    const pair = i === j ? [i] : [i, j];
    if (givens - pair.length < target) continue;
    pair.forEach((k) => { puzzle[k] = 0; });
    if (countSolutions(puzzle) === 1) givens -= pair.length;
    else pair.forEach((k) => { puzzle[k] = solution[k]; });
  }
  return { puzzle, solution, givens };
}
