## GRPO (Group Relative Policy Optimization): Value Network 없이 안정적으로 학습하는 RLHF 방식

최근 LLM 학습에서 PPO의 대안으로 주목받은 알고리즘이 **GRPO (Group Relative Policy Optimization)**이다.  
특히 DeepSeek-R1 논문 등에서 사용되면서 널리 알려졌으며, 핵심 특징은 **Value Network를 사용하지 않고도 안정적인 policy optimization을 수행한다는 점**이다.

> 한 문장으로 요약하면:  
> **GRPO = “여러 응답을 비교해서 상대적인 ranking으로 학습하는 PPO 스타일 알고리즘”**

---

## 1. 왜 GRPO가 등장했는가?

기존 PPO 기반 RLHF 방식은 다음 구조를 가진다.

- Policy network (Actor)
- Value network (Critic)
- Reward model
    

하지만 여기에는 문제가 있다.

1. Value network 학습이 불안정함
2. Large model일수록 값 추정이 어려움
3. 추가 모델 학습 비용 발생
    

이 문제를 해결하기 위해 나온 아이디어는 간단하다.

> “절대적인 reward 대신 **상대적인 ranking**만 사용하면 Value function이 필요 없지 않을까?”

그 결과 나온 것이 **GRPO (Group Relative Policy Optimization)**이다.

---

## 2. GRPO의 핵심 아이디어

하나의 프롬프트 $x$에 대해 policy가 여러 개의 답변을 생성한다고 하자.

$$  
{ y_1, y_2, ..., y_G }  
$$

그리고 각 답변에 대해 reward model이 점수를 준다.

$$  
{ r_1, r_2, ..., r_G }  
$$

GRPO는 여기서 **절대적인 reward 값이 아니라, 그룹 내 상대적인 advantage**를 사용한다.

즉,

$$  
A_i = r_i - \frac{1}{G} \sum_{j=1}^{G} r_j  
$$

이것을 **Group Relative Advantage**라고 부른다.

이 식이 의미하는 바는 다음과 같다.

- 그룹 평균보다 좋으면 $A_i > 0$
    
- 그룹 평균보다 나쁘면 $A_i < 0$
    
- 즉, **비교 기반의 학습 신호**를 제공한다
    

이제 Value function $V(s)$ 없이도 Advantage를 계산할 수 있다.

---

## 3. GRPO의 Objective Function

GRPO는 PPO 스타일을 그대로 따르되, Advantage만 다르게 정의한다.

Probability ratio는 다음과 같이 정의된다:

$$  
r_t(\theta) = \frac{\pi_\theta(y_t | x_t)}{\pi_{\theta_{old}}(y_t | x_t)}  
$$

그리고 최종 objective는 다음과 같다:

$$  
\mathcal{L}_{GRPO}(\theta) =  
\mathbb{E}\left[  
\min(  
r_t(\theta) \cdot A_t,;  
clip(r_t(\theta), 1 - \epsilon, 1 + \epsilon) \cdot A_t  
)  
\right]

- \beta \cdot KL(\pi_\theta || \pi_{ref})  
    $$
    

여기서:

- $A_t$ = group-relative advantage
- $\epsilon$ = clipping parameter
- $\beta$ = KL regularization strength
- $\pi_{ref}$ = reference policy
    

즉, 구조는 PPO와 거의 동일하지만

> **Value function $V(s)$가 완전히 제거되었다**

는 것이 핵심 차이점이다.

---

## 4. PPO vs GRPO 차이 정리

| 항목               | PPO        | GRPO                  |
| ---------------- | ---------- | --------------------- |
| Value Network 필요 | O          | X                     |
| Advantage 계산     | $R - V(s)$ | Group Relative Reward |
| 안정성              | 중간         | 높음                    |
| 계산 비용            | 큼          | 작음                    |
| 구현 난이도           | 높음         | 비교적 간단                |
| LLM에 적합도         | 보통         | 매우 높음                 |

GRPO는 특히 **LLM + RLHF**에서 매우 강력하다.

- Value network 불필요
- Reward 모델만 있으면 됨
- 학습 안정성 증가

그래서 Large Language Model 튜닝에 매우 적합하다.

---

## 5. 왜 LLM에서 특히 잘 작동할까?

LLM에서는 state value를 정의하기 어렵다.

- 상태 공간이 너무 큼
- 문맥이 길고 추상적
- Reward도 매우 noisy함

하지만 GRPO는 이런 문제를 회피한다.

> “절대값 추정 말고, **같은 프롬프트에서 나온 답들끼리만 비교**하면 된다.”

그래서:

- 긴 chain-of-thought
- 복잡한 reasoning
- 자연어 응답

이 모두에 적합하다.

---

## 6. 예시로 이해하기

예를 들어 프롬프트가 다음과 같다고 하자.

> “Explain why the sky is blue.”

모델이 다음과 같이 4개의 답변을 생성했다.

|답변|Reward|
|---|---|
|A|0.2|
|B|0.5|
|C|0.9|
|D|0.4|

평균 reward는

$$  
\bar{r} = \frac{0.2+0.5+0.9+0.4}{4} = 0.5  
$$

각 답변의 advantage는

$$  
A_A = -0.3,\quad A_B = 0,\quad A_C = +0.4,\quad A_D = -0.1  
$$

즉

- C는 확률을 증가시킴
- A, D는 확률을 감소시킴
- B는 유지
    

이렇게 **상대적인 비교만으로 학습 방향이 정해진다.**

---

## 7. 의사코드 (Pseudo-code)

```python
for each prompt x:
    samples = [sample(policy, x) for _ in range(G)]
    rewards = [reward_model(x, y) for y in samples]

    baseline = mean(rewards)
    advantages = [r - baseline for r in rewards]

    for y, A in zip(samples, advantages):
        ratio = pi_new(y|x) / pi_old(y|x)
        loss += - min(ratio * A, clip(ratio) * A)
```

여기에도 Value network는 없다.

---

## 8. 요약

- GRPO는 PPO의 변형으로 **Value network 없이 학습하는 방법**
- 여러 샘플 간의 **상대적인 reward**를 advantage로 사용
- KL penalty와 clipped objective는 PPO와 동일
- LLM + RLHF에서 효율적이고 안정적
- 구현과 계산이 단순함
    

> GRPO의 핵심:  
> **Absolute value가 아니라, Relative ranking만 필요하다**

---

## 9. 더 찾아보면 좋은 개념들

- [[01_RL/04_PPO|04_PPO]]
- Advantage Actor-Critic (A2C/A3C)
- KL Regularization
- Reward Model
- [[01_RL/04_RLHF]]
- [[01_RL/04_DPO|04_DPO]]
- Self-Play Reinforcement Learning
- Monte Carlo Advantage Estimation
- Chain-of-Thought in RLHF