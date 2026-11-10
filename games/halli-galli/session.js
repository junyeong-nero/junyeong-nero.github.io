import { TIE_MS, applyAction, canFlip, createGame, judgeRings } from './logic.js';

// 방장이 행동을 검증하고 양쪽에 같은 공개 시각을 예약한다.
// 종은 짧은 수집 구간 동안 받은 '화면 공개 후 반응 시간'으로 판정한다.
export function createSession({ seed, me = 0, pvp = false, send = () => {}, onState = () => {},
  onPending = () => {}, onReady = () => {}, onControls = () => {}, onReject = () => {}, onError = () => {},
  clock = () => performance.now(), schedule = setTimeout, cancel = clearTimeout }) {
  const host = !pvp || me === 0;
  let match = createGame(seed);
  let ready = false, stopped = false, pending = null, judging = false, waiting = null;
  let shownAt = 0, unlockAt = 0, ringAt = 0, offset = 0, rtt = 0, bestRtt = Infinity, probe = 0, probeAt = 0, launched = false;
  let peerShown = { n: -1, at: 0 }, deferred = null, judgeTimer = null;
  const claims = new Map();
  const timers = new Set();
  const later = (fn, delay) => {
    if (stopped) return null;
    const id = schedule(() => { timers.delete(id); if (!stopped) fn(); }, Math.ceil(Math.max(0, delay)));
    timers.add(id);
    return id;
  };
  const transmit = (msg) => { if (pvp && !stopped) send({ ...msg, seed: match.seed }); };
  const localNow = () => clock();
  const hostNow = () => localNow() + (host ? 0 : offset);
  const lead = () => Math.max(220, Math.min(1000, rtt * 1.5 + 120));
  const ringAllowed = (player) => (player === 0 || player === 1) && ready && !stopped && match.winner === null && !pending
    && !(player === me && waiting) && !claims.has(player) && match.piles.some((pile) => pile.length)
    && localNow() >= ringAt;
  const flipAllowed = (player) => ready && !stopped && !pending && !judging && !waiting
    && (!pvp || !host || peerShown.n === match.revision)
    && localNow() >= unlockAt && canFlip(match, player);

  function launch(at) {
    if (launched) return;
    launched = true;
    onPending({ type: 'start', delay: Math.max(0, at - hostNow()) });
    later(() => {
      ready = true;
      shownAt = localNow();
      unlockAt = shownAt;
      if (!host) transmit({ t: 'shown', n: match.revision });
      onReady();
      onControls();
    }, at - hostNow());
  }

  function startProbe() {
    probeAt = localNow();
    transmit({ t: 'probe', probe, at: probeAt });
  }

  function reject(player, request, text) {
    if (player !== me && pvp) transmit({ t: 'rejected', n: request.n, kind: request.kind, text });
    else if (player === me) { waiting = null; onReject(text); onControls(); }
  }

  function queueCommit(msg) {
    if (pending || msg.n !== match.revision || !Number.isFinite(msg.at) || msg.at > hostNow() + 5000) return false;
    const result = applyAction(match, msg.action);
    if (!result.ok) return false;
    pending = result.state;
    const delay = Math.max(0, msg.at - hostNow());
    onPending({ type: msg.action.type, player: msg.action.player, delay });
    onControls();
    later(() => {
      const before = match;
      match = pending;
      pending = null;
      waiting = null;
      judging = false;
      claims.clear();
      shownAt = localNow();
      // 착지와 종 피드백을 읽을 수 있게 잠깐만 다음 입력을 쉰다.
      unlockAt = shownAt + (msg.action.type === 'flip' ? 400 : 650);
      ringAt = shownAt + (msg.action.type === 'flip' ? 0 : 650);
      if (!host) transmit({ t: 'shown', n: match.revision });
      onState(match, before);
      onControls();
      later(onControls, unlockAt - localNow() + 2);
      if (host && deferred) {
        const request = deferred;
        deferred = null;
        acceptRemote(request);
      }
    }, delay);
    return true;
  }

  function publish(action) {
    const msg = { t: 'commit', n: match.revision, action, at: hostNow() + lead() };
    if (queueCommit(msg)) transmit(msg);
  }

  // 비대칭 지연/백그라운드 탭에서는 상대가 먼저 공개할 수 있다. 그 입력을 버리지 않고 보관한다.
  function acceptRemote(request) {
    if (pending?.revision === request.n) { if (!deferred) deferred = request; return; }
    const gate = request.kind === 'flip' ? unlockAt : ringAt;
    if (request.n === match.revision && localNow() < gate) {
      if (deferred) return;
      deferred = request;
      later(() => {
        if (deferred !== request) return;
        deferred = null;
        acceptRemote(request);
      }, gate - localNow());
      return;
    }
    accept(1, request);
  }

  function armJudge() {
    if (!judging || pending || (pvp && peerShown.n !== match.revision)) return;
    if (judgeTimer !== null) { cancel(judgeTimer); timers.delete(judgeTimer); }
    const fastest = Math.min(...[...claims.values()].map((c) => c.elapsed));
    const bothShownAt = Math.max(shownAt, pvp ? peerShown.at : shownAt);
    const allowance = Math.max(120, Math.min(700, rtt * 1.5 + 90));
    // 더 늦게 공개된 화면에서도 더 빠른 반응 + 동시 입력 범위를 보장한다.
    judgeTimer = later(() => {
      judgeTimer = null;
      const winner = judgeRings([...claims.values()]);
      if (winner !== null) publish(winner === -1 ? { type: 'tie' } : { type: 'ring', player: winner });
    }, Math.max(80, bothShownAt + fastest + TIE_MS + allowance - localNow()));
  }

  function accept(player, request) {
    if (!ready || match.winner !== null || request.n !== match.revision || pending) {
      reject(player, request, '카드가 바뀌었어요. 현재 테이블에서 다시 시도해 주세요.');
      return;
    }
    if (request.kind === 'flip') {
      if (judging || localNow() < unlockAt || !canFlip(match, player)) {
        reject(player, request, '잠깐! 내 차례에 위로 스와이프해 주세요.');
        return;
      }
      publish({ type: 'flip', player });
      return;
    }
    if (request.kind !== 'ring' || claims.has(player)) return;
    const elapsed = request.elapsed;
    const remote = pvp && player !== me;
    const observed = localNow() - (remote ? peerShown.at : shownAt);
    const tolerance = remote ? Math.max(180, rtt * 2) : 120;
    // 상대의 실제 공개 확인과 종 입력 사이의 간격을 비교한다. 내 화면 공개 시각과 혼동하지 않는다.
    if ((remote && peerShown.n !== match.revision) || !match.piles.some((pile) => pile.length)
      || localNow() < ringAt || !Number.isFinite(elapsed)
      || elapsed < Math.max(0, observed - tolerance) || elapsed > observed + tolerance) {
      reject(player, request, '종 입력 시각을 확인하지 못했어요. 다시 눌러 주세요.');
      return;
    }
    claims.set(player, { player, elapsed });
    if (!judging) {
      judging = true;
      onPending({ type: 'judging', player });
      transmit({ t: 'judging', n: match.revision, player });
      onControls();
    }
    armJudge();
  }

  function request(kind, player) {
    if ((pvp && player !== me) || (kind === 'flip' ? !flipAllowed(player) : !ringAllowed(player))) return false;
    const intent = { t: 'intent', kind, n: match.revision, elapsed: localNow() - shownAt };
    if (player === me) waiting = { kind, n: match.revision };
    onControls();
    if (host) accept(player, intent);
    else transmit(intent);
    return true;
  }

  function receive(msg) {
    if (stopped || !msg || msg.seed !== match.seed) return;
    if (host) {
      if (msg.t === 'probe' && !ready && Number.isInteger(msg.probe) && msg.probe >= 0 && msg.probe < 3 && Number.isFinite(msg.at)) {
        transmit({ t: 'pong', probe: msg.probe, at: msg.at, hostAt: localNow() });
      } else if (msg.t === 'synced' && !launched && Number.isFinite(msg.rtt) && msg.rtt >= 0 && msg.rtt < 5000) {
        rtt = msg.rtt;
        const at = hostNow() + 800 + rtt;
        transmit({ t: 'launch', at });
        launch(at);
      } else if (msg.t === 'shown' && Number.isInteger(msg.n) && (msg.n === match.revision || msg.n === pending?.revision)) {
        if (msg.n > peerShown.n) peerShown = { n: msg.n, at: localNow() };
        if (judging && msg.n === match.revision) transmit({ t: 'judging', n: msg.n, player: claims.keys().next().value });
        armJudge();
        onControls();
      } else if (msg.t === 'intent' && ['flip', 'ring'].includes(msg.kind)) acceptRemote(msg);
      return;
    }
    if (msg.t === 'pong' && !launched && msg.probe === probe && msg.at === probeAt && Number.isFinite(msg.hostAt)) {
      const roundTrip = localNow() - probeAt;
      if (roundTrip < bestRtt) {
        bestRtt = roundTrip;
        rtt = roundTrip;
        offset = msg.hostAt - (probeAt + localNow()) / 2;
      }
      probe++;
      if (probe < 3) later(startProbe, 60);
      else transmit({ t: 'synced', rtt });
    } else if (msg.t === 'launch' && probe === 3 && Number.isFinite(msg.at) && msg.at <= hostNow() + 6000) {
      launch(msg.at);
    } else if (msg.t === 'commit' && ready) {
      queueCommit(msg);
    } else if (msg.t === 'judging' && ready && !pending && !judging && msg.n === match.revision) {
      judging = true;
      onPending({ type: 'judging', player: msg.player });
      onControls();
    } else if (msg.t === 'rejected' && waiting && msg.n === waiting.n && msg.kind === waiting.kind) {
      waiting = null;
      onReject('입력이 반영되지 않았어요. 현재 테이블에서 다시 시도해 주세요.');
      onControls();
    }
  }

  return {
    get match() { return match; },
    get ready() { return ready; },
    get judging() { return judging; },
    canFlip: (player = me) => flipAllowed(player),
    canRing: (player = me) => ringAllowed(player),
    flip: (player = me) => request('flip', player),
    ring: (player = me) => request('ring', player),
    receive,
    start() {
      if (!pvp) launch(hostNow() + 700);
      else {
        onPending({ type: 'sync' });
        if (!host) startProbe();
        later(() => { if (!ready) onError('연결 시간을 맞추지 못했어요. 방에 다시 참가해 주세요.'); }, 12000);
      }
    },
    stop() {
      stopped = true;
      ready = false;
      timers.forEach(cancel);
      timers.clear();
    },
  };
}
