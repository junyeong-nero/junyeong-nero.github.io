---
layout: single
title: "On-policy vs Off-policy: 강화학습의 두 갈래"
date: 2025-12-24 13:50:00 +0900
categories: RL
tags: [RL, On-policy, Off-policy]
---

## 1. 정의

> **학습하는 Policy와 행동하는 Policy가 같은가?**

- **On-policy**: 내가 직접 겪은 경험으로만 나를 학습시킨다. (\pi_{behavior} = \pi_{target}$)
    - 예: PPO, A2C, SARSA
    - 장점: 안정적임.
    - 단점: 데이터를 한 번 쓰고 버려야 함 (Sample inefficient).

- **Off-policy**: 남(과거의 나, 혹은 다른 에이전트)의 경험을 가져와서 나를 학습시킨다. (\pi_{behavior} \neq \pi_{target}$)
    - 예: DQN, Q-Learning, SAC
    - 장점: Replay Buffer를 써서 데이터를 재활용 가능 (Sample efficient).
    - 단점: 학습이 불안정할 수 있음. Importance Sampling 등이 필요할 수 있음.

---

## 2. 직관적 비유

- **On-policy**: 직접 운전해보면서 배우는 것.
- **Off-policy**: 남이 운전하는 영상을 보면서(혹은 내가 어제 운전한 기억을 되살려서) 배우는 것.
