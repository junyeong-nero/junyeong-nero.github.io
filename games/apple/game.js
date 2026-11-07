import { COLS, ROWS, SIZE, TARGET, generateBoard, sumOf } from './board.js';
import { Room } from '../shared/room.js';

const GAME_MS = 120_000;
const COUNTDOWN = 3;
// 사각형이 칸의 가장자리에서 이 비율만큼 들어온 안쪽 영역에 닿으면 선택 (0 = 칸에 닿기만 해도, 0.5 = 중점)
const HIT_INSET = 0.2;
const $ = (id) => document.getElementById(id);

const el = {
  lobby: $('lobby'), menu: $('lobby-menu'), roomBox: $('lobby-room'), code: $('room-code'),
  roomStatus: $('room-status'), start: $('btn-start'), copy: $('btn-copy'), lobbyError: $('lobby-error'),
  game: $('game'), stage: $('stage'), frame: $('frame'), board: $('board'), selBox: $('sel-box'),
  timerFill: $('timer-fill'), clock: $('clock'), myScore: $('my-score'), oppPanel: $('opp-panel'), oppScore: $('opp-score'),
  oppMini: $('opp-mini'), countdown: $('countdown'), countdownNum: $('countdown-num'),
  result: $('result'), resultTitle: $('result-title'), resultScores: $('result-scores'),
  resultStatus: $('result-status'), again: $('btn-again'), roomTag: $('room-tag'), toast: $('toast'),
};

const state = {
  mode: 'solo', // 'solo' | 'pvp'
  phase: 'lobby', // 'lobby' | 'countdown' | 'play' | 'over'
  values: [],
  removed: [],
  score: 0,
  endsAt: 0,
  cleared: false,
  meReady: false,
  opp: { score: 0, finished: false, ready: false, gone: false },
  room: null,
  timers: [],
  raf: 0,
};

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
  state.room?.send({ t: 'clear', cells: indices, score: state.score });
  if (state.score === SIZE) {
    state.cleared = true;
    finish();
  }
}

// ---------- 게임 진행 ----------
function newGame(seed) {
  stopTimers();
  const { values } = generateBoard(seed);
  state.values = values;
  state.removed = new Array(SIZE).fill(false);
  state.score = 0;
  state.cleared = false;
  state.meReady = false;
  state.opp.score = 0;
  state.opp.finished = false;
  state.opp.ready = false;
  cells.forEach((cell, i) => {
    cell.className = 'cell';
    cell.firstChild.textContent = values[i];
  });
  minis.forEach((m) => { m.className = ''; });
  el.myScore.textContent = '0';
  el.oppScore.textContent = '0';
  el.oppPanel.hidden = state.mode !== 'pvp';
  el.timerFill.style.setProperty('--left', '1');
  el.timerFill.classList.remove('low');
  renderClock(GAME_MS);
  el.result.hidden = true;
  el.lobby.hidden = true;
  el.game.hidden = false;
  layout();

  state.phase = 'countdown';
  el.countdown.hidden = false;
  let n = COUNTDOWN;
  el.countdownNum.textContent = n;
  const step = () => {
    n -= 1;
    if (n > 0) {
      el.countdownNum.textContent = n;
      state.timers.push(setTimeout(step, 1000));
    } else {
      el.countdown.hidden = true;
      play();
    }
  };
  state.timers.push(setTimeout(step, 1000));
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
  const sec = Math.max(0, Math.ceil(leftMs / 1000));
  const text = `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`;
  if (el.clock.textContent !== text) el.clock.textContent = text;
  el.clock.classList.toggle('low', leftMs < 10_000);
}

function finish() {
  if (state.phase !== 'play') return;
  state.phase = 'over';
  cancelAnimationFrame(state.raf);
  if (!state.cleared) renderClock(0);
  if (drag) endDrag(false);
  state.room?.send({ t: 'end', score: state.score });
  el.again.disabled = false;
  renderResult();
}

function renderResult() {
  el.result.hidden = false;
  const me = state.score;
  if (state.mode !== 'pvp') {
    el.resultTitle.textContent = state.cleared ? '전부 지웠어요! 🍎' : '시간 종료!';
    el.resultScores.innerHTML = `<div class="win"><span>점수</span><b>${me}</b></div>`;
    el.resultStatus.textContent = '';
    return;
  }
  const opp = state.opp;
  let title = state.cleared ? '전부 지웠어요!' : '시간 종료!';
  if (opp.finished || opp.gone) title = me > opp.score ? '승리! 🍎' : me < opp.score ? '패배…' : '무승부';
  el.resultTitle.textContent = title;
  el.resultScores.innerHTML = `
    <div class="${me >= opp.score ? 'win' : ''}"><span>나</span><b>${me}</b></div>
    <div class="${opp.score >= me ? 'win' : ''}"><span>상대</span><b>${opp.score}</b></div>`;
  let status = '';
  if (opp.gone) status = '상대 연결이 끊어졌어요.';
  else if (!opp.finished) status = '상대가 아직 플레이 중이에요…';
  else if (state.meReady) status = '상대를 기다리는 중…';
  else if (opp.ready) status = '상대가 한 판 더 하고 싶어해요!';
  el.resultStatus.textContent = status;
}

function stopTimers() {
  state.timers.forEach(clearTimeout);
  state.timers = [];
  cancelAnimationFrame(state.raf);
}

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

// ---------- 2인 대결 ----------
function maybeStart() {
  if (!state.room?.isHost || !state.room.connected) return;
  if (!state.meReady || !state.opp.ready) return;
  const seed = randomSeed();
  state.room.send({ t: 'start', seed });
  newGame(seed);
}

function onMessage(msg) {
  switch (msg.t) {
    case 'ready':
      state.opp.ready = true;
      maybeStart();
      if (state.phase === 'over') renderResult();
      break;
    case 'start':
      if (!state.room.isHost) newGame(msg.seed);
      break;
    case 'clear':
      state.opp.score = msg.score;
      el.oppScore.textContent = msg.score;
      msg.cells.forEach((i) => minis[i]?.classList.add('gone'));
      break;
    case 'end':
      state.opp.score = msg.score;
      state.opp.finished = true;
      el.oppScore.textContent = msg.score;
      if (state.phase === 'over') renderResult();
      break;
  }
}

function openRoom(join) {
  state.mode = 'pvp';
  state.opp = { score: 0, finished: false, ready: false, gone: false };
  state.meReady = false;
  showLobby('room');
  el.code.textContent = join || '-----';
  el.roomStatus.textContent = '연결 중…';
  el.start.hidden = true;
  el.copy.hidden = !!join;

  const room = new Room('apple', {
    onOpen(code) {
      el.code.textContent = code;
      el.roomStatus.textContent = '친구에게 코드나 링크를 보내 주세요. 상대를 기다리는 중…';
      setRoomTag(`방 ${code}`, false);
    },
    onConnect() {
      state.opp = { score: 0, finished: false, ready: false, gone: false };
      setRoomTag(`방 ${room.code} · 연결됨`, true);
      if (room.isHost) {
        el.roomStatus.textContent = '상대가 들어왔어요!';
        el.start.hidden = false;
      } else {
        el.roomStatus.textContent = '연결됐어요! 방장이 시작하기를 기다리는 중…';
        room.send({ t: 'ready' });
      }
    },
    onMessage,
    onClose() {
      state.opp.gone = true;
      setRoomTag(`방 ${room.code}`, false);
      toast('상대 연결이 끊어졌어요.');
      if (state.phase === 'over') renderResult();
      if (state.phase === 'lobby') {
        if (room.isHost) {
          el.start.hidden = true;
          el.roomStatus.textContent = '상대를 기다리는 중…';
        } else {
          leaveRoom();
        }
      }
    },
    onError(text) {
      if (state.phase !== 'lobby') { toast(text); return; }
      leaveRoom();
      showError(text);
    },
  });
  state.room = room;
  if (join) room.join(join);
  else room.host();
}

function leaveRoom() {
  state.room?.close();
  state.room = null;
  state.mode = 'solo';
  el.roomTag.hidden = true;
  if (new URLSearchParams(location.search).has('room')) history.replaceState(null, '', location.pathname);
  showLobby('menu');
}

function setRoomTag(text, live) {
  el.roomTag.hidden = false;
  el.roomTag.textContent = text;
  el.roomTag.classList.toggle('live', live);
}

// ---------- 화면 ----------
function showLobby(view) {
  stopTimers();
  state.phase = 'lobby';
  el.game.hidden = true;
  el.result.hidden = true;
  el.countdown.hidden = true;
  el.lobby.hidden = false;
  el.menu.hidden = view !== 'menu';
  el.roomBox.hidden = view !== 'room';
  el.lobbyError.hidden = true;
}

function showError(text) {
  el.lobbyError.textContent = text;
  el.lobbyError.hidden = false;
}

let toastTimer = 0;
function toast(text) {
  el.toast.textContent = text;
  el.toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.toast.hidden = true; }, 2500);
}

function requirePeer() {
  if (window.Peer) return true;
  showError('P2P 라이브러리를 불러오지 못했어요. 네트워크를 확인해 주세요.');
  return false;
}

$('btn-solo').addEventListener('click', () => {
  state.mode = 'solo';
  newGame(randomSeed());
});
$('btn-host').addEventListener('click', () => { if (requirePeer()) openRoom(); });
$('join-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const code = $('join-code').value.trim().toUpperCase();
  if (code.length !== 5) { showError('5자리 방 코드를 입력해 주세요.'); return; }
  if (requirePeer()) openRoom(code);
});
el.start.addEventListener('click', () => {
  state.meReady = true;
  maybeStart();
});
el.copy.addEventListener('click', async () => {
  const url = `${location.origin}${location.pathname}?room=${state.room?.code}`;
  try {
    await navigator.clipboard.writeText(url);
    toast('초대 링크를 복사했어요.');
  } catch {
    toast(url);
  }
});
$('btn-leave').addEventListener('click', leaveRoom);
el.again.addEventListener('click', () => {
  if (state.mode !== 'pvp' || !state.room?.connected) {
    if (state.mode === 'pvp') leaveRoom();
    state.mode = 'solo';
    newGame(randomSeed());
    return;
  }
  state.meReady = true;
  el.again.disabled = true;
  state.room.send({ t: 'ready' });
  maybeStart();
  if (state.phase === 'over') renderResult();
});
$('btn-exit').addEventListener('click', () => {
  if (state.mode === 'pvp') leaveRoom();
  else showLobby('menu');
});

// 초대 링크로 들어온 경우 자동 참가
window.addEventListener('load', () => {
  const code = new URLSearchParams(location.search).get('room');
  if (code && requirePeer()) openRoom(code.toUpperCase());
});
