---
tags:
  - RL
date created: Friday, November 21st 2025, 4:10:03 pm
date modified: Friday, November 21st 2025, 4:22:16 pm
---
강화학습(Reinforcement Learning, RL)에서 가장 직관적인 접근 중 하나가 **Policy Gradient**다.  
이 방법은 “어떤 행동을 할지 직접 결정하는 함수”를 **미분 가능한 형태로 만들고**,  
그 함수를 점점 더 좋은 방향으로 업데이트하는 방식이다.

---

## 1. Policy란 무엇인가?

Policy는 상태 $s$가 주어졌을 때 행동 $a$를 선택하는 규칙이다.  
수식으로 표현하면 다음과 같다.

$$  
\pi(a \mid s)  
$$

➡️ 상태 $s$에서 행동 $a$를 선택할 확률

여기서 중요한 점은:

- **Policy-based method**: $\pi_\theta(a \mid s)$ 를 직접 학습
- **Value-based method**: $Q(s, a)$ 혹은 $V(s)$ 를 학습 (Q-learning 등)
    
Policy Gradient는 말 그대로 **Policy를 미분해서 최적화**하는 방법이다.

---

## 2. 목표: 기대 보상(expected return) 최대화

Policy Gradient의 목표는 다음을 최대화하는 것이다:

$$  
J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} [R(\tau)]  
$$

- $\theta$ : policy model의 parameter
    
- $\tau$ : 하나의 episode trajectory = $(s_0, a_0, s_1, a_1, ..., s_T)$
    
- $R(\tau)$ : 전체 보상 누적값
    

즉, **이 Policy를 사용할 때 받을 평균 보상을 최대화하자**는 것이다.

Policy Gradient는 아래 값을 계산해서 gradient ascent 수행:

$$  
\nabla_\theta J(\theta)  
$$

---

## 3. 핵심 수식: Policy Gradient Theorem

Policy Gradient method의 실제 업데이트 식은 다음과 같다.

$$  
\nabla_\theta J(\theta)  
= \mathbb{E}_{\pi_\theta} \left[ \sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t \mid s_t) \cdot G_t \right]  
$$

여기서:

- $G_t$ = time $t$에서의 **Return (누적 보상)**
    
- $\log \pi_\theta(a_t|s_t)$ : log-likelihood
    
- $\nabla_\theta \log \pi_\theta(a_t|s_t)$ : policy가 해당 행동을 더 많이 선택하도록 만드는 방향
    

✅ 이 의미는:

> “좋은 결과를 가져온 행동들은 선택될 확률을 더 높이자”

강화학습적 강화 버전의 supervised learning이라고 볼 수 있다.

---

## 4. 왜 log를 쓰는가? (Intuition)

$\pi$ 자체를 미분하는 것이 아니라  
$\log \pi$ 를 미분하면 다음과 같은 이점이 있다:

$$  
\nabla_\theta \pi(a|s) = \pi(a|s) \nabla_\theta \log \pi(a|s)  
$$

그래서 계산이 안정적이고 효율적이다.

→ 이것을 **log-derivative trick**이라고 한다.

---

## 5. 대표적인 Algorithm: REINFORCE

가장 기본적인 Policy Gradient 알고리즘:

1. Policy $\pi_\theta$ 따라 Episode 실행
    
2. $G_t$ 계산
    
3. 다음 방식으로 업데이트:
    

$$  
\theta \leftarrow \theta + \alpha \nabla_\theta \log \pi_\theta(a_t \mid s_t) G_t  
$$

- $\alpha$는 learning rate
    
- 좋은 행동 → 확률 증가
    
- 나쁜 행동 → 확률 감소
    

하지만 이 방법에는 한 가지 문제가 있다…

❗ **Variance가 매우 크다**

이를 개선한 것이 → **A2C, PPO, DPO 등**이다.

---

## 6. 예시로 이해하기 (Game Scenario)

### 문제 상황

Flappy Bird와 유사한 환경을 가정하자:

- 상태 $s_t$: 새의 위치, 속도, 파이프 위치
    
- 행동 $a_t$: {점프, 가만히 있기}
    
- 보상: 살아있으면 +1, 죽으면 -100
    

처음에는 무작위로 행동하게 될 것이다.

하지만 Policy Gradient는 다음을 학습한다:

> “점프했을 때 더 오래 살아남았다면 → 점프 확률을 높이자”

신경망에서 나오는 확률:

$$  
\pi_\theta(\text{jump} | s) = 0.4 \rightarrow 0.7 \rightarrow 0.9  
$$

점점 더 정확한 타이밍에 점프하게 된다.

여기서 중요한 점:

- 정답이 없다 (supervised X)
    
- 오직 **보상 signal로만 업데이트**
    

이게 바로 RL의 본질이다.

---

## 7. Policy Gradient의 장점과 한계

✅ 장점

- Continuous action space 가능
    
- Stochastic policy 학습 가능
    
- 모델 구조가 유연함
    

❌ 단점

- Sample inefficiency
    
- High variance
    
- 수렴이 불안정
    

이 문제를 해결한 것이 → **PPO, TRPO, A2C, SAC 등**

---

## 8. 최소한의 PyTorch 구조 예시

```python
def compute_loss(log_probs, rewards):
    return -torch.sum(log_probs * rewards)

for episode in range(N):
    states, actions, rewards, log_probs = run_episode(policy)
    discounted_rewards = compute_returns(rewards)
    loss = compute_loss(log_probs, discounted_rewards)

    optimizer.zero_grad()
    loss.backward()
    optimizer.step()
```

이 구조가 대부분의 Policy Gradient 계열 알고리즘의 핵심 뼈대이다.

---

## 9. 정리

| 개념              | 설명                  |
| --------------- | ------------------- |
| Policy          | 행동을 결정하는 함수         |
| Policy Gradient | Policy를 직접 미분하여 학습  |
| 목적              | $J(\theta)$ 최대화     |
| 대표 알고리즘         | REINFORCE           |
| 문제              | 고분산, 불안정            |
| 해결책             | PPO, TRPO, A2C, DPO |

---

## 10. 같이 보면 좋은 개념들

다음 개념을 이어서 보면 RL 구조가 완성된다:

- **REINFORCE**
- **Baseline / Advantage function**
- **A2C / A3C**
- [[01_RL/04_PPO|04_PPO]] 
- [[01_RL/04_Action_Critic|04_Action_Critic]]
- **KL-Divergence constraint**
- **Entropy Regularization**
- [[01_RL/05_Generalized_Advantage_Estimation|05_Generalized_Advantage_Estimation]]


