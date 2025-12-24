## 1. 서론: 배경 및 문제 제기 (Motivation)

정렬되지 않은 데이터 집합에서 **최댓값(Maximum) 또는 최솟값(Minimum)을 반복적으로 빠르게 꺼내야 하는 문제**는 운영체제 스케줄링, 이벤트 시뮬레이션, 그래프 알고리즘(Dijkstra, A*) 등에서 빈번히 등장합니다.  
배열이나 연결 리스트에서 이를 수행하면, 극값 탐색에 매번 $O(N)$이 필요해 전체 복잡도가 비효율적으로 증가합니다. 완전 이진 탐색 트리(Balanced BST)는 평균적으로 $O(\log N)$를 제공하지만, 균형 유지 비용이 높고 구현이 상대적으로 복잡합니다.

이러한 한계를 해결하기 위해 등장한 구조가 **Heap**이며, 특히 **Priority Queue**의 내부 구현으로 표준화되어 왔습니다. Heap은 “완전 이진 트리(Complete Binary Tree)”의 형태를 유지하면서 **부모-자식 간의 우선순위 관계**(Max-Heap 또는 Min-Heap)를 강제하여, **삽입(Insertion)**과 **삭제(Extract/Pop)**를 $O(\log N)$에 처리합니다.

핵심 문제는 다음으로 요약됩니다:

> 정렬된 구조를 유지하지 않고도, **우선순위가 가장 높은 원소를 빠르게 접근하고 갱신할 수 있는 방법은 무엇인가?**

Heap은 이 문제에 대한 구조적 답입니다.

---

## 2. 이론 및 핵심 논리 (Theoretical Framework)

### 2.1 Heap의 정의 (Formal Definition)

크기 $N$의 Heap을 $H = {h_1, h_2, \dots, h_N}$라 할 때, Heap은 두 가지 속성을 만족해야 합니다:

1. **Complete Binary Tree Property**  
    모든 레벨이 왼쪽부터 채워진 **Complete Binary Tree** 형태
    
2. **Heap Order Property**
    
    - **Max-Heap**: 모든 노드에 대해 $h_{\text{parent}} \ge h_{\text{child}}$
    - **Min-Heap**: 모든 노드에 대해 $h_{\text{parent}} \le h_{\text{child}}$
        

즉, 루트 노드 $h_1$는 항상 전체에서 최댓값 혹은 최솟값입니다.

---

### 2.2 배열 기반 표현 (Array Representation)

Heap은 포인터 기반 트리가 아닌 **배열(Array)**로 효율적으로 구현됩니다:

- 부모 인덱스: $\left\lfloor \frac{i}{2} \right\rfloor$
    
- 왼쪽 자식: $2i$
    
- 오른쪽 자식: $2i + 1$
    

이것은 완전 이진 트리의 구조적 특성에서 자연스럽게 도출됩니다.

이 방식은 노드 간 포인터 저장이 필요 없으므로 **Cache-friendly**하며, 메모리 사용량 또한 최소화됩니다.

---

### 2.3 삽입 연산: Percolate Up (Heapify-up)

새 원소 $x$를 삽입하면 마지막 위치 $i=N+1$에 배치된 후, Heap 조건 복원을 위해 루트 방향으로 이동합니다.

수식적으로 표현하면 다음 과정을 수행합니다:

$$  
\text{while } i > 1 \text{ and } h_i > h_{\lfloor i/2 \rfloor} \text{: swap}(h_i, h_{\lfloor i/2 \rfloor}),; i \leftarrow \lfloor i/2 \rfloor  
$$

트리의 높이가 $h = \log_2 N$이므로, 시간 복잡도는:

$$  
T_{\text{insert}}(N) = O(\log N)  
$$

이 과정은 **local structure repair**에 불과하며 전체 정렬을 필요로 하지 않습니다.

---

### 2.4 삭제 연산: Percolate Down (Heapify-down)

루트 노드를 제거하면 마지막 노드가 루트로 이동하고, 자식들과의 정렬 위반을 수정합니다.

수식적으로는 다음을 반복합니다:

$$  
i = 1  
$$  
$$  
\text{while } 2i \le N:  
$$  
$$  
\quad j = \arg\max(h_{2i}, h_{2i + 1}) ;;(\text{for Max Heap})  
$$  
$$  
\quad \text{if } h_i < h_j: \text{ swap}(h_i, h_j)  
$$  
$$  
\quad i = j  
$$

역시 높이에 비례하므로:

$$  
T_{\text{delete}}(N) = O(\log N)  
$$

Heap이 효율적인 이유는 항상 **국소적인 비교 연산**만 수행하며, 전체 구조를 재정렬하지 않기 때문입니다.

---

## 3. 구현 또는 예시 (Implementation / Example)

다음은 Max-Heap의 핵심 연산을 Python 스타일로 구현한 예시입니다:

```python
class MaxHeap:
    def __init__(self):
        self.heap = [None]  # 인덱스 1부터 사용

    def insert(self, value):
        self.heap.append(value)              # 1. 마지막에 삽입
        idx = len(self.heap) - 1

        # 2. 부모보다 크면 위로 올라간다 (Heapify Up)
        while idx > 1:
            parent = idx // 2
            if self.heap[parent] < self.heap[idx]:
                self.heap[parent], self.heap[idx] = self.heap[idx], self.heap[parent]
                idx = parent
            else:
                break

    def extract_max(self):
        if len(self.heap) == 1:
            return None

        # 1. 루트와 마지막 노드 교체
        root = self.heap[1]
        last = self.heap.pop()

        if len(self.heap) == 1:
            return root

        self.heap[1] = last
        idx = 1

        # 2. Heapify Down
        while True:
            left = 2 * idx
            right = 2 * idx + 1
            largest = idx

            if left < len(self.heap) and self.heap[left] > self.heap[largest]:
                largest = left

            if right < len(self.heap) and self.heap[right] > self.heap[largest]:
                largest = right

            if largest != idx:
                self.heap[idx], self.heap[largest] = self.heap[largest], self.heap[idx]
                idx = largest
            else:
                break

        return root
```

이 구조는 Python의 `heapq` 모듈(Min-Heap)이나 C++의 `priority_queue`와 동일한 논리로 작동합니다.  
Dijkstra, A*, Top-K problem 등에서 핵심 자료구조로 활용됩니다.

---

## 4. 마무리: 요약 및 제언 (Conclusion)

- Heap은 **정렬 없이도 최댓값/최솟값을 빠르게 찾기 위한 구조**입니다.
- 배열 기반의 Complete Binary Tree는 메모리와 성능 면에서 매우 효율적입니다.
- 삽입과 삭제 모두 국소적인 재배치만 수행하므로 $O(\log N)$을 보장합니다.
- 그래프 탐색, 스케줄링, Top-K 문제 등에서 핵심적인 역할을 합니다.
    

실무적으로는 단일 Heap보다 **Binary Heap + Hash Map**, **Fibonacci Heap**, **Segment Tree vs Heap** 등의 조합을 통해 성능과 기능을 확장하는 경우가 많습니다. 특히 대규모 데이터 스트림 처리에서는 **Heap + Sliding Window 구조**가 자주 활용됩니다.

### Further Reading

- Fibonacci Heap & Amortized Complexity
- Dijkstra with Binary Heap vs Priority Queue
- Top-K Algorithms in Streaming Systems