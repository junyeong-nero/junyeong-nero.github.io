import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, FRUITS, applyAction, canFlip, createGame, fruitCounts, hasFive, isThrow, judgeRings } from './logic.js';
import { mulberry32 } from '../shared/rng.js';

const card = (fruit, count, copy = 0) => CARDS.filter((c) => c.fruit === fruit && c.count === count)[copy].id;
function position(piles, decks = [[card(2, 1)], [card(3, 1)]]) {
  return { ...createGame(0), piles, decks };
}
function assertConserved(state) {
  const cards = [...state.decks.flat(), ...state.piles.flat()];
  assert.equal(cards.length, 56);
  assert.equal(new Set(cards).size, 56);
}

test('56-card deck: four fruits with 5/3/3/2/1 copies of counts 1–5', () => {
  assert.equal(CARDS.length, 56);
  FRUITS.forEach((_, fruit) => {
    assert.deepEqual([1, 2, 3, 4, 5].map((n) => CARDS.filter((c) => c.fruit === fruit && c.count === n).length), [5, 3, 3, 2, 1]);
  });
  assert.deepEqual(createGame(42), createGame(42));
  assert.notDeepEqual(createGame(42).decks, createGame(43).decks);
  assert.deepEqual(createGame(42).decks.map((d) => d.length), [28, 28]);
  assertConserved(createGame(42));
});

test('only the top cards count, and only exactly five of the same fruit matches', () => {
  const state = position([[card(1, 5), card(0, 2)], [card(0, 3)]]);
  assert.deepEqual(fruitCounts(state), [5, 0, 0, 0]);
  assert.equal(hasFive(state), true);
  assert.equal(hasFive(position([[card(0, 2)], [card(1, 3)]])), false);
  assert.equal(hasFive(position([[card(0, 3)], [card(0, 3, 1)]])), false);
  assert.equal(hasFive(position([[card(0, 5)], []])), true);
  assert.equal(hasFive(position([[card(0, 5)], [card(0, 1)]])), false);
  assert.equal(hasFive(position([[card(0, 5)], [card(1, 5)]])), true);
  assert.equal(hasFive(position([[], []])), false);
});

test('flips alternate turns, cover the old top, and never mutate the input', () => {
  const state = createGame(0);
  const before = structuredClone(state);
  const result = applyAction(state, { type: 'flip', player: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.state.turn, 1);
  assert.deepEqual(result.state.piles[0], [state.decks[0][0]]);
  assert.equal(result.state.decks[0].length, 27);
  assert.equal(result.state.revision, 1);
  assert.deepEqual(state, before);
  assertConserved(result.state);
  assert.equal(applyAction(result.state, { type: 'flip', player: 0 }).ok, false);
});

test('either player may ring; a correct ring collects every face-up card under their deck', () => {
  const state = position([[card(0, 1), card(0, 2)], [card(0, 3)]]);
  const result = applyAction(state, { type: 'ring', player: 1 }).state;
  assert.deepEqual(result.decks[1], [...state.decks[1], ...state.piles.flat()]);
  assert.deepEqual(result.piles, [[], []]);
  assert.equal(result.turn, 1);
  assert.equal(result.catches[1], 1);
  assert.deepEqual(result.last, { type: 'catch', player: 1, count: 3 });
});

test('an incorrect ring gives one face-down card to the opponent without clearing the table', () => {
  const state = position([[card(0, 2)], [card(1, 3)]], [[card(2, 1), card(2, 2)], [card(3, 1)]]);
  const result = applyAction(state, { type: 'ring', player: 0 }).state;
  assert.deepEqual(result.decks[1], [...state.decks[1], state.decks[0][0]]);
  assert.equal(result.decks[0].length, 1);
  assert.deepEqual(result.piles, state.piles);
  assert.equal(result.turn, state.turn);
  assert.equal(result.mistakes[0], 1);
});

test('ties preserve all cards and turn, while advancing the revision against duplicate claims', () => {
  const state = position([[card(0, 2)], [card(0, 3)]]);
  const result = applyAction(state, { type: 'tie' }).state;
  assert.deepEqual(result.decks, state.decks);
  assert.deepEqual(result.piles, state.piles);
  assert.equal(result.turn, state.turn);
  assert.equal(result.revision, 1);
  assert.equal(result.ties, 1);
});

test('last-card five leaves one final bell opportunity, otherwise an empty deck loses', () => {
  let state = position([[], []], [[card(0, 5)], [card(1, 2)]]);
  state = applyAction(state, { type: 'flip', player: 0 }).state;
  assert.equal(state.winner, null);
  assert.equal(canFlip(state, 1), false);
  assert.equal(applyAction(state, { type: 'ring', player: 0 }).state.winner, null);
  assert.equal(applyAction(state, { type: 'ring', player: 1 }).state.winner, 1);
  state = position([[], []], [[card(0, 1)], [card(1, 2)]]);
  assert.equal(applyAction(state, { type: 'flip', player: 0 }).state.winner, 1);
  state = position([[card(0, 1)], []]);
  assert.equal(applyAction(state, { type: 'ring', player: 0 }).state.winner, 1);
});

test('rejects empty-table rings, wrong turns, unknown actions and post-game input', () => {
  const state = createGame(0);
  for (const action of [null, {}, { type: 'oops' }, { type: 'flip', player: 1 },
    { type: 'ring', player: 0 }, { type: 'tie' }, { type: 'ring', player: 4 }]) {
    assert.equal(applyAction(state, action).ok, false);
  }
  assert.equal(applyAction({ ...state, winner: 1 }, { type: 'flip', player: 0 }).ok, false);
});

test('ring judgement uses reaction time rather than arrival order and allows a 60ms tie', () => {
  assert.equal(judgeRings([{ player: 0, elapsed: 430 }, { player: 1, elapsed: 300 }]), 1);
  assert.equal(judgeRings([{ player: 0, elapsed: 300 }, { player: 1, elapsed: 360 }]), -1);
  assert.equal(judgeRings([{ player: 1, elapsed: 361 }, { player: 0, elapsed: 300 }]), 0);
  assert.equal(judgeRings([{ player: 1, elapsed: 200 }]), 1);
  assert.equal(judgeRings([{ player: 0, elapsed: -1 }, { player: 1, elapsed: NaN }]), null);
  assert.equal(judgeRings([]), null);
});

test('swipe requires upward travel: long pull or quick flick; taps and sideways drags cancel', () => {
  const swipe = (dx, dy, velocityY) => isThrow({ dx, dy, velocityY, threshold: 64 });
  assert.equal(swipe(10, -80, -0.1), true);
  assert.equal(swipe(4, -30, -0.8), true);
  assert.equal(swipe(0, -45, -0.1), false);
  assert.equal(swipe(0, -10, -2), false);
  assert.equal(swipe(100, -60, -1), false);
  assert.equal(swipe(0, 100, 1), false);
});

test('random games and serialized peer replay conserve all 56 cards through flips, rings and ties', () => {
  for (let seed = 0; seed < 25; seed++) {
    const rand = mulberry32(seed);
    let state = createGame(seed), peer = createGame(seed);
    for (let n = 0; n < 1000 && state.winner === null; n++) {
      const action = hasFive(state) ? { type: 'ring', player: rand() < 0.5 ? 0 : 1 }
        : state.piles.some((pile) => pile.length) && rand() < 0.04 ? { type: 'ring', player: rand() < 0.5 ? 0 : 1 }
          : { type: 'flip', player: state.turn };
      const result = applyAction(state, action);
      assert.equal(result.ok, true);
      peer = applyAction(peer, JSON.parse(JSON.stringify(action))).state;
      state = result.state;
      assert.deepEqual(state, peer);
      assertConserved(state);
    }
  }
});
