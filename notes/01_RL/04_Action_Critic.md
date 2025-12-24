---
tags:
  - RL
date created: Friday, November 21st 2025, 4:35:27 pm
date modified: Friday, November 21st 2025, 4:35:42 pm
---
강화학습(Reinforcement Learning, RL)에서 가장 큰 고민 중 하나는 **“어떻게 더 안정적이고 효율적으로 policy를 학습할 수 있을까?”**이다.  
Actor-Critic은 이 질문에 대한 하나의 강력한 해답이며, **policy-based methods**와 **value-based methods**를 결합한 구조다.

이 글에서는 Actor-Critic의 기본 개념부터 수식, 직관적인 해석, 그리고 예시까지 순서대로 정리한다.

---

## 1. 기본 아이디어

Actor-Critic은 두 개의 네트워크로 구성된다.

- **Actor**: 어떤 행동을 할지 결정하는 `policy`
    
    - $\pi_\theta(a \mid s)$
        
- **Critic**: 현재 상태 혹은 상태-행동 쌍의 가치를 평가하는 `value function`
    
    - $V^\pi(s)$ 또는 $Q^\pi(s, a)$
        

> Actor는 “어떤 행동을 할지” 결정하고,  
> Critic은 “그 행동이 얼마나 좋은지” 평가한다.

이 구조는 사람이 행동을 하고(Actor), 그 결과를 평가하고 피드백을 주는(Critic) 과정과 유사하다.

---

## 2. Policy Gradient의 문제점

Actor는 보통 **Policy Gradient**를 이용하여 학습한다. 기본 식은 아래와 같다.

$$  
\nabla_\theta J(\theta) = \mathbb{E} \big[ \nabla_\theta \log \pi_\theta(a \mid s) \cdot R \big]  
$$

이때 $R$은 return(누적 보상)이다.  
문제는 다음과 같다:

- $R$의 variance가 매우 큼
    
- 학습이 불안정해짐
    

이를 해결하기 위해 **baseline**을 사용한다. 여기서 등장하는 것이 바로 **Critic**이다.

---

## 3. Critic을 사용한 업데이트

Critic은 보통 상태가치함수 $V(s)$를 근사한다. 이를 이용해 **Advantage**를 정의한다.

$$  
A(s, a) = Q(s, a) - V(s)  
$$

실제로는 다음과 같이 근사한다.

$$  
A(s_t, a_t) \approx r_t + \gamma V(s_{t+1}) - V(s_t)  
$$

이는 **TD error**라고도 불린다:

$$  
\delta_t = r_t + \gamma V(s_{t+1}) - V(s_t)  
$$

Actor는 이 TD error를 이용하여 업데이트된다.

$$  
\nabla_\theta J(\theta)  
= \mathbb{E} \big[ \nabla_\theta \log \pi_\theta(a_t \mid s_t) \cdot \delta_t \big]  
$$

- Critic은 $V(s)$를 학습
- Actor는 Critic이 준 피드백을 기반으로 업데이트
    

---

## 4. 두 네트워크의 학습 방식

### (1) Critic Update

Critic은 MSE loss를 최소화한다.

$$  
L_{critic} = \big( r_t + \gamma V(s_{t+1}) - V(s_t) \big)^2  
$$

→ 회귀문제로 생각해도 좋다.

---

### (2) Actor Update

Actor는 policy gradient 방식으로 학습한다.

$$  
L_{actor} = - \log \pi_\theta(a_t \mid s_t) \cdot \delta_t  
$$

→ $\delta_t > 0$이면 해당 행동을 더 자주,  
→ $\delta_t < 0$이면 해당 행동을 덜 하도록 만든다.

---

## 5. 직관적으로 이해하기

Actor-Critic 구조를 비유로 보면 다음과 같다:

|역할|설명|
|---|---|
|Actor|“이 상황에서는 이 행동을 하자”라고 결정|
|Critic|“이 행동은 생각보다 괜찮았어 / 별로였어”라고 평가|
|업데이트|이 평가를 통해 Actor의 판단 기준이 점점 개선됨|

이 구조 덕분에:

- Policy의 variance 감소
- 학습 안정성 향상
- 더 빠른 수렴
    

이 가능해진다.

---

## 6. 간단한 예시 (Grid World)

보상이 다음과 같은 Grid World 환경을 가정하자:

- 목표 지점: +10
- 일반 이동: -1
    

### Step 1

상태: $s = (2,2)$  
Actor가 선택한 행동: `RIGHT`  
보상: $r = -1$

Critic이 예측한 값:

$$  
V(s) = 2.5,\quad V(s') = 3.0  
$$

TD error:

$$  
\delta = -1 + \gamma \cdot 3.0 - 2.5  
$$

$\gamma = 0.9$이면

$$  
\delta = -1 + 2.7 - 2.5 = -0.8  
$$

→ 이 행동은 “나쁜 선택”으로 판단됨  
→ `RIGHT`의 확률이 줄어들도록 Actor가 업데이트됨

반대로 $\delta > 0$이면 해당 행동의 확률이 증가한다.

---

## 7. 왜 Actor-Critic이 중요한가?

Actor-Critic 구조는 다음 알고리즘들의 기반이 된다:

- A2C / A3C
- [[01_RL/04_PPO|04_PPO]]
- DDPG
- SAC
- TD3
    

즉, **현대 RL의 핵심 뼈대 구조**라고 볼 수 있다.

---

## ✅ 요약

- Actor-Critic은 **policy(Actor)** 와 **value(Critic)** 를 함께 학습하는 구조이다.
- Critic은 TD error를 통해 Actor가 얼마나 잘했는지 평가한다.
- Actor는 이 평가를 통해 자신의 policy를 개선한다.
- Policy Gradient의 high variance 문제를 완화한다.
- 현대 강화학습 알고리즘 대부분의 핵심 구조이다.
    

---

## 🔎 더 찾아보면 좋은 관련 개념들

- REINFORCE (Monte Carlo Policy Gradient)
- Advantage Actor-Critic (A2C / A3C)
- PPO (Proximal Policy Optimization)
- DDPG (Deep Deterministic Policy Gradient)
- SAC (Soft Actor Critic)
- TD error
- w (GAE)
- On-policy vs Off-policy methods

원한다면 다음 글로 PPO나 A2C를 구체적으로 연결해서 설명해줄 수 있다.