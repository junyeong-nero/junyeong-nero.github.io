

## 1. 기본 개념

Reinforcement Learning(RL)에서 핵심은 **policy $\pi(a|s)$** 이다.  
policy는 state $s$에서 어떤 action $a$를 선택할지를 결정하는 확률 분포이다.

On-policy와 Off-policy의 차이는 아주 단순하게 말하면 다음과 같다.

> **모델을 학습할 때 사용하는 데이터가 현재 학습 중인 policy에서 나온 것이냐? 아니냐?**

- **On-policy**:  
    현재 업데이트하고 있는 policy $\pi$가 직접 수집한 데이터로 학습
    
- **Off-policy**:  
    다른 policy(과거 policy나 behavior policy)에서 수집한 데이터로 현재 policy를 학습
    

이를 수식 표현으로 보면:

- On-policy:  
    $$  
    \text{Data} \sim \pi_\text{current}  
    $$
    
- Off-policy:  
    $$  
    \text{Data} \sim \pi_\text{behavior}, \quad \pi_\text{behavior} \neq \pi_\text{current}  
    $$
    

---

## 2. Bellman Equation에서의 차이

Value function $V^\pi(s)$는 다음과 같다:

$$  
V^\pi(s) = \mathbb{E}_{a \sim \pi,, s' \sim P} \left[ r + \gamma V^\pi(s') \right]  
$$

### On-policy

On-policy에서는 **현재 policy $\pi$ 자체를 평가하고 개선**한다.

따라서 sampled action $a$도 $\pi$에서 뽑는다.

$$  
a \sim \pi(a|s)  
$$

즉, **evaluation (estimate)와 improvement (update)가 같은 policy 기준**이다.

대표적인 알고리즘:

- SARSA
- REINFORCE
- PPO, A2C, A3C
    

---

### Off-policy

Off-policy에서는 **target policy와 behavior policy가 분리**된다.

- behavior policy $\mu$: 실제로 데이터를 수집하는 policy
- target policy $\pi$: 우리가 최적화하고 싶은 policy
    

Value function:

$$  
Q^\pi(s,a) = \mathbb{E}_{s' \sim P}  
\left[ r + \gamma \max_{a'} Q^\pi(s', a') \right]  
$$

이때 action $a$는 $\pi$에서 오지 않아도 된다.

$$  
a \sim \mu, \quad \mu \neq \pi  
$$

대표적인 알고리즘:

- [[01_RL/01_Q-Learning|01_Q-Learning]]
- [[01_RL/02_DQN|02_DQN]]
- DDPG
- TD3
- SAC
    

---

## 3. Importance Sampling (핵심 개념)

Off-policy가 가능하려면, policy mismatch 문제를 해결해야 한다.  
이때 사용하는 것이 **Importance Sampling**이다.

$$  
\mathbb{E}_{a \sim \pi}[f(a)]  
= \mathbb{E}_{a \sim \mu}\left[\frac{\pi(a|s)}{\mu(a|s)} f(a) \right]  
$$

여기서

$$  
w = \frac{\pi(a|s)}{\mu(a|s)}  
$$

이 $w$를 **importance weight** 라고 한다.

즉, behavior policy에서 나온 sample도 **가중치 조정**을 통해 target policy 기준으로 변환할 수 있다.

---

## 4. 학습 특성 비교

|구분|On-policy|Off-policy|
|---|---|---|
|데이터 재활용|불가능 / 제한적|가능 (Replay Buffer)|
|sample efficiency|낮음|높음|
|안정성|비교적 안정적|불안정할 수 있음|
|탐험(Exploration)|내부에 포함|behavior policy로 분리|
|대표 알고리즘|SARSA, PPO|Q-learning, DQN|

Off-policy는 **replay buffer**를 사용하여 과거 데이터를 계속 재활용할 수 있기 때문에 일반적으로 sample efficiency가 매우 좋다.

---

## 5. 예시로 이해하기

### 예시 환경: 미로(Maze) 탈출

### On-policy 방식

현재 policy가 "오른쪽을 자주 가는 경향"이 있다면:

1. 실제로 오른쪽을 선택
2. 그 결과를 보고
3. 같은 policy를 업데이트
4. 다시 오른쪽 경향을 가진 상태에서 탐험
    

즉, **항상 자기 자신이 한 행동을 기준으로 학습**

$$  
\text{Update based on } (s, a \sim \pi, r, s')  
$$

---

### Off-policy 방식

1. 이전 policy(랜덤 혹은 사람)에 의해 수집된 데이터 사용
2. 그 행동과 다른 행동을 "했을 경우"도 계산
3. optimal action 쪽으로 policy 업데이트

Q-learning에서는:

$$  
Q(s,a) \leftarrow Q(s,a) + \alpha [r + \gamma \max_{a'} Q(s', a') - Q(s,a)]  
$$

실제로 $a'$를 실행하지 않았어도, hypothetical하게 업데이트한다.

즉, 행동은 과거 정책에서 나왔지만  
**학습은 미래의 최적 policy를 향해** 진행된다.

---

## 6. 직관적 비유

|상황|비유|
|---|---|
|On-policy|“내가 실제로 해보고, 그 결과를 바탕으로 학습한다”|
|Off-policy|“남이 한 행동을 보고도, 내가 하려던 최선의 행동을 배운다”|

- On-policy: 직접 운전 → 배움
- Off-policy: 남 운전 영상 → 배움
    
---

## 7. 언제 어떤 걸 쓰는가?

On-policy가 좋을 때

- 안정성이 중요할 때
- continuous control + policy gradient
- 최근 trajectory만 중요할 때
    

Off-policy가 좋을 때

- sample이 비싼 환경 (로봇, 의료 등)
- replay 기반 학습
- 비슷한 환경을 여러번 학습할 때
    

---

## 8. 간단한 요약

- **On-policy**: 현재 policy가 만든 데이터로 자기 자신을 학습
- **Off-policy**: 다른 policy의 데이터로 target policy를 학습
- Off-policy가 sample efficiency는 더 좋음
- On-policy가 보통 더 안정적
- importance sampling이 Off-policy의 이론적 기반
    

---

## 9. 추가로 보면 좋은 개념

- SARSA vs Q-learning
- Experience Replay
- Importance Sampling
- Behavior Policy vs Target Policy
- PPO vs DQN 비교
- On-policy Policy Gradient
- Off-policy Actor-Critic
- V-trace (IMPALA)
- DDPG, TD3, SAC
    