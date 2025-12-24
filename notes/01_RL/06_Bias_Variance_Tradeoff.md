## Bias-Variance Tradeoff

### 1. 개념 개요

**Bias-Variance Tradeoff**는 모델의 복잡도(model complexity)를 조절할 때 발생하는 두 가지 상반된 오차, **Bias(편향)**와 **Variance(분산)** 사이의 균형 문제를 말한다.  
이 개념은 우리가 모델을 너무 단순하게 만들 때와 너무 복잡하게 만들 때 각각 어떤 문제가 발생하는지를 설명한다.

여기서 다루는 오차는 **Expected Generalization Error**(기댓 일반화 오차)이며, 다음과 같이 분해할 수 있다.

$$  
\mathbb{E}[(y - \hat{f}(x))^2] = \text{Bias}^2 + \text{Variance} + \text{Noise}  
$$

- **Bias**: 모델이 실제 데이터의 패턴을 얼마나 잘 근사하는지의 문제
    
- **Variance**: 모델이 학습 데이터의 작은 변화에 얼마나 민감한지의 문제
    
- **Noise**: 측정 오차나 본질적으로 제거할 수 없는 데이터의 무작위성 (irreducible error)
    
### Bias–Variance–Noise Decomposition 유도 과정

목표는 다음을 증명(유도)하는 것이다.

$$  
\mathbb{E}[(y - \hat{f}(x))^2]  
= \text{Bias}^2 + \text{Variance} + \text{Noise}  
$$

여기서 각 기호의 의미를 먼저 명확히 하자.

- $y = f(x) + \epsilon$
    
- $f(x)$ : 실제 정답 함수 (true function)
    
- $\hat{f}(x)$ : 학습된 모델의 예측값
    
- $\epsilon$ : 평균이 0인 노이즈, 즉 $E[\epsilon] = 0$, $Var(\epsilon) = \sigma^2$
    

---

## 1. 기본식에서 시작

우리가 보고 싶은 값은 다음이다.

$$  
\mathbb{E}[(y - \hat{f}(x))^2]  
$$

여기에 $y = f(x) + \epsilon$ 을 대입하면,

$$  
\mathbb{E}[(f(x) + \epsilon - \hat{f}(x))^2]  
$$

정리하면

$$  
\mathbb{E}[(f(x) - \hat{f}(x) + \epsilon)^2]  
$$

이제 제곱을 전개한다.

$$  
= \mathbb{E}[(f(x) - \hat{f}(x))^2]

- 2\mathbb{E}[(f(x)-\hat{f}(x))\epsilon]
    
- \mathbb{E}[\epsilon^2]  
    $$
    

여기서 중요한 점은:

- $\epsilon$은 모델과 독립이고 평균이 0
    
- 따라서 교차항은 0
    

$$  
\mathbb{E}[(f(x)-\hat{f}(x))\epsilon] = 0  
$$

그래서 남는 식은

$$  
\mathbb{E}[(f(x) - \hat{f}(x))^2] + \mathbb{E}[\epsilon^2]  
$$

즉,

$$  
= \mathbb{E}[(f(x) - \hat{f}(x))^2] + \sigma^2  
$$

여기서 $\sigma^2$가 바로 **Noise (irreducible error)** 이다.

---

## 2. Bias와 Variance 분해

이제 남은 항을 Bias와 Variance로 나눈다.

$$  
\mathbb{E}[(f(x) - \hat{f}(x))^2]  
$$

여기에 $\mathbb{E}[\hat{f}(x)]$를 더했다가 빼자 (트릭이다):

$$  
= \mathbb{E}[(f(x) - \mathbb{E}[\hat{f}(x)] + \mathbb{E}[\hat{f}(x)] - \hat{f}(x))^2]  
$$

이를 두 항으로 나눈다:

$$  
= \mathbb{E}[(f(x) - \mathbb{E}[\hat{f}(x)]) + (\mathbb{E}[\hat{f}(x)] - \hat{f}(x))]^2  
$$

제곱 전개:

$$  
= \mathbb{E}[(f(x) - \mathbb{E}[\hat{f}(x)])^2]

- \mathbb{E}[(\hat{f}(x) - \mathbb{E}[\hat{f}(x)])^2]
    
- 2\mathbb{E}[(f(x) - \mathbb{E}[\hat{f}(x)])(\mathbb{E}[\hat{f}(x)] - \hat{f}(x))]  
    $$
    

여기서 마지막 항은 0이다.  
왜냐하면 $(f(x) - \mathbb{E}[\hat{f}(x)])$는 상수이고, 나머지는 평균이 0이기 때문이다.

그래서 남는 것은:

$$  
= (f(x) - \mathbb{E}[\hat{f}(x)])^2 + \mathbb{E}[(\hat{f}(x) - \mathbb{E}[\hat{f}(x)])^2]  
$$

이 둘이 각각:

- **Bias²** :  
    $$  
    \text{Bias}^2 = (f(x) - \mathbb{E}[\hat{f}(x)])^2  
    $$
    
- **Variance** :  
    $$  
    \text{Variance} = \mathbb{E}[(\hat{f}(x) - \mathbb{E}[\hat{f}(x)])^2]  
    $$
    

즉,

$$  
\mathbb{E}[(f(x) - \hat{f}(x))^2]  
= \text{Bias}^2 + \text{Variance}  
$$

---

## 3. 최종 결론

Noise까지 다시 합치면 최종적으로:

$$  
\mathbb{E}[(y - \hat{f}(x))^2]  
= \text{Bias}^2 + \text{Variance} + \text{Noise}  
$$

이것이 바로 **Bias–Variance Decomposition**이다.


즉,

- Bias가 높다 → 모델이 너무 단순해서 **Underfitting**
    
- Variance가 높다 → 모델이 너무 복잡해서 **Overfitting**
    

---

### 2. Bias (편향)

Bias는 모델이 데이터의 **진짜 구조(True function)**를 단순화해서 잘못 추정하는 정도를 의미한다.

수식적으로 보면,

$$  
Bias(x) = \mathbb{E}[\hat{f}(x)] - f(x)  
$$

여기서

- $\hat{f}(x)$: 우리가 학습한 모델의 예측값
    
- $f(x)$: 실제 데이터 생성 과정의 함수
    

즉, 여러 번 학습했을 때 평균적인 예측값이 실제 값과 얼마나 다른지를 나타낸다.

Bias가 큰 경우:

- 모델이 너무 단순함 (e.g. 선형 모델로 비선형 데이터를 학습)
    
- 중요한 패턴을 놓침
    
- Train error와 Test error 둘 다 큼 → Underfitting
    

---

### 3. Variance (분산)

Variance는 모델이 **학습 데이터에 얼마나 민감하게 반응하는지**를 의미한다.

$$  
Variance(x) = \mathbb{E}[(\hat{f}(x) - \mathbb{E}[\hat{f}(x)])^2]  
$$

즉, 서로 다른 학습 데이터셋으로 모델을 학습시켰을 때, 같은 입력 $x$에 대해 예측값이 얼마나 크게 변하는지를 나타낸다.

Variance가 큰 경우:

- 모델이 너무 복잡함 (e.g. 너무 깊은 신경망, 높은 차수의 다항 회귀)
    
- Noise까지 학습함
    
- Train error는 작고 Test error는 큼 → Overfitting
    

---

### 4. Tradeoff의 의미

모델의 복잡도를 높이면 일반적으로 다음과 같은 경향이 있다.

- Bias는 감소 ⬇️
- Variance는 증가 ⬆️
    

반대로, 모델을 단순하게 만들면

- Bias는 증가 ⬆️
- Variance는 감소 ⬇️
    

이를 시각적으로는 U자 형태의 **Test Error Curve**로 표현할 수 있다.

모델을 단순 → 복잡으로 바꿔가며 보면:

|모델 복잡도|Bias|Variance|Test Error|
|---|---|---|---|
|낮음|높음|낮음|큼|
|적절함|적당함|적당함|최소|
|높음|낮음|높음|큼|

즉, 우리가 찾고 싶은 것은 **Bias와 Variance가 균형을 이루는 지점**이다.

---

## 5. 예시로 이해하기

### 예시 1: Regression에서의 Tradeoff

어떤 데이터가 아래와 같은 곡선을 따른다고 가정해보자.

$$  
y = x^2 + \epsilon  
$$

#### (1) Linear Regression (1차 함수)

$$  
y = wx + b  
$$

- $x^2$ 형태를 표현할 수 없음
    
- 항상 직선 → 구조적 한계 있음
    
- Bias 높음, Variance 낮음
    
- Underfitting 발생
    

#### (2) Polynomial Regression (2차~3차)

$$  
y = w_1x^2 + w_2x + b  
$$

- 데이터 구조를 잘 표현
    
- Bias 감소
    
- Variance 적당
    
- 일반화 성능 좋음
    

#### (3) Polynomial Regression (10차 이상)

$$  
y = w_1x^{10} + ... + w_{10}x + b  
$$

- 거의 모든 점을 통과하려고 함
    
- Noise까지 학습
    
- Bias 매우 작음
    
- Variance 매우 큼 → Overfitting
    

실제로 Train error는 거의 0이지만, Test 데이터에서는 성능이 급격히 떨어진다.

---

### 예시 2: 딥러닝에서의 Tradeoff

|모델 구조|Bias|Variance|
|---|---|---|
|은닉층 1개, node 10개|높음|낮음|
|은닉층 3개, node 128개|적절|적절|
|은닉층 10개, node 512개|낮음|높음|

너무 작은 모델 → 학습 자체가 어려움  
너무 큰 모델 → Train 데이터는 외우지만 Test에서 실패

이를 해결하기 위해 사용하는 방법:

- [[03_DeepLearning/01_Dropout|DropOut]]
- L2 regularization (Weight decay)
- Early stopping
- Data augmentation
    

이들은 모두 **Variance를 줄이기 위한 방법**이다.

---

## 6. 요약

- Bias-Variance Tradeoff는 모델의 일반화 성능을 결정하는 핵심 개념이다.
- Bias가 크면 Underfitting, Variance가 크면 Overfitting이 발생한다.
- 모델의 복잡도를 조절하며 두 요소의 균형점을 찾는 것이 목표다.
- 이를 조절하는 도구로 regularization, dropout, model size 조정 등이 있다.
    

---

## 7. 더 찾아보면 좋은 개념들

- Overfitting / Underfitting
- Regularization (L1, L2)
- Cross-validation
- VC-dimension
- Structural Risk Minimization
- Early Stopping
- Ensemble methods (Bagging, Boosting)
- Bias-Variance Decomposition
- Double Descent Phenomenon