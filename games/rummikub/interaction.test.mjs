import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, validateTurn } from './logic.js';
import { meldHint, moveTiles } from './interaction.js';

function game(opened = false) {
  return { ...createGame(0), hands: [[18, 44, 70, 12, 14, 16], []], table: [[0, 2, 4]], opened: [opened, false] };
}

test('dragging one or several tiles shares an immutable move path with tap placement', () => {
  const match = game(), before = structuredClone(match);
  const first = moveTiles(match, 0, match.table, match.hands[0], [18], 'new');
  assert.deepEqual(first.table, [[0, 2, 4], [18]]);
  const next = moveTiles(match, 0, first.table, first.rack, [44, 70], 1);
  assert.deepEqual(next.table, [[0, 2, 4], [18, 44, 70]]);
  assert.deepEqual(next.rack, [12, 14, 16]);
  assert.equal(validateTurn(match, 0, next.table).ok, true);
  assert.deepEqual(match, before);
});

test('a staged hand tile can return to the rack, but original table tiles cannot', () => {
  const match = game(true);
  const first = moveTiles(match, 0, match.table, match.hands[0], [18], 'new');
  const next = moveTiles(match, 0, first.table, first.rack, [18], 'rack');
  assert.deepEqual(next.table, match.table);
  assert.deepEqual([...next.rack].sort(), [...match.hands[0]].sort());
  assert.equal(moveTiles(match, 0, match.table, match.hands[0], [0], 'rack'), null);
});

test('first-registration locking protects both the source and destination of a drop', () => {
  const match = game();
  assert.equal(moveTiles(match, 0, match.table, match.hands[0], [0], 'new'), null);
  assert.equal(moveTiles(match, 0, match.table, match.hands[0], [18], 0), null);
});

test('merging into a later group retains the correct destination when the source becomes empty', () => {
  const match = game(true), table = [[12], [14, 16], [0, 2, 4]];
  const next = moveTiles(match, 0, table, [18, 44, 70], [12], 1);
  assert.deepEqual(next.table, [[12, 14, 16], [0, 2, 4]]);
  assert.deepEqual(table, [[12], [14, 16], [0, 2, 4]]);
});

test('cancelled/invalid destinations, repeated tiles, wrong turns and ended games cannot move tiles', () => {
  const match = game();
  for (const target of [null, undefined, -1, 4, 'wrong']) {
    assert.equal(moveTiles(match, 0, match.table, match.hands[0], [18], target), null);
  }
  for (const ids of [[], [18, 18], [99]]) assert.equal(moveTiles(match, 0, match.table, match.hands[0], ids, 'new'), null);
  assert.equal(moveTiles(match, 1, match.table, match.hands[0], [18], 'new'), null);
  assert.equal(moveTiles({ ...match, winner: 0 }, 0, match.table, match.hands[0], [18], 'new'), null);
});

test('each unfinished group explains its missing tiles, duplicate colors, or broken sequence', () => {
  assert.match(meldHint([12]), /2개 더/);
  assert.match(meldHint([12, 13, 38]), /서로 다른 색/);
  assert.match(meldHint([12, 16, 20]), /중복·빈틈 없이/);
  assert.match(meldHint([12, 14, 16]), /연속 숫자 · 24점/);
  assert.match(meldHint([18, 44, 70]), /같은 숫자 · 30점/);
  assert.match(meldHint([12, 40, 68]), /같은 숫자끼리/);
});
