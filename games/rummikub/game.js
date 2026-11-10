import { COLORS, TILES, applyTurn, chooseTurn, createGame, meldInfo, rackScore, validateTurn } from './logic.js';
import { createDuel } from '../shared/duel.js';
import { meldHint, moveTiles } from './interaction.js';

const $ = (id) => document.getElementById(id);
const colorNames = { red: '빨강', blue: '파랑', orange: '주황', black: '검정', joker: '조커' };
const colorMarks = { red: '●', blue: '◆', orange: '▲', black: '■', joker: '★' };
const examples = `<div><span>같은 색 · 연속 숫자</span><div role="img" aria-label="빨강 7, 8, 9">
  <b class="example-tile red">7</b><b class="example-tile red">8</b><b class="example-tile red">9</b></div></div>
  <div><span>같은 숫자 · 다른 색</span><div role="img" aria-label="빨강 7, 파랑 7, 주황 7">
  <b class="example-tile red">7</b><b class="example-tile blue">7</b><b class="example-tile orange">7</b></div></div>`;
$('rules-examples').innerHTML = examples;
let drag = null, ignoreClickUntil = 0;
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
    </div><p class="rule-caption"><strong>3개 이상 묶어 내고, 손패를 먼저 비우세요.</strong><br>같은 색의 연속 숫자, 또는 다른 색의 같은 숫자.</p>`,
  chips: [
    { icon: 'check', text: '첫 등록 30점', label: '첫 등록은 손패로 30점 이상' },
    { icon: 'hash', text: '14개', label: '시작 손패는 14개' },
  ],
  solo: { icon: 'bot', label: 'AI 대전' },
  onStart({ seed, mode }) {
    clearTimeout(state.timer);
    Object.assign(state, {
      phase: 'play', match: createGame(seed), me: mode === 'pvp' && !duel.isHost ? 1 : 0,
      lastMove: '낼 조합이 없다면 1개를 뽑으세요.',
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
    cancelDrag();
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
  cancelDrag();
  state.draft = state.match.table.map((meld) => [...meld]);
  state.rack = [...state.match.hands[state.me]];
  state.selected.clear();
}

function pieceHtml(id, locked = false) {
  const tile = TILES[id];
  const selected = state.selected.has(id);
  const label = tile.value ? `${colorNames[tile.color]} ${tile.value}` : '조커';
  return `<button type="button" class="piece ${tile.color}${selected ? ' selected' : ''}"
    data-tile="${id}" draggable="false" aria-label="${label}" aria-pressed="${selected}" ${locked ? 'disabled' : ''}>
    <b>${tile.value || '★'}</b><small aria-hidden="true">${tile.value ? colorMarks[tile.color] : 'JOKER'}</small></button>`;
}

function render() {
  cancelDrag();
  const { match, me } = state;
  const activeTile = document.activeElement?.dataset.tile;
  const activeId = document.activeElement?.id;
  const mine = myTurn();
  const original = new Set(match.table.flat());
  const hand = new Set(match.hands[me]);
  const played = state.draft.flat().filter((id) => hand.has(id)).length;
  const changed = JSON.stringify(state.draft) !== JSON.stringify(match.table);
  $('me-count').textContent = state.rack.length;
  $('opp-count').textContent = match.hands[1 - me].length;
  $('me-opened').textContent = match.opened[me] ? '테이블 재배치 가능' : '처음에는 합계 30점';
  $('opp-opened').textContent = match.opened[1 - me] ? '첫 조합 완료' : '첫 조합 전';
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
    return `<div class="meld ${info ? '' : 'invalid'} ${fresh ? 'fresh' : ''}" data-drop="${i}" aria-label="조합 ${i + 1}">
      <div class="meld-tiles">${(info?.order || meld).map((id) => pieceHtml(id, !mine || locked)).join('')}</div>
      <div class="meld-head"><span>${meldHint(meld)}${locked ? ' · 첫 조합 후 사용' : ''}</span>
        <button class="place" type="button" data-place="${i}" aria-label="조합 ${i + 1}에 놓기"
          ${!mine || locked || !state.selected.size ? 'hidden' : ''}>여기에 놓기</button></div>
    </div>`;
  }).join('') : `<div class="empty-table"><strong>이렇게 3개 이상 묶어 내세요</strong><div class="examples">${examples}</div></div>`;
  $('rack-count').textContent = state.rack.length;
  $('rack').innerHTML = sorted(state.rack).map((id) => pieceHtml(id, !mine)).join('')
    || '<p class="empty-rack">턴을 마치면 승리!</p>';

  $('new-meld').disabled = !mine;
  $('new-meld').textContent = state.selected.size ? `+ 선택한 ${state.selected.size}개로 새 조합 만들기` : '+ 여기에 타일을 끌어 새 조합 만들기';
  $('selection-bar').hidden = !state.selected.size;
  $('selection-count').textContent = `${state.selected.size}개 선택`;
  $('to-rack').hidden = [...state.selected].every((id) => state.rack.includes(id));
  $('to-rack').disabled = !mine || [...state.selected].some((id) => original.has(id));
  $('clear-selection').disabled = !state.selected.size;
  $('undo').disabled = !mine || !changed;
  $('draw').disabled = !mine;
  $('draw').textContent = match.pool.length ? (changed ? '되돌리고 1개 뽑기' : '1개 뽑고 넘기기')
    : (changed ? '되돌리고 패스' : '패스');
  const checked = validateTurn(match, me, state.draft);
  $('commit').disabled = !mine || !checked.ok;
  $('commit').textContent = played ? `${played}개 내고 턴 마치기` : '턴 마치기';
  $('sort-color').setAttribute('aria-pressed', String(state.sort === 'color'));
  $('sort-number').setAttribute('aria-pressed', String(state.sort === 'number'));
  const points = state.draft.reduce((sum, meld) => sum + (meld.every((id) => hand.has(id)) ? meldInfo(meld)?.points || 0 : 0), 0);
  $('move-status').textContent = state.phase === 'over' ? '게임이 끝났어요.'
    : !mine ? '상대의 턴이 끝나면 타일을 옮길 수 있어요.'
    : state.selected.size ? `${state.selected.size}개 선택 · 함께 끌거나, 놓을 곳을 누르세요.`
      : changed && !checked.ok ? !match.opened[me] && state.draft.every(meldInfo)
        ? `처음에는 합계 30점 · 현재 ${points}점${points < 30 ? `, ${30 - points}점 더 필요해요.` : ''}` : checked.error
      : checked.ok ? '조합 완성! 아래의 턴 마치기를 눌러 확정하세요.'
      : !match.opened[me] ? '처음에는 내 타일로 합계 30점 이상. 여러 조합을 합쳐도 돼요.'
        : '내 타일을 기존 조합에 붙이거나, 새 조합을 만드세요.';
  $('move-status').classList.toggle('ready', mine && checked.ok);
  if (activeTile !== undefined) document.querySelector(`[data-tile="${activeTile}"]`)?.focus({ preventScroll: true });
  else if (activeId) $(activeId)?.focus({ preventScroll: true });
}

function moveSelected(target, ids = [...state.selected]) {
  if (!myTurn()) return;
  const next = moveTiles(state.match, state.me, state.draft, state.rack, ids, target);
  if (!next) return;
  state.draft = next.table;
  state.rack = next.rack;
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
  else if (!tile) {
    const zone = e.target.closest('[data-drop]');
    if (zone?.classList.contains('meld')) moveSelected(Number(zone.dataset.drop));
    else if (zone?.id === 'table') moveSelected('new');
  }
});
$('new-meld').addEventListener('click', () => moveSelected('new'));
$('to-rack').addEventListener('click', () => moveSelected('rack'));
$('clear-selection').addEventListener('click', () => { state.selected.clear(); render(); });
$('undo').addEventListener('click', () => { if (myTurn()) { resetDraft(); render(); } });
for (const sort of ['color', 'number']) {
  $(`sort-${sort}`).addEventListener('click', () => { state.sort = sort; render(); });
}
// Pointer Events로 터치와 마우스를 동일하게 처리한다. 이동이 없는 탭은 선택으로 남긴다.
function cancelDrag() {
  if (!drag) return;
  const previous = drag;
  drag = null;
  cancelAnimationFrame(previous.frame);
  previous.preview?.remove();
  previous.zone?.classList.remove('drop-hover');
  document.querySelectorAll('.drag-source').forEach((tile) => tile.classList.remove('drag-source'));
  if ($('game').hasPointerCapture(previous.pointer)) $('game').releasePointerCapture(previous.pointer);
}

function updateDrop() {
  drag.zone?.classList.remove('drop-hover');
  const zone = document.elementFromPoint(drag.x, drag.y)?.closest('[data-drop]');
  const value = zone?.dataset.drop;
  const target = value === 'new' || value === 'rack' ? value : Number(value);
  const valid = zone && moveTiles(state.match, state.me, state.draft, state.rack, drag.ids, target);
  drag.zone = valid ? zone : null;
  drag.target = valid ? target : null;
  drag.zone?.classList.add('drop-hover');
  drag.preview.style.transform = `translate(${drag.x - drag.width / 2}px, ${drag.y - drag.height - 12}px)`;
}

function dragFrame() {
  if (!drag?.active) return;
  for (const el of [$('table'), $('rack'), $('game')]) {
    const r = el.getBoundingClientRect();
    if (drag.x < r.left || drag.x > r.right || drag.y < r.top || drag.y > r.bottom) continue;
    const delta = drag.y < r.top + 30 ? -8 : drag.y > r.bottom - 30 ? 8 : 0;
    const before = el.scrollTop;
    el.scrollTop += delta;
    if (el.scrollTop !== before) break;
  }
  updateDrop();
  drag.frame = requestAnimationFrame(dragFrame);
}

$('game').addEventListener('pointerdown', (e) => {
  if (!e.isPrimary || e.button !== 0 || drag) return;
  ignoreClickUntil = 0;
  const tile = e.target.closest('[data-tile]');
  if (!tile || tile.disabled || !myTurn()) return;
  const id = Number(tile.dataset.tile), r = tile.getBoundingClientRect();
  tile.focus({ preventScroll: true });
  drag = { pointer: e.pointerId, id, ids: state.selected.has(id) ? [...state.selected] : [id],
    x: e.clientX, y: e.clientY, startX: e.clientX, startY: e.clientY, width: r.width, height: r.height,
    source: tile, active: false, preview: null, zone: null, target: null, frame: 0 };
  $('game').setPointerCapture(e.pointerId);
});
$('game').addEventListener('pointermove', (e) => {
  if (!drag || drag.pointer !== e.pointerId) return;
  drag.x = e.clientX; drag.y = e.clientY;
  if (!drag.active && Math.hypot(drag.x - drag.startX, drag.y - drag.startY) >= 8) {
    drag.active = true;
    const preview = document.createElement('div');
    preview.className = 'drag-preview';
    preview.setAttribute('aria-hidden', 'true');
    const copy = drag.source.cloneNode(true);
    copy.removeAttribute('data-tile');
    copy.tabIndex = -1;
    preview.append(copy);
    if (drag.ids.length > 1) {
      const count = document.createElement('span');
      count.textContent = `${drag.ids.length}개`;
      preview.append(count);
    }
    document.body.append(preview);
    drag.preview = preview;
    drag.ids.forEach((id) => document.querySelector(`[data-tile="${id}"]`)?.classList.add('drag-source'));
    $('move-status').textContent = '놓을 곳이 파랗게 표시되면 손을 떼세요. Esc 키로 취소할 수 있어요.';
    dragFrame();
  }
  if (drag.active) { e.preventDefault(); updateDrop(); }
});
$('game').addEventListener('pointerup', (e) => {
  if (!drag || drag.pointer !== e.pointerId) return;
  if (drag.active) { drag.x = e.clientX; drag.y = e.clientY; updateDrop(); }
  const { active, id, ids, target } = drag;
  cancelDrag();
  ignoreClickUntil = performance.now() + 400;
  if (active && target !== null) moveSelected(target, ids);
  else {
    if (!active) {
      if (state.selected.has(id)) state.selected.delete(id);
      else state.selected.add(id);
    }
    render();
  }
});
$('game').addEventListener('click', (e) => {
  if (e.detail && performance.now() < ignoreClickUntil) { e.preventDefault(); e.stopImmediatePropagation(); }
}, true);
function abortDrag() { if (drag) { cancelDrag(); render(); } }
for (const name of ['pointercancel', 'lostpointercapture']) $('game').addEventListener(name, (e) => {
  if (drag?.pointer === e.pointerId) abortDrag();
});
window.addEventListener('blur', abortDrag);
document.addEventListener('visibilitychange', () => { if (document.hidden) abortDrag(); });
$('game').addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (drag) abortDrag();
  else { state.selected.clear(); render(); }
});
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
