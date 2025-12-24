---
tags:
  - RL
date created: Friday, November 21st 2025, 2:38:03 pm
date modified: Friday, November 21st 2025, 2:50:23 pm
---



> 환경과 상호작용하면서 스스로 똑똑해지는 알고리즘
> 그 시작점이 바로 **Q-learning**이다.

---

## 1. 강화학습은 무엇인가?

머신러닝은 보통 다음과 같이 구분된다.

| 유형           | 특징                 |
| ------------ | ------------------ |
| 지도학습         | 정답(label)이 있음      |
| 비지도학습        | 정답이 없음             |
| **강화학습(RL)** | **행동의 결과(보상)로 학습** |

강화학습의 기본 구조는 다음과 같다.

* 에이전트(agent): 행동을 선택하는 주체
* 환경(environment): 에이전트가 상호작용하는 세계
* 보상(reward): 행동의 결과에 대한 점수

즉, 에이전트는

> **어떤 행동을 했을 때, 결과가 좋으면 그 행동을 더 선호하게 된다**

라는 방식으로 학습한다.

---

## 2. Q-Learning에서 Q란 무엇인가?

Q-learning의 핵심은 다음 함수이다.

$Q(s, a)$

이는 다음을 의미한다.

> **“상태 $s$ 에서 행동 $a$ 를 했을 때의 가치(기대 보상)”**

즉,

* $s$ (state) : 현재 상태
* $a$ (action) : 선택한 행동
* $Q(s, a)$ : 그 행동의 가치

행동 선택은 보통 다음 기준을 따른다.

$$a^* = \arg\max_a Q(s, a)$$

즉,

> 현재 상태에서 **Q값이 가장 큰 행동**을 선택한다.

예시:

| 상태 | Left  | Right |
| -- | ----- | ----- |
| A  | -1    | **5** |
| B  | **3** | 0     |

→ A에서는 오른쪽
→ B에서는 왼쪽

---

## 3. Q-learning의 핵심 아이디어 (업데이트 식)

Q-learning의 수식은 다음과 같다.

$$
Q(s, a) \leftarrow Q(s, a) + \alpha \Big( r + \gamma \max_{a'} Q(s', a') - Q(s, a) \Big)
$$

각 기호는 다음을 의미한다.

| 기호                    | 의미                    |
| --------------------- | --------------------- |
| $$\alpha$$            | 학습률 (learning rate)   |
| $$\gamma$$            | 할인율 (discount factor) |
| $$r$$                 | 현재 받은 보상              |
| $$s'$$                | 다음 상태                 |
| $$\max_{a'}Q(s',a')$$ | 다음 상태에서 가능한 최대 가치     |

이 식의 의미는 다음과 같다.

> 지금 얻은 보상과
> 다음 상태에서 얻을 수 있는 최대 미래 가치
> 이 둘을 반영해서 Q값을 조금씩 수정한다

즉,

$$
\text{새로운 Q} = \text{기존 Q} + (조금씩 수정)
$$

이라는 개념이다.

---

## 4. 탐험 vs 이용 (Exploration vs Exploitation)

항상 최고의 행동만 고르면 새로운 가능성을 놓칠 수 있다.
그래서 **$\varepsilon$-greedy 전략**을 사용한다.

* $\varepsilon$ 확률 → 랜덤 행동 (탐험)
* $1 - \varepsilon$ 확률 → 최적 행동 (이용)

표현하면 다음과 같다.

$$
a =
\begin{cases}
\text{random action} & \text{if } rand < \varepsilon \
\arg\max_a Q(s,a) & \text{otherwise}
\end{cases}
$$

초반 → 탐험 위주
후반 → 이용 위주

---

## 5. GridWorld 예시

다음과 같은 환경을 생각해보자.

```
S - - -
- - - -
- - - G
```

* S : 시작 상태
* G : 목표 상태 (보상 $$+10$$)
* 일반 칸 : 보상 $$-1$$

에이전트는 상/하/좌/우로 움직인다.

처음에는 랜덤하지만, 반복 학습 후에는 다음을 학습하게 된다.

$$
S \rightarrow \cdots \rightarrow G
$$

→ 보상을 최대화하는 경로를 스스로 찾아낸다.

---

## 6. Python 코드의 핵심 구조

가장 중요한 부분은 아래 수식과 동일하다.

```python
new_value = old_value + alpha * (reward + gamma * next_max - old_value)
```

이것을 수식으로 표현하면 다음과 같다.

$$
Q_{new} = Q_{old} + \alpha (r + \gamma Q_{max}^{next} - Q_{old})
$$

이 한 줄이 바로 Q-learning의 본질이다.

---

## 7. Q-Learning의 장점과 한계

### ✅ 장점

* 구조가 단순하다
* 모델 없이 학습 가능 (Model-Free)
* 구현 난이도가 낮다

### ❌ 한계

* 상태 공간이 커지면 Q-table 크기가 기하급수적으로 증가한다
* 연속적인 상태 공간에서는 사용하기 어렵다

그래서 등장한 것이:

$$
\text{DQN} = Q\text{-learning} + \text{Neural Network}
$$

→ Q값을 표 대신 **신경망**으로 근사한다.

---

## 8. 최종 정리

| 개념              | 의미              |
| --------------- | --------------- |
| $$Q(s,a)$$      | 상태-행동의 가치       |
| $$r$$           | 보상              |
| $$\alpha$$      | 얼마나 빨리 배울지      |
| $$\gamma$$      | 미래를 얼마나 중요하게 볼지 |
| $$\varepsilon$$ | 탐험 비율           |

Q-learning은 다음 한 줄로 요약할 수 있다.

> **보상이 좋은 행동을 점점 더 자주 선택하도록 학습한다**

---

## Related Notes
---
- [[01_RL/02_DQN|02_DQN]]