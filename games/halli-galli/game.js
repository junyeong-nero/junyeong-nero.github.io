import { CARDS, FRUITS, fruitCounts, hasFive, isThrow } from './logic.js';
import { createSession } from './session.js';
import { createDuel } from '../shared/duel.js';

const $ = (id) => document.getElementById(id);
const state = {
  phase: 'idle', session: null, me: 0, level: 'normal', pending: '', notice: '',
  timers: [], aiTimers: [], drag: null, flyBase: null, animation: null, sound: true,
};
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const isPvp = () => duel.mode === 'pvp';
const opponent = () => isPvp() ? '상대' : 'AI';
const fruitSvg = (fruit, cls = '') => `<svg class="fruit ${cls}" aria-hidden="true"><use href="fruits.svg#${FRUITS[fruit].id}"/></svg>`;
const later = (fn, delay) => { const id = setTimeout(fn, delay); state.timers.push(id); return id; };

const duel = createDuel({
  gameId: 'halli-galli',
  rule: `<div class="rule" role="img" aria-label="딸기 두 개와 세 개, 합계 다섯 개">
    <span class="rule-card">${fruitSvg(0)}${fruitSvg(0)}</span><b>+</b>
    <span class="rule-card">${fruitSvg(0)}${fruitSvg(0)}${fruitSvg(0)}</span><b>= 5</b>
    </div><p class="rule-caption">스와이프로 탁! 종을 치면 딩!</p>`,
  chips: [
    { icon: 'hash', text: '정확히 5개', label: '같은 과일이 정확히 다섯 개일 때 종' },
    { icon: 'users', text: '2인', label: 'AI 또는 친구와 두 명이서' },
  ],
  levels: true,
  levelsSoloOnly: true,
  solo: { icon: 'bot', label: 'AI 대전' },
  onStart({ seed, level, mode }) {
    cleanup();
    Object.assign(state, { phase: 'ready', me: mode === 'pvp' && !duel.isHost ? 1 : 0, level,
      notice: '같은 과일이 정확히 5개면 종!', pending: 'start' });
    state.session = createSession({
      seed, me: state.me, pvp: mode === 'pvp', send: (msg) => duel.send(msg),
      onReady() {
        state.phase = 'play';
        state.pending = '';
        $('start-cue').hidden = true;
        render();
        scheduleAI();
      },
      onState(match, before) {
        state.pending = '';
        dropFlier();
        const event = match.last;
        const name = event.player === state.me ? '나' : opponent();
        if (event.type === 'flip') {
          state.notice = '맨 위 카드만 세세요. 서로 다른 과일은 더하지 않아요.';
        } else if (event.type === 'catch') {
          state.notice = `${name} 성공! 테이블의 ${event.count}장을 가져갔어요.`;
        } else if (event.type === 'miss') {
          state.notice = `${name} 오답! 상대에게 카드 1장을 넘겼어요.`;
        } else state.notice = '거의 동시에 눌렀어요! 잠깐 뒤 다시 도전하세요.';
        render();
        if (event.type === 'flip') {
          landCard(event.player);
          playSound('card');
          if (event.player === state.me) vibrate(8);
        } else {
          flash(event.type);
          if (event.type === 'catch') {
            collectCards(before, event.player);
            vibrate(event.player === state.me ? [15, 30, 15] : 8);
          } else if (event.type === 'miss') playSound('miss');
        }
        if (match.winner !== null) finish(match.winner, '한쪽의 손패가 모두 떨어졌어요.');
        else scheduleAI();
      },
      onPending(event) {
        state.pending = event.type;
        if (state.drag) cancelDrag();
        if (event.type === 'flip') {
          clearAI();
          flyCard(event.player, event.delay);
        } else if (event.type === 'judging') {
          // AI의 종 타이머는 남겨 둔다. 거의 동시라면 사람과 같은 기준으로 판정한다.
          dropFlier();
          if (event.player !== state.me) bellFeedback();
        } else if (event.type === 'sync' || event.type === 'start') {
          $('start-cue').hidden = false;
          $('start-cue').textContent = event.type === 'sync' ? '연결 중…' : '준비!';
        }
        controls();
      },
      onControls: controls,
      onReject(text) { state.pending = ''; returnCard(); duel.toast(text); controls(); },
      onError(text) { finish(-1, text); },
    });
    render();
    state.session.start();
  },
  onMessage(msg) { state.session?.receive(msg); },
  onPeerGone() {
    if (state.phase === 'play' || state.phase === 'ready') finish(state.me, '상대 연결 끊김');
  },
  onLeave() { cleanup(); state.phase = 'idle'; },
});

const POSITIONS = {
  1: [[50, 50]], 2: [[29, 27], [71, 73]], 3: [[27, 24], [50, 50], [73, 76]],
  4: [[28, 25], [72, 25], [28, 75], [72, 75]],
  5: [[26, 23], [74, 23], [50, 50], [26, 77], [74, 77]],
};
function cardHtml(id) {
  const card = CARDS[id];
  return `<div class="face-card" data-card="${id}" role="img" aria-label="${FRUITS[card.fruit].name} ${card.count}개">
    ${POSITIONS[card.count].map(([x, y]) => `<span class="pip" style="left:${x}%;top:${y}%">${fruitSvg(card.fruit)}</span>`).join('')}
    <i class="card-corner" aria-hidden="true">✦</i><i class="card-corner bottom" aria-hidden="true">✦</i>
  </div>`;
}

function render() {
  const match = state.session?.match;
  if (!match) return;
  $('me-count').textContent = match.decks[state.me].length;
  $('opp-count').textContent = match.decks[1 - state.me].length;
  $('opp-name').textContent = opponent();
  $('opp-pile-name').textContent = opponent();
  $('pot-count').innerHTML = `${match.piles.flat().length}<span>장</span>`;
  for (const [side, player] of [['me', state.me], ['opp', 1 - state.me]]) {
    const pile = match.piles[player];
    $(`${side}-pile-count`).textContent = `${pile.length}장`;
    $(`${side}-pile`).innerHTML = pile.length ? cardHtml(pile.at(-1))
      : `<span class="empty-pile">${side === 'me' ? '여기에 착지!' : '상대 카드'}</span>`;
    $(`${side}-pile`).classList.toggle('stacked', pile.length > 1);
  }
  $('notice').textContent = state.notice;
  controls();
}

function controls() {
  const session = state.session;
  if (!session) return;
  const playing = state.phase === 'play';
  const canPlay = playing && session.canFlip();
  $('deck').disabled = !canPlay;
  $('deck').classList.toggle('available', canPlay);
  $('bell').disabled = !playing || !session.canRing();
  $('me-panel').classList.toggle('turn', playing && session.match.turn === state.me);
  $('opp-panel').classList.toggle('turn', playing && session.match.turn !== state.me);
  const lastChance = session.match.decks.some((deck) => !deck.length) && session.match.winner === null;
  $('turn-status').textContent = state.phase === 'over' ? '게임 종료'
    : !playing ? state.pending === 'sync' ? '두 화면의 시간을 맞추는 중…' : '잠시 후 시작해요'
      : state.pending === 'judging' || state.pending === 'ring' || state.pending === 'tie' ? '종 판정 중…'
        : state.pending === 'flip' ? '카드가 놓이는 중…'
          : lastChance ? '마지막 기회! 종을 쳐서 카드를 되찾으세요.'
            : session.match.turn === state.me ? canPlay ? '내 차례 · 손패를 위로 스와이프' : '내 차례 · 다음 카드 준비 중…'
              : `${opponent()} 차례 · 종은 누구나!`;
  if (!state.drag) $('swipe-hint').textContent = canPlay ? '위로 밀어 탁! 놓아 주세요' : '내 차례에 위로 스와이프';
}

function clearAI() { state.aiTimers.forEach(clearTimeout); state.aiTimers = []; }
function scheduleAI() {
  clearAI();
  if (isPvp() || state.phase !== 'play') return;
  const match = state.session.match;
  const n = match.revision;
  const levels = { easy: [1050, 1550, 0.18, 0.08], normal: [650, 1000, 0.06, 0.035], hard: [320, 620, 0.01, 0.01] };
  const [min, max, miss, mistake] = levels[state.level];
  const delay = (fn, ms) => state.aiTimers.push(setTimeout(() => {
    if (state.phase === 'play' && state.session.match.revision === n) fn();
  }, ms));
  const five = hasFive(match);
  const near = fruitCounts(match).some((n) => n === 4 || n === 6);
  if ((five && (Math.random() >= miss || match.decks.some((d) => !d.length))) || (!five && near && Math.random() < mistake)) {
    const cooldown = match.last?.type === 'flip' ? 0 : 650;
    delay(() => state.session.ring(1), cooldown + min + Math.random() * (max - min));
  }
  if (match.turn === 1 && match.decks.every((deck) => deck.length)) {
    delay(() => state.session.flip(1), 1150 + Math.random() * 650);
  }
}

// ---------- 스와이프: 손가락을 따라 들고, 짧으면 복귀, 길거나 빠르면 던지기 ----------
function liftCard(rect) {
  dropFlier();
  const flier = $('flier');
  state.flyBase = { left: rect.left, top: rect.top, width: rect.width, height: rect.height };
  flier.innerHTML = $('deck-top').innerHTML;
  Object.assign(flier.style, { left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, transform: 'none' });
  flier.hidden = false;
}
function dropFlier() {
  state.animation?.cancel();
  state.animation = null;
  state.flyBase = null;
  $('flier').hidden = true;
  $('deck').classList.remove('lifted');
}
function releasePointer(drag) {
  if (drag && $('deck').hasPointerCapture(drag.id)) $('deck').releasePointerCapture(drag.id);
}
function cancelDrag() {
  const drag = state.drag;
  state.drag = null;
  releasePointer(drag);
  returnCard();
}
function returnCard() {
  if ($('flier').hidden) return;
  const from = getComputedStyle($('flier')).transform;
  state.animation?.cancel();
  const animation = $('flier').animate([
    { transform: from }, { transform: 'translate(0, 0) rotate(0deg) scale(1)' },
  ], { duration: reducedMotion.matches ? 1 : 230, easing: 'cubic-bezier(.2,.8,.3,1.25)', fill: 'forwards' });
  state.animation = animation;
  animation.onfinish = () => { if (state.animation === animation) dropFlier(); };
  controls();
}

$('deck').addEventListener('pointerdown', (e) => {
  if (e.button !== 0 || !e.isPrimary || !state.session?.canFlip() || state.drag) return;
  e.preventDefault();
  unlockAudio();
  const rect = $('deck').getBoundingClientRect();
  liftCard(rect);
  $('deck').classList.add('lifted');
  $('deck').setPointerCapture(e.pointerId);
  state.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, revision: state.session.match.revision,
    threshold: Math.max(44, Math.min(82, rect.height * 0.42)), samples: [{ y: e.clientY, t: e.timeStamp }], ready: false };
});
function track(e) {
  const drag = state.drag;
  if (!drag || e.pointerId !== drag.id) return null;
  const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
  drag.samples = drag.samples.filter((sample) => e.timeStamp - sample.t <= 100);
  drag.samples.push({ y: e.clientY, t: e.timeStamp });
  const first = drag.samples[0];
  const velocityY = (e.clientY - first.y) / Math.max(1, e.timeStamp - first.t);
  const ready = isThrow({ dx, dy, velocityY, threshold: drag.threshold });
  if (ready && !drag.ready) vibrate(5);
  drag.ready = ready;
  $('flier').style.transform = `translate(${dx}px, ${dy}px) rotate(${Math.max(-16, Math.min(16, dx / 9))}deg) scale(1.035)`;
  $('swipe-hint').textContent = ready ? '놓으면 카드가 나가요!' : '조금 더 위로 밀어 주세요';
  return ready;
}
$('deck').addEventListener('pointermove', (e) => { if (state.drag) { e.preventDefault(); track(e); } });
$('deck').addEventListener('pointerup', (e) => {
  if (!state.drag || e.pointerId !== state.drag.id) return;
  e.preventDefault();
  const ready = track(e);
  const drag = state.drag;
  state.drag = null;
  releasePointer(drag);
  if (!ready || state.session.match.revision !== drag.revision || !throwCard()) returnCard();
  controls();
});
$('deck').addEventListener('pointercancel', () => { if (state.drag) cancelDrag(); });
$('deck').addEventListener('lostpointercapture', () => { if (state.drag) cancelDrag(); });
window.addEventListener('resize', () => { if (state.drag) cancelDrag(); });

function throwCard() {
  if (!state.session.flip()) return false;
  // 참가자도 승인 왕복을 기다리지 않고 카드 뒷면부터 움직인다. 앞면은 공통 공개 시각까지 숨긴다.
  if (isPvp() && !duel.isHost) flyCard(state.me, 220);
  playSound('swipe');
  return true;
}
function keyboardFlip() {
  if (!state.session?.canFlip() || state.phase !== 'play') return;
  unlockAudio();
  liftCard($('deck').getBoundingClientRect());
  $('deck').classList.add('lifted');
  if (!throwCard()) returnCard();
}
$('deck').addEventListener('click', (e) => { if (e.detail === 0) keyboardFlip(); });
function flyCard(player, delay) {
  const slot = $(player === state.me ? 'me-pile' : 'opp-pile');
  const target = slot.getBoundingClientRect();
  if (player !== state.me || $('flier').hidden) {
    const from = player === state.me ? $('deck').getBoundingClientRect()
      : { left: target.left + 12, top: target.top - 70, width: target.width, height: target.height };
    liftCard(from);
  }
  if (player === state.me) $('deck').classList.add('lifted');
  const base = state.flyBase;
  const x = target.left - base.left, y = target.top - base.top;
  const scale = target.width / base.width;
  const from = getComputedStyle($('flier')).transform;
  state.animation?.cancel();
  state.animation = $('flier').animate(reducedMotion.matches ? [{ opacity: 0 }, { opacity: 0 }] : [
    { transform: from },
    { transform: `translate(${x * 0.65}px, ${y * 0.65 - 26}px) rotateX(-60deg) rotate(-5deg) scale(${scale})`, offset: 0.6 },
    { transform: `translate(${x}px, ${y}px) rotate(-3deg) scale(${scale})` },
  ], { duration: Math.max(1, delay), easing: 'cubic-bezier(.2,.65,.3,1)', fill: 'forwards' });
}
function landCard(player) {
  const face = $(player === state.me ? 'me-pile' : 'opp-pile').firstElementChild;
  if (reducedMotion.matches) return;
  face.animate([
    { transform: 'translateY(-6px) rotate(-3deg) scale(1.07)' },
    { transform: 'translateY(2px) rotate(1deg) scale(.98)', offset: 0.55 },
    { transform: 'none' },
  ], { duration: 220, easing: 'ease-out' });
}
function collectCards(before, player) {
  if (reducedMotion.matches) return;
  // 획득한 더미의 흔적이 손패 쪽으로 짧게 흘러간다.
  for (const [side, p] of [['me', state.me], ['opp', 1 - state.me]]) {
    if (!before.piles[p].length) continue;
    const slot = $(`${side}-pile`);
    const echo = document.createElement('div');
    echo.className = 'collection-echo';
    echo.innerHTML = cardHtml(before.piles[p].at(-1));
    slot.append(echo);
    const target = $(player === state.me ? 'deck' : 'opp-panel').getBoundingClientRect();
    const from = slot.getBoundingClientRect();
    const animation = echo.animate([
      { transform: 'none', opacity: 0.9 },
      { transform: `translate(${target.left - from.left}px, ${target.top - from.top}px) scale(.35) rotate(12deg)`, opacity: 0 },
    ], { duration: 350, easing: 'ease-in' });
    animation.onfinish = () => echo.remove();
  }
}

// ---------- 종, 소리, 진동 ----------
function ring() {
  if (state.phase !== 'play' || !state.session?.canRing()) return;
  unlockAudio();
  if (state.session.ring()) bellFeedback();
}
function bellFeedback() {
  playSound('bell');
  vibrate(12);
  if (!reducedMotion.matches) $('bell').animate([
    { transform: 'translateY(3px) scale(.92) rotate(-9deg)' },
    { transform: 'scale(1.06) rotate(7deg)', offset: 0.35 },
    { transform: 'rotate(-4deg)', offset: 0.65 }, { transform: 'none' },
  ], { duration: 380, easing: 'ease-out' });
}
function flash(type) {
  const color = type === 'miss' ? '#dc6b5555' : type === 'tie' ? '#6da4d355' : '#edc34f66';
  $('felt').animate([{ boxShadow: `inset 0 0 0 8px ${color}` }, { boxShadow: 'inset 0 0 0 0 transparent' }], { duration: reducedMotion.matches ? 1 : 450 });
}
$('bell').addEventListener('pointerdown', (e) => { if (e.button === 0) { e.preventDefault(); ring(); } });
$('bell').addEventListener('click', (e) => { if (e.detail === 0) ring(); });
document.addEventListener('keydown', (e) => {
  if (state.phase !== 'play' || $('rules').open || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
  const active = document.activeElement;
  if (active !== document.body && !active.closest('#game')) return;
  if (e.code === 'Space') { e.preventDefault(); ring(); }
  else if (e.code === 'ArrowUp' || e.code === 'Enter') {
    e.preventDefault();
    if (active === $('bell') && e.code === 'Enter') ring();
    else keyboardFlip();
  }
});
let audio = null;
function unlockAudio() {
  if (!state.sound) return;
  try {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!audio && Context) audio = new Context();
    if (audio?.state === 'suspended') audio.resume().catch(() => {});
  } catch { /* 오디오를 지원하지 않아도 게임은 그대로 진행한다. */ }
}
function playSound(type) {
  if (!state.sound || !audio || audio.state !== 'running') return;
  const now = audio.currentTime;
  if (type === 'swipe' || type === 'card') {
    const duration = type === 'swipe' ? 0.09 : 0.045;
    const buffer = audio.createBuffer(1, Math.ceil(audio.sampleRate * duration), audio.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const source = audio.createBufferSource(), gain = audio.createGain();
    source.buffer = buffer;
    gain.gain.setValueAtTime(type === 'swipe' ? 0.025 : 0.055, now);
    source.connect(gain).connect(audio.destination);
    source.start();
    return;
  }
  for (const [frequency, volume, duration] of type === 'bell' ? [[880, 0.09, 0.5], [1760, 0.035, 0.3], [2640, 0.015, 0.18]] : [[155, 0.06, 0.18]]) {
    const oscillator = audio.createOscillator(), gain = audio.createGain();
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
    oscillator.connect(gain).connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + duration);
  }
}
function vibrate(pattern) { if (!reducedMotion.matches) navigator.vibrate?.(pattern); }
$('sound').addEventListener('click', () => {
  state.sound = !state.sound;
  $('sound').textContent = state.sound ? '🔊' : '🔇';
  $('sound').setAttribute('aria-pressed', String(state.sound));
  $('sound').title = state.sound ? '효과음 켜짐' : '효과음 꺼짐';
  if (state.sound) unlockAudio();
});
$('show-rules').addEventListener('click', () => $('rules').showModal());

function finish(winner, reason) {
  if (state.phase === 'over' || state.phase === 'idle') return;
  state.phase = 'over';
  state.session.stop();
  clearAI();
  if (state.drag) { const drag = state.drag; state.drag = null; releasePointer(drag); }
  dropFlier();
  $('start-cue').hidden = true;
  controls();
  later(() => {
    const draw = winner === -1, won = winner === state.me;
    const match = state.session.match;
    duel.showResult({
      icon: draw ? 'even' : won ? 'trophy' : 'sad', tone: draw ? 'even' : won ? 'gold' : 'lose',
      title: draw ? '무승부' : won ? '승리' : '패배', status: reason,
      scores: [state.me, 1 - state.me].map((p) => ({
        side: p === state.me ? 'me' : 'opp', icon: p === state.me || isPvp() ? 'user' : 'bot',
        label: p === state.me ? '나' : opponent(), value: `${match.decks[p].length}장`,
        sub: `성공 ${match.catches[p]} · 오답 ${match.mistakes[p]}`, win: winner === p,
      })),
    });
  }, 650);
}
function cleanup() {
  state.session?.stop();
  clearAI();
  state.timers.forEach(clearTimeout);
  state.timers = [];
  if (state.drag) { const drag = state.drag; state.drag = null; releasePointer(drag); }
  dropFlier();
}
