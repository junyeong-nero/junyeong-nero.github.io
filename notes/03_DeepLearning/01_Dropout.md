## Early Stopping: 가장 간단하면서 강력한 Regularization

### 1. Early Stopping이란?

**Early Stopping**은 학습을 끝까지 진행하지 않고, **Validation performance가 더 이상 개선되지 않을 때 학습을 중단하는 기법**이다.  
모델이 Train data를 과도하게 외워 **Overfitting**되기 전 시점에서 멈추도록 하는 **Regularization 방법**으로 볼 수 있다.

핵심 아이디어는 다음 한 문장으로 요약된다.

> Train loss가 아니라 **Validation loss**를 기준으로 “언제 멈출지”를 결정한다.

---

## 2. 왜 Overfitting을 막을 수 있을까?

학습 초반에는 다음과 같은 경향이 있다:

- Train Loss: 계속 감소
- Validation Loss: 감소
    

그러나 어느 시점 이후:

- Train Loss: 계속 감소
- Validation Loss: 증가 (또는 정체)
    

즉, 이 시점부터 모델은 **general pattern이 아니라 noise를 학습**하기 시작한다.
이를 수식으로 보면, test error는

$$  
\text{Test Error} = \text{Bias}^2 + \text{Variance} + \text{Noise}  
$$

학습이 진행될수록:

- Bias는 감소
- Variance는 증가
    

Early Stopping은 **Variance가 커지기 직전에 학습을 멈추는 방식**이다.
따라서:

$$  
\text{Variance} \downarrow,\quad \text{Generalization} \uparrow  
$$

즉, Early Stopping은 **implicit regularization**이다.

---

## 3. Early Stopping의 동작 방식

일반적인 알고리즘은 다음과 같다.

1. 매 epoch마다 Validation loss를 계산한다.
2. 이전 best보다 나아지면 값을 저장한다.
3. $k$번 연속으로 개선되지 않으면 종료한다.
    

이때 사용하는 핵심 파라미터는 다음과 같다:

- **patience**: 몇 epoch 동안 개선을 기다릴지
- **min_delta**: 개선으로 볼 최소 변화량
    

형식적으로 표현하면:
$$  
\text{Stop if: } \forall i \in [t-k, t], \quad L_{val}(i) > L_{best} - \delta  
$$

여기서:

- $k$ = patience
- $\delta$ = min_delta
    

---

## 4. 다른 Regularization과의 관계

Early Stopping은 다음과 비슷한 효과를 낸다:

| 기법                | 효과              |
| ----------------- | --------------- |
| L2 Regularization | Weight size 감소  |
| Dropout           | Ensemble 효과     |
| Early Stopping    | Parameter 성장 제한 |

특히 Linear model에서는 다음과 같은 관계가 있다.

> Gradient Descent + Early Stopping  
> ≈ L2 Regularization 효과

왜냐하면 weight가 커지기 전에 학습을 중단하기 때문이다.

즉:

$$  
||w||_2^2 \text{ 가 커지기 전에 stop}  
$$

하는 것과 같다.

---

## 5. 수식적으로 바라보기 (intuition)

Gradient descent는 반복적으로

$$  
w_{t+1} = w_t - \eta \nabla \mathcal{L}(w_t)  
$$

를 수행한다.

시간이 지날수록 weight는 계속 최적점을 향해 이동하며  
종종 **norm이 커지는 방향**으로 수렴한다.

Early stopping은

$$  
t < t^*  
$$

에서 멈추는 것이며, 이는

$$  
||w_t|| \ll ||w_{opt}||  
$$

인 상태를 유지하는 것과 같다.

결과적으로

$$  
\text{Model Complexity} \downarrow  
$$

---

## 6. 예시로 이해하기

### 예시 1: Loss 그래프

```
Loss
|
|  \         Validation
|   \      /--------
|    \    /
|     \  /
|      \/
|       \
|        \ Train
|____________________ Epoch
```

- Validation loss가 가장 작아지는 지점이 있다
- 그 지점이 **best stopping point**
    

그 이후는 Overfitting 시작

---

### 예시 2: PyTorch 코드

```python
best_loss = float('inf')
patience = 5
counter = 0

for epoch in range(epochs):
    train()
    val_loss = validate()

    if val_loss < best_loss:
        best_loss = val_loss
        counter = 0
        best_model = model.state_dict()
    else:
        counter += 1

    if counter >= patience:
        print("Early stopping triggered")
        break

# restore best model
model.load_state_dict(best_model)
```

이 코드는:

- 최적의 지점의 weight만 유지하고
- 그 이후는 버린다
    

즉, **가장 일반화 성능이 좋은 모델**을 선택한다.

---

## 7. 실제 사용 시 고려사항

- Validation set은 반드시 Train과 분리
- Train loss가 아닌 Validation loss를 기준
- Patience는 너무 작으면 Underfitting
- 너무 크면 Overfitting
    

일반적인 설정:

|상황|권장값|
|---|---|
|작은 모델|patience = 5~10|
|큰 모델|patience = 10~20|
|noisy dataset|min_delta 크게|

---

## 8. 요약

- Early Stopping은 학습을 적절한 시점에서 멈추는 Regularization 기법
- Validation loss를 기준으로 결정한다
- 모델의 Complexity와 Variance를 줄인다
- L2 Regularization과 유사한 효과를 낸다
- 매우 간단하지만 효과가 좋다
    

---

## 9. 더 찾아보면 좋은 개념들

- Overfitting / Underfitting
- [[01_RL/06_Bias_Variance_Tradeoff|06_Bias_Variance_Tradeoff]]
- [[03_DeepLearning/02_Regularization|02_Regularization]]
- [[03_DeepLearning/01_Dropout|01_Dropout]]
- Learning Rate Schedules
- Cross-validation
- Model Checkpoint
- VC Dimension
- Double Descent