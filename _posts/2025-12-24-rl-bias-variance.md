---
layout: single
title: "Bias-Variance Tradeoff: 머신러닝의 영원한 딜레마"
date: 2025-12-24 14:00:00 +0900
categories: RL
tags: [Machine Learning, RL, Theory]
---

## Bias-Variance Decomposition

모델의 에러는 수학적으로 다음과 같이 분해된다.

$$ \mathbb{E}[(y - \hat{f}(x))^2] = \text{Bias}^2 + \text{Variance} + \text{Noise} $$

- **Bias (편향)**: 모델이 너무 단순해서 데이터의 경향을 제대로 파악하지 못함. (Underfitting)
- **Variance (분산)**: 모델이 너무 복잡해서 데이터의 작은 노이즈까지 학습함. (Overfitting)

---

## Tradeoff

- 모델 복잡도 ⬆️ $\rightarrow$ Bias ⬇️, Variance ⬆️
- 모델 복잡도 ⬇️ $\rightarrow$ Bias ⬆️, Variance ⬇️

우리의 목표는 이 둘의 합(Total Error)이 최소가 되는 **적절한 균형점**을 찾는 것이다. RL에서도 GAE의 $\lambda$ 등을 통해 이 트레이드오프를 조절한다.
