---
tags:
  - RL
date created: Friday, November 21st 2025, 3:49:42 pm
date modified: Friday, November 21st 2025, 3:50:14 pm
---
# Direct Preference Optimization (DPO) 쉽게 이해하기

최근 LLM(Large Language Model)을 사람의 선호에 맞게 조정하는 방법으로 **RLHF (Reinforcement Learning with Human Feedback)** 가 널리 사용되고 있다.  
하지만 RLHF는 구조가 복잡하고 구현 난이도가 높다. 이 문제를 훨씬 단순하게 만든 방법이 바로 **DPO (Direct Preference Optimization)** 이다.

**핵심 한 줄 요약**

> DPO는 강화학습(RL)을 직접 사용하지 않고, 사람의 선호 데이터만으로 언어 모델을 직접 최적화하는 방법이다.

---

## 1. RLHF와의 관계 정리

우선 기존 구조를 간단히 보면 다음과 같다.

일반적인 RLHF 파이프라인:

1. SFT (Supervised Fine-Tuning)
2. Reward Model 학습
3. PPO 같은 RL 알고리즘 적용
    

즉, 다음과 같은 관계다:

$$  
\text{LLM} \xrightarrow{\text{SFT}} \text{Policy} \xrightarrow{\text{Reward Model + PPO}} \text{Aligned Policy}  
$$

하지만 문제는:

- Reward model 학습이 필요함
- PPO가 불안정하고 복잡함
- Hyperparameter tuning이 매우 까다로움
    

여기서 나온 질문:

> “굳이 RL과 Reward Model이 필요할까? Preference 데이터에서 바로 학습하면 안 될까?”

→ 이 질문의 답이 **DPO**다.

---

## 2. DPO의 핵심 아이디어

DPO에서는 다음과 같은 데이터를 사용한다:

- 같은 질문 $x$에 대해
    - 좋은 답변 $y^+$
    - 나쁜 답변 $y^-$
        

즉, 사람의 선호가 다음을 만족하도록 만든다:

$$  
y^+ \succ y^-  
$$

DPO는 이 pair를 사용해서, 모델이 자연스럽게 **좋은 답변의 확률은 높이고, 나쁜 답변의 확률은 낮추도록** 학습한다.

이때 사용하는 목적 함수는 다음과 같다:

### ✅ DPO objective function

$$  
\mathcal{L}_{DPO}(\theta) = - \log \sigma \left( \beta \left( \log \pi_\theta(y^+|x) - \log \pi_\theta(y^-|x) - \log \pi_{ref}(y^+|x) + \log \pi_{ref}(y^-|x) \right) \right)  
$$

여기서:

|기호|의미|
|---|---|
|$\pi_\theta$|학습하려는 정책 모델 (Policy model)|
|$\pi_{ref}$|기준 모델 (Reference model)|
|$y^+$|선호되는 응답|
|$y^-$|선호되지 않는 응답|
|$\beta$|Temperature (차이 강조 정도)|
|$\sigma$|sigmoid 함수|

이 식의 핵심 목적은:

> **좋은 답변(y⁺)의 확률이 나쁜 답변(y⁻)보다 확실히 높아지도록 만드는 것**

즉, 모델이 다음을 더 강하게 만족하도록 학습한다:

$$  
\pi_\theta(y^+|x) \gg \pi_\theta(y^-|x)  
$$

하지만 중요한 점이 있다.

→ 너무 멀어지지 않게 하기 위해 reference model($\pi_{ref}$) 과의 차이까지 고려함  
→ 이는 KL penalty와 동일한 역할을 한다.

즉, DPO는 RL 없이도 PPO + KL penalty 효과를 수식 안에 내장한 구조이다.

---

## 3. 왜 DPO가 PPO보다 좋은가?

|PPO (RLHF)|DPO|
|---|---|
|Reward model 필요|필요 없음|
|샘플링 + RL 구조|일반 supervised learning|
|불안정|매우 안정적|
|복잡한 tuning|단순한 hyperparameter|
|구현 난이도 높음|구현 쉬움|

DPO는 **그냥 cross-entropy loss를 쓰는 supervised training과 거의 동일한 구조** 이다.

그래서 실전에서는 다음과 같은 흐름이 된다.

```
SFT 모델 → DPO fine-tuning → Aligned model
```

---

## 4. 직관적인 예시

질문:

> "강아지를 키우는 장점은?"

두 개의 답변이 있다.

✅ 좋은 답변 ($y^+$):

> 강아지는 사람에게 정서적 안정감을 주고, 책임감을 기르게 해줍니다. 또한 신체 활동을 늘려주며 사회적 관계도 넓혀줍니다.

❌ 나쁜 답변 ($y^-$):

> 강아지는 귀찮고 돈이 많이 들며 시끄럽습니다.

DPO는 다음 방향으로 작동한다:

$$  
\log P_\theta(\text{좋은 답}) > \log P_\theta(\text{나쁜 답})  
$$

즉, 학습이 반복될수록 모델은 자연스럽게

- 비슷한 질문에 대해
- 더 긍정적이고 유용한 답을 생성하게 된다.
    

사람이 직접 점수를 주는 것이 아니라  
**“이 둘 중 어느게 더 나은가?”** 만 알려주면 학습할 수 있다.

→ 이것이 DPO의 핵심 강점이다.

---

## 5. 간단한 파이썬 구조 예시 (개념용)

```python
import torch
import torch.nn.functional as F

def dpo_loss(model, ref_model, prompt, chosen, rejected, beta=0.1):

    pi_chosen = model.log_prob(prompt, chosen)
    pi_rejected = model.log_prob(prompt, rejected)

    ref_chosen = ref_model.log_prob(prompt, chosen)
    ref_rejected = ref_model.log_prob(prompt, rejected)

    diff = (pi_chosen - pi_rejected) - (ref_chosen - ref_rejected)
    loss = -F.logsigmoid(beta * diff)

    return loss.mean()
```

실제로는 토크나이즈, padding, batching 등이 추가되지만  
핵심 수식 구조는 이것과 동일하다.

---

## 6. DPO의 한계

DPO가 모든 것을 해결하지는 않는다.

- Preference data의 품질이 매우 중요함
- output diversity가 줄어들 수 있음
- 매우 긴 reasoning에는 한계가 있음
    

그래서 최근에는 다음과 같은 방법들이 함께 연구된다:

- IPO (Implicit Preference Optimization)
- KTO (Kahneman-Tversky Optimization)
- ORPO (Odds Ratio Preference Optimization)
- RLAIF (AI Feedback 기반 강화학습)
    

---

## 7. 같이 보면 좋은 개념들 (추천 학습 주제)

더 깊이 이해하고 싶다면 다음 키워드들을 공부해보면 좋다:

- RLHF (Reinforcement Learning with Human Feedback)
- PPO (Proximal Policy Optimization)
- KL Divergence
- Reward Model
- Preference Learning
- Implicit Reward Modeling
- Instruct tuning
- Constitutional AI
- ORPO, KTO, IPO 논문들
    