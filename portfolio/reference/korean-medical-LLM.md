# 1. 프로젝트 개요
---
- **프로젝트 명칭**: Korean Medical LLM
- **프로젝트 개요**: 한국어 의료 데이터 부족 문제를 해결하기 위해 약 45만 건의 특화 데이터셋을 구축하고, `google/gemma2-9b`를 기반으로 SFT(Supervised Fine-Tuning) 및 Model Merge를 적용하여 한국어 의료 도메인에 최적화된 LLM 개발
- **진행 기간 및 인원**: 2024.09 - 2024.10 (2명)
- **사용 기술 스택**: Python, Hugging Face (Transformers, TRL, Datasets), Unsloth

## 2. 문제 정의 및 목표
---
- **배경**:
    - 범용 LLM은 전문적인 의학 지식이 요구되는 질의에 대해 부정확한 답변(Hallucination)을 하거나, 한국어 의학 용어에 대한 이해도가 낮은 한계 존재
    - 의료 분야는 높은 신뢰성이 요구되므로, 도메인 특화 지식을 갖춘 **Specialized LLM**의 필요성 대두
- **목표**:
    - 신뢰할 수 있는 한국어 의료 데이터셋 구축 (국가고시, 질병사전, 의료법률 등)
    - SFT 및 Model Merge 기법을 통해 일반 상식 능력을 유지하면서도 의료 전문성을 극대화한 모델 개발

## 3. 주요 기능 및 본인의 기여 (Key Features & Contributions)
---
- **하이브리드 데이터셋 구축 (Data Engineering)**
    - **다각화된 데이터 소스 확보**: 총 **449,500건**의 고품질 학습 데이터셋 구축
        - **전문 지식**: KorMedMCQA (의사국가고시), 아산병원 질병사전 크롤링 데이터
        - **데이터 확장**: MedExpQA, UltraMed 등 우수한 영어 의료 데이터셋을 한국어로 번역하여 활용
        - **법률/규정**: 의료 법률 문서를 `Solar-API`를 활용하여 QA(Chat) 형식의 Instruction 데이터로 변환 (Synthetic Data Generation)
    - **최신 데이터 반영**: 2025년도 의사국가고시 기출문제를 신규 라벨링하여 데이터셋의 최신성 확보

- **기술적 의사결정 및 전략**
    - **도메인 지식의 한계 극복**: 의료 전문가 부재 상황을 타개하기 위해, 검증된 영문 데이터의 번역과 공신력 있는 기관(아산병원, 법령센터)의 데이터를 가공하는 **Data-Centric 전략** 수립
    - **Instruction Tuning 최적화**: 단순 텍스트가 아닌 질의응답(QA) 형태의 데이터 구성을 통해 모델의 지시 이행 능력 강화

## 4. 기술적 난관 및 해결 과정 (Troubleshooting)
---
- **데이터 배합 비율 최적화 (Data Mixing Strategy)**
    - **문제**: 의료 데이터만으로 학습 시 일반 상식 능력이 저하되는 **Catastrophic Forgetting** 발생 및 한국어/영어 데이터 간의 최적 혼합 비율 불명확
    - **분석**: GenMedGPT, UltraMedical 등 선행 연구 분석을 통해 도메인 특화 학습 시에도 일반 데이터(General Domain)의 유지가 필수적임을 확인
    - **해결**:
        - 다수 실험을 통해 최적의 학습 비율 도출: **한국어:영어 = 60:40**, **General:Medical ≈ 2.5:1**
        - **Model Merge** 기법 적용: SFT된 모델과 기존 범용 모델을 병합하여, 의료 전문성을 높이면서도 일반 대화 능력을 보존하는 균형점 달성

## 5. 성과 및 배운 점 (Results & Lessons Learned)
---
- **성과**
    - KorMedMCQA 및 자체 구축 데이터셋을 기반으로 한국어 의료 도메인에 특화된 LLM 파이프라인 구축 완료
    - 정교한 데이터 배합과 Model Merge를 통해 도메인 적응(Domain Adaptation) 성능과 범용성 사이의 트레이드오프(Trade-off) 최적화
- **회고 및 인사이트**
    - **Catastrophic Forgetting에 대한 고찰**: 도메인 특화 모델 개발 시, 단순히 특화 데이터 양을 늘리는 것보다 일반 데이터와의 **균형(Balance)** 이 성능에 결정적인 영향을 미침을 체감
    - **Minor Language LLM의 방향성**: 영어 중심의 LLM 생태계에서 한국어와 같은 저자원 언어(Low-resource Language)의 성능을 높이기 위해서는, 양질의 번역 데이터와 합성 데이터(Synthetic Data) 활용 전략이 핵심임을 확인