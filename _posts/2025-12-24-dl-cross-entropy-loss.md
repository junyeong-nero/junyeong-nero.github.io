---
layout: single
title: "Cross Entropy Loss: 왜 분류 문제엔 MSE가 아닌가?"
date: 2025-12-24 16:30:00 +0900
categories: DeepLearning
tags: [Deep Learning, Loss Function, Cross Entropy]
---

## 1. 핵심 이유

분류 문제에서 MSE(평균제곱오차)를 쓰면 **Gradient Vanishing** 문제가 발생하고, 손실 함수가 **Non-convex**해져 최적화가 어렵다.

반면 **Cross Entropy**는:
1.  **정보 이론적 관점**: 실제 분포 $P$와 예측 분포 $Q$ 사이의 괴리(**KL Divergence**)를 최소화한다.
2.  **최적화 관점**: Softmax와 결합되면 로그($\log$)가 지수($e^x$)를 상쇄시켜, 그래디언트가 선형적으로 깔끔하게 떨어진다.

$$ L = -\sum y_i \log(\hat{y}_i) $$

즉, "정답인 클래스의 확률을 최대한 높이는 것"이 곧 Loss를 줄이는 것이다.
