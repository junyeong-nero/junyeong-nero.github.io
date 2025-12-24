---
tags:
  - RL
date created: Friday, November 21st 2025, 3:46:12 pm
date modified: Friday, November 21st 2025, 4:31:39 pm
---
## 1. PPO는 무엇인가?

**PPO(Proximal Policy Optimization)** 는 **Policy Gradient 계열의 강화학습 알고리즘**이다.  
핵심 목적은 다음과 같다:

> 기존 정책(policy)에서 너무 멀어지지 않으면서도  
> 보상(reward)을 최대화하는 방향으로 안정적으로 업데이트하기

PPO는 특히

- 구현이 비교적 간단하고
    
- 안정적이며
    
- 많은 RL benchmark에서 성능이 뛰어나
    

실제 연구와 산업에서 가장 널리 사용되는 알고리즘 중 하나이다.

---

## 2. 강화학습 기본 개념 복습

먼저 최소한의 RL 개념을 정리하자.

- **State ($s$)**: 현재 환경의 상태
    
- **Action ($a$)**: agent가 선택하는 행동
    
- **Reward ($r$)**: 행동에 대한 보상
    
- **Policy ($\pi_\theta(a|s)$)**: 상태에서 행동을 선택할 확률 분포
    
- **Return ($G_t$)**: 시점 $t$부터 얻는 누적 보상
    
- **Advantage ($A_t$)**: "이 행동이 평균보다 얼마나 좋았는가"
    

Policy Gradient의 목표는 다음을 최대화하는 것이다:

$$  
J(\theta) = \mathbb{E}[\log \pi_\theta(a|s) \cdot A_t]  
$$

하지만 이 방식은 문제가 있다.

> policy가 한 번에 너무 크게 변경되면 학습이 불안정해진다.

이 문제를 해결하기 위해 나온 방법 중 하나가 PPO이다.

---

## 3. PPO의 핵심 아이디어: Policy를 너무 크게 바꾸지 말자

PPO는 **"기존 정책과 크게 벗어나지 않는 선에서만 업데이트"** 하도록 만든다.

이를 위해 중요하게 사용하는 항이 **ratio** 이다:

$$  
r(\theta) = \frac{\pi_\theta(a|s)}{\pi_{\theta_{old}}(a|s)}  
$$

- $r(\theta) > 1$ → 새 policy가 그 행동을 더 선호
    
- $r(\theta) < 1$ → 덜 선호
    

이 ratio에 **clipping을 적용**해 policy 업데이트 폭을 제한한다.

### PPO의 목적 함수

$$  
L^{CLIP}(\theta) = \mathbb{E}  
\Big[  
\min(  
r(\theta) A_t,  
\text{clip}(r(\theta), 1-\epsilon, 1+\epsilon) A_t  
)  
\Big]  
$$

여기서

- $\epsilon$ : 보통 0.1 ~ 0.3 사이
    
- `clip( , 1-ε, 1+ε)` : ratio가 이 범위를 넘어가면 강제로 잘라냄
    
- `min()` : 더 보수적인(작은) 업데이트만 허용
    

즉, PPO는

> "보상이 좋아도, 너무 급하게 바뀌지는 마라"

라는 안전장치를 둔 알고리즘이다.

---

## 4. 직관적으로 이해해보기

PPO를 일상 비유로 설명하면 이렇다:

> 운전 습관을 고칠 때  
> 오늘 잘 됐다고 핸들을 **한 번에 90도** 꺾는 건 위험  
> → **조금씩 방향을 조정하는 게 안전**

- 기존 policy = 지금의 운전 습관
    
- 새 policy = 개선된 운전 습관
    
- clipping = 급격한 변경 방지 장치
    

PPO는 이 "조금씩 고치는 방법"을 수학적으로 디자인한 방식이다.

---

## 5. 간단한 예시로 이해하기

### 상황

게임에서 캐릭터가 두 개의 행동을 선택 가능:

- action 0: 왼쪽
    
- action 1: 오른쪽
    

현재 상태에서 Old policy는

$$  
\pi_{old}(1|s) = 0.2  
$$

업데이트된 new policy는

$$  
\pi_{new}(1|s) = 0.5  
$$

그러면 ratio는:

$$  
r = \frac{0.5}{0.2} = 2.5  
$$

하지만 $\epsilon = 0.2$라면 허용 범위는:

$$  
[0.8, 1.2]  
$$

즉 PPO는:

$$  
clip(2.5, 0.8, 1.2) = 1.2  
$$

를 사용한다.

결국 얼마나 보상이 컸던 간에, "좋은 행동이라도 적당히만 강화하자"는 뜻이다.

→ 이것이 PPO가 **안정적**인 이유

---

## 6. PPO 알고리즘의 전체 흐름

1. 현재 policy로 여러 episode rollout 수행
    
2. (s, a, r, s’) 저장
    
3. Advantage $A_t$ 계산 (보통 [[01_RL/05_Generalized_Advantage_Estimation|GAE]] 사용)
    
4. 위의 clip objective로 policy 업데이트
    
5. 여러 epoch 반복
    

정리하면:

```
for iteration:
    collect trajectories
    compute advantage
    for epoch:
        update policy with PPO loss
```

---

## 7. PPO가 자주 사용되는 이유

| 이유    | 설명                        |
| ----- | ------------------------- |
| 안정성   | 급격한 업데이트 방지               |
| 구현 쉬움 | TRPO보다 간단                 |
| 성능    | 대부분의 환경에서 강력함             |
| 범용성   | continuous/discrete 모두 가능 |

그래서 OpenAI, DeepMind, Meta 등에서 기본 RL 알고리즘처럼 사용된다.

---

## 8. 함께 알면 좋은 관련 개념들

- TRPO
- Advantage Function & GAE
- Actor-Critic