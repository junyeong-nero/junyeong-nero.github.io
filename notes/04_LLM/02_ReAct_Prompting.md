# ReAct Prompting: Reasoning과 Action을 결합한 LLM 추론 프레임워크

## 1. 서론 — 왜 ReAct가 등장했는가?

대부분의 Large Language Model(LLM) 기반 추론 방식은 하나의 거대한 **텍스트 생성 문제**로 취급된다. 즉, 입력 $x$가 주어지면 모델은 토큰 시퀀스 $y = (y_1, y_2, \dots, y_T)$를 생성하도록 학습된다:

$$  
P(y \mid x; \theta) = \prod_{t=1}^{T} P(y_t \mid y_{<t}, x; \theta)  
$$

이 접근은 문장 생성에는 매우 강력하지만, 다음과 같은 문제가 발생한다.

1. **외부 정보 접근의 부재**  
    모델은 자신의 파라미터 $\theta$ 안에 있는 정보만 활용하며, 실시간 환경이나 외부 도구(SQL, Web, Calculator 등)를 직접 사용할 수 없다.
    
2. **Reasoning 과정의 불투명성(Opacity)**  
    내부적으로 어떤 추론 과정을 거쳐 답을 내는지 명확하지 않다. 즉, Chain-of-Thought(CoT)는 있지만 실제 환경과의 상호작용이 없다.
    
3. **Hallucination 문제**  
    사실을 모르는 상황에서도 그럴듯한 답을 생성한다.
    

이러한 한계를 해결하기 위해 등장한 개념이 바로 **ReAct Prompting (Reason + Act)** 이다.  
ReAct는 모델이 단순히 “답을 생성”하는 것이 아니라, **Reasoning(추론)** 과 **Action(행동)** 을 번갈아 수행하면서 문제를 해결하도록 설계된 프레임워크다.

---

## 2. 이론적 구조 — ReAct의 수식적 관점

### 2.1 기본 개념

ReAct는 모델의 출력 시퀀스를 다음과 같은 형태로 구성한다.

$$  
y = {r_1, a_1, o_1, r_2, a_2, o_2, \dots, r_n, a_n, o_n, answer}  
$$

각 기호의 의미는 다음과 같다:

- $r_i$ : $i$번째 **Reasoning step** (추론 단계)
- $a_i$ : $i$번째 **Action** (외부 tool 호출 또는 환경 변화)
- $o_i$ : Action의 **Observation** (도구 실행 결과)
- $answer$ : 최종 답변
    

즉, 일반적인 텍스트 생성이  
$$  
x \rightarrow y  
$$  
인 반면, ReAct는 다음과 같은 Markov Decision Process(MDP) 형태에 가깝다.

$$  
s_t = (x, h_t)  
$$

$$  
h_t = {r_1, a_1, o_1, ..., r_{t-1}, a_{t-1}, o_{t-1}}  
$$

그리고 모델은 각 시점에서

$$  
(r_t, a_t) \sim P(r, a \mid s_t; \theta)  
$$

를 샘플링하며, 환경은

$$  
o_t = Env(a_t)  
$$

로 응답한다.

즉, ReAct는 사실상 **LLM + Environment**의 closed-loop system이다.

---

### 2.2 Chain-of-Thought와의 차이

기존 Chain-of-Thought(CoT)는 다음 구조를 갖는다.

$$  
x \rightarrow r_1 \rightarrow r_2 \rightarrow ... \rightarrow r_n \rightarrow answer  
$$

문제는 이 $r_i$ 들이 **pure reasoning** 이라는 것. 실제 행동이 없다.

반면 ReAct는 다음과 같은 alternating 구조를 갖는다:

$$  
x \rightarrow r_1 \rightarrow a_1 \rightarrow o_1 \rightarrow r_2 \rightarrow a_2 \rightarrow o_2 \rightarrow answer  
$$

이 구조는 다음을 가능케 한다.

- 불확실성 감소: $o_i$가 추론을 보정
- 정보 확장: 외부 tool = external memory
- 현실 세계와의 연결: 웹 검색, 계산기, API 등 사용 가능
    
즉, 모델의 엔트로피 $H(P(y|x))$를 **Observation**을 통해 점진적으로 감소시키는 구조라고 볼 수 있다.

---

## 3. 예시 — 간단한 문제를 ReAct로 해결하기

### 문제

> “박지성의 월드컵 득점 수에 3을 더하면 얼마인가?”

LLM의 파라미터에 해당 정보가 없다고 가정하자.

### ReAct 추론 흐름

#### Step 1 — Reasoning

> “박지성의 월드컵 득점 수를 알아야 한다. 검색을 해야겠다.”

#### Step 2 — Action

```
Action: Search("박지성 월드컵 득점")
```

#### Step 3 — Observation

```
Observation: "박지성은 월드컵에서 3골을 기록했다."
```

이를 수식화하면

$$  
o_1 = 3  
$$

#### Step 4 — Reasoning

> “문제는 이 값에 3을 더하라고 한다.”

$$  
y = o_1 + 3 = 3 + 3 = 6  
$$

#### Step 5 — Final Answer

> 정답: 6

---

## 4. PyTorch 스타일 Pseudo-code

```python
state = prompt
history = []

while not finished:

    # Reasoning & Action generation
    output = LLM(state)

    if "Action:" in output:
        action = parse_action(output)

        if action.type == "Search":
            observation = search_engine(action.query)

        elif action.type == "Calculator":
            observation = eval(action.expression)

        history.append((output, observation))
        state = state + output + observation

    else:
        final_answer = output
        break

return final_answer
```

이를 일반화하면 ReAct는 아래 과정을 반복한다.

$$  
s_{t+1} = s_t + r_t + a_t + o_t  
$$

---

## 5. ReAct의 수학적 직관

ReAct는 수학적으로 보면 다음을 수행한다:

- 모델이 근사하는 분포: $P(y|x)$
- 실제 목표: $P(y|x, o_1, o_2, ..., o_n)$
    

Observation이 늘어날수록 conditional entropy가 감소한다.

$$  
H(Y | X, O_1, O_2, ..., O_n) < H(Y | X)  
$$

즉, ReAct는 불확실성을 줄이는 방향으로 정보량을 점진적으로 확장하는 전략이다.  
이는 **Bayesian update** 및 **Active Learning**과도 철학적으로 연결된다.

---

## 6. 요약

1. ReAct는 Reasoning과 Action을 번갈아 수행하는 LLM 추론 프레임워크이다.
2. 외부 도구를 활용하여 Hallucination을 줄이고 정보 정확도를 높인다.
3. 수학적으로는 conditional entropy를 줄여가며 답에 수렴하는 과정으로 이해할 수 있다.
4. Chain-of-Thought의 한계를 보완하며, Agent 시스템의 핵심 구조로 활용된다.
    

---

## 7. Further Reading

- Chain-of-Thought Prompting
- Tool-Augmented LLM / Function Calling
- LLM-based Agents and Planning (e.g., AutoGPT, SWE-Agent)
    

---

## 8. References

- _ReAct: Synergizing Reasoning and Acting in Language Models_ – Shunyu Yao, Jeffrey Zhao, Dian Yu et al., 2022
    
- _Chain-of-Thought Prompting Elicits Reasoning in Large Language Models_ – Jason Wei et al., 2022
    
- _Toolformer: Language Models Can Teach Themselves to Use Tools_ – Schick et al., 2023