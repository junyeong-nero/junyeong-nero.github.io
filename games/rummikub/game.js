import { COLORS, TILES, applyTurn, chooseTurn, createGame, meldInfo, rackScore, validateTurn } from './logic.js';
import { createDuel } from '../shared/duel.js';

const $ = (id) => document.getElementById(id);
const colorNames = { red: '빨강', blue: '파랑', orange: '주황', black: '검정', joker: '조커' };
const colorMarks = { red: '●', blue: '◆', orange: '▲', black: '■', joker: '★' };
const state = {
  phase: 'idle', match: null, me: 0, draft: [], rack: [], selected: new Set(),
  sort: 'color', timer: 0, lastMove: '',
};
const myTurn = () => state.phase === 'play' && state.match.turn === state.me;
const isPvp = () => duel.mode === 'pvp';
const opponent = () => isPvp() ? '상대' : 'AI';

const duel = createDuel({
  gameId: 'rummikub',
  rule: `<div class="rule" role="img" aria-label="같은 색상의 7, 8, 9 타일을 조합">
    ${[7, 8, 9].map((n) => `<span class="piece red"><b>${n}</b><small>●</small></span>`).join('')}
    </div><p class="rule-caption">손패를 먼저 비우세요</p>`,
  chips: [
    { icon: 'check', text: '첫 등록 30점', label: '첫 등록은 손패로 30점 이상' },
    { icon: 'hash', text: '14개', label: '시작 손패는 14개' },
  ],
  solo: { icon: 'bot', label: 'AI 대전' },
  onStart({ seed, mode }) {
    clearTimeout(state.timer);
    Object.assign(state, {
      phase: 'play', match: createGame(seed), me: mode === 'pvp' && !duel.isHost ? 1 : 0,
      lastMove: '각자 14개의 타일로 시작해요.',
    });
    resetDraft();
    startTurn();
  },
  onMessage(msg) {
    if (state.phase !== 'play' || !msg || msg.t !== 'turn' || myTurn()
      || msg.seed !== state.match.seed || msg.n !== state.match.revision) return;
    takeTurn(1 - state.me, msg.action);
  },
  onPeerGone() {
    if (state.phase === 'play') { resetDraft(); finish(state.me, '상대 연결 끊김'); }
  },
  onLeave() {
    clearTimeout(state.timer);
    state.phase = 'idle';
    state.selected.clear();
  },
});

function sorted(ids) {
  return [...ids].sort((a, b) => {
    const x = TILES[a], y = TILES[b];
    if (!x.value || !y.value) return (!x.value - !y.value) || a - b;
    return state.sort === 'number' ? x.value - y.value || a - b
      : COLORS.indexOf(x.color) - COLORS.indexOf(y.color) || x.value - y.value || a - b;
  });
}

function resetDraft() {
  state.draft = state.match.table.map((meld) => [...meld]);
  state.rack = [...state.match.hands[state.me]];
  state.selected.clear();
}

function pieceHtml(id, locked = false) {
  const tile = TILES[id];
  const selected = state.selected.has(id);
  const label = tile.value ? `${colorNames[tile.color]} ${tile.value}` : '조커';
  return `<button type="button" class="piece ${tile.color}${selected ? ' selected' : ''}"
    data-tile="${id}" aria-label="${label}" aria-pressed="${selected}" ${locked ? 'disabled' : ''}>
    <b>${tile.value || '★'}</b><small aria-hidden="true">${tile.value ? colorMarks[tile.color] : 'JOKER'}</small></button>`;
}

function render() {
  const { match, me } = state;
  const activeTile = document.activeElement?.dataset.tile;
  const activeId = document.activeElement?.id;
  const mine = myTurn();
  const original = new Set(match.table.flat());
  const hand = new Set(match.hands[me]);
  const played = state.draft.flat().filter((id) => hand.has(id)).length;
  const changed = JSON.stringify(state.draft) !== JSON.stringify(match.table);
  $('me-count').textContent = match.hands[me].length;
  $('opp-count').textContent = match.hands[1 - me].length;
  $('me-opened').textContent = match.opened[me] ? '등록 완료' : '등록 전 · 30점 필요';
  $('opp-opened').textContent = match.opened[1 - me] ? '등록 완료' : '등록 전';
  $('opp-name').textContent = opponent();
  $('pool-count').textContent = match.pool.length;
  $('me-panel').classList.toggle('turn', mine);
  $('opp-panel').classList.toggle('turn', state.phase === 'play' && !mine);
  $('turn-status').textContent = state.phase === 'over' ? '게임 종료'
    : `${mine ? '내 차례' : `${opponent()} 차례`} · ${state.lastMove}`;
  $('table-count').textContent = `${state.draft.length}개 조합`;
  $('table').innerHTML = state.draft.length ? state.draft.map((meld, i) => {
    const info = meldInfo(meld);
    const fresh = meld.some((id) => hand.has(id));
    const locked = !match.opened[me] && meld.some((id) => original.has(id));
    return `<div class="meld ${info ? '' : 'invalid'} ${fresh ? 'fresh' : ''}" aria-label="조합 ${i + 1}">
      <div class="meld-head"><span>${info ? `${info.type === 'group' ? '그룹' : '연속'} · ${info.points}점` : '미완성 조합'}</span>
        <button class="place" type="button" data-place="${i}" aria-label="조합 ${i + 1}에 놓기"
          ${!mine || locked || !state.selected.size ? 'disabled' : ''}>여기에 놓기 +</button></div>
      <div class="meld-tiles">${(info?.order || meld).map((id) => pieceHtml(id, !mine || locked)).join('')}</div>
    </div>`;
  }).join('') : '<p class="empty-table">아직 놓인 타일이 없어요.<br>손패에서 조합을 골라 첫 등록을 해 보세요.</p>';
  $('rack-count').textContent = state.rack.length;
  $('rack').innerHTML = sorted(state.rack).map((id) => pieceHtml(id, !mine)).join('')
    || '<p class="empty-rack">턴을 마치면 승리!</p>';

  $('new-meld').disabled = !mine || !state.selected.size;
  $('to-rack').disabled = !mine || !state.selected.size || [...state.selected].some((id) => original.has(id));
  $('clear-selection').disabled = !state.selected.size;
  $('undo').disabled = !mine || !changed;
  $('draw').disabled = !mine;
  $('draw').textContent = match.pool.length ? (changed ? '되돌리고 1개 뽑기' : '1개 뽑고 넘기기')
    : (changed ? '되돌리고 패스' : '패스');
  $('commit').disabled = !mine || !played;
  $('commit').textContent = match.opened[me] ? `턴 마치기${played ? ` · ${played}개` : ''}` : '등록 완료';
  $('sort-color').setAttribute('aria-pressed', String(state.sort === 'color'));
  $('sort-number').setAttribute('aria-pressed', String(state.sort === 'number'));
  const points = state.draft.reduce((sum, meld) => sum + (meld.every((id) => hand.has(id)) ? meldInfo(meld)?.points || 0 : 0), 0);
  $('move-status').textContent = state.phase === 'over' ? '게임이 끝났어요.'
    : !mine ? '상대의 턴이 끝나면 타일을 옮길 수 있어요.'
    : state.selected.size ? `${state.selected.size}개 선택 · 새 조합 또는 ‘여기에 놓기’를 누르세요.`
      : !match.opened[me] ? `첫 등록 ${points} / 30점 · 손패만으로 조합을 만드세요.`
        : '타일 선택 → 새 조합 / 여기에 놓기 · 테이블 타일도 재배치할 수 있어요.';
  if (activeTile !== undefined) document.querySelector(`[data-tile="${activeTile}"]`)?.focus({ preventScroll: true });
  else if (activeId) $(activeId)?.focus({ preventScroll: true });
}

// 선택 → 목적지 방식으로 마우스·터치·키보드에서 같은 재배치 동작을 쓴다.
function moveSelected(target) {
  if (!myTurn() || !state.selected.size) return;
  const ids = [...state.selected];
  if (target === 'rack' && ids.some((id) => !state.match.hands[state.me].includes(id))) return;
  const destination = typeof target === 'number' ? state.draft[target] : null;
  if (destination && !state.match.opened[state.me]
    && destination.some((id) => !state.match.hands[state.me].includes(id))) return;
  const next = state.draft.map((meld) => meld.filter((id) => !state.selected.has(id)));
  state.rack = state.rack.filter((id) => !state.selected.has(id));
  if (target === 'rack') state.rack.push(...ids);
  else if (destination) next[target].push(...ids);
  else next.push(ids);
  state.draft = next.filter((meld) => meld.length).map((meld) => meldInfo(meld)?.order || meld);
  state.selected.clear();
  render();
}

$('game').addEventListener('click', (e) => {
  const tile = e.target.closest('[data-tile]');
  if (tile && !tile.disabled && myTurn()) {
    const id = Number(tile.dataset.tile);
    if (state.selected.has(id)) state.selected.delete(id);
    else state.selected.add(id);
    render();
  }
  const place = e.target.closest('[data-place]');
  if (place && !place.disabled) moveSelected(Number(place.dataset.place));
});
$('new-meld').addEventListener('click', () => moveSelected('new'));
$('to-rack').addEventListener('click', () => moveSelected('rack'));
$('clear-selection').addEventListener('click', () => { state.selected.clear(); render(); });
$('undo').addEventListener('click', () => { if (myTurn()) { resetDraft(); render(); } });
for (const sort of ['color', 'number']) {
  $(`sort-${sort}`).addEventListener('click', () => { state.sort = sort; render(); });
}
$('draw').addEventListener('click', () => { if (myTurn()) sendTurn({ type: 'draw' }); });
$('commit').addEventListener('click', () => {
  if (!myTurn()) return;
  const checked = validateTurn(state.match, state.me, state.draft);
  if (!checked.ok) { duel.toast(checked.error); return; }
  sendTurn({ type: 'play', table: state.draft.map((meld) => [...meld]) });
});
$('show-rules').addEventListener('click', () => $('rules').showModal());

function sendTurn(action) {
  const { seed, revision } = state.match;
  if (takeTurn(state.me, action)) duel.send({ t: 'turn', seed, n: revision, action });
}

function takeTurn(player, action) {
  const result = applyTurn(state.match, player, action);
  if (!result.ok) return false;
  const name = player === state.me ? '나' : opponent();
  const count = state.match.hands[player].length - result.state.hands[player].length;
  state.lastMove = action.type === 'play' ? `${name}: ${count}개 내려놓음`
    : state.match.pool.length ? `${name}: 타일 1개 뽑음` : `${name}: 패스`;
  state.match = result.state;
  resetDraft();
  if (state.match.winner !== null) {
    finish(state.match.winner, state.match.reason === 'blocked' ? '연속 패스 · 남은 손패 점수로 결정' : '손패를 모두 내려놓았어요');
  } else startTurn();
  return true;
}

function startTurn() {
  clearTimeout(state.timer);
  render();
  if (!isPvp() && !myTurn()) {
    state.timer = setTimeout(() => {
      if (state.phase === 'play') takeTurn(1 - state.me, chooseTurn(state.match));
    }, 650);
  }
}

function finish(winner, reason) {
  clearTimeout(state.timer);
  state.phase = 'over';
  state.selected.clear();
  render();
  state.timer = setTimeout(() => {
    const draw = winner === -1;
    const won = winner === state.me;
    duel.showResult({
      icon: draw ? 'even' : won ? 'trophy' : 'sad',
      tone: draw ? 'even' : won ? 'gold' : 'lose',
      title: draw ? '무승부' : won ? '승리' : '패배',
      status: reason,
      scores: [state.me, 1 - state.me].map((player) => ({
        side: player === state.me ? 'me' : 'opp',
        icon: player === state.me || isPvp() ? 'user' : 'bot',
        label: player === state.me ? '나' : opponent(),
        value: `${state.match.hands[player].length}개`,
        sub: `남은 점수 ${rackScore(state.match.hands[player])}점`,
        win: winner === player,
      })),
    });
  }, 500);
}
