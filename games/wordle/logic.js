// Wordle 규칙 (DOM 없음, node 테스트 가능)
import { ANSWERS, GUESSES } from './words.js';

export const WORD_LEN = 5;
export const MAX_TRIES = 6;

const valid = new Set([...ANSWERS, ...GUESSES]);
export const isValidWord = (word) => valid.has(word);

// 시드가 같으면 같은 정답 (두 플레이어가 같은 단어를 받는다)
export const answerFor = (seed) => ANSWERS[(seed >>> 0) % ANSWERS.length];

// 칸별 판정: 'correct'(자리까지 맞음) / 'present'(다른 자리에 있음) / 'absent'
// 같은 글자가 여러 번 나오면 정답에 남은 개수만큼만 present로 친다.
export function scoreGuess(guess, answer) {
  const result = new Array(WORD_LEN).fill('absent');
  const left = {};
  for (let i = 0; i < WORD_LEN; i++) {
    if (guess[i] === answer[i]) result[i] = 'correct';
    else left[answer[i]] = (left[answer[i]] || 0) + 1;
  }
  for (let i = 0; i < WORD_LEN; i++) {
    if (result[i] === 'correct') continue;
    if (left[guess[i]] > 0) {
      result[i] = 'present';
      left[guess[i]] -= 1;
    }
  }
  return result;
}

// 키보드 색: 한 번이라도 correct면 correct, 아니면 present, 아니면 absent
const RANK = { absent: 1, present: 2, correct: 3 };
export function mergeKeyState(keys, guess, result) {
  const next = { ...keys };
  for (let i = 0; i < WORD_LEN; i++) {
    const k = guess[i];
    if (!next[k] || RANK[result[i]] > RANK[next[k]]) next[k] = result[i];
  }
  return next;
}

// 대결 판정: 둘 다 맞혔으면 적은 시도 → 짧은 시간 순. 한쪽만 맞혔으면 그쪽 승.
// me/opp: { solved, tries, ms } → 1 (내 승) / -1 (내 패) / 0 (무승부)
export function compareRuns(me, opp) {
  if (me.solved !== opp.solved) return me.solved ? 1 : -1;
  if (!me.solved) return 0;
  if (me.tries !== opp.tries) return me.tries < opp.tries ? 1 : -1;
  if (me.ms !== opp.ms) return me.ms < opp.ms ? 1 : -1;
  return 0;
}
