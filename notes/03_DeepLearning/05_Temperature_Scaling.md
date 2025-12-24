기술 블로그에 방문해 주셔서 감사합니다. 오늘은 현대적인 딥러닝 모델들이 겪고 있는 고질적인 문제 중 하나인 **Overconfidence(과잉 확신)** 문제와 이를 해결하기 위한 가장 우아하고 효율적인 해법, **Temperature Scaling**에 대해 깊이 있게 다뤄보겠습니다.

---

## 1. 서론: 왜 모델은 "근거 없는 자신감"에 차 있는가?

우리가 설계한 분류(Classification) 모델이 $Softmax$ 출력을 통해 "이 이미지는 99%의 확률로 개(Dog)입니다"라고 출력했다고 가정해 봅시다. 만약 이런 예측을 100번 반복했을 때 실제로 99번 맞춘다면, 우리는 이 모델이 **Calibrated** 되었다고 말합니다.

그러나 2017년 ICML에서 발표된 Chuan Guo 등의 논문 *'On Calibration of Modern Neural Networks'*에 따르면, 최신 딥러닝 모델(ResNet, Transformer 등)은 과거의 모델들에 비해 정확도는 높지만 **Confidence(확신도)와 실제 Accuracy(정확도) 사이의 괴리**가 매우 큽니다. 즉, 모델이 틀릴 때조차 너무 높은 확률 값을 내뱉는 Overconfidence 현상이 발생한다는 것입니다.

이는 자율주행이나 의료 진단처럼 **모델의 불확실성(Uncertainty)**을 정확히 판단해야 하는 실무 환경에서 치명적인 결함이 됩니다. 이 간극을 메우기 위해 등장한 기법이 바로 Temperature Scaling입니다.

---

## 2. 이론 및 핵심 논리 (Theoretical Framework)

Temperature Scaling은 모델의 아키텍처를 수정하거나 재학습시키지 않고, 학습이 끝난 모델 뒤에 아주 단순한 통계적 보정을 추가하는 **Post-hoc Calibration** 기법입니다.

### 핵심 메커니즘

모델의 마지막 레이어에서 계산된 값인 **Logit** 벡터 $\mathbf{z}$를 스칼라 매개변수 $T$ ($T > 0$)로 나누어 주는 것이 전부입니다. 이를 수식으로 표현하면 다음과 같습니다.

$$\hat{q}_i = \max_{k} \sigma_{SM}(\mathbf{z} / T)_i$$

여기서 각 변수의 의미는 다음과 같습니다.

- $\mathbf{z}$: 모델의 최상단 레이어에서 출력된 **Logit** 벡터입니다.
    
- $T$: **Temperature(온도)**라고 불리는 단일 스칼라 파라미터입니다.
    
- $\sigma_{SM}$: **Softmax** 함수입니다.
    
- $\hat{q}_i$: 최종적으로 보정된 **Confidence(확신도)**입니다.
    

### 수식의 직관적 의미

이 수식에서 $T$는 확률 분포의 **"부드러움(Smoothness)"**을 조절하는 역할을 합니다.

1. **$T > 1$ (Softening):** Logit 값들의 차이를 줄여 Softmax 통과 후의 확률 분포를 평탄하게 만듭니다. 대부분의 Overconfident한 모델은 $T > 1$을 통해 확률값을 낮추는 방향으로 보정됩니다.
    
2. **$T < 1$ (Sharpening):** Logit 값들의 차이를 증폭시켜 가장 큰 값에 확률이 더 몰리게 만듭니다.
    
3. **$T = 1$:** 기존의 Softmax와 동일합니다.
    

중요한 점은 $T$로 모든 클래스의 Logit을 동일하게 나누기 때문에, **Logit의 대소 관계(Ranking)는 변하지 않는다**는 것입니다. 즉, 모델의 예측 클래스(Argmax)나 Accuracy 자체에는 영향을 주지 않고 오직 '확률값'의 신뢰도만 교정합니다.

### 최적의 $T$ 찾기

우리는 별도의 **Validation Set(Hold-out set)**을 사용하여 실제 정답과 모델 예측 확률 사이의 **NLL(Negative Log-Likelihood)**을 최소화하는 $T$를 찾습니다.

$$\min_{T} -\sum_{i=1}^{n} \log(\hat{q}_i^{(y_i)})$$

---

## 3. 구현 (Implementation)

실제 연구 현장에서 Temperature Scaling을 적용하는 것은 매우 간단합니다. PyTorch 스타일의 코드로 핵심 로직을 살펴보겠습니다.

Python

```
import torch
import torch.nn as nn
import torch.optim as optim

class TemperatureScaler(nn.Module):
    """
    학습된 모델 뒤에 붙여 확률값을 교정하는 Wrapper 클래스
    """
    def __init__(self, model):
        super(TemperatureScaler, self).__init__()
        self.model = model
        # T는 1.0으로 초기화하며, 학습 가능한 파라미터로 설정
        self.temperature = nn.Parameter(torch.ones(1) * 1.5)

    def forward(self, input):
        logits = self.model(input)
        return self.temperature_scale(logits)

    def temperature_scale(self, logits):
        """
        Logit을 T로 나누어 반환
        """
        # unsqueeze와 expand를 통해 브로드캐스팅 지원
        temperature = self.temperature.unsqueeze(1).expand(logits.size(0), logits.size(1))
        return logits / temperature

    def set_temperature(self, valid_loader):
        """
        Validation set을 사용하여 최적의 T를 검색 (NLL 최소화)
        """
        self.to('cuda')
        nll_criterion = nn.CrossEntropyLoss().to('cuda')
        
        # 오직 temperature 파라미터만 최적화
        optimizer = optim.LBFGS([self.temperature], lr=0.01, max_iter=50)

        # Validation 데이터를 통해 Logit 수집 (메모리 확보를 위해 no_grad)
        logits_list = []
        labels_list = []
        with torch.no_grad():
            for input, label in valid_loader:
                logits = self.model(input.to('cuda'))
                logits_list.append(logits)
                labels_list.append(label.to('cuda'))
            logits = torch.cat(logits_list)
            labels = torch.cat(labels_list)

        def eval():
            optimizer.zero_grad()
            loss = nll_criterion(self.temperature_scale(logits), labels)
            loss.backward()
            return loss

        optimizer.step(eval)
        print(f"Optimal Temperature: {self.temperature.item():.4f}")
```

---

## 4. 마무리: 요약 및 제언

### 요약

- **Problem**: 현대적인 심층 신경망은 높은 정확도에도 불구하고 자신의 예측 확률을 과대평가하는 경향이 있음.
- **Solution**: Logit 단계에서 단일 스칼라 $T$로 나누어 확률 분포를 조절함.
- **Advantage**: 매우 가볍고(Parameter 1개), 모델의 정확도를 해치지 않으면서도 Calibration 성능을 극적으로 향상시킴.
    

### 실무적 통찰

Temperature Scaling은 **ECE(Expected Calibration Error)**를 줄이는 데 탁월하지만, 데이터셋의 분포가 급격히 변하는 **Dataset Shift** 상황에서는 고정된 $T$ 값이 유효하지 않을 수 있습니다. 또한, 클래스별로 Overconfidence의 정도가 다를 경우 단일 $T$ 대신 벡터를 사용하는 Matrix Scaling 등을 고려할 수 있으나, 파라미터 수가 늘어나면 Overfitting의 위험이 따르므로 주의가 필요합니다.

**Further Reading:**

1. **ECE (Expected Calibration Error)**: 모델의 Calibration 상태를 정량적으로 측정하는 표준 지표에 대해 알아보세요.
    
2. **Platt Scaling**: Logistic Regression을 활용한 고전적인 Calibration 기법으로, Temperature Scaling의 모태가 되었습니다.
    
3. **Label Smoothing**: 학습 과정에서 Regularization을 통해 처음부터 보다 Calibrated된 모델을 만드는 기법과 비교해 보세요.
    

---

오늘의 내용이 여러분의 AI 모델이 더 "겸손하고 정확한" 지표를 갖게 하는 데 도움이 되길 바랍니다. 관련하여 궁금한 점이나 의견이 있다면 언제든 댓글로 남겨주세요.

**혹시 이 Temperature Scaling을 적용한 후, 모델의 성능 변화를 ECE 지표로 시각화하는 방법이 궁금하신가요?** Would you like me to explain how to calculate and plot ECE (Reliability Diagram) in Python?