## Regularization (L1 / L2 / Weight Decay)

딥러닝 모델은 파라미터 수가 매우 클 수 있어 **Overfitting**이 쉽게 발생한다.  
이를 막기 위해 사용하는 대표적인 방법이 **Regularization (정규화)** 이며,  
그중에서도 가장 널리 쓰이는 것이 **L1, L2, Weight Decay**이다.

이 글에서는 각각의 개념, 수식적 의미, 직관, 그리고 차이점까지 정리한다.

---

## 1. Regularization의 기본 아이디어

기본적인 supervised learning에서 우리가 최소화하려는 것은 보통 다음과 같은 **loss function**이다.

$$  
\mathcal{L}(\theta)  
$$

여기에 penalty term을 추가하면 Regularization이 된다.

$$  
\mathcal{L}_{reg}(\theta) = \mathcal{L}(\theta) + \lambda \cdot \Omega(\theta)  
$$

- $\lambda$ : regularization strength (hyperparameter)
    
- $\Omega(\theta)$ : penalty function (모델 복잡도에 대한 벌점)
    

즉,

> 모델이 너무 복잡해질수록 더 큰 패널티를 부여해서 단순한 모델을 선호하게 만든다.

---

## 2. L2 Regularization (Ridge / Weight Decay류)

### (1) 수식

L2 Regularization은 **가중치의 제곱합**에 패널티를 준다.

$$  
\Omega(\theta) = \sum_{i=1}^{n} w_i^2 = ||\theta||_2^2  
$$

따라서 전체 loss는 다음과 같이 된다.

$$  
\mathcal{L}_{L2} = \mathcal{L}(\theta) + \lambda \sum_{i=1}^n w_i^2  
$$

### (2) 직관적인 의미

- 가중치가 커질수록 penalty가 **제곱에 비례하여 급격히 커짐**
    
- 즉, weight들이 가능한 한 **작은 값을 가지도록 압박**
    
- 하지만 대부분 **0이 되지는 않고**, 그냥 작아진다
    
- 부드럽게 모든 feature를 사용하려는 성향
    

### (3) Gradient 업데이트 형태

L2 Regularization을 포함하면 SGD 업데이트는 다음과 같다.

$$  
w = w - \eta \frac{\partial \mathcal{L}}{\partial w} - \eta \lambda w  
$$

이는 결국,

$$  
w = (1 - \eta \lambda) w - \eta \frac{\partial \mathcal{L}}{\partial w}  
$$

즉, **매 step마다 weight를 줄이며(decay) 업데이트** 한다.

그래서 L2 Regularization을 흔히 **Weight Decay**라고 부른다.

---

## 3. L1 Regularization (Lasso)

### (1) 수식

L1 Regularization은 **가중치의 절댓값의 합**에 패널티를 준다.

$$  
\Omega(\theta) = \sum_{i=1}^{n} |w_i| = ||\theta||_1  
$$

$$  
\mathcal{L}_{L1} = \mathcal{L}(\theta) + \lambda \sum_{i=1}^n |w_i|  
$$

### (2) 직관적인 의미

- 가중치가 크든 작든 **같은 비율의 패널티**
    
- 따라서 중요하지 않은 weight는 **정확히 0으로 수렴**
    
- 즉, **sparsity를 유도**한다
    

→ Feature selection의 효과를 얻는다.

### (3) 차이 포인트

|L1|L2|
|---|---|
|많은 weight = 0|weight들이 작지만 0은 아님|
|Sparse model|Dense model|
|Feature selection|Feature smoothing|
|해석 용이|일반화 성능 우수|

---

## 4. Weight Decay는 정확히 뭐가 다른가?

많은 사람이 **L2 Regularization = Weight Decay**라고 생각하지만,  
딥러닝 최적화에서는 **약간의 차이**가 있다.

### (1) Standard L2 regularization

Loss에 penalty를 추가하는 방식

$$  
\mathcal{L}(\theta) + \lambda ||\theta||_2^2  
$$

### (2) True Weight Decay (Decoupled Weight Decay)

Update step에서 직접 가중치를 줄인다.

$$  
w = (1 - \eta \lambda)w - \eta \nabla_w \mathcal{L}  
$$

AdamW optimizer가 이를 명확히 구현한다.

> Adam + L2 reg는 AdamW와 동일하지 않다.  
> AdamW = Adam + **Decoupled Weight Decay**

즉, Weight Decay는 L2 Regularization의 **실질적인 구현 방법** 중 하나이다.

---

## 5. Bias-Variance 관점에서의 역할

Regularization은 본질적으로:

- **Variance를 낮추고**
    
- **Bias를 약간 증가**시킨다
    

즉,

$$  
Variance \downarrow, \quad Bias \uparrow  
$$

하지만 대부분의 경우

$$  
\text{Test Error} = Bias^2 + Variance + Noise  
$$

가 감소한다.

즉, Regularization은 Overfitting을 방지하여 **generalization 성능을 올리는 데 핵심적인 역할**을 한다.

---

## 6. 예시로 이해하기

### 예시 1: Polynomial Regression

데이터가 다음과 같은 형태라고 하자.

$$  
y = x^2 + \epsilon  
$$

#### Regularization 없음 (10차 다항식)

$$  
y = w_1x^{10} + ... + w_{10}x + b  
$$

- Train 데이터 완벽히 맞춤
    
- Test에서 성능 급락
    
- High Variance
    

#### L2 Regularization 적용

- 지나치게 큰 계수들이 줄어든다
    
- 곡선이 부드러워진다
    
- Overfitting 감소
    

#### L1 Regularization 적용

- 불필요한 항의 가중치가 0으로 수렴
    
- 사실상 2~3차 다항식으로 축소
    
- Feature selection 효과
    

---

### 예시 2: PyTorch 코드

```python
import torch.optim as optim

# L2 Regularization (Weight Decay)
optimizer = optim.Adam(model.parameters(), lr=0.001, weight_decay=1e-4)
```

```python
# Manual L1 Regularization
l1_lambda = 1e-5
l1_norm = sum(p.abs().sum() for p in model.parameters())
loss = loss + l1_lambda * l1_norm
```

- `weight_decay` → L2 / Decoupled Weight Decay
    
- L1은 보통 직접 추가
    

---

## 7. 정리 요약

- Regularization은 모델의 복잡도에 패널티를 주어 Overfitting을 방지한다
    
- **L1**: sparsity 유도 (feature selection)
    
- **L2**: weight를 전반적으로 작게 만듦
    
- **Weight Decay**: L2를 update 단계에서 적용한 방식
    
- Bias는 약간 증가, Variance는 감소 → Generalization 향상
    

---

## 8. 함께 보면 좋은 개념들

- [[03_DeepLearning/01_Dropout|01_Dropout]]
- Early Stopping
- [[01_RL/06_Bias_Variance_Tradeoff|06_Bias_Variance_Tradeoff]]
- Elastic Net (L1 + L2)
- AdamW vs Adam
- VC Dimension
- Structural Risk Minimization
- Double Descent
- Sparsity in Neural Networks