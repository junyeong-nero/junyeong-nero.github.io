---
layout: single
title: "Regularization (L1, L2, Weight Decay) 완벽 정리"
date: 2025-12-24 16:10:00 +0900
categories: DeepLearning
tags: [Deep Learning, Regularization, L1, L2]
---

모델이 너무 복잡해지는 것을 막기 위해 Loss Function에 패널티 항을 추가하는 기법이다.

$$ \mathcal{L}_{total} = \mathcal{L}_{data} + \lambda \cdot \Omega(\theta) $$

---

## 1. L2 Regularization (Ridge)

$$ \Omega(\theta) = \sum w_i^2 $$
- 가중치들을 **0에 가깝게** 만들지만 0으로 만들지는 않는다.
- 모든 특성을 골고루 반영하게 하여 **일반화 성능**을 높인다.
- **Weight Decay**와 수학적으로 거의 동일하다 (SGD 기준).

## 2. L1 Regularization (Lasso)

$$ \Omega(\theta) = \sum |w_i| $$
- 중요하지 않은 가중치를 **정확히 0**으로 만든다.
- **Feature Selection** (변수 선택) 효과가 있어 모델이 희소(Sparse)해진다.

## 3. 요약

> "L2는 튀는 놈을 깎고, L1은 쓸모없는 놈을 없앤다."

