
> “도구를 _언제·어떻게_ 쓰는지까지 포함해서, 인간 선호에 맞게 최적화된 정책 $\pi_\theta$를 어떻게 만들 것인가?”

---

# 1. 큰 그림: Toolformer + RLHF = Tool-Augmented Policy Optimization

기본적인 RLHF(Reinforcement Learning from Human Feedback)는 다음 문제를 푼다.

- 입력 $x$ (질문, 대화 context)가 주어졌을 때
- 정책 $\pi_\theta(y \mid x)$가 생성한 응답 $y$에 대해
- 인간 혹은 Reward Model $R_\phi(x, y)$가 “얼마나 좋은지”를 점수로 준다.
- 목표는  
    $$  
    \max_\theta \ \mathbb{E}_{x \sim \mathcal{D}, \ y \sim \pi_\theta(\cdot \mid x)}[R_\phi(x, y)]  
    $$
    

여기에 **Toolformer**의 아이디어를 더하면, 정책이 생성하는 것은 단순 답변 $y$가 아니라:

- **Tool call이 섞인 전체 trajectory(궤적)** $\tau$가 된다.
    

즉, 이제는

- 텍스트만 생성하는 policy →
- “텍스트 + 도구 호출 + 도구 결과까지 포함하는 정책”으로 확장되는 것이다.
    

---

# 2. MDP 관점에서의 Tool-augmented RLHF

먼저 상태(state)와 행동(action)을 정의하자.

- 상태 $s_t$:  
    $$s_t = (x, h_t)$$  
    여기서 $x$는 초기 사용자 입력, $h_t$는 지금까지의 대화 및 tool 사용 이력  
    $$  
    h_t = {(a_0, o_0), (a_1, o_1), \dots, (a_{t-1}, o_{t-1})}  
    $$
    
    - $a_i$: 모델이 낸 “행동” (토큰 생성 혹은 tool 호출)
    - $o_i$: tool 호출에 대한 observation (검색 결과, 계산 결과 등)
        
- 행동 $a_t$:  
    $$  
    a_t \in \mathcal{A} = \mathcal{A}_{\text{text}} \cup \mathcal{A}_{\text{tool}}  
    $$
    
    - $\mathcal{A}_{\text{text}}$: 일반 텍스트 토큰 생성
    - $\mathcal{A}_{\text{tool}}$: 정의된 함수 집합 ${f_1, \dots, f_K}$ 중 하나를 특정 argument로 호출하는 action  
        예: “`calc("128 * 47 + 396")` 호출”
        
- 환경 전이:
    
    - 텍스트 토큰이면: 단순히 history에 토큰이 추가
    - tool action이면:  
        $$  
        o_t = f_k(a_t)  
        $$  
        그리고 $(a_t, o_t)$가 history에 추가되어 다음 상태 $s_{t+1}$을 구성
        
- 에피소드 종료 후, 최종 trajectory $\tau$:  
    $$  
    \tau = (s_0, a_0, o_0, s_1, a_1, o_1, \dots, s_T, a_T)  
    $$
    

이 전체 trajectory에 대해 Reward Model $R_\phi$가 다음을 평가한다고 보자.

$$  
R_\phi(\tau) \approx \text{“이 응답이 얼마나 유용하고, 정직하고, 효율적으로 도구를 썼는가?”}  
$$

그러면 목표는:

$$  
\max_\theta \ \mathbb{E}_{x \sim \mathcal{D}, \ \tau \sim \pi_\theta(\cdot \mid x)}[R_\phi(\tau)]  
$$

여기서 $\pi_\theta$는 이제 **tool usage까지 포함된 policy**다.

---

# 3. Toolformer 단계: “도구 사용 행동 공간” 사전 학습

먼저 Toolformer에서 했던 일을 복기해 보자.

### 3.1 Self-supervised Tool Annotation

기존 corpus에서 샘플 $x$를 뽑고, base model $\mathcal{M}$이 만든 텍스트 $y$에 대해:

1. 각 위치 $t$마다 tool call candidate를 삽입:  
    $$  
    y \rightarrow y' = (y_1, \dots, y_t, \text{CALL } f_k(a), y_{t+1}, \dots)  
    $$
    
2. 실제로 tool을 실행해서 observation $o$를 얻고,  
    $$  
    \tilde{y} = (y_1, \dots, y_t, \text{CALL } f_k(a), o, y_{t+1}, \dots)  
    $$
    
3. Perplexity 비교:  
    $$  
    \mathcal{L}_{\text{orig}} = -\sum_{i>t} \log P(y_i \mid y_{<i})  
    $$  
    $$  
    \mathcal{L}_{\text{tool}} = -\sum_{i>t} \log P(y_i \mid \tilde{y}_{<i})  
    $$  
    그리고  
    $$  
    \mathcal{L}_{\text{tool}} + \lambda < \mathcal{L}_{\text{orig}}  
    $$  
    인 경우에만 “유용한 tool 사용” 샘플로 간주
    

이 과정을 통해 “**어디에 어떤 도구를 쓰면 언어 모델 입장에서 예측이 쉬워지는지**”를 학습 데이터로 쌓는다.

### 3.2 Toolformer Pre-training Objective

이제 Fine-tuning 목표는:

$$  
\max_\theta \ \mathbb{E}_{(x, \tilde{y}) \sim \mathcal{D}_{\text{tool}}} \left[ \log P_\theta(\tilde{y} \mid x) \right]  
$$

- $\mathcal{D}_{\text{tool}}$: tool call과 observation이 포함된 시퀀스를 모아둔 데이터셋
    

이 과정을 통해 모델은 **도구를 문맥 내에서 어떻게 부르는지**를 학습하게 된다.  
즉, policy 초기값 $\pi_{\theta_0}$를 “도구-aware”하게 만들어 둔다.

---

# 4. RLHF 단계: Tool 사용까지 포함한 정책 정렬(Alignment)

이제 Toolformer로 초기화된 모델을 가지고 RLHF를 한다고 생각해 보자.

## 4.1 Reward Model 정의

Reward Model $R_\phi$는 더 이상 단순 $(x, y)$ 쌍만 보지 않고, **trajectory**를 본다고 보는게 자연스럽다.

$$  
R_\phi(\tau) = R_\phi(x, h_T)  
$$

여기서 $h_T$는 최종 응답과 그까지의 tool usage가 모두 포함된 history.

Reward는 예를 들어 다음처럼 구성될 수 있다.

$$  
R_\phi(\tau) = R_{\text{help}}(\tau) + R_{\text{honest}}(\tau) - \lambda_{\text{tool}} \cdot C_{\text{tool}}(\tau)  
$$

- $R_{\text{help}}$: 인간 평가 기반의 유용성(Helpfulness)
- $R_{\text{honest}}$: 정확성/정직성(Honesty)
- $C_{\text{tool}}(\tau)$: 도구 호출 횟수, 또는 도구 비용
- $\lambda_{\text{tool}}$: 도구 과사용을 막기 위한 penalty 계수
    

즉, **도구를 너무 안 써도 문제지만, 필요 이상으로 남발해도 감점**될 수 있다.

---

## 4.2 PPO 스타일 Objective (예시)

대표적인 RLHF 알고리즘인 PPO(Proximal Policy Optimization) 스타일로 보면:

1. 초기 정책 $\pi_{\theta_{\text{old}}}$ (Toolformer로 미리 학습된 것)를 사용해 trajectory들을 샘플링:  
    $$  
    \tau \sim \pi_{\theta_{\text{old}}}  
    $$
    
2. 각 trajectory에 대해
    
    - Reward $R_\phi(\tau)$ 계산
    - Baseline $b(x)$ 또는 value function $V_\psi(s)$로 advantage $A(\tau)$ 추정
        
3. Policy gradient 목적:
    $$  
    J(\theta) = \mathbb{E}_{\tau} \left[ \sum_{t} \min\left(  
    r_t(\theta) A_t, \ \text{clip}(r_t(\theta), 1-\epsilon, 1+\epsilon) A_t  
    \right) \right] - \beta , D_{\text{KL}}(\pi_\theta ,|, \pi_{\text{ref}})  
    $$
    
    - $r_t(\theta) = \dfrac{\pi_\theta(a_t \mid s_t)}{\pi_{\theta_{\text{old}}}(a_t \mid s_t)}$
    - $\pi_{\text{ref}}$: reference policy (보통 SFT 또는 Toolformer 전 단계 모델)
    - $A_t$: advantage (해당 행동이 baseline보다 얼마나 좋은지)
        

여기서 중요한 점:

- **$a_t$가 text token이든 tool call이든 동일한 policy gradient 프레임워크로 다룬다.**
    
- 따라서 RLHF는 “어떤 response를 내놓을지” 뿐 아니라,
    
    - 언제 tool을 호출할지
    - 어떤 tool을 쓸지
    - 어떤 argument로 부를지  
        까지 한꺼번에 최적화한다.
        

---

## 4.3 PyTorch 스타일 Pseudo-code

아주 간단하게 개념만 잡는 pseudo-code를 적어 보면:

```python
for batch in data_loader:

    trajectories = []
    rewards = []

    # 1. rollout with tools
    for x in batch:
        tau = []
        state = init_state(x)

        while not done(state):
            action = sample_action(policy, state)  # text token or tool call

            if is_tool_call(action):
                obs = execute_tool(action)
                state = update_state_with_tool(state, action, obs)
            else:
                state = update_state_with_text(state, action)

            tau.append((state, action))

        trajectories.append(tau)
        rewards.append(reward_model(tau))

    # 2. compute advantages A_t for each step
    advantages = compute_advantages(trajectories, rewards, value_net)

    # 3. PPO update
    loss = ppo_loss(policy, trajectories, advantages, ref_policy)
    loss.backward()
    optimizer.step()
```

핵심은:

- `action`이 “문자 토큰이냐, tool 호출이냐”는 policy의 output space 설계에 따라 달라질 뿐,
    
- RLHF update 로직 자체는 동일하게 적용 가능하다는 점이다.
    

---

# 5. 역할 분담: Toolformer vs RLHF

정리하면 두 기법은 다음처럼 역할이 분리된다.

|단계|목적|수식적 관점|
|---|---|---|
|Toolformer (Self-supervised)|“언제 어떤 tool을 쓰는 게 언어모델 입장에서 예측을 쉽게 만드는가?”를 학습|$\max_\theta \mathbb{E}[\log P_\theta(\tilde{y} \mid x)]$|
|RLHF|인간 선호, 안전성, 효율성까지 포함한 **정렬(Alignment)**|$\max_\theta \mathbb{E}_{\tau \sim \pi_\theta}[R_\phi(\tau)] - \beta D_{\text{KL}}(\pi_\theta ,\|, \pi_{\text{ref}})$|

조금 감각적으로 표현하면:

- Toolformer: “도구 쓰는 법”을 **언어모델 입장에서 유리한 방향으로** 자동 습득
- RLHF: 그 중에서 “인간이 좋아하는 도구 사용 패턴”을 정렬
    

이 둘이 결합되면,  
도구 사용이 가능한 policy의 **초기 prior**를 Toolformer가 만들어주고,  
RLHF가 그 prior를 **인간 친화적 정책**으로 정제해 주는 구조가 된다.

---

# 6. 요약

1. Toolformer는 self-supervised 방식으로 **도구 사용이 언어모델의 예측을 쉽게 만드는 지점**을 학습한다.
2. 이 과정은 “tool call이 포함된 시퀀스”에 대해 likelihood를 최대화하는 pre-training으로 볼 수 있다.
3. 이후 RLHF는 trajectory 전체에 대한 reward $R_\phi(\tau)$를 이용해, **도구 사용 전략까지 포함한 policy $\pi_\theta$를 최적화**한다.
    
4. 최종적으로 모델은 “언제, 어떤 도구를, 얼마나 쓰는 것이 인간에게 가장 유용한가”까지 학습하게 된다.
    

---

# 7. Further Reading

- RLHF에서의 KL 정규화와 PPO: Policy Regularization 관점
- DPO(Direct Preference Optimization)와 Tool-augmented 정책에의 적용
- ReAct + Toolformer + RLHF를 통합한 LLM Agent 아키텍처
    

---

# 8. References

- _Toolformer: Language Models Can Teach Themselves to Use Tools_ – T. Schick et al., 2023
- _Training Language Models to Follow Instructions with Human Feedback_ – Long Ouyang et al., 2022 (RLHF)
- _Proximal Policy Optimization Algorithms_ – J. Schulman et al., 2017 (PPO)
- _ReAct: Synergizing Reasoning and Acting in Language Models_ – S. Yao et al., 2022
    