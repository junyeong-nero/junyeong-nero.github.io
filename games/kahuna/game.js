import { CARDS, EDGES, ISLANDS, LINKS, applyAction, applyTurn, chooseTurn, counts, createGame, majority, owners } from './logic.js';
import { createDuel } from '../shared/duel.js';
import { ISLAND_SHAPES, islandIcon, islandTargets, selectedMoves } from './interaction.js';

const $ = (id) => document.getElementById(id);
const state = { phase: 'idle', match: null, draft: null, me: 0, selected: new Set(), moves: [], mode: 'build', feedback: '', timer: 0, lastMove: '' };
const myTurn = () => state.phase === 'play' && state.match.turn === state.me;
const isPvp = () => duel.mode === 'pvp';
const opponent = () => isPvp() ? '상대' : 'AI';
const color = (player) => player === state.me ? 'mine' : 'theirs';

const duel = createDuel({
  gameId: 'kahuna',
  rule: `<div class="rule rule-map" role="img" aria-label="서로 다른 모양의 두 섬을 다리로 연결">
    ${islandIcon(0)}<span aria-hidden="true">—</span>${islandIcon(1)}
    </div><p class="rule-caption"><strong>다리를 놓아 내 섬을 늘리세요.</strong><br>카드 고르기 → 연결할 섬 누르기 → 1장 뽑기.</p>`,
  chips: [
    { icon: 'link', text: '12개 섬', label: '12개 섬의 다리 연결 전략 게임' },
    { icon: 'trophy', text: '3라운드', label: '3라운드 합계 점수로 승부' },
  ],
  solo: { icon: 'bot', label: 'AI 대전' },
  onStart({ seed, mode }) {
    clearTimeout(state.timer);
    Object.assign(state, {
      phase: 'play', match: createGame(seed), me: mode === 'pvp' && !duel.isHost ? 1 : 0,
      lastMove: '파랑은 나, 주황은 상대예요.',
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
  state.mode = 'build';
  state.feedback = '';
  state.selected.clear();
}

function selectedMove(edge) {
  const cards = [...state.selected];
  return { type: state.mode, cards, edge };
}

// Coco–Kahu는 바깥 바다로 돌아가서 Gola와 겹치지 않도록 그린다.
function geometry(edge) {
  const [a, b] = EDGES[edge].map((i) => ISLANDS[i]);
  if (EDGES[edge][0] === 2 && EDGES[edge][1] === 10) {
    return { path: `M${a.x} ${a.y} Q570 245 ${b.x} ${b.y}` };
  }
  return { path: `M${a.x} ${a.y} L${b.x} ${b.y}` };
}

function renderBoard() {
  const { draft, me } = state;
  const control = owners(draft.bridges);
  const moves = myTurn() ? selectedMoves(draft, me, [...state.selected], state.mode) : [];
  const targets = islandTargets(moves);
  const selectedIslands = new Set([...state.selected].map((id) => CARDS[id].island));
  const edges = EDGES.map((ends, edge) => {
    const owner = draft.bridges[edge], valid = moves.some((move) => move.edge === edge);
    const g = geometry(edge), names = ends.map((i) => ISLANDS[i].name).join('–');
    return `<g class="bridge ${owner === -1 ? 'empty' : color(owner)} ${valid ? 'available' : ''}"
      data-edge="${edge}" role="button" tabindex="${valid ? 0 : -1}" aria-disabled="${!valid}"
      ${valid ? '' : 'aria-hidden="true"'} aria-label="${names} ${state.mode === 'build' ? '다리 놓기' : '상대 다리 제거'}">
      <path class="route" d="${g.path}"/><path class="bridge-line" d="${g.path}"/>
      <path class="hit-area" d="${g.path}"/>
      <title>${names} · ${owner === -1 ? '빈 연결선' : owner === me ? '내 다리' : '상대 다리'}</title>
    </g>`;
  }).join('');
  const islands = ISLANDS.map((island, i) => {
    const owner = control[i], destination = targets.has(i);
    const pick = myTurn() && state.mode === 'build' && draft.hands[me].some((id) => CARDS[id].island === i);
    const active = destination || pick;
    const mine = LINKS[i].filter((edge) => draft.bridges[edge] === me).length;
    const theirs = LINKS[i].filter((edge) => draft.bridges[edge] === 1 - me).length;
    const label = `${island.name}: ${owner === -1 ? '미점유' : owner === me ? '내 섬' : '상대 섬'}, 다리 ${majority(i)}개 필요, 나 ${mine}개, 상대 ${theirs}개${destination ? state.mode === 'build' ? ' · 여기로 연결' : ' · 이 다리 제거' : pick ? ' · 카드 선택' : ''}`;
    return `<g class="island ${owner === -1 ? 'neutral' : color(owner)} ${selectedIslands.has(i) ? 'selected' : ''} ${destination ? 'destination' : ''} ${pick ? 'has-card' : ''}"
      data-island="${i}" transform="translate(${island.x} ${island.y})" role="${active ? 'button' : 'img'}"
      tabindex="${active ? 0 : -1}" aria-label="${label}">
      <rect class="island-hit" x="-48" y="-34" width="96" height="90" rx="6"/>
      <path class="land" d="${ISLAND_SHAPES[i]}"/>
      <text class="island-name" y="40">${island.name}</text>
      <text class="island-need" y="54">${owner === me ? '내 섬 ✓' : owner === 1 - me ? '상대 섬' : `${majority(i) - mine}개 더`}</text>
      ${destination ? `<g class="target-mark" transform="translate(34 -26)"><circle r="12"/><text y="5">${state.mode === 'build' ? '+' : '−'}</text></g>` : ''}
      <title>${label}</title>
    </g>`;
  }).join('');
  $('board').classList.toggle('has-selection', state.selected.size > 0);
  $('board').classList.toggle('removing', state.mode === 'remove');
  $('board').innerHTML = edges + islands;
}

function cardContent(id) {
  const island = CARDS[id].island;
  return `${islandIcon(island)}<span class="card-name">${ISLANDS[island].name}</span>`;
}

function render() {
  const { match, draft, me } = state;
  const active = document.activeElement;
  const focus = active?.dataset.hand !== undefined ? `[data-hand="${active.dataset.hand}"]`
    : active?.dataset.edge !== undefined ? `[data-edge="${active.dataset.edge}"]`
      : active?.dataset.island !== undefined ? `[data-island="${active.dataset.island}"]` : active?.id ? `#${active.id}` : null;
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
    : `${mine ? '내 차례' : `${opponent()} 차례`} · ${state.feedback || state.lastMove}`;
  renderBoard();
  $('hand-count').textContent = `${draft.hands[me].length}장`;
  $('opp-hand').textContent = `${opponent()} ${match.hands[1 - me].length}장`;
  $('hand').innerHTML = [...draft.hands[me]].sort((a, b) => a - b).map((id) => `<button type="button"
    class="island-card ${state.selected.has(id) ? 'selected' : ''}" data-hand="${id}"
    aria-label="${ISLANDS[CARDS[id].island].name} 카드" aria-pressed="${state.selected.has(id)}" ${mine ? '' : 'disabled'}>
    ${cardContent(id)}</button>`).join('') || '<p class="empty-hand">손패를 모두 사용했어요.</p>';
  const moves = selectedMoves(draft, me, [...state.selected], state.mode);
  const source = [...new Set([...state.selected].map((id) => ISLANDS[CARDS[id].island].name))].join(' · ');
  $('selection-status').textContent = state.phase === 'over' ? '게임이 끝났어요.'
    : !mine ? '상대가 턴을 마치면 카드를 고를 수 있어요.'
    : state.mode === 'remove' ? state.selected.size < 2 ? `상대 다리 양끝의 카드 2장을 고르세요. (${state.selected.size}/2)`
      : moves.length ? '− 표시된 섬을 누르면 상대 다리가 사라져요.' : '이 두 카드로 제거할 상대 다리가 없어요.'
    : !state.selected.size ? '카드 한 장을 고르면 연결할 수 있는 섬이 표시돼요.'
    : moves.length ? `${source}에서 + 표시된 섬으로 연결하세요.` : `${source}에는 빈 연결선이 없어요. 다른 카드를 골라 보세요.`;
  document.querySelectorAll('[data-mode]').forEach((button) => {
    button.setAttribute('aria-pressed', String(button.dataset.mode === state.mode));
    button.disabled = !mine;
  });
  $('selection-tools').hidden = !state.selected.size;
  $('hand-tip').hidden = state.selected.size > 0;
  $('hand-tip').textContent = draft.hands[me].length === 5 ? '5장일 때는 먼저 쓰거나 선택해서 버리세요.' : '한 턴에 여러 장을 써도 돼요.';
  $('discard').disabled = !mine || !state.selected.size || final;
  $('clear-selection').disabled = !state.selected.size;
  const canDraw = mine && !final && draft.hands[me].length < 5;
  $('draw-hint').textContent = final ? '추가 턴에는 뽑지 않고, 아래에서 턴을 확정하세요.' : draft.hands[me].length === 5 ? '손패가 5장이에요. 먼저 카드를 쓰거나 버리세요.'
    : match.mustDraw ? '상대가 뽑기를 건너뛰었어요. 이번에는 꼭 1장 뽑으세요.' : '원하는 카드 1장을 고르면 이번 턴이 확정돼요.';
  $('market').innerHTML = match.market.map((id, i) => `<button class="island-card market-card" type="button" data-draw="${i}"
    aria-label="${id === null ? '빈 공개 카드 자리' : `${ISLANDS[CARDS[id].island].name} 뽑고 턴 종료`}"
    ${canDraw && id !== null ? '' : 'disabled'}>${id === null ? '<span class="card-name">—</span>' : `${cardContent(id)}<span class="card-action">뽑기</span>`}</button>`).join('')
    + `<button class="island-card deck-card" type="button" data-draw="deck" aria-label="랜덤 카드 1장 뽑고 턴 종료"
      ${canDraw && match.deck.length ? '' : 'disabled'}><span class="deck-symbol" aria-hidden="true">?</span><span class="card-name">랜덤</span><span class="card-detail">${match.deck.length}장</span></button>`;
  $('undo').disabled = !mine || !state.moves.length;
  const eliminated = match.round > 1 && totals.bridges[me] > 0 && !totals.bridges[1 - me];
  $('end-turn').disabled = !mine || (!final && match.mustDraw && !eliminated);
  $('end-turn').textContent = final || eliminated ? '턴 확정' : '뽑지 않고 마치기';
  $('end-turn').classList.toggle('primary', final || eliminated);
  $('move-count').textContent = state.phase === 'over' ? ''
    : final ? '마지막 기회예요. 카드를 사용한 뒤 턴을 확정하세요.'
      : state.moves.length ? '아직 확정 전 · 이번 턴 취소로 되돌릴 수 있어요.' : '놓을 곳이 없으면 바로 1장을 뽑아도 돼요.';
  $('score-history').textContent = match.history.map((r) => `${r.round}R · 나 +${r.points[me]} / ${opponent()} +${r.points[1 - me]}`).join('   |   ');
  if (focus) document.querySelector(focus)?.focus({ preventScroll: true });
}

function stage(move) {
  if (!myTurn()) return;
  const result = applyAction(state.draft, state.me, move);
  if (!result.ok) { duel.toast(result.error); return; }
  const before = owners(state.draft.bridges), after = owners(result.state.bridges);
  const captured = ISLANDS.filter((_, i) => after[i] === state.me && before[i] !== state.me).map((island) => island.name);
  const removed = state.draft.bridges.filter((p) => p === 1 - state.me).length - result.state.bridges.filter((p) => p === 1 - state.me).length;
  const route = move.edge === undefined ? '' : EDGES[move.edge].map((i) => ISLANDS[i].name).join('–');
  state.feedback = captured.length ? `${captured.join(', ')} 점유!${removed ? ` 상대 다리 ${removed}개 제거.` : ''}`
    : move.type === 'build' ? `${route} 연결. 더 놓거나 1장 뽑아 마치세요.`
      : move.type === 'remove' ? `${route}의 상대 다리를 제거했어요.` : `카드 ${move.cards.length}장을 버렸어요.`;
  state.draft = result.state;
  state.moves.push(move);
  state.mode = 'build';
  state.selected.clear();
  render();
}

$('hand').addEventListener('click', (e) => {
  const card = e.target.closest('[data-hand]');
  if (!card || card.disabled || !myTurn()) return;
  const id = Number(card.dataset.hand);
  selectCard(id);
});
function selectCard(id) {
  if (state.selected.has(id)) state.selected.delete(id);
  else {
    if (state.mode === 'build') state.selected.clear();
    else if (state.selected.size === 2) { duel.toast('카드 2장만 선택해 주세요. 선택한 카드를 누르면 해제돼요.'); return; }
    state.selected.add(id);
  }
  render();
}
for (const button of document.querySelectorAll('[data-mode]')) button.addEventListener('click', () => {
  if (!myTurn()) return;
  state.mode = button.dataset.mode;
  state.selected.clear();
  render();
});
function clickBoard(e) {
  if (!myTurn()) return;
  const island = e.target.closest('[data-island]');
  if (island) {
    const i = Number(island.dataset.island);
    const targets = islandTargets(selectedMoves(state.draft, state.me, [...state.selected], state.mode));
    if (targets.has(i)) stage(targets.get(i));
    else if (state.mode === 'build') {
      const card = state.draft.hands[state.me].find((id) => CARDS[id].island === i);
      if (card !== undefined) selectCard(card);
    }
    return;
  }
  const bridge = e.target.closest('[data-edge]');
  if (bridge && bridge.getAttribute('aria-disabled') === 'false') stage(selectedMove(Number(bridge.dataset.edge)));
}
$('board').addEventListener('click', clickBoard);
$('board').addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); clickBoard(e); }
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
