// 2인 게임 공용 뼈대: 로비(혼자/대결/참가), 방 대기, 난이도, 카운트다운, 결과 카드, 토스트, 확대 막기.
// 페이지에는 .topbar, <main id="lobby" class="lobby">, <main id="game" class="game" hidden> 가 있어야 하고
// peerjs 스크립트를 이 모듈보다 먼저 로드해야 한다.
import { Room } from './room.js';

const SPRITE = new URL('./icons.svg', import.meta.url).href;
export const icon = (name) => `<svg class="icon" aria-hidden="true"><use href="${SPRITE}#i-${name}"/></svg>`;

const LEVELS = [['easy', 'lv1', '하'], ['normal', 'lv2', '중'], ['hard', 'lv3', '상']];
const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

// cfg: {
//   gameId,                       // peer id 네임스페이스
//   rule, chips: [{ icon, text, label }], levels: bool,   // 로비 상단 그림/칩/난이도
//   onStart({ seed, level, mode }),   // 새 판 (혼자/대결 모두, 대결은 양쪽 같은 seed·level)
//   onMessage(msg),                   // 게임 메시지 (ready/start/level 외)
//   onPeerGone(),                     // 게임 중/결과 화면에서 상대 연결이 끊김
//   onLeave(),                        // 로비로 돌아감: 게임 타이머 정리
// }
export function createDuel(cfg) {
  const lobby = document.getElementById('lobby');
  const game = document.getElementById('game');

  lobby.innerHTML = `
    <div class="lobby-card">
      ${cfg.rule || ''}
      <div class="chips">${(cfg.chips || []).map((c) =>
        `<span class="chip" aria-label="${c.label}">${icon(c.icon)}${c.text}</span>`).join('')}</div>
      ${cfg.levels ? `<div class="levels" data-ref="levels" role="radiogroup" aria-label="난이도">${LEVELS.map(([id, ic, label]) =>
        `<button type="button" role="radio" data-level="${id}" aria-checked="${id === 'normal'}">${icon(ic)}${label}</button>`).join('')}</div>` : ''}
      <div class="stack" data-ref="menu">
        <div class="tiles">
          <button class="tile" data-ref="solo">${icon('user')}<span>혼자</span></button>
          <button class="tile primary" data-ref="host">${icon('users')}<span>대결</span></button>
        </div>
        <form class="join" data-ref="joinForm">
          <label class="code-field">${icon('hash')}
            <input data-ref="joinCode" maxlength="5" placeholder="코드" aria-label="방 코드" autocomplete="off" autocapitalize="characters" spellcheck="false">
          </label>
          <button class="btn" type="submit">${icon('enter')}참가</button>
        </form>
      </div>
      <div class="stack" data-ref="roomView" hidden>
        <div class="room-code">${icon('hash')}<span class="code" data-ref="code">-----</span></div>
        <button class="btn ghost small" data-ref="copy">${icon('link')}링크 복사</button>
        <div class="versus">
          <div class="seat me">${icon('user')}<span>나</span></div>
          <span class="vs">VS</span>
          <div class="seat opp empty" data-ref="seatOpp">${icon('user')}<span data-ref="seatOppLabel">대기</span></div>
        </div>
        <p class="status" data-ref="roomStatus"></p>
        <button class="btn primary" data-ref="start" hidden>${icon('play')}시작</button>
        <button class="btn ghost small" data-ref="leave">${icon('exit')}나가기</button>
      </div>
      <p class="error" data-ref="error" hidden></p>
    </div>`;

  document.body.insertAdjacentHTML('beforeend', `
    <div class="overlay countdown" data-ref="countdown" hidden><span data-ref="countdownNum">3</span></div>
    <div class="overlay" data-ref="result" hidden>
      <div class="result-card">
        <div class="result-badge" data-ref="badge"></div>
        <p class="result-title" data-ref="title"></p>
        <div class="result-extra" data-ref="extra"></div>
        <div class="result-scores" data-ref="scores"></div>
        <p class="status" data-ref="status"></p>
        <div class="result-actions">
          <button class="btn primary" data-ref="again">${icon('replay')}다시</button>
          <button class="btn" data-ref="exit">${icon('home')}홈</button>
        </div>
      </div>
    </div>
    <div class="toast" data-ref="toast" hidden></div>`);
  document.querySelector('.topbar').insertAdjacentHTML('beforeend',
    `<span class="room-tag" data-ref="roomTag" hidden>${icon('link')}<span data-ref="roomTagCode"></span></span>`);

  const ref = {};
  document.querySelectorAll('[data-ref]').forEach((el) => { ref[el.dataset.ref] = el; });

  const s = {
    mode: 'solo', // 'solo' | 'pvp'
    level: 'normal', // 대결에서는 방장 기준
    room: null,
    meReady: false,
    oppReady: false,
    oppGone: false,
    phase: 'lobby', // 'lobby' | 'game'
    spec: null, // 표시 중인 결과
    timers: [],
  };

  const clearTimers = () => { s.timers.forEach(clearTimeout); s.timers = []; };

  // ---------- 판 시작 / 화면 ----------
  function begin(seed) {
    clearTimers();
    s.meReady = false;
    s.oppReady = false;
    s.spec = null;
    ref.result.hidden = true;
    ref.again.disabled = false;
    lobby.hidden = true;
    game.hidden = false;
    s.phase = 'game';
    cfg.onStart({ seed, level: s.level, mode: s.mode });
  }

  function countdown(cb, n = 3) {
    ref.countdown.hidden = false;
    ref.countdownNum.textContent = n;
    const step = () => {
      n -= 1;
      if (n > 0) {
        ref.countdownNum.textContent = n;
        s.timers.push(setTimeout(step, 1000));
      } else {
        ref.countdown.hidden = true;
        cb();
      }
    };
    s.timers.push(setTimeout(step, 1000));
  }

  function showLobby(view) {
    clearTimers();
    s.phase = 'lobby';
    s.spec = null;
    game.hidden = true;
    ref.result.hidden = true;
    ref.countdown.hidden = true;
    lobby.hidden = false;
    ref.menu.hidden = view !== 'menu';
    ref.roomView.hidden = view !== 'room';
    ref.error.hidden = true;
    cfg.onLeave?.();
  }

  // spec: { icon, tone, title, extra?, status?, scores: [{ side: 'me'|'opp', icon?, label, value, sub?, win? }] }
  function showResult(spec) {
    s.spec = spec;
    renderResult();
  }

  function renderResult() {
    const spec = s.spec;
    if (!spec) return;
    ref.result.hidden = false;
    ref.badge.className = `result-badge ${spec.tone || ''}`;
    ref.badge.innerHTML = icon(spec.icon);
    ref.title.textContent = spec.title;
    ref.extra.innerHTML = spec.extra || '';
    ref.scores.innerHTML = spec.scores.map((r) => `
      <div class="${r.side} ${r.win ? 'win' : ''}">${icon(r.icon || 'user')}<span>${r.label}</span><b>${r.value}</b>${r.sub ? `<small>${r.sub}</small>` : ''}</div>`).join('');
    let duelStatus = '';
    if (s.mode === 'pvp') {
      if (s.oppGone) duelStatus = '상대 연결 끊김';
      else if (s.meReady) duelStatus = '상대 기다리는 중…';
      else if (s.oppReady) duelStatus = '상대가 한 판 더 원해요';
    }
    ref.status.textContent = [spec.status, duelStatus].filter(Boolean).join(' · ');
  }

  function showError(text) {
    ref.error.textContent = text;
    ref.error.hidden = false;
  }

  let toastTimer = 0;
  function toast(text) {
    ref.toast.textContent = text;
    ref.toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { ref.toast.hidden = true; }, 2200);
  }

  // ---------- 난이도 ----------
  function setLevel(level) {
    s.level = LEVELS.some(([id]) => id === level) ? level : 'normal';
    renderLevel();
  }

  function renderLevel() {
    if (!ref.levels) return;
    ref.levels.querySelectorAll('[data-level]').forEach((b) => {
      b.setAttribute('aria-checked', String(b.dataset.level === s.level));
    });
    // 대결 참가자는 방장이 고른 난이도를 따른다
    ref.levels.classList.toggle('locked', !!s.room && !s.room.isHost);
  }

  ref.levels?.addEventListener('click', (e) => {
    const b = e.target.closest('[data-level]');
    if (!b || (s.room && !s.room.isHost)) return;
    setLevel(b.dataset.level);
    s.room?.send({ t: 'level', level: s.level });
  });

  // ---------- 2인 대결 ----------
  function maybeStart() {
    if (!s.room?.isHost || !s.room.connected) return;
    if (!s.meReady || !s.oppReady) return;
    const seed = randomSeed();
    s.room.send({ t: 'start', seed, level: s.level });
    begin(seed);
  }

  function handleMessage(msg) {
    switch (msg.t) {
      case 'ready':
        s.oppReady = true;
        maybeStart();
        renderResult();
        break;
      case 'start':
        if (s.room.isHost) break;
        setLevel(msg.level);
        begin(msg.seed);
        break;
      case 'level':
        if (!s.room.isHost) setLevel(msg.level);
        break;
      default:
        cfg.onMessage?.(msg);
    }
  }

  function openRoom(join) {
    s.mode = 'pvp';
    s.meReady = false;
    s.oppReady = false;
    s.oppGone = false;
    showLobby('room');
    ref.code.textContent = join || '-----';
    ref.roomStatus.textContent = '연결 중…';
    setSeat(false);
    ref.start.hidden = true;
    ref.copy.hidden = !!join;

    const room = new Room(cfg.gameId, {
      onOpen(code) {
        ref.code.textContent = code;
        ref.roomStatus.textContent = '';
        setRoomTag(code, false);
      },
      onConnect() {
        s.oppGone = false;
        s.oppReady = false;
        setRoomTag(room.code, true);
        setSeat(true);
        if (room.isHost) {
          ref.roomStatus.textContent = '';
          ref.start.hidden = false;
          room.send({ t: 'level', level: s.level });
        } else {
          ref.roomStatus.textContent = '방장 시작 대기';
          room.send({ t: 'ready' });
        }
      },
      onMessage: handleMessage,
      onClose() {
        s.oppGone = true;
        setRoomTag(room.code, false);
        setSeat(false);
        toast('상대 연결 끊김');
        if (s.phase === 'lobby') {
          if (room.isHost) {
            ref.start.hidden = true;
            ref.roomStatus.textContent = '';
          } else {
            leaveRoom();
          }
          return;
        }
        cfg.onPeerGone?.();
        renderResult();
      },
      onError(text) {
        if (s.phase !== 'lobby') { toast(text); return; }
        leaveRoom();
        showError(text);
      },
    });
    s.room = room;
    renderLevel();
    if (join) room.join(join);
    else room.host();
  }

  function leaveRoom() {
    s.room?.close();
    s.room = null;
    s.mode = 'solo';
    ref.roomTag.hidden = true;
    renderLevel();
    if (new URLSearchParams(location.search).has('room')) history.replaceState(null, '', location.pathname);
    showLobby('menu');
  }

  function setRoomTag(code, live) {
    ref.roomTag.hidden = false;
    ref.roomTagCode.textContent = code;
    ref.roomTag.classList.toggle('live', live);
  }

  function setSeat(filled) {
    ref.seatOpp.classList.toggle('empty', !filled);
    ref.seatOppLabel.textContent = filled ? '상대' : '대기';
  }

  function requirePeer() {
    if (window.Peer) return true;
    showError('연결 모듈을 못 불러왔어요. 네트워크를 확인해 주세요.');
    return false;
  }

  // ---------- 버튼 ----------
  ref.solo.addEventListener('click', () => {
    s.mode = 'solo';
    begin(randomSeed());
  });
  ref.host.addEventListener('click', () => { if (requirePeer()) openRoom(); });
  ref.joinForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = ref.joinCode.value.trim().toUpperCase();
    if (code.length !== 5) { showError('5자리 코드를 입력해 주세요.'); return; }
    if (requirePeer()) openRoom(code);
  });
  ref.start.addEventListener('click', () => {
    s.meReady = true;
    maybeStart();
  });
  ref.copy.addEventListener('click', async () => {
    const url = `${location.origin}${location.pathname}?room=${s.room?.code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast('링크 복사됨');
    } catch {
      toast(url);
    }
  });
  ref.leave.addEventListener('click', leaveRoom);
  ref.again.addEventListener('click', () => {
    if (s.mode !== 'pvp' || !s.room?.connected) {
      if (s.mode === 'pvp') leaveRoom();
      s.mode = 'solo';
      begin(randomSeed());
      return;
    }
    s.meReady = true;
    ref.again.disabled = true;
    s.room.send({ t: 'ready' });
    maybeStart();
    renderResult();
  });
  ref.exit.addEventListener('click', () => {
    if (s.mode === 'pvp') leaveRoom();
    else showLobby('menu');
  });

  // 초대 링크로 들어온 경우 자동 참가
  const autoJoin = () => {
    const code = new URLSearchParams(location.search).get('room');
    if (code && requirePeer()) openRoom(code.toUpperCase());
  };
  if (document.readyState === 'complete') autoJoin();
  else window.addEventListener('load', autoJoin);

  return {
    get mode() { return s.mode; },
    get level() { return s.level; },
    get isHost() { return !!s.room?.isHost; },
    get connected() { return !!s.room?.connected; },
    get oppGone() { return s.oppGone; },
    send: (msg) => s.room?.send(msg),
    countdown,
    showResult,
    toast,
  };
}

// ---------- 확대 막기 ----------
// iOS Safari는 viewport user-scalable/touch-action만으로는 더블탭·핀치 확대를 다 막지 못한다.
// 같은 자리를 350ms 안에 다시 탭할 때만 막는다 (다른 버튼을 연달아 누르는 건 허용).
// 같은 키를 빠르게 연타하는 화면 키보드는 click 대신 pointerdown으로 받아야 입력이 안 빠진다.
let lastTap = { t: -1e9, x: 0, y: 0 };
document.addEventListener('touchend', (e) => {
  const p = e.changedTouches[0];
  if (!p) return;
  const tap = { t: e.timeStamp, x: p.clientX, y: p.clientY };
  if (tap.t - lastTap.t < 350 && Math.hypot(tap.x - lastTap.x, tap.y - lastTap.y) < 40) e.preventDefault();
  lastTap = tap;
}, { passive: false });
document.addEventListener('dblclick', (e) => e.preventDefault());
document.addEventListener('gesturestart', (e) => e.preventDefault());

// 시간 표시: 125(초) → "2:05"
export const clockText = (sec) => `${Math.floor(sec / 60)}:${String(Math.max(0, sec) % 60).padStart(2, '0')}`;
