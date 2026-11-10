import { mulberry32, shuffle } from '../shared/rng.js';

// 연결 관계는 원작 보드와 같고, 좌표와 그림은 이 웹 버전의 자체 레이아웃이다.
export const ISLANDS = [
  { name: 'Aloa', x: 70, y: 95 }, { name: 'Bari', x: 230, y: 65 },
  { name: 'Coco', x: 435, y: 95 }, { name: 'Duda', x: 120, y: 185 },
  { name: 'Elai', x: 230, y: 210 }, { name: 'Faaa', x: 345, y: 165 },
  { name: 'Gola', x: 445, y: 245 }, { name: 'Huna', x: 75, y: 305 },
  { name: 'Iffi', x: 230, y: 335 }, { name: 'Jojo', x: 340, y: 295 },
  { name: 'Kahu', x: 445, y: 395 }, { name: 'Lale', x: 220, y: 450 },
];
export const EDGES = [
  [0, 1], [0, 3], [0, 7], [1, 2], [1, 3], [1, 4], [1, 5],
  [2, 5], [2, 6], [2, 10], [3, 4], [3, 7], [4, 5], [4, 7], [4, 8], [4, 9],
  [5, 6], [5, 9], [6, 9], [6, 10], [7, 8], [7, 11], [8, 9], [8, 10], [8, 11], [9, 10], [10, 11],
];
export const LINKS = ISLANDS.map((_, island) => EDGES.flatMap((edge, i) => edge.includes(island) ? [i] : []));
export const CARDS = Array.from({ length: 24 }, (_, id) => ({ id, island: Math.floor(id / 2) }));
export const majority = (island) => Math.floor(LINKS[island].length / 2) + 1;
const fail = (error) => ({ ok: false, error });

export function createGame(seed) {
  const deck = shuffle(mulberry32(seed), CARDS.map((card) => card.id));
  return {
    seed: seed >>> 0, turn: seed & 1, revision: 0, round: 1,
    bridges: EDGES.map(() => -1), hands: [deck.splice(0, 3), deck.splice(0, 3)],
    market: deck.splice(0, 3), deck, discard: [], scores: [0, 0], history: [],
    mustDraw: false, finalTurns: null, winner: null, reason: '',
  };
}

export function owners(bridges) {
  return LINKS.map((links, island) => {
    for (const player of [0, 1]) {
      if (links.filter((edge) => bridges[edge] === player).length >= majority(island)) return player;
    }
    return -1;
  });
}

export function counts(state) {
  const control = owners(state.bridges);
  return {
    islands: [0, 1].map((player) => control.filter((p) => p === player).length),
    bridges: [0, 1].map((player) => state.bridges.filter((p) => p === player).length),
  };
}

export function applyAction(state, player, action) {
  if (state.winner !== null || state.turn !== player) return fail('지금은 내 차례가 아니에요.');
  if (!action || !['build', 'remove', 'discard'].includes(action.type)) return fail('알 수 없는 행동이에요.');
  const { type, cards, edge } = action;
  if (!Array.isArray(cards) || !cards.length || cards.length > 5 || new Set(cards).size !== cards.length
    || cards.some((id) => !Number.isInteger(id) || !state.hands[player].includes(id))) return fail('내 손패에서 카드를 선택해 주세요.');
  if (type === 'discard') {
    if (state.finalTurns !== null) return fail('마지막 추가 턴에는 카드를 버리지 않아요.');
  } else {
    if (!Number.isInteger(edge) || edge < 0 || edge >= EDGES.length) return fail('연결선을 선택해 주세요.');
    if (cards.some((id) => !EDGES[edge].includes(CARDS[id].island))) return fail('연결선 양끝 섬의 카드가 필요해요.');
    if (type === 'build' && (cards.length !== 1 || state.bridges[edge] !== -1)) return fail('카드 1장으로 빈 연결선에 다리를 놓으세요.');
    if (type === 'build' && state.bridges.filter((p) => p === player).length >= 25) return fail('다리 25개를 모두 사용했어요.');
    if (type === 'remove' && (cards.length !== 2 || state.bridges[edge] !== 1 - player)) return fail('카드 2장으로 상대 다리를 제거할 수 있어요.');
  }
  const next = {
    ...state,
    bridges: [...state.bridges],
    hands: state.hands.map((hand, p) => p === player ? hand.filter((id) => !cards.includes(id)) : [...hand]),
    discard: [...state.discard, ...cards],
  };
  if (type === 'build') {
    const before = owners(state.bridges);
    next.bridges[edge] = player;
    const after = owners(next.bridges);
    after.forEach((owner, island) => {
      if (owner !== player || before[island] === player) return;
      for (const link of LINKS[island]) {
        if (next.bridges[link] === 1 - player) next.bridges[link] = -1;
      }
    });
  } else if (type === 'remove') next.bridges[edge] = -1;
  return { ok: true, state: next };
}

function scoreRound(state) {
  const { islands, bridges } = counts(state);
  const winner = islands[0] === islands[1] ? -1 : islands[0] > islands[1] ? 0 : 1;
  const points = [0, 0];
  if (winner !== -1) points[winner] = state.round === 3 ? Math.abs(islands[0] - islands[1]) : state.round;
  state.scores = state.scores.map((score, p) => score + points[p]);
  state.history = [...state.history, { round: state.round, islands, points }];
  if (state.round !== 3) return;
  const tieBreaks = [state.scores, points, bridges];
  state.winner = -1;
  for (const pair of tieBreaks) {
    if (pair[0] === pair[1]) continue;
    state.winner = pair[0] > pair[1] ? 0 : 1;
    break;
  }
  state.reason = 'scored';
}

function checkElimination(state) {
  if (state.round === 1) return false;
  const { bridges } = counts(state);
  if (bridges[0] === bridges[1] || (bridges[0] && bridges[1])) return false;
  state.winner = bridges[0] ? 0 : 1;
  state.reason = 'no-bridges';
  return true;
}

// 한 턴의 카드 사용 순서와 마지막 뽑기를 함께 검증한다. 양쪽 클라이언트가 같은 행동을 재생한다.
// draw: 'deck' | 0..2(공개 카드 자리) | null(뽑지 않음)
export function applyTurn(state, player, action) {
  if (state.winner !== null || state.turn !== player) return fail('지금은 내 차례가 아니에요.');
  if (!action || !Array.isArray(action.moves) || action.moves.length > 5
    || !(action.draw === null || action.draw === 'deck' || (Number.isInteger(action.draw) && action.draw >= 0 && action.draw < 3))) {
    return fail('턴 정보를 확인해 주세요.');
  }
  let next = { ...state, hands: state.hands.map((hand) => [...hand]), market: [...state.market], deck: [...state.deck] };
  for (const move of action.moves) {
    const result = applyAction(next, player, move);
    if (!result.ok) return result;
    next = result.state;
  }
  next.revision++;
  next.turn = 1 - player;
  // 디지털 버전에서는 턴 확정 시 조기 승리를 판정한다. 확정 전에는 되돌릴 수 있다.
  if (checkElimination(next)) return { ok: true, state: next };
  if (next.finalTurns !== null) {
    if (action.draw !== null) return fail('마지막 추가 턴에는 카드를 뽑지 않아요.');
    next.finalTurns--;
    if (!next.finalTurns) scoreRound(next);
    return { ok: true, state: next };
  }
  if (action.draw === null) {
    if (state.mustDraw) return fail('상대가 뽑기를 건너뛰어서 이번 턴에는 꼭 1장을 뽑아야 해요.');
    next.mustDraw = true;
  } else {
    if (next.hands[player].length >= 5) return fail('손패는 최대 5장이에요. 카드를 사용하거나 버린 뒤 뽑아 주세요.');
    let card;
    if (action.draw === 'deck') {
      if (!next.deck.length) return fail('카드 더미가 비었어요. 공개 카드를 골라 주세요.');
      card = next.deck.pop();
    } else {
      card = next.market[action.draw];
      if (card === null || card === undefined) return fail('빈 카드 자리예요.');
      next.market[action.draw] = next.deck.pop() ?? null;
    }
    next.hands[player].push(card);
    next.mustDraw = false;
  }
  if (!next.deck.length && next.market.every((card) => card === null)) {
    if (next.round === 3) next.finalTurns = 2;
    else {
      scoreRound(next);
      next.round++;
      next.deck = shuffle(mulberry32(next.seed ^ Math.imul(next.round, 0x9e3779b9)), [...next.discard]);
      next.discard = [];
      next.market = Array.from({ length: 3 }, () => next.deck.pop() ?? null);
      checkElimination(next);
    }
  }
  return { ok: true, state: next };
}

export function legalMoves(state) {
  const moves = [];
  const hand = state.hands[state.turn];
  for (let edge = 0; edge < EDGES.length; edge++) {
    const cards = hand.filter((id) => EDGES[edge].includes(CARDS[id].island));
    if (state.bridges[edge] === -1 && state.bridges.filter((p) => p === state.turn).length < 25) {
      for (const id of cards) moves.push({ type: 'build', edge, cards: [id] });
    } else if (state.bridges[edge] === 1 - state.turn) {
      for (let i = 0; i < cards.length; i++) {
        for (let j = i + 1; j < cards.length; j++) moves.push({ type: 'remove', edge, cards: [cards[i], cards[j]] });
      }
    }
  }
  return moves;
}

function value(state, player) {
  const totals = counts(state);
  let score = 50 * (totals.islands[player] - totals.islands[1 - player])
    + 3 * (totals.bridges[player] - totals.bridges[1 - player]);
  const control = owners(state.bridges);
  LINKS.forEach((links, island) => {
    if (control[island] !== -1) return;
    for (const p of [0, 1]) {
      const progress = links.filter((edge) => state.bridges[edge] === p).length / majority(island);
      score += (p === player ? 1 : -1) * progress * progress * 12;
    }
  });
  return score;
}

function cardValue(state, id) {
  return LINKS[CARDS[id].island].reduce((sum, edge) => sum + (state.bridges[edge] === -1 ? 3
    : state.bridges[edge] !== state.turn ? 2 : 0), 0);
}

export function chooseTurn(state) {
  let draft = state;
  const moves = [];
  while (moves.length < 5) {
    const options = legalMoves(draft).map((move) => {
      const next = applyAction(draft, state.turn, move).state;
      return { move, next, score: value(next, state.turn) - move.cards.length };
    }).sort((a, b) => b.score - a.score);
    if (!options.length || options[0].score <= value(draft, state.turn)) break;
    moves.push(options[0].move);
    draft = options[0].next;
  }
  if (draft.finalTurns !== null) return { moves, draw: null };
  if (draft.hands[state.turn].length === 5) {
    const id = [...draft.hands[state.turn]].sort((a, b) => cardValue(draft, a) - cardValue(draft, b))[0];
    moves.push({ type: 'discard', cards: [id] });
  }
  const visible = draft.market.map((id, i) => ({ id, i })).filter(({ id }) => id !== null)
    .sort((a, b) => cardValue(draft, b.id) - cardValue(draft, a.id));
  // 더미의 내용이나 상대 손패를 보지 않고, 공개 정보만으로 선택한다.
  const draw = visible.length && (cardValue(draft, visible[0].id) > 0 || !draft.deck.length)
    ? visible[0].i : draft.deck.length ? 'deck' : null;
  return { moves, draw };
}
