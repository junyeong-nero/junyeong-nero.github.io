import { CARDS, EDGES, ISLANDS, LINKS, applyAction, applyTurn, chooseTurn, counts, createGame, majority, owners } from './logic.js';
import { createDuel } from '../shared/duel.js';

const $ = (id) => document.getElementById(id);
const state = { phase: 'idle', match: null, draft: null, me: 0, selected: new Set(), moves: [], timer: 0, lastMove: '' };
const myTurn = () => state.phase === 'play' && state.match.turn === state.me;
const isPvp = () => duel.mode === 'pvp';
const opponent = () => isPvp() ? '상대' : 'AI';
const color = (player) => player === 0 ? 'black' : 'white';

const duel = createDuel({
  gameId: 'kahuna',
  rule: `<div class="rule" role="img" aria-label="다리로 연결된 세 섬">
    <svg class="rule-map" viewBox="0 0 200 84" aria-hidden="true"><path d="M32 57 100 25 168 57"/>
      <ellipse cx="32" cy="57" rx="27" ry="18"/><ellipse cx="100" cy="25" rx="27" ry="18"/>
      <ellipse cx="168" cy="57" rx="27" ry="18"/><circle cx="100" cy="25" r="8"/></svg>
    </div><p class="rule-caption">다리를 놓아 섬을 차지하세요</p>`,
  chips: [
    { icon: 'link', text: '12개 섬', label: '12개 섬의 다리 연결 전략 게임' },
    { icon: 'trophy', text: '3라운드', label: '3라운드 합계 점수로 승부' },
  ],
  solo: { icon: 'bot', label: 'AI 대전' },
  onStart({ seed, mode }) {
    clearTimeout(state.timer);
    Object.assign(state, {
      phase: 'play', match: createGame(seed), me: mode === 'pvp' && !duel.isHost ? 1 : 0,
      lastMove: '카드를 골라 다리를 놓아 보세요.',
    });
    resetDraft();
    startTurn();
  },
  onMessage(msg) {
    if (state.phase !== 'play' || !msg || msg.t !== 'turn' || myTurn()
      || msg.seed !== state.match.seed || msg.n !== state.match.revision) return;
    takeTurn(1 - state.me, msg.action);
  },
  onPeerGone() {
    if (state.phase === 'play') { resetDraft(); finish(state.me, '상대 연결 끊김'); }
  },
  onLeave() {
    clearTimeout(state.timer);
    state.phase = 'idle';
    state.selected.clear();
  },
});

function resetDraft() {
  state.draft = state.match;
  state.moves = [];
  state.selected.clear();
}

function selectedMove(edge) {
  const cards = [...state.selected];
  return { type: state.draft.bridges[edge] === -1 ? 'build' : 'remove', cards, edge };
}

// Coco–Kahu는 바깥 바다로 돌아가서 Gola와 겹치지 않도록 그린다.
function geometry(edge) {
  const [a, b] = EDGES[edge].map((i) => ISLANDS[i]);
  if (EDGES[edge][0] === 2 && EDGES[edge][1] === 10) {
    return { path: `M${a.x} ${a.y} Q570 245 ${b.x} ${b.y}`, x: 505, y: 245 };
  }
  return { path: `M${a.x} ${a.y} L${b.x} ${b.y}`, x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}

function renderBoard() {
  const { draft, me } = state;
  const control = owners(draft.bridges);
  const selectedIslands = new Set([...state.selected].map((id) => CARDS[id].island));
  const edges = EDGES.map((ends, edge) => {
    const owner = draft.bridges[edge];
    const valid = myTurn() && state.selected.size > 0 && applyAction(draft, me, selectedMove(edge)).ok;
    const g = geometry(edge);
    const names = ends.map((i) => ISLANDS[i].name).join('–');
    const action = owner === -1 ? '다리 놓기' : '다리 제거';
    return `<g class="bridge ${owner === -1 ? 'empty' : color(owner)} ${valid ? 'available' : ''}"
      data-edge="${edge}" role="button" tabindex="${valid ? 0 : -1}" aria-disabled="${!valid}"
      aria-label="${names} ${action}${owner === -1 ? '' : owner === me ? ' · 내 다리' : ' · 상대 다리'}">
      <path class="route" d="${g.path}"/><path class="bridge-line" d="${g.path}"/>
      <path class="hit-area" d="${g.path}"/>
      ${valid ? `<circle class="action-dot" cx="${g.x}" cy="${g.y}" r="12"/><text class="action-mark" x="${g.x}" y="${g.y + 5}">${owner === -1 ? '+' : '−'}</text>` : ''}
      <title>${names} · ${owner === -1 ? '빈 연결선' : owner === me ? '내 다리' : '상대 다리'}</title>
    </g>`;
  }).join('');
  const islands = ISLANDS.map((island, i) => {
    const owner = control[i];
    const mine = LINKS[i].filter((edge) => draft.bridges[edge] === me).length;
    const theirs = LINKS[i].filter((edge) => draft.bridges[edge] === 1 - me).length;
    const label = `${island.name}: ${owner === -1 ? '미점유' : owner === me ? '내 섬' : '상대 섬'}, 다리 ${LINKS[i].length}개 중 ${majority(i)}개 필요, 나 ${mine}개, 상대 ${theirs}개`;
    return `<g class="island ${owner === -1 ? 'neutral' : color(owner)} ${selectedIslands.has(i) ? 'selected' : ''}" role="img" aria-label="${label}">
      <ellipse class="shore" cx="${island.x}" cy="${island.y}" rx="38" ry="28"/>
      <ellipse class="land" cx="${island.x}" cy="${island.y}" rx="32" ry="23"/>
      <text class="island-name" x="${island.x}" y="${island.y - 2}">${island.name}</text>
      <text class="island-need" x="${island.x}" y="${island.y + 14}">${majority(i)} / ${LINKS[i].length}</text>
      <title>${label}</title>
    </g>`;
  }).join('');
  $('board').innerHTML = `<path class="sea-wave" d="M25 400q12-12 24 0t24 0 M420 35q12-12 24 0t24 0 M320 455q12-12 24 0t24 0"/>${edges}${islands}`;
}

function cardContent(id) {
  const island = CARDS[id].island;
  return `<span class="card-name">${ISLANDS[island].name}</span><span class="card-detail">${majority(island)} / ${LINKS[island].length}</span>`;
}

function render() {
  const { match, draft, me } = state;
  const active = document.activeElement;
  const focus = active?.dataset.hand !== undefined ? `[data-hand="${active.dataset.hand}"]`
    : active?.dataset.edge !== undefined ? `[data-edge="${active.dataset.edge}"]` : active?.id ? `#${active.id}` : null;
  const mine = myTurn();
  const totals = counts(draft);
  const final = match.finalTurns !== null;
  $('me-stone').className = `stone ${color(me)}`;
  $('opp-stone').className = `stone ${color(1 - me)}`;
  $('me-panel').classList.toggle('turn', mine);
  $('opp-panel').classList.toggle('turn', state.phase === 'play' && !mine);
  $('me-score').textContent = match.scores[me];
  $('opp-score').textContent = match.scores[1 - me];
  $('me-count').textContent = `섬 ${totals.islands[me]} · 다리 ${totals.bridges[me]}`;
  $('opp-count').textContent = `섬 ${totals.islands[1 - me]} · 다리 ${totals.bridges[1 - me]}`;
  $('opp-name').textContent = opponent();
  $('round').textContent = `${match.round} / 3`;
  $('round-label').textContent = final ? `추가 턴 ${match.finalTurns}회 남음`
    : match.round < 3 ? `${match.round}라운드 · 승자 ${match.round}점` : '마지막 · 섬 수 차이';
  $('turn-status').textContent = state.phase === 'over' ? '게임 종료'
    : `${mine ? '내 차례' : `${opponent()} 차례`} · ${state.lastMove}`;
  renderBoard();
  $('hand-count').textContent = `${draft.hands[me].length} / 5`;
  $('opp-hand').textContent = `${opponent()} ${match.hands[1 - me].length}장`;
  $('hand').innerHTML = [...draft.hands[me]].sort((a, b) => a - b).map((id) => `<button type="button"
    class="island-card ${state.selected.has(id) ? 'selected' : ''}" data-hand="${id}"
    aria-label="${ISLANDS[CARDS[id].island].name} 카드" aria-pressed="${state.selected.has(id)}" ${mine ? '' : 'disabled'}>
    ${cardContent(id)}</button>`).join('') || '<p class="empty-hand">손패를 모두 사용했어요.</p>';
  $('selection-status').textContent = state.phase === 'over' ? '게임이 끝났어요.'
    : !mine ? '상대가 턴을 마칠 때까지 기다려 주세요.'
    : state.selected.size === 1 ? '강조된 빈 연결선을 누르면 다리를 놓아요.'
      : state.selected.size === 2 ? '강조된 상대 다리를 누르면 제거해요.'
        : state.selected.size > 2 ? `${state.selected.size}장 선택 · 선택 카드를 버릴 수 있어요.`
          : '카드 1장 → 다리 놓기 · 카드 2장 → 상대 다리 제거';
  $('discard').disabled = !mine || !state.selected.size || final;
  $('clear-selection').disabled = !state.selected.size;
  const canDraw = mine && !final && draft.hands[me].length < 5;
  $('draw-hint').textContent = final ? '추가 턴에는 뽑기 없음' : draft.hands[me].length === 5 ? '손패를 먼저 줄이세요'
    : match.mustDraw ? '이번 턴은 반드시 뽑기' : '공개 카드 또는 더미';
  $('market').innerHTML = match.market.map((id, i) => `<button class="island-card market-card" type="button" data-draw="${i}"
    aria-label="${id === null ? '빈 공개 카드 자리' : `${ISLANDS[CARDS[id].island].name} 뽑고 턴 종료`}"
    ${canDraw && id !== null ? '' : 'disabled'}>${id === null ? '<span class="card-name">—</span>' : cardContent(id)}</button>`).join('')
    + `<button class="island-card deck-card" type="button" data-draw="deck" aria-label="더미에서 뽑고 턴 종료"
      ${canDraw && match.deck.length ? '' : 'disabled'}><span class="card-name">더미</span><span class="card-detail">${match.deck.length}장</span></button>`;
  $('undo').disabled = !mine || !state.moves.length;
  const eliminated = match.round > 1 && totals.bridges[me] > 0 && !totals.bridges[1 - me];
  $('end-turn').disabled = !mine || (!final && match.mustDraw && !eliminated);
  $('end-turn').textContent = final || eliminated ? '턴 확정' : '뽑지 않고 종료';
  $('move-count').textContent = state.phase === 'over' ? ''
    : final ? '마지막 기회예요. 카드를 사용한 뒤 턴을 확정하세요.'
      : state.moves.length ? `${state.moves.length}회 작업 · 뽑기 또는 턴 종료로 확정하세요.` : '카드를 뽑으면 턴이 바로 끝나요.';
  $('score-history').textContent = match.history.map((r) => `${r.round}R · 나 +${r.points[me]} / ${opponent()} +${r.points[1 - me]}`).join('   |   ');
  if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
}

function stage(move) {
  if (!myTurn()) return;
  const result = applyAction(state.draft, state.me, move);
  if (!result.ok) { duel.toast(result.error); return; }
  state.draft = result.state;
  state.moves.push(move);
  state.selected.clear();
  render();
}

$('hand').addEventListener('click', (e) => {
  const card = e.target.closest('[data-hand]');
  if (!card || card.disabled || !myTurn()) return;
  const id = Number(card.dataset.hand);
  if (state.selected.has(id)) state.selected.delete(id);
  else state.selected.add(id);
  render();
});
function clickBridge(e) {
  const bridge = e.target.closest('[data-edge]');
  if (!bridge || !myTurn() || bridge.getAttribute('aria-disabled') === 'true') return;
  stage(selectedMove(Number(bridge.dataset.edge)));
}
$('board').addEventListener('click', clickBridge);
$('board').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickBridge(e); }
});
$('market').addEventListener('click', (e) => {
  const card = e.target.closest('[data-draw]');
  if (card && !card.disabled) sendTurn(card.dataset.draw === 'deck' ? 'deck' : Number(card.dataset.draw));
});
$('discard').addEventListener('click', () => stage({ type: 'discard', cards: [...state.selected] }));
$('clear-selection').addEventListener('click', () => { state.selected.clear(); render(); });
$('undo').addEventListener('click', () => { if (myTurn()) { resetDraft(); render(); } });
$('end-turn').addEventListener('click', () => { if (myTurn()) sendTurn(null); });
$('show-rules').addEventListener('click', () => $('rules').showModal());

function sendTurn(draw) {
  const { seed, revision } = state.match;
  const action = { moves: [...state.moves], draw };
  if (takeTurn(state.me, action)) duel.send({ t: 'turn', seed, n: revision, action });
}

function takeTurn(player, action) {
  const result = applyTurn(state.match, player, action);
  if (!result.ok) { if (player === state.me) duel.toast(result.error); return false; }
  const name = player === state.me ? '나' : opponent();
  const built = action.moves.filter((move) => move.type === 'build').length;
  const removed = action.moves.filter((move) => move.type === 'remove').length;
  const summary = [built ? `다리 ${built}개 놓음` : '', removed ? `다리 ${removed}개 제거` : ''].filter(Boolean).join(', ');
  state.lastMove = `${name}: ${summary || (action.draw === null ? '뽑기 건너뜀' : '카드 1장 뽑음')}`;
  const scored = result.state.history.length > state.match.history.length;
  state.match = result.state;
  resetDraft();
  if (state.match.winner !== null) {
    finish(state.match.winner, state.match.reason === 'no-bridges' ? '한쪽의 다리가 모두 사라졌어요' : '3라운드 점수 집계 완료');
  } else {
    if (scored) {
      const r = state.match.history.at(-1);
      duel.toast(`${r.round}라운드 · 나 +${r.points[state.me]}점 / ${opponent()} +${r.points[1 - state.me]}점`);
    }
    startTurn();
  }
  return true;
}

function startTurn() {
  clearTimeout(state.timer);
  render();
  if (!isPvp() && !myTurn()) {
    state.timer = setTimeout(() => {
      if (state.phase === 'play') takeTurn(1 - state.me, chooseTurn(state.match));
    }, 750);
  }
}

function finish(winner, reason) {
  clearTimeout(state.timer);
  state.phase = 'over';
  state.selected.clear();
  render();
  state.timer = setTimeout(() => {
    const draw = winner === -1;
    const won = winner === state.me;
    const totals = counts(state.match);
    duel.showResult({
      icon: draw ? 'even' : won ? 'trophy' : 'sad', tone: draw ? 'even' : won ? 'gold' : 'lose',
      title: draw ? '무승부' : won ? '승리' : '패배', status: reason,
      extra: `<div class="score-breakdown">${state.match.history.map((r) => `${r.round}R · 나 ${r.points[state.me]} : ${opponent()} ${r.points[1 - state.me]}`).join('<br>')}</div>`,
      scores: [state.me, 1 - state.me].map((player) => ({
        side: player === state.me ? 'me' : 'opp', icon: player === state.me || isPvp() ? 'user' : 'bot',
        label: player === state.me ? '나' : opponent(), value: `${state.match.scores[player]}점`,
        sub: `섬 ${totals.islands[player]} · 다리 ${totals.bridges[player]}`, win: winner === player,
      })),
    });
  }, 550);
}
