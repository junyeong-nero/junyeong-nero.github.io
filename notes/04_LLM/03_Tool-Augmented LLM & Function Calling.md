
## 1. 서론 — 왜 Tool-Augmented LLM이 필요했는가?

일반적인 Large Language Model(LLM)은 다음과 같은 확률 모델이다.

$$  
P(y \mid x; \theta) = \prod_{t=1}^{T} P(y_t \mid y_{<t}, x; \theta)  
$$

여기서

- $x$: 입력 프롬프트
- $y = (y_1, \dots, y_T)$: 출력 토큰 시퀀스
- $\theta$: 모델 파라미터
    

이 구조의 치명적인 한계는 분명하다.

1. **Closed-world assumption**  
    모델의 지식은 $\theta$에 고정되어 있어 실시간 정보, 계산, 파일 처리 등 외부 환경에 접근하지 못한다.
    
2. **Hallucination 문제**  
    실제로는 모르는 정보에 대해 그럴듯한 답을 생성한다.
    
3. **정확한 연산의 한계**  
    정밀한 수식 계산, DB 조회, 코드 실행과 같은 task는 LLM의 본질적인 목적이 아니다.
    

이 문제를 해결하기 위해 등장한 개념이  
**Tool-Augmented LLM (도구 결합 언어 모델)**이며, 구체적인 구현 방식이 바로 **Function Calling**이다.

핵심 아이디어는 단순하지만 파괴적이다.

> “모델이 직접 답을 만들지 말고, 필요하면 적절한 함수를 호출하도록 하자.”

---

## 2. 이론적 구조 — 수식으로 보는 Function Calling

Tool-Augmented LLM은 기본적으로 **조건부 행동 선택 문제**로 볼 수 있다.

### 2.1 확장된 출력 공간

기존 LLM의 출력 공간은 텍스트 토큰 집합 $\mathcal{V}$ 였다.  
하지만 Tool-Augmented LLM에서는 출력 공간이 다음으로 확장된다.

$$  
\mathcal{Y} = \mathcal{V} \cup \mathcal{F}  
$$

여기서:

- $\mathcal{V}$: 일반 자연어 토큰
- $\mathcal{F}$: 가능한 Function(또는 Tool)들의 집합  
    $$  
    \mathcal{F} = {f_1, f_2, \dots, f_K}  
    $$
    

즉, 모델은 매 타임스텝에서

$$  
y_t \in \mathcal{V} \cup \mathcal{F}  
$$

를 선택한다.

이는 다음과 같은 혼합 분포로 나타낼 수 있다.

$$  
P(y_t \mid x) = \alpha \cdot P_{\text{text}}(y_t \mid x) + (1-\alpha) \cdot P_{\text{tool}}(y_t \mid x)  
$$

- $P_{\text{text}}$: 일반 language generation 확률
- $P_{\text{tool}}$: 특정 function을 호출할 확률
- $\alpha$: mixture coefficient
    

즉, LLM은 “문장을 생성할지”, “도구를 쓸지”를 동시에 판단한다.

---

### 2.2 Function Calling을 통한 정보 갱신

만약 모델이 특정 함수 $f_i$를 선택한다면, 그 이후에는 다음과 같은 과정이 추가된다.

$$  
o_i = f_i(a_i)  
$$

- $a_i$: function의 argument
- $o_i$: function의 output (observation)
    

그 후, 모델은 단순히
$$  
P(y \mid x)  
$$

가 아니라
$$  
P(y \mid x, o_i)  
$$

를 기반으로 다음 토큰을 생성한다.

즉, Tool-Augmented LLM은 수식적으로는 다음 형태를 가진다.

$$  
P(y \mid x, o_1, o_2, ..., o_n)  
$$

Observation이 하나씩 추가될수록 모델의 uncertainty는 감소한다.

$$  
H(Y \mid X, O_1, O_2, ..., O_n) < H(Y \mid X)  
$$

이는 Bayesian Update와 매우 유사한 성질이다.

---

## 3. 예시 — 수치 계산에서의 Function Calling

### 문제

> “(128 × 47) + 396을 계산하라”

일반적인 LLM은 종종 이 계산에서 실수를 한다.

그러나 Tool-Augmented LLM은 다음과 같이 작동한다.

#### Step 1 — 내부 추론

> “계산이 필요하다. Calculator tool을 사용해야 한다.”

#### Step 2 — Function Call

```
{
  "name": "Calculator",
  "arguments": {
      "expression": "(128 * 47) + 396"
  }
}
```

#### Step 3 — Tool Output

$$  
o = 6412  
$$

#### Step 4 — Final Response

> 정답: 6412

이 과정은 다음과 같이 표현된다.

$$  
f_{\text{calc}}((128 * 47) + 396) = 6412  
$$

그리고 최종 답은

$$  
y = o = 6412  
$$

즉, 모델은 **계산을 추론하지 않고, 계산을 위임한다.**

---

## 4. PyTorch 스타일의 Pseudo-code

Function Calling 과정을 간략하게 나타내면 다음과 같다.

```python
prompt = "What is (128 * 47) + 396?"
output = LLM(prompt)

if output.contains("function_call"):
    name, args = parse_function(output)
    result = tools[name](**args)
    new_prompt = prompt + str(result)
    final_answer = LLM(new_prompt)

return final_answer
```

이를 Markov Decision 구조로 보면,

$$  
s_{t+1} = s_t + f(s_t)  
$$

즉, 상태(state)에 tool output이 누적되며, 점점 더 정답에 가까워진다.

---

## 5. Agent 관점 — Tool-Augmented = Action space 확장

Reinforcement Learning 관점에서 보면, 이는 매우 자연스러운 구조다.

- State: $s_t$ = prompt + history
- Action: $a_t \in {\text{generate text}, f_1, ..., f_k }$
- Reward: correctness of answer
    

즉, Action space가 다음과 같이 확장된 것이다.

$$  
\mathcal{A} = \mathcal{A}_{text} \cup \mathcal{A}_{tool}  
$$

이로 인해 LLM은 단순한 “Text generator”가 아니라 **문제 해결을 위한 Decision Maker**가 된다.

---

## 6. Limitations & Risks

- 잘못된 tool 선택 → propagation of error
- Tool dependency → 시스템 복잡도 증가
- Prompting에 따라 tool을 과도하게 사용하는 편향 발생
    

그럼에도 불구하고, Tool-Augmented LLM이 없다면 **Agent, AutoGPT, RAG + Tools 구조는 구현이 불가능하다.**

---

## 7. 요약

1. Tool-Augmented LLM은 외부 함수를 호출할 수 있는 확장된 언어 모델이다.
2. 수식적으로는 출력 공간을 $\mathcal{V} \rightarrow \mathcal{V} \cup \mathcal{F}$로 확장한다.
3. Observation이 추가되며 conditional entropy가 감소한다.
4. 이는 LLM을 수동 응답자가 아닌, 능동적 문제 해결자로 만든다.
    

---

## 8. Further Reading

- [[04_LLM/02_ReAct_Prompting|02_ReAct_Prompting]]
- [[04_LLM/04_Toolformer|04_Toolformer]]
- Function Calling in OpenAI / Anthropic API
    

---

## 9. References

- _Toolformer: Language Models Can Teach Themselves to Use Tools_ — Schick et al., 2023
- _ReAct: Synergizing Reasoning and Acting in Language Models_ — Yao et al., 2022\
- _Language Models as Zero-Shot Planners_ — Huang et al., 2022
    