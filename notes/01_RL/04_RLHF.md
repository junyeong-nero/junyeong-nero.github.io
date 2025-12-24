# RLHF (Reinforcement Learning from Human Feedback) 정리

## 1. RLHF 개념 개요

**RLHF(Reinforcement Learning from Human Feedback)**는 인간의 피드백을 보상 신호로 활용하여 모델을 학습시키는 방법이다.  
전통적인 Reinforcement Learning(RL)은 환경(environment)에서 자동으로 생성되는 reward에 의존하지만, RLHF는 여기에 **사람의 선호도(human preference)**를 반영한다는 점이 핵심이다.

대형 언어 모델(LLM)에서 RLHF는 다음과 같은 목적을 가진다.

- 사람이 더 “좋다”고 판단하는 응답을 생성하도록 유도
- 유해하거나 부적절한 출력 감소
- 모델의 응답을 보다 **alignment**되게 조정
    

대표적인 활용 사례는 ChatGPT, InstructGPT, Claude, Gemini 등의 모델 학습 과정이다.

---

## 2. RLHF의 전체 파이프라인

RLHF는 보통 아래의 3단계를 거쳐 진행된다.

### (1) Supervised Fine-Tuning (SFT)

먼저, 사람이 작성한 고품질 데이터로 모델을 supervised 방식으로 학습시킨다.

$$  
\mathcal{L}_{SFT} = - \sum_{t} \log P_\theta(y_t \mid x, y_{<t})  
$$

- $x$: 입력 프롬프트
- $y_t$: 정답 토큰
- $\theta$: 모델 파라미터
    

이는 기본적인 언어 모델 학습과 동일한 형태의 **cross-entropy loss**이다.

---

### (2) Reward Model (RM) 학습

사람이 두 개 이상의 모델 출력 중에서 어떤 것이 더 좋은지 선택한다.

예시:

- 질문: “Explain gravity in simple terms.”
- 답변 A, 답변 B 중 사람이 A를 더 좋다고 클릭
    

이 데이터를 이용해 **Reward Model**을 학습한다.

Reward Model의 목적 함수는 보통 다음과 같다.

$$  
\mathcal{L}_{RM} = - \log \sigma\left( r_\phi(y^{(chosen)}) - r_\phi(y^{(rejected)}) \right)  
$$

- $r_\phi(\cdot)$: Reward Model
- $\sigma$: sigmoid 함수
- chosen 답변이 rejected 답변보다 더 높은 reward를 갖도록 학습
    

즉,

$$  
r_\phi(y^{(chosen)}) > r_\phi(y^{(rejected)})  
$$

가 되도록 유도한다.

---

### (3) RL (PPO 기반 Fine-tuning)

Reward Model을 사용하여 실제 LLM을 강화학습 방식으로 최적화한다.

대표적으로 **PPO(Proximal Policy Optimization)**가 사용된다.

Objective는 보통 아래 형태로 표현된다.

$$  
\max_\theta ; \mathbb{E}_{y \sim \pi_\theta} \left[ r_\phi(y) - \beta , \text{KL}(\pi_\theta \mid \pi_{ref}) \right]  
$$

- $\pi_\theta$: 업데이트 중인 모델
- $\pi_{ref}$: reference model (보통 SFT 모델)
- $r_\phi(y)$: Reward Model의 점수
- $\text{KL}(\cdot)$: KL divergence
- $\beta$: 원래 모델과 너무 멀어지지 않게 하는 제어 파라미터
    

**KL term**은 모델이 인간 언어 분포에서 너무 벗어나지 않도록 억제하는 역할을 한다.

---

## 3. 왜 RLHF가 필요한가?

일반적인 LLM은 다음과 같은 한계를 가진다.

- hallucination(그럴듯한 거짓 정보 생성)
- 공격적인 답변
- 비윤리적 혹은 위험한 발언
    

RLHF는 단순히 “다음 단어 예측”을 넘어서

> “사람이 좋아할 답변을 생성하도록”

학습 목표를 바꾼다.

즉, 확률 최적화가 아니라 **human preference 최적화**로 이동하는 것이다.

이를 수식적으로 보면 다음과 같다.

일반 LLM은:

$$  
\max_\theta P_\theta(y \mid x)  
$$

RLHF는:

$$  
\max_\theta \mathbb{E}_{y \sim \pi_\theta} \left[\text{HumanPreference}(y|x)\right]  
$$

즉, 목적 함수 자체가 다르다.

---

## 4. 예시로 이해하기

### 예시 상황

프롬프트:

> "AI가 인간을 대체할 수 있을까?"

모델 A:

> AI는 인간보다 무조건 우수하며, 대부분의 직업을 사라지게 만들 것이다.

모델 B:

> AI는 많은 영역에서 인간을 돕지만, 창의성과 윤리 판단에서는 인간의 역할이 여전히 중요하다.

대부분의 사람은 **B를 더 좋은 답변**이라고 선택할 확률이 높다.

이때:

$$  
r_\phi(B) > r_\phi(A)  
$$

가 되도록 Reward Model이 학습되며,  
이후 PPO 단계에서 모델이 B와 비슷한 스타일의 응답을 더 많이 생성하도록 학습된다.

즉, 모델은 이런 방향으로 행동(policy)을 업데이트한다.

$$  
\pi_{\theta_{new}} \leftarrow \arg\max_\theta \mathbb{E}[r_\phi(y)]  
$$

결과적으로 모델의 출력 스타일 자체가 점점 “사람다운 답변”으로 바뀌게 된다.

---

## 5. RLHF의 장점과 한계

### 장점

- 인간의 가치/선호를 직접 반영 가능
- Safety, Alignment에 매우 효과적
- 모델 응답 품질이 전체적으로 향상됨
    

### 한계

- 많은 인적 리소스 필요 (feedback 라벨링)
- Reward Model의 bias 문제
- preference가 문화/집단에 따라 달라질 수 있음
- brittle reward hacking 가능성
    

즉, RLHF 자체도 완벽한 방법은 아니다.

---

## 6. 간단한 요약

- RLHF는 **human feedback**을 보상으로 사용하는 강화학습 방법
- 3단계: **SFT → Reward Model → PPO**
- 목적은: 사람이 더 선호하는 응답을 생성하도록 유도
- LLM alignment의 핵심 기술 중 하나
- Reward Model + PPO + KL constraint가 중요한 구성 요소
    

---

## 7. 추가로 보면 좋은 개념들

- [[01_RL/04_PPO|04_PPO]]
- [[01_RL/03_Policy_Gradient|03_Policy_Gradient]]
- Reward Modeling
- KL divergence in RL
- Constitutional AI
- [[01_RL/04_DPO|04_DPO]]
- [[01_RL/07_GRPO|07_GRPO]]
- Preference Learning
- Instruct Fine-Tuning
- Alignment problem in AI
    

이 개념들을 함께 공부하면 LLM alignment와 RLHF 구조가 훨씬 명확해진다.