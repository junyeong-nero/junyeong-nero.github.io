## [LCS] Longest-Common-Subsequence: 이론적 엄밀함에서 최적화 구현까지

### 1. Motivation: 왜 이 주제인가?

컴퓨터 과학에서 '두 개의 시퀀스(Sequence)가 얼마나 유사한가?'를 판단하는 문제는 매우 근본적이면서도 실용적인 질문입니다. 텍스트 파일의 차이를 비교하는 `diff` 유틸리티, 버전 관리 시스템(Git)의 병합 알고리즘, 그리고 생물정보학(Bioinformatics)에서 DNA나 단백질 서열의 진화적 연관성을 분석하는 Sequence Alignment 작업의 기저에는 모두 이 질문이 자리 잡고 있습니다.

Longest-Common-Subsequence(이하 LCS) 문제는 이러한 유사도 측정의 가장 기초가 되는 모델입니다. 두 시퀀스에서 순서를 유지하되 연속적일 필요는 없는 부분 시퀀스(Subsequence) 중 가장 긴 것을 찾아내는 작업입니다.

왜 다시 들여다보는가?

학부 시절 알고리즘 수업에서 LCS를 처음 접했을 때, 직관적으로는 이해했지만 엄밀한 수식적 빌드업(Build-up)을 소홀히 넘겼던 기억이 있습니다. 단순히 "대각선 위를 보거나 왼쪽/위쪽 중 큰 값을 가져온다"는 식의 기계적 암기로는, 더 복잡한 변형 문제나 대규모 데이터에 대한 최적화 요구에 대응하기 어렵습니다.

예를 들어, 길이 $N$인 두 문자열의 모든 부분 시퀀스를 비교하는 Naïve한 접근법은 부분 시퀀스의 개수가 $2^N$에 달하므로 $O(N \cdot 2^N)$이라는 지수 시간 복잡도를 가집니다. 이는 현실적인 데이터 규모에서는 동작 불가능합니다.

본 포스트에서는 LCS 문제를 **동적 계획법(Dynamic Programming, DP)**의 관점에서 엄밀하게 재정의하고, 이를 통해 다항 시간(Polynomial Time) 복잡도로 해결하는 과정을 논리적으로 서술하고자 합니다. 또한, 연구나 실무 환경에서 필수적인 공간 복잡도 최적화 기법까지 다루어, 단순한 문제 해결을 넘어 '효율적인' 해결책을 모색하는 과정을 정리합니다.

---

### 2. Theoretical Deep-dive: 핵심 원리와 수식

LCS 문제 해결의 핵심은 큰 문제를 작은 부분 문제들로 나누어 푸는 **동적 계획법(Dynamic Programming)**에 있습니다. DP가 성립하기 위한 두 가지 핵심 조건인 **Optimal Substructure**와 **Overlapping Subproblems** 속성을 LCS가 어떻게 만족하는지 살펴보겠습니다.

#### 2.1. 문제 정의 및 표기법 (Notation)

두 개의 시퀀스 $X$와 $Y$가 주어졌다고 가정합니다.

- $X = \langle x_1, x_2, \dots, x_m \rangle$ (길이 $m$)
    
- $Y = \langle y_1, y_2, \dots, y_n \rangle$ (길이 $n$)
    

$X$의 $i$번째 접두사(prefix)를 $X_i = \langle x_1, x_2, \dots, x_i \rangle$로 표기합니다. (단, $X_0$은 빈 시퀀스)

우리의 목표는 $X$와 $Y$의 최대 공통 부분 시퀀스의 길이, 즉 $LCS(X, Y)$의 길이를 구하는 것입니다.

#### 2.2. Optimal Substructure의 발견

가장 긴 공통 부분 시퀀스를 찾는 문제는 시퀀스의 마지막 원소를 기준으로 부분 문제로 나눌 수 있습니다. $X_m$과 $Y_n$의 마지막 원소인 $x_m$과 $y_n$을 비교해 봅시다.

Case 1: $x_m = y_n$ 인 경우

두 시퀀스의 마지막 원소가 같다면, 이 원소는 반드시 LCS의 마지막 원소가 되어야 합니다. 따라서 이 원소를 LCS에 포함시키고, 나머지 앞부분($X_{m-1}$과 $Y_{n-1}$)에서 LCS를 찾으면 됩니다.

> **직관:** 마지막이 같으면 일단 하나 확보하고(+1), 앞쪽 상황을 보면 된다.

Case 2: $x_m \neq y_n$ 인 경우

마지막 원소가 다르다면, $x_m$과 $y_n$이 동시에 LCS의 마지막 원소가 될 수는 없습니다.

- $x_m$이 LCS에 포함되지 않는다면, 우리는 $LCS(X_{m-1}, Y_n)$을 찾아야 합니다.
    
- $y_n$이 LCS에 포함되지 않는다면, 우리는 $LCS(X_m, Y_{n-1})$을 찾아야 합니다.
    
    우리는 가장 긴 것을 찾으므로, 이 두 경우 중 더 큰 값을 선택합니다.
    

> **직관:** 마지막이 다르면, $X$의 끝을 하나 버려보거나 $Y$의 끝을 하나 버려본 후 더 좋은 결과를 가져온다.

이 논리는 LCS 문제가 Optimal Substructure를 가짐을 증명합니다. 전체 문제의 최적해가 부분 문제의 최적해로부터 구성되기 때문입니다.

#### 2.3. 점화식 (Recurrence Relation) 도출

위의 논리를 바탕으로, $X_i$와 $Y_j$의 LCS 길이를 저장하는 2차원 배열 $c[i, j]$를 정의하면 다음과 같은 점화식을 얻을 수 있습니다.

$$c[i, j] = \begin{cases} 0 & \text{if } i=0 \text{ or } j=0 \\ c[i-1, j-1] + 1 & \text{if } i,j>0 \text{ and } x_i = y_j \\ \max(c[i, j-1], c[i-1, j]) & \text{if } i,j>0 \text{ and } x_i \neq y_j \end{cases}$$

- **기저 조건 (Base Case):** $i=0$ 또는 $j=0$일 때, 즉 한쪽 시퀀스가 비어있으면 공통 부분 시퀀스의 길이는 0입니다.
    
- 이 점화식을 통해 작은 인덱스부터 $c[m, n]$까지 반복적으로(iteratively) 값을 채워나갈 수 있습니다. (Bottom-up 방식)
    

#### 2.4. 복잡도 분석

- **시간 복잡도:** $(m+1) \times (n+1)$ 크기의 테이블을 채워야 하며, 각 셀을 계산하는 데 $O(1)$의 시간이 걸립니다. 따라서 총 시간 복잡도는 $O(mn)$입니다.
    
- **공간 복잡도:** 전체 테이블을 저장하기 위해 $O(mn)$의 공간이 필요합니다.
    

$O(mn)$은 지수 시간에 비하면 훌륭하지만, $m, n$이 매우 큰 경우(예: 유전체 데이터) 메모리 병목이 발생할 수 있습니다.

---

### 3. Implementation: 이론을 코드로

연구 환경에서는 `numpy`와 같이 수치 해석에 최적화된 라이브러리를 활용하는 것이 행렬 연산을 다룰 때 직관적이고 효율적입니다.

#### 3.1. 표준 DP 구현 (길이 계산 및 역추적)

이 구현은 $O(mn)$ 공간을 사용하여 DP 테이블 전체를 구성합니다. 이는 LCS의 길이뿐만 아니라 실제 어떤 문자들이 LCS를 구성하는지 역추적(Backtracking)하기 위해 필요합니다.

Python

```
import numpy as np

def find_lcs_standard(seq1, seq2):
    """
    표준 DP 방식을 이용한 LCS 길이 계산 및 시퀀스 역추적
    Time Complexity: O(m*n), Space Complexity: O(m*n)
    """
    m = len(seq1)
    n = len(seq2)
    
    # DP 테이블 초기화 (0번째 행/열은 기저 조건을 위해 0으로 패딩)
    # c[i, j]는 seq1[:i]와 seq2[:j]의 LCS 길이를 저장
    c = np.zeros((m + 1, n + 1), dtype=int)
    
    # --- DP 테이블 채우기 (Bottom-up) ---
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            # 주의: 수식의 x_i는 코드의 seq1[i-1]에 해당
            if seq1[i-1] == seq2[j-1]:
                # 문자가 같으면 대각선 위 값 + 1
                c[i, j] = c[i-1, j-1] + 1
            else:
                # 다르면 왼쪽 혹은 위쪽 중 큰 값 선택
                c[i, j] = max(c[i-1, j], c[i, j-1])
                
    lcs_length = c[m, n]
    
    # --- LCS 역추적 (Backtracking) ---
    # 완성된 DP 테이블의 끝에서부터 시작점으로 거슬러 올라감
    lcs_seq = []
    i, j = m, n
    while i > 0 and j > 0:
        if seq1[i-1] == seq2[j-1]:
            # 문자가 같아서 선택된 경우 (대각선 이동)
            lcs_seq.append(seq1[i-1])
            i -= 1
            j -= 1
        elif c[i-1, j] > c[i, j-1]:
            # 위쪽 값이 더 커서 위로 이동한 경우
            i -= 1
        else:
            # 왼쪽 값이 더 크거나 같아서 왼쪽으로 이동한 경우
            j -= 1
            
    # 역추적했으므로 순서를 뒤집어야 함
    return lcs_length, "".join(reversed(lcs_seq))

# --- 실행 예시 ---
X = "ABCBDAB"
Y = "BDCABA"
length, sequence = find_lcs_standard(X, Y)
print(f"Sequence 1: {X}")
print(f"Sequence 2: {Y}")
print(f"LCS Length: {length}")
print(f"LCS Sequence: {sequence}")
# Expected Output: LCS Length: 4, LCS Sequence: BCBA (or BDAB, BCAB)
```

#### 3.2. 공간 최적화 구현 (Insightful Implementation)

만약 LCS의 **길이만** 필요하다면, $O(mn)$의 공간을 모두 사용할 필요가 없습니다.

**Insight:** 점화식을 다시 살펴보면, $c[i, j]$를 계산하기 위해 필요한 정보는 오직 직전 행($i-1$행)과 현재 행의 직전 열($j-1$열) 정보뿐입니다. 즉, 테이블을 채워 나갈 때 항상 **두 개의 행**만 메모리에 유지하면 충분합니다.

더 나아가, 하나의 행을 업데이트해 나가는 방식으로 $O(\min(m, n))$ 공간 복잡도 구현이 가능합니다. 아래는 그 구현입니다.

Python

```
def find_lcs_length_optimized(seq1, seq2):
    """
    공간 복잡도를 최적화하여 LCS 길이만 계산
    Time Complexity: O(m*n), Space Complexity: O(min(m, n))
    """
    # 공간 효율성을 위해 더 짧은 시퀀스를 기준으로 열(column)을 설정
    if len(seq1) < len(seq2):
        seq1, seq2 = seq2, seq1
        
    m = len(seq1)
    n = len(seq2)
    
    # 현재 행(current)과 이전 행(previous)의 정보만 저장
    # prev[j]는 수식의 c[i-1, j]에 해당
    # curr[j]는 수식의 c[i, j]에 해당
    prev = np.zeros(n + 1, dtype=int)
    curr = np.zeros(n + 1, dtype=int)
    
    for i in range(1, m + 1):
        for j in range(1, n + 1):
            if seq1[i-1] == seq2[j-1]:
                # 대각선 위: prev[j-1] 사용
                curr[j] = prev[j-1] + 1
            else:
                # 위쪽: prev[j], 왼쪽: curr[j-1] 사용
                curr[j] = max(prev[j], curr[j-1])
        
        # 다음 행 계산을 위해 현재 행을 이전 행으로 업데이트
        # np.copy를 사용하여 깊은 복사 수행
        prev = np.copy(curr)
        
    return curr[n]

# --- 실행 예시 ---
X = "AGGTAB"
Y = "GXTXAYB"
length_opt = find_lcs_length_optimized(X, Y)
print(f"\nOptimized LCS Length: {length_opt}") # Expected: 4 (GTAB)
```

이 최적화는 메모리 사용량을 획기적으로 줄여주지만, 전체 테이블 정보가 소실되므로 표준적인 역추적 방식으로는 LCS 시퀀스 자체를 복원할 수 없다는 한계가 있습니다.

---

### 4. Reflections: 정리 및 확장

LCS 문제는 동적 계획법의 교과서적인 예제이면서, 동시에 현실 세계의 '비교' 문제를 추상화하는 강력한 도구입니다. 본 포스트에서는 지수 시간의 무작위 접근이 DP의 메모이제이션(Memoization)을 통해 어떻게 다항 시간으로 단축되는지 수식적으로 확인했고, 더 나아가 불필요한 메모리 사용을 줄이는 최적화 기법까지 살펴보았습니다.

**핵심 요약:**

1. LCS는 **Optimal Substructure**를 가지므로 DP로 해결 가능하다.
    
2. 기본 DP 접근법은 **$O(mn)$의 시간과 공간**을 사용한다.
    
3. 길이만 구할 경우, 직전 상태만 기억하는 테크닉으로 **공간 복잡도를 $O(\min(m, n))$으로 최적화**할 수 있다.
    

한계점:

표준 LCS는 문자의 '일치 여부'만 판단합니다. 하지만 실제 생물학적 서열이나 자연어 처리에서는 단순 불일치 외에 '삽입(Insertion)', '삭제(Deletion)', '대체(Substitution)'와 같은 다양한 변이가 발생하며, 각 변이에 다른 가중치(페널티)를 부여해야 하는 경우가 많습니다. LCS는 이러한 일반화된 문제의 특수한 경우로 볼 수 있습니다.

#### Further Study: 함께 학습하면 좋은 주제

1. **편집 거리 (Edit Distance / Levenshtein Distance):**
    
    - LCS의 개념을 확장하여, 한 시퀀스를 다른 시퀀스로 바꾸는 데 필요한 최소 편집 연산 횟수를 구합니다. 맞춤법 검사기 등에서 두 문자열의 '다름의 정도'를 정량화하는 데 유용합니다.
        
2. **Hirschberg's Algorithm:**
    
    - 앞서 본 공간 최적화 기법은 길이만 알 수 있다는 단점이 있었습니다. Hirschberg 알고리즘은 분할 정복(Divide and Conquer)과 DP를 결합하여, **$O(mn)$ 시간과 선형 공간 $O(\min(m, n))$만으로 LCS 시퀀스 자체를 복원**해내는 매우 스마트한 알고리즘입니다. 대용량 데이터 처리 시 필수적인 기법입니다.
        
3. **LIS (Longest Increasing Subsequence)의 $O(N \log N)$ 해법:**
    
    - LCS 자체는 아니지만, 관련된 DP 문제인 LIS는 기본 $O(N^2)$ DP 해법 외에 이진 탐색을 결합한 $O(N \log N)$ 해법이 존재합니다. DP 문제를 최적화하는 다양한 시각을 기르는 데 큰 도움이 됩니다.
        

### References

- Cormen, T. H., Leiserson, C. E., Rivest, R. L., & Stein, C. (2009). _Introduction to Algorithms_ (3rd ed.). MIT Press. (Chapter 15: Dynamic Programming)
    
- Dasgupta, S., Papadimitriou, C. H., & Vazirani, U. V. (2006). _Algorithms_. McGraw-Hill.