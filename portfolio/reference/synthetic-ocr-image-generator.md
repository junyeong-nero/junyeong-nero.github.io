## 1. 프로젝트 개요
---
- **프로젝트 명칭**: Synthetic OCR Image Generator
- **프로젝트 개요**: 비영어/중국어권 언어를 위한 OCR 벤치마크 데이터셋을 합성하고 평가하는 End-to-End 파이프라인 구축 프로젝트. 폰트 기반 합성 데이터 생성만으로 다양한 언어 환경에서 OCR 성능을 정량적으로 평가할 수 있는 체계를 마련하여 기존 벤치마크의 언어적 편향을 해소함.
- **기간 및 인원**: 2025.12 - 2026.02 (1인 프로젝트)
- **사용 기술**: Python, Transformers, OpenCV

## 2. 문제 정의 및 목표
---
- **배경**:
    - **데이터 편향성 (Bias)**: 기존 OCR 모델 및 벤치마크는 대부분 영어 및 중국어 데이터에 과적합(Overfitting)되어 있어, 타 언어권에서의 성능 신뢰도가 낮음
    - **높은 검증 비용**: 저자원 언어(Low-resource Language)의 OCR 성능을 검증하기 위해 실제 데이터를 수집, 정제, 라벨링하는 과정은 막대한 비용과 시간이 소요됨
- **목표**:
    - 폰트(Font)와 템플릿 교체만으로 다양한 언어의 **OCR 벤치마크 데이터셋을 즉시 생성하는 파이프라인** 개발
    - 생성된 합성 데이터셋을 기반으로 모델의 인식 성능을 객관적으로 측정하는 **자동화된 평가 시스템** 구축

## 3. 주요 기능 및 본인의 기여 (Key Features & Contributions)
---
- **폰트 기반 합성 데이터셋 생성 파이프라인 (Data Synthesis)**
	- **다양한 렌더링 엔진 지원**:
		- **Pillow**: 고속 대량 생성을 위한 경량 엔진
		- **Headless Chromium**: 실제 웹 브라우저 렌더링과 동일한 고품질 마크다운(Markdown) 이미지 생성을 위한 고정밀 엔진
	- **Corpus 확장**: 
		- **Faker** 라이브러리와 **LLM**을 연동하여 기업명, 인명, 상품명 등 도메인별 다양한 텍스트 코퍼스 생성 및 적용
	- **마크다운 → 문서 이미지 제작:**
		- 마크다운에서 사용하는 컴포넌트들 (Text, Formula, Table) 별로 각각 생성후 Merge Orchestrator 가 하나로 합쳐서 하나의 문서 이미지를 만들도록 함
	- **Sim-to-Real Gap 완화**: 노이즈/블러(Blur) 효과를 적용하여 실제 환경(Real-world)의 복잡성 모사

- **Adversarial Noise Injection (Evaluation Logic)**
    - **유사 문자 기반 난독화**: 단순 정답 매칭을 넘어, OCR 모델이 혼동하기 쉬운 "유사 문자(Visual Similarity)"를 의도적으로 주입하여 모델의 변별력(Discriminative Power) 테스트 (예: `의사` → `익사`)
	- **유사 문자 DB 구축**:
	    - Wikipedia Corpus 기반의 문자셋(Character Set) 정의
	    - 문자 이미지 간 **SSIM(Structural Similarity Index Map)** 을 계산하여 시각적으로 유사한 문자 쌍(Pair) 데이터베이스 구축

- **자동화된 벤치마크 시스템 (Benchmark Pipeline)**
	- **영역별 평가 지표 도입**: OmniDocBench의 평가 방식을 차용하여 Text, Table, Formula 등 영역별 정밀 매칭 평가 구현
	- **실험 환경 표준화**: 모델별 상이한 프롬프트와 하이퍼파라미터를 `config.yaml`로 통합 관리하고, `uv`를 활용한 의존성 격리 환경을 구성하여 실험의 재현성(Reproducibility) 확보

## 4. 기술적 난관 및 해결 과정 (Troubleshooting)
---
- **유사 문자 DB 구축 시 연산량 폭증 이슈**
    - **문제**: 한글 약 1만 자에 대해 모든 문자 쌍의 SSIM을 계산할 경우 $O(N^2)$ 복잡도가 발생하여 연산 시간이 비현실적으로 길어짐 (약 $10^8$회 연산 필요)
    - **해결**: **2-Stage Filtering 파이프라인**을 설계하여 계산량 최적화
        - **1단계 (Coarse Filtering)**: 문자 이미지를 $8 \times 8$ 저차원 임베딩으로 변환 후, 벡터 내적(Dot Product)을 통해 유사 후보군을 고속으로 1차 필터링
        - **2단계 (Fine-grained Scoring)**: 선별된 후보군에 대해서만 $32 \times 32$ 고해상도 SSIM 정밀 비교 수행
    - **결과**: 전체 연산 시간을 획기적으로 단축하면서도 사람이 인지하는 시각적 유사도와 일치하는 정교한 DB 구축 성공

- **합성 데이터셋의 다양성 확보 (Data Engineering)**
    - **문제 (Problem)**
        - 하드코딩된 텍스트 및 수식 템플릿에 의존하여 대량의 데이터를 생성할 경우, 특정 패턴이 반복되거나 중복 데이터가 다수 발생하는 문제(Diversity bottleneck) 확인.
    - **해결 (Solution)**
        - **하이브리드 텍스트 생성 파이프라인** 구축 및 **동적 수식 생성 로직** 도입.
            - **Corpus 확장**: 기존 Rule-based 도구(Faker)와 LLM(Large Language Model)을 결합하여, 문맥과 어휘가 다양한 고품질 말뭉치(Corpus)를 추출 및 활용.
            - **수식 다양화**: 고정된 수식 템플릿 사용을 지양하고, 수식 구성 요소(Template)를 **재귀적으로 선택 및 조합(Recursive Combination)**하는 알고리즘을 구현하여 임의의 복잡한 수식을 동적으로 생성.
    - **결과 (Result)**
        - 데이터 간 중복률을 최소화하고 텍스트 및 수식 패턴의 분포(Distribution)를 넓힘으로써, 모델 학습을 위한 데이터셋의 다양성 및 품질을 크게 향상.

## 5. 성과 및 배운 점 (Results & Lessons Learned)
---
- **성과**
    - 합성 데이터만으로 비주류 언어(Low-resource Language)의 OCR 성능을 즉시 평가할 수 있는 **Scalable Benchmark System** 구축
    - 의도적인 노이즈 주입(Adversarial Attack)을 통해 기존 벤치마크보다 변별력 높은 **Edge-case 평가 시나리오** 확보
    - 언어 설정 변경만으로 다국어 확장이 가능한 유연한 아키텍처 구현
- **회고 및 향후 과제**
    - **Sim-to-Real Gap**: 프로그래매틱 데이터의 정답 정확도는 완벽하지만, 실제 문서의 구겨짐이나 조명 변화 등 물리적 왜곡을 완벽히 반영하기엔 한계 존재. 향후 GAN이나 Diffusion 모델을 활용한 물리적 노이즈 생성 모델 도입 고려
    - **Document Layout Diversity**: 이미지나, 차트 등 컴포넌트가 사용되지 않았는데, 이후에 파이프라인을 추가하여 고도화가 필요함.
    - **Training Data 활용**: 본 파이프라인이 단순 평가를 넘어, OCR 모델의 강건성(Robustness)을 높이는 학습 데이터(Augmentation) 생성 도구로도 활용 가능함을 확인