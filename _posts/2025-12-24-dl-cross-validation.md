---
layout: single
title: "Cross-Validation: 모델의 진짜 성능을 검증하는 법"
date: 2025-12-24 16:20:00 +0900
categories: DeepLearning
tags: [Machine Learning, Validation, K-Fold]
---

데이터가 적을 때, 단순히 Train/Test로만 나누면 **"운 좋게 쉬운 데이터만 Test 셋에 들어갈"** 위험이 있다.

---

## K-Fold Cross-Validation

1. 데이터를 $K$개의 조각(Fold)으로 나눈다.
2. $K$번 반복하며, 매번 다른 조각을 검증(Validation)용으로 쓰고 나머지를 학습용으로 쓴다.
3. $K$번의 결과를 평균 낸다.

이 방식은 모든 데이터가 한 번씩은 검증에 사용되므로, **모델의 일반화 성능을 훨씬 안정적으로 추정**할 수 있다.
(단, 딥러닝에서는 학습 시간이 오래 걸려 자주 쓰이지는 않는다.)
