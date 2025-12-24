---
layout: single
title: "Toolformer: 스스로 도구 사용법을 배우는 LLM"
date: 2025-12-24 17:20:00 +0900
categories: LLM
tags: [LLM, Toolformer, Self-supervised Learning]
---

## 1. 핵심 질문
기존에는 사람이 프롬프트로 "이럴 땐 이 도구를 써"라고 가르쳤다 (In-context Learning).
**Toolformer**는 묻는다.
> "모델이 스스로 도구 사용법을 깨우칠 순 없을까?"

---

## 2. 학습 방법 (Self-supervised)
1.  텍스트 중간중간에 무작위로 도구 호출(`[CALL] calc(...)`)을 넣어본다.
2.  도구를 썼을 때, 원래 텍스트를 예측하는 **손실(Loss)이 줄어들면** "이 도구 호출은 유용했다"고 판단한다.
3.  유용한 케이스만 모아서 모델을 다시 학습(Fine-tuning)시킨다.

결과적으로 모델은 **"계산이 필요한 순간"**이나 **"검색이 필요한 순간"**을 스스로 감지하고 도구를 호출하게 된다.
