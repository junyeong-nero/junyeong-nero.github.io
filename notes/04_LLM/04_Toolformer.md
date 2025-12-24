# Toolformer: 언어 모델이 스스로 도구 사용을 “학습”하게 만드는 방법

## 1. 서론 — 왜 Toolformer가 등장했는가?

Large Language Model(LLM)은 강력한 패턴 인식기이자 시퀀스 생성기이지만, 구조적으로 다음과 같은 한계를 갖는다.

$$  
P(y \mid x; \theta) = \prod_{t=1}^{T} P(y_t \mid y_{<t}, x; \theta)  
$$

- $x$ : 입력 시퀀스
- $y$ : 출력 시퀀스
- $\theta$ : 모델 파라미터
    

이 구조는 **언어적 패턴 학습에는 최적화**되어 있지만, 외부 세계와의 상호작용은 없다.

그러나 현실 세계의 문제들은 다음을 요구한다.

- 정확한 계산 (calculator)
- 실시간 정보 검색 (search)
- 데이터베이스 질의 (DB query)
- 코드 실행 (code interpreter)
    

기존 접근법(예: ReAct, Tool-Augmented LLM)은 보통 **사람이 프롬프트로 도구 사용을 “가르치는” 방식**이었다.

반면 **Toolformer**의 핵심 질문은 다음이다.

> “모델 스스로, 언제 어떤 도구를 써야 하는지 학습할 수는 없을까?”

즉, Toolformer는  
**LLM이 추가적인 supervised signal 없이도 도구 사용법을 self-supervised하게 학습하도록 만드는 프레임워크**다.

이 점에서 Toolformer는 **Prompt Engineering이 아니라, Model Training 관점의 접근**이다.

---

## 2. Toolformer의 핵심 아이디어 — Self-supervised Tool Usage LearningA

### 2.1 기본 개념: 모델 + 도구의 결합

Toolformer는 다음과 같이 **도구를 하나의 함수 집합**으로 본다.

$$  
\mathcal{F} = { f_1, f_2, \dots, f_K }  
$$

여기서 각 $f_k$는 다음을 만족한다.

$$  
o = f_k(a)  
$$

- $a$ : 입력 인자 (argument)
- $o$ : 출력 값 (observation)
    

예시:

- $f_{\text{calc}}(a)$ → 계산 결과
- $f_{\text{search}}(q)$ → 검색 결과
- $f_{\text{calendar}}(d)$ → 일정 정보
    

문제는 다음이다.

> 어떤 문맥에서 어떤 $f_k$를 호출해야 이득인가?

그리고 Toolformer는 이 문제를 **likelihood 기반 filtering 문제**로 변환한다.

---

## 3. 수식으로 보는 Toolformer의 학습 방식

### 3.1 Candidate Tool Call 삽입

초기에는 base LLM $\mathcal{M}$이 존재한다.  
이 모델에게 입력 시퀀스 $x$를 주면 다음을 생성한다.

$$  
y = (y_1, y_2, \dots, y_T)  
$$

Toolformer는 이 시퀀스의 중간 지점 $t$에서 tool call을 삽입한 candidate를 생성한다.

$$  
x' = (y_1, \dots, y_t, [\text{CALL } f_k(a)], y_{t+1}, \dots, y_T)  
$$

그 후 도구를 실행한다.

$$  
o_k = f_k(a)  
$$

그리고, 도구의 결과까지 포함된 시퀀스는 다음이 된다.

$$  
\tilde{x} = (y_1, \dots, y_t, [\text{CALL } f_k(a)], o_k, y_{t+1}, \dots, y_T)  
$$

---

### 3.2 핵심: Perplexity 감소 여부

Toolformer는 **이 tool call이 실제로 도움이 되었는지**를 다음으로 평가한다.

1. 원래 문장의 Loss

$$  
\mathcal{L}_{\text{orig}} = - \sum_{i=t+1}^{T} \log P(y_i \mid y_{<i})  
$$

2. Tool call을 포함한 문장의 Loss

$$  
\mathcal{L}_{\text{tool}} = - \sum_{i=t+1}^{T} \log P(y_i \mid \tilde{x}_{<i})  
$$

만약 다음 조건을 만족하면:

$$  
\mathcal{L}_{\text{tool}} + \lambda < \mathcal{L}_{\text{orig}}  
$$

해당 tool call은 **“유용하다”** 라고 판단하고 학습 데이터에 포함시킨다.

- $\lambda$ : threshold parameter (잡음 제거용)
    

즉, Perplexity (PPL)를 낮춘 tool usage만 살아남는다.

이것이 Toolformer의 핵심이다.

> 🔑 “도구 사용은 모델의 예측을 더 쉽게 만들어야 한다.”

그렇지 않으면 버려진다.

---

## 4. 알고리즘 요약 (수식적 단계)

1. Base corpus $x \sim \mathcal{D}$
2. 모든 위치 $t$에 대해 tool call 후보 삽입
3. 도구 실행 후 새로운 시퀀스 $\tilde{x}$
4. Loss 비교:
    

$$  
\Delta \mathcal{L} = \mathcal{L}_{\text{orig}} - \mathcal{L}_{\text{tool}}  
$$

5. 조건 만족 시 데이터셋에 포함
6. 새로운 데이터로 LLM Fine-tuning
    

결과적으로 학습되는 목표는 다음과 같다.

$$  
\max_\theta \log P_\theta(y, \text{tool calls} \mid x)  
$$

즉, 모델은 텍스트 + 도구 사용 방식을 동시에 학습한다.

---

## 5. 구체적 예시

문장:

> “The Eiffel Tower is located in”

Base LLM는 다음을 예측하려 함:

> “Paris”

하지만 Toolformer는 여기서 다음을 시도한다.

```
CALL search("Eiffel Tower location")
→ "Paris, France"
```

새로운 시퀀스:

> “The Eiffel Tower is located in [CALL] Paris, France → Paris”

이제 모델 입장에서

$$  
P(\text{Paris} \mid ..., \text{Paris, France})  
$$

가 훨씬 커진다 → Loss 감소 → Good sample

이 데이터는 남겨지고, 모델은 점점 **“검색을 하면 더 쉬워진다”**는 패턴을 학습한다.

---

## 6. PyTorch 스타일의 Pseudo-code

```python
for x in corpus:

    y = base_model.generate(x)

    for t in possible_positions(y):

        for tool in tools:

            candidate = insert_tool_call(y, tool, t)

            obs = execute_tool(tool)

            new_seq = insert_observation(candidate, obs)

            L_orig = compute_loss(y)
            L_tool = compute_loss(new_seq)

            if L_tool + lambda < L_orig:
                add_to_training_set(new_seq)

# Fine-tune on new dataset
train(toolformer_model, new_dataset)
```

여기서 핵심은

- Human label 없음
- Reward 없음
- 오로지 **likelihood 기반 자동 선별**

이라는 점이다.

---

## 7. Tool-Augmented LLM과의 차이 요약

| 구분       | Tool-Augmented LLM   | Toolformer               |
| -------- | -------------------- | ------------------------ |
| 도구 사용 방식 | Prompt + Instruction | Self-supervised learning |
| 학습 방식    | 외부 제어                | 자동 생성된 데이터               |
| 확장성      | 제한적                  | 매우 높음                    |
| 혁신 포인트   | Inference-time       | Training-time            |

즉, Toolformer는 **도구를 “사용하는 방법” 자체를 학습하는 모델**이다.

---

## 8. 요약

1. Toolformer는 LLM이 스스로 도구 사용을 학습하도록 만든다.
2. 핵심 기준은 **Perplexity 감소**이다.
3. 유용한 tool call만 학습 데이터로 채택된다.
4. 결과적으로 LLM은 “언제 도구를 써야 하는지”를 내재화한다.
    

이는 단순한 기능 추가가 아니라,  
**LLM의 역할을 Passive Generator → Active Problem Solver**로 진화시키는 접근이다.

---

## 9. Further Reading

- [[04_LLM/03_Tool-Augmented LLM & Function Calling|03_Tool-Augmented LLM & Function Calling]]
- [[04_LLM/02_ReAct_Prompting|02_ReAct_Prompting]]
- Self-Supervised Learning in NLP
    

---

## 10. References

- _Toolformer: Language Models Can Teach Themselves to Use Tools_ — Schick et al., 2023
- _ReAct: Synergizing Reasoning and Acting in Language Models_ — Yao et al., 2022
- _Language Models as Zero-Shot Planners_ — Huang et al., 2022