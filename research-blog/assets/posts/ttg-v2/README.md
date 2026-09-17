# v2 연구 블로그 figure

`junyeong-nero.github.io/research-blog/style.css`의 실제 theme token에 맞춘 벡터 그림이다.
배경 `#f8f7f3`, 본문 `#212121`, 보조 글자 `#52525b`, 경계 `#e3e0d8`,
강조 coral `#ff7759`, blue `#1863dc`를 사용한다. Serif 제목과 sans-serif 본문,
얇은 구분선으로 블로그의 editorial 스타일을 따른다. 색과 point shape를 함께 사용한다.
Coral은 혼합 arm 표시이며 성능 개선을 의미하는 색이 아니다.

SVG는 760 px 기준의 반응형 viewBox를 가지며 외부 font나 script 없이 동작한다.
PNG는 2배 해상도(폭 1,520 px)로 export했다. 블로그에서는 SVG 사용을 권장한다.

| 파일 | 용도 |
|---|---|
| [01-training-design.svg](01-training-design.svg) | 같은 예산에서 네 학습 데이터 arm의 차이 |
| [02-transfer-gap.svg](02-transfer-gap.svg) | 합성 검증 개선과 실제 비행 결과가 일치하지 않는다는 핵심 결과 |
| [03-fixedwing-effects.svg](03-fixedwing-effects.svg) | 고정익 MASC-3 주 조건과 ALFA 보조 조건의 모든 arm 대 baseline 차이·CI |
| [04-multicopter-effects.svg](04-multicopter-effects.svg) | 멀티콥터 AMOVFLY의 모든 arm 대 baseline 차이·CI |
| [05-evaluation-coverage.svg](05-evaluation-coverage.svg) | 원본 대비 포함 비행 수와 ALFA 주 조건 표본 부족 |

동일 이름의 `.png` 파일도 제공한다. 수치와 CI는 v2 원본 JSON에서 생성하고,
각 SVG metadata에 사용 수치를 넣었다. 입력·SVG SHA-256은 [provenance.json](provenance.json)에 있다.
공개 파일은 논문의 데이터와 같은 값이며 연구 모델이나 평가 조건은 바꾸지 않았다.

```bash
uv run scripts/plot_research_figures.py --png
```

PNG 렌더링에는 기존 개발 도구 Playwright와 설치된 Chromium이 필요하다.

## 블로그 삽입용 캡션

블로그 로컬 저장소의 `research-blog/assets/posts/ttg-v2/`에도 동일 파일을 복사했다.
게시글 본문은 다음 경로를 사용할 수 있다.

```markdown
![네 학습 데이터 조건의 구성](assets/posts/ttg-v2/01-training-design.svg)

같은 학습 예산에서 단순 운동학 자료 일부를 고정익·멀티콥터 프로파일로 대체했다.
초기 상태 분포나 최종 선택된 모델 크기까지 같게 맞춘 실험은 아니다.

![합성 검증과 실제 비행에서의 오차 변화](assets/posts/ttg-v2/02-transfer-gap.svg)

음수는 baseline 대비 개선, 양수는 악화다. 합성 검증에서 좋아진 GRU도 실제 비행에서는
같은 효과를 보이지 않았다. 합성 검증과 실비행의 집계 단위는 서로 다르다.

![고정익에서 데이터 추가의 효과와 신뢰구간](assets/posts/ttg-v2/03-fixedwing-effects.svg)

MASC-3는 주 평가, ALFA 1,050 m는 미리 정의한 보조 평가다. 패널마다 초 단위 축 범위가
다르다. 구간은 날짜 bootstrap이며 seed 불확실성이나 다중비교 보정은 포함하지 않는다.

![멀티콥터에서 데이터 추가의 효과와 신뢰구간](assets/posts/ttg-v2/04-multicopter-effects.svg)

AMOVFLY에서는 평균 MAE가 개선된 추가 arm이 없었다. 구간이 0을 포함하는 비교는
명확한 차이를 확인하지 못한 것으로 읽어야 한다.

![실제 평가에 포함된 비행의 범위](assets/posts/ttg-v2/05-evaluation-coverage.svg)

모든 구역의 반경은 1,000 m다. 그림의 거리는 구역 중심의 수평 배치 거리다.
ALFA 주 조건은 단 1개 비행이어서 모집단에 대한 결론을 내리지 않았다.
```
