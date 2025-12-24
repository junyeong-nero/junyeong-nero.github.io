## 1. 역량 소개

---

**[Medical Vision · NLP 프로젝트 경험 및 데이터 엔지니어링]**

- **Medical Vision & Segmentation**  
    MedSAM을 활용해 뇌 종양 segmentation 데이터셋을 구축한 경험이 있습니다. 의료 전문 지식은 부족하지만, 의료 영상 데이터를 모델 학습에 필요한 형태로 전처리하고 정제하는 작업에 익숙합니다.
    
- **데이터 파이프라인 구성**  
    비정형 데이터를 학습용 데이터로 변환하는 파이프라인을 설계하고 구현해본 경험이 있습니다. 의료 데이터 번역, 웹 크롤링, API를 활용한 데이터 변환 등 다양한 소스의 데이터를 정제하여 학습 데이터셋으로 만들어본 적이 있습니다.
    
- **모델 파인튜닝 및 평가**  
    오픈소스 LLM을 특정 도메인(Healthcare)에 맞춰 파인튜닝하고, 벤치마크 데이터로 성능을 측정해본 경험이 있습니다.
    

ㅈ

## 2. 주요 프로젝트 경험

### A. MedSAM 기반 뇌 종양 Segmentation 데이터셋 구축

**프로젝트 개요**  
의료 영상에서 뇌 종양 영역을 정밀하게 분할하기 위해 **MedSAM(Medical Segment Anything Model)**을 활용한 segmentation 데이터셋 구축

**주요 작업 내용**

- **데이터 파이프라인 설계 및 구현**
    
    - 뇌 MRI 영상 수집 및 전처리 (해상도 정규화, slice 정렬)
    - MedSAM을 활용한 종양 후보 영역 자동 segmentation
    - 후처리 및 품질 검증을 통한 학습용 mask 정제
- **데이터셋 구성**
    
    - 뇌 종양 영역에 초점을 맞춘 image-mask pair 구조
    - 모델 학습 및 벤치마킹이 가능한 표준 segmentation 포맷

**성과 및 의의**

- 대규모 수작업 라벨링 없이 foundation model을 활용한 **의료 segmentation 데이터셋 생성 방법론 검증**
- 의료 영상 도메인에서 **프롬프트 기반 segmentation 활용 실전 경험** 축적
- 실제 학습 및 평가에 활용 가능한 품질의 데이터셋 공개

---

### B. Korean Medical LLM 개발

**프로젝트 개요**  
한국어 헬스케어 도메인에 특화된 LLM 개발을 위해 `rtzr/ko-gemma-2-9b-it` 모델 파인튜닝 수행

**데이터셋 구축 전략**  
다각화된 데이터 소스를 활용하여 고품질 학습 데이터 확보

1. **전문 데이터:** KorMedMCQA (한국 의사 국가고시 라벨링 데이터)
2. **번역 데이터:** MedExpQA, UltraMed, COD 등 고품질 영어 의료 데이터셋 한국어 번역
3. **웹 크롤링 데이터:** 전문가 의료 답변 및 아산병원 질병 사전 크롤링 후 정제
4. **법률 데이터:** 의료 법률 데이터를 Solar API로 QA 형식 변환

**모델 학습 및 평가**

- SFT(Supervised Fine-Tuning) 기반 파인튜닝 수행
- KorMedMCQA 기준 평가에서 베이스 모델 대비 도메인 특화 추론 성능 향상 확인

**성과 및 의의**

- 한국어 의료 데이터 부족 환경에서 **데이터 엔지니어링 중심의 성능 개선 전략 검증**
- 실제 국가시험 데이터 기반의 **정량적 평가 방법론 확립**
- 다양한 데이터 소스 통합을 통한 모델 성능 향상 경험


---

## 3. 기술 스택 및 관련 자료

**Language & Frameworks**

- Python, PyTorch, Hugging Face (Transformers, Datasets)

**Project: MedSAM Brain Tumor Segmentation**

- Code: https://github.com/junyeong-nero/MedSAM2
- Dataset: https://huggingface.co/datasets/junyeong-nero/mri-brain-tumor-segmentation-medsam2

**Project: Korean Medical LLM**

- Model: https://huggingface.co/ChuGyouk/ko-med-gemma-2-9b-it-merge2
- Datasets: KorMedMCQA, MedQA, PubMedVision-EnKo, Kin Med 100K Edited, Asan AMC Healthinfo, KorMedLaw, etc.

---

## 4. 대회 참가 동기 및 기대 효과

이번 대회를 통해 의료 영상 분석 역량을 실전 문제에 적용하고, 데이터 전처리부터 모델링까지 end-to-end 파이프라인을 구축한 경험을 더욱 발전시키고자 합니다. 특히 MedSAM 프로젝트에서 축적한 segmentation 기술과 데이터 엔지니어링 역량을 활용하여 의미 있는 결과를 도출하고, 나아가 실제 의료 현장에 기여할 수 있는 솔루션 개발에 도전하고 싶습니다.