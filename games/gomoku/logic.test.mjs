import test from 'node:test';
import assert from 'node:assert/strict';
import { mulberry32 } from '../shared/rng.js';
import { BLACK, EMPTY, N, SIZE, WHITE, canPlace, chooseMove, isForbidden, winLine } from './logic.js';

const at = (r, c) => r * N + c;
function board(stones) {
  const b = new Int8Array(SIZE);
  for (const [r, c, color = BLACK] of stones) b[at(r, c)] = color;
  return b;
}

test('five or more in a row wins, four does not', () => {
  const b = board([[7, 3], [7, 4], [7, 5], [7, 6]]);
  b[at(7, 7)] = BLACK;
  assert.deepEqual(winLine(b, at(7, 7)), [at(7, 3), at(7, 4), at(7, 5), at(7, 6), at(7, 7)]);

  const diag = board([[3, 3], [4, 4], [5, 5], [6, 6], [7, 7]]);
  assert.equal(winLine(diag, at(5, 5)).length, 5);

  const six = board([[2, 9], [3, 9], [4, 9], [6, 9], [7, 9]]);
  six[at(5, 9)] = BLACK;
  assert.equal(winLine(six, at(5, 9)).length, 6); // 6목도 승리

  const four = board([[7, 3], [7, 4], [7, 5], [7, 6]]);
  assert.equal(winLine(four, at(7, 6)), null);
  const anti = board([[3, 11], [4, 10], [5, 9], [6, 8], [7, 7]]);
  assert.ok(winLine(anti, at(7, 7)));
});

test('double open three is forbidden for both colors', () => {
  // 가로 (7,5)(7,6) + 세로 (5,7)(6,7) → (7,7)은 삼삼
  const b = board([[7, 5], [7, 6], [5, 7], [6, 7]]);
  assert.equal(isForbidden(b, at(7, 7), BLACK), true);
  const w = board([[7, 5, WHITE], [7, 6, WHITE], [5, 7, WHITE], [6, 7, WHITE]]);
  assert.equal(isForbidden(w, at(7, 7), WHITE), true);
  // 다른 색에게는 상관없음
  assert.equal(isForbidden(b, at(7, 7), WHITE), false);
});

test('split three counts as an open three', () => {
  // 가로 X X _ [p]  + 세로 두 개
  const b = board([[7, 4], [7, 5], [5, 7], [6, 7]]);
  assert.equal(isForbidden(b, at(7, 7), BLACK), true);
});

test('blocked three does not count', () => {
  // 가로가 양쪽 백돌에 막힘: O X X [p] O → 열린 4를 만들 수 없음
  const b = board([[7, 4, WHITE], [7, 5], [7, 6], [7, 8, WHITE], [5, 7], [6, 7]]);
  assert.equal(isForbidden(b, at(7, 7), BLACK), false);
  // 판 끝에 붙은 3도 열린 3이 아님
  const edge = board([[0, 1], [0, 2], [2, 0], [1, 0]]);
  assert.equal(isForbidden(edge, at(0, 0), BLACK), false);
});

test('four-three is allowed, and a move that makes five is always allowed', () => {
  const fourThree = board([[7, 4], [7, 5], [7, 6], [5, 7], [6, 7]]);
  assert.equal(isForbidden(fourThree, at(7, 7), BLACK), false);
  const five = board([[7, 3], [7, 4], [7, 5], [7, 6], [5, 8], [6, 8], [8, 6], [9, 5]]);
  assert.equal(isForbidden(five, at(7, 7), BLACK), false);
  assert.equal(canPlace(five, at(7, 7), BLACK), true);
  assert.equal(canPlace(five, at(7, 3), BLACK), false); // 이미 돌이 있음
});

test('AI takes a winning move and blocks a four', () => {
  for (const level of ['easy', 'normal', 'hard']) {
    const win = board([[7, 4], [7, 5], [7, 6], [7, 7], [8, 4, WHITE], [8, 5, WHITE], [8, 6, WHITE]]);
    const m = chooseMove(win, BLACK, level, mulberry32(1));
    assert.ok([at(7, 3), at(7, 8)].includes(m), `${level} should win`);
  }
  for (const level of ['normal', 'hard']) {
    // 흑 4개(왼쪽은 막힘) → 백 AI는 오른쪽 끝을 막아야 한다
    const b = board([[7, 3, WHITE], [7, 4], [7, 5], [7, 6], [7, 7], [9, 9, WHITE]]);
    assert.equal(chooseMove(b, WHITE, level, mulberry32(2)), at(7, 8), `${level} should block`);
  }
  // 열린 3은 hard가 막는다
  const open3 = board([[7, 5], [7, 6], [7, 7], [6, 6, WHITE]]);
  const m = chooseMove(open3, WHITE, 'hard', mulberry32(3));
  assert.ok([at(7, 4), at(7, 8), at(7, 3), at(7, 9)].includes(m));
});

function playOut(blackLevel, whiteLevel, seed) {
  const rand = mulberry32(seed);
  const b = new Int8Array(SIZE);
  let color = BLACK;
  for (let n = 0; n < SIZE; n++) {
    const level = color === BLACK ? blackLevel : whiteLevel;
    const m = chooseMove(b, color, level, rand);
    if (m < 0) return 0;
    assert.ok(canPlace(b, m, color), `illegal move by ${level}`);
    b[m] = color;
    if (winLine(b, m)) return color;
    color = 3 - color;
  }
  return 0;
}

test('AI only plays legal moves and stronger levels win more', () => {
  let hardWins = 0;
  let normalWins = 0;
  const games = 8;
  for (let g = 0; g < games; g++) {
    const hardIsBlack = g % 2 === 0;
    const w1 = playOut(hardIsBlack ? 'hard' : 'easy', hardIsBlack ? 'easy' : 'hard', 100 + g);
    if (w1 === (hardIsBlack ? BLACK : WHITE)) hardWins++;
    const w2 = playOut(hardIsBlack ? 'normal' : 'easy', hardIsBlack ? 'easy' : 'normal', 200 + g);
    if (w2 === (hardIsBlack ? BLACK : WHITE)) normalWins++;
  }
  console.log({ hardVsEasy: `${hardWins}/${games}`, normalVsEasy: `${normalWins}/${games}` });
  assert.ok(hardWins >= 6, `hard beat easy only ${hardWins}/${games}`);
  assert.ok(normalWins >= 5, `normal beat easy only ${normalWins}/${games}`);
});

test('empty board: first move goes to the center', () => {
  assert.equal(chooseMove(new Int8Array(SIZE), BLACK, 'hard', mulberry32(1)), at(7, 7));
  assert.equal(EMPTY, 0);
});
