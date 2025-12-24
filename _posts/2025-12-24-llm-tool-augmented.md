---
layout: single
title: "Tool-Augmented LLM: 도구를 손에 쥔 언어 모델"
date: 2025-12-24 17:10:00 +0900
categories: LLM
tags: [LLM, Tool Use, Function Calling]
---

## 1. 개념
LLM에게 계산기, 검색엔진, 파이썬 인터프리터 같은 **도구(Tool)**를 쥐여주는 것이다.
모델은 직접 답을 생성하는 대신, **"어떤 함수를 어떤 인자로 호출할지"**를 결정한다 (Function Calling).

---

## 2. 수식적 관점
기존 LLM의 출력 공간이 텍스트 토큰($\mathcal{V}$)이었다면, 이제는 도구 호출($\mathcal{F}$)까지 포함된 공간($\mathcal{V} \cup \mathcal{F}$)으로 확장된다.

$$ P(y \mid x, o_1, o_2, \dots) $$

도구의 실행 결과($o_i$, Observation)가 컨텍스트에 추가될수록, 모델의 불확실성(Entropy)은 줄어들고 정답에 가까워진다. 이는 **AutoGPT**나 **ChatGPT Plugin**의 핵심 원리다.
