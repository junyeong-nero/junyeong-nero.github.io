
안녕하세요, 동료 연구자 여러분. 오늘은 딥러닝 분류 모델의 백본(Backbone)이자, 정보 이론(Information Theory)과 통계학의 접점에 위치한 **Cross Entropy Loss**에 대해 심도 있게 다루어 보겠습니다.

학부 시절 MSE(Mean Squared Error)로 회귀 문제를 풀다가 분류 문제로 넘어올 때, "왜 분류에서는 굳이 로그를 씌운 복잡한 식을 써야 할까?"라는 의문을 가져본 적이 있을 겁니다. 오늘 그 이면의 논리적 필연성을 정리해 봅시다.

---

## 1. 서론: 왜 MSE가 아니라 Cross Entropy인가? (Motivation)

우리가 분류 모델을 학습시킬 때, 마지막 출력층에는 주로 **Sigmoid**나 **Softmax** 활성화 함수를 사용합니다. 이때 손실 함수로 MSE를 사용하면 어떤 일이 벌어질까요?

1. **Gradient Vanishing 문제**: MSE의 도함수에는 활성화 함수의 미분값이 포함됩니다. Sigmoid의 경우 출력값이 0 또는 1에 가까워질수록 미분값이 0으로 수렴하는 **Saturating 구간**에 진입하며, 이는 역전파 시 학습 속도를 극도로 저하시킵니다.
    
2. **비볼록성(Non-convexity)**: 분류 문제에서 MSE를 사용하면 손실 함수가 Non-convex해질 가능성이 커져, Global Optima를 찾는 것이 이론적으로 더 어려워집니다.
    

이러한 한계를 극복하기 위해 등장한 것이 Cross Entropy입니다. 이는 모델의 예측 결과가 정답 레이블의 확률 분포와 얼마나 유사한지를 측정하며, 수학적으로 **로그(Log)**를 활용해 지수 함수 형태의 활성화 함수와 결합했을 때 미분 방정식을 선형적으로 단순화하는 마법을 부립니다.

---

## 2. 이론 및 핵심 논리 (Theoretical Framework)

Cross Entropy를 온전히 이해하기 위해서는 정보 이론의 계보를 따라가야 합니다.

### 2.1 정보량과 엔트로피 (Entropy)

어떤 사건 $x$가 발생했을 때 얻는 **정보량(Self-information)** $I(x)$는 확률 $P(x)$에 반비례합니다. 드문 사건일수록 놀라움(Surprise)이 크기 때문이죠.

$$I(x) = -\log P(x)$$

이 정보량의 기댓값을 우리는 **Entropy**라고 부릅니다. 특정 확률 분포 $P$가 가진 불확실성의 총량을 의미합니다.

$$H(P) = E_{x \sim P}[I(x)] = -\sum_{x \in X} P(x) \log P(x)$$

### 2.2 Cross Entropy의 정의

이제 실제 데이터의 분포를 $P(x)$, 우리 모델이 예측한 분포를 $Q(x)$라고 합시다. **Cross Entropy**는 "실제 분포 $P$를 예측하기 위해 설계된 코드를 잘못된 분포 $Q$를 기반으로 코딩했을 때의 평균 정보량"을 뜻합니다.

$$H(P, Q) = -\sum_{x \in X} P(x) \log Q(x)$$

이 식은 다음과 같이 분해할 수 있습니다.

$$H(P, Q) = H(P) + D_{KL}(P \| Q)$$

여기서 $D_{KL}(P | Q)$는 **KL Divergence**로, 두 분포 사이의 괴리를 측정하는 비대칭적 척도입니다. 딥러닝에서 정답 레이블 $P$는 고정된 값(Constant)이므로 $H(P)$는 0이 되거나 상수가 됩니다. 따라서 **Cross Entropy를 최소화하는 것은 곧 모델의 예측($Q$)을 실제 분포($P$)에 가깝게 만드는 것(KL Divergence 최소화)**과 동일한 의미를 갖습니다.

### 2.3 Maximum Likelihood Estimation (MLE)와의 관계

통계학적 관점에서 Cross Entropy Loss를 최소화하는 것은 **Negative Log-Likelihood(NLL)**를 최소화하는 것과 같습니다. 모델이 정답을 맞출 확률(Likelihood)을 최대화하도록 파라미터를 최적화하는 과정인 셈입니다.

---

## 3. 구현 및 예시 (Implementation)

다중 클래스 분류(Multi-class Classification) 상황을 가정해 보겠습니다. 3개의 클래스(Cat, Dog, Bird) 중 'Cat'이 정답인 데이터에 대해 모델이 예측을 내놓은 경우입니다.

### 3.1 수치 예시

- **Ground Truth ($y$ / $P$):** $[1, 0, 0]$ (One-hot encoded)
    
- **Model Prediction ($\hat{y}$ / $Q$):** $[0.7, 0.2, 0.1]$ (After Softmax)
    

$$L = -(1 \cdot \log(0.7) + 0 \cdot \log(0.2) + 0 \cdot \log(0.1)) \approx 0.356$$

만약 모델이 더 확신을 가지고 $0.9$를 예측했다면 손실값은 약 $0.105$로 줄어들 것입니다.

### 3.2 PyTorch 기반 실전 코드

실무에서 PyTorch를 사용할 때 주의할 점은 `nn.CrossEntropyLoss`가 내부적으로 `LogSoftmax`와 `NLLLoss`를 결합하여 수행한다는 점입니다. 따라서 모델의 마지막 레이어에 별도로 Softmax를 적용하지 않은 **Logits** 상태의 값을 입력해야 수치적 안정성(Numerical Stability)이 보장됩니다.

Python

```
import torch
import torch.nn as nn

# 클래스가 3개인 분류 문제
criterion = nn.CrossEntropyLoss()

# 모델의 출력값 (Logits: Softmax 통과 전의 값)
# Batch Size = 2, Num Classes = 3
logits = torch.tensor([[2.0, 0.5, 0.1], 
                       [0.2, 1.5, 3.0]], requires_grad=True)

# 정답 레이블 (Class Index 사용)
# 첫 번째 데이터는 0번(Cat), 두 번째 데이터는 2번(Bird)이 정답
targets = torch.tensor([0, 2])

# 손실 계산
loss = criterion(logits, targets)

# 역전파
loss.backward()

print(f"Calculated Loss: {loss.item():.4f}")
print(f"Gradients on Logits:\n{logits.grad}")
```

---

## 4. 마무리: 요약 및 제언 (Conclusion)

Cross Entropy Loss는 단순히 수식적인 선택이 아니라, **정보의 불확실성을 최소화하고 예측 확률의 최대 우도를 찾는** 논리적 귀결입니다.

- **핵심 요약**:
    
    1. 분류 문제에서 MSE의 Gradient Saturation 문제를 해결합니다.
        
    2. 모델 예측 분포와 실제 데이터 분포 사이의 KL Divergence를 최소화하는 과정입니다.
        
    3. Softmax와 결합 시 지수 함수와 로그가 상쇄되어 매우 효율적인 기울기(Gradient)를 제공합니다.
        

실무적 통찰:

데이터셋 내 클래스 불균형(Class Imbalance)이 심할 경우, 단순한 Cross Entropy는 다수 클래스에 편향된 학습을 유도할 수 있습니다. 이럴 때는 각 클래스에 가중치를 부여하는 Weighted Cross Entropy나, 학습하기 어려운 예제에 더 집중하는 Focal Loss로의 확장을 고려해 보시기 바랍니다.

**Further Reading**:

- **Information Geometry**: 손실 함수가 형성하는 곡률과 Fisher Information Matrix에 대한 연구
- **Label Smoothing**: 모델의 과잉 확신(Over-confidence)을 막기 위해 정답 분포를 부드럽게 만드는 기법
- **Focal Loss for Dense Object Detection**: Cross Entropy를 변형하여 불균형 문제를 해결한 대표적 사례
    