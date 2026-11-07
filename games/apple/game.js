import { COLS, ROWS, SIZE, TARGET, generateBoard, sumOf } from './board.js';
import { createDuel, clockText } from '../shared/duel.js';

const GAME_MS = 120_000;
// 사각형이 칸의 가장자리에서 이 비율만큼 들어온 안쪽 영역에 닿으면 선택 (0 = 칸에 닿기만 해도, 0.5 = 중점)
const HIT_INSET = 0.2;
const $ = (id) => document.getElementById(id);

const el = {
  game: $('game'), stage: $('stage'), frame: $('frame'), board: $('board'), selBox: $('sel-box'),
  timerFill: $('timer-fill'), clock: $('clock'), clockText: $('clock-text'), myScore: $('my-score'),
  oppPanel: $('opp-panel'), oppScore: $('opp-score'), oppMini: $('opp-mini'),
};

const state = {
  phase: 'idle', // 'idle' | 'countdown' | 'play' | 'over'
  values: [],
  removed: [],
  score: 0,
  endsAt: 0,
  cleared: false,
  opp: { score: 0, finished: false, gone: false },
  timers: [],
  raf: 0,
};

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
    if (msg.t === 'clear') {
      state.opp.score = msg.score;
      el.oppScore.textContent = msg.score;
      msg.cells.forEach((i) => {
        minis[i]?.classList.add('gone');
        // 내 판의 같은 자리에 표시: 파란 테두리가 번챍이고 점으로 남는다 (내 사과는 그대로 지울 수 있음)
        if (cells[i] && !state.removed[i]) cells[i].classList.add('opp-taken', 'opp-flash');
      });
    } else if (msg.t === 'end') {
      state.opp.score = msg.score;
      state.opp.finished = true;
      el.oppScore.textContent = msg.score;
      if (state.phase === 'over') renderResult();
    }
  },
  onPeerGone() {
    state.opp.gone = true;
    if (state.phase === 'over') renderResult();
  },
  onLeave() {
    stopTimers();
    if (drag) endDrag(false);
    state.phase = 'idle';
  },
});

// ---------- 보드 DOM ----------
const cells = [];
const minis = [];
for (let i = 0; i < SIZE; i++) {
  const cell = document.createElement('div');
  cell.className = 'cell';
  const apple = document.createElement('span');
  apple.className = 'apple';
  cell.append(apple);
  el.board.append(cell);
  cells.push(cell);
  const dot = document.createElement('i');
  el.oppMini.append(dot);
  minis.push(dot);
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
  // 가로(17×10)/세로(10×17) 중 사과가 더 크게 나오는 쪽
  const portrait = fitPortrait > fitLandscape;
  el.frame.classList.toggle('portrait', portrait);
  const cols = portrait ? ROWS : COLS;
  const rows = portrait ? COLS : ROWS;
  cells.forEach((cell, i) => {
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    cell.style.gridRow = String((portrait ? c : r) + 1);
    cell.style.gridColumn = String((portrait ? r : c) + 1);
  });
  const size = Math.floor(Math.min(portrait ? fitPortrait : fitLandscape, 64));
  document.documentElement.style.setProperty('--cell', `${Math.max(size, 14)}px`);
  el.board.style.setProperty('--cols', cols);
  el.board.style.setProperty('--rows', rows);
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
    hitBoxes: cells.map((c) => {
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
  drag.selected.forEach((i) => cells[i].classList.remove('on'));
  drag.selected = [];
  drag.hitBoxes.forEach(([l, t, r, b], i) => {
    if (!state.removed[i] && x1 <= r && x2 >= l && y1 <= b && y2 >= t) drag.selected.push(i);
  });
  drag.selected.forEach((i) => cells[i].classList.add('on'));
  el.selBox.classList.toggle('ok', sumOf(state.values, state.removed, drag.selected) === TARGET);
}

function endDrag(commit) {
  const { selected } = drag;
  selected.forEach((i) => cells[i].classList.remove('on'));
  el.selBox.hidden = true;
  el.selBox.classList.remove('ok');
  drag = null;
  if (commit && state.phase === 'play' && sumOf(state.values, state.removed, selected) === TARGET) clear(selected);
}

function clear(indices) {
  indices.forEach((i) => {
    state.removed[i] = true;
    const cell = cells[i];
    cell.style.setProperty('--dx', `${(Math.random() - 0.5) * 3 * 40}px`);
    cell.style.setProperty('--rot', `${(Math.random() - 0.5) * 540}deg`);
    cell.classList.add('gone');
  });
  state.score += indices.length;
  el.myScore.textContent = state.score;
  duel.send({ t: 'clear', cells: indices, score: state.score });
  if (state.score === SIZE) {
    state.cleared = true;
    finish();
  }
}

// ---------- 게임 진행 ----------
function newGame(seed, level) {
  stopTimers();
  const { values } = generateBoard(seed, level);
  state.values = values;
  state.removed = new Array(SIZE).fill(false);
  state.score = 0;
  state.cleared = false;
  state.opp = { score: 0, finished: false, gone: duel.oppGone };
  cells.forEach((cell, i) => {
    cell.className = 'cell';
    cell.firstChild.textContent = values[i];
  });
  minis.forEach((m) => { m.className = ''; });
  el.myScore.textContent = '0';
  el.oppScore.textContent = '0';
  el.oppPanel.hidden = duel.mode !== 'pvp';
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

function finish() {
  if (state.phase !== 'play') return;
  state.phase = 'over';
  cancelAnimationFrame(state.raf);
  if (!state.cleared) renderClock(0);
  if (drag) endDrag(false);
  duel.send({ t: 'end', score: state.score });
  renderResult();
}

function renderResult() {
  const me = state.score;
  if (duel.mode !== 'pvp') {
    duel.showResult({
      icon: state.cleared ? 'star' : 'clock',
      tone: state.cleared ? 'gold' : '',
      title: state.cleared ? '올클리어' : '시간 끝',
      scores: [{ side: 'me', icon: 'apple', label: '점수', value: me, win: true }],
    });
    return;
  }
  const opp = state.opp;
  let result = { icon: 'hourglass', tone: '', title: '상대 진행 중' };
  if (opp.finished || opp.gone) {
    if (me > opp.score) result = { icon: 'trophy', tone: 'gold', title: '승리' };
    else if (me < opp.score) result = { icon: 'sad', tone: 'lose', title: '패배' };
    else result = { icon: 'even', tone: 'even', title: '무승부' };
  }
  duel.showResult({
    ...result,
    scores: [
      { side: 'me', label: '나', value: me, win: me >= opp.score },
      { side: 'opp', label: '상대', value: opp.score, win: opp.score >= me },
    ],
  });
}

function stopTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
  cancelAnimationFrame(state.raf);
}
