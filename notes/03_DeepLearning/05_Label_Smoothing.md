안녕하십니까. 딥러닝 연구실의 세미나에 오신 것을 환영합니다. 오늘 우리가 함께 살펴볼 주제는 모델의 일반화(Generalization) 성능을 높이고, 예측의 '근거 있는 자신감'을 불어넣어 주는 기법인 **Label Smoothing**입니다.

분류(Classification) 모델을 학습시키다 보면, 모델이 정답 클래스에 대해 지나치게 확신(Overconfidence)하는 경향을 보일 때가 있습니다. 이는 단순한 과적합(Overfitting)을 넘어, 모델의 보정(Calibration) 성능을 떨어뜨리는 원인이 되기도 하죠. 오늘 이 포스트를 통해 그 원인과 해결책을 수식과 함께 깊이 있게 파헤쳐 보겠습니다.

---

## 1. 서론: 왜 '확신'이 독이 되는가? (Motivation)

우리는 보통 분류 문제를 풀 때 정답을 **One-hot Vector**로 인코딩합니다. 예를 들어 3개의 클래스 중 2번이 정답이라면 $[0, 1, 0]$으로 표기하죠. 모델은 Softmax 함수를 통과한 예측값 $p$가 이 One-hot target $y$에 최대한 가깝게 정답 클래스의 확률을 1로, 나머지를 0으로 만들도록 학습됩니다.

### 기존 방식의 한계점

여기서 문제가 발생합니다. Softmax 수식을 떠올려 보십시오. 특정 클래스의 확률이 정확히 1이 되려면, 해당 클래스의 **Logit(Activation 값)이 다른 클래스들에 비해 무한히($\infty$) 커져야 합니다.** 모델은 학습 데이터의 정답을 맞히기 위해 가중치를 계속해서 키우게 되고, 결과적으로 다음과 같은 부작용이 생깁니다.

1. **Generalization 저하**: 학습 데이터의 미세한 노이즈까지 학습하여 결정 경계(Decision Boundary)가 복잡해집니다.
    
2. **Poor Calibration**: 모델이 틀릴 때조차 매우 높은 확률(예: 0.99)로 오답을 내놓습니다. 즉, 본인의 예측이 얼마나 정확한지 스스로 잘 모르게 됩니다.
    

---

## 2. 이론 및 핵심 논리 (Theoretical Framework)

**Label Smoothing**은 정답에 대한 확신을 조금 덜어내어 모델에게 '여지'를 주는 정규화(Regularization) 기법입니다.

### 수식적 정의

기존의 One-hot target $y$를 다음과 같이 부드럽게(Smooth) 변환한 $y^{LS}$를 사용합니다.

$$y^{LS}_k = (1 - \alpha) y_k + \frac{\alpha}{K}$$

여기서 각 변수의 의미는 다음과 같습니다.

- $K$: 전체 클래스의 개수
    
- $y_k$: 클래스 $k$에 대한 기존 One-hot 값 (정답이면 1, 아니면 0)
    
- $\alpha$: Smoothing 정도를 조절하는 하이퍼파라미터 (보통 0.1 사용)
    
- $y^{LS}_k$: 변환된 새로운 Target 확률값
    

### 수식의 직관적 해석

이 수식은 모델에게 다음과 같은 가르침을 줍니다.

> "이 샘플은 정답이 $y_k$일 확률이 매우 높지만($1-\alpha$), 아주 낮은 확률($\alpha/K$)로 다른 클래스일 가능성도 있으니 너무 자만하지 마라."

결과적으로 Loss Function인 **Cross-Entropy**는 다음과 같이 변합니다.

$$H(y^{LS}, p) = (1 - \alpha) H(y, p) + \alpha H(u, p)$$

여기서 $u$는 **Uniform Distribution**($1/K$)을 의미합니다. 즉, Label Smoothing을 적용하는 것은 **기본 Cross-Entropy 손실을 최소화하면서, 동시에 예측 분포가 균등 분포에서 멀어지지 않도록(Entropy가 너무 낮아지지 않도록) 페널티를 주는 것**과 수학적으로 동일한 효과를 가집니다.

---

## 3. 구현 및 예시 (Implementation)

이해를 돕기 위해 3개의 클래스($K=3$) 상황에서 $\alpha=0.1$을 적용해 보겠습니다.

- **기존 Target**: $[0, 1, 0]$
    
- **Smoothed Target**:
    
    - 정답 위치: $(1 - 0.1) \times 1 + (0.1 / 3) \approx 0.9333$
        
    - 오답 위치: $(1 - 0.1) \times 0 + (0.1 / 3) \approx 0.0333$
        
    - 결과: $[0.0333, 0.9333, 0.0333]$
        

이제 PyTorch를 이용해 이 로직을 어떻게 간단히 구현할 수 있는지 살펴보겠습니다. 최신 PyTorch 버전(`1.10+`)에서는 `nn.CrossEntropyLoss`에 이미 내장되어 있습니다.

Python

```
import torch
import torch.nn as nn
import torch.nn.functional as F

# 1. 최신 PyTorch 내장 기능을 사용하는 방법 (권장)
criterion = nn.CrossEntropyLoss(label_smoothing=0.1)

# 2. 수동 구현을 통한 로직 이해 (Custom Implementation)
def manual_label_smoothing_loss(logits, targets, alpha=0.1):
    num_classes = logits.size(-1)
    
    # Log-softmax 계산
    log_probs = F.log_softmax(logits, dim=-1)
    
    # Negative Log Likelihood (정답 항)
    nll_loss = -log_probs.gather(dim=-1, index=targets.unsqueeze(1)).squeeze(1)
    
    # Smooth 항 (모든 클래스의 평균)
    smooth_loss = -log_probs.mean(dim=-1)
    
    # 두 항의 결합: (1-alpha) * NLL + alpha * Smooth
    loss = (1 - alpha) * nll_loss + alpha * smooth_loss
    
    return loss.mean()

# Test
sample_logits = torch.randn(2, 3) # Batch size 2, Classes 3
sample_targets = torch.tensor([1, 0])
print(f"Loss: {manual_label_smoothing_loss(sample_logits, sample_targets)}")
```

---

## 4. 마무리: 요약 및 제언 (Conclusion)

Label Smoothing은 매우 단순한 수식의 변화만으로 모델의 강건함(Robustness)을 비약적으로 향상시킬 수 있는 강력한 도구입니다.

### 핵심 요약

- **Problem**: One-hot target은 모델이 Logit을 무한히 키우게 만들어 과적합과 Overconfidence를 유발함.
- **Solution**: Target에 작은 Noise($\alpha$)를 섞어 정답의 확신을 덜어냄.
- **Result**: 결정 경계가 부드러워지고, 모델의 Calibration(예측 확률의 실제 정확도)이 개선됨.
    

### 주의할 점

실무에서 주의할 점이 하나 있습니다. **Knowledge Distillation(지식 증류)** 기법을 사용할 때는 Label Smoothing을 가급적 피해야 합니다. Teacher 모델이 정답 외의 클래스들에 대해 가지고 있는 미세한 확률 분포 정보(Rich dark knowledge)를 Label Smoothing의 일괄적인 노이즈가 가려버려 학습을 방해할 수 있기 때문입니다.

### Further Reading

더 깊은 공부를 원하신다면 아래 자료들을 참고해 보시기 바랍니다.

1. **Szegedy et al. (2016)**: _Rethinking the Inception Architecture for Computer Vision_ (Label Smoothing이 처음 제안된 논문입니다.)
    
2. **Müller et al. (2019)**: _When Does Label Smoothing Help?_ (Label Smoothing이 Logit 공간에서 어떤 군집화 효과를 주는지 분석한 명저입니다.)
    
3. **Model Calibration & Expected Calibration Error (ECE)**: 모델의 '확신'을 어떻게 정량적으로 측정하는지에 대한 주제입니다.
    

다음 세미나에서는 이와 연관된 **Temperature Scaling** 기법에 대해 다루어 보겠습니다. 질문이 있으시면 언제든 댓글이나 메일로 남겨주세요.

수고하셨습니다.

---

**다음 단계로, 이 기법을 실제 적용했을 때 Logit의 분포가 어떻게 변하는지 시각화 코드를 함께 작성해 볼까요?** Would you like me to... 작성해 드릴까요?