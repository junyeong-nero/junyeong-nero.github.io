import { MAX_MISTAKES, N, PEERS, SIZE, generate } from './logic.js';
import { createDuel, clockText } from '../shared/duel.js';

const $ = (id) => document.getElementById(id);
const el = {
  game: $('game'), wrap: $('board-wrap'), board: $('board'), pad: $('pad'), controls: document.querySelector('.controls'),
  memo: $('btn-memo'), erase: $('btn-erase'), mistakes: $('mistakes'), clockText: $('clock-text'),
  oppPanel: $('opp-panel'), oppBar: $('opp-bar'), oppPct: $('opp-pct'),
};

const state = {
  phase: 'idle', // 'idle' | 'countdown' | 'play' | 'over'
  puzzle: [],
  solution: [],
  values: [], // 화면에 보이는 숫자 (주어진 숫자 + 내가 넣은 숫자, 틀린 것 포함)
  notes: [], // 칸별 메모 비트마스크 (숫자 d → 1<<d)
  sel: -1,
  memo: false,
  mistakes: 0,
  blanks: 0, // 처음 빈칸 수
  startAt: 0,
  ms: 0,
  solved: false,
  failed: false,
  stopped: false, // 상대가 먼저 끝내서 멈춤
  opp: newOpp(false),
  clock: 0,
};

function newOpp(gone) {
  return { filled: 0, mistakes: 0, finished: false, solved: false, failed: false, ms: 0, gone };
}

const miniRule = [5, 3, '', '', 7, '', 6, '', 9]
  .map((v, i) => `<span class="${i === 2 ? 'mine sel' : ''}">${i === 2 ? 4 : v}</span>`).join('');

const duel = createDuel({
  gameId: 'sudoku',
  rule: `<div class="rule" role="img" aria-label="가로, 세로, 3×3 칸에 1~9를 한 번씩"><div class="mini-grid">${miniRule}</div></div>`,
  chips: [
    { icon: 'pencil', text: '메모', label: '후보 숫자 메모' },
    { icon: 'x', text: '실수 3번', label: '3번 틀리면 끝' },
  ],
  levels: true,
  onStart: ({ seed, level, mode }) => newGame(seed, level, mode),
  onMessage(msg) {
    const opp = state.opp;
    if (msg.t === 'progress') {
      opp.filled = msg.filled;
      opp.mistakes = msg.mistakes;
      renderOpp();
    } else if (msg.t === 'end') {
      Object.assign(opp, { finished: true, solved: msg.solved, failed: msg.failed, ms: msg.ms, filled: msg.filled, mistakes: msg.mistakes });
      renderOpp();
      if (state.phase === 'play') {
        // 상대가 먼저 완성하거나 실수 3번으로 끝나면 이 판은 거기서 결정된다
        stop();
        state.stopped = true;
        duel.toast(msg.solved ? '상대 완성!' : '상대 실수 3번');
      }
      if (state.phase === 'over') renderResult();
    }
  },
  onPeerGone() {
    state.opp.gone = true;
    if (state.phase === 'over') renderResult();
  },
  onLeave() {
    clearInterval(state.clock);
    state.phase = 'idle';
  },
});

// ---------- 판 / 패드 DOM ----------
const cells = [];
for (let i = 0; i < SIZE; i++) {
  const c = document.createElement('div');
  const r = Math.floor(i / N);
  const col = i % N;
  c.className = 'cell';
  if (col === 2 || col === 5) c.classList.add('br');
  if (r === 2 || r === 5) c.classList.add('bb');
  if (col === 8) c.classList.add('c8');
  if (r === 8) c.classList.add('r8');
  c.dataset.i = i;
  el.board.append(c);
  cells.push(c);
}
const baseClass = cells.map((c) => c.className);

const nums = [];
for (let d = 1; d <= N; d++) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'num';
  b.textContent = d;
  b.dataset.d = d;
  el.pad.append(b);
  nums.push(b);
}

// 빠르게 연타해도 빠지지 않도록 click 대신 pointerdown
el.board.addEventListener('pointerdown', (e) => {
  const c = e.target.closest('.cell');
  if (!c || state.phase !== 'play') return;
  e.preventDefault();
  select(Number(c.dataset.i));
});
el.pad.addEventListener('pointerdown', (e) => {
  const b = e.target.closest('.num');
  if (!b) return;
  e.preventDefault();
  b.classList.add('down');
  setTimeout(() => b.classList.remove('down'), 90);
  input(Number(b.dataset.d));
});
el.memo.addEventListener('pointerdown', (e) => { e.preventDefault(); toggleMemo(); });
el.erase.addEventListener('pointerdown', (e) => { e.preventDefault(); erase(); });
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || state.phase !== 'play') return;
  const move = { ArrowUp: -N, ArrowDown: N, ArrowLeft: -1, ArrowRight: 1 }[e.key];
  if (/^[1-9]$/.test(e.key)) input(Number(e.key));
  else if (['Backspace', 'Delete', '0'].includes(e.key)) erase();
  else if (e.key === 'n' || e.key === 'N') toggleMemo();
  else if (move) select(state.sel < 0 ? 40 : Math.min(SIZE - 1, Math.max(0, state.sel + move)));
  else return;
  e.preventDefault();
});

function layout() {
  const w = el.wrap.clientWidth - 24;
  const h = el.wrap.clientHeight - 8;
  const size = Math.floor((Math.min(w, h) - 6) / N);
  document.documentElement.style.setProperty('--cell', `${Math.max(Math.min(size, 60), 24)}px`);
}
window.addEventListener('resize', () => { if (!el.game.hidden) layout(); });
window.visualViewport?.addEventListener('resize', () => { if (!el.game.hidden) layout(); });

// ---------- 규칙 ----------
const isLocked = (i) => state.puzzle[i] !== 0 || state.values[i] === state.solution[i];
const filledCount = () => state.values.reduce((n, v, i) => n + (state.puzzle[i] === 0 && v === state.solution[i] ? 1 : 0), 0);

function select(i) {
  state.sel = i;
  render();
}

function toggleMemo() {
  if (state.phase !== 'play') return;
  state.memo = !state.memo;
  el.memo.setAttribute('aria-pressed', String(state.memo));
  el.controls.classList.toggle('memo-on', state.memo);
}

function input(d) {
  const i = state.sel;
  if (state.phase !== 'play' || i < 0 || isLocked(i)) return;
  if (state.memo) {
    if (state.values[i]) return; // 틀린 숫자가 들어 있으면 먼저 지운다
    state.notes[i] ^= 1 << d;
    render();
    return;
  }
  if (state.values[i] === d) return;
  state.values[i] = d;
  state.notes[i] = 0;
  cells[i].classList.remove('pop');
  void cells[i].offsetWidth;
  cells[i].classList.add('pop');
  if (d === state.solution[i]) {
    PEERS[i].forEach((j) => { state.notes[j] &= ~(1 << d); }); // 맞힌 숫자는 같은 줄·박스 메모에서 지운다
  } else {
    state.mistakes += 1;
  }
  render();
  const filled = filledCount();
  if (filled === state.blanks) return finish(true);
  if (state.mistakes >= MAX_MISTAKES) return finish(false);
  duel.send({ t: 'progress', filled, mistakes: state.mistakes });
}

function erase() {
  const i = state.sel;
  if (state.phase !== 'play' || i < 0 || isLocked(i)) return;
  state.values[i] = 0;
  state.notes[i] = 0;
  render();
}

// ---------- 그리기 ----------
function render() {
  const sel = state.sel;
  const selVal = sel >= 0 ? state.values[sel] : 0;
  const peers = new Set(sel >= 0 ? PEERS[sel] : []);
  for (let i = 0; i < SIZE; i++) {
    const v = state.values[i];
    const c = cells[i];
    const keepPop = c.classList.contains('pop');
    c.className = baseClass[i];
    if (keepPop) c.classList.add('pop');
    if (v && state.puzzle[i] === 0) c.classList.add(v === state.solution[i] ? 'mine' : 'wrong');
    if (i === sel) c.classList.add('sel');
    else if (selVal && v === selVal) c.classList.add('same');
    else if (peers.has(i)) c.classList.add('peer');
    if (v) {
      if (c.textContent !== String(v) || c.firstElementChild) c.textContent = v;
    } else if (state.notes[i]) {
      let html = '<div class="notes">';
      for (let d = 1; d <= N; d++) html += `<i>${state.notes[i] & (1 << d) ? d : ''}</i>`;
      c.innerHTML = `${html}</div>`;
    } else if (c.textContent || c.firstElementChild) {
      c.textContent = '';
    }
  }
  // 9개를 다 맞힌 숫자는 패드에서 감춘다
  const placed = new Array(N + 1).fill(0);
  state.values.forEach((v, i) => { if (v && v === state.solution[i]) placed[v]++; });
  nums.forEach((b, k) => b.classList.toggle('done', placed[k + 1] === N));
  el.mistakes.textContent = `${state.mistakes}/${MAX_MISTAKES}`;
}

function renderOpp() {
  const pct = state.blanks ? Math.round((state.opp.filled / state.blanks) * 100) : 0;
  el.oppBar.style.width = `${pct}%`;
  el.oppPct.textContent = `${pct}%`;
}

// ---------- 진행 ----------
function newGame(seed, level, mode) {
  clearInterval(state.clock);
  const { puzzle, solution } = generate(seed, level);
  Object.assign(state, {
    puzzle,
    solution,
    values: puzzle.slice(),
    notes: new Array(SIZE).fill(0),
    sel: -1,
    memo: false,
    mistakes: 0,
    blanks: puzzle.filter((v) => !v).length,
    ms: 0,
    solved: false,
    failed: false,
    stopped: false,
    opp: newOpp(duel.oppGone),
  });
  el.memo.setAttribute('aria-pressed', 'false');
  el.controls.classList.remove('memo-on');
  el.clockText.textContent = '0:00';
  el.oppPanel.hidden = mode !== 'pvp';
  renderOpp();
  render();
  layout();
  if (mode === 'pvp') {
    state.phase = 'countdown';
    duel.countdown(play);
  } else {
    play();
  }
}

function play() {
  state.phase = 'play';
  state.startAt = performance.now();
  state.clock = setInterval(() => {
    el.clockText.textContent = clockText(Math.floor((performance.now() - state.startAt) / 1000));
  }, 250);
}

function stop() {
  state.phase = 'over';
  state.ms = Math.round(performance.now() - state.startAt);
  clearInterval(state.clock);
  el.clockText.textContent = clockText(Math.floor(state.ms / 1000));
}

function finish(solved) {
  stop();
  state.solved = solved;
  state.failed = !solved;
  duel.send({ t: 'end', solved, failed: !solved, ms: state.ms, filled: filledCount(), mistakes: state.mistakes });
  // 마지막 숫자/실수가 보이도록 잠깐 뒤에 결과
  setTimeout(() => { if (state.phase === 'over') renderResult(); }, 500);
}

// 1 = 내 승, -1 = 내 패, 0 = 무승부
function decide(me, opp) {
  if (me.solved && opp.solved) return me.ms === opp.ms ? 0 : me.ms < opp.ms ? 1 : -1;
  if (me.solved) return 1;
  if (opp.solved) return -1;
  if (me.failed && opp.failed) return 0;
  if (me.failed) return -1;
  if (opp.failed || opp.gone) return 1;
  return 0;
}

function renderResult() {
  const pctOf = (filled) => `${Math.round((filled / state.blanks) * 100)}%`;
  const me = { solved: state.solved, failed: state.failed, ms: state.ms, filled: filledCount() };
  const myValue = me.solved ? clockText(Math.floor(me.ms / 1000)) : pctOf(me.filled);
  const mySub = `실수 ${state.mistakes}`;
  if (duel.mode !== 'pvp') {
    duel.showResult({
      icon: me.solved ? 'star' : 'sad',
      tone: me.solved ? 'gold' : 'lose',
      title: me.solved ? '완성' : '실패',
      scores: [{ side: 'me', icon: me.solved ? 'clock' : 'x', label: me.solved ? '시간' : '진행', value: myValue, sub: mySub, win: me.solved }],
    });
    return;
  }
  const opp = state.opp;
  const cmp = decide(me, opp);
  const result = cmp > 0 ? { icon: 'trophy', tone: 'gold', title: '승리' }
    : cmp < 0 ? { icon: 'sad', tone: 'lose', title: '패배' }
      : { icon: 'even', tone: 'even', title: '무승부' };
  duel.showResult({
    ...result,
    scores: [
      { side: 'me', label: '나', value: myValue, sub: mySub, win: cmp >= 0 },
      { side: 'opp', label: '상대', value: opp.solved ? clockText(Math.floor(opp.ms / 1000)) : pctOf(opp.filled), sub: `실수 ${opp.mistakes}`, win: cmp <= 0 },
    ],
  });
}
