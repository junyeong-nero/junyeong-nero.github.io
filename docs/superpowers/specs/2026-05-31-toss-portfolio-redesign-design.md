# 포트폴리오 토스 디자인 개편 — 설계 문서

작성일: 2026-05-31
근거: `DESIGN.md` (토스 디자인 시스템 핸드오프 번들 합성본)

## 목표

editorial(잡지풍: 크림색 종이/적색/serif/grain) 포트폴리오를 토스 디자인 시스템의
**시각 언어**로 전환한다. 토스의 금융 도메인 개념(송금 흐름·bottom-CTA 셸·floating
tab-bar)은 이식하지 않고, 차용 대상은 시각 언어로 한정한다 — 단일 강조색 규율,
공격적 라운드 ladder, Pretendard neogrotesque, tabular 숫자 분리, 해요체 카피,
평면 표면 + 헤어라인 보더. (`DESIGN.md` Do's/Don'ts 준수)

## 승인된 결정 (brainstorming)

1. **범위**: 전체 — `portfolio/index.html`, `portfolio/style.css`,
   `portfolio/projects/projects.css`, 18개 프로젝트 상세 HTML, `lang.js`.
2. **이모지**: 토스 규칙대로 제거 → Lucide 라인 아이콘(24px/1.5px/`currentColor`)을
   `blue-50` 아이콘 칩 또는 텍스트 위계로 대체. chrome inline 이모지 금지.
3. **다크모드**: 라이트 전용으로 단순화 — 토글·`theme.js`·night 아바타 스왑·
   `.dark-mode` 토큰·다크 localStorage 로직 제거.
4. **카피**: 한국어 i18n 문장형 값을 해요체로. 명사 라벨/영어는 유지.

## 접근

A안 — 토큰 우선 리빌드. 기존 레이아웃 구조(hero 2단, 그리드, 타임라인 행)는
유지하되 토큰 레이어와 표면 처리를 토스로 통째 교체한다.

## 토큰 (`style.css :root`, 라이트 전용, OKLCH)

```css
/* Foreground */
--tds-fg-primary:    oklch(0.234 0.030 254);  /* grey-900 */
--tds-fg-secondary:  oklch(0.452 0.028 253);  /* grey-700 */
--tds-fg-tertiary:   oklch(0.155 0.060 261 / 0.58);
--tds-fg-disabled:   oklch(0.752 0.016 251);  /* grey-400 */
--tds-fg-brand:      oklch(0.624 0.176 254);  /* blue-500 */
/* Background */
--tds-bg-primary:    oklch(1 0 0);            /* white */
--tds-bg-secondary:  oklch(0.957 0.005 247);  /* grey-100 */
--tds-bg-tertiary:   oklch(0.913 0.008 247);  /* grey-200 */
--tds-bg-brand:      oklch(0.624 0.176 254);  /* blue-500 */
--tds-bg-brand-weak: oklch(0.965 0.020 250);  /* blue-50 */
/* Line */
--tds-line-default:  oklch(0.913 0.008 247);  /* grey-200 */
--tds-line-strong:   oklch(0.752 0.016 251);  /* grey-400 */
/* State */
--tds-press-overlay: oklch(0 0 0 / 0.26);
/* Radius */
--radius-s: 8px; --radius-m: 12px; --radius-l: 14px;
--radius-xl: 16px; --radius-2xl: 20px; --radius-3xl: 24px; --radius-full: 999px;
/* Shadow */
--shadow-1: 0 1px 2px oklch(0.155 0.060 261/.04), 0 1px 1px oklch(0.155 0.060 261/.04);
--shadow-2: 0 4px 12px oklch(0.155 0.060 261/.06), 0 1px 2px oklch(0.155 0.060 261/.04);
--shadow-3: 0 12px 32px oklch(0.155 0.060 261/.10), 0 2px 6px oklch(0.155 0.060 261/.06);
/* Motion */
--ease: cubic-bezier(0.22,0.61,0.36,1);
--ease-out: cubic-bezier(0.16,1,0.3,1);
--dur-fast: 120ms; --dur-base: 200ms; --dur-slow: 320ms;
/* Font */
--font-sans: "Pretendard Variable", Pretendard, -apple-system, BlinkMacSystemFont,
  "Apple SD Gothic Neo", "Noto Sans KR", Roboto, sans-serif;
```

Pretendard Variable: `https://cdn.jsdelivr.net/gh/orioncactus/pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css`.
Lucide: `https://unpkg.com/lucide@latest` + `lucide.createIcons()`.

타입 ramp(`DESIGN.md` Typography)에서 display-2(40/700), h2(24/700), title-1(18/600),
body-1(17/400), body-2(15/400), label-m(15/600), caption(12/500)을 사용한다.
날짜·기간은 `font-variant-numeric: tabular-nums`.

## 컴포넌트 매핑

| 영역 | 변경 |
|---|---|
| body | white 캔버스, Pretendard, grain·corner-mark·red `::selection` 제거 |
| 플로팅 컨트롤 | theme-toggle 제거; lang-toggle은 full-pill 칩(white bg, 1px grey-200) |
| hero h1 | serif 이탤릭/적색 첫글자 제거 → display Bold, grey-900, tight tracking |
| hero-intro | 적색 left-border/serif 이탤릭 제거 → title-1 grey-secondary |
| vision-text | body-1 (17/1.5) grey-secondary |
| 아바타 | radius-2xl 카드, 1px grey-200, grayscale 필터 제거, character.png 고정 |
| resume 버튼 | 토스 secondary 버튼(grey-100 fill, radius-m, label-m) |
| section-title | h2 grey-900, 인덱스는 blue 라벨, 하단 1px grey-200 보더 |
| education | 헤어라인 구분 list-row, 날짜 tabular grey-tertiary |
| research 태그 | 토스 칩(full pill, 1px grey-200 / brand 변형 blue-50+blue) |
| publications | 카드 radius-xl + grey-200 보더, arXiv는 ghost(text-brand) 링크 |
| experiences | 카드 그리드(radius-xl, 1px grey-200, white), 화살표 → Lucide arrow-right |
| projects 탭 | 토스 `tab` (2.5px blue 언더라인) |
| project 카드 | white 카드 radius-xl + grey-200, blue-50 아이콘 칩 + Lucide, title-1 + body-3 |
| awards | list-row + blue-50 아이콘 칩 |
| links | 버튼 그리드, Lucide 브랜드 아이콘, radius-xl, grey-100 fill |
| footer | caption grey-tertiary, 1px grey-200 top 보더, em-dash 장식 제거 |
| 모션 | 0.8s 페이드 → 320ms 이하 ease-out, 토스 토큰 범위 준수 |

### Lucide 아이콘 매핑

- 프로젝트: llm-mafia→`venetian-mask`, harness→`compass`, chatbot→`bot`,
  graph-rag→`share-2`, drama→`clapperboard`, med-llm→`hospital`, gomoku→`circle`,
  sd→`image`, ddpm→`palette`, bilingual→`languages`, ocr→`scan-text`,
  med-img→`scan`, pomodoro→`timer`, delivery→`truck`, studywithme→`pencil`
- 어워드: awards→`award`, teaching→`presentation`
- 링크: github→`github`, huggingface→`smile`(전용 없음, 중립 대체), linkedin→`linkedin`,
  leetcode→`code`
- 프로젝트 상세 h2: overview→`clipboard-list`, tech→`wrench`, features→`zap`,
  links→`link` (이모지 텍스트는 lang.js에서 제거하고 마크업에 아이콘 배치)

## 프로젝트 상세 페이지(18개)

- `<head>`: Inter 폰트 링크 제거(Pretendard는 style.css 경유), theme-toggle 버튼 제거
- 인라인 다크모드 스크립트 제거(있는 경우)
- projects.css: project-header 아이콘 칩화, project-section h2 토스화(이모지 제거),
  tech-tag→칩, project-links→버튼, back-btn→ghost 버튼
- Lucide 스크립트 추가

## 카피 (lang.js, 해요체)

한국어 값 중 문장형(hero.vision, 설명문, feature 등)을 해요체로 변환한다.
명사 라벨(섹션 제목, 태그)과 영어 값은 유지. 이모지를 포함한 한국어 라벨
(`📋 개요` 등)은 이모지를 제거한다. ALL CAPS·헤딩 `!`·디렉티브 라벨 금지(`DESIGN.md`).

## 검증

- `index.html`을 브라우저(Playwright)로 열어 스크린샷 — 토스 룩 확인
- 프로젝트 상세 1개 열어 일관성 확인
- 한/영 토글, 탭 전환 동작 확인
- 콘솔 에러(Lucide 로드, 폰트) 없음 확인

## 비범위 (YAGNI)

- bottom-CTA·floating tab-bar·키패드 등 토스 모바일 셸 컴포넌트
- 다크 모드
- 새 콘텐츠/섹션 추가 (시각 개편만)
