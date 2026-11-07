import { MAX_TRIES, WORD_LEN, answerFor, compareRuns, isValidWord, mergeKeyState, scoreGuess } from './logic.js';
import { createDuel, clockText, icon } from '../shared/duel.js';

const FLIP_STEP = 0.25; // 칸마다 뒤집히는 간격(초)
const REVEAL_MS = (FLIP_STEP * (WORD_LEN - 1) + 0.5) * 1000;
const $ = (id) => document.getElementById(id);

const el = {
  game: $('game'), wrap: $('board-wrap'), board: $('board'), keyboard: $('keyboard'),
  clockText: $('clock-text'), myTries: $('my-tries'), oppPanel: $('opp-panel'), oppTries: $('opp-tries'), oppMini: $('opp-mini'),
};

const state = {
  phase: 'idle', // 'idle' | 'countdown' | 'play' | 'over'
  answer: '',
  rows: [], // [{ word, result }]
  input: '',
  keys: {},
  revealing: false,
  showing: false, // 결과 카드를 띄웠는지 (마지막 줄 뒤집기가 끝난 뒤)
  startAt: 0,
  ms: 0,
  solved: false,
  opp: newOpp(false),
  timers: [],
  clock: 0,
};

function newOpp(gone) {
  return { rows: [], finished: false, solved: false, tries: 0, ms: 0, gone };
}

const tilesRule = [['w', 'correct'], ['o', 'present'], ['r', 'absent'], ['d', 'absent'], ['s', 'correct']]
  .map(([ch, cls]) => `<span class="tile ${cls}">${ch}</span>`).join('');

const duel = createDuel({
  gameId: 'wordle',
  rule: `<div class="rule" role="img" aria-label="5글자 단어 맞히기">${tilesRule}</div>`,
  chips: [
    { icon: 'check', text: '6번 안에', label: '6번 안에 맞히기' },
    { icon: 'trophy', text: '적게·빨리', label: '대결은 적은 시도, 빠른 시간 순' },
  ],
  levels: false,
  onStart: ({ seed, mode }) => newGame(seed, mode),
  onMessage(msg) {
    const opp = state.opp;
    if (msg.t === 'row') {
      opp.rows.push(msg.result);
      opp.tries = opp.rows.length;
      renderOpp();
    } else if (msg.t === 'end') {
      Object.assign(opp, { finished: true, solved: msg.solved, tries: msg.tries, ms: msg.ms });
      renderOpp();
      if (state.showing) renderResult();
    }
  },
  onPeerGone() {
    state.opp.gone = true;
    if (state.showing) renderResult();
  },
  onLeave() {
    stopTimers();
    state.phase = 'idle';
  },
});

// ---------- 판 / 키보드 DOM ----------
const tiles = [];
for (let r = 0; r < MAX_TRIES; r++) {
  const row = document.createElement('div');
  row.className = 'row';
  const rowTiles = [];
  for (let c = 0; c < WORD_LEN; c++) {
    const t = document.createElement('div');
    t.className = 'tile';
    row.append(t);
    rowTiles.push(t);
  }
  el.board.append(row);
  tiles.push(rowTiles);
}
const rowEls = [...el.board.children];

const minis = [];
for (let i = 0; i < MAX_TRIES * WORD_LEN; i++) {
  const m = document.createElement('i');
  el.oppMini.append(m);
  minis.push(m);
}

const keyEls = {};
['qwertyuiop', 'asdfghjkl', '+zxcvbnm-'].forEach((line) => {
  const krow = document.createElement('div');
  krow.className = 'krow';
  for (const ch of line) {
    const k = document.createElement('button');
    k.type = 'button';
    k.className = 'key';
    if (ch === '+') {
      k.classList.add('wide');
      k.dataset.key = 'enter';
      k.setAttribute('aria-label', '확인');
      k.innerHTML = icon('enter');
    } else if (ch === '-') {
      k.classList.add('wide');
      k.dataset.key = 'back';
      k.setAttribute('aria-label', '지우기');
      k.innerHTML = icon('backspace');
    } else {
      k.dataset.key = ch;
      k.textContent = ch;
      keyEls[ch] = k;
    }
    krow.append(k);
  }
  el.keyboard.append(krow);
});

// 같은 키를 빠르게 연타해도 빠지지 않도록 click 대신 pointerdown
el.keyboard.addEventListener('pointerdown', (e) => {
  const k = e.target.closest('.key');
  if (!k) return;
  e.preventDefault();
  k.classList.add('down');
  setTimeout(() => k.classList.remove('down'), 90);
  press(k.dataset.key);
});
document.addEventListener('keydown', (e) => {
  if (e.metaKey || e.ctrlKey || e.altKey || state.phase !== 'play') return;
  if (e.key === 'Enter') press('enter');
  else if (e.key === 'Backspace') press('back');
  else if (/^[a-zA-Z]$/.test(e.key)) press(e.key.toLowerCase());
  else return;
  e.preventDefault();
});

function layout() {
  const gap = 6;
  const w = el.wrap.clientWidth - 24;
  const h = el.wrap.clientHeight - 8;
  const size = Math.floor(Math.min((w - gap * (WORD_LEN - 1)) / WORD_LEN, (h - gap * (MAX_TRIES - 1)) / MAX_TRIES, 62));
  document.documentElement.style.setProperty('--tile', `${Math.max(size, 26)}px`);
}
window.addEventListener('resize', () => { if (!el.game.hidden) layout(); });
window.visualViewport?.addEventListener('resize', () => { if (!el.game.hidden) layout(); });

// ---------- 입력 ----------
function press(key) {
  if (state.phase !== 'play' || state.revealing) return;
  if (key === 'enter') submit();
  else if (key === 'back') {
    if (!state.input) return;
    state.input = state.input.slice(0, -1);
    const t = tiles[state.rows.length][state.input.length];
    t.textContent = '';
    t.classList.remove('filled');
  } else if (state.input.length < WORD_LEN) {
    const t = tiles[state.rows.length][state.input.length];
    t.textContent = key;
    t.classList.add('filled');
    state.input += key;
  }
}

function submit() {
  const word = state.input;
  const rowEl = rowEls[state.rows.length];
  const reject = (text) => {
    duel.toast(text);
    rowEl.classList.remove('shake');
    void rowEl.offsetWidth; // 애니메이션 다시 시작
    rowEl.classList.add('shake');
  };
  if (word.length < WORD_LEN) return reject('5글자를 채워 주세요');
  if (!isValidWord(word)) return reject('목록에 없는 단어');

  const result = scoreGuess(word, state.answer);
  const r = state.rows.length;
  state.rows.push({ word, result });
  state.input = '';
  tiles[r].forEach((t, i) => {
    t.style.setProperty('--d', `${i * FLIP_STEP}s`);
    t.classList.add('reveal', result[i]);
  });
  el.myTries.textContent = `${state.rows.length}/${MAX_TRIES}`;
  duel.send({ t: 'row', result });

  const solved = result.every((x) => x === 'correct');
  const done = solved || state.rows.length === MAX_TRIES;
  if (done) stopClock(solved);
  state.revealing = true;
  state.timers.push(setTimeout(() => {
    state.revealing = false;
    state.keys = mergeKeyState(state.keys, word, result);
    for (const [ch, st] of Object.entries(state.keys)) {
      keyEls[ch].classList.remove('correct', 'present', 'absent');
      keyEls[ch].classList.add(st);
    }
    if (done) renderResult();
  }, REVEAL_MS));
}

// ---------- 진행 ----------
function newGame(seed, mode) {
  stopTimers();
  state.answer = answerFor(seed);
  state.rows = [];
  state.input = '';
  state.keys = {};
  state.revealing = false;
  state.showing = false;
  state.solved = false;
  state.ms = 0;
  state.opp = newOpp(duel.oppGone);
  tiles.flat().forEach((t) => { t.className = 'tile'; t.textContent = ''; t.style.removeProperty('--d'); });
  rowEls.forEach((r) => r.classList.remove('shake'));
  Object.values(keyEls).forEach((k) => k.classList.remove('correct', 'present', 'absent'));
  el.myTries.textContent = `0/${MAX_TRIES}`;
  el.clockText.textContent = '0:00';
  el.oppPanel.hidden = mode !== 'pvp';
  renderOpp();
  layout();
  // 대결은 3·2·1 뒤 동시에 시작, 혼자는 바로
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
  const tick = () => { el.clockText.textContent = clockText(Math.floor((performance.now() - state.startAt) / 1000)); };
  state.clock = setInterval(tick, 250);
}

function stopClock(solved) {
  state.phase = 'over';
  state.solved = solved;
  state.ms = Math.round(performance.now() - state.startAt);
  clearInterval(state.clock);
  el.clockText.textContent = clockText(Math.floor(state.ms / 1000));
  duel.send({ t: 'end', solved, tries: state.rows.length, ms: state.ms });
}

function renderOpp() {
  const { rows, tries } = state.opp;
  minis.forEach((m, i) => {
    const res = rows[Math.floor(i / WORD_LEN)];
    m.className = res ? res[i % WORD_LEN] : '';
  });
  el.oppTries.textContent = `${tries}/${MAX_TRIES}`;
}

function runText(solved, tries) {
  return solved ? `${tries}/${MAX_TRIES}` : `X/${MAX_TRIES}`;
}

function renderResult() {
  state.showing = true;
  const me = { solved: state.solved, tries: state.rows.length, ms: state.ms };
  const extra = `<div class="answer" aria-label="정답">${[...state.answer].map((ch) => `<span>${ch}</span>`).join('')}</div>`;
  const myTime = clockText(Math.floor(me.ms / 1000));
  if (duel.mode !== 'pvp') {
    duel.showResult({
      icon: me.solved ? 'star' : 'sad',
      tone: me.solved ? 'gold' : 'lose',
      title: me.solved ? '정답' : '실패',
      extra,
      scores: [{ side: 'me', icon: me.solved ? 'check' : 'x', label: '시도', value: runText(me.solved, me.tries), sub: myTime, win: me.solved }],
    });
    return;
  }
  const opp = state.opp;
  let result = { icon: 'hourglass', tone: '', title: '상대 진행 중' };
  let cmp = null;
  if (opp.finished || opp.gone) {
    const oppRun = opp.finished ? opp : { solved: false, tries: opp.tries, ms: Infinity };
    cmp = compareRuns(me, oppRun);
    result = cmp > 0 ? { icon: 'trophy', tone: 'gold', title: '승리' }
      : cmp < 0 ? { icon: 'sad', tone: 'lose', title: '패배' }
        : { icon: 'even', tone: 'even', title: '무승부' };
  }
  duel.showResult({
    ...result,
    extra,
    scores: [
      { side: 'me', label: '나', value: runText(me.solved, me.tries), sub: myTime, win: cmp !== null && cmp >= 0 },
      {
        side: 'opp',
        label: '상대',
        value: opp.finished ? runText(opp.solved, opp.tries) : `${opp.tries}/${MAX_TRIES}`,
        sub: opp.finished ? clockText(Math.floor(opp.ms / 1000)) : '…',
        win: cmp !== null && cmp <= 0,
      },
    ],
  });
}

function stopTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
  clearInterval(state.clock);
}
