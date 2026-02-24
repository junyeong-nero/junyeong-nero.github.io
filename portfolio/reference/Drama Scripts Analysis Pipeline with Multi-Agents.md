# 1. 프로젝트 개요 (Overview)
----
- **프로젝트 명칭**: Drama Scripts Analysis Pipeline with Multi-Agents
- **프로젝트 개요**: 드라마 대본의 줄거리, 캐릭터 매력도, 흥행 요소를 정량적으로 분석하여 제작 의사결정을 지원하는 Multi-Agent 기반의 AI 파이프라인 구축 프로젝트
- **진행 기간 및 인원**: 2025.02 - 2025.10 (4명)
- **사용 기술**: Python, FastAPI, LangChain, Transformers, PyTorch

## 2. 문제 정의 및 목표 (Problem Statement)
----
- **배경**:
    - **비효율적인 검토 프로세스**: 기존 제작 환경에서는 1~4화 분량의 대본을 인력이 직접 검토하여 막대한 시간과 비용이 소요됨
    - **평가의 주관성 및 편향**: 검토자 개인의 취향에 따른 편향(Bias)이 발생하며, 교차 검증 과정에서 업무 병목 현상 심화
    - **잠재적 흥행작 누락**: 물리적 한계로 인해 가치 있는 작품이 충분히 검토되지 못하고 사장되는 리스크 존재
- **목표**:
    - Multi-Agent 시스템을 도입하여 대본 분석을 자동화하고, 객관적 데이터 기반의 평가 지표 제공
    - 검토 시간을 획기적으로 단축하여 의사결정 효율성 극대화

## 3. 주요 기능 및 본인의 기여 (Key Features & Contributions)
----
- **Multi-Format Document Parser 개발 (Data Preprocessing)**
    - 다양한 포맷(PDF, HWP, DOCX)의 대본을 정형 텍스트로 변환하는 전처리 모듈 개발
    - **VLM(Vision Language Model) 도입**: 기존 OCR의 한계를 극복하기 위해 **Qwen2.5-7B-VL** 모델을 적용, 복잡한 레이아웃에서도 텍스트 인식률 극대화
    - HWP 및 DOCX 전용 파서 개발 및 한국어 OCR 벤치마크 데이터셋 구축을 통한 성능 검증
- **Scene Analysis Agent 구축 (Core Logic)**
    - 전체 에피소드를 씬(Scene) 단위로 세분화하여 구조적 분석 수행
    - 각 씬이 서사에서 강점(Strength) 또는 약점(Weakness)으로 작용하는지 판단하는 분류 에이전트 구현
    - **CoT (Chain-of-Thought)** 프롬프팅을 적용하여 LLM이 맥락적 뉘앙스를 정확히 추론하도록 유도
- **System Orchestration**
    - **LangChain**을 활용하여 Parser, Analyzer, Evaluator 등 개별 에이전트 간의 유기적인 워크플로우 설계 및 통합 관리

## 4. 기술적 난관 및 해결 과정 (Troubleshooting)
---
### (Issue 1) 기존 OCR의 낮은 한국어 인식률 및 레이아웃 처리 한계
- **문제:**
	- Traditional OCR(Paddle OCR 등) 모델 사용 시 한국어 인식률 저조 (WER 20% 이상)
	- 다단(Multi-column) 레이아웃 문서에서 텍스트 인식 순서가 뒤섞이는 정렬 오류 발생
- **원인:**
	- 기존 모델의 한국어 학습 데이터 부족 및 복잡한 레이아웃에 대한 시각적 구조 이해 능력 부재 (단순 좌표 기반 인식의 한계)
- **해결:**
    - 단순 텍스트 인식을 넘어 문서의 시각적 구조를 이해하는 **VLM(Vision Language Model)** 도입
    - **Qwen2.5-7B-VL** 모델을 활용하여 다단 레이아웃 내 한국어 텍스트 추출 정확도 개선
- **결과:**
    - **WER(단어 오류율)을 20%에서 7%로 대폭 감소**시켜 분석 데이터의 신뢰도 확보

### (Issue 2) 문맥 추론의 한계 및 장르별 세분화로 인한 Overfitting
- **문제:**
    - 데이터셋 부족으로 인해 Scene별 강/약점 분류 성능이 저조함 (F1-score 0.2 수준)
    - 장르별(스릴러, 로맨스 등) 프롬프트 세분화 시 모델이 특정 패턴에 과적합(Overfitting)되는 현상 발생
- **분석:**
    - **Instruction Following 한계**: 일반 모델은 대본의 복합적인 맥락(Subtext)과 한국어 구어체의 미묘한 뉘앙스 파악에 어려움
    - **Bias 발생**: 데이터 부족 상황에서 과도한 프롬프트 엔지니어링(Over-prompting)이 오히려 모델의 편향을 유발
- **해결:**
    - **Reasoning Model 도입**: 복잡한 추론에 강점인 Thinking Model(Deepseek-R1 등) 및 한국어 특화 모델(c4ai-command-a 등) 벤치마킹 수행
    - **파이프라인 최적화**: 인위적인 제약(Constraint)을 제거하고 모델 자체의 추론 능력을 활용하도록 프롬프트 단순화 (Generalization 유도)
- **결과:**
    - 한국어 이해도가 높은 모델 선정 및 파이프라인 경량화를 통해 **F1-score를 0.2에서 0.5로 2.5배 향상**

## 5. 성과 및 배운 점 (Results & Lessons Learned)
----
- **성과**
    - VLM 도입을 통해 비정형 대본 문서의 파싱 정확도 획기적 개선 (WER: 20% → 7%)
    - 복잡한 레이아웃에서도 안정적으로 작동하는 텍스트 추출 파이프라인 확보
    - 분류 모델 및 프롬프트 최적화를 통해 분석 성능 대폭 향상 (F1-score: 0.2 → 0.5)
- **Insight**
    - **Data-Centric AI의 중요성**: 복잡한 에이전트 시스템일수록 신뢰할 수 있는 평가 지표(Metric)와 고품질 데이터 확보가 선행되어야 함을 체감
    - **Trade-off in Prompting**: 복잡한 지시사항보다 모델의 본질적 추론 능력을 믿고 단순화하는 것이 오히려 성능 향상에 기여함을 확인 ('Simple is Best')