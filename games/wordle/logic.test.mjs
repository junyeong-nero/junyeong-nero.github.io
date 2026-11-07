import test from 'node:test';
import assert from 'node:assert/strict';
import { ANSWERS, GUESSES } from './words.js';
import { answerFor, compareRuns, isValidWord, mergeKeyState, scoreGuess } from './logic.js';

const C = 'correct';
const P = 'present';
const A = 'absent';

test('word lists are 5 lowercase letters, answers are valid guesses', () => {
  assert.ok(ANSWERS.length > 1500);
  for (const w of [...ANSWERS, ...GUESSES]) assert.match(w, /^[a-z]{5}$/);
  assert.ok(ANSWERS.every(isValidWord));
  assert.ok(isValidWord('crane') && isValidWord('adieu'));
  assert.ok(!isValidWord('abcde') && !isValidWord('zzzzz'));
});

test('same seed gives same answer', () => {
  assert.equal(answerFor(12345), answerFor(12345));
  assert.ok(ANSWERS.includes(answerFor(2 ** 32 - 1)));
});

test('scoring marks correct, present, absent', () => {
  assert.deepEqual(scoreGuess('crane', 'crane'), [C, C, C, C, C]);
  assert.deepEqual(scoreGuess('react', 'crane'), [P, P, C, P, A]);
  assert.deepEqual(scoreGuess('ghost', 'crane'), [A, A, A, A, A]);
});

test('duplicate letters only count as many times as in the answer', () => {
  // 정답에 e가 1개: 맞는 자리의 e만 correct, 나머지 e는 absent
  assert.deepEqual(scoreGuess('geese', 'those'), [A, A, A, C, C]);
  // 정답에 l이 1개, 자리는 다름: 첫 l만 present
  assert.deepEqual(scoreGuess('llama', 'below'), [P, A, A, A, A]);
  // 정답에 l이 2개: 둘 다 present
  assert.deepEqual(scoreGuess('llama', 'hello'), [P, P, A, A, A]);
  // 정답에 o가 2개
  assert.deepEqual(scoreGuess('robot', 'floor'), [P, P, A, C, A]);
});

test('keyboard keeps the best state per letter', () => {
  let keys = mergeKeyState({}, 'eerie', scoreGuess('eerie', 'there'));
  assert.equal(keys.e, C);
  keys = mergeKeyState(keys, 'tease', [P, A, A, A, A]);
  assert.equal(keys.e, C);
  assert.equal(keys.t, P);
  assert.equal(keys.s, A);
});

test('race result: solved > fewer tries > faster', () => {
  const run = (solved, tries, ms) => ({ solved, tries, ms });
  assert.equal(compareRuns(run(true, 4, 90_000), run(false, 6, 30_000)), 1);
  assert.equal(compareRuns(run(true, 3, 90_000), run(true, 4, 30_000)), 1);
  assert.equal(compareRuns(run(true, 4, 40_000), run(true, 4, 30_000)), -1);
  assert.equal(compareRuns(run(false, 6, 1), run(false, 6, 2)), 0);
});
