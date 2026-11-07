import { COLS, ROWS, SIZE, TARGET, generateBoard, sumOf } from './board.js';
import { createDuel, clockText } from '../shared/duel.js';

const GAME_MS = 120_000;
// 사각형이 칸의 가장자리에서 이 비율만큼 들어온 안쪽 영역에 닿으면 선택 (0 = 칸에 닿기만 해도, 0.5 = 중점)
const HIT_INSET = 0.2;
// 내 선택 상자를 상대 화면에 보내는 최소 간격(ms)
const SEL_SEND_MS = 60;
const $ = (id) => document.getElementById(id);

const el = {
  game: $('game'), stage: $('stage'), frame: $('frame'), board: $('board'), selBox: $('sel-box'), oppBox: $('opp-box'),
  timerFill: $('timer-fill'), clock: $('clock'), clockText: $('clock-text'), myScore: $('my-score'),
  oppPanel: $('opp-panel'), oppScore: $('opp-score'),
};

// 대결은 한 판을 둘이 같이 쓴다. 판의 주인은 방장:
// - 방장이 지우면 바로 사라지고 참가자에게 알린다.
// - 참가자는 "이 사과 지울게(claim)"를 보내고, 방장이 확인(clear)해 주면 사라진다. 이미 누가 가져간 사과면 거절(reject).
// - 확인을 기다리는 사과는 흐리게 표시되고 아무도 다시 고를 수 없다.
const state = {
  phase: 'idle', // 'idle' | 'countdown' | 'play' | 'over'
  values: [],
  removed: [], // 판에서 사라진 사과
  locked: [], // 지웠거나 방장 확인을 기다리는 사과 (선택 불가)
  removedCount: 0,
  scores: [0, 0], // [방장(혼자일 때는 나), 참가자]
  pending: new Map(), // 참가자: claim id → 칸들
  claimSeq: 0,
  oppSel: [], // 상대가 지금 고르고 있는 칸
  oppGone: false,
  cleared: false,
  portrait: false,
  cell: 40,
  endsAt: 0,
  timers: [],
  raf: 0,
};

const isPvp = () => duel.mode === 'pvp';
const shared = () => isPvp() && !state.oppGone;
const myIdx = () => (isPvp() && !duel.isHost ? 1 : 0);

const duel = createDuel({
  gameId: 'apple',
  rule: `<div class="rule" role="img" aria-label="합이 10이 되도록 사과를 묶기">
      <span class="apple">4</span><span class="op">+</span><span class="apple">6</span><span class="op">=</span><span class="ten">10</span>
    </div>`,
  chips: [
    { icon: 'clock', text: '2:00', label: '제한 시간 2분' },
    { icon: 'apple', text: '1점', label: '사과 1개당 1점' },
  ],
  levels: true,
  onStart: ({ seed, level }) => newGame(seed, level),
  onMessage(msg) {
    if (msg.t === 'claim' && duel.isHost) onClaim(msg);
    else if (msg.t === 'clear' && !duel.isHost) onRemoteClear(msg);
    else if (msg.t === 'reject' && !duel.isHost) onReject(msg);
    else if (msg.t === 'sel') showOppSel(msg);
    else if (msg.t === 'end' && !duel.isHost) onRemoteEnd(msg);
  },
  onPeerGone() {
    state.oppGone = true;
    showOppSel({ rect: null });
    // 참가자: 방장이 없으니 확인을 기다리던 사과는 내 것으로 확정하고, 이후로는 혼자 이어서 한다
    for (const cells of state.pending.values()) {
      removeCells(cells, true);
      state.scores[myIdx()] += cells.length;
    }
    state.pending.clear();
    renderScores();
    if (state.phase === 'over') renderResult();
  },
  onLeave() {
    stopTimers();
    if (drag) endDrag(false);
    showOppSel({ rect: null });
    state.phase = 'idle';
  },
});

// ---------- 보드 DOM ----------
const cellEls = [];
for (let i = 0; i < SIZE; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  const apple = document.createElement('span');
  apple.className = 'apple';
  cell.append(apple);
  el.board.append(cell);
  cellEls.push(cell);
}

function layout() {
  if (drag) endDrag(false);
  const cs = getComputedStyle(el.stage);
  const border = el.frame.offsetWidth - el.frame.clientWidth;
  const w = el.stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - border;
  const h = el.stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - border;
  // 프레임 = 보드 + 패딩(0.3*2) + 간격(0.3) + 타이머(0.38). 타이머는 가로판이면 오른쪽, 세로판이면 아래
  const fitLandscape = Math.min(w / (COLS + 1.28), h / (ROWS + 0.6));
  const fitPortrait = Math.min(w / (ROWS + 0.6), h / (COLS + 1.28));
  // 가로(17×10)/세로(10×17) 중 사과가 더 크게 나오는 쪽. 두 사람의 화면 방향이 달라도 판은 같다
  const portrait = fitPortrait > fitLandscape;
  state.portrait = portrait;
  el.frame.classList.toggle('portrait', portrait);
  const cols = portrait ? ROWS : COLS;
  const rows = portrait ? COLS : ROWS;
  cellEls.forEach((cell, i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    cell.style.gridRow = String((portrait ? c : r) + 1);
    cell.style.gridColumn = String((portrait ? r : c) + 1);
  });
  state.cell = Math.max(Math.floor(Math.min(portrait ? fitPortrait : fitLandscape, 64)), 14);
  document.documentElement.style.setProperty('--cell', `${state.cell}px`);
  el.board.style.setProperty('--cols', cols);
  el.board.style.setProperty('--rows', rows);
  el.oppBox.hidden = true;
}

let layoutQueued = false;
function queueLayout() {
  if (layoutQueued || el.game.hidden) return;
  layoutQueued = true;
  requestAnimationFrame(() => { layoutQueued = false; layout(); });
}
window.addEventListener('resize', queueLayout);
window.addEventListener('orientationchange', () => setTimeout(queueLayout, 150));
window.visualViewport?.addEventListener('resize', queueLayout);

// ---------- 드래그 선택 ----------
let drag = null;

// 보드 바깥 여백에서 시작해도 드래그되도록 stage 전체에서 받는다
el.stage.addEventListener('pointerdown', (e) => {
  if (state.phase !== 'play' || (drag && e.pointerId !== drag.id && e.pointerType === 'touch')) return;
  if (drag) endDrag(false); // pointerup을 놓친 이전 드래그 정리
  e.preventDefault();
  try { el.stage.setPointerCapture(e.pointerId); } catch { /* 합성 이벤트 등 */ }
  drag = {
    id: e.pointerId,
    x0: e.clientX,
    y0: e.clientY,
    frame: el.frame.getBoundingClientRect(),
    board: el.board.getBoundingClientRect(),
    hitBoxes: cellEls.map((c) => {
      const r = c.getBoundingClientRect();
      const dx = r.width * HIT_INSET;
      const dy = r.height * HIT_INSET;
      return [r.left + dx, r.top + dy, r.right - dx, r.bottom - dy];
    }),
    selected: [],
  };
  el.selBox.hidden = false;
  updateDrag(e);
});
el.stage.addEventListener('pointermove', (e) => { if (drag && e.pointerId === drag.id) updateDrag(e); });
el.stage.addEventListener('pointerup', (e) => { if (drag && e.pointerId === drag.id) endDrag(true); });
el.stage.addEventListener('pointercancel', (e) => { if (drag && e.pointerId === drag.id) endDrag(false); });
// 보드에서는 터치 기본 동작(확대·스크롤) 자체를 끔. pointer 이벤트는 그대로 온다
el.stage.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

function updateDrag(e) {
  const x1 = Math.min(drag.x0, e.clientX);
  const x2 = Math.max(drag.x0, e.clientX);
  const y1 = Math.min(drag.y0, e.clientY);
  const y2 = Math.max(drag.y0, e.clientY);
  const border = el.frame.clientLeft;
  Object.assign(el.selBox.style, {
    left: `${x1 - drag.frame.left - border}px`,
    top: `${y1 - drag.frame.top - border}px`,
    width: `${x2 - x1}px`,
    height: `${y2 - y1}px`,
  });
  drag.selected.forEach((i) => cellEls[i].classList.remove('on'));
  drag.selected = [];
  drag.hitBoxes.forEach(([l, t, r, b], i) => {
    if (!state.locked[i] && x1 <= r && x2 >= l && y1 <= b && y2 >= t) drag.selected.push(i);
  });
  drag.selected.forEach((i) => cellEls[i].classList.add('on'));
  el.selBox.classList.toggle('ok', sumOf(state.values, state.removed, drag.selected) === TARGET);

  // 상대 화면에 내 선택 상자를 보여준다: 화면 방향·크기와 상관없는 판 좌표(행/열 단위)로 보낸다
  const u = (px, origin) => Math.round(((px - origin) / state.cell) * 100) / 100;
  const [dx1, dx2, dy1, dy2] = [u(x1, drag.board.left), u(x2, drag.board.left), u(y1, drag.board.top), u(y2, drag.board.top)];
  sendSel({ rect: state.portrait ? [dx1, dx2, dy1, dy2] : [dy1, dy2, dx1, dx2], cells: drag.selected });
}

function endDrag(commitIt) {
  const picked = drag.selected.filter((i) => !state.locked[i]); // 드래그 중에 상대가 가져간 사과는 뺀다
  drag.selected.forEach((i) => cellEls[i].classList.remove('on'));
  el.selBox.hidden = true;
  el.selBox.classList.remove('ok');
  drag = null;
  sendSel({ rect: null });
  if (commitIt && state.phase === 'play' && picked.length && sumOf(state.values, state.removed, picked) === TARGET) commit(picked);
}

// ---------- 지우기 ----------
function removeCells(cells, mine) {
  cells.forEach((i) => {
    if (state.removed[i]) return;
    state.removed[i] = true;
    state.locked[i] = true;
    state.removedCount += 1;
    const cell = cellEls[i];
    cell.classList.remove('pending', 'opp-on');
    cell.style.setProperty('--dx', `${(Math.random() - 0.5) * 3 * 40}px`);
    cell.style.setProperty('--rot', `${(Math.random() - 0.5) * 540}deg`);
    cell.classList.add('gone');
    if (!mine) cell.classList.add('by-opp'); // 상대가 가져간 사과는 파랗게 변하며 떨어진다
  });
}

function commit(cells) {
  if (shared() && !duel.isHost) {
    // 참가자: 방장 확인을 기다린다 (그동안 흐리게, 아무도 못 고름)
    const id = ++state.claimSeq;
    state.pending.set(id, cells);
    cells.forEach((i) => {
      state.locked[i] = true;
      cellEls[i].classList.add('pending');
    });
    duel.send({ t: 'claim', id, cells });
    return;
  }
  removeCells(cells, true);
  state.scores[myIdx()] += cells.length;
  renderScores();
  if (shared()) duel.send({ t: 'clear', cells, by: 'host', scores: state.scores });
  checkAllCleared();
}

// 방장: 참가자가 지우겠다는 사과가 아직 판에 있고 합이 10이면 확정
function onClaim({ id, cells }) {
  const ok = state.phase !== 'over' && state.phase !== 'idle' && Array.isArray(cells) && cells.length > 0
    && cells.every((i) => Number.isInteger(i) && i >= 0 && i < SIZE && !state.removed[i])
    && new Set(cells).size === cells.length
    && sumOf(state.values, state.removed, cells) === TARGET;
  if (!ok) {
    duel.send({ t: 'reject', id });
    return;
  }
  removeCells(cells, false);
  state.scores[1] += cells.length;
  renderScores();
  duel.send({ t: 'clear', cells, by: 'guest', id, scores: state.scores });
  checkAllCleared();
}

// 참가자: 방장이 확정한 지우기 (방장 것이든 내 것이든)
function onRemoteClear({ cells, by, id, scores }) {
  const mine = by === 'guest';
  if (mine) state.pending.delete(id);
  removeCells(cells, mine);
  state.scores = scores;
  renderScores();
  if (state.phase === 'over') renderResult();
  else checkAllCleared();
}

// 참가자: 한발 늦어서 거절됨 → 흐려졌던 사과를 되돌린다 (그새 방장이 가져간 사과는 이미 사라져 있음)
function onReject({ id }) {
  const cells = state.pending.get(id) || [];
  state.pending.delete(id);
  cells.forEach((i) => {
    cellEls[i].classList.remove('pending');
    if (!state.removed[i]) state.locked[i] = false;
  });
}

function checkAllCleared() {
  if (state.removedCount < SIZE) return;
  state.cleared = true;
  finish();
}

// ---------- 상대 선택 상자 ----------
let selTimer = 0;
let selLast = 0;
let selNext = null;
function sendSel(payload) {
  if (!shared()) return;
  selNext = payload;
  const flush = () => {
    selTimer = 0;
    selLast = performance.now();
    duel.send({ t: 'sel', ...selNext });
  };
  const wait = SEL_SEND_MS - (performance.now() - selLast);
  if (payload.rect === null || wait <= 0) { // 놓았을 때, 또는 간격이 충분히 지났으면 바로
    clearTimeout(selTimer);
    flush();
    return;
  }
  if (!selTimer) selTimer = setTimeout(flush, wait);
}

function showOppSel({ rect, cells = [] }) {
  state.oppSel.forEach((i) => cellEls[i].classList.remove('opp-on'));
  state.oppSel = [];
  if (!rect || state.phase !== 'play') {
    el.oppBox.hidden = true;
    return;
  }
  const [r0, r1, c0, c1] = rect;
  const [x0, x1, y0, y1] = state.portrait ? [r0, r1, c0, c1] : [c0, c1, r0, r1];
  const cell = state.cell;
  const appearing = el.oppBox.hidden;
  if (appearing) el.oppBox.style.transition = 'none'; // 처음 나타날 때는 이전 위치에서 미끄러져 오지 않게
  Object.assign(el.oppBox.style, {
    left: `${el.board.offsetLeft + x0 * cell}px`,
    top: `${el.board.offsetTop + y0 * cell}px`,
    width: `${(x1 - x0) * cell}px`,
    height: `${(y1 - y0) * cell}px`,
  });
  el.oppBox.hidden = false;
  if (appearing) {
    void el.oppBox.offsetWidth;
    el.oppBox.style.transition = '';
  }
  state.oppSel = cells.filter((i) => Number.isInteger(i) && i >= 0 && i < SIZE && !state.removed[i]);
  state.oppSel.forEach((i) => cellEls[i].classList.add('opp-on'));
}

// ---------- 게임 진행 ----------
function newGame(seed, level) {
  stopTimers();
  const { values } = generateBoard(seed, level);
  Object.assign(state, {
    values,
    removed: new Array(SIZE).fill(false),
    locked: new Array(SIZE).fill(false),
    removedCount: 0,
    scores: [0, 0],
    pending: new Map(),
    claimSeq: 0,
    oppSel: [],
    oppGone: duel.oppGone,
    cleared: false,
  });
  cellEls.forEach((cell, i) => {
    cell.className = 'cell';
    cell.firstChild.textContent = values[i];
  });
  renderScores();
  el.oppPanel.hidden = !isPvp();
  el.timerFill.style.setProperty('--left', '1');
  el.timerFill.classList.remove('low');
  renderClock(GAME_MS);
  layout();
  state.phase = 'countdown';
  duel.countdown(play);
}

function play() {
  state.phase = 'play';
  state.endsAt = performance.now() + GAME_MS;
  const tick = () => {
    const left = state.endsAt - performance.now();
    el.timerFill.style.setProperty('--left', String(Math.max(0, left / GAME_MS)));
    el.timerFill.classList.toggle('low', left < 10_000);
    renderClock(left);
    if (left <= 0) finish();
    else state.raf = requestAnimationFrame(tick);
  };
  state.raf = requestAnimationFrame(tick);
  // 탭이 가려져 rAF가 멈춰도 제시간에 끝나도록
  state.timers.push(setTimeout(finish, GAME_MS));
}

function renderClock(leftMs) {
  const text = clockText(Math.ceil(leftMs / 1000));
  if (el.clockText.textContent !== text) el.clockText.textContent = text;
  el.clock.classList.toggle('low', leftMs < 10_000);
}

function renderScores() {
  el.myScore.textContent = state.scores[myIdx()];
  el.oppScore.textContent = state.scores[1 - myIdx()];
}

function finish() {
  if (state.phase !== 'play' && state.phase !== 'countdown') return;
  state.phase = 'over';
  cancelAnimationFrame(state.raf);
  if (!state.cleared) renderClock(0);
  if (drag) endDrag(false);
  showOppSel({ rect: null });
  // 방장이 최종 점수를 알린다 (참가자 쪽 시계가 조금 늦어도 함께 끝나도록)
  if (shared() && duel.isHost) duel.send({ t: 'end', scores: state.scores, cleared: state.cleared });
  renderResult();
}

// 참가자: 방장 쪽 게임이 끝남 → 최종 점수로 같이 끝낸다
function onRemoteEnd({ scores, cleared }) {
  state.scores = scores;
  state.cleared = cleared;
  renderScores();
  if (state.phase === 'over') renderResult();
  else finish();
}

function renderResult() {
  const me = state.scores[myIdx()];
  if (!isPvp()) {
    duel.showResult({
      icon: state.cleared ? 'star' : 'clock',
      tone: state.cleared ? 'gold' : '',
      title: state.cleared ? '올클리어' : '시간 끝',
      scores: [{ side: 'me', icon: 'apple', label: '점수', value: me, win: true }],
    });
    return;
  }
  const opp = state.scores[1 - myIdx()];
  const result = me > opp ? { icon: 'trophy', tone: 'gold', title: '승리' }
    : me < opp ? { icon: 'sad', tone: 'lose', title: '패배' }
      : { icon: 'even', tone: 'even', title: '무승부' };
  duel.showResult({
    ...result,
    scores: [
      { side: 'me', label: '나', value: me, win: me >= opp },
      { side: 'opp', label: '상대', value: opp, win: opp >= me },
    ],
  });
}

function stopTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
  cancelAnimationFrame(state.raf);
  clearTimeout(selTimer);
  selTimer = 0;
}
