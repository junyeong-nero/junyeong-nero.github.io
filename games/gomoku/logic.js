// 오목 규칙과 AI (DOM 없음, node 테스트 가능)
// 규칙: 15×15, 흑 선공, 5개 이상 연속이면 승리, 흑백 모두 삼삼(열린 3을 동시에 두 개) 금지.
// 단, 그 수로 5목이 완성되면 둘 수 있다.
export const N = 15;
export const SIZE = N * N;
export const EMPTY = 0;
export const BLACK = 1;
export const WHITE = 2;

const DIRS = [[0, 1], [1, 0], [1, 1], [1, -1]]; // [dr, dc]
const rowOf = (i) => Math.floor(i / N);
const colOf = (i) => i % N;
const inside = (r, c) => r >= 0 && r < N && c >= 0 && c < N;

// i를 지나는 dir 방향의 같은 색 연속 구간 [시작 k, 끝 k] (i 기준 오프셋)
function runAround(board, i, color, [dr, dc]) {
  const r = rowOf(i);
  const c = colOf(i);
  let a = 0;
  while (inside(r + (a - 1) * dr, c + (a - 1) * dc) && board[(r + (a - 1) * dr) * N + c + (a - 1) * dc] === color) a--;
  let b = 0;
  while (inside(r + (b + 1) * dr, c + (b + 1) * dc) && board[(r + (b + 1) * dr) * N + c + (b + 1) * dc] === color) b++;
  return [a, b];
}

const cellAt = (i, k, [dr, dc]) => {
  const r = rowOf(i) + k * dr;
  const c = colOf(i) + k * dc;
  return inside(r, c) ? r * N + c : -1;
};

// 방금 둔 i로 5목 이상이 되었으면 그 줄의 칸들, 아니면 null
export function winLine(board, i) {
  const color = board[i];
  if (!color) return null;
  for (const d of DIRS) {
    const [a, b] = runAround(board, i, color, d);
    if (b - a + 1 >= 5) {
      const line = [];
      for (let k = a; k <= b; k++) line.push(cellAt(i, k, d));
      return line;
    }
  }
  return null;
}

// i를 포함하는 dir 방향 "열린 4"(_XXXX_)인지
function isStraightFour(board, i, color, d) {
  const [a, b] = runAround(board, i, color, d);
  if (b - a + 1 !== 4) return false;
  const left = cellAt(i, a - 1, d);
  const right = cellAt(i, b + 1, d);
  return left >= 0 && right >= 0 && board[left] === EMPTY && board[right] === EMPTY;
}

// (i에 color가 놓인 상태에서) dir 방향으로 i를 포함한 열린 3인지:
// 같은 줄의 빈칸 하나를 더 채우면 i를 포함한 열린 4가 되는 경우
function isOpenThree(board, i, color, d) {
  for (let k = -4; k <= 4; k++) {
    if (k === 0) continue;
    const q = cellAt(i, k, d);
    if (q < 0 || board[q] !== EMPTY) continue;
    board[q] = color;
    let four = isStraightFour(board, q, color, d);
    if (four) {
      const [a, b] = runAround(board, q, color, d);
      four = a <= -k && -k <= b; // 그 4 안에 i가 있어야 한다
    }
    board[q] = EMPTY;
    if (four) return true;
  }
  return false;
}

// 삼삼 금지: color가 i에 두면 열린 3이 두 방향 이상 생기는 수 (5목이 되면 허용)
export function isForbidden(board, i, color) {
  if (board[i] !== EMPTY) return false;
  board[i] = color;
  let banned = false;
  if (!winLine(board, i)) {
    let threes = 0;
    for (const d of DIRS) if (isOpenThree(board, i, color, d)) threes++;
    banned = threes >= 2;
  }
  board[i] = EMPTY;
  return banned;
}

export function canPlace(board, i, color) {
  return i >= 0 && i < SIZE && board[i] === EMPTY && !isForbidden(board, i, color);
}

// ---------- AI ----------
// 한 방향 9칸(가운데가 둘 자리)을 문자열로 보고 패턴 점수를 매긴다. X=내 돌, _=빈칸, O=상대 돌/판 밖
const PATTERNS = [
  [100000, ['XXXXX']],
  [10000, ['_XXXX_']],
  [1000, ['XXXX_', '_XXXX', 'XXX_X', 'X_XXX', 'XX_XX']],
  [800, ['__XXX_', '_XXX__', '_X_XX_', '_XX_X_']],
  [100, ['XXX__', '__XXX', 'X_XX_', '_XX_X', 'XX_X_', '_X_XX', 'XX__X', 'X__XX', 'X_X_X', '_XXX_']],
  [60, ['__XX__', '__XX_', '_XX__', '_X_X_', '_X__X_']],
  [10, ['XX___', '___XX', 'X_X__', '__X_X', 'X__X_', '_X__X']],
];

function lineString(board, i, color, d) {
  let s = '';
  for (let k = -4; k <= 4; k++) {
    const q = cellAt(i, k, d);
    if (k === 0) s += 'X';
    else if (q < 0) s += 'O';
    else s += board[q] === color ? 'X' : board[q] === EMPTY ? '_' : 'O';
  }
  return s;
}

function dirScore(line) {
  for (const [score, pats] of PATTERNS) {
    for (const p of pats) {
      for (let start = Math.max(0, 4 - p.length + 1); start <= 4 && start + p.length <= 9; start++) {
        if (line.startsWith(p, start)) return score;
      }
    }
  }
  return 1;
}

// color가 i에 두었을 때의 가치 (공격 점수)
export function cellScore(board, i, color) {
  let sum = 0;
  let fours = 0;
  let threes = 0;
  for (const d of DIRS) {
    const s = dirScore(lineString(board, i, color, d));
    sum += s;
    if (s >= 1000 && s < 100000) fours += s >= 10000 ? 2 : 1;
    else if (s === 800) threes++;
  }
  if (sum >= 100000) return sum;
  if (fours >= 2 || (fours >= 1 && threes >= 1)) sum += 50000; // 4-4, 4-3: 다음 수에 이긴다
  else if (threes >= 2) sum += 5000; // 3-3 (금지라 내 수로는 못 두지만, 막는 가치 계산에 쓰임)
  return sum;
}

// 돌 근처(2칸 이내) 빈칸만 후보로 본다
function candidates(board) {
  const out = [];
  let any = false;
  for (let i = 0; i < SIZE; i++) {
    if (board[i] !== EMPTY) { any = true; continue; }
    const r = rowOf(i);
    const c = colOf(i);
    let near = false;
    for (let dr = -2; dr <= 2 && !near; dr++) {
      for (let dc = -2; dc <= 2 && !near; dc++) {
        if ((dr || dc) && inside(r + dr, c + dc) && board[(r + dr) * N + c + dc] !== EMPTY) near = true;
      }
    }
    if (near) out.push(i);
  }
  return any ? out : [Math.floor(SIZE / 2)];
}

function scoreMoves(board, color) {
  const opp = 3 - color;
  return candidates(board)
    .filter((i) => !isForbidden(board, i, color))
    .map((i) => {
      const atk = cellScore(board, i, color);
      const def = isForbidden(board, i, opp) ? 0 : cellScore(board, i, opp);
      return { i, atk, def, s: atk + def * 0.9 };
    })
    .sort((a, b) => b.s - a.s);
}

// level: 'easy' | 'normal' | 'hard'
export function chooseMove(board, color, level = 'normal', rand = Math.random) {
  const moves = scoreMoves(board, color);
  if (!moves.length) {
    const free = [];
    for (let i = 0; i < SIZE; i++) if (canPlace(board, i, color)) free.push(i);
    return free.length ? free[Math.floor(rand() * free.length)] : -1;
  }
  const best = (list, key) => list.reduce((a, b) => (b[key] > a[key] ? b : a));
  const win = moves.find((m) => m.atk >= 100000);
  const mustBlock = moves.filter((m) => m.def >= 100000);

  if (level === 'easy') {
    if (win) return win.i;
    if (mustBlock.length && rand() < 0.6) return best(mustBlock, 'atk').i; // 가끔 놓친다
    const top = moves.slice(0, 5);
    return top[Math.floor(rand() * top.length)].i;
  }

  if (win) return win.i;
  if (mustBlock.length) return best(mustBlock, 'atk').i;

  if (level === 'normal') {
    const top = moves.filter((m) => m.s >= moves[0].s * 0.97).slice(0, 3);
    return top[Math.floor(rand() * top.length)].i;
  }

  // hard: 4를 연달아 두어 이기는 수순(VCF)을 찾고, 상대의 그런 수순은 미리 막는다
  const deadline = now() + 300;
  const vcf = findVcf(board, color, 8, deadline);
  if (vcf >= 0) return vcf;
  const myThreat = moves.filter((m) => m.atk >= 10000);
  if (myThreat.length) return best(myThreat, 'atk').i;
  const opp = 3 - color;
  if (findVcf(board, opp, 8, deadline) >= 0) {
    // 내가 둔 뒤에도 상대 수순이 남는 수는 피한다
    for (const m of moves.slice(0, 10)) {
      board[m.i] = color;
      const still = findVcf(board, opp, 8, deadline) >= 0;
      board[m.i] = EMPTY;
      if (!still) return m.i;
    }
  }
  const oppThreat = moves.filter((m) => m.def >= 10000);
  if (oppThreat.length) return best(oppThreat, 's').i;
  return moves[0].i;
}

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

// color가 i에 두면 5목이 되는가
function makesFive(board, i, color) {
  if (board[i] !== EMPTY) return false;
  board[i] = color;
  const five = !!winLine(board, i);
  board[i] = EMPTY;
  return five;
}

// m에 둔 직후 color가 다음 수에 5목을 만들 수 있는 자리들 (m을 지나는 줄에서만 생긴다)
function fivePoints(board, m, color) {
  const out = new Set();
  for (const d of DIRS) {
    for (let k = -4; k <= 4; k++) {
      const q = cellAt(m, k, d);
      if (q >= 0 && makesFive(board, q, color)) out.add(q);
    }
  }
  return [...out];
}

// 연속으로 4를 만들어(상대는 막는 수밖에 없음) 이기는 수순의 첫 수. 없으면 -1
function findVcf(board, color, depth, deadline) {
  if (depth <= 0 || now() > deadline) return -1;
  const opp = 3 - color;
  for (const m of candidates(board)) {
    if (!canPlace(board, m, color)) continue;
    board[m] = color;
    let found = !!winLine(board, m);
    if (!found) {
      const pts = fivePoints(board, m, color);
      if (pts.length >= 2) found = true; // 두 곳을 동시에 못 막는다
      else if (pts.length === 1) {
        const f = pts[0];
        if (isForbidden(board, f, opp)) found = true; // 상대가 금수라 못 막는다
        else {
          board[f] = opp;
          // 막는 수로 상대가 5목/4를 만들면 역공이 되니 그 가지는 버린다
          const counter = !!winLine(board, f) || fivePoints(board, f, opp).length > 0;
          if (!counter) found = findVcf(board, color, depth - 1, deadline) >= 0;
          board[f] = EMPTY;
        }
      }
    }
    board[m] = EMPTY;
    if (found) return m;
  }
  return -1;
}
