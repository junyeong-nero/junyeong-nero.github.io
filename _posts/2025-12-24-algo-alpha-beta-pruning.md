---
layout: single
title: "Alpha-Beta Pruning: Minimax 최적화하기"
date: 2025-12-24 15:00:00 +0900
categories: Algorithms
tags: [Algorithm, Game AI, Alpha-Beta Pruning]
---

# Alpha-Beta Pruning 완전 정리

Minimax 알고리즘은 $O(b^d)$라는 지수적인 시간 복잡도를 가진다. 이를 해결하기 위해 **"결과에 영향을 주지 않는 가지(branch)는 잘라내는(pruning)"** 기법이 바로 Alpha-Beta Pruning이다.

---

## 1. 핵심 원리

두 개의 값을 유지하며 탐색한다.

- **$\alpha$**: MAX 플레이어가 현재까지 찾은 **최소한의 이득** (하한선)
- **$\beta$**: MIN 플레이어가 현재까지 찾은 **최대 허용치** (상한선)

탐색 도중 **$\alpha \ge \beta$** 조건이 만족되면, 해당 경로는 더 이상 볼 필요가 없으므로 **Pruning(가지치기)** 한다.

> "이미 더 좋은 수가 확보되었는데, 굳이 상대가 나를 망칠 수 있는 뻔한 길을 더 들여다볼 필요는 없다."

## 2. 효과

이상적인 경우(Best Case) 시간 복잡도를 $O(b^{d/2})$까지 줄일 수 있다. 이는 같은 시간에 **두 배 더 깊게** 탐색할 수 있음을 의미하며, 체스 AI 등에서 필수적인 기법이다.
