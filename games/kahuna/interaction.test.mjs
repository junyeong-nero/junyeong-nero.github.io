import test from 'node:test';
import assert from 'node:assert/strict';
import { EDGES, ISLANDS, applyAction, createGame } from './logic.js';
import { ISLAND_SHAPES, islandIcon, islandTargets, selectedMoves } from './interaction.js';

function game() {
  return { ...createGame(0), hands: [[0, 1, 2, 4], []] };
}

test('all 12 islands have distinct closed silhouettes shared verbatim by their cards', () => {
  assert.equal(ISLAND_SHAPES.length, ISLANDS.length);
  assert.equal(new Set(ISLAND_SHAPES).size, 12);
  for (let i = 0; i < ISLAND_SHAPES.length; i++) {
    assert.match(ISLAND_SHAPES[i], /^M.+Z$/);
    assert.ok(islandIcon(i).includes(`d="${ISLAND_SHAPES[i]}"`));
  }
});

test('one selected card highlights neighboring islands, never the source itself', () => {
  const state = game(), before = structuredClone(state);
  const moves = selectedMoves(state, 0, [0], 'build');
  const targets = islandTargets(moves);
  assert.deepEqual([...targets.keys()], [1, 3, 7]);
  for (const [island, move] of targets) {
    assert.deepEqual(EDGES[move.edge], [0, island]);
    assert.equal(applyAction(state, 0, move).ok, true);
  }
  assert.deepEqual(state, before);
});

test('build mode cannot accidentally become a removal when another card is selected', () => {
  const state = game();
  state.bridges[0] = 1;
  assert.deepEqual(selectedMoves(state, 0, [0, 2], 'build'), []);
  assert.deepEqual(selectedMoves(state, 0, [0], 'remove'), []);
  assert.equal(selectedMoves(state, 0, [0, 2], 'remove').length, 1);
});

test('different endpoint cards allow a removal by touching either endpoint island', () => {
  const state = game();
  state.bridges[0] = 1;
  const moves = selectedMoves(state, 0, [0, 2], 'remove');
  const targets = islandTargets(moves);
  assert.deepEqual([...targets.keys()], [0, 1]);
  assert.deepEqual(targets.get(0), targets.get(1));
  assert.equal(applyAction(state, 0, targets.get(1)).state.bridges[0], -1);
});

test('two copies of one island card target only the far end of each removable bridge', () => {
  const state = game();
  state.bridges[0] = state.bridges[2] = 1;
  const targets = islandTargets(selectedMoves(state, 0, [0, 1], 'remove'));
  assert.deepEqual([...targets.keys()], [1, 7]);
  assert.equal(targets.get(7).edge, 2);
});

test('occupied routes, foreign cards, wrong turns and completed games expose no illegal targets', () => {
  const state = game();
  state.bridges[0] = 0;
  assert.equal(islandTargets(selectedMoves(state, 0, [0], 'build')).has(1), false);
  for (const cards of [[], [99], [0, 0]]) assert.deepEqual(selectedMoves(state, 0, cards, 'remove'), []);
  assert.deepEqual(selectedMoves(state, 1, [0], 'build'), []);
  assert.deepEqual(selectedMoves({ ...state, winner: 0 }, 0, [0], 'build'), []);
  assert.equal(islandTargets([]).size, 0);
});
