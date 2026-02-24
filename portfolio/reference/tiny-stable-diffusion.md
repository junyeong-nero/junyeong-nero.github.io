# 1. 프로젝트 개요 (Overview)
---
- **프로젝트 명칭**: tiny-stable-diffusion
- **프로젝트 개요**: 최신 이미지 생성 모델인 **Stable Diffusion 3(SD3)** 의 아키텍처를 밑바닥부터(From Scratch) 구현하여 64x64 해상도의 텍스트-이미지(Text-to-Image) 생성 모델을 개발. U-Net 기반이 아닌 **Transformer 기반의 Diffusion(MMDiT)** 구조를 직접 설계하고 학습 파이프라인을 구축함.
- **진행 기간 및 인원**: 2025.12 - 2026.02 (1인 프로젝트)
- **사용 기술**: Python, PyTorch, Hugging Face Datasets

## 2. 문제 정의 및 목표 (Problem Statement)
---
- **배경**:
    - 기존 MNIST 기반 프로젝트(tiny-DDPM)의 한계(흑백, 단순 클래스 조건)를 넘어, **Latent Diffusion**과 **Text Conditioning** 기술을 확보하고자 함
    - 최신 연구 트렌드인 **Diffusion Transformer(DiT)** 구조를 이해하고, 실제 서비스 가능한 수준의 이모지/아이콘 생성 모델 개발을 목표로 함
- **목표**:
    - SD3의 핵심인 **MMDiT(Multimodal Diffusion Transformer) + VAE** 아키텍처 구현
    - 텍스트 프롬프트를 입력받아 64x64 RGB 이미지를 생성하는 End-to-End 학습/평가 파이프라인 구축

## 3. 주요 기능 및 본인의 기여 (Key Features & Contributions)
---
- **Model Architecture (SD3 Based)**
    - **MMDiT 구현**: 기존 U-Net 대신 **Transformer Backbone**을 적용하고, 이미지와 텍스트 모달리티가 상호작용하는 **Joint Attention** 메커니즘 구현
    - **Conditioning**: **CLIP-L** 텍스트 인코더를 활용하고, **adaLN-zero**를 통해 Time/Text 임베딩을 정규화 레이어에 주입
    - **Rectified Flow**: 노이즈와 데이터 간의 최단 경로를 학습하여 샘플링 효율을 높이는 **Rectified Flow** 로직 적용
    - **VAE (Variational Autoencoder)**: 이미지 압축 및 복원을 위한 $\beta$-VAE를 학습하여 Latent Space 기반의 효율적인 학습 환경 조성 (MSE 0.0002 달성)

- **Training Pipeline & Infrastructure**
    - **Data Strategy**: VAE 학습용 **LAION-400M** 일부와 Diffusion 학습용 **CC3M(3M)** 데이터셋을 활용하여 단계별 학습 진행
    - **Streaming Training**: 대용량 데이터셋 처리를 위해 Hugging Face의 **Streaming Mode**를 도입, 메모리 효율성 극대화
    - **Experiment Tracking**: **W&B**와 **RunPod(A4500 GPU)** 를 연동하여 Loss 추이 및 생성 샘플을 실시간 모니터링

- **Evaluation System**
    - **정량적 평가 지표 도입**:
        - **Quality**: **FID**, **CLIP-FID**, **IS(Inception Score)** 를 통해 생성 이미지의 다양성과 품질 측정
        - **Alignment**: **CLIPScore**를 통해 입력 프롬프트와 생성 이미지 간의 의미적 일치도 평가
        - **Reconstruction**: VAE의 복원 성능을 **PSNR**, **MSE**로 검증

## 4. 기술적 난관 및 해결 과정 (Troubleshooting)
---
- **Prompt Overfitting (Mode Collapse)**
    - **현상**: 소규모 데이터셋(30k)으로 실험 시, 입력 프롬프트와 무관하게 특정 패턴의 이미지만 반복 생성되는 과적합 발생
    - **분석**: Text-Image 쌍의 다양성이 부족하여 모델이 텍스트 조건을 무시하고 평균적인 이미지 분포만 학습
    - **해결**: 학습 데이터셋을 **CC3M(300만 장)** 으로 대폭 확장하고, 데이터 비율(VAE:Diffusion)을 논문 권장 사항에 맞춰 조정하여 일반화 성능 확보

- **Diffusion 학습 수렴 속도 저하**
    - **현상**: VAE 대비 Diffusion 모델의 Loss 감소가 매우 더디고 학습이 불안정
    - **해결**: **Rectified Flow**의 샘플링 기법을 최적화하고, **Logit-normal sampling** 및 **Min-SNR weighting** 기법을 적용하여 학습 안정성을 높임. 또한 **Checkpointing & Resume** 시스템을 구축하여 장기 학습에 대응

## 5. 성과 및 배운 점 (Results & Lessons Learned)
---
- **성과**
    - Stable Diffusion 3의 최신 아키텍처(MMDiT, Rectified Flow)를 자체 구현하여 동작 가능한 모델 확보
    - **정량 평가 파이프라인 구축**: 단순 눈대중이 아닌 FID, CLIPScore 등 객관적 지표를 통해 모델 성능을 입증할 수 있는 체계 마련
    - 64x64 해상도의 텍스트 조건부 이미지 생성 모델 완성
- **회고**
    - **Architecture Engineering**: 최신 논문의 복잡한 구조(Joint Attention 등)를 코드로 구현하며 딥러닝 아키텍처 설계 역량 심화
    - **AI Engineering Reality**: 코딩 에이전트가 있어도 전체 파이프라인 설계, 데이터 전략, 하이퍼파라미터 튜닝은 결국 엔지니어의 깊은 이해가 필수적임을 체감
    - **Resource Management**: 제한된 GPU 자원 내에서 효율적인 학습을 위한 스트리밍 데이터 처리 및 체크포인트 관리 노하우 습득