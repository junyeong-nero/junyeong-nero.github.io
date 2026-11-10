import { mulberry32, shuffle } from '../shared/rng.js';

export const COLORS = ['red', 'blue', 'orange', 'black'];
export const TILES = Array.from({ length: 106 }, (_, id) => ({
  id,
  color: id < 104 ? COLORS[Math.floor(id / 26)] : 'joker',
  value: id < 104 ? Math.floor((id % 26) / 2) + 1 : 0,
}));
const isTile = (id) => Number.isInteger(id) && id >= 0 && id < TILES.length;
const key = (ids) => [...ids].sort((a, b) => a - b).join(',');

export function createGame(seed) {
  const deck = shuffle(mulberry32(seed), TILES.map((t) => t.id));
  return {
    seed: seed >>> 0,
    hands: [deck.splice(0, 14), deck.splice(0, 14)],
    pool: deck,
    table: [],
    opened: [false, false],
    turn: seed & 1,
    revision: 0,
    passes: 0,
    winner: null, // 0 | 1 | -1(무승부)
    reason: '',
  };
}

// 조합은 놓인 순서와 무관하게 판정하고, 조커를 포함한 표시 순서를 돌려준다.
// 조커의 값이 여러 가지라면 높은 쪽을 사용한다 (예: 11, 12, 조커 → 11, 12, 13).
export function meldInfo(ids) {
  if (!Array.isArray(ids) || ids.length < 3 || ids.length > 13 || !ids.every(isTile)
    || new Set(ids).size !== ids.length) return null;
  const natural = ids.filter((id) => TILES[id].value);
  const jokers = ids.filter((id) => !TILES[id].value);
  const tiles = natural.map((id) => TILES[id]);
  if (!tiles.length) return null;

  if (ids.length <= 4 && tiles.every((t) => t.value === tiles[0].value)
    && new Set(tiles.map((t) => t.color)).size === tiles.length) {
    return {
      type: 'group',
      points: tiles[0].value * ids.length,
      order: [...natural.sort((a, b) => a - b), ...jokers],
    };
  }
  if (!tiles.every((t) => t.color === tiles[0].color)
    || new Set(tiles.map((t) => t.value)).size !== tiles.length) return null;
  const min = Math.min(...tiles.map((t) => t.value));
  const max = Math.max(...tiles.map((t) => t.value));
  const start = Math.min(min, 14 - ids.length);
  if (start < 1 || start + ids.length - 1 < max) return null;
  const byValue = new Map(tiles.map((t) => [t.value, t.id]));
  let j = 0;
  const order = Array.from({ length: ids.length }, (_, i) => byValue.get(start + i) ?? jokers[j++]);
  return { type: 'run', points: ids.length * (2 * start + ids.length - 1) / 2, order };
}

export const rackScore = (hand) => hand.reduce((sum, id) => sum + (TILES[id].value || 30), 0);
const fail = (error) => ({ ok: false, error });

export function validateTurn(state, player, table) {
  if (state.winner !== null || player !== state.turn) return fail('지금은 내 차례가 아니에요.');
  if (!Array.isArray(table) || table.length > 35) return fail('테이블을 확인해 주세요.');
  const infos = table.map(meldInfo);
  if (infos.some((info) => !info)) return fail('모든 조합을 올바른 그룹 또는 연속 숫자로 완성해 주세요.');
  const before = state.table.flat();
  const after = table.flat();
  const allowed = new Set([...before, ...state.hands[player]]);
  if (new Set(after).size !== after.length || after.some((id) => !allowed.has(id))) {
    return fail('같은 타일을 두 번 쓰거나 다른 사람의 타일을 쓸 수 없어요.');
  }
  const used = new Set(after);
  if (before.some((id) => !used.has(id))) return fail('테이블에 있던 타일은 손패로 가져올 수 없어요.');
  const hand = state.hands[player].filter((id) => !used.has(id));
  const played = state.hands[player].length - hand.length;
  if (!played) return fail('손패에서 타일을 1개 이상 내려놓아 주세요.');

  let points = 0;
  if (!state.opened[player]) {
    const groups = new Set(table.map(key));
    if (state.table.some((meld) => !groups.has(key(meld)))) {
      return fail('첫 등록은 손패만 사용해 주세요. 테이블 재배치는 다음 턴부터 가능해요.');
    }
    const old = new Set(before);
    points = infos.reduce((sum, info, i) => sum + (table[i].some((id) => old.has(id)) ? 0 : info.points), 0);
    if (points < 30) return fail(`첫 등록은 합계 30점 이상이에요. (현재 ${points}점)`);
  }
  return { ok: true, hand, played, points };
}

// 로컬과 상대의 행동에 같은 검증을 적용한다. 실패한 행동은 원본 상태를 바꾸지 않는다.
export function applyTurn(state, player, action) {
  if (state.winner !== null || player !== state.turn) return fail('지금은 내 차례가 아니에요.');
  if (!action || !['play', 'draw'].includes(action.type)) return fail('알 수 없는 행동이에요.');
  let checked;
  if (action.type === 'play') {
    checked = validateTurn(state, player, action.table);
    if (!checked.ok) return checked;
  }
  const next = {
    ...state,
    hands: state.hands.map((hand) => [...hand]),
    pool: [...state.pool],
    table: state.table.map((meld) => [...meld]),
    opened: [...state.opened],
    turn: 1 - player,
    revision: state.revision + 1,
    passes: 0,
  };
  if (action.type === 'play') {
    next.hands[player] = checked.hand;
    next.table = action.table.map((meld) => meldInfo(meld).order);
    next.opened[player] = true;
    if (!checked.hand.length) {
      next.winner = player;
      next.reason = 'empty-hand';
    }
  } else if (next.pool.length) {
    next.hands[player].push(next.pool.pop());
  } else {
    next.passes = state.passes + 1;
    if (next.passes >= 2) {
      const scores = next.hands.map(rackScore);
      next.winner = scores[0] === scores[1] ? -1 : scores[0] < scores[1] ? 0 : 1;
      next.reason = 'blocked';
    }
  }
  return { ok: true, state: next };
}

// AI: 손패의 새 조합 + 기존 조합에 이어 붙이기. 테이블 전체 재배치 탐색은 하지 않는다.
function candidates(hand) {
  const byColor = COLORS.map((color) => {
    const map = new Map();
    for (const id of hand) if (TILES[id].color === color) map.set(TILES[id].value, id);
    return map;
  });
  const jokers = hand.filter((id) => !TILES[id].value);
  const found = new Map();
  const add = (ids) => {
    const info = meldInfo(ids);
    if (info) found.set(key(ids), { ...info, jokers: ids.filter((id) => !TILES[id].value).length });
  };
  for (let value = 1; value <= 13; value++) {
    for (let mask = 1; mask < 16; mask++) {
      const ids = byColor.filter((_, c) => mask & (1 << c)).map((map) => map.get(value));
      if (ids.some((id) => id === undefined)) continue;
      for (let j = 0; j <= jokers.length; j++) {
        if (ids.length + j >= 3 && ids.length + j <= 4) add([...ids, ...jokers.slice(0, j)]);
      }
    }
  }
  for (const map of byColor) {
    for (let start = 1; start <= 11; start++) {
      for (let end = start + 2; end <= 13; end++) {
        const ids = [];
        let j = 0;
        for (let value = start; value <= end; value++) ids.push(map.get(value) ?? jokers[j++]);
        if (j <= jokers.length) add(ids);
      }
    }
  }
  return [...found.values()];
}

export function chooseTurn(state) {
  const player = state.turn;
  let best = null;
  // 점수 우선·개수 우선 두 가지를 시도해, 합법적인 수 중 많이 낼 수 있는 쪽을 고른다.
  for (const byPoints of [false, true]) {
    let hand = [...state.hands[player]];
    const table = state.table.map((meld) => [...meld]);
    while (true) {
      const options = candidates(hand).sort((a, b) => byPoints
        ? b.points - a.points || b.order.length - a.order.length
        : b.order.length - a.order.length || a.jokers - b.jokers || b.points - a.points);
      if (!options.length) break;
      const meld = options[0].order;
      table.push(meld);
      hand = hand.filter((id) => !meld.includes(id));
    }
    if (state.opened[player]) {
      let extended = true;
      while (extended) {
        extended = false;
        for (const id of hand) {
          const i = table.findIndex((meld) => meldInfo([...meld, id]));
          if (i < 0) continue;
          table[i] = meldInfo([...table[i], id]).order;
          hand = hand.filter((tile) => tile !== id);
          extended = true;
          break;
        }
      }
    }
    const checked = validateTurn(state, player, table);
    if (checked.ok && (!best || checked.played > best.played
      || (checked.played === best.played && rackScore(hand) < best.score))) {
      best = { table, played: checked.played, score: rackScore(hand) };
    }
  }
  return best ? { type: 'play', table: best.table } : { type: 'draw' };
}
