---
tags:
  - RL
date created: Friday, November 21st 2025, 3:09:29 pm
date modified: Friday, November 21st 2025, 3:29:43 pm
---
다음 글은 **Reinforcement Learning 입문 이후 단계**로, **Q-learning → DQN(Deep Q-Network)** 로 자연스럽게 이어지도록 작성한 **블로그 포스트 초안**이다.  
수식은 모두 `$...$`로 감쌌고, 의미가 모호해질 수 있는 핵심 용어는 **영어 그대로** 유지했다.

---

# DQN (Deep Q-Network): Q-learning에 Neural Network를 더하다

> Q-table이 터져버릴 때,  
> 우리는 **Deep Learning**을 불러야 한다.

---

## 1. Q-learning의 한계부터 다시 보자

기본 Q-learning은 다음 구조를 가진다.

$Q(s, a)$

문제는 이 Q값을 보관하기 위해 **Q-table**이 필요하다는 것이다.

예시:

- state가 100 × 100 → 10,000
- action이 4개라면  
    → Q-table 크기: **10,000 × 4 = 40,000**
    

여기까진 괜찮다.
하지만 현실 문제는?

- state가 이미지 (84×84×3)
- 경우의 수 ≈ 무한대(continuous)
- 모든 state를 table에 저장 ❌
    

즉,

> **Q-table은 large / continuous state-space에서 사용할 수 없다.**

이때 등장하는 해결책이 바로:

$$
Q(s, a) \approx Q(s, a; \theta)  
$$

> Q를 **table**이 아니라  
> **Neural Network (parameter $\theta$)** 로 근사하는 것

이것이 바로 **DQN (Deep Q-Network)** 이다.

---

## 2. DQN의 핵심 아이디어

DQN의 핵심 구조는 아주 단순하게 말하면 이것이다:

> **state를 Neural Network에 넣으면 각 action의 Q-value가 출력된다**

$$ 
\text{input: } s \quad \longrightarrow \quad \text{Neural Network} \quad \longrightarrow \quad $Q(s,a_1), Q(s,a_2), ...$  
$$

예를 들어 action이 4개라면 출력은:

$$  
\begin{bmatrix}  
Q(s, up) \  
Q(s, down) \  
Q(s, left) \  
Q(s, right)  
\end{bmatrix}  
$$

이 중에서 선택:

$$  
a = \arg\max_a Q(s,a)  
$$

즉, 구조는 여전히 greedy하지만  
**Q-table 대신 Neural Network가 판단 기준이 된다.**

---

## 3. DQN의 학습 목표 (Loss function)

Q-learning의 update 식:

$$  
Q(s,a) \leftarrow r + \gamma \max_{a'} Q(s', a')  
$$

DQN에서는 이를 **target**으로 사용한다.

$$  
y = r + \gamma \max_{a'} Q(s', a'; \theta)  
$$

그리고 neural network의 예측값:

$$  
\hat{y} = Q(s, a; \theta)  
$$

Loss는 다음과 같이 정의한다.

$$ 
L(\theta) = (y - \hat{y})^2  
$$

즉:

> **현재 Q 값과, 미래 기반 target Q 값의 차이를 줄이도록 학습한다.**

이건 결국 일반적인 supervised learning 구조다:

| RL 관점      | Deep Learning 관점           |
| ---------- | -------------------------- |
| target     | $r + \gamma \max Q(s',a')$ |
| prediction | $Q(s,a;\theta)$            |
| loss       | MSE                        |

그래서 DQN은 이렇게 볼 수 있다:

> **Reinforcement Learning + Supervised Learning의 결합**

---

## 4. Experience Replay

DQN에는 **Q-learning에 없는 매우 중요한 개념**이 들어간다.

### Problem

연속된 state는 서로 너무 비슷하다:

$$  
(s_t, a_t, r_t, s_{t+1}),  
(s_{t+1}, a_{t+1}, r_{t+1}, s_{t+2}),...  
$$

이렇게 학습하면 neural network가 편향(bias)을 갖게 된다.

### Solution → Experience Replay

경험을 다음 형태로 저장한다:

$$  
(s, a, r, s')  
$$

그리고 이를 **Replay Buffer**에 쌓아두고  
**무작위로 샘플링해서 학습한다.**

```python
replay_buffer = $ (s, a, r, s_next), ... $
batch = random.sample(replay_buffer, batch_size)
```

이렇게 하면:

- 데이터 상관관계 감소
    
- 학습 안정성 증가
    
- sample 효율 증가
    

✔ DQN의 성능 비약적 향상

---

## 5. Target Network

또 다른 문제:

> 우리가 참조하는 Q값도 계속 변하면 학습이 불안정해진다.

그래서 DQN은 **Target Network**를 따로 둔다.

- Online Network → $Q(s,a;\theta)$
    
- Target Network → $Q(s,a;\theta^-)$
    

식:

$$  
y = r + \gamma \max_{a'} Q(s', a'; \theta^-)  
$$

그리고 일정 주기마다:

$$  
\theta^- \leftarrow \theta  
$$

이렇게 고정된 기준을 만들어 학습을 안정화한다.

> **움직이는 표적 대신, 고정된 표적을 보고 학습**

활쏘기와 같다.

---

## 6. DQN 전체 과정 요약

한 Episode 안에서:

1. state $s$ 관측
    
2. $\epsilon$-greedy로 action $a$ 선택
    
3. environment에서 reward $r$, next state $s'$ 획득
    
4. $(s,a,r,s')$ 를 replay buffer에 저장
    
5. 랜덤 batch 샘플링
    
6. Loss 계산
    
7. Backpropagation
    
8. 일정 step마다 target network 업데이트
    

즉:

$$  
experience \rightarrow replay \rightarrow train \rightarrow update  
$$

이게 계속 반복된다.

---

## 7. PyTorch 스타일 pseudo-code

```python
# Q network
q_net = NeuralNetwork()
target_net = NeuralNetwork()

replay_buffer = $$

for episode in range(N):
    state = env.reset()

    while not done:

        # ε-greedy
        if random() < epsilon:
            action = random()
        else:
            action = argmax(q_net(state))

        next_state, reward, done = env.step(action)

        replay_buffer.append((state, action, reward, next_state))

        batch = random.sample(replay_buffer, batch_size)

        for s, a, r, s_next in batch:
            target = r + gamma * max(target_net(s_next))
            prediction = q_net(s)[a]

            loss = (target - prediction)**2
            loss.backward()

        every C steps:
            target_net = q_net

        state = next_state
```

여기서 핵심은 두 가지다:

✔ Q-table ❌  
✔ Neural Network ✅

✔ Online net  
✔ Target net  
✔ Replay buffer

---

## 8. Q-learning vs DQN 비교

|항목|Q-learning|DQN|
|---|---|---|
|Q 저장|Table|Neural Network|
|state|Discrete|Continuous / Image 가능|
|학습|직접 업데이트|Gradient Descent|
|안정성|높음|Replay/Target 필요|
|확장성|낮음|매우 높음|

> DQN은 **Q-learning을 딥러닝으로 확장한 형태**이다.

---

## 9. 왜 DQN이 혁신이었는가?

2015년, DeepMind가 발표한 결과:

> DQN 하나로  
> Atari 49개 게임에서 인간 수준 성능 달성

입력:

- 픽셀 이미지
    

출력:

- 조이스틱 행동
    

즉

> **Feature engineering 없이도 AI가 게임을 학습**

이게 바로 DQN의 역사적 의미다.

---

## 10. 핵심 요약

|개념|의미|
|---|---|
|$Q(s,a;\theta)$|Neural Network로 근사한 Q function|
|Replay Buffer|경험 저장|
|Target Network|안정적인 학습|
|Loss|$(Target - Prediction)^2$|
|Goal|Long-term reward 최대화|

> **DQN = Q-learning + Deep Learning + Stability Tricks**


## Related Notes
---
