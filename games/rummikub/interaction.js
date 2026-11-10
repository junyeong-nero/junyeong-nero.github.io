import { TILES, meldInfo } from './logic.js';

export function meldHint(ids) {
  const info = meldInfo(ids);
  if (info) return `${info.type === 'group' ? '같은 숫자' : '연속 숫자'} · ${info.points}점`;
  if (ids.length < 3) return `${3 - ids.length}개 더 놓으면 조합을 만들 수 있어요`;
  const natural = ids.map((id) => TILES[id]).filter((tile) => tile.value);
  if (natural.every((tile) => tile.value === natural[0].value)) return '같은 숫자는 서로 다른 색이어야 해요';
  if (natural.every((tile) => tile.color === natural[0].color)) return '같은 색은 숫자가 중복·빈틈 없이 이어져야 해요';
  return '같은 숫자끼리, 또는 같은 색의 연속 숫자로 묶으세요';
}

// 드래그와 탭 모두 같은 이동 검증을 쓴다. 첫 등록 전의 테이블과 원래 놓인 타일을 보호한다.
export function moveTiles(match, player, table, rack, ids, target) {
  if (match.winner !== null || match.turn !== player || !ids.length || new Set(ids).size !== ids.length) return null;
  const available = new Set([...table.flat(), ...rack]);
  if (ids.some((id) => !available.has(id))) return null;
  const original = new Set(match.table.flat());
  const isMeld = Number.isInteger(target) && target >= 0 && target < table.length;
  if (!isMeld && target !== 'new' && target !== 'rack') return null;
  if ((target === 'rack' || !match.opened[player]) && ids.some((id) => original.has(id))) return null;
  if (isMeld && !match.opened[player] && table[target].some((id) => original.has(id))) return null;
  const selected = new Set(ids);
  const next = table.map((meld) => meld.filter((id) => !selected.has(id)));
  const hand = rack.filter((id) => !selected.has(id));
  if (target === 'rack') hand.push(...ids);
  else if (isMeld) next[target].push(...ids);
  else next.push([...ids]);
  return { table: next.filter((meld) => meld.length).map((meld) => meldInfo(meld)?.order || meld), rack: hand };
}
