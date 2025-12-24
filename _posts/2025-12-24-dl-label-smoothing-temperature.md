---
layout: single
title: "Label Smoothing & Temperature Scaling: 모델의 과잉 확신 막기"
date: 2025-12-24 16:50:00 +0900
categories: DeepLearning
tags: [Deep Learning, Calibration, Regularization]
---

딥러닝 모델은 종종 틀릴 때조차 99.9% 확신을 가진다(**Overconfidence**). 이는 의료나 자율주행 같은 분야에서 위험하다.

---

## 1. Label Smoothing
학습 단계에서의 해결책. 정답 라벨을 `[0, 1, 0]` 대신 `[0.05, 0.9, 0.05]` 처럼 **살짝 뭉개서(Smoothing)** 준다.
> "정답이 아닐 수도 있다는 가능성을 열어두라"고 가르치는 것.
결과적으로 모델의 결정 경계가 부드러워지고 일반화 성능이 좋아진다.

---

## 2. Temperature Scaling
학습 후 단계에서의 해결책. 모델의 출력 Logit을 $T$ (Temperature)라는 값으로 나눈 뒤 Softmax를 취한다.
$$ \hat{y} = \text{Softmax}(\mathbf{z} / T) $$
- $T > 1$: 분포가 부드러워짐 (확신도 감소)
- $T < 1$: 분포가 뾰족해짐 (확신도 증가)

Validation Set으로 최적의 $T$를 찾아 보정하면, 모델의 정확도는 유지하면서 **신뢰도(Confidence)**만 교정할 수 있다 (Calibration).
