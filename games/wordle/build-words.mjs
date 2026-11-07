// Wordle 단어 목록 생성 스크립트 (한 번 돌려서 words.js를 만든다)
//
//   node games/wordle/build-words.mjs <scowl-2020.12.07 디렉터리> [/usr/share/dict/web2]
//
// - 정답(ANSWERS): SCOWL 크기 10~35(흔한 단어)의 5글자 소문자 단어.
//   복수형/과거형처럼 보이는 -s, -ed 끝 단어와 부적절한 단어는 뺀다.
// - 추측 허용(GUESSES): SCOWL 크기 80까지 + Webster's Second(web2, public domain)의 5글자 단어.
// SCOWL 라이선스는 WORDS-LICENSE.txt 참고.
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const [scowlDir, web2 = '/usr/share/dict/web2'] = process.argv.slice(2);
if (!scowlDir) {
  console.error('usage: node build-words.mjs <scowl-dir> [web2]');
  process.exit(1);
}

const FIVE = /^[a-z]{5}$/;
const read = (file) => readFileSync(file, 'latin1').split(/\r?\n/).filter((w) => FIVE.test(w));
const scowl = (sizes) => sizes.flatMap((n) =>
  ['english', 'american'].flatMap((v) => read(join(scowlDir, 'final', `${v}-words.${n}`))));

const BLOCK = new Set(`horny queer bitch whore pussy sperm semen prick kinky booty fagot slave
  dunno gimme gonna wanna kinda sorta lamer barer weest cuing chink nuder`.split(/\s+/));
const looksInflected = (w) => /([^su]s|ed)$/.test(w);

const answers = [...new Set(scowl([10, 20, 35]))]
  .filter((w) => !looksInflected(w) && !BLOCK.has(w))
  .sort();
const answerSet = new Set(answers);
const guesses = [...new Set([...scowl([10, 20, 35, 40, 50, 55, 60, 70, 80]), ...read(web2)])]
  .filter((w) => !answerSet.has(w))
  .sort();

const out = `// 자동 생성 파일: build-words.mjs 로 다시 만든다. 직접 수정하지 말 것.
// Word lists derived from SCOWL (Spell Checker Oriented Word Lists), Copyright 2000-2018 by Kevin Atkinson,
// and Webster's Second International Dictionary (public domain). See WORDS-LICENSE.txt.
export const ANSWERS = '${answers.join(' ')}'.split(' ');
export const GUESSES = '${guesses.join(' ')}'.split(' ');
`;
const target = join(dirname(fileURLToPath(import.meta.url)), 'words.js');
writeFileSync(target, out);
console.log(`answers ${answers.length}, extra guesses ${guesses.length} -> ${target}`);
