# Minimax Algorithm 완전 정리

Minimax algorithm은 **두 명의 플레이어가 번갈아가며 완벽하게 플레이한다는 가정 하에서, 최적의 수를 선택하는 탐색 알고리즘**이다. 주로 **turn-based, zero-sum, perfect information game**(예: Tic-tac-toe, Chess, Go simplified version 등)에서 사용된다.

핵심 아이디어는 다음 한 문장으로 정리된다.

> 상대가 항상 나에게 최악의 수를 두려고 할 때, 그 상황에서도 가장 나은 선택을 고르는 전략

즉,

- 나는 점수를 **최대화 (Maximize)** 하려고 하고
- 상대는 내 점수를 **최소화 (Minimize)** 하려고 한다
    
그래서 이름도 **Minimax**이다.

---

## 1. 게임 트리 (Game Tree)와 기본 구조

Minimax는 **Game Tree**를 기반으로 작동한다.

- 각 노드는 게임의 상태(state)
- 각 간선은 가능한 action
- 깊이는 turn(수의 개수)
- 리프 노드는 종결 상태 (win / lose / draw)
    

플레이어는 두 종류로 나뉜다:

- **MAX**: 점수를 최대화하려는 플레이어 (보통 AI 또는 나 자신)
- **MIN**: 점수를 최소화하려는 플레이어 (상대)
    
따라서 서로 번갈아가면서

$$  
MAX \rightarrow MIN \rightarrow MAX \rightarrow MIN \rightarrow \dots  
$$

의 구조가 된다.

---

## 2. Minimax의 수식 정의

높이 $d$를 가진 node 상태를 $s$ 라고 할 때, Minimax의 value function은 다음과 같이 정의된다.

$$  
V(s) = \begin{cases}  
Utility(s) & \text{if } s \text{ is terminal state} \\  
\max_{a \in Actions(s)} V(Result(s,a)) & \text{if } Player(s) = MAX \\  
\min_{a \in Actions(s)} V(Result(s,a)) & \text{if } Player(s) = MIN  
\end{cases}  
$$

여기서,

- $Utility(s)$: 게임이 끝났을 때 주어지는 점수 (예: 승리 +1, 패배 -1, 무승부 0)
- $Actions(s)$: 현재 상태에서 가능한 모든 행동
- $Result(s, a)$: 행동 a를 했을 때의 다음 상태
    

즉 정리하면,

|Player|Value 계산 방식|
|---|---|
|MAX|모든 자식 노드 중 최댓값 선택|
|MIN|모든 자식 노드 중 최솟값 선택|

↓

$$  
V_{MAX} = \max(V_{children}), \quad  
V_{MIN} = \min(V_{children})  
$$

---

## 3. 직관적 이해

Minimax의 핵심은 **“나는 최선을 다하고, 상대도 최선을 다한다”** 라는 가정이다.

그래서:
- 내가 수를 고를 때는 **가장 점수가 높은 경로**를 고름
- 상대는 내 점수를 망치려고 **가장 점수가 낮은 경로**를 고름
    

그 결과:

> 내가 한 수를 고를 때, 미래에 상대가 둔 최악의 수까지 이미 고려된 상태에서 가장 좋은 선택을 하게 된다.

즉, 내가 보는 점수는 항상

$$  
\text{내가 받을 수 있는 최소 점수 중 최대}  
$$

이 된다.

그래서 Minimax는 다음과 같이 이해할 수 있다.

> _Worst case scenario를 기준으로 최선의 선택을 한다._

---

## 4. 간단한 예시 (숫자 트리)

다음과 같은 Game Tree가 있다고 가정하자.

```
            MAX
          /     \
        MIN     MIN
       /   \   /    \
      3     5  2      9
```

### Step 1. MIN 노드 계산

왼쪽 MIN:

$$  
\min(3, 5) = 3  
$$

오른쪽 MIN:

$$  
\min(2, 9) = 2  
$$

그래서 트리는 이렇게 바뀐다.

```
            MAX
          /     \
         3       2
```

### Step 2. MAX 노드 계산

$$  
\max(3, 2) = 3  
$$

결론:

> MAX는 왼쪽을 선택하는 것이 최적의 선택  
> 결과는 **3**

즉, 5라는 좋은 값이 있어도 상대가 일부러 3을 선택할 것이기 때문에, MIN 아래의 실제 결과는 **3**인 것이다.

---

## 5. Tic-Tac-Toe 예시로 이해하기

Tic-Tac-Toe에서:

- 나 = X = MAX
    
- 상대 = O = MIN
    
- 승리 = +1, 패배 = -1, 무승부 = 0
    

Minimax는 모든 가능한 수를 깊이 끝까지 탐색하고,  
결과가 +1이 되는 경로를 최대한 보장하는 첫 번째 수를 선택한다.

즉

> “이 수를 두면, 몇 수 뒤에 상대가 아무리 잘 둬도 나는 최소 무승부, 혹은 승리를 가져갈 수 있다”

이걸 계산해서 두는 방식이다.

그래서 Minimax를 사용한 Tic-Tac-Toe AI는 **절대 지지 않는다.**

---

## 6. 계산 복잡도 문제

Minimax의 가장 큰 문제는 연산량이다.

Game Tree의 branching factor를 $b$,  
깊이를 $d$ 라고 하면:

$$  
Time Complexity = O(b^d)  
$$

예를 들어 체스:

- $b \approx 30$
    
- $d = 10$ 라면
    

$$  
30^{10} = 5.9 \times 10^{14}  
$$

→ 현실적으로 계산 불가능

이 문제를 해결하기 위한 방법이 바로 **α-β Pruning (Alpha-Beta Pruning)** 이다.

---

## 7. Minimax와 딥러닝과의 연결

초기 AlphaGo에서도 핵심 구조는 다음과 같았다:

- Minimax 기반의 **Monte Carlo Tree Search**
- 그리고 노드의 가치를 예측하기 위한 **Deep Neural Network**
    
즉,

> Minimax + Deep Learning = 현대 게임 AI의 핵심 구조

라고 볼 수 있다.

---

# ✅ 요약

- Minimax는 두 플레이어가 최적으로 행동할 때의 최선의 선택을 찾는 알고리즘
- MAX는 최대값, MIN은 최소값을 고른다
- 수식은 다음과 같이 정의된다

$$  
V(s) =  
\begin{cases}  
Utility(s) & \text{terminal} \\  
\max V(next) & \text{MAX} \\  
\min V(next) & \text{MIN}  
\end{cases}  
$$

- 실제 게임에서는 상대의 최선의 방해까지 고려한 전략을 계산
    
- 문제점: 계산량이 매우 큼 → Alpha-Beta Pruning 필요
    

---

# 더 찾아보면 좋은 개념들

- Alpha-Beta Pruning
- Monte Carlo Tree Search (MCTS)
- Expectimax Algorithm
- Nash Equilibrium
- Game Theory
- Reinforcement Learning & [[01_RL/03_Policy_Gradient|03_Policy_Gradient]]
- AlphaGo architecture
- Temporal Difference (TD) Learning
- Tree Search vs Graph Search
    

---

원한다면 다음 단계로,

- Minimax + Alpha-Beta Pruning Python 코드
    
- Tic-Tac-Toe AI 구현
    
- Connect4 / Gomoku Minimax 적용
    

까지 같이 정리한다.