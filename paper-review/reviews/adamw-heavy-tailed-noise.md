# Open Problem: Is AdamW Effective Under Heavy-Tailed Noise?

## TL;DR

This short theory note asks whether AdamW has a rigorous convergence guarantee under the heavy-tailed stochastic-gradient noise observed in LLM pretraining. Sign-based optimizers such as Lion and Muon already have sharp heavy-tailed rates, and AdaGrad has recent positive results, but AdamW's exponential second-moment accumulator is still theoretically unresolved. The paper frames the missing theorem as an open problem, proves a positive weighted-stationarity benchmark, and isolates a lower-bound mechanism showing how long denominator memory can hide large gradients.

Source: [arXiv:2606.23676](https://arxiv.org/abs/2606.23676), [PDF](https://arxiv.org/pdf/2606.23676.pdf)

## Background

AdamW is the default optimizer for many large language model training runs. Its practical status is much stronger than its heavy-tailed theory. Standard AdamW convergence analyses typically assume bounded variance, affine variance, bounded gradients, bounded coordinate ratios, or other conditions that keep second moments under control.

That assumption is increasingly mismatched with empirical evidence. Several studies report that stochastic gradient noise in language modeling can be heavy-tailed, meaning a finite second moment may not exist even when a finite \(p\)-th moment exists for \(p \in (1, 2]\). This matters because AdamW explicitly divides by a moving estimate of squared gradients. If rare outliers dominate that denominator for a long time, the optimizer can look well-normalized while making little useful progress.

The motivation is sharpened by sign-based optimizers. Lion and Muon have shown strong empirical performance, and recent theory gives sign-based methods sharp rates under finite \(p\)-th moment heavy-tailed noise. If AdamW can match that rate, then the empirical advantage of sign-based methods must be explained elsewhere. If AdamW cannot match it, then heavy-tailed noise may be a principled reason why AdamW loses in some LLM training regimes.

## Problem

The paper asks a deliberately narrow question: under the same heavy-tailed assumptions used to analyze sign-based methods, can AdamW obtain the same nonasymptotic stationarity rate?

AdamW is written as:

\[
m_t = \beta_1 m_{t-1} + (1-\beta_1) g_t,
\qquad
v_t = \beta_2 v_{t-1} + (1-\beta_2) g_t \odot g_t,
\]

\[
x_{t+1}
=
(1-\eta_t \lambda)x_t
-
\frac{\eta_t m_t}{\sqrt{v_t}+\epsilon_t}.
\]

The core open case is \(\lambda = 0\), where decoupled weight decay is removed so the question is about Adam-style self-normalization itself.

The stochastic-gradient model assumes unbiased gradients and coordinate-wise finite \(p\)-th moments:

\[
\mathbb{E}[g_t^b \mid \mathcal{F}_{t-1}] = \nabla f(x_t),
\]

\[
\mathbb{E}\left[
\left|g_{t,i}^b - \nabla_i f(x_t)\right|^p
\mid \mathcal{F}_{t-1}
\right]
\le
\sigma_{0,i}^p + \sigma_{1,i}^p |\nabla_i f(x_t)|^p.
\]

The comparison target is the sign-method rate:

\[
\frac{1}{T}\sum_{t=1}^T
\mathbb{E}\left[\|\nabla f(x_t)\|_1\right]
\le
O\left(T^{-\frac{p-1}{3p-2}}\right),
\]

with problem-dependent factors involving the initial gap, curvature, noise scale, and batch size. The open problem is to either prove that AdamW can match this rate under the heavy-tailed model, or construct an AdamW-specific lower bound showing that it cannot.

## Method

The paper contributes three pieces around the open problem.

First, it states the target assumptions clearly. The objective is differentiable and lower bounded. Smoothness is expressed through a gradient-curvature condition that allows coordinate-wise curvature to scale with gradient magnitude. The clean partial results specialize to fixed coordinate curvature and fixed heavy-tailed noise scale, which is already enough to expose the AdamW-specific difficulty.

Second, it proves a positive weighted-metric benchmark. Define:

\[
a_{t,i} = \frac{|m_{t,i}|}{\sqrt{v_{t,i}}+\epsilon_t},
\qquad
S_t = \langle a_t, |\nabla f(x_t)| \rangle.
\]

For a simplified equal-memory AdamW variant with \(\beta_2 = \beta_1\), the paper shows that the average weighted stationarity \(T^{-1}\sum_t \mathbb{E}[S_t]\) can achieve the same heavy-tailed rate as sign-based methods. This is meaningful because it shows that heavy-tailed moment control and sign alignment can still yield the target rate in a self-normalized Adam-like expression.

Third, it isolates why weighted stationarity is not enough. For SignSGD or Lion, the weight vector is effectively all ones, so weighted stationarity is plain \(\ell_1\)-stationarity. For AdamW, the weights \(a_{t,i}\) are data dependent. A large gradient can be multiplied by a very small Adam weight after an outlier inflates \(v_t\). The missing theorem would need to show that this collapse does not destroy the unweighted stationarity rate, or prove that it can.

## Experiments

This is not an empirical paper. It does not benchmark AdamW, Lion, Muon, or AdaGrad on training runs. Its evidence is theoretical: propositions that define what is already provable and where the proof obstruction lies.

The positive result is Proposition 2. Under the clean heavy-tailed specialization, constant step size, \(\lambda=0\), \(\beta_2=\beta_1\), and suitable hyperparameters, AdamW achieves the target heavy-tailed rate for the weighted metric \(S_t\).

Proposition 3 is a warning about alignment. With \(\beta_1=\beta_2=0\) and \(\epsilon_t=0\), AdamW reduces to SignSGD. The paper constructs a one-dimensional unbiased oracle with finite \(p\)-th moment where the expected alignment can be negative. This means unbiasedness alone is insufficient; any theorem must explain how mini-batching, momentum, clipping, or another robustness mechanism restores useful alignment.

Proposition 5 gives the main Adam-specific barrier. In a one-dimensional corridor construction with \(\beta_1^2 < \beta_2\), rare negative outliers inflate the second-moment accumulator. Because \(v_t\) remembers squared outliers longer than \(m_t\) remembers their signs, the update magnitude can become polynomially small. The result is not a universal impossibility theorem for all AdamW schedules, but it shows a concrete long-memory regime where weighted progress can coexist with poor plain \(\ell_1\)-stationarity.

## Critical Analysis

The paper is useful because it separates "AdamW is hard to analyze" into a sharper technical question. The missing step is not simply heavy-tailed noise in the abstract. It is the interaction between an exponential numerator \(m_t\), an exponential squared-gradient denominator \(v_t\), and the fact that \(g_t^2\) may not have a finite expectation when \(p<2\).

The weighted benchmark is a good diagnostic. It says the authors can recover the sign-method rate after allowing AdamW to choose its own data-dependent weights. That narrows the hard part to the conversion from weighted progress to actual unweighted stationarity. In other words, the obstacle is not only proving descent; it is proving that AdamW's normalization does not hide the coordinates where the gradient is large.

The corridor mechanism is also conceptually strong. It matches a common intuition about Adam-like methods: rare large gradients can leave a long trace in the denominator. The paper formalizes that intuition without overclaiming a complete lower bound.

The limitation is that the note does not settle the open problem. Practical AdamW uses bias corrections, \(\epsilon\), mini-batches, clipping, learning-rate schedules, and often nontrivial interactions with normalization layers and model architecture. The lower-bound mechanism points to a risk, but does not prove that practical LLM-training AdamW fails under all heavy-tailed regimes.

Another caveat is that matching a convergence rate may not explain optimizer preference in practice. Even if AdamW eventually gets a heavy-tailed rate, constants, transient behavior, scale invariance, implementation details, and interaction with weight decay may still explain why Muon or Lion performs differently.

## Implementation Notes

For researchers analyzing optimizers, the key implementation lesson is to track the metric being optimized. A bound on

\[
\langle a_t, |\nabla f(x_t)| \rangle
\]

is not equivalent to a bound on \(\|\nabla f(x_t)\|_1\) unless the weights \(a_t\) are controlled from below. In AdamW, those weights depend on outlier-sensitive denominator memory.

For empirical optimizer work, the paper suggests measuring denominator-memory effects directly. Useful diagnostics include the distribution of \(v_{t,i}\), the lag between numerator and denominator decay after large gradients, coordinate-wise update-to-gradient ratios, and the frequency with which high-gradient coordinates receive very small normalized updates.

For practical LLM training, the note supports paying attention to mechanisms that reduce denominator pathologies: gradient clipping, robust second-moment estimators, shorter denominator memory, \(\epsilon\) schedules, or hybrid sign/adaptive methods. The paper does not recommend a specific replacement for AdamW, but it gives a precise reason to inspect AdamW's second-moment memory under heavy-tailed noise.

## Captured Figures and Tables

No figures or tables were captured from this paper. The PDF is a compact theory note built around equations, propositions, and proofs rather than visual assets.
