---
layout: single
title: "On-policy Knowledge Distillation: 학생이 직접 푼 문제로 배운다"
date: 2025-12-24 14:20:00 +0900
categories: RL
tags: [Knowledge Distillation, RL, LLM]
---

**On-policy Knowledge Distillation**은 Student 모델이 **자신의 현재 정책으로 생성한 데이터**에 대해 Teacher 모델의 지식을 배우는 방식이다.

---

## 1. Off-policy vs On-policy KD

- **Off-policy KD**: 고정된 데이터셋(Teacher가 만든 데이터 등)으로 학습.
    - 문제점: Student가 실제로 마주할 상황과 학습 데이터 간의 괴리(Distribution Shift) 발생.
- **On-policy KD**: Student가 직접 생성($x \sim \pi_S$)하고, 그 결과에 대해 Teacher가 피드백을 줌.
    - 장점: Student가 실제로 헷갈려하는 부분, Student가 도달하는 상태 공간에서 직접적인 교정이 일어남.

## 2. 효과

이 방식은 **Imitation Learning (DAgger 등)**이나 **RLHF**와 유사한 구조를 가지며, 특히 Reasoning이나 Agent Task처럼 긴 호흡의 문제에서 에러가 누적되는 것을 막는 데 매우 효과적이다.
