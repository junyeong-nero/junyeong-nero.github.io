# 1. 프로젝트 개요 (Overview)
---
- **프로젝트 명칭**: tiny-DDPM
- **프로젝트 개요**: DDPM(Denoising Diffusion Probabilistic Models)의 핵심 메커니즘을 밑바닥부터 구현(From Scratch)하여, 생성 모델의 작동 원리를 심층적으로 이해하고 MNIST 이미지 생성 성능을 최적화한 프로젝트
- **진행 기간 및 인원**: 2024.07 - 2024.08 (1인 프로젝트)
- **사용 기술**: Python, PyTorch, Hugging Face Datasets

## 2. 문제 정의 및 목표
---
- **배경**:
    - 최신 생성 AI의 근간이 되는 Diffusion 모델의 수리적 배경과 아키텍처를 단순 라이브러리 활용이 아닌 코드 레벨에서 직접 구현하며 체득할 필요성 인지
- **목표**:
    - 논문(Ho et al., 2020)의 수식을 코드로 정확히 옮기는 **Paper Implementation** 능력 함양
    - 바닐라 DDPM뿐만 아니라 DDIM, CFG 등 파생 기법을 추가 구현하여 생성 속도와 품질(Fidelity) 개선

## 3. 주요 기능 및 본인의 기여
---
- **Noise Scheduling & Diffusion Process**
  - **Scheduler 구현**: Linear 및 Cosine Scheduling 알고리즘을 직접 구현하여 Forward/Reverse Diffusion 단계의 노이즈 제어 로직 설계
  - **Loss Function**: Gaussian Noise 예측을 위한 MSE Loss 기반 학습 루프 구축
- **Custom U-Net Architecture Design**
  - **ResNet Backbone**: Down/Upsampling 및 Residual Connection을 적용하여 깊은 신경망에서도 안정적인 학습 유도
  - **Conditioning Mechanism**: Time Embedding과 Class Label 정보를 효과적으로 주입하기 위해 **Multi-Head Attention** 모듈을 통합한 개량형 U-Net 설계
- **Advanced Sampling Strategies**
  - **DDIM (Denoising Diffusion Implicit Models)**: Non-Markovian 프로세스를 적용하여 추론 속도를 가속화 (Sampling Step 단축)
  - **CFG (Classifier-Free Guidance)**: 별도의 분류기 없이 조건부 생성 성능을 높이는 Guidance 기법 구현
- **Quantitative Evaluation**
  - **지표 기반 성능 분석**: FID(Frechet Inception Distance) 및 IS(Inception Score)를 활용하여 생성 이미지의 품질을 정량적으로 평가
  - **Guidance Scale 최적화**: 실험을 통해 CFG Scale $w=0.1$에서 **FID 0.2514**의 최고 성능을 달성함을 확인

## 4. 기술적 난관 및 해결 과정 (Troubleshooting)
---
### Conditioning Signal 간섭 문제 해결을 위한 Attention 메커니즘 도입
- **문제 (Problem)**:
    - 초기 모델에서는 Time Embedding과 Class Embedding을 단순 합산(Element-wise Addition)하여 주입했으나, 특정 클래스(숫자)가 생성되지 않고 무작위 노이즈가 출력되는 **Mode Collapse** 현상 발생
- **분석 (Analysis)**:
    - 성격이 다른 두 가지 조건 정보(시간, 클래스)가 동일한 채널로 유입되면서 정보 간섭(Interference)이 발생, 모델이 조건을 명확히 식별하지 못함
- **해결 (Solution)**:
    - **Signal 분리**: Time 정보는 기존대로 MLP를 통해 Feature Map에 더해주되(Add), Class 정보는 별도의 경로로 처리하도록 구조 변경
    - **Cross-Attention 도입**: U-Net의 병목(Bottleneck) 구간에 **Cross-Attention Layer**를 신규 배치하여, Class Token이 이미지 Feature와 상호작용하며 조건 정보가 강조되도록 아키텍처 개선
- **결과 (Result)**:
    - 조건 정보의 간섭이 해소되어 의도한 숫자(0~9)를 정확히 생성하는 조건부 생성 모델(Conditional Generative Model) 학습 성공

## 5. 성과 및 배운점
---
- **성과**:
  - DDPM, DDIM, CFG 등 Diffusion 핵심 알고리즘을 자체 구현하여 동작 가능한 생성 파이프라인 완성
  - 정량적 지표(FID 0.25)를 통해 모델의 성능을 입증하고, Guidance Scale 등 하이퍼파라미터의 영향력을 실험적으로 검증
- **회고 및 성장**:
  - **Model Architecture Engineering**: 단순 구현을 넘어, 문제 해결을 위해 네트워크 구조(Attention 추가)를 수정하며 딥러닝 아키텍처 설계 역량 향상
  - **Experimental Rigor**: 실험 설정(Configuration)과 결과 기록의 중요성을 체감하며, 체계적인 실험 관리 프로세스의 필요성 학습