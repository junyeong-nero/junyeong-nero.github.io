**On-policy Knowledge Distillation**은 _student model이 학습 중인 자신의 policy로 직접 데이터를 생성하면서, 동시에 teacher model로부터 지식을 전달받아 학습하는 방식_이다.  
핵심 차이는 **데이터 분포가 학생의 현재 policy에 의해 결정된다**는 점이다.

---

## 1. 기본 구조: Knowledge Distillation 복습

일반적인 Knowledge Distillation(KD)은 다음 형태로 정식화된다.

- Teacher: $p_T(y \mid x)$
    
- Student: $p_S(y \mid x)$
    

Student는 다음 loss를 최소화한다:

$$  
\mathcal{L}_{KD} = KL(p_T(y|x) ,||, p_S(y|x))  
$$

여기에 보통 실제 label 기반 loss를 추가한다:

$$  
\mathcal{L} = \alpha \cdot \mathcal{L}_{task} + (1-\alpha) \cdot \mathcal{L}_{KD}  
$$

일반 KD에서는 **고정된 dataset($\mathcal{D}_{offline}$)** 위에서 진행되는 경우가 많다 → 이것은 **off-policy KD**다.

---

## 2. On-policy KD의 핵심: 데이터는 누가 만드나?

On-policy KD에서는 데이터 분포가 다음에 의해 결정된다:

$$  
x \sim \pi_S  
$$

즉, 학생(student) 정책 $\pi_S$가 직접 환경과 상호작용하거나 토큰을 생성해서 데이터를 만든다.

- LLM 관점: 학생 모델이 직접 문장을 생성
    
- RL 관점: 학생이 직접 행동을 선택해 trajectory 생성
    
- Agent 관점: 학생이 tool을 사용하여 상태 변화를 유도
    

그리고 그런 샘플에 대해:

$$  
\mathcal{L}_{KD} = KL(\pi_T(a|s) ,||, \pi_S(a|s))  
$$

즉, **현재 student가 마주한 상태들에서만 teacher를 따라간다.**  
이게 “on-policy”의 의미다.

---

## 3. 왜 굳이 on-policy로 할까?

Off-policy 문제점:

|문제|설명|
|---|---|
|Distribution mismatch|Teacher가 보는 $s$와 student가 실제로 마주하는 $s'$가 다름|
|Covariate shift|Student가 생성하는 문장은 train data와 점점 멀어짐|
|Error accumulation|첫 실수가 이후 state를 완전히 바꿈|

On-policy는 이를 줄인다:

$$  
s_{t+1} \sim P(s_{t+1} \mid s_t, a_t^{student})  
$$

그래서 **실제 student가 도달하는 state space에서만 학습이 일어남 → robustness 증가**

---

## 4. Reinforcement Learning 관점에서 보기

아주 깔끔하게 보면, on-policy KD는 다음 구조임:

$$  
\max_\theta ; \mathbb{E}_{s \sim d_{\pi_\theta}}  
\left[

- KL\Big(\pi_T(\cdot|s) ,|, \pi_\theta(\cdot|s)\Big)  
    \right]  
    $$
    

이는 다음과 유사하다:

- Behavior Cloning
    
- Imitation Learning
    
- KL-regularized RL
    

실제로는 다음과 같이 쓰인다:

$$  
\mathcal{L} =

- \log \pi_S(a|s)
    

- \beta \cdot KL(\pi_T(\cdot|s)|\pi_S(\cdot|s))  
    $$
    

→ PPO의 KL penalty와 형태가 매우 비슷함

---

## 5. LLM / Agent에서의 실제 적용

Agent + On-policy KD 흐름:

1. Student가 환경에서 trajectory 생성
    
2. Teacher에게 각 state에 대해 action distribution 요청
    
3. Student는 teacher를 따라가도록 업데이트
    

Pseudo-code:

```python
for step in range(T):
    state = env.state()
    action = student.sample(state)
    next_state = env.step(action)

    with torch.no_grad():
        teacher_probs = teacher(state)
    
    loss = KL(teacher_probs, student(state))
    loss.backward()
```

특히 다음 상황에서 사용됨:

- Tool-using agent
    
- Reasoning agent
    
- RLHF 대체 방식
    
- Self-play distillation
    

---

## 6. Off-policy vs On-policy 정리

|항목|Off-policy KD|On-policy KD|
|---|---|---|
|데이터 생성|고정된 데이터셋|Student policy|
|분포|$p_{data}$|$p_{\pi_S}$|
|안정성|높음|낮음 (초기 불안정)|
|적응성|낮음|매우 높음|
|실제 성능|중간|높음 (agent에서 특히)|

---

## 7. 예시 (직관적)

### 상황

- Teacher: 수학을 잘 푸는 모델
    
- Student: 아직 못 풀이
    

Off-policy:

> Teacher가 이미 푼 문제집으로 Student가 공부

On-policy:

> Student가 문제를 풀고 → 틀린 풀이를 Teacher가 교정

후자가 실제 실력 향상에 훨씬 효율적임

---

## 핵심 요약

- On-policy Knowledge Distillation은 **student가 생성한 데이터에서 teacher를 모방**하는 방식이다.
    
- 이는 distribution mismatch 문제를 줄이고, agent/LLM 환경에서 매우 효과적이다.
    
- 구조적으로는 Imitation Learning + Policy Gradient와 매우 유사하다.
    
- 특히 multi-step reasoning, tool-use, embodied agent에서 성능 차이를 크게 만든다.
    

---

## 함께 보면 좋은 개념

- Behavior Cloning
    
- DAgger
    
- Policy Distillation
    
- KL regularized RL
    
- PPO + KL Penalty
    
- Self-Play Distillation
    
- Dataset Aggregation
    
- Online RLHF
    
- ReAct + Distillation Agent
    

원한다면 다음으로 **"on-policy distillation을 agent tool dataset으로 만드는 구체적 파이프라인"**도 정리해 줄 수 있다.