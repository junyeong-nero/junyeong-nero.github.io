---
layout: single
title: "Policy Gradient: 행동 확률을 직접 최적화하기"
date: 2025-12-24 10:30:00 +0900
categories: RL
tags: [Reinforcement Learning, Policy Gradient]
---

강화학습에서 가장 직관적인 접근 중 하나가 **Policy Gradient**다. 어떤 행동을 할지 직접 결정하는 함수를 미분 가능한 형태로 만들고, 그 함수를 점점 더 좋은 방향으로 업데이트하는 방식이다.

---

## 1. Policy란 무엇인가?

Policy는 상태 $s$가 주어졌을 때 행동 $a$를 선택하는 규칙이다.  
$$ \pi(a \mid s) $$
➡️ 상태 $s$에서 행동 $a$를 선택할 확률

---

## 2. 목표: 기대 보상(expected return) 최대화

Policy Gradient의 목표는 다음을 최대화하는 것이다:
$$ J(\theta) = \mathbb{E}_{\tau \sim \pi_\theta} [R(\tau)] $$

Policy Gradient는 아래 값을 계산해서 gradient ascent 수행한다:
$$ \nabla_\theta J(\theta) $$

---

## 3. 핵심 수식: Policy Gradient Theorem

Policy Gradient method의 실제 업데이트 식은 다음과 같다.
$$ \nabla_\theta J(\theta) = \mathbb{E}_{\pi_\theta} \left[ \sum_{t=0}^{T} \nabla_\theta \log \pi_\theta(a_t \mid s_t) \cdot G_t \right] $$

✅ 이 의미는:
> “좋은 결과를 가져온 행동들은 선택될 확률을 더 높이자”

---

## 4. 대표적인 Algorithm: REINFORCE

가장 기본적인 Policy Gradient 알고리즘:
1. Policy $\pi_\theta$ 따라 Episode 실행
2. $G_t$ 계산
3. 업데이트: $\theta \leftarrow \theta + \alpha \nabla_\theta \log \pi_\theta(a_t \mid s_t) G_t$

하지만 이 방법은 **Variance가 매우 크다**는 단점이 있다. 이를 개선한 것이 **A2C, PPO** 등이다.
