# Alpha-Beta Pruning 완전 정리

Alpha-Beta Pruning은 **Minimax algorithm의 계산량을 줄이기 위한 최적화 기법**이다.  
결과값은 **Minimax와 완전히 동일**하지만, 불필요한 노드 탐색을 제거하여 훨씬 빠르게 계산할 수 있다.

핵심 한 문장:

> 결과에 영향을 주지 않는 branch는 보지 않는다.

---

## 1. 왜 필요한가?

Minimax의 시간복잡도는 다음과 같다:

$$  
O(b^d)  
$$

- $b$ = branching factor (자식 수)
- $d$ = search depth
    

예를 들어 체스에서
$$  
b \approx 30,\quad d \approx 10 \Rightarrow 30^{10} \approx 5.9 \times 10^{14}  
$$

→ 완전 탐색 불가능

Alpha-Beta Pruning은 **이미 더 나쁜 결과가 확정된 branch**를 잘라버려 탐색 노드를 극적으로 줄인다.

---

## 2. Alpha(α)와 Beta(β)의 의미

Alpha-Beta에는 두 개의 값이 등장한다.

$$  
\alpha = \text{MAX가 현재까지 확보 가능한 best value}  
$$
$$  
\beta = \text{MIN이 현재까지 허용할 수 있는 best value}  
$$

더 직관적으로 보면:

| 변수       | 의미                           |
| -------- | ---------------------------- |
| $\alpha$ | MAX가 보장받을 수 있는 **최소 점수 하한선** |
| $\beta$  | MIN이 허용할 수 있는 **최대 점수 상한선**  |

초기값:

$$  
\alpha = -\infty,\quad \beta = +\infty  
$$

그리고 핵심 가지치기 조건:

$$  
\alpha \ge \beta \Rightarrow \text{Prune}  
$$

즉,

> 이 노드를 더 봐도 더 좋은 결과가 나올 가능성이 없으면 잘라버린다.

---

## 3. 작동 원리 (수식 포함)

Alpha-Beta는 Minimax의 수식에 $\alpha, \beta$ 조건만 추가된다.

MAX node에서:

$$  
\alpha = \max(\alpha, V(child))  
$$

MIN node에서:

$$  
\beta = \min(\beta, V(child))  
$$

그리고 매 step마다:

$$  
\text{if } \alpha \ge \beta: \text{ break (prune)}  
$$

즉, 계산 방식 자체는 Minimax와 나머지는 동일하고, 단지 **중간에 종료 조건이 추가된 것 뿐이다.**

---

## 4. 직관적 비유

MAX의 입장:

> "이미 이 값(α)보다 나은 결과가 보장되는데, 이 branch에서 그보다 나으면 상대는 절대 이 방향을 허용하지 않을 거야."

MIN의 입장:

> "이미 이 값(β)보다 나쁜 결과라면, 그 길은 애초에 허용하지 않을 거야."

그래서 **굳이 끝까지 계산하지 않아도 된다.**

---

## 5. 숫자 예시로 이해하기

다음과 같은 트리가 있다고 하자.

```
                MAX
          /               \
       MIN                 MIN
   /      \            /       \
  3        5           2        100
```

순서대로 탐색한다고 하자.

### Step 1. 왼쪽 subtree

왼쪽 MIN에서:

$$  
\min(3, 5) = 3  
$$

그래서

$$  
\alpha = 3  
$$

---

### Step 2. 오른쪽 subtree 첫 번째 값

오른쪽 MIN의 첫 child: **2**

이때

$$  
\beta = 2  
$$

하지만

$$  
\beta (2) \le \alpha (3)  
$$

즉,

$$  
\alpha \ge \beta \Rightarrow \text{Prune 발생}  
$$

그래서 오른쪽의 **100은 볼 필요도 없다.**

결과는 동일하게:

```
MAX = max(3, 2) = 3
```

하지만 탐색은 훨씬 빨라졌다.

---

## 6. 최고의 경우와 최악의 경우

Alpha-Beta의 성능은 **탐색 순서**에 따라 달라진다.

|경우|시간복잡도|
|---|---|
|최악의 경우|$O(b^d)$ (Minimax와 동일)|
|최고의 경우|$O(b^{d/2})$|

즉, 탐색 순서가 잘 정렬되면 깊이를 절반 수준으로 줄일 수 있어 **게임 난이도가 완전 다르게 변한다.**

이걸 개선하기 위해 사용하는 것이:

- Move Ordering
    
- Heuristic evaluation
    
- Iterative Deepening
    

---

## 7. 딥러닝과 연결

AlphaGo / AlphaZero 구조:

- Alpha-Beta 대신 MCTS
    
- 하지만 기본 철학은 동일:
    
    - **불필요한 영역은 쳐다보지 않는다**
        
    - **유망한 영역만 깊게 본다**
        

Alpha-Beta는 Tree Search + AI 설계의 출발점 같은 개념이다.

---

# ✅ 요약

- Alpha-Beta Pruning은 Minimax의 결과를 유지하면서 계산량을 줄이는 방법
    
- 핵심은 두 개의 값
    

$$  
\alpha = MAX의 최선,\quad \beta = MIN의 최선  
$$

- 가지치기 조건은
    

$$  
\alpha \ge \beta  
$$

- 잘 적용되면 시간복잡도는
    

$$  
O(b^d) \rightarrow O(b^{d/2})  
$$

까지 감소 가능

---

# 더 찾아보면 좋은 개념들

- [[02_Algorithms/01_minimax_algorithm|01_minimax_algorithm]]
- Move Ordering
- Heuristic Functions
- Monte Carlo Tree Search (MCTS)
- Iterative Deepening
- Transposition Table
- Expectimax
- AlphaZero / MuZero
- Reinforcement Learning Tree Search
    

---

# Example

```python
import math
import random

BOARD_SIZE = 9
WINNING_CONDITION = 5

EMPTY = '.'
AI = 'X'
PLAYER = 'O'


# ------------------ Board Utilities ------------------

def create_board():
    return [[EMPTY for _ in range(BOARD_SIZE)] for _ in range(BOARD_SIZE)]


def print_board(board):
    print("\n   " + " ".join(map(str, range(BOARD_SIZE))))
    for i, row in enumerate(board):
        print(f"{i}  " + " ".join(row))
    print()


def get_valid_moves(board):
    moves = []
    for i in range(BOARD_SIZE):
        for j in range(BOARD_SIZE):
            if board[i][j] == EMPTY:
                moves.append((i, j))
    return moves


def make_move(board, x, y, player):
    board[x][y] = player


def undo_move(board, x, y):
    board[x][y] = EMPTY


# ------------------ Winning Check ------------------

def check_line(board, x, y, dx, dy, player):
    count = 0
    for i in range(-4, 5):
        nx = x + dx * i
        ny = y + dy * i
        if 0 <= nx < BOARD_SIZE and 0 <= ny < BOARD_SIZE:
            if board[nx][ny] == player:
                count += 1
                if count == WINNING_CONDITION:
                    return True
            else:
                count = 0
    return False


def check_win(board, player):
    for x in range(BOARD_SIZE):
        for y in range(BOARD_SIZE):
            if board[x][y] == player:
                if (check_line(board, x, y, 1, 0, player) or     # horizontal
                    check_line(board, x, y, 0, 1, player) or     # vertical
                    check_line(board, x, y, 1, 1, player) or     # diag ↘
                    check_line(board, x, y, 1, -1, player)):     # diag ↗
                    return True
    return False


def is_terminal(board):
    return check_win(board, AI) or check_win(board, PLAYER) or len(get_valid_moves(board)) == 0


# ------------------ Heuristic Evaluation ------------------

def count_sequence(board, player, length):
    count = 0
    for x in range(BOARD_SIZE):
        for y in range(BOARD_SIZE):
            if board[x][y] == player:
                for dx, dy in [(1,0),(0,1),(1,1),(1,-1)]:
                    seq = 0
                    for k in range(length):
                        nx, ny = x + dx*k, y + dy*k
                        if 0 <= nx < BOARD_SIZE and 0 <= ny < BOARD_SIZE:
                            if board[nx][ny] == player:
                                seq += 1
                    if seq == length:
                        count += 1
    return count


def evaluate_board(board):
    if check_win(board, AI):
        return 10000
    if check_win(board, PLAYER):
        return -10000

    ai_score = (
        count_sequence(board, AI, 4) * 100 +
        count_sequence(board, AI, 3) * 10 +
        count_sequence(board, AI, 2)
    )

    opp_score = (
        count_sequence(board, PLAYER, 4) * 100 +
        count_sequence(board, PLAYER, 3) * 10 +
        count_sequence(board, PLAYER, 2)
    )

    return ai_score - opp_score


# ------------------ Minimax + AlphaBeta ------------------

def minimax(board, depth, alpha, beta, is_maximizing):

    if depth == 0 or is_terminal(board):
        return evaluate_board(board)

    if is_maximizing:
        max_eval = -math.inf
        for (x, y) in get_valid_moves(board):
            make_move(board, x, y, AI)
            eval = minimax(board, depth-1, alpha, beta, False)
            undo_move(board, x, y)

            max_eval = max(max_eval, eval)
            alpha = max(alpha, eval)

            if beta <= alpha:
                break   # ✂ alpha-beta pruning

        return max_eval

    else:
        min_eval = math.inf
        for (x, y) in get_valid_moves(board):
            make_move(board, x, y, PLAYER)
            eval = minimax(board, depth-1, alpha, beta, True)
            undo_move(board, x, y)

            min_eval = min(min_eval, eval)
            beta = min(beta, eval)

            if beta <= alpha:
                break

        return min_eval


def best_ai_move(board, depth=3):

    best_value = -math.inf
    best_move = None

    for (x, y) in get_valid_moves(board):
        make_move(board, x, y, AI)
        move_val = minimax(board, depth-1, -math.inf, math.inf, False)
        undo_move(board, x, y)

        if move_val > best_value:
            best_value = move_val
            best_move = (x, y)

    return best_move


# ------------------ Game Loop ------------------

def play():

    board = create_board()
    print("\nGOMOKU START (You = O, AI = X)\n")

    while True:
        print_board(board)

        if check_win(board, AI):
            print("AI wins!")
            break

        if check_win(board, PLAYER):
            print("You win!")
            break

        # Player move
        x, y = map(int, input("Your move: ").split())
        if board[x][y] != EMPTY:
            print("Invalid move")
            continue
        make_move(board, x, y, PLAYER)

        if is_terminal(board):
            continue

        # AI move
        print("\nAI thinking...")
        ai_move = best_ai_move(board, depth=3)
        make_move(board, ai_move[0], ai_move[1], AI)


if __name__ == "__main__":
    play()


```