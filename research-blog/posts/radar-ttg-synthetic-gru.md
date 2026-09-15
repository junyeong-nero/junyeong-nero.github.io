How much time is left before an approaching target reaches a ship? If you know its distance and closing speed, dividing one by the other is a reasonable first answer. Radar positions are noisy, though, and a target can turn, weave, or follow a route that carries it across the line of sight for a while. During those intervals the division gives nonsense.

I built a simulator to work on this estimation problem end to end. It generates trajectories with known impact times, adds observation noise, tracks the observations with a Kalman filter, and trains a small recurrent model to estimate time-to-go (TTG). The same inference pipeline runs in C++17 with only the standard library.

The question I care about is whether observation history improves TTG estimates over a constant-speed calculation on a filtered state. When I first compared the two, the answer looked like a clear yes. But the comparison scripts were scoring each estimator on a different set of timestamps, so the numbers were not comparable. This note reports a reevaluation, run on September 13, 2026, of the saved model against both baselines on a common set of observations. It also covers what that comparison leaves out, where the simpler estimator is still better, and what each estimator costs per observation in Python CPU latency and process memory.

![Replay of a simulated approach, showing the true trajectory, noisy radar observations, the filtered track, and TTG curves.](assets/posts/ttg/demo.gif "Figure 1. Simulator replay. It shows one trajectory; the aggregate results below come from a separate test dataset, not from this recording.")

[Open the original demo video](https://github.com/junyeong-nero/simulator/blob/91e5b269a66514f75af0f4417128c9eb3eabf4f8/assets/demo.mp4) · [Source repository](https://github.com/junyeong-nero/simulator).

## Defining the target before building the model

TTG is the difference between a trajectory's impact time and the current observation time:

```text
TTG(t) = impact_time − t
```

The simulator puts a stationary ship at the origin. Coordinates are in meters, with x north, y east, and z up. A simulated sensor observes Cartesian position at 2 Hz with independent Gaussian noise of standard deviation 25 m on each axis. This is a deliberately simple observation model; it does not simulate a full radar detection process.

The first problem is labeling. A trajectory that passes the ship or hits the sea somewhere else has no ship-impact time. Giving it a target of zero would teach the model that a miss means an imminent hit. Giving it a large constant would mean something else, equally arbitrary.

I keep those runs with `will_hit = false` and a missing TTG label. They are useful for inspecting the generator but are excluded from TTG training. The consequence is worth stating plainly: the regressor estimates remaining time for impact trajectories like the ones in its training data. It does not estimate whether a target will hit. Closest point of approach is recorded separately as a diagnostic.

## A dataset whose labels can be checked

The generator integrates a three-dimensional point-mass model with gravity, drag, guidance, maneuver acceleration, and axial propulsion. Guidance and maneuver commands are summed before the lateral acceleration limit is applied. Propulsion stays separate, because projecting away velocity-aligned acceleration would remove the mechanism that maintains cruise speed.

Eleven profiles give different trajectory families: subsonic and supersonic sea-skimming approaches, isolated weaving and jinking, pop-up approaches, ballistic motion, loitering and rerouting drones, and sequenced maneuvers. They are synthetic presets, not reproductions of any particular weapon. Within each profile the generator varies initial conditions and maneuver parameters from a seed.

Having profiles this specific is mostly for debugging. A clean subsonic approach shows the basic tracking problem. A ballistic trajectory can be checked analytically. When a maneuver is isolated in its own profile, an unexpected turn or a loss of usable labels is much easier to trace than it would be if every profile mixed several behaviors.

One implementation detail decided whether the simulator was reproducible at all. RK4 evaluates the derivative four times per step, at intermediate states and times. A maneuver that advances a random generator or flips an internal phase on every derivative call makes the trajectory depend on evaluation order. So stochastic maneuver schedules are generated ahead of time and queried by time, and worker scheduling never chooses scenario seeds: the batch planner draws them before dispatching runs.

Plausible-looking motion is only one check. The generator also reports impact rates and closest-approach statistics per profile. Strong vertical maneuvers near sea level can turn most of a profile into sea impacts, leaving few examples with usable labels. Catching that is part of validating the dataset.

For this experiment I generated 2,200 runs for training and validation (seed 0) and 550 runs for testing (seed 777). Training and validation are split by whole run, stratified by profile, with about 15% held out. A prefix of one trajectory cannot land in training while its suffix lands in validation. Feature normalization is fit on eligible training samples only.

Each stage of the pipeline is inspectable on its own:

```text
Simulated motion → noisy positions and impact labels
                 → Singer Kalman filter
                 → eight features and training-only normalization
                 → GRU and linear output head
                 → TTG in seconds
```

Intermediate observations and tracks are stored as Parquet files, so a change to the filter or the evaluation can reuse the observations without regenerating the dataset.

## From a filtered state to a remaining time

The constant-speed estimate uses range R and range rate Rdot:

```text
TTG_constant_speed = −R / Rdot, when Rdot < 0
```

The first baseline gets range rate by differencing consecutive measured ranges. At a 0.5-second interval that difference picks up observation noise as readily as real motion. The second baseline takes position and velocity from a Singer Kalman filter and computes range rate as the projection of velocity onto the line of sight.

The filter estimates position, velocity, and acceleration. Its Singer model treats acceleration as temporally correlated, which lets it follow maneuvering motion. Both baselines still extrapolate the current closing motion, and as range rate approaches zero from below the quotient blows up even when the position estimate is fine.

The learned estimator takes eight features from the filtered track:

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

The constant-speed TTG feature is capped at 400 seconds for receding or nearly stationary range rates. That is an input convention, not a stand-in for missing labels, and it is why I later check a capped baseline as well.

The model is a single-layer GRU with 32 hidden units and a linear head, 4,065 parameters in total. The recurrent state carries information from earlier observations across updates, which matches the deployment interface: each track keeps one hidden-state array, and each new measurement triggers one recurrent update.

Training uses Huber loss on `log1p(TTG)`. Predictions are mapped back with `expm1` and clamped to be nonnegative before evaluation. The transform compresses differences at large TTG; reported errors are still in seconds. The first five usable tracking steps and padded sequence positions are excluded from the loss and from the original GRU evaluation.

Keeping the Kalman filter in the loop gives an explicit state estimate, a classical baseline, and residual features. Those are the reasons for the design, but the experiments here do not test them individually. That would take a raw-observation GRU, a model without recurrent history, and feature-removal runs.

## Scoring every estimator on the same timestamps

The original scripts used the same test dataset but different eligibility rules. The constant-speed baselines scored the approaching intervals defined by their own range-rate estimates. The GRU used its sequence mask, with the five-step warmup excluded, and did not require an approaching interval. A single row in the comparison table could therefore summarize different observations for each method.

For the reevaluation I kept the saved checkpoint, normalization, observations, and tracks; nothing was retrained or regenerated. The evaluator aligns the original measurements and stored tracks by run and timestamp, checks that measurements and labels match, and runs inference on each complete sequence before selecting the rows to score.

The common scoring rule:

1. Use impact sequences accepted by the existing sequence loader, with finite TTG labels and enough usable tracking steps.
2. Exclude the first five usable tracking steps for every estimator.
3. Keep only timestamps where both the measured and the Kalman-derived range rate are below −1e-6 m/s, so that both constant-speed estimates are defined.
4. Compute every method's error on exactly those run/timestamp pairs, and assign TTG bands from the same ground-truth values.

Excluded rows still go through GRU inference. If a receding interval were dropped from inference as well as scoring, the model would lose part of its history and I would be evaluating a different method. The hidden state resets at each new run, and normalization stays in double precision until the float32 cast at the GRU input.

| Evaluation population | Count |
| --- | ---: |
| Generated test runs | 550 |
| Impact sequences accepted by the loader | 503 |
| Eligible timestamps after warmup | 144,529 |
| Common timestamps used by all estimators | 113,047 |
| Eligible timestamps excluded from the common comparison | 31,482 |

All 503 loaded sequences contribute common timestamps, but only 78.2% of eligible timestamps survive. The measured baseline is undefined at 29,139 eligible timestamps and the Kalman baseline at 5,116, with overlap between the two. Everything in the next section is conditional on that shared domain; it is not an evaluation of every moment of an approach.

## Results on the common timestamps

The table reports sample-weighted MAE in seconds; every estimator in a row sees the same observations. Longer trajectories contribute more samples. The downloadable evaluation record also has averages that weight each run equally.

![Logarithmic bar chart comparing measurement-based constant-speed, Kalman-based constant-speed, and GRU MAE across four ground-truth TTG bands.](assets/posts/ttg/model-comparison.svg "Figure 2. Saved estimators reevaluated on 113,047 shared timestamps from 503 impact sequences. Constant-speed estimates here are uncapped, and the vertical axis is logarithmic. Capped results are in the next table.")

| Ground-truth TTG | Shared timestamps | Measurement MAE | Kalman MAE | GRU MAE |
| --- | ---: | ---: | ---: | ---: |
| 0–5 seconds | 4,148 | 1.77 | 0.43 | **0.24** |
| 5–15 seconds | 9,211 | 5.36 | 1.43 | **0.51** |
| 15–40 seconds | 22,140 | 76.00 | 6.12 | **1.29** |
| 40 seconds or more | 77,548 | 221.44 | 128.51 | **9.07** |

The GRU has lower MAE in every band on this subset. The gap is widest at 40 seconds or more, which is also where the constant-speed formula has the most remaining error. That is what you would expect if the learned estimator is picking up trajectory patterns that current closing speed cannot describe, though it does not show that recurrent memory specifically is responsible.

### How much of the gap is extreme estimates?

The uncapped Kalman baseline has an overall MAE of 89.49 seconds but a median absolute error of 4.07 seconds, and its largest absolute error is over 856,000 seconds. Numbers like that come from a near-zero denominator, not from any plausible flight duration.

As a sensitivity check I capped both constant-speed predictions at 400 seconds, the same limit the GRU input feature already uses. The cap was inherited from the implementation, not tuned on these results, and all methods keep the same common timestamps.

| Ground-truth TTG | Capped measurement MAE | Capped Kalman MAE | GRU MAE |
| --- | ---: | ---: | ---: |
| 0–5 seconds | 1.75 | 0.43 | **0.24** |
| 5–15 seconds | 4.98 | 1.31 | **0.51** |
| 15–40 seconds | 13.57 | 4.62 | **1.29** |
| 40 seconds or more | 68.17 | 29.69 | **9.07** |

The cap changes the scale of the comparison a lot. In the longest band, Kalman MAE drops from 128.51 to 29.69 seconds while the GRU stays at 9.07. The reduction relative to Kalman goes from about 93% to about 69%. The GRU still wins each band, but how much it wins by depends heavily on how the baseline is allowed to diverge.

The overall error distribution tells the same story:

| Estimator on common timestamps | MAE | Median absolute error | 95th-percentile absolute error |
| --- | ---: | ---: | ---: |
| Uncapped Kalman | 89.49 | 4.07 | 135.93 |
| Capped Kalman | 21.39 | 4.06 | 109.95 |
| GRU | **6.53** | **1.94** | **31.44** |

These are descriptive numbers from correlated trajectory samples, so I have not attached confidence intervals. Weighting runs equally instead gives overall MAE of 50.64 seconds for uncapped Kalman, 13.75 for capped Kalman, and 4.37 for the GRU. The ordering holds; the values move.

### Where the simpler estimator is still better

Winning every aggregate band does not mean winning every trajectory family. A few profiles illustrate this; the evaluation artifact has all eleven.

| Profile | Shared timestamps | Kalman MAE | GRU MAE |
| --- | ---: | ---: | ---: |
| Subsonic sea-skimming | 10,517 | 1.53 | **1.37** |
| Supersonic sea-skimming | 4,922 | **0.28** | 0.97 |
| Rerouting drone | 19,110 | 366.58 | **12.35** |
| Sequencing drone | 17,694 | 74.12 | **14.74** |

On supersonic sea-skimming, the Kalman constant-speed estimator is better. There is also an exception at the metric level near impact: in the 0 to 5 second band, Kalman has the lower median absolute error (0.15 seconds versus 0.20), while the GRU has the lower MAE and the lower 95th percentile (0.57 seconds versus 2.00). The GRU cuts the large errors without improving the typical sample in that band.

The excluded timestamps deserve the same attention. GRU MAE is 6.53 seconds on the shared subset, 13.80 seconds on the 31,482 excluded timestamps, and 8.11 seconds across all 144,529 eligible timestamps. The all-eligible figure matches the original model's overall MAE to displayed precision. So the common subset is easier for the GRU too, and quoting only the 6.53-second number would overstate its performance on the full eligible population.

### Why 32 hidden units

The saved model has hidden size 32. An earlier comparison trained sizes 32 and 64 with three seeds each. The smaller model has 4,065 parameters, about 15.9 KiB of float32 weights; the larger has 14,273, about 55.8 KiB. The recorded mean errors showed no consistent advantage for 64 across TTG bands, so I kept the cheaper model.

Those trials used the original GRU evaluation mask and I have not rerun them under the common mask, so their numbers should not be merged with the tables above. Three seeds is thin evidence about variability, and the tuning artifact predates the sequenced-maneuver profiles, so I would not call 32 optimal for the current dataset either.

## The cost of one observation update

Accuracy says nothing about what it costs to keep an estimator inside a tracking loop. I extended the evaluator to time each method in a fresh Python process on an Apple M2 running macOS 26.5.1, with Python 3.13.5, NumPy 2.5.2, and PyTorch 2.13.0. The benchmark uses CPU inference, batch size one, and numerical-library thread limits of one, with the existing observations, filter settings, normalization, and GRU weights.

Each method consumes 147,547 raw observations from the same 503 impact runs, replayed three times, for 442,641 timed updates per method. The accuracy comparison used 113,047 common timestamps, but the timing workload covers entire histories: the initial observation with no prediction, filter initialization, warmup, and intervals where a constant-speed estimate is undefined. Skipping those would undercount the tracking work and change the GRU's history.

The timer wraps each observation update through to its TTG result. Linear estimation differences successive measured ranges. Kalman runs the existing Singer filter update, including its innovation diagnostic, then computes constant-speed TTG. GRU timing includes that same filter plus feature extraction, float64 normalization, the float32 recurrent step, the linear head, and the inverse target transform, so the GRU number is the cost of the complete Python prediction path.

Before timing, each method processes the longest run once to warm library code and allocators. Filter and recurrent state reset at every subsequent run boundary. File I/O, model loading, run resets, and accuracy checks are outside the timer. Every full-sequence prediction from every repeat has to match the original evaluation within relative tolerance 1e-5 and absolute tolerance 1e-4 seconds, undefined outputs included. All three methods passed.

![Two linear-scale panels showing mean and p95 observation-update latency and fresh-process peak RSS for linear estimation, Kalman filtering and the complete GRU pipeline.](assets/posts/ttg/inference-performance.svg "Figure 3. Python CPU measurements on Apple M2: 147,547 observations per method, replayed three times. Upper panel: mean latency, with end marks at p95. Lower panel: process peak RSS, which includes the runtime and measurement buffers and is not the memory of model weights or per-track state. These do not benchmark the C++ deployment.")

| Estimator | Mean/update (µs) | Median/update (µs) | p95/update (µs) | Peak process RSS (MiB) |
| --- | ---: | ---: | ---: | ---: |
| Linear estimation (range differences) | 0.93 | 0.92 | 1.00 | 52.62 |
| Kalman filter + constant-speed TTG | 37.72 | 35.54 | 43.83 | 43.94 |
| GRU, including Kalman and features | 93.23 | 89.71 | 107.17 | 201.61 |

On this machine the full GRU path averages about 0.093 milliseconds per observation, against 0.038 for Kalman and 0.00093 for range differences. The lower error comes with a larger runtime cost. These are serial measurements on one host; they do not give a maximum track count, a real-time deadline, or throughput under concurrent ingestion.

The report keeps each repetition's mean and the p99 and maximum latency alongside the pooled average. Kalman repetition means were 40.69, 36.26, and 36.21 µs; GRU repetition means were 92.80, 95.92, and 90.97 µs. The single largest update was about 31 milliseconds for both pipelines. I have left that tail in the results; the measurements do not identify its cause. The median cost of two timer reads was 0.041 to 0.042 µs and was not subtracted, which matters most for the linear baseline.

### Process memory versus model memory

Peak RSS is measured with `ru_maxrss` in a separate worker per method, through inference and prediction validation. It includes the Python interpreter, the loaded numerical libraries, the weights, allocator caches, input and reference arrays, and timing buffers. The benchmark arrays alone are roughly 10 MiB. A process peak is not a per-model memory requirement, and the smaller Kalman RSS does not mean Kalman keeps less estimator state than the linear baseline.

To keep that distinction inspectable, the benchmark also records numeric payload sizes:

| Estimator | Per-track state (bytes) | Filter/normalization constants (bytes) | Learned weights (bytes) |
| --- | ---: | ---: | ---: |
| Linear estimation | 16 | 0 | 0 |
| Kalman filter | 752 | 1,584 | 0 |
| GRU, including Kalman | 880 | 1,712 | 16,260 |

These payloads exclude Python object overhead and temporary workspaces. The GRU's 16,260 bytes of weights are the same 4,065 float32 parameters described above, and its recurrent state adds 128 bytes over Kalman. The 201.61 MiB process peak is a Python process, not a 201.61 MiB neural network. Measuring the C++ implementation on its target hardware is a separate experiment.

## Carrying the estimator into C++

The deployment constraint, C++17 and the standard library only, shaped the model. Export writes weights, biases, normalization constants, and fixed-interval Kalman matrices into a generated header. A handwritten implementation runs the filter, feature extraction, normalization, GRU cell, linear head, and inverse target transform.

There are several places where a plausible implementation can silently diverge from Python. GRU gate order and the reset-gate treatment of the recurrent bias have to match PyTorch. A new track has to reset both Kalman and GRU state. Feature normalization has to use the exported training statistics. Filtering and normalization stay in double precision, with the float32 cast only at the GRU input.

While preparing this note I reran the checks of the committed C++ artifacts against the Python references. All 129,843 numerical comparisons passed. They cover filtered states, normalized features, intermediate GRU hidden states, outputs, and the full inference chain, with a maximum full-chain relative error of 6.992e-05 against a tolerance of 1e-4. Checking intermediate states across whole recurrent sequences catches accumulated drift that a single final prediction could hide.

This shows agreement with the reference under the tested sequences. It says nothing about operational accuracy or C++ latency; the timing experiment above measured the Python reference pipeline. The filter matrices are also baked for a fixed observation interval: passing a different `delta_t` changes an input feature but does not rebuild the transition and process-noise matrices.

## What this shows, and what it leaves open

On this synthetic test population, the saved GRU has lower sample-weighted MAE in every TTG band than both constant-speed baselines, and the ordering survives the 400-second cap. The same evaluation qualifies that result in three ways: the shared domain covers 78.2% of eligible timestamps, one clean profile favors Kalman, and near impact Kalman has the better median even though its tail is worse.

The resource benchmark adds the implementation tradeoff. On this host the full Python GRU path averages 93.23 µs per raw observation, against 37.72 µs for Kalman. Process peaks and numeric payload counts are reported separately so that runtime overhead is not confused with estimator state. Timing and memory depend on runtime, host, and workload; they are not deployment guarantees.

The test set uses a different generation seed but the same simulator and profile families as training, so it tests new draws from the configured synthetic distribution and nothing more. It does not speak to unfamiliar guidance behavior, real sensor recordings, moving ships, missed detections, clutter, or irregular observation intervals. The model has no calibrated uncertainty output, and the evaluation excludes the early tracking warmup.

Three follow-ups would sharpen the picture. Compare the GRU with a model that uses only the current features and with one that learns directly from raw observations, under the same scoring protocol. Hold out trajectory families or maneuver regimes instead of just generation seeds. And define a policy for the timestamps where the constant-speed formula is undefined, reporting prediction coverage next to error. All three are feasible because the simulator keeps the observations, labels, tracking states, and exported inference artifacts.

## Reproducing the evaluation

The reevaluation uses the existing test observations and saved model. From the simulator repository root:

```bash
uv run scripts/evaluate_ttg.py --dataset out/test --model out/model
uv run scripts/plot_scores.py
uv run python -m pytest
make -C cpp test
```

The evaluator runs three streaming benchmark passes per method by default. Use `--benchmark-repeats 5` for more repetitions, or `--skip-benchmark --output out/aligned/accuracy-only.json` for an accuracy-only artifact that preserves the benchmark report. Nondefault tracking requires matching `--dt`, `--tau`, `--sigma-maneuver` and `--sigma-measurement` values; incompatible observation intervals or predictions fail validation.

The first command writes `out/model/aligned_scores.json` and a per-timestamp audit at `out/aligned/predictions.parquet`. The JSON contains the scoring protocol, shared-sample counts, all profile and band summaries, input and source hashes, model configuration, runtime versions, and a `performance` section with the timing and memory protocol, host details, per-repeat means, latency distributions, and numeric payload sizes. The full Python suite passed 178 tests, and C++ parity passed all 129,843 comparisons. The audit keeps predictions and masks so the selected rows can be inspected. The test observations are generated artifacts; a fresh clone has to follow the README's dataset and tracking instructions before reevaluating. The committed C++ parity references can be checked without regenerating data or retraining.

- [Download the aligned evaluation record](assets/posts/ttg/aligned-scores.json).
- [Simulator source and reproduction instructions](https://github.com/junyeong-nero/simulator).
- [Saved model and original training scores](https://github.com/junyeong-nero/simulator/tree/91e5b269a66514f75af0f4417128c9eb3eabf4f8/out/model).
- [Historical three-seed hidden-size comparison](https://github.com/junyeong-nero/simulator/blob/91e5b269a66514f75af0f4417128c9eb3eabf4f8/out/hidden_compare.json).

The tables and Figures 2 and 3 use the same downloadable evaluation record. Both SVGs are generated from that record and take their colors from this blog's CSS: its warm canvas, neutral baseline colors, and coral GRU accent. The original training scores and historical hidden-size results keep their original masks and provenance.
