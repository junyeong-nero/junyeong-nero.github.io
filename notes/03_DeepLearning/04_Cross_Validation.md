## Cross-Validation: 모델의 진짜 실력을 측정하는 방법

### 1. Cross-Validation이 필요한 이유

모델을 평가할 때 가장 흔히 사용하는 방법은 다음과 같이 데이터를 나누는 것이다.

- Train set
- Validation set
- Test set

하지만 데이터가 많지 않으면, 이 방식에는 문제가 있다.

- Validation set이 작을 경우 → 평가가 불안정함
- 특정한 분할에 운 좋게 잘 맞을 수 있음
- 데이터 분포가 균일하지 않을 수 있음

**Cross-Validation**은 데이터를 여러 번 나누어 평가함으로써  
이러한 불안정성과 우연성을 줄이는 방법이다.

핵심 아이디어:

> 하나의 분할이 아니라, **여러 개의 분할에서 모델의 일반화 성능을 평균으로 측정**한다.

---

## 2. K-Fold Cross-Validation 기본 개념

가장 대표적인 방식은 **K-Fold Cross-Validation**이다.

1. 전체 데이터를 $K$개의 fold로 나눈다.
2. 하나의 fold를 Validation set으로 사용한다.
3. 나머지 $K-1$개의 fold를 Train set으로 사용한다.
4. 이 과정을 $K$번 반복한다.

이를 수식으로 표현하면, 평균 성능은 다음과 같다.

$$  
CV_{score} = \frac{1}{K} \sum_{i=1}^{K} \text{Score}_i  
$$

여기서

- $\text{Score}_i$ : $i$번째 fold에서의 성능

이 값이 모델의 **일반화 성능에 대한 더 정확한 추정치**이다.

---

## 3. 왜 더 안정적인가?

K-Fold를 통해 모든 데이터는:

- 한 번은 Validation set에 포함되고
- $(K-1)$번은 Train set에 포함된다.

즉, **모든 데이터가 평가에 직접적으로 기여**하게 된다.

이로 인해

$$  
Var(\text{Performance estimate}) \downarrow  
$$

즉, 측정된 성능의 분산이 줄어들어 더 믿을 수 있는 평가가 된다.

---

## 4. K 값이 의미하는 것

|K 값|특징|
|---|---|
|작음 (e.g. 3)|계산 빠름, variance 큼|
|중간 (e.g. 5, 10)|가장 일반적으로 사용|
|큼 (e.g. N, LOOCV)|계산 느림, bias 작음|

특히

- $K = N$ 인 경우: **Leave-One-Out Cross Validation (LOOCV)**
    
- 매번 하나의 샘플만 Validation set이 된다.
    

LOOCV는 bias는 작지만 variance가 크고 계산량이 매우 크다.

---

## 5. 다양한 Cross-Validation 방식

### 1. Hold-Out Validation

가장 단순한 방식

$$  
D = D_{train} \cup D_{val}  
$$

하지만 분할에 따른 bias 발생 가능

---

### 2. Stratified K-Fold

일반 K-Fold에서 문제되는 점:

> 클래스 비율이 fold마다 달라질 수 있다.

이를 방지하기 위해:

- 각 fold에서 클래스 비율을 동일하게 유지
    

분류 문제에서는 **거의 필수적으로 사용**된다.

---

### 3. Time Series Cross-Validation

일반적인 K-Fold는

- 데이터 섞기(shuffle)를 가정
    

하지만 시계열 데이터는

> 미래 데이터가 과거를 예측하는 것을 금지해야 한다.

그래서 다음과 같은 방식이 사용된다.

```
Train: [1 2 3 4] → Valid: [5]
Train: [1 2 3 4 5] → Valid: [6]
Train: [1 2 3 4 5 6] → Valid: [7]
...
```

이를 **Rolling Window Validation**이라고 한다.

---

## 6. 예시로 이해하기

### 예시 1: 5-Fold Cross Validation

데이터가 아래와 같다고 하자.

```
[ D1 D2 D3 D4 D5 ]
```

각 fold는 다음과 같이 사용된다.

1. Train: D2~D5 / Val: D1
    
2. Train: D1, D3~D5 / Val: D2
    
3. Train: D1, D2, D4, D5 / Val: D3
    
4. Train: D1~D3, D5 / Val: D4
    
5. Train: D1~D4 / Val: D5
    

그리고 최종 성능은

$$  
CV = \frac{S_1 + S_2 + S_3 + S_4 + S_5}{5}  
$$

---

### 예시 2: Python 코드

```python
from sklearn.model_selection import KFold, cross_val_score
from sklearn.linear_model import LogisticRegression

model = LogisticRegression()

kf = KFold(n_splits=5, shuffle=True, random_state=42)

scores = cross_val_score(model, X, y, cv=kf)

print("CV Scores:", scores)
print("Mean CV score:", scores.mean())
```

분류 문제라면:

```python
from sklearn.model_selection import StratifiedKFold

kf = StratifiedKFold(n_splits=5)
```

---

## 7. Cross-Validation의 한계

- 딥러닝에서는 매우 느림 (K번 학습)
    
- Memory, 시간 비용 큼
    
- Hyperparameter search시 더 커짐
    
- Data leakage 조심
    

그래서 딥러닝에서는 보통:

- Hold-out + Early stopping
    
- 또는 작은 데이터셋에서만 CV 사용
    

---

## 8. 요약

- Cross-Validation은 모델의 일반화 성능을 더 정확하게 측정하기 위한 방법
    
- K-Fold 방식이 가장 대표적
    
- 모든 데이터가 Train과 Valid에 모두 쓰인다
    
- Variance가 감소하고 평가가 안정적
    
- 하지만 계산 비용이 크다
    

---

## 9. 더 찾아보면 좋은 개념들

- Bias-Variance Tradeoff
    
- Stratified Sampling
    
- Bootstrap
    
- Data Leakage
    
- Hyperparameter Tuning
    
- Grid Search / Random Search
    
- Nested Cross-Validation
    
- Early Stopping
    
- Model Selection