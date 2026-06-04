# Paper Review 페이지와 ingest 스킬 설계 문서

작성일: 2026-06-04
대상 경로: `/paper-review/`
관련 스킬: `paper-review-ingest`

## 목표

`junyeong-nero.github.io/paper-review/` 아래에 논문 리뷰를 탐색하는 정적 페이지를 만든다.
사용자는 Codex 스킬에 arXiv URL을 주고, 스킬은 논문 메타데이터와 리뷰 Markdown,
검색/태그용 JSON 인덱스, figure/table 캡처 자산을 생성한다. GitHub Pages는 생성된
정적 파일만 서빙하며, 브라우저에서 arXiv API나 PDF 파서를 직접 호출하지 않는다.

## 승인된 결정

1. **배포 방식**: 빌드 도구 없는 정적 사이트. 기존 `portfolio/`처럼 하위 디렉터리에
   독립 HTML/CSS/JS를 둔다.
2. **ingest 방식**: 웹 폼이 아니라 Codex 스킬이 로컬에서 arXiv URL을 받아 데이터를
   생성하고 저장소 파일을 갱신한다.
3. **검색/태그**: 클라이언트 JS가 `paper-review/data/reviews.json`을 읽어 제목, 저자,
   요약, 태그, arXiv ID를 대상으로 필터링한다.
4. **리뷰 본문**: 첫 구현은 `paper-review/reviews/*.md`로 저장하고 카드에서 Markdown
   파일로 연결한다. 상세 HTML 렌더링은 후속 범위로 둔다.
5. **figure/table 캡처**: ingest 시 논문 PDF에서 주요 figure와 table 이미지를 캡처해
   리뷰 Markdown과 JSON 인덱스에서 참조할 수 있게 한다.

## 접근

추천안은 **정적 JSON 카탈로그 + Markdown 리뷰 파일 + Codex ingest 스킬**이다. 페이지는
가벼운 vanilla HTML/CSS/JS로 구성하고, 모든 동적 상태는 브라우저 메모리에서 처리한다.
ingest 스킬은 생성형 리뷰 작성 흐름과 자산 추출 흐름을 분리해 둔다. 리뷰 생성이
실패하더라도 메타데이터와 캡처 자산은 보존하고, 캡처가 실패하더라도 리뷰 인덱스는
유효한 상태로 유지한다.

## 파일 구조

```text
paper-review/
├── index.html
├── style.css
├── script.js
├── data/
│   └── reviews.json
├── reviews/
│   └── <paper-slug>.md
└── assets/
    └── <paper-slug>/
        ├── figures/
        │   └── figure-01.png
        └── tables/
            └── table-01.png

~/.codex/skills/paper-review-ingest/
├── SKILL.md
├── agents/
│   └── openai.yaml
└── scripts/
    ├── arxiv_id.py
    ├── update_reviews_index.py
    └── capture_pdf_regions.py
```

## 페이지 디자인

시각 언어는 현재 `portfolio/`의 Toss 계열 토큰과 맞춘다. 작업형 아카이브이므로 큰
랜딩 hero나 장식적 이미지 대신 첫 화면에 바로 검색, 태그 필터, 리뷰 목록이 보이게 한다.

- 상단: `Paper Review` 제목, 짧은 설명, 포트폴리오로 돌아가는 링크
- 컨트롤: 검색 입력, 전체/선택 태그 칩, 최신순/제목순 정렬 버튼
- 상태: 현재 필터에 매칭되는 리뷰 수, 결과 없음 메시지
- 카드: 제목, TL;DR, 저자, 발행/리뷰 날짜, 태그, arXiv 링크, Markdown 리뷰 링크
- 미디어: figure/table 썸네일이 있으면 카드 하단에 최대 3개까지 보여준다

## 데이터 계약

`paper-review/data/reviews.json`은 배열 또는 `{ "reviews": [...] }` 형태 중 하나를
선택한다. 구현은 확장성을 위해 객체 래퍼를 사용한다.

```json
{
  "version": 1,
  "updatedAt": "2026-06-04",
  "reviews": [
    {
      "id": "2403.01469",
      "slug": "kormedmcqa",
      "title": "KorMedMCQA: Multi-Choice Question Answering Benchmark...",
      "authors": ["Author One", "Author Two"],
      "publishedAt": "2024-03-03",
      "reviewedAt": "2026-06-04",
      "summary": "Korean healthcare licensing MCQA benchmark...",
      "tags": ["benchmark", "medical-llm", "korean"],
      "arxivUrl": "https://arxiv.org/abs/2403.01469",
      "pdfUrl": "https://arxiv.org/pdf/2403.01469.pdf",
      "reviewPath": "reviews/kormedmcqa.md",
      "assets": {
        "figures": [
          {
            "path": "assets/kormedmcqa/figures/figure-01.png",
            "caption": "Figure 1. Dataset construction pipeline.",
            "page": 3
          }
        ],
        "tables": [
          {
            "path": "assets/kormedmcqa/tables/table-01.png",
            "caption": "Table 1. Benchmark statistics.",
            "page": 5
          }
        ]
      }
    }
  ]
}
```

`slug`는 제목 기반으로 생성하고, 동일 arXiv ID가 이미 있으면 기존 항목을 업데이트한다.
경로는 모두 `paper-review/` 기준 상대 경로로 저장한다.

## Ingest 스킬

스킬 이름은 `paper-review-ingest`로 한다. 트리거 문장은 "arXiv URL을 paper-review에
ingest", "논문 리뷰 페이지에 이 paper 추가", "figure/table 캡처까지 포함해서 리뷰
생성" 같은 요청을 포함한다.

스킬 절차:

1. arXiv URL/ID에서 canonical ID를 파싱한다. 버전 suffix는 입력 추적용으로 보존하되,
   인덱스 중복 판단은 version 없는 ID를 우선한다.
2. arXiv Atom API로 제목, 저자, abstract, 발행일을 가져온다.
3. PDF를 내려받고 텍스트를 추출한다. 네트워크 또는 PDF 추출 실패 시 사용자에게 PDF나
   텍스트 제공을 요청한다.
4. tutorial-style 리뷰 Markdown을 생성한다. 기본 섹션은 TL;DR, 배경, 문제 정의,
   방법, 실험, 비판적 분석, 구현 팁이다.
5. figure/table 후보를 캡처한다.
6. `reviews/<slug>.md`, `assets/<slug>/...`, `data/reviews.json`을 갱신한다.
7. 변경 파일과 검증 명령을 사용자에게 보고한다.

## Figure/Table 캡처

첫 구현은 완전 자동 레이아웃 이해보다 실용적인 반자동 흐름을 목표로 한다.

- PDF 텍스트에서 `Figure 1`, `Fig. 1`, `Table 1` 같은 캡션 라인을 찾고 주변 페이지를
  후보로 잡는다.
- `pdftoppm`이 있으면 후보 페이지를 PNG로 렌더링한다. 없으면 Python PDF 라이브러리나
  macOS/시스템 도구를 fallback으로 사용한다.
- 정확한 region crop이 가능한 경우 해당 영역만 저장한다. 자동 crop이 불확실하면
  후보 페이지 전체 또는 넓은 영역을 저장하고 파일명/캡션에 page 정보를 남긴다.
- 기본 캡처 수는 figure 3개, table 3개까지로 제한한다. 스킬 지시에서 더 많이 요청하면
  상한을 명시적으로 늘린다.
- 저장 경로는 `paper-review/assets/<slug>/figures/figure-01.png`와
  `paper-review/assets/<slug>/tables/table-01.png`를 사용한다.
- 리뷰 Markdown에는 `![Figure 1](../assets/<slug>/figures/figure-01.png)` 형태로
  삽입한다. JSON에는 카드 썸네일용 상대 경로와 캡션, page를 기록한다.

자동 캡처 품질은 논문 PDF마다 달라질 수 있다. 그래서 스킬은 캡처 실패를 전체 ingest
실패로 처리하지 않고, 실패 사유와 수동 보정 후보 페이지를 보고한다.

## 오류 처리

- `reviews.json`이 없으면 빈 인덱스로 생성한다.
- JSON 파싱 실패 시 기존 파일을 `.bak`으로 복사한 뒤 새 인덱스를 만들기 전에 사용자에게
  손상 사실을 보고한다.
- 동일 arXiv ID가 있으면 중복 추가하지 않고 기존 항목을 갱신한다.
- arXiv API 실패 시 PDF URL 또는 사용자 제공 메타데이터로 진행할 수 있게 한다.
- 캡처 도구가 없거나 crop이 불확실하면 리뷰 생성은 계속하고 `assets.figures/tables`는
  빈 배열로 둔다.

## 테스트와 검증

- 페이지 JS: 필터 함수가 검색어, 태그, 정렬을 올바르게 적용하는지 테스트한다.
- 인덱스 갱신 스크립트: 새 항목 추가, 동일 ID 업데이트, 태그 정렬, 경로 유지 테스트를
  작성한다.
- 스킬 보조 스크립트: arXiv ID 파싱과 PDF 캡처 명령 생성 로직을 작은 입력으로 검증한다.
- 정적 페이지: 로컬 서버에서 `/paper-review/`를 열어 카드 렌더링, 검색, 태그 필터,
  썸네일 표시, 링크 동작, 모바일 레이아웃을 확인한다.

## 비범위

- 브라우저에서 arXiv URL을 직접 ingest하는 웹앱 기능
- 서버, 데이터베이스, GitHub Action 자동 ingest
- Markdown 상세 페이지를 HTML로 변환하는 라우터
- PDF figure/table detection의 완전 자동 정확도 보장
