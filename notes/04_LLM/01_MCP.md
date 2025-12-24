# MCP (Model Context Protocol) 정리

## 1. MCP란 무엇인가?

**MCP (Model Context Protocol)**는 LLM(Large Language Model)이 **외부 도구, 데이터, 서비스와 일관된 방식으로 연결**될 수 있도록 설계된 통신 규격이다.  
간단히 말해,

> “LLM이 여러 시스템과 대화하고, 행동하고, 상태를 유지하기 위한 공통 인터페이스”

라고 볼 수 있다.

기존 LLM은 기본적으로 다음 함수만 가진다.

$$  
y = f_\theta(x)  
$$

- $x$ : text prompt
- $y$ : model output
- $f_\theta$ : LLM
    

하지만 MCP가 도입되면 LLM은 다음과 같이 확장된다.

$$  
y = f_\theta(x, C, T)  
$$

- $C$ : external context (files, DB, memory 등)
- $T$ : tools / APIs / functions
- $f_\theta$ : reasoning + tool orchestration
    

즉, model이 “언어 생성기”가 아니라 **행동 가능한 agent**로 확장된다.

---

## 2. MCP의 핵심 목적

MCP는 단순한 API 연결이 아니라 다음을 표준화하기 위해 만들어졌다.

1. **Context 통합**
    - 파일, DB, 로그, 메시지, memory 등을 하나의 체계로 연결
        
2. **Tool 호출 통합**
    - 외부 함수, 서비스, shell, DB 쿼리 등을 통일된 방식으로 사용
        
3. **상태 관리**
    - multi-turn 상태, task 상태, agent memory 관리
        
4. **Agent 협업**
    - 여러 agent가 같은 프로토콜을 통해 협력 가능
        

기존:  
각각의 tool마다 다른 wrapper, JSON schema, endpoint 필요

MCP 이후:

$$  
\text{standard interface} \Rightarrow \text{plug-and-play tools}  
$$

---

## 3. MCP 구조 개념도

MCP는 보통 아래 구조를 가진다.

```
[ LLM Client ]
     |
     |  MCP Protocol
     |
[ MCP Server ]
     |
     ├── Tool A (Filesystem)
     ├── Tool B (Database)
     ├── Tool C (Browser)
     ├── Tool D (Python Runtime)
```

즉, LLM은 직접 Tool을 제어하지 않고,  
**MCP Server를 통해 요청**한다.

이를 수식 구조로 단순화하면 다음과 같다.

$$  
Action = \text{MCP}(Instruction)  
$$

$$  
Result = \text{Tool}_{i}(Action)  
$$

$$  
Response = f_\theta(Instruction + Result)  
$$

---

## 4. MCP가 기존 API 방식과 다른 점

|항목|기존 API|MCP|
|---|---|---|
|인터페이스|제각각|표준화|
|context|제한적|확장 가능|
|agent간 협업|어려움|쉬움|
|확장성|낮음|매우 높음|
|상태관리|직접 구현|프로토콜에 포함|

기존 방식은:

```python
if tool == "browser":
    use_browser()
elif tool == "file":
    use_file()
elif tool == "python":
    run_python()
```

MCP 방식은:

```python
tool_list = mcp.list_tools()
mcp.execute(tool, args)
```

즉, LLM은 **tool의 존재만 알면 되고 구현 방식은 신경 쓰지 않는다.**

---

## 5. 예시로 이해하기

### 상황

사용자가 다음과 같이 말한다.

> “이 폴더 안의 모든 CSV 파일을 분석해서 평균을 구해줘”

이때 LLM은 단순히 텍스트를 생성하는 것이 아니라:

1. MCP Server에 연결된:
    - filesystem tool
    - python tool

2. 이 순서로 행동한다.

Flow:

1. 폴더 목록 요청

$$
\text{files} = \text{MCP.call}(\text{list.directory}, \text{path})
$$

2. CSV 파일 필터링

$$  
csv = {f \mid f \in \text{files} \land ".csv" \in f}  
$$

3. Python tool로 평균 계산

$$  
mean = \frac{1}{n} \sum_{i=1}^{n} x_i  
$$

4. 최종 자연어 응답 생성

$$  
response = f_\theta(mean)  
$$

즉, LLM은:

> “계산 방법을 설명하는 주체”가 아니라  
> **도구를 조합하여 문제를 해결하는 통제자(controller)**

---

## 6. MCP와 Agent의 연결

MCP는 **Agentic AI**와 잘 맞는다.

Agent는 보통 다음 구조를 가진다.

- Goal
- Memory
- Tools
- Planning
    

MCP는 이 중에서 특히

- Memory
- Tools
- State
- Action channel
    

을 담당한다.

즉, Agent를 수식으로 표현하면:

$$  
Agent = (LLM + Memory + Tools + State)  
$$

MCP는

$$  
MCP = \text{Standard Interface for (Memory + Tools + State)}  
$$

이다.

이 때문에 **Multi-agent system**, **AutoGPT**, **SWE-agent**, **LangGraph** 등에 MCP가 적합하다.

---

## 7. 왜 중요한가?

앞으로의 AI는 단순 생성이 아니라:

- 코드 작성
- 파일 읽기
- 문서 요약
- 시스템 배포
- 데이터 분석
- 소프트웨어 디버깅
    

까지 수행한다.

즉,

> LLM + MCP = 실제로 일을 하는 시스템

이 된다.

MCP가 없다면:

- 각 프로젝트마다 custom wrapper 필요
- 유지보수 어려움
- Agent의 확장성 문제 발생
    

MCP가 있으면:

- Tool을 꽂기만 하면 바로 사용 가능
- 표준화된 agent 생태계 형성
- scalable and modular한 설계 가능
    

---

## 8. 간단한 요약

- MCP는 **LLM과 외부 도구/데이터를 연결하는 표준 프로토콜**
- 목적: 통합성, 확장성, agent화
- 기존 API 방식보다 훨씬 구조적으로 강력
- Agent 시스템의 핵심 인프라 역할
- LLM을 “행동하는 존재”로 바꾸는 열쇠
    

---

## 9. 같이 공부하면 좋은 개념들

- Agentic AI
- Tool-augmented LLM
- Function Calling
- LangChain / LangGraph
- AutoGPT / SWE-agent
- ReAct prompting
- Memory-augmented neural networks
- Distributed Multi-Agent System
- REST vs RPC vs MCP
    

이 개념들을 함께 연결해서 보면, MCP의 진짜 가치가 훨씬 입체적으로 보이기 시작한다.