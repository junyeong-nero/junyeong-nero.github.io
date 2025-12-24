---
layout: single
title: "Actor-Critic: Policy와 Value를 함께 학습하기"
date: 2025-12-24 13:00:00 +0900
categories: RL
tags: [Reinforcement Learning, Actor-Critic, Policy Gradient]
---

강화학습에서 가장 큰 고민 중 하나는 **“어떻게 더 안정적이고 효율적으로 policy를 학습할 수 있을까?”**이다.  
Actor-Critic은 이 질문에 대한 하나의 강력한 해답이며, **policy-based methods**와 **value-based methods**를 결합한 구조다.

---

## 1. 기본 아이디어

Actor-Critic은 두 개의 네트워크로 구성된다.

- **Actor**: 어떤 행동을 할지 결정하는 `policy` ($\pi_\theta(a \mid s)$)
- **Critic**: 현재 상태 혹은 상태-행동 쌍의 가치를 평가하는 `value function` ($V^\pi(s)$ 또는 $Q^\pi(s, a)$)

> Actor는 “어떤 행동을 할지” 결정하고,  
> Critic은 “그 행동이 얼마나 좋은지” 평가한다.

---

## 2. Critic을 사용한 업데이트 (Advantage)

Critic은 $V(s)$를 근사하며, 이를 이용해 **Advantage**를 계산한다.
$$ A(s_t, a_t) \approx r_t + \gamma V(s_{t+1}) - V(s_t) $$
이는 **TD error** $\delta_t$와 같다.

Actor는 이 TD error를 이용하여 업데이트된다.
$$ \nabla_\theta J(\theta) = \mathbb{E} \big[ \nabla_\theta \log \pi_\theta(a_t \mid s_t) \cdot \delta_t \big] $$

---

## 3. 두 네트워크의 학습 방식

1.  **Critic Update**: MSE loss 최소화 ($L = (Target - V(s))^2$)
2.  **Actor Update**: Policy Gradient 방향으로 업데이트

---

## 4. 왜 Actor-Critic이 중요한가?

이 구조는 **A2C, A3C, PPO, DDPG, SAC** 등 현대 RL 알고리즘의 핵심 뼈대가 된다. Policy Gradient의 높은 분산(Variance) 문제를 Critic을 도입함으로써 완화시킨다.
