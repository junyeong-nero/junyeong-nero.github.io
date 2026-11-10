import test from 'node:test';
import assert from 'node:assert/strict';
import { COLORS, TILES, applyTurn, chooseTurn, createGame, meldInfo, rackScore, validateTurn } from './logic.js';

const tile = (color, value, copy = 0) => COLORS.indexOf(color) * 26 + (value - 1) * 2 + copy;
const run = (color, ...values) => values.map((value) => tile(color, value));
const group = (value, colors = COLORS.slice(0, 3)) => colors.map((color) => tile(color, value));
function position(hand, table = [], opened = false) {
  return { ...createGame(0), hands: [hand, [tile('black', 1)]], table, opened: [opened, true], turn: 0 };
}
function assertConserved(state) {
  const ids = [...state.hands.flat(), ...state.table.flat(), ...state.pool];
  assert.equal(ids.length, 106);
  assert.equal(new Set(ids).size, 106);
  assert.ok(state.table.every(meldInfo));
}

test('106 tiles: two copies of four colors 1–13 and two jokers; seeded deal', () => {
  assert.equal(TILES.length, 106);
  for (const color of COLORS) {
    for (let n = 1; n <= 13; n++) assert.equal(TILES.filter((t) => t.color === color && t.value === n).length, 2);
  }
  assert.equal(TILES.filter((t) => !t.value).length, 2);
  assert.deepEqual(createGame(123), createGame(123));
  assert.notDeepEqual(createGame(123).hands, createGame(124).hands);
  const state = createGame(123);
  assert.deepEqual(state.hands.map((hand) => hand.length), [14, 14]);
  assert.equal(state.pool.length, 78);
  assertConserved(state);
});

test('groups require 3–4 identical numbers in different colors', () => {
  assert.equal(meldInfo(group(7)).points, 21);
  assert.equal(meldInfo(group(7, COLORS)).type, 'group');
  assert.equal(meldInfo([tile('red', 7), tile('red', 7, 1), tile('blue', 7)]), null);
  assert.equal(meldInfo([tile('red', 7), tile('blue', 8), tile('black', 7)]), null);
  assert.equal(meldInfo(group(7).slice(0, 2)), null);
});

test('runs are unordered consecutive same-color tiles, without wraparound', () => {
  const ids = run('blue', 3, 4, 5);
  assert.deepEqual(meldInfo([ids[2], ids[0], ids[1]]), { type: 'run', points: 12, order: ids });
  assert.equal(meldInfo(run('blue', 1, 2, 4)), null);
  assert.equal(meldInfo(run('blue', 12, 13, 1)), null);
  assert.equal(meldInfo([...run('blue', 1, 2), tile('red', 3)]), null);
  assert.equal(meldInfo([...run('blue', 1, 2), tile('blue', 2, 1)]), null);
  assert.equal(meldInfo(run('red', ...Array.from({ length: 13 }, (_, i) => i + 1))).points, 91);
});

test('jokers fill groups, gaps and ends, but never bridge impossible runs', () => {
  assert.equal(meldInfo([...group(10).slice(0, 2), 104]).points, 30);
  assert.equal(meldInfo([tile('red', 10), 104, 105]).points, 30);
  assert.deepEqual(meldInfo([...run('red', 9, 11), 104]).order, [tile('red', 9), 104, tile('red', 11)]);
  assert.equal(meldInfo([...run('red', 11, 12), 104]).points, 36);
  assert.equal(meldInfo([...run('red', 1, 2), 104]).points, 6);
  assert.equal(meldInfo([...run('red', 12, 13), 104]).points, 36);
  assert.equal(meldInfo([...run('red', 1, 5), 104, 105]), null);
  assert.equal(meldInfo([tile('red', 1), tile('blue', 2), 104]), null);
});

test('malformed melds and duplicate tile identities are rejected', () => {
  for (const meld of [null, {}, '123', [0, 0, 0], [-1, 2, 4], [106, 2, 4], [0.5, 2, 4], [NaN, 2, 4]]) {
    assert.equal(meldInfo(meld), null);
  }
});

test('initial meld accepts several own combinations totaling at least 30', () => {
  const low = run('red', 3, 4, 5);
  const high = group(6);
  const state = position([...low, ...high, tile('black', 13)]);
  assert.equal(validateTurn(state, 0, [low]).ok, false);
  const checked = validateTurn(state, 0, [low, high]);
  assert.equal(checked.ok, true);
  assert.equal(checked.points, 30);
  const result = applyTurn(state, 0, { type: 'play', table: [low, high] });
  assert.equal(result.ok, true);
  assert.equal(result.state.opened[0], true);
  assert.equal(result.state.turn, 1);
  assert.deepEqual(result.state.hands[0], [tile('black', 13)]);
  assert.equal(state.opened[0], false);
  assert.equal(state.hands[0].length, 7);
});

test('initial registration cannot extend or rearrange the existing table', () => {
  const existing = run('blue', 1, 2, 3);
  const own = group(12);
  const state = position([...own, tile('blue', 4)], [existing]);
  assert.equal(validateTurn(state, 0, [[...existing, tile('blue', 4)], own]).ok, false);
  assert.equal(validateTurn(state, 0, [existing, own]).ok, true);
  assert.equal(validateTurn(position(group(2), [existing]), 0, [existing, group(2)]).ok, false);
});

test('registered players may split and extend while retaining every table tile', () => {
  const existing = run('red', 1, 2, 3, 4, 5, 6);
  const extra = tile('red', 7);
  const state = position([extra], [existing], true);
  const table = [existing.slice(0, 3), [...existing.slice(3), extra]];
  const result = applyTurn(state, 0, { type: 'play', table });
  assert.equal(result.ok, true);
  assert.equal(result.state.winner, 0);
  assert.equal(result.state.reason, 'empty-hand');
  assert.equal(validateTurn(state, 0, [[...existing.slice(3), extra]]).ok, false);
  assert.equal(validateTurn(state, 0, [existing]).ok, false);
});

test('table jokers can be reassigned but cannot be taken into the rack', () => {
  const existing = [...run('red', 8, 9), 104];
  const own = [tile('red', 10), tile('blue', 2), tile('black', 2)];
  const state = position(own, [existing], true);
  const table = [run('red', 8, 9, 10), [tile('blue', 2), tile('black', 2), 104]];
  assert.equal(validateTurn(state, 0, table).ok, true);
  assert.equal(validateTurn(state, 0, [run('red', 8, 9, 10)]).ok, false);
});

test('rejects duplicate, stolen, out-of-turn and post-game actions without mutation', () => {
  const own = group(10);
  const state = position(own);
  const before = structuredClone(state);
  for (const action of [null, {}, { type: 'oops' }, { type: 'play', table: null },
    { type: 'play', table: [own, own] }, { type: 'play', table: [group(11)] }]) {
    assert.equal(applyTurn(state, 0, action).ok, false);
  }
  assert.equal(applyTurn(state, 1, { type: 'draw' }).ok, false);
  assert.equal(applyTurn({ ...state, winner: 1 }, 0, { type: 'draw' }).ok, false);
  assert.deepEqual(state, before);
});

test('draw adds exactly one tile, ends the turn and leaves the table intact', () => {
  const state = createGame(0);
  const result = applyTurn(state, 0, { type: 'draw' });
  assert.equal(result.ok, true);
  assert.equal(result.state.hands[0].length, 15);
  assert.equal(result.state.pool.length, 77);
  assert.equal(result.state.hands[0].at(-1), state.pool.at(-1));
  assert.equal(result.state.revision, 1);
  assert.equal(result.state.turn, 1);
  assert.equal(state.pool.length, 78);
  assertConserved(result.state);
});

test('empty pool: two consecutive passes compare rack points, including 30-point jokers', () => {
  assert.equal(rackScore([104, 105, tile('red', 9)]), 69);
  let state = { ...position([104]), pool: [], hands: [[104], [tile('blue', 13)]] };
  state = applyTurn(state, 0, { type: 'draw' }).state;
  assert.equal(state.winner, null);
  state = applyTurn(state, 1, { type: 'draw' }).state;
  assert.equal(state.winner, 1);
  assert.equal(state.reason, 'blocked');
  state = { ...position([tile('red', 1)]), pool: [], passes: 1 };
  assert.equal(applyTurn(state, 0, { type: 'draw' }).state.winner, -1);
});

test('playing a tile resets consecutive passes', () => {
  const state = { ...position([tile('red', 4)], [run('red', 1, 2, 3)], true), pool: [], passes: 1 };
  assert.equal(applyTurn(state, 0, { type: 'play', table: [run('red', 1, 2, 3, 4)] }).state.passes, 0);
});

test('AI registers, extends existing melds and draws when no play is available', () => {
  let state = position([...group(11), tile('black', 3)]);
  assert.equal(chooseTurn(state).type, 'play');
  state = position([tile('red', 4)], [run('red', 1, 2, 3)], true);
  assert.equal(applyTurn(state, 0, chooseTurn(state)).state.winner, 0);
  assert.deepEqual(chooseTurn(position(run('red', 1, 5, 9))), { type: 'draw' });
});

test('AI games and serialized P2P replay finish legally and conserve all tiles', () => {
  for (let seed = 0; seed < 30; seed++) {
    let state = createGame(seed * 7919);
    let peer = structuredClone(state);
    let turns = 0;
    while (state.winner === null && turns < 400) {
      const before = structuredClone(state);
      const action = chooseTurn(state);
      assert.deepEqual(state, before);
      const result = applyTurn(state, state.turn, action);
      assert.equal(result.ok, true, `seed ${seed}, turn ${turns}`);
      peer = applyTurn(peer, peer.turn, JSON.parse(JSON.stringify(action))).state;
      state = result.state;
      assert.deepEqual(peer, state);
      assertConserved(state);
      turns++;
    }
    assert.notEqual(state.winner, null, `seed ${seed} failed to finish`);
  }
});
