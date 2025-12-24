# Longest Increasing Subsequence (LIS) 완전 정복: DP에서 $O(n \log n)$ 최적화까지

안녕하세요. 오늘은 알고리즘 설계와 분석의 정수라고 할 수 있는 **Longest Increasing Subsequence (LIS, 최장 증가 부분 수열)** 문제를 깊이 있게 다루어 보겠습니다. 이 포스트는 단순한 정의를 넘어, 왜 이 문제가 중요한지, 그리고 최적화 과정에서 어떤 수학적 직관이 작용하는지를 중점적으로 다룹니다.

---

## 1. Motivation: 왜 이 주제인가?

LIS 문제는 단순히 숫자를 나열하는 문제를 넘어, **데이터 사이의 순서(Order)와 구조(Structure)**를 파악하는 핵심 모델입니다.

- **실무적 응용:** 두 서열 사이의 유사성을 측정하는 **Sequence Alignment**나, 소스 코드의 차이를 계산하는 **Diff** 도구의 기반이 되는 LCS(Longest Common Subsequence)와 밀접하게 연관되어 있습니다.
    
- **이론적 가치:** $O(n^2)$의 동적 계획법(Dynamic Programming) 설계를 $O(n \log n)$으로 최적화하는 과정은 **이진 탐색(Binary Search)**과 **그리디(Greedy)** 전략이 어떻게 결합되어 효율성을 극대화하는지 보여주는 교과서적인 사례입니다.
    
- **조합론적 통찰:** LIS의 길이는 **Dilworth's Theorem**에 의해 수열을 덮기 위한 최소 감소 부분 수열의 개수와 같다는 점 등, 고급 알고리즘 연구에서 빈번히 인용되는 주제입니다.
    

---

## 2. Theoretical Deep-dive: 핵심 원리와 수식

### 2.1 Problem Definition

주어진 수열 $A = [a_1, a_2, \dots, a_n]$에 대해, 다음 조건을 만족하는 부분 수열 $S = [a_{i_1}, a_{i_2}, \dots, a_{i_k}]$ 중 길이 $k$가 최대인 것을 찾는 문제입니다.

$$1 \le i_1 < i_2 < \dots < i_k \le n \quad \text{and} \quad a_{i_1} < a_{i_2} < \dots < a_{i_k}$$

### 2.2 Naive Dynamic Programming ($O(n^2)$)

가장 직관적인 접근은 각 원소 $a_i$를 마지막 원소로 가지는 LIS의 길이를 저장하는 방식입니다.

점화식(Recurrence Relation):

$$DP[i] = 1 + \max(\{DP[j] \mid j < i, A[j] < A[i]\} \cup \{0\})$$

이 방식은 **Optimal Substructure**를 가집니다. $i$번째 원소까지의 최적해는 이전 단계들($j < i$)의 최적해들로부터 유도됩니다. 그러나 $i$마다 이전 모든 $j$를 탐색해야 하므로 시간 복잡도는 $T(n) = \sum_{i=1}^{n} O(i) = O(n^2)$이 됩니다.

### 2.3 Optimization via Binary Search ($O(n \log n)$)

수열의 길이가 $10^5$을 넘어가는 대규모 데이터셋에서는 $O(n^2)$을 사용할 수 없습니다. 이를 위해 **Patience Sorting**의 아이디어를 차용한 최적화 기법을 도입합니다.

**핵심 아이디어:** 길이가 $L$인 증가 부분 수열들 중, 그 **마지막 원소(Tail)의 값이 작을수록** 다음에 올 원소를 선택할 때 유리합니다.

이를 위해 배열 $T$를 다음과 같이 정의합니다.

> $T[k] = \text{길이가 } k \text{인 증가 부분 수열들이 가질 수 있는 마지막 원소 중 최솟값}$

**속성:**

1. $T$는 항상 엄격히 증가하는 형태를 유지합니다 ($T[1] < T[2] < \dots$).
    
2. 새로운 원소 $x$가 들어올 때:
    
    - 만약 $x > T[\text{last}]$, $T$의 끝에 $x$를 추가합니다.
        
    - 그렇지 않다면, $T[i] \ge x$를 만족하는 최소의 $i$를 찾아 $T[i]$를 $x$로 업데이트합니다 (**Binary Search** 활용).
        

---

## 3. Implementation: 이론을 코드로

Python의 `bisect` 모듈을 활용하여 $O(n \log n)$ 알고리즘을 구현한 예시입니다. 연구적 관점에서 메모리 효율을 위해 별도의 DP 테이블 대신 최소 Tail 값을 관리하는 리스트만 유지합니다.

Python

```
import bisect
from typing import List

def find_lis_length(nums: List[int]) -> int:
    if not nums:
        return 0

    # tails[i]는 길이가 i+1인 모든 증가 부분 수열의 마지막 원소 중 최솟값을 저장
    tails = []

    for x in nums:
        # 이진 탐색을 통해 x가 들어갈 위치(Lower Bound)를 탐색
        # tails 배열이 정렬된 상태를 유지하므로 log(N) 복잡도 보장
        idx = bisect.bisect_left(tails, x)
        
        if idx < len(tails):
            # 기존의 tail 값을 더 작은 값으로 교체 (Greedy Update)
            tails[idx] = x
        else:
            # 현재까지의 어떤 수열보다 큰 값이면 길이를 확장
            tails.append(x)
            
    return len(tails)

# 실험 및 결과 확인
if __name__ == "__main__":
    sample_data = [10, 9, 2, 5, 3, 7, 101, 18]
    result = find_lis_length(sample_data)
    print(f"LIS Length for {sample_data}: {result}") # Output: 4 ([2, 3, 7, 18] or [2, 5, 7, 18])
```

### 구현 인사이트 (Insight)

- **Greedy & Binary Search:** 위 구현에서 `tails` 배열의 실제 요소들이 LIS 그 자체를 의미하지는 않습니다. 하지만 `tails`의 **길이**는 항상 정답과 일치함이 수학적으로 증명되어 있습니다.
    
- **경로 추적 (Path Reconstruction):** 만약 실제 수열이 필요하다면, 각 원소가 `tails`에 들어갈 때의 인덱스를 별도 배열에 저장하고 역추적(Backtracking)하는 과정을 추가해야 합니다.
    

---

## 4. Reflections: 정리 및 확장

LIS 문제는 단순한 알고리즘을 넘어 **부분 순서 집합(Partially Ordered Set, Poset)**의 이론적 배경을 이해하는 좋은 출발점입니다.

### Further Study

1. **Dilworth's Theorem:** LIS의 최대 길이는 수열을 덮는 최소 '반사슬(Antichain, 여기서는 감소 부분 수열)'의 개수와 같다는 정리를 공부하면 문제의 대칭성을 이해할 수 있습니다.
    
2. **2D LIS (Russian Doll Envelopes):** 너비와 높이가 모두 커야 하는 2차원 조건에서의 LIS 확장 문제를 풀어보며 다차원 데이터 정렬 기법을 익히시길 권장합니다.
    
3. **Segment Tree / Fenwick Tree 기반 LIS:** 이진 탐색 대신 세그먼트 트리를 사용하여 $O(n \log n)$을 구현하는 방식은 구간 쿼리가 필요한 변형 문제에서 강력한 도구가 됩니다.
    

**핵심 통찰:** 최적화의 본질은 **"불필요한 정보를 버리는 것"**에 있습니다. $O(n^2)$ DP가 모든 인덱스의 가능성을 유지했다면, $O(n \log n)$ 알고리즘은 '가능성 있는 최소의 끝값'이라는 핵심 지표(Sufficient Statistic)만을 관리함으로써 효율성을 달성합니다.

---

## References

- Cormen, T. H., et al. _Introduction to Algorithms (CLRS)_, 3rd Edition.
    
- Knuth, D. E. _The Art of Computer Programming, Vol. 3: Sorting and Searching_.
    
- Wikipedia: [Longest Increasing Subsequence](https://en.wikipedia.org/wiki/Longest_increasing_subsequence)
    

---

**더 궁금한 점이 있으신가요?** 예를 들어, 실제 LIS 경로를 역추적하는 `Backtracking` 구현 코드나 2차원 LIS 문제로의 확장이 필요하시면 말씀해 주세요. 다음 단계로 안내해 드리겠습니다.