---
tags:
  - RL
date created: Friday, November 21st 2025, 4:38:49 pm
date modified: Friday, November 21st 2025, 4:39:25 pm
---
# Generalized Advantage Estimation (GAE) 쉽게 이해하기

Policy Gradient 기반 알고리즘들(PPO, A2C, A3C 등)을 공부하다 보면 항상 등장하는 개념이 있다. 바로 **Advantage function**이고, 그중에서도 가장 중요한 테크닉 중 하나가 **Generalized Advantage Estimation (GAE)**이다.

GAE는 한마디로 말하면:

> **Advantage 추정을 더 안정적이고 부드럽게 만들어주는 기법**

이다.

이 글에서는

1. Advantage가 왜 필요한지
2. GAE가 어떤 문제를 해결하는지
3. 수식적으로 어떻게 정의되는지
4. 실제 예시에서는 어떻게 작동하는지  
    를 순서대로 설명한다.
    

---

## 1. Advantage function 이란?

RL에서 policy gradient의 목표는 다음을 maximize 하는 것이다.

$$  
J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} \left[ \sum_t r_t \right]  
$$

이를 gradient로 바꾸면 다음 형태가 된다.

$$  
\nabla_\theta J(\theta) = \mathbb{E}_t \left[ \nabla_\theta \log \pi_\theta(a_t | s_t) \cdot A(s_t, a_t) \right]  
$$

여기서 등장하는 것이 **Advantage function**이다.

$$  
A(s_t, a_t) = Q(s_t, a_t) - V(s_t)  
$$

의미는:

- $Q(s_t, a_t)$ : 이 state에서 이 action을 했을 때 얼마나 좋은지
- $V(s_t)$ : 이 state에서 평균적으로 얼마나 좋은지
- 즉, **지금 내가 한 action이 평균보다 얼마나 더 좋았는가?**
    

이 값이 클수록, 해당 행동을 더 강화하고  
작을수록(음수일수록), 해당 행동을 덜 하도록 학습한다.

문제는…

> **Q와 V를 정확하게 추정하는 것이 매우 어렵다**

그래서 Advantage를 어떻게 추정하느냐가 중요해지고, 여기서 GAE가 등장한다.

---

## 2. TD error와 Advantage의 관계

Advantage를 바로 계산하기 어려우므로 **TD error (Temporal Difference error)**를 활용한다.

TD error는 다음과 같다.

$$  
\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)  
$$

이 값은

- 예측값(V)과
    
- 실제 관측한 결과(r + next V)  
    의 차이이다.
    

그리고 Advantage는 다음처럼 여러 step의 TD error를 더해서 계산할 수 있다.

1-step Advantage:  
$$  
A_t^{(1)} = \delta_t  
$$

2-step Advantage:  
$$  
A_t^{(2)} = \delta_t + \gamma \delta_{t+1}  
$$

n-step Advantage:  
$$  
A_t^{(n)} = \sum_{l=0}^{n-1} \gamma^l \delta_{t+l}  
$$

문제는 여기서 **trade-off**가 발생한다.

|방법|특징|
|---|---|
|1-step|variance 낮음, bias 큼|
|n-step|variance 큼, bias 작음|
|Monte-Carlo|bias 가장 작지만, variance 매우 큼|

GAE는 이 모든 n-step advantage를 **지수 가중 평균**으로 섞은 것이다.

---

## 3. Generalized Advantage Estimation 수식

GAE는 다음과 같이 정의된다.

$$  
A_t^{GAE(\gamma, \lambda)} = \sum_{l=0}^{\infty} (\gamma \lambda)^l \delta_{t+l}  
$$

각 항:

- $\gamma$ : discount factor
    
- $\lambda$ : bias-variance tradeoff 조절 파라미터
    
- $\delta_{t+l}$ : t+l 시점의 TD error
    

즉,

- $\lambda → 0$ 이면 → 거의 1-step TD
    
- $\lambda → 1$ 이면 → 거의 Monte-Carlo
    

직관적으로:

> **멀리 있는 미래의 TD error일수록 더 작게 반영하는 방식**

그래서 GAE는

✅ variance 감소  
✅ 학습 안정성 증가  
✅ PPO, A2C, TRPO 등에서 거의 표준

이라는 장점이 있다.

---

## 4. 실제 예시로 이해하기

가상의 trajectory가 있다고 하자.

| $t$ | $r_t$ | $V(s_t)$       |
| --- | ----- | -------------- |
| 0   | 1     | 0.5            |
| 1   | 2     | 1.0            |
| 2   | 0     | 1.2            |
| 3   | 3     | 0.0 (terminal) |

γ = 0.9, λ = 0.95라고 할 때,

먼저 TD error를 계산해보면

$$  
\delta_0 = 1 + 0.9 \cdot 1.0 - 0.5 = 1.4  
$$

$$  
\delta_1 = 2 + 0.9 \cdot 1.2 - 1.0 = 2.08  
$$

$$  
\delta_2 = 0 + 0.9 \cdot 0.0 - 1.2 = -1.2  
$$

GAE는 다음처럼 계산된다.

$$  
A_0 = \delta_0 + (0.9 \cdot 0.95)\delta_1 + (0.9 \cdot 0.95)^2 \delta_2  
$$

$$  
A_0 = 1.4 + 0.855 \cdot 2.08 + 0.731 \cdot (-1.2)  
$$

미래의 정보는 점점 작은 가중치로 합쳐진다.

그래서 하나의 step에서 보상을 판단하는 것이 아니라,

> **미래까지 고려한 "부드러운 Advantage"를 만들게 된다.**

이 값이 바로 PPO에서 policy update에 들어간다.

---

## 5. 왜 [[01_RL/04_PPO|PPO]]에서 GAE가 필수가 되었을까?

PPO의 objective는:

$$  
L^{CLIP}(\theta) = \mathbb{E}_t  
\left[  
\min  
\left(  
r_t(\theta) A_t,  
\text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) A_t  
\right)  
\right]  
$$

여기서 $A_t$가 noisy하면

- update가 불안정
    
- loss 변동이 큼
    
- 학습이 probabilistically 망가짐
    

그래서

> **PPO + GAE는 거의 기본 세트처럼 사용된다**

라고 보면 된다.

---

## ✅ 핵심 요약

- Advantage = action의 상대적 가치
    
- 정확한 Advantage 계산은 어려움
    
- GAE는 여러 step의 TD error를 $\gamma \lambda$로 가중 평균한 방식
    
- bias-variance trade-off를 부드럽게 조절 가능
    
- PPO, A2C 등의 안정성 핵심 요소
    

한 문장 요약:

> **GAE는 미래의 정보를 점점 약하게 반영해서 더 안정적인 Advantage를 만들어주는 방법이다.**

---

## 📚 함께 보면 좋은 내용들

- TD(0), TD(λ)
- n-step return
- Bias-Variance tradeoff
- [[01_RL/04_Action_Critic|04_Action_Critic]]
- [[01_RL/04_PPO|04_PPO]] / TRPO / A2C
- Monte-Carlo vs Bootstrapping
- Reward shaping