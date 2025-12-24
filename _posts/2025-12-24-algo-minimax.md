---
layout: single
title: "Minimax Algorithm: 게임 AI의 기초"
date: 2025-12-24 11:00:00 +0900
categories: Algorithms
tags: [Game AI, Minimax]
---

Minimax algorithm은 **두 명의 플레이어가 번갈아가며 완벽하게 플레이한다는 가정 하에서, 최적의 수를 선택하는 탐색 알고리즘**이다. 주로 Tic-tac-toe, Chess 같은 zero-sum 게임에서 사용된다.

> 상대가 항상 나에게 최악의 수를 두려고 할 때, 그 상황에서도 가장 나은 선택을 고르는 전략

---

## 1. 게임 트리 (Game Tree) 구조

플레이어는 두 종류로 나뉜다:
- **MAX**: 점수를 최대화하려는 플레이어 (AI 또는 나 자신)
- **MIN**: 점수를 최소화하려는 플레이어 (상대)

$$ MAX \rightarrow MIN \rightarrow MAX \rightarrow MIN \rightarrow \dots $$

---

## 2. Minimax의 수식 정의

$$ 
 V(s) = \begin{cases}  
Utility(s) & \text{if } s \text{ is terminal state} \\
\max_{a \in Actions(s)} V(Result(s,a)) & \text{if } Player(s) = MAX \\
\min_{a \in Actions(s)} V(Result(s,a)) & \text{if } Player(s) = MIN  
\end{cases}  
$$ 

---

## 3. 계산 복잡도와 한계

Minimax의 시간 복잡도는 $O(b^d)$이다 ($b$: branching factor, $d$: depth). 체스나 바둑처럼 경우의 수가 많은 게임에서는 현실적으로 계산이 불가능하므로, 이를 해결하기 위해 **α-β Pruning**이 사용된다.
