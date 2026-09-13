How much time remains before an approaching target reaches a ship? If its distance and closing speed are known, dividing one by the other seems like a reasonable starting point. Radar gives noisy positions, however, and a target can turn, weave, or follow a route that temporarily carries it across the line of sight.

I built a simulator to investigate this estimation problem from data generation through deployment. It produces trajectories with known impact times, adds observation noise, tracks the observations with a Kalman filter, and trains a small recurrent model to estimate **Time-To-Go (TTG)**. The same inference pipeline runs in C++17 using only the standard library.

The central question is whether observation history improves TTG estimates beyond a constant-speed calculation using a filtered state. Answering that question also requires deciding **which timestamps each estimator is being judged on**. This note reports a September 13, 2026 reevaluation of the saved model on a common set of observations, including the cases excluded by that comparison and the conditions where the simpler estimator remains better. It now also measures the cost of processing one observation at a time: Python CPU inference latency and peak process memory for all three estimators.

![Replay of a simulated approach, showing the true trajectory, noisy radar observations, the filtered track, and TTG curves.](assets/posts/ttg/demo.gif "Figure 1. The existing simulator replay makes the estimation chain inspectable. It illustrates a trajectory; the aggregate results below come from a separate test dataset, not from the demo recording.")

[Open the original demo video](https://github.com/junyeong-nero/simulator/blob/91e5b269a66514f75af0f4417128c9eb3eabf4f8/assets/demo.mp4) · [Source repository](https://github.com/junyeong-nero/simulator).

## Defining the prediction before building the model

TTG is the difference between a trajectory's impact time and its current observation time:

```text
TTG(t) = impact_time − t
```

The simulator places a stationary ship at the origin. Coordinates are measured in meters, with x pointing north, y east, and z up. A simulated sensor observes Cartesian position at 2 Hz, with independent Gaussian noise of standard deviation 25 m on each axis. These are explicit experimental assumptions; the observation model does not simulate a complete radar detection process.

There is an immediate labeling issue. A trajectory that passes the ship or hits the sea elsewhere has no ship-impact time. Assigning it a target of zero would teach the model that a miss means an imminent impact. Assigning a large constant would introduce a different, arbitrary meaning.

I therefore retain non-impact runs with `will_hit = false` and missing TTG labels. They remain available for inspecting the generator, but are excluded from TTG training. **The resulting regressor estimates remaining time for the impact trajectories represented in its training data. It does not estimate whether a target will hit.** Closest point of approach is recorded separately as a diagnostic.

## Building a dataset whose labels can be checked

The generator integrates a three-dimensional point-mass model with gravity, drag, guidance, maneuver acceleration, and axial propulsion. Guidance and maneuver commands are combined before applying the lateral acceleration limit. Propulsion remains separate because projecting away velocity-aligned acceleration would remove the mechanism that maintains cruise speed.

Eleven profiles provide different trajectory families: subsonic and supersonic sea-skimming approaches, isolated weaving and jinking, pop-up approaches, ballistic motion, loitering and rerouting drones, and sequenced maneuvers. These are synthetic presets, not reproductions of particular weapon specifications. For each run, the generator varies initial conditions and maneuver parameters using a seed.

The profile structure provides useful controls. A clean subsonic approach makes the basic tracking problem visible. A ballistic trajectory supports analytical checks. Isolating a maneuver in a profile makes an unexpected turn or loss of usable labels easier to investigate than if every profile combined several behaviors.

One implementation detail affected whether the simulator was reproducible. RK4 evaluates the derivative four times at intermediate states and times during each integration step. A maneuver that advances a random generator or changes an internal phase on every derivative call makes the trajectory depend on evaluation order. Stochastic maneuver schedules are therefore generated in advance and queried by time. Worker scheduling likewise does not choose scenario seeds: the batch planner draws them before dispatching runs.

Plausible-looking motion is only one check. The generator also reports impact rates and closest-approach statistics by profile. Strong vertical maneuvers near sea level can turn much of a profile into sea impacts, leaving few examples with usable TTG labels. Inspecting that failure is part of dataset validation.

The experiment generated **2,200 runs for training and validation and 550 runs for testing**, using seeds 0 and 777 respectively. Training and validation are separated by whole run, stratified by profile, with approximately 15% held out for validation. A prefix of one trajectory cannot enter training while its suffix enters validation. Feature normalization is fitted only on eligible training samples.

The data pipeline keeps each stage inspectable:

```text
Simulated motion → noisy positions and impact labels
                 → Singer Kalman filter
                 → eight features and training-only normalization
                 → GRU and linear output head
                 → TTG in seconds
```

Intermediate observations and tracks are stored in Parquet files. A filter or evaluation change can reuse those observations without generating another dataset.

## From a filtered state to a remaining time

The constant-speed estimate uses range R and range rate Rdot:

```text
TTG_constant_speed = −R / Rdot, when Rdot < 0
```

The first baseline estimates range rate from consecutive measured ranges. At a 0.5-second interval, differencing exposes the estimate to changes in observation noise as well as actual motion. The second baseline obtains position and velocity from a Singer Kalman filter and computes range rate as the projection of velocity onto the line of sight.

The filter estimates position, velocity, and acceleration. Its Singer model represents temporally correlated acceleration, allowing tracking to account for maneuvering motion. Both baselines still extrapolate the current closing motion. When range rate approaches zero from below, the quotient becomes arbitrarily large even if the position estimate is accurate.

The learned estimator receives eight features derived from the filtered track:

| Feature | Role in the input |
| --- | --- |
| `log1p(range)` | Compress the distance scale |
| Range rate | Describe closing or receding motion |
| Constant-speed TTG | Supply the geometric estimate, capped at 400 seconds |
| Speed | Describe total motion, including motion across the line of sight |
| Lateral acceleration magnitude | Describe estimated turning intensity |
| Approach-direction cosine | Describe how directly velocity points toward the ship |
| Innovation magnitude | Describe disagreement between the observation and filter prediction |
| Observation interval | Record elapsed time at a track update |

For the TTG input feature, receding or nearly stationary range rates receive the 400-second cap. This is an input convention, not a replacement for missing ground-truth labels. It also motivates checking a capped baseline when interpreting the learned model's results.

The model is a **single-layer GRU with 32 hidden units and a linear head**, totaling 4,065 parameters. At each update, the recurrent state carries information from earlier observations. That structure fits the deployment interface: each track retains one hidden-state array, and a new measurement triggers one recurrent update.

Training uses Huber loss on `log1p(TTG)`. Predictions are transformed back with `expm1` and clamped to nonnegative values for evaluation. The target transform compresses differences at large TTG values; the reported errors are still measured in seconds. The first five usable tracking steps and padded sequence positions are excluded from loss and from the original GRU evaluation.

Keeping the Kalman filter provides an explicit state estimate, a classical baseline, and residual features. These are design motivations. The experiments here do not isolate their individual contributions: a raw-observation GRU, a model without recurrent history, and feature-removal experiments would be needed to test those explanations directly.

## Evaluating every estimator at the same timestamps

The original scripts used the same generated test dataset but different eligibility rules. The constant-speed baselines evaluated approaching intervals according to their respective range-rate estimates. The GRU used its sequence mask, including a five-step warmup exclusion, without requiring an approaching interval. Consequently, a row in the comparison table could summarize different observations for different methods.

For this reevaluation, I retained the saved checkpoint, normalization, observations, and tracks. **No model was retrained and no new dataset was generated.** The evaluator aligns original measurements and stored tracks by run and timestamp, checks that measurements and labels match, and performs inference on each complete sequence before selecting scoring rows.

The common scoring rule is:

1. Use impact sequences accepted by the existing sequence loader, with finite TTG labels and enough usable tracking steps.
2. Exclude the first five usable tracking steps for every estimator.
3. Retain only timestamps where both measured and Kalman-derived range rates are below −1e-6 m/s, so both constant-speed estimates are defined.
4. Compute every method's error on exactly those run/timestamp pairs. Select TTG bands using the same ground-truth values.

Excluded scoring rows still participate in GRU inference. Otherwise, removing a receding interval would also remove part of the model's history and change the method being evaluated. The hidden state is reset at each new run. Normalization remains double precision until inputs are cast to float32 at the GRU boundary.

| Evaluation population | Count |
| --- | ---: |
| Generated test runs | 550 |
| Impact sequences accepted by the loader | 503 |
| Eligible timestamps after warmup | 144,529 |
| Common timestamps used by all estimators | 113,047 |
| Eligible timestamps excluded from the common comparison | 31,482 |

All 503 loaded sequences contribute common timestamps, but only **78.2% of eligible timestamps** remain. The measured baseline is undefined at 29,139 eligible timestamps and the Kalman baseline at 5,116; these sets overlap. The comparison is conditional on their shared domain, not an evaluation of every moment of an approach.

## What changes under the common scoring rule

The following table reports sample-weighted MAE in seconds. Every estimator within a row uses the same observations. Longer trajectories contribute more samples; the downloadable evaluation record also reports averages that give each represented run equal weight.

![Logarithmic bar chart comparing measurement-based constant-speed, Kalman-based constant-speed, and GRU MAE across four ground-truth TTG bands.](assets/posts/ttg/model-comparison.svg "Figure 2. Reevaluation of the saved estimators on 113,047 shared timestamps from 503 impact sequences. Constant-speed estimates in this figure are uncapped. The vertical axis is logarithmic; capped-baseline results are reported separately below.")

| Ground-truth TTG | Shared timestamps | Measurement MAE | Kalman MAE | GRU MAE |
| --- | ---: | ---: | ---: | ---: |
| 0–5 seconds | 4,148 | 1.77 | 0.43 | **0.24** |
| 5–15 seconds | 9,211 | 5.36 | 1.43 | **0.51** |
| 15–40 seconds | 22,140 | 76.00 | 6.12 | **1.29** |
| 40 seconds or more | 77,548 | 221.44 | 128.51 | **9.07** |

GRU MAE is lower in each TTG band on this common subset. The largest absolute difference occurs at 40 seconds or more, where the constant-speed formula has the greatest remaining error. This is consistent with a learned estimator handling trajectory patterns that current closing speed cannot describe. It does not establish that recurrent memory alone caused the improvement.

### How much of the difference comes from extreme estimates?

The uncapped Kalman baseline has an overall MAE of 89.49 seconds but a median absolute error of 4.07 seconds. Its largest absolute error exceeds 856,000 seconds. Such an output reflects a nearly zero denominator in the formula, rather than a plausible flight duration.

I therefore evaluated a sensitivity check: cap both constant-speed predictions at **400 seconds**, the existing limit used in the GRU input feature. The cap was inherited from the implementation and was not optimized on these results. All methods retain the same common timestamps.

| Ground-truth TTG | Capped measurement MAE | Capped Kalman MAE | GRU MAE |
| --- | ---: | ---: | ---: |
| 0–5 seconds | 1.75 | 0.43 | **0.24** |
| 5–15 seconds | 4.98 | 1.31 | **0.51** |
| 15–40 seconds | 13.57 | 4.62 | **1.29** |
| 40 seconds or more | 68.17 | 29.69 | **9.07** |

The cap changes the scale of the comparison substantially. In the longest TTG band, Kalman MAE falls from 128.51 to 29.69 seconds, while GRU remains at 9.07 seconds. Using the displayed values, the reduction relative to Kalman changes from approximately 93% to 69%. **The learned estimator's advantage remains in these bands, but its apparent magnitude depends strongly on how the baseline handles divergence.**

The overall error distribution provides another view:

| Estimator on common timestamps | MAE | Median absolute error | 95th-percentile absolute error |
| --- | ---: | ---: | ---: |
| Uncapped Kalman | 89.49 | 4.07 | 135.93 |
| Capped Kalman | 21.39 | 4.06 | 109.95 |
| GRU | **6.53** | **1.94** | **31.44** |

These are descriptive measurements from correlated trajectory samples, not independent-trial confidence intervals. Equal weighting of runs yields overall MAE of 50.64 seconds for uncapped Kalman, 13.75 seconds for capped Kalman, and 4.37 seconds for GRU. The ordering survives this alternative aggregation, although the values change.

### Where the simpler estimator remains better

An improvement in every aggregate TTG band does not imply improvement in every trajectory family. Selected profile results illustrate that distinction; the evaluation artifact includes all eleven profiles.

| Profile | Shared timestamps | Kalman MAE | GRU MAE |
| --- | ---: | ---: | ---: |
| Subsonic sea-skimming | 10,517 | 1.53 | **1.37** |
| Supersonic sea-skimming | 4,922 | **0.28** | 0.97 |
| Rerouting drone | 19,110 | 366.58 | **12.35** |
| Sequencing drone | 17,694 | 74.12 | **14.74** |

The supersonic sea-skimming profile favors the Kalman-based constant-speed estimator. There is also a metric-level exception near impact: in the 0–5 second band, Kalman has a lower median absolute error, **0.15 seconds versus 0.20 seconds**, while GRU has lower MAE and a lower 95th percentile, 0.57 seconds versus 2.00 seconds. A method can reduce larger errors without improving the typical sample in that band.

The excluded timestamps deserve equal attention. GRU MAE is 6.53 seconds on the shared subset, **13.80 seconds on the 31,482 excluded timestamps**, and 8.11 seconds across all 144,529 eligible timestamps. The all-eligible result reproduces the original model's overall MAE to displayed precision. The common subset is easier for the GRU as well, so reporting only its 6.53-second score would overstate performance across the full eligible population.

### Why retain 32 hidden units?

The saved model uses hidden size 32. A historical comparison trained sizes 32 and 64 with three seeds each. The smaller model has 4,065 parameters, about 15.9 KiB of float32 weights; the larger has 14,273, about 55.8 KiB. The recorded mean errors did not show a consistent advantage for 64 across TTG bands.

Those trials used the original GRU evaluation mask and were **not rerun under the common mask in this note**. They document the engineering rationale for retaining the cheaper model, but should not be merged numerically with the new tables. Three seeds also provide limited evidence about variability. The broader tuning artifact predates the addition of sequenced-maneuver profiles, which further limits claims of an optimal configuration for the current dataset.

## Measuring the cost of an observation update

Accuracy does not reveal the cost of keeping an estimator in a tracking loop. I extended the evaluator to measure each method in a fresh Python process on **Apple M2, macOS 26.5.1, Python 3.13.5, NumPy 2.5.2 and PyTorch 2.13.0**. The benchmark uses CPU inference, a batch size of one, and numerical-library thread limits of one. It retains the existing observations, filter settings, normalization and GRU weights.

Each method consumes **147,547 raw observations from the same 503 impact runs, repeated three times**: 442,641 timed updates per method. The accuracy comparison still uses 113,047 common timestamps, but the timing workload includes the entire histories: the initial observation without a prediction, filter initialization, warmup and intervals where a constant-speed estimate is undefined. Skipping those updates would undercount tracking work and change GRU history.

A timer surrounds each observation update through its TTG result. Linear estimation computes the difference between successive measured ranges. Kalman performs the existing Singer filter update, including its innovation diagnostic, then computes constant-speed TTG. **GRU timing includes the same filter, feature extraction, float64 normalization, the float32 recurrent step, linear head and inverse target transform.** It is the complete Python prediction path, not just the neural network cell.

Before timing, each method processes the longest run once to warm library code and allocators. The filter and recurrent state reset at every subsequent run boundary. File I/O, loading the model, run resets and accuracy checks sit outside the timer. Every full-sequence prediction from every repeat must match the original evaluation within relative tolerance 1e-5 and absolute tolerance 1e-4 seconds, with undefined outputs matching as well. All three methods passed this check.

![Two linear-scale panels showing mean and p95 observation-update latency and fresh-process peak RSS for linear estimation, Kalman filtering and the complete GRU pipeline.](assets/posts/ttg/inference-performance.svg "Figure 3. Python CPU measurements on Apple M2: 147,547 observations per method, replayed three times. In the upper panel, bars show mean latency and end marks show p95. The lower panel reports process peak RSS, including the runtime and measurement buffers; it is not the memory occupied by model weights or per-track state. These measurements do not benchmark C++ deployment.")

| Estimator | Mean/update (µs) | Median/update (µs) | p95/update (µs) | Peak process RSS (MiB) |
| --- | ---: | ---: | ---: | ---: |
| Linear estimation (range differences) | 0.93 | 0.92 | 1.00 | 52.62 |
| Kalman filter + constant-speed TTG | 37.72 | 35.54 | 43.83 | 43.94 |
| GRU, including Kalman and features | 93.23 | 89.71 | 107.17 | 201.61 |

On this machine, the full GRU path averages about **0.093 milliseconds per observation**, compared with 0.038 milliseconds for Kalman and 0.00093 milliseconds for range differences. Its lower TTG error comes with a larger Python runtime cost. These are serial measurements on one host. They do not establish a maximum track count, a hard real-time deadline, or throughput under concurrent ingestion.

The report retains each repetition's mean and the p99 and maximum latency, rather than only the pooled average. For example, the Kalman repetition means were 40.69, 36.26 and 36.21 µs, and the GRU repetition means were 92.80, 95.92 and 90.97 µs. The largest individual update was about 31 milliseconds for both pipelines. That tail remains in the results; the measurements alone do not identify its cause. The median cost of two timer reads was 0.041–0.042 µs and was not subtracted, which matters particularly for the fast linear baseline.

### Process memory and model memory answer different questions

Peak RSS is measured with `ru_maxrss` in a separate worker for each method, through inference and prediction validation. It includes the Python interpreter, loaded numerical libraries, weights, allocator caches, input/reference arrays and timing buffers. The benchmark arrays alone occupy roughly 10 MiB. **A process peak is not an incremental per-model memory requirement.** The smaller observed Kalman RSS does not mean it retains less estimator state than the linear baseline.

To make that distinction inspectable, the benchmark also records numeric payload sizes:

| Estimator | Per-track state (bytes) | Filter/normalization constants (bytes) | Learned weights (bytes) |
| --- | ---: | ---: | ---: |
| Linear estimation | 16 | 0 | 0 |
| Kalman filter | 752 | 1,584 | 0 |
| GRU, including Kalman | 880 | 1,712 | 16,260 |

These payloads exclude Python object overhead and temporary workspaces. The GRU's 16,260 bytes of weights are the same 4,065 float32 parameters described above; adding recurrent state increases the state payload by 128 bytes over Kalman. The 201.61 MiB process peak therefore should not be described as a 201.61 MiB neural network. Measuring the standard-library C++ implementation on its target hardware remains a separate experiment.

## Carrying the estimator into C++

The deployment constraint shaped the model: C++17 and the standard library only. Export writes weights, biases, normalization constants, and fixed-interval Kalman matrices into a generated header. The handwritten implementation runs the filter, feature extraction, normalization, GRU cell, linear head, and inverse target transform.

There are several places where a plausible implementation can still differ from Python. The GRU gate order and reset-gate treatment of recurrent bias must match PyTorch. A new track must reset both Kalman and GRU state. Feature normalization must use the exported training statistics. Filtering and normalization remain double precision, with the cast to float32 occurring only at the GRU input.

I checked the committed C++ artifacts against the Python references again while preparing this note. **All 129,843 numerical comparisons passed.** The checks cover filtered states, normalized features, intermediate GRU hidden states, outputs, and the full inference chain. Maximum full-chain relative error was 6.992e-05 against a tolerance of 1e-4. Checking intermediate states across complete recurrent sequences helps locate accumulated differences that a single final prediction could hide.

This establishes agreement with the reference implementation under the tested sequences. These parity checks do not measure operational accuracy or C++ processing latency; the timing experiment above measures the Python reference pipeline. The filter matrices are also baked for a fixed observation interval: passing a different `delta_t` to the estimator changes an input feature, but does not rebuild its transition and process-noise matrices.

## What this experiment establishes, and what remains open

The common-timestamp reevaluation supports a specific result: on this synthetic test population, the saved GRU has lower sample-weighted MAE in each TTG band than the two constant-speed baselines, including a 400-second capped sensitivity check. It also exposes qualifications that affect how that result should be used: shared-domain coverage is 78.2%, one clean profile favors Kalman, and the terminal median favors Kalman even when its tail is worse.

The new resource experiment adds a measured implementation tradeoff: on this host, the full Python GRU path averages 93.23 µs per raw observation, versus 37.72 µs for Kalman. Separate process peaks and numeric payload counts keep runtime overhead distinct from estimator state. Timing and memory results depend on the runtime, host and workload; they are not deployment guarantees.

The test set uses a different generation seed but the same simulator and profile families as training. That tests new draws from the configured synthetic distribution. It does not establish generalization to unfamiliar guidance behavior, real sensor recordings, moving ships, missed detections, clutter, or irregular observation intervals. The model also has no calibrated uncertainty output, and the evaluation excludes the early tracking warmup.

Three follow-up experiments would sharpen the interpretation. First, compare the GRU with a model using only the current features and with one learning directly from raw observations, using the same scoring protocol. Second, hold out trajectory families or maneuver regimes rather than only generation seeds. Third, define and evaluate a policy for the timestamps where the constant-speed formula is undefined, reporting prediction coverage alongside error.

The simulator makes these questions testable because it preserves the observations, labels, tracking states, and exported inference artifacts. The useful outcome is both an estimator and an evaluation record that makes its gains, exceptions, and domain of comparison inspectable.

## Reproducing the evaluation

The reevaluation uses the existing test observations and saved model. From the simulator repository root:

```bash
uv run scripts/evaluate_ttg.py --dataset out/test --model out/model
uv run scripts/plot_scores.py
uv run python -m pytest
make -C cpp test
```

The evaluator now runs three streaming benchmark passes per method by default. Use `--benchmark-repeats 5` for additional repetitions, or `--skip-benchmark --output out/aligned/accuracy-only.json` for an accuracy-only artifact that preserves the benchmark report. Nondefault tracking requires matching `--dt`, `--tau`, `--sigma-maneuver` and `--sigma-measurement` values; incompatible observation intervals or predictions fail validation.

The first command writes `out/model/aligned_scores.json` and a per-timestamp audit at `out/aligned/predictions.parquet`. The JSON contains the scoring protocol, shared-sample counts, all profile and band summaries, input and source hashes, model configuration, runtime versions, and a `performance` section containing the timing/memory protocol, host details, per-repeat means, latency distributions and numeric payload sizes. The full Python suite passed 178 tests, and C++ parity again passed all 129,843 comparisons. The audit retains predictions and masks so the selected rows can be inspected. The test observations are generated artifacts; a fresh clone must follow the README's dataset and tracking instructions before reevaluating. The committed C++ parity references can be checked without regenerating data or retraining.

- [Download the aligned evaluation record](assets/posts/ttg/aligned-scores.json).
- [Simulator source and reproduction instructions](https://github.com/junyeong-nero/simulator).
- [Saved model and original training scores](https://github.com/junyeong-nero/simulator/tree/91e5b269a66514f75af0f4417128c9eb3eabf4f8/out/model).
- [Historical three-seed hidden-size comparison](https://github.com/junyeong-nero/simulator/blob/91e5b269a66514f75af0f4417128c9eb3eabf4f8/out/hidden_compare.json).

The tables and Figures 2–3 use the same downloadable aligned evaluation record. Both SVGs are generated from that record; their colors are read from this blog’s CSS tokens, using its warm canvas, neutral baseline colors and coral GRU accent. The original training scores and historical hidden-size results retain their original masks and provenance.
