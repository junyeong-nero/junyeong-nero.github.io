// 사과게임 보드 로직 (DOM 없음, node 테스트 가능)
export const COLS = 17;
export const ROWS = 10;
export const SIZE = COLS * ROWS;
export const TARGET = 10;

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rc = (i) => [Math.floor(i / COLS), i % COLS];
const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

// 10을 k개의 1~9 자연수로 나누는 균등 랜덤 분할
function composition(rand, k) {
  const cuts = [];
  while (cuts.length < k - 1) {
    const c = 1 + Math.floor(rand() * 9);
    if (!cuts.includes(c)) cuts.push(c);
  }
  cuts.sort((a, b) => a - b);
  const parts = [];
  let prev = 0;
  for (const c of [...cuts, TARGET]) {
    parts.push(c - prev);
    prev = c;
  }
  return parts;
}

// 난이도 = 보드 구성. 제한 시간은 같고, 합 10 그룹의 크기 비율과 그룹이 펼쳐지는 사각형 크기만 다르다.
// sizes: 2개/3개/4개 그룹 비율, maxArea: 그룹 사각형 최대 칸 수, rectBias: -1 좁은 사각형 선호 / 0 균등 / 1 넓은 사각형 선호
export const LEVELS = {
  easy: { sizes: [0.9, 0.1, 0], maxArea: 3, rectBias: -1 },
  normal: { sizes: [0.7, 0.25, 0.05], maxArea: 6, rectBias: 0 },
  hard: { sizes: [0.2, 0.45, 0.35], maxArea: 9, rectBias: 1 },
};

function groupSize(rand, [p2, p3]) {
  const r = rand();
  return r < p2 ? 2 : r < p2 + p3 ? 3 : 4;
}

const areaOf = ([r0, r1, c0, c1]) => (r1 - r0 + 1) * (c1 - c0 + 1);

function pickRect(rand, rects, bias) {
  if (bias === 0) return pick(rand, rects);
  const weights = rects.map((r) => (bias > 0 ? areaOf(r) : 1 / areaOf(r)));
  let x = rand() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < rects.length; i++) {
    x -= weights[i];
    if (x <= 0) return rects[i];
  }
  return rects[rects.length - 1];
}

// 역방향 생성: 빈 칸만으로 이루어진 사각형 안에 합 10 그룹을 채워 넣는다.
// 채운 순서의 역순으로 지우면 항상 전부 지울 수 있다.
function tryGenerate(rand, level) {
  const values = new Array(SIZE).fill(0);
  const fillOrder = [];
  const isEmpty = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS && values[r * COLS + c] === 0;
  const degree = (i) => {
    const [r, c] = rc(i);
    return isEmpty(r - 1, c) + isEmpty(r + 1, c) + isEmpty(r, c - 1) + isEmpty(r, c + 1);
  };

  let remaining = SIZE;
  while (remaining > 0) {
    let best = [];
    let bestDeg = 5;
    for (let i = 0; i < SIZE; i++) {
      if (values[i] !== 0) continue;
      const d = degree(i);
      if (d < bestDeg) { bestDeg = d; best = [i]; }
      else if (d === bestDeg) best.push(i);
    }
    if (bestDeg === 0) return null;

    const start = pick(rand, best);
    const [sr, sc] = rc(start);
    const rects = [];
    for (let r0 = sr - 2; r0 <= sr; r0++) for (let r1 = sr; r1 <= sr + 2; r1++)
      for (let c0 = sc - 3; c0 <= sc; c0++) for (let c1 = sc; c1 <= sc + 3; c1++) {
        const area = (r1 - r0 + 1) * (c1 - c0 + 1);
        if (area < 2 || area > level.maxArea) continue;
        let ok = true;
        for (let r = r0; r <= r1 && ok; r++) for (let c = c0; c <= c1 && ok; c++) ok = isEmpty(r, c);
        if (ok) rects.push([r0, r1, c0, c1]);
      }
    if (rects.length === 0) return null;

    const [r0, r1, c0, c1] = pickRect(rand, rects, level.rectBias);
    const others = [];
    for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) {
      const i = r * COLS + c;
      if (i !== start) others.push(i);
    }
    const k = Math.min(groupSize(rand, level.sizes), others.length + 1);
    const group = [start];
    while (group.length < k) {
      const idx = Math.floor(rand() * others.length);
      group.push(others.splice(idx, 1)[0]);
    }
    const parts = composition(rand, k);
    group.forEach((i, n) => { values[i] = parts[n]; });
    fillOrder.push(group);
    remaining -= k;
  }
  return { values, solution: fillOrder.reverse() };
}

// 시드가 같으면 항상 같은 보드 (두 플레이어가 같은 판을 받는다)
export function generateBoard(seed, levelName = 'normal') {
  const level = LEVELS[levelName] ?? LEVELS.normal;
  const rand = mulberry32(seed);
  for (;;) {
    const board = tryGenerate(rand, level);
    if (board) return board;
  }
}

// 선택된 칸들의 합 (이미 지운 칸은 0으로 취급)
export function sumOf(values, removed, indices) {
  let s = 0;
  for (const i of indices) if (!removed[i]) s += values[i];
  return s;
}
