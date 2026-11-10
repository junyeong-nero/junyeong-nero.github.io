import { CARDS, EDGES, applyAction } from './logic.js';

// 지도와 카드가 공유하는 12개의 실루엣. 각 좌표는 섬 중심 기준이다.
export const ISLAND_SHAPES = [
  // Aloa: 초승달
  'M25-29C4-35-30-22-39-2C-47 17-26 29-8 23C-24 13-20-2-7-9C4-15 19-13 32-21Q38-26 25-29Z',
  // Bari: 삼각형
  'M-5-31Q3-35 10-23L37 13Q44 24 28 25L-31 23Q-43 20-34 8Z',
  // Coco: 두 덩이가 이어진 섬
  'M-6-10C-20-34-43-21-40 1C-38 23-15 29-3 13C10 31 39 26 42 6C46-18 18-30 5-13Q0-7-6-10Z',
  // Duda: 계단 모양 해안
  'M-37-24L-6-29L-5-17L20-21L24-9L40-5L38 19L11 25L7 13L-15 19L-19 8L-39 10Z',
  // Elai: 마름모
  'M0-33Q9-24 21-14L42-2L20 11L3 27L-14 14L-42 1L-18-17Z',
  // Faaa: 길고 가는 섬
  'M-44-9Q-25-21-8-14L6-20L23-13L42-5Q47 4 32 8L15 8L2 17L-15 12L-33 14Q-46 9-44-9Z',
  // Gola: 콩 모양
  'M-24-28C-41-25-40-5-28 2C-13 10-16 22 1 25C27 30 45 7 37-15C30-34 6-30 0-16C-7-7-12-30-24-28Z',
  // Huna: L자
  'M-33-29L-11-31L-7-4L5 7L35 9L39 23L3 27L-29 15L-40-5Z',
  // Iffi: 별 모양
  'M0-33L12-15L35-22L28-3L43 11L18 14L9 28L-7 17L-31 25L-27 3L-42-10L-16-14Z',
  // Jojo: 양쪽에 만이 있는 섬
  'M-30-22Q0-33 29-22L19-8L40 1L28 22Q1 31-29 20L-18 5L-39-3Z',
  // Kahu: 부채 모양
  'M-9 25L-40-8Q-44-15-32-22Q0-43 33-22Q45-15 40-7L10 25Z',
  // Lale: 갈고리
  'M-32-26Q0-35 27-17Q45-1 32 21L12 25L17 7Q10-10-7-8L-8 13L-28 18L-39 1Z',
];

export function islandIcon(island) {
  return `<svg class="island-icon" viewBox="-48 -36 96 68" aria-hidden="true"><path d="${ISLAND_SHAPES[island]}"/></svg>`;
}

export function selectedMoves(state, player, cards, mode) {
  if (cards.length !== (mode === 'build' ? 1 : 2)) return [];
  return EDGES.flatMap((_, edge) => {
    const action = { type: mode, cards: [...cards], edge };
    return applyAction(state, player, action).ok ? [action] : [];
  });
}

// 작은 선을 누르지 않아도, 도착 섬을 누르면 같은 연결선의 행동을 실행한다.
export function islandTargets(moves) {
  const targets = new Map();
  for (const action of moves) {
    const sources = new Set(action.cards.map((id) => CARDS[id].island));
    for (const island of EDGES[action.edge]) {
      if (sources.size === 1 && sources.has(island)) continue;
      targets.set(island, action);
    }
  }
  return targets;
}
