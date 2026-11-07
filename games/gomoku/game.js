import { BLACK, EMPTY, N, SIZE, WHITE, canPlace, chooseMove, isForbidden, winLine } from './logic.js';
import { createDuel, clockText } from '../shared/duel.js';

const TURN_MS = 30_000; // 대결: 한 수 제한 시간
const GRACE_MS = 5_000; // 상대 시간이 다 됐는데 소식이 없을 때 더 기다리는 시간
const AI_DELAY_MS = 350;
const $ = (id) => document.getElementById(id);

const el = {
  game: $('game'), stage: $('stage'), board: $('board'), clock: $('clock'), clockText: $('clock-text'),
  mePanel: $('me-panel'), meDot: $('me-dot'), oppPanel: $('opp-panel'), oppDot: $('opp-dot'), oppName: $('opp-name'),
};

const state = {
  phase: 'idle', // 'idle' | 'countdown' | 'play' | 'over'
  board: new Int8Array(SIZE),
  moves: [],
  turn: BLACK,
  me: BLACK,
  level: 'normal',
  ghost: -1,
  turnEndsAt: 0,
  result: null, // { winner, line, reason }
  timers: [],
  clock: 0,
};

const isPvp = () => duel.mode === 'pvp';
const opp = () => 3 - state.me;
const colorName = (c) => (c === BLACK ? '흑' : '백');
const dotHtml = (c) => `<i class="dot ${c === BLACK ? 'b' : 'w'}"></i>`;

const ruleStones = ['b', 'b', 'b', 'b', 'b'].map((c) => `<i class="dot ${c} win"></i>`).join('');

const duel = createDuel({
  gameId: 'gomoku',
  rule: `<div class="rule" role="img" aria-label="돌 5개를 한 줄로">${ruleStones}</div>`,
  chips: [
    { icon: 'x', text: '삼삼 금지', label: '열린 3을 동시에 두 개 만드는 수 금지' },
    { icon: 'clock', text: '수당 30초', label: '대결은 한 수에 30초' },
  ],
  levels: true,
  levelsSoloOnly: true,
  solo: { icon: 'bot', label: 'AI' },
  onStart: ({ seed, level, mode }) => newGame(seed, level, mode),
  onMessage(msg) {
    // 상대 쪽 3·2·1이 조금 먼저 끝났을 수도 있으니 카운트다운 중에 온 수도 받는다
    if (state.phase !== 'play' && state.phase !== 'countdown') return;
    if (msg.t === 'move') {
      const i = msg.i;
      if (state.turn !== opp() || msg.n !== state.moves.length || !Number.isInteger(i) || !canPlace(state.board, i, opp())) return;
      place(i, opp());
    } else if (msg.t === 'timeout') {
      finish(state.me, null, '상대 시간 초과');
    }
  },
  onPeerGone() {
    if (state.phase === 'play' || state.phase === 'countdown') finish(state.me, null, '상대 연결 끊김');
  },
  onLeave() {
    stopTimers();
    state.phase = 'idle';
  },
});

// ---------- 판 DOM ----------
const pts = [];
(() => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  svg.setAttribute('class', 'lines');
  svg.setAttribute('viewBox', `0 0 ${N} ${N}`);
  svg.setAttribute('aria-hidden', 'true');
  for (let k = 0; k < N; k++) {
    for (const [x1, y1, x2, y2] of [[0.5, k + 0.5, N - 0.5, k + 0.5], [k + 0.5, 0.5, k + 0.5, N - 0.5]]) {
      const line = document.createElementNS(ns, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('vector-effect', 'non-scaling-stroke');
      svg.append(line);
    }
  }
  for (const [r, c] of [[3, 3], [3, 11], [7, 7], [11, 3], [11, 11]]) {
    const dot = document.createElementNS(ns, 'circle');
    dot.setAttribute('cx', c + 0.5);
    dot.setAttribute('cy', r + 0.5);
    dot.setAttribute('r', 0.12);
    svg.append(dot);
  }
  el.board.append(svg);
  for (let i = 0; i < SIZE; i++) {
    const p = document.createElement('div');
    p.className = 'pt';
    el.board.append(p);
    pts.push(p);
  }
})();

function layout() {
  const cs = getComputedStyle(el.stage);
  const w = el.stage.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) - 8;
  const h = el.stage.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom) - 8;
  // 판 = 15칸 + 안쪽 여백(0.2*2)
  const size = Math.floor(Math.min(w, h) / (N + 0.4));
  document.documentElement.style.setProperty('--cell', `${Math.max(Math.min(size, 44), 16)}px`);
}
window.addEventListener('resize', () => { if (!el.game.hidden) layout(); });
window.visualViewport?.addEventListener('resize', () => { if (!el.game.hidden) layout(); });

// ---------- 입력 ----------
// 가장 가까운 교차점 (판 = 테두리 + 안쪽 여백 0.2칸 + 15칸)
function pointAt(e) {
  const r = el.board.getBoundingClientRect();
  const border = el.board.clientLeft;
  const cell = (r.width - border * 2) / (N + 0.4);
  const pad = cell * 0.2;
  const c = Math.floor((e.clientX - r.left - border - pad) / cell);
  const row = Math.floor((e.clientY - r.top - border - pad) / cell);
  return c >= 0 && c < N && row >= 0 && row < N ? row * N + c : -1;
}

const myTurn = () => state.phase === 'play' && state.turn === state.me;

// 터치: 한 번 탭 = 미리 보기, 같은 곳 한 번 더 = 착수. 마우스: 올리면 미리 보기, 클릭하면 착수
el.board.addEventListener('pointerdown', (e) => {
  e.preventDefault();
  if (!myTurn()) return;
  const i = pointAt(e);
  if (i < 0 || state.board[i] !== EMPTY) return;
  if (isForbidden(state.board, i, state.me)) {
    duel.toast('삼삼 금지');
    return;
  }
  if (e.pointerType === 'mouse' || state.ghost === i) {
    setGhost(-1);
    myMove(i);
  } else {
    setGhost(i);
  }
});
el.board.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || !myTurn()) return;
  const i = pointAt(e);
  setGhost(i >= 0 && canPlace(state.board, i, state.me) ? i : -1);
});
el.board.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') setGhost(-1); });
el.board.addEventListener('touchstart', (e) => e.preventDefault(), { passive: false });

function setGhost(i) {
  if (state.ghost === i) return;
  if (state.ghost >= 0 && state.board[state.ghost] === EMPTY) pts[state.ghost].replaceChildren();
  state.ghost = i;
  if (i >= 0) pts[i].replaceChildren(stoneEl(state.me, 'ghost'));
}

function stoneEl(color, extra = '') {
  const s = document.createElement('i');
  s.className = `stone ${color === BLACK ? 'b' : 'w'} ${extra}`;
  return s;
}

function myMove(i) {
  const n = state.moves.length;
  place(i, state.me);
  duel.send({ t: 'move', i, n });
}

// ---------- 진행 ----------
function newGame(seed, level, mode) {
  stopTimers();
  // 흑(선공)은 판마다 무작위: 대결은 양쪽이 같은 seed로 같은 결과를 얻는다
  const hostBlack = (seed & 1) === 0;
  const meBlack = mode === 'pvp' ? duel.isHost === hostBlack : hostBlack;
  Object.assign(state, {
    board: new Int8Array(SIZE),
    moves: [],
    turn: BLACK,
    me: meBlack ? BLACK : WHITE,
    level,
    ghost: -1,
    result: null,
  });
  pts.forEach((p) => { p.className = 'pt'; p.replaceChildren(); });
  el.meDot.className = `dot ${meBlack ? 'b' : 'w'}`;
  el.oppDot.className = `dot ${meBlack ? 'w' : 'b'}`;
  el.oppName.textContent = mode === 'pvp' ? '상대' : 'AI';
  el.clock.hidden = mode !== 'pvp';
  layout();
  duel.toast(meBlack ? '흑 · 선공' : '백 · 후공');
  if (mode === 'pvp') {
    state.phase = 'countdown';
    duel.countdown(() => { state.phase = 'play'; startTurn(); });
  } else {
    state.phase = 'play';
    startTurn();
  }
}

function place(i, color) {
  state.board[i] = color;
  state.moves.push(i);
  if (state.ghost === i) state.ghost = -1;
  pts[i].replaceChildren(stoneEl(color, 'drop'));
  pts.forEach((p) => p.classList.remove('last'));
  pts[i].classList.add('last');
  const line = winLine(state.board, i);
  if (line) return finish(color, line, '5목');
  if (state.moves.length === SIZE) return finish(EMPTY, null, '판이 가득 참');
  state.turn = 3 - color;
  startTurn();
}

function startTurn() {
  clearInterval(state.clock);
  setGhost(-1);
  el.mePanel.classList.toggle('turn', state.turn === state.me);
  el.oppPanel.classList.toggle('turn', state.turn !== state.me);
  // 둘 차례인 사람에게만 삼삼 자리를 표시
  const showBan = state.turn === state.me;
  for (let i = 0; i < SIZE; i++) {
    pts[i].classList.toggle('ban', showBan && state.board[i] === EMPTY && isForbidden(state.board, i, state.me));
  }
  if (isPvp()) {
    state.turnEndsAt = performance.now() + TURN_MS;
    const tick = () => {
      const left = state.turnEndsAt - performance.now();
      el.clockText.textContent = clockText(Math.ceil(Math.max(0, left) / 1000));
      el.clock.classList.toggle('low', left < 10_000);
      if (state.turn === state.me && left <= 0) {
        duel.send({ t: 'timeout' });
        finish(opp(), null, '시간 초과');
      } else if (state.turn !== state.me && left <= -GRACE_MS) {
        finish(state.me, null, '상대 시간 초과');
      }
    };
    tick();
    state.clock = setInterval(tick, 250);
  } else if (state.turn !== state.me) {
    state.timers.push(setTimeout(() => {
      if (state.phase !== 'play') return;
      const i = chooseMove(state.board, opp(), state.level);
      if (i >= 0) place(i, opp());
      else finish(EMPTY, null, '둘 곳 없음');
    }, AI_DELAY_MS));
  }
}

function finish(winner, line, reason) {
  if (state.phase !== 'play' && state.phase !== 'countdown') return;
  state.phase = 'over';
  stopTimers();
  setGhost(-1);
  pts.forEach((p) => p.classList.remove('ban'));
  el.mePanel.classList.remove('turn');
  el.oppPanel.classList.remove('turn');
  line?.forEach((i) => pts[i].classList.add('win'));
  state.result = { winner, reason };
  // 마지막 수와 5목 줄이 보이도록 잠깐 뒤에 결과
  state.timers.push(setTimeout(renderResult, line ? 900 : 300));
}

function renderResult() {
  const { winner, reason } = state.result;
  const iWin = winner === state.me;
  const draw = winner === EMPTY;
  const head = draw ? { icon: 'even', tone: 'even', title: '무승부' }
    : iWin ? { icon: 'trophy', tone: 'gold', title: '승리' }
      : { icon: 'sad', tone: 'lose', title: '패배' };
  const myStones = state.moves.filter((i) => state.board[i] === state.me).length;
  duel.showResult({
    ...head,
    status: reason,
    scores: [
      { side: 'me', label: '나', value: dotHtml(state.me), sub: `${colorName(state.me)} · ${myStones}수`, win: iWin },
      {
        side: 'opp',
        icon: isPvp() ? 'user' : 'bot',
        label: isPvp() ? '상대' : 'AI',
        value: dotHtml(opp()),
        sub: `${colorName(opp())} · ${state.moves.length - myStones}수`,
        win: !draw && !iWin,
      },
    ],
  });
}

function stopTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
  clearInterval(state.clock);
}
