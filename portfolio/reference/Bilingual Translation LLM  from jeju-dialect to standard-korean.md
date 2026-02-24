# 1. 프로젝트 개요 (Overview)
---
- **프로젝트 명칭**: Bilingual Translation LLM from Jeju Dialect to Standard Korean
- **프로젝트 소개**: 제주 방언과 표준어 간의 양방향 번역을 위해 KoT5 및 KoBART 기반의 Encoder-Decoder 모델을 구축하고, PEFT(Parameter-Efficient Fine-Tuning) 기법을 적용하여 저자원 환경에서의 번역 성능을 극대화한 프로젝트
- **진행 기간 및 인원**: 2024.05 ~ 2024.06 (3명)
- **사용 기술 스택**: Python, Hugging Face (TRL, Datasets), PyTorch


## 2. 문제 정의 및 목표 (Problem Statement)
---
- **배경**:
    - 최근 LLM 트렌드가 Decoder-only 아키텍처에 집중되어 있으나, 기계 번역(Seq2Seq) 태스크에서는 Encoder-Decoder 구조가 여전히 높은 효율성을 보임
    - 제주 방언을 단순한 사투리가 아닌 독립된 언어 체계로 접근하여, 문맥적 뉘앙스를 보존하는 고품질 번역 모델 필요
- **목표**:
    - 제한된 GPU 리소스 환경에서 QLoRA 등 최신 경량화 학습 기법을 적용하여 학습 효율성 확보
    - 단일 모델로 양방향 번역이 가능한 통합 파이프라인 구축 및 실무 적용 가능한 정량적 성능 달성

## 3. 주요 기능 및 기여도 (Key Features & Contributions)
----
- **데이터셋 구축 및 정제 (Dataset Engineering)**
    - AIHub 제주도 방언 발화 데이터를 전처리하여 총 **453k 쌍(Pair)** 의 고품질 병렬 코퍼스 확보
    - **정제 전략 고도화**: 단순 고유명사 등 표준어와 방언이 100% 일치하는 데이터를 필터링하여, 모델이 실질적인 문법 및 어휘 차이를 학습하도록 데이터 밀도 향상
- **양방향 번역 파이프라인 (Multi-task Learning)**
    - 프롬프트 엔지니어링을 통해 `<dialect_to_standard>`, `<standard_to_dialect>` 스페셜 토큰 도입
    - 태그 기반 학습 전략(Tag-based Training)을 적용하여 단일 모델 내에서 양방향 번역을 수행하는 Multi-task Learning 구현
- **모델 학습 및 성능 평가**
    - `Seq2SeqTrainer`를 활용하여 Full Fine-tuning 및 PEFT(LoRA, QLoRA) 실험 수행 및 최적화
    - **최종 성능**: **BLEU 0.56**, **ROUGE-L 0.60**을 달성하여 안정적인 번역 품질 입증

## 4. 기술적 난관 및 해결 과정 (Troubleshooting)
----
- **리소스 제약 이슈 (OOM)**
    - **문제**: Google Colab(Nvidia T4, 16GB vRAM) 환경에서 Full Fine-tuning 시 Optimizer 상태 저장 등으로 인한 OOM(Out of Memory) 발생
    - **해결**: **QLoRA (4-bit Quantization)** 기법을 도입하여 모델 가중치를 4비트로 양자화, 메모리 사용량을 획기적으로 절감하면서도 성능 저하 최소화
- **성능 검증 실험**
    - 추가 리소스를 확보하여 수행한 Full Fine-tuning 모델과 QLoRA 모델의 성능을 비교 분석
    - QLoRA 적용 시 현저히 낮은 메모리 점유율로도 Full Fine-tuning에 준하는 성능을 유지함을 실험적으로 입증

## 5. 성과 및 배운 점 (Results & Lessons Learned)
---
- **프로젝트 성과**
    - 태그 기반 프롬프팅 설계를 통해 단일 모델로 양방향 번역 시스템을 성공적으로 구현
    - 저사양 GPU 환경에서도 최신 튜닝 기법(QLoRA)을 활용하여 상용 수준의 모델을 개발할 수 있는 실무 역량 확보
- **회고 및 향후 계획**
    - **Encoder-Decoder 구조 재조명**: 번역 특화 태스크에서 Encoder-Decoder 아키텍처의 구조적 강점 재확인
    - **벤치마크 확장**: 향후 동일 파라미터 규모의 Decoder-only 모델과의 정량적 비교를 통해 아키텍처별 효율성 심층 분석 예정