import test from 'node:test';
import assert from 'node:assert/strict';
import { CARDS, createGame } from './logic.js';
import { createSession } from './session.js';

const firstFiveSeed = (() => {
  for (let seed = 0; seed < 1000; seed += 2) if (CARDS[createGame(seed).decks[0][0]].count === 5) return seed;
  throw new Error('No five-card seed');
})();

function rig(latency = 40) {
  let now = 0, seq = 0, guestSkew = 0;
  const jobs = new Map();
  const states = [[], []], errors = [], rejected = [], pending = [[], []];
  const schedule = (fn, ms) => { const id = ++seq; jobs.set(id, { at: now + ms, fn }); return id; };
  const cancel = (id) => jobs.delete(id);
  const advance = (ms) => {
    const end = now + ms;
    while (true) {
      const next = [...jobs.entries()].filter(([, job]) => job.at <= end).sort((a, b) => a[1].at - b[1].at || a[0] - b[0])[0];
      if (!next) break;
      jobs.delete(next[0]);
      now = next[1].at;
      next[1].fn();
    }
    now = end;
  };
  const peers = [0, 1].map((me) => createSession({
    seed: firstFiveSeed, me, pvp: true,
    clock: () => now + (me ? 50000 + guestSkew : 0), schedule, cancel,
    send: (msg) => schedule(() => peers[1 - me].receive(structuredClone(msg)), latency),
    onState: (state) => states[me].push(structuredClone(state)),
    onPending: (event) => pending[me].push({ ...event, time: now }),
    onError: (error) => errors.push(error), onReject: (error) => rejected.push(error),
  }));
  peers.forEach((peer) => peer.start());
  advance(4000);
  assert.ok(peers.every((peer) => peer.ready));
  const reveal = () => {
    assert.equal(peers[0].flip(), true);
    const delay = Math.max(220, latency * 3 + 120);
    advance(delay);
    assert.equal(peers[0].match.revision, 1);
    assert.deepEqual(peers[0].match, peers[1].match);
  };
  return { peers, advance, reveal, states, pending, errors, rejected, skewGuest: (ms) => { guestSkew = ms; } };
}

test('clock synchronization schedules the same reveal despite a 50-second clock offset', () => {
  const r = rig();
  assert.equal(r.peers[0].flip(), true);
  assert.equal(r.peers[0].flip(), false);
  r.advance(239);
  assert.equal(r.peers[0].match.revision, 0);
  assert.equal(r.peers[1].match.revision, 0);
  r.advance(1);
  assert.equal(r.peers[0].match.revision, 1);
  assert.deepEqual(r.peers[0].match, r.peers[1].match);
  assert.deepEqual(r.errors, []);
});

test('bell works immediately after landing, even while the next flip is cooling down', () => {
  const r = rig();
  r.reveal();
  r.advance(100);
  assert.equal(r.peers[1].canFlip(), false);
  assert.equal(r.peers[0].ring(), true);
  assert.equal(r.peers[0].ring(), false);
  r.advance(1200);
  assert.equal(r.peers[0].match.catches[0], 1);
  assert.deepEqual(r.peers[0].match, r.peers[1].match);
});

test('two close rings resolve once as a tie and cannot award the piles twice', () => {
  const r = rig();
  r.reveal();
  r.advance(200);
  assert.equal(r.peers[0].ring(), true);
  r.advance(40);
  assert.equal(r.peers[1].ring(), true);
  r.advance(1400);
  assert.equal(r.peers[0].match.ties, 1);
  assert.equal(r.peers[0].match.revision, 2);
  assert.deepEqual(r.peers[0].match.catches, [0, 0]);
  assert.equal(r.peers[0].match.piles[0].length, 1);
  assert.deepEqual(r.peers[0].match, r.peers[1].match);
});

test('a faster guest wins even when the slower host claim arrives first', () => {
  const r = rig(120);
  r.reveal();
  r.advance(200);
  assert.equal(r.peers[1].ring(), true);
  r.advance(80);
  assert.equal(r.peers[0].ring(), true);
  r.advance(2000);
  assert.deepEqual(r.peers[0].match.catches, [0, 1]);
  assert.deepEqual(r.peers[0].match, r.peers[1].match);
  assert.deepEqual(r.rejected, []);
});

test('stale revisions, wrong seeds and impossible reaction times do not change the game', () => {
  const r = rig();
  r.reveal();
  r.advance(100);
  const before = structuredClone(r.peers[0].match);
  const seed = before.seed;
  for (const msg of [
    { t: 'intent', seed: seed + 1, n: 1, kind: 'ring', elapsed: 100 },
    { t: 'intent', seed, n: 0, kind: 'ring', elapsed: 100 },
    { t: 'intent', seed, n: 1, kind: 'ring', elapsed: Infinity },
    { t: 'intent', seed, n: 1, kind: 'ring', elapsed: -5 },
    { t: 'intent', seed, n: 1, kind: 'ring', elapsed: 100000 },
  ]) r.peers[0].receive(msg);
  r.advance(1000);
  assert.deepEqual(r.peers[0].match, before);
});

test('ring arbitration locks flips, but still accepts the other player’s bell', () => {
  const r = rig();
  r.reveal();
  r.advance(500);
  assert.equal(r.peers[1].canFlip(), true);
  r.peers[0].ring();
  r.advance(40);
  assert.equal(r.peers[1].canFlip(), false);
  assert.equal(r.peers[1].canRing(), true);
  r.peers[1].ring();
  r.advance(1400);
  assert.equal(r.peers[0].match.ties, 1);
});

test('an early guest reveal does not lose a legitimate ring before the host reveals', () => {
  const r = rig();
  r.skewGuest(300); // 비대칭 지연으로 인한 공개 시각 추정 오차 재현
  r.peers[0].flip();
  r.advance(40);
  assert.equal(r.peers[1].match.revision, 1);
  assert.equal(r.peers[0].match.revision, 0);
  r.advance(150);
  assert.equal(r.peers[1].ring(), true);
  r.advance(90); // 호스트 공개 후 40ms, 게스트는 공개 후 150ms
  assert.equal(r.peers[0].ring(), true);
  r.advance(1800);
  assert.deepEqual(r.peers[0].match.catches, [1, 0]);
  assert.deepEqual(r.peers[0].match, r.peers[1].match);
  assert.deepEqual(r.rejected, []);
});

test('judgement waits for a late guest to actually see the card before comparing reactions', () => {
  const r = rig();
  r.skewGuest(-500);
  r.peers[0].flip();
  r.advance(390); // 호스트 공개(240ms) 후 150ms
  assert.equal(r.peers[0].ring(), true);
  assert.equal(r.peers[1].match.revision, 0);
  r.advance(400); // 게스트 공개(740ms) 후 50ms
  assert.equal(r.peers[1].ring(), true);
  r.advance(2300);
  assert.deepEqual(r.peers[0].match.catches, [0, 1]);
  assert.deepEqual(r.peers[0].match, r.peers[1].match);
  assert.deepEqual(r.rejected, []);
});

test('an early guest flip waits for the host cooldown instead of being lost', () => {
  const r = rig();
  r.skewGuest(300);
  r.peers[0].flip();
  r.advance(450);
  assert.equal(r.peers[1].flip(), true);
  r.advance(1200);
  assert.equal(r.peers[0].match.revision, 2);
  assert.equal(r.peers[0].match.last.player, 1);
  assert.deepEqual(r.peers[0].match, r.peers[1].match);
  assert.deepEqual(r.rejected, []);
});

test('stopping a session cancels scheduled reveals and ignores late messages', () => {
  const r = rig();
  r.peers[0].flip();
  r.peers.forEach((p) => p.stop());
  r.advance(2000);
  assert.equal(r.peers[0].match.revision, 0);
  assert.equal(r.peers[1].match.revision, 0);
  assert.deepEqual(r.states, [[], []]);
});
