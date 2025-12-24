---
layout: single
title: "Focal Loss: 데이터 불균형을 해결하는 우아한 방법"
date: 2025-12-24 16:40:00 +0900
categories: DeepLearning
tags: [Deep Learning, Object Detection, Loss Function]
---

## 1. 문제: Easy Negative
Object Detection(예: YOLO, RetinaNet)에서는 배경(Background)이 객체보다 압도적으로 많다. 모델 입장에서 배경은 맞추기 너무 쉬운 문제(Easy Negative)인데, 이들의 수가 너무 많아 **총 Loss를 지배해버리는 문제**가 생긴다. 정작 중요한 "어려운 객체" 학습이 묻힌다.

---

## 2. 해결: Focal Loss
$$ FL(p_t) = -(1 - p_t)^\gamma \log(p_t) $$

기존 Cross Entropy 앞에 **$(1-p_t)^\gamma$** 라는 가중치를 붙였다.
- 모델이 잘 맞추는 샘플($p_t \approx 1$) $\rightarrow$ 가중치가 0에 수렴 $\rightarrow$ **Loss 무시**
- 모델이 헷갈리는 샘플($p_t$ 낮음) $\rightarrow$ 가중치 높음 $\rightarrow$ **학습 집중**

즉, **"이미 아는 건 건너뛰고, 모르는 것에 집중하라"**는 전략이다.
