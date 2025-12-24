---
layout: single
title: "Early Stopping: 가장 간단하고 강력한 정규화 기법"
date: 2025-12-24 16:00:00 +0900
categories: DeepLearning
tags: [Deep Learning, Regularization, Early Stopping]
---

## 1. 개념

학습을 끝까지 진행하지 않고, **Validation Loss가 더 이상 개선되지 않을 때 멈추는 것**이다.

> "과적합(Overfitting)되기 직전에 내리는 것이 가장 좋다."

---

## 2. 왜 작동하는가?

학습이 진행될수록:
- **Train Loss**: 계속 감소 (모델이 데이터를 외움)
- **Validation Loss**: 감소하다가 어느 순간 증가 (일반화 성능 저하)

Early Stopping은 이 **변곡점(Variance가 커지기 시작하는 시점)**을 찾아 멈춤으로써, 모델이 노이즈까지 학습하는 것을 방지한다. 이는 $L2$ Regularization과 유사한 효과를 가진다.

---

## 3. 실전 팁

- **Patience**: Loss가 잠깐 튈 수 있으므로, 바로 멈추지 않고 $K$번 정도 기다려본다.
- **Model Checkpoint**: 가장 성능이 좋았던 시점의 가중치를 저장해두고, 종료 후 복원한다.
