import { mulberry32, shuffle } from '../shared/rng.js';

export const FRUITS = [
  { id: 'strawberry', name: '딸기' }, { id: 'banana', name: '바나나' },
  { id: 'lime', name: '라임' }, { id: 'plum', name: '자두' },
];
const COPIES = [5, 3, 3, 2, 1];
export const CARDS = FRUITS.flatMap((_, fruit) => COPIES.flatMap((copies, i) =>
  Array.from({ length: copies }, () => ({ fruit, count: i + 1 })))).map((card, id) => ({ ...card, id }));
export const TIE_MS = 60;

export function createGame(seed) {
  const deck = shuffle(mulberry32(seed), CARDS.map((card) => card.id));
  return {
    seed: seed >>> 0, decks: [deck.slice(0, 28), deck.slice(28)], piles: [[], []],
    turn: seed & 1, revision: 0, catches: [0, 0], mistakes: [0, 0], ties: 0,
    winner: null, last: null,
  };
}

export function fruitCounts(state) {
  const totals = FRUITS.map(() => 0);
  for (const pile of state.piles) {
    const card = CARDS[pile.at(-1)];
    if (card) totals[card.fruit] += card.count;
  }
  return totals;
}
export const hasFive = (state) => fruitCounts(state).includes(5);
export const canFlip = (state, player) => state.winner === null && state.turn === player && state.decks.every((deck) => deck.length > 0);
const fail = (error) => ({ ok: false, error });

// 2인 긴 게임: 오답은 상대에게 1장. 마지막 공개가 5라면 종을 칠 마지막 기회를 준다.
export function applyAction(state, action) {
  if (state.winner !== null) return fail('이미 끝난 게임이에요.');
  if (!action || !['flip', 'ring', 'tie'].includes(action.type)) return fail('알 수 없는 행동이에요.');
  const { type, player } = action;
  if (type !== 'tie' && player !== 0 && player !== 1) return fail('플레이어를 확인해 주세요.');
  if (type === 'flip' && !canFlip(state, player)) return fail('지금은 카드를 낼 수 없어요.');
  if (type !== 'flip' && !state.piles.some((pile) => pile.length)) return fail('먼저 카드를 공개해 주세요.');
  const next = {
    ...state, decks: state.decks.map((deck) => [...deck]), piles: state.piles.map((pile) => [...pile]),
    catches: [...state.catches], mistakes: [...state.mistakes], revision: state.revision + 1,
  };
  if (type === 'flip') {
    const card = next.decks[player].shift();
    next.piles[player].push(card);
    next.turn = 1 - player;
    next.last = { type: 'flip', player, card };
  } else if (type === 'tie') {
    next.ties++;
    next.last = { type: 'tie' };
  } else if (hasFive(state)) {
    const cards = next.piles.flat();
    next.decks[player].push(...cards);
    next.piles = [[], []];
    next.catches[player]++;
    next.turn = player;
    next.last = { type: 'catch', player, count: cards.length };
  } else {
    if (!next.decks[player].length) return fail('넘겨줄 카드가 없어요.');
    next.decks[1 - player].push(next.decks[player].shift());
    next.mistakes[player]++;
    next.last = { type: 'miss', player };
  }
  if (!hasFive(next)) {
    const empty = next.decks.findIndex((deck) => !deck.length);
    if (empty >= 0) next.winner = 1 - empty;
  }
  return { ok: true, state: next };
}

// 도착 순서 대신 각 화면의 공개 시점부터 잰 반응 시간을 비교한다.
export function judgeRings(claims) {
  const valid = claims.filter((c) => c && (c.player === 0 || c.player === 1)
    && Number.isFinite(c.elapsed) && c.elapsed >= 0);
  if (!valid.length) return null;
  if (valid.length === 1) return valid[0].player;
  const [a, b] = [...valid].sort((x, y) => x.elapsed - y.elapsed);
  return b.elapsed - a.elapsed <= TIE_MS ? -1 : a.player;
}

// 긴 스와이프 또는 짧고 빠른 위쪽 플릭. 옆/아래 드래그와 작은 탭은 제외한다.
export function isThrow({ dx, dy, velocityY, threshold }) {
  const up = -dy;
  return up >= 24 && Math.abs(dx) <= up * 1.25
    && (up >= threshold || velocityY <= -0.55);
}
