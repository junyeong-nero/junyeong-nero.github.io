import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, EDGES, ISLANDS, LINKS, applyAction, applyTurn, chooseTurn, counts, createGame, legalMoves, majority, owners } from './logic.js';

const island = (name) => ISLANDS.findIndex((i) => i.name === name);
const card = (name, copy = 0) => island(name) * 2 + copy;
const edge = (a, b) => EDGES.findIndex((ends) => ends.includes(island(a)) && ends.includes(island(b)));
function position(hands = [[], []], black = [], white = []) {
  const bridges = EDGES.map(() => -1);
  for (const [player, links] of [[0, black], [1, white]]) for (const [a, b] of links) bridges[edge(a, b)] = player;
  return { ...createGame(0), hands, bridges, turn: 0 };
}
const build = (name, a, b, copy = 0) => ({ type: 'build', cards: [card(name, copy)], edge: edge(a, b) });
const finish = (state, draw = null, moves = []) => applyTurn(state, state.turn, { moves, draw });
function assertConserved(state) {
  const cards = [...state.hands.flat(), ...state.market.filter((id) => id !== null), ...state.deck, ...state.discard];
  assert.equal(cards.length, 24);
  assert.equal(new Set(cards).size, 24);
  assert.ok(state.hands.every((hand) => hand.length <= 5));
  assert.ok(state.bridges.every((p) => [-1, 0, 1].includes(p)));
}

test('original board: 12 islands, 27 unique connections and correct majorities', () => {
  assert.equal(ISLANDS.length, 12);
  assert.equal(EDGES.length, 27);
  assert.equal(new Set(EDGES.map((e) => e.join(','))).size, 27);
  assert.deepEqual(LINKS.map((links) => links.length), [3, 5, 4, 4, 6, 5, 4, 5, 5, 5, 5, 3]);
  assert.equal(majority(island('Aloa')), 2);
  assert.equal(majority(island('Elai')), 4);
  assert.ok(EDGES.every(([a, b]) => a !== b && a >= 0 && b < 12));
});

test('seeded deal: 24 cards, 3 per hand, 3 face up and 15 in the deck', () => {
  assert.equal(CARDS.length, 24);
  assert.deepEqual(createGame(42), createGame(42));
  assert.notDeepEqual(createGame(42).hands, createGame(43).hands);
  const state = createGame(42);
  assert.deepEqual(state.hands.map((hand) => hand.length), [3, 3]);
  assert.equal(state.market.length, 3);
  assert.equal(state.deck.length, 15);
  assertConserved(state);
});

test('one endpoint card builds an empty bridge and is discarded without mutating state', () => {
  const state = position([[card('Aloa')], []]);
  const before = structuredClone(state);
  const result = applyAction(state, 0, build('Aloa', 'Aloa', 'Bari'));
  assert.equal(result.ok, true);
  assert.equal(result.state.bridges[edge('Aloa', 'Bari')], 0);
  assert.equal(result.state.hands[0].length, 0);
  assert.equal(result.state.discard.at(-1), card('Aloa'));
  assert.deepEqual(state, before);
});

test('a strict majority is required; adding into an enemy-controlled island is allowed', () => {
  let state = position([[card('Coco')], []], [['Coco', 'Bari']]);
  state = applyAction(state, 0, build('Coco', 'Coco', 'Faaa')).state;
  assert.equal(owners(state.bridges)[island('Coco')], -1);
  state = position([[card('Bari')], []], [], [['Aloa', 'Duda'], ['Aloa', 'Huna']]);
  const result = applyAction(state, 0, build('Bari', 'Aloa', 'Bari'));
  assert.equal(result.ok, true);
  assert.equal(result.state.bridges[edge('Aloa', 'Bari')], 0);
  assert.equal(owners(result.state.bridges)[island('Aloa')], 1);
});

test('official example: capturing Bari then Aloa removes bridges and neighboring control', () => {
  let state = position([[], [card('Bari'), card('Aloa')]],
    [['Aloa', 'Bari'], ['Aloa', 'Huna'], ['Huna', 'Duda'], ['Huna', 'Elai']],
    [['Aloa', 'Duda'], ['Bari', 'Coco'], ['Bari', 'Elai']]);
  state.turn = 1;
  assert.equal(owners(state.bridges)[island('Aloa')], 0);
  assert.equal(owners(state.bridges)[island('Huna')], 0);
  state = applyAction(state, 1, build('Bari', 'Bari', 'Duda')).state;
  assert.equal(owners(state.bridges)[island('Bari')], 1);
  assert.equal(state.bridges[edge('Aloa', 'Bari')], -1);
  assert.equal(owners(state.bridges)[island('Aloa')], -1);
  state = applyAction(state, 1, build('Aloa', 'Aloa', 'Bari')).state;
  assert.equal(owners(state.bridges)[island('Aloa')], 1);
  assert.equal(state.bridges[edge('Aloa', 'Huna')], -1);
  assert.equal(owners(state.bridges)[island('Huna')], -1);
});

test('one bridge can capture both endpoints and remove all opposing incident bridges', () => {
  const state = position([[card('Elai')], []],
    [['Huna', 'Aloa'], ['Huna', 'Duda'], ['Elai', 'Iffi'], ['Elai', 'Jojo'], ['Elai', 'Faaa']],
    [['Huna', 'Iffi'], ['Huna', 'Lale'], ['Elai', 'Duda'], ['Elai', 'Bari'], ['Duda', 'Aloa'], ['Duda', 'Bari']]);
  const result = applyAction(state, 0, build('Elai', 'Huna', 'Elai')).state;
  assert.equal(owners(result.bridges)[island('Huna')], 0);
  assert.equal(owners(result.bridges)[island('Elai')], 0);
  assert.equal(owners(state.bridges)[island('Duda')], 1);
  assert.equal(owners(result.bridges)[island('Duda')], -1);
  for (const link of [...LINKS[island('Huna')], ...LINKS[island('Elai')]]) assert.notEqual(result.bridges[link], 1);
});

test('removal accepts both endpoint cards or two copies of either endpoint, never one card', () => {
  for (const cards of [[card('Huna'), card('Elai')], [card('Huna'), card('Huna', 1)], [card('Elai'), card('Elai', 1)]]) {
    const state = position([cards, []], [], [['Huna', 'Elai']]);
    const result = applyAction(state, 0, { type: 'remove', edge: edge('Huna', 'Elai'), cards });
    assert.equal(result.ok, true);
    assert.equal(result.state.bridges[edge('Huna', 'Elai')], -1);
  }
  const state = position([[card('Huna')], []], [], [['Huna', 'Elai']]);
  assert.equal(applyAction(state, 0, { type: 'remove', edge: edge('Huna', 'Elai'), cards: [card('Huna')] }).ok, false);
});

test('rejects wrong islands, reused/foreign cards, occupied bridges and invalid actions', () => {
  const state = position([[card('Aloa'), card('Bari')], []], [['Aloa', 'Duda']]);
  const before = structuredClone(state);
  for (const action of [null, {}, build('Bari', 'Coco', 'Gola'), build('Aloa', 'Aloa', 'Duda'),
    build('Huna', 'Huna', 'Aloa'), { type: 'discard', cards: [card('Aloa'), card('Aloa')] },
    { type: 'build', cards: [card('Aloa')], edge: 500 }, { type: 'build', cards: [card('Aloa')], edge: 0.5 }]) {
    assert.equal(applyAction(state, 0, action).ok, false);
  }
  assert.equal(applyAction(state, 1, build('Aloa', 'Aloa', 'Bari')).ok, false);
  assert.equal(applyTurn(state, 0, { moves: [build('Aloa', 'Aloa', 'Bari'), build('Aloa', 'Aloa', 'Huna')], draw: 'deck' }).ok, false);
  for (const action of [null, {}, { moves: [], draw: 4 }, { moves: [], draw: undefined }]) assert.equal(applyTurn(state, 0, action).ok, false);
  assert.deepEqual(state, before);
});

test('drawing a visible card refills its slot and ends the turn; hidden draw leaves market alone', () => {
  const state = createGame(0);
  const result = finish(state, 1).state;
  assert.equal(result.hands[0].at(-1), state.market[1]);
  assert.equal(result.market[1], state.deck.at(-1));
  assert.equal(result.deck.length, 14);
  assert.equal(result.turn, 1);
  assert.equal(result.revision, 1);
  assertConserved(result);
  assert.deepEqual(finish(state, 'deck').state.market, state.market);
});

test('a skipped draw forces the opponent to draw and the five-card limit requires playing or discarding', () => {
  let state = createGame(0);
  state = finish(state).state;
  assert.equal(state.mustDraw, true);
  assert.equal(finish(state).ok, false);
  assert.equal(finish(state, 'deck').ok, true);
  state.hands[1].push(state.deck.pop(), state.deck.pop());
  assert.equal(finish(state, 'deck').ok, false);
  const result = finish(state, 'deck', [{ type: 'discard', cards: [state.hands[1][0]] }]);
  assert.equal(result.ok, true);
  assert.equal(result.state.hands[1].length, 5);
  assertConserved(result.state);
});

function roundEnd(round) {
  return {
    ...position([[card('Duda')], [card('Gola')]], [['Aloa', 'Bari'], ['Aloa', 'Duda']], [['Coco', 'Kahu']]),
    round, deck: [], market: [card('Lale'), null, null],
    discard: CARDS.map((c) => c.id).filter((id) => ![card('Duda'), card('Gola'), card('Lale')].includes(id)),
  };
}

test('rounds 1 and 2 award 1 and 2 points, reshuffle only discards, and preserve hands and board', () => {
  for (const round of [1, 2]) {
    const state = roundEnd(round);
    const result = finish(state, 0).state;
    assert.deepEqual(result.scores, [round, 0]);
    assert.equal(result.round, round + 1);
    assert.equal(result.turn, 1);
    assert.equal(result.history.length, 1);
    assert.deepEqual(result.bridges, state.bridges);
    assert.deepEqual(result.hands[1], state.hands[1]);
    assert.equal(result.hands[0].at(-1), card('Lale'));
    assert.equal(result.market.filter((id) => id !== null).length, 3);
    assert.deepEqual(result, finish(state, 0).state);
    assertConserved(result);
  }
});

test('round 3 grants exactly two additional no-draw turns before difference scoring', () => {
  let state = finish(roundEnd(3), 0).state;
  assert.equal(state.finalTurns, 2);
  assert.equal(state.winner, null);
  assert.equal(finish(state, 'deck').ok, false);
  assert.equal(applyAction(state, state.turn, { type: 'discard', cards: state.hands[state.turn] }).ok, false);
  state = finish(state).state;
  assert.equal(state.finalTurns, 1);
  assert.equal(state.winner, null);
  state = finish(state).state;
  assert.equal(state.finalTurns, 0);
  assert.equal(state.winner, 0);
  assert.deepEqual(state.scores, [1, 0]);
  assert.equal(state.reason, 'scored');
});

test('final scoring ties use final-round points, then bridges, then a draw', () => {
  let state = { ...roundEnd(3), scores: [0, 1], finalTurns: 1 };
  let result = finish(state).state;
  assert.deepEqual(result.scores, [1, 1]);
  assert.equal(result.winner, 0);
  state = { ...position([[], []], [['Aloa', 'Bari'], ['Bari', 'Coco']], [['Gola', 'Jojo']]), round: 3, finalTurns: 1 };
  result = finish(state).state;
  assert.deepEqual(result.scores, [0, 0]);
  assert.equal(result.winner, 0);
  state.bridges[edge('Bari', 'Coco')] = -1;
  assert.equal(finish(state).state.winner, -1);
});

test('no bridges loses immediately in rounds 2–3, but not round 1', () => {
  const state = position([[card('Aloa')], []]);
  for (const round of [1, 2, 3]) {
    const result = finish({ ...state, round }, null, [build('Aloa', 'Aloa', 'Bari')]).state;
    assert.equal(result.winner, round === 1 ? null : 0);
    if (round > 1) assert.equal(result.reason, 'no-bridges');
  }
  assert.equal(finish({ ...state, winner: 0 }).ok, false);
});

test('AI prefers a capture, and every generated move is legal', () => {
  const state = position([[card('Aloa'), card('Coco')], []], [['Aloa', 'Bari']]);
  for (const move of legalMoves(state)) assert.equal(applyAction(state, 0, move).ok, true);
  const action = chooseTurn(state);
  const result = applyTurn(state, 0, action);
  assert.equal(result.ok, true);
  assert.equal(owners(result.state.bridges)[island('Aloa')], 0);
});

test('AI only uses public information when choosing actions and draws', () => {
  const state = createGame(0);
  const hidden = { ...state, deck: [...state.deck].reverse(), hands: [state.hands[0], [...state.hands[1]].reverse()] };
  assert.deepEqual(chooseTurn(state), chooseTurn(hidden));
});

test('AI games and serialized P2P replay finish deterministically and conserve all cards', () => {
  for (let seed = 0; seed < 50; seed++) {
    let state = createGame(seed * 7919);
    let peer = structuredClone(state);
    let turns = 0;
    while (state.winner === null && turns < 300) {
      const before = structuredClone(state);
      const action = chooseTurn(state);
      assert.deepEqual(state, before);
      const result = applyTurn(state, state.turn, action);
      assert.equal(result.ok, true, `seed ${seed} turn ${turns}: ${result.error}`);
      peer = applyTurn(peer, peer.turn, JSON.parse(JSON.stringify(action))).state;
      state = result.state;
      assert.deepEqual(peer, state);
      assertConserved(state);
      turns++;
    }
    assert.notEqual(state.winner, null, `seed ${seed} failed to finish`);
    assert.ok(state.history.length <= 3);
    assert.deepEqual(counts(state).islands, [0, 1].map((p) => owners(state.bridges).filter((owner) => owner === p).length));
  }
});
