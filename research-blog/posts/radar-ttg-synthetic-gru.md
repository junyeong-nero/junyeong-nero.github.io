A balloon can drift with the wind while changing altitude. A multicopter can stop, turn, or lose some lift, and a descending object can suddenly acquire much more drag when a parachute opens. The common observation problem is **how much time remains until a tracked object first enters a fixed observation zone**.

This September 16, 2026 experiment rebuilds the synthetic dataset around that question and compares GRU, LSTM, causal temporal convolution and a single-step MLP. It includes 21 motion profiles, validation-only hyperparameter selection, three training seeds per selected model, and an independently generated test set. The previous dataset and its performance numbers are superseded; they used a different event definition and are not comparable to these results.

On all eligible test observations, GRU achieved a run-macro mean absolute error of **4.24 ± 0.16 s**, compared with **4.88 ± 0.29 s** for LSTM, **4.95 ± 0.10 s** for TCN and **8.33 ± 0.14 s** for MLP. The ± values are sample standard deviations across three training seeds. GRU was strongest overall under this protocol, but it did not win every motion profile.

![Replay of balloon wind shear, a hovering multicopter, and an outside figure-eight circuit.](assets/posts/ttg/demo.gif "Figure 1. The new replay shows independent airborne motion, noisy observations, a filtered track and estimated time to zone entry. The blue sphere has a 1 km radius. Demo trajectories are illustrations; aggregate scores come from the separate test dataset.")

[Watch the MP4](assets/posts/ttg/demo.mp4) · [Source repository](https://github.com/junyeong-nero/uav-lab) · [Download comparison results](assets/posts/ttg/comparison.json).

## Define the event before fitting a predictor

The observation station is fixed at the origin, with x north, y east and z up. Distances are meters, time is seconds, and the ground is z = 0. The observation zone is a sphere of radius 1,000 m. Its center is an evaluation reference; the motion controllers follow independent schedules without access to it.

```text
entry_time = first time the trajectory intersects the 1,000 m sphere
TTG(t) = entry_time − t
```

The simulator detects the first segment–sphere intersection, including crossings whose two integration endpoints are both outside. If entry and ground contact occur within the same step, the earlier event wins. Recording ends at entry, ground contact, or the configured limit.

A non-entering trajectory has `will_enter = false` and a missing TTG label: NaN in memory and null in Parquet. These labels are never replaced with zero or a large number. Non-entry here means no entry during the recorded interval; a finite horizon does not prove that an object can never enter later. Closest point of approach (CPA) describes only that recorded interval.

**The regressor is conditional on eventual entry. It is not an entry classifier, an object identifier, or an entry-probability estimator.** An output on an outside circuit has no supervised TTG interpretation. Those tracks remain useful for evaluating position and velocity tracking.

## Add causes of trajectory changes, not just curve shapes

The original nine observation profiles remain as controls: straight, fast, oscillating, irregular, climbing, descending and slow transit, plus outside crossing and receding routes. Twelve additions introduce distinct physical or scheduled causes of motion change.

| Addition | What changes | What remains simplified |
| --- | --- | --- |
| Balloon drift | Prescribed net buoyancy and steady wind | No gas expansion or thermal model |
| Balloon wind shear | Crosswind varies with altitude | A local linear shear field |
| Balloon buoyancy loss | Net vertical lift changes smoothly | A prescribed event, not balloon thermodynamics |
| Hover and resume | Requested horizontal velocity briefly becomes zero | Point-mass velocity control |
| Route turn | A temporary 40-degree heading offset | No attitude or rotor model |
| Outside circuit | A continuously rotating velocity schedule | Independent of the observation center |
| Figure-eight circuit | Two sinusoidal velocity components | An outside route with no entry target |
| Gust and recovery | A finite crosswind pulse | Smooth onset and decay |
| Reduced thrust | Available thrust temporarily falls to 55% | No battery or motor failure dynamics |
| Speed change | Requested speed temporarily increases | A prescribed schedule |
| Turbulent crosswind | Seeded smooth wind fluctuations | Sinusoids, not a validated turbulence spectrum |
| Parachute deployment | Effective drag area increases over two seconds | No canopy inflation or pendulum dynamics |

For a balloon, acceleration combines drag relative to local air with prescribed **net buoyancy minus gravity per unit mass**. For a multicopter, acceleration combines gravity, relative-air drag and a bounded full thrust vector. A parachute changes the drag area of a passive descending mass. This distinction matters at zero velocity: a hovering object still needs vertical lift. Passing its thrust through a filter that keeps only acceleration perpendicular to velocity would give the wrong model.

Wind has a mean component, altitude-dependent shear, optional finite gusts and seeded sinusoidal fluctuations. Event ramps use smooth transitions. Sudden trajectory changes therefore arise from a force or command transition followed by integration, rather than teleporting position or overwriting a path.

These are teaching models, not calibrated aircraft or weather models. The [NWS radiosonde description](https://www.weather.gov/upperair/factsheet) provides physical context for balloon drift with ambient wind; it does not validate these numerical parameters.

RK4 evaluates forces four times per step. Every force query must therefore be a pure function of time and state. Random frequencies and phases are drawn before integration; repeated or reordered queries return identical values. Tests also translate the observer and confirm that free motion does not change.

## Freeze the data and the experiment protocol

A 63-run pilot, using seed 123, checked finite trajectories and per-profile entry coverage. The main experiment then generated **630 training-source runs** with seed 0 and **210 independent test runs** with seed 777: 30 and 10 runs per profile respectively. The two datasets share profile families, not random draws. This is an in-distribution test; it does not test generalization to unseen motion families.

The generator varies bearing, initial range, altitude, speed, route offset, selected motion amplitudes, wind strength and event timing. Bearings span the full circle. Scenario and sensor seeds are planned before worker dispatch, and each run retains its complete specification in `spec_json`.

Physics uses a 0.05 s RK4 step. The synthetic sensor observes Cartesian position at 2 Hz with independent Gaussian noise of standard deviation 25 m on each axis. There are no missed detections, clutter, multiple-object associations or angular/range-dependent sensor errors in this experiment.

The training-source dataset contains **128,930 observations**, including **504 entering runs** and 126 non-entering runs. The split assigns **436 entering runs to training and 68 to validation**. The test set contains **43,200 observations**, **167 entering runs** and 43 non-entering runs. After initialization and warmup masks, **25,598 timestamps** are eligible for learned-model scoring.

The outside crossing, receding, circuit and figure-eight profiles contribute 40 intentionally non-entering test runs. Wind shear adds three more non-entering balloon runs: they reach the 300 s horizon with recorded CPA of 1,073.7–1,310.6 m. Balloon shear enters in 24/30 training-source runs and 7/10 test runs; the other 16 entering-profile families enter in all 10 test runs each. The 3/3 pilot entry result did not guarantee that larger-sample coverage. No parameters were changed after observing these test outcomes.

Training and validation split by whole run, stratified by profile, using split seed 1 and a nominal 15% validation fraction. Training-only valid samples determine normalization. The first five usable filter feature steps and padded sequence steps are masked in both training and evaluation. Entire sequences, including warmup, still pass through the model so scoring masks cannot change its history.

Long balloon tracks contain many more timestamps than fast transit tracks. Training therefore averages Huber loss within each run before averaging runs in a batch. Validation selection uses **run-macro MAE**: compute each run's mean absolute error in seconds, then average those values. Sample-weighted MAE is also reported, because it answers a different question about a randomly selected timestamp.

## Keep the inputs identical across model families

The pipeline is:

```text
Independent motion → noisy positions and entry labels
                   → Singer Kalman filter
                   → eight features and training-only normalization
                   → GRU / LSTM / causal TCN / single-step MLP
                   → nonnegative time in seconds
```

The Singer filter estimates position, velocity and correlated acceleration. It uses a 20 s acceleration correlation time, 10 m/s² maneuver scale and 25 m measurement noise. Filtering and normalization use float64; normalized model inputs use float32. The covariance update uses the Joseph form, with two observations for initialization.

| Feature | Meaning |
| --- | --- |
| `log1p(range)` | Compressed distance to the station |
| Range rate | Instantaneous closing or receding motion |
| Capped radial entry estimate | A geometric time estimate, capped at 400 s |
| Speed | Total estimated motion |
| Lateral acceleration magnitude | Estimated change of direction |
| Closing cosine | Alignment with the inward line of sight |
| Innovation norm | Observation disagreement with the filter |
| `delta_t` | Time since the previous usable feature; first value is zero |

No model receives the profile label, true position, future event schedule or true entry time as an input. Normalization is refit from the same training partition for every fit and is identical across seeds and families.

The GRU and LSTM each have one recurrent layer and a linear head. The MLP has two hidden ReLU layers and no learned temporal state, although its Kalman-derived inputs already summarize history. The TCN uses four residual causal convolutions, kernel width 3 and dilations 1, 2, 4 and 8, with left-only padding. Its receptive field is 31 observations, spanning 15 s at 2 Hz. It has no access to later observations. Streaming retains this finite window and recomputes the last prediction.

The model families draw on [Cho et al.'s gated recurrent model](https://arxiv.org/abs/1406.1078), [Hochreiter and Schmidhuber's LSTM](https://www.bioinf.jku.at/publications/older/2604.pdf), and the causal convolution comparison of [Bai, Kolter and Koltun](https://arxiv.org/abs/1803.01271). The TCN here is a small local implementation, not a reproduction of that paper's benchmark or a transfer of its performance claims.

## Hyperparameter selection uses validation only

Each family receives the same six-trial budget. The reference setting uses hidden width 32, learning rate 0.003, log targets and zero weight decay. Five additional trials independently change width to 16, width to 64, learning rate to 0.001, targets to raw seconds, or weight decay to 0.0001. This is a limited one-factor search, not a full factorial or architecture-specific optimization.

Each trial uses Adam, Huber loss with delta 1, gradient clipping at norm 1, batch size 64, at most 60 epochs and patience 10. The best checkpoint minimizes validation run-macro MAE. A change smaller than 0.0001 s does not reset patience. Equal trial and epoch budgets do not imply equal parameter counts, compute cost or equally optimized architectures. Raw and log targets also place Huber's delta in different units.

All four configuration choices are saved before test access. Each selected configuration is then retrained with seeds 0, 1 and 2, at most 120 epochs and patience 15. Every fit retains its best validation checkpoint. Thus the experiment contains **24 tuning fits and 12 final fits**. The split stays fixed across training seeds, so the reported seed variation concerns initialization and training order, not dataset resampling.

| Model | Width | Target | LR | Weight decay | Best tuning validation MAE (s) | Parameters |
| --- | --- | --- | --- | --- | --- | --- |
| GRU | 64 | log | 0.003 | 0.0 | 4.561 | 14273 |
| LSTM | 64 | log | 0.003 | 0.0 | 4.678 | 19009 |
| TCN | 32 | log | 0.003 | 0.0001 | 5.299 | 12737 |
| MLP | 64 | log | 0.003 | 0.0 | 8.367 | 4801 |

Final fits stopped after these epoch counts for seeds 0 / 1 / 2: GRU 94 / 84 / 120; LSTM 64 / 51 / 80; TCN 90 / 77 / 77; MLP 92 / 61 / 70. The published checkpoints are the best validation epochs, not necessarily those final epochs.

[Download the frozen protocol](assets/posts/ttg/protocol.json) and [all tuning results](assets/posts/ttg/selection.json). The GRU seed-0 checkpoint was predeclared as the C++ reference; it is not the seed with the best test score.

## Compare all eligible observations, then inspect baseline coverage

The primary learned-model comparison scores every eligible entering-run timestamp, including intervals with nonclosing estimated range rate. All four families use identical run/timestamp pairs.

| Model | Run-macro MAE (s) | Sample MAE (s) | Median error (s) | 95th-percentile error (s) |
| --- | --- | --- | --- | --- |
| GRU | 4.24 ± 0.16 | 5.51 ± 0.22 | 2.16 ± 0.12 | 22.36 ± 1.11 |
| LSTM | 4.88 ± 0.29 | 6.40 ± 0.41 | 2.73 ± 0.34 | 24.74 ± 1.02 |
| TCN | 4.95 ± 0.10 | 6.46 ± 0.12 | 2.81 ± 0.12 | 24.54 ± 0.04 |
| MLP | 8.33 ± 0.14 | 10.97 ± 0.23 | 5.76 ± 0.02 | 38.30 ± 1.68 |

Each cell is the mean ± sample standard deviation of that statistic across three seeds. In particular, the median and 95th-percentile columns average three separately calculated quantiles; they are not quantiles of pooled predictions.

![Four-family test errors and validation-only tuning results.](assets/posts/ttg/alternative-models.svg "Figure 2. Test bars show three-seed mean and sample standard deviation. The tuning table reports validation run-macro MAE. Neither selection nor seed choice uses the test ranking.")

GRU had the lowest mean run-macro and sample-weighted MAE. LSTM and TCN were close to one another, and both improved substantially over the single-step MLP. This supports keeping a learned history in this experiment, but it does not isolate history as the only cause: the families differ in parameter count, nonlinearity, optimization and memory horizon. The equal six-trial search is too small to establish a universal architecture ranking.

A second comparison aligns the models with two radial constant-speed baselines:

```text
radial_time = max(range − 1000, 0) / (−range_rate)
             defined only when range_rate < −1e−6 m/s
```

One baseline differences consecutive measured ranges; the other uses the filter's estimated position and velocity. Both extrapolate radial closing motion to a spherical boundary. Neither is an exact geometric intersection solver for an offset straight line. Curvature, tangency and near-zero range rate can invalidate this approximation or produce very large estimates. To expose that sensitivity, the report includes both uncapped values and the same values capped at the existing 400 s feature limit.

Only **15,237/25,598 eligible timestamps (59.5%)** have both baselines defined. The common comparison therefore excludes **10,361 timestamps (40.5%)**. Measurement differencing is undefined on 9,589 eligible rows and the filtered baseline on 1,856; those exclusions overlap. All 167 entering test runs still contribute to the common subset.

| Common rows only | Sample MAE (s) | Run-macro MAE (s) | Median (s) | p95 (s) |
| --- | --- | --- | --- | --- |
| measurement | 127.51 | 97.13 | 23.04 | 118.99 |
| kalman | 62.03 | 48.41 | 7.69 | 110.75 |
| measurement capped | 40.93 | 36.11 | 23.04 | 118.99 |
| kalman capped | 26.18 | 21.99 | 7.69 | 110.75 |
| GRU (three-seed mean) | 4.97 | 4.25 | 1.86 | 20.64 |
| LSTM (three-seed mean) | 5.81 | 4.90 | 2.38 | 22.90 |
| TCN (three-seed mean) | 5.89 | 4.98 | 2.39 | 22.94 |
| MLP (three-seed mean) | 10.09 | 8.45 | 4.87 | 36.71 |

The uncapped baseline means are tail-sensitive: the maximum measurement-difference error is 795,213 s and the maximum filtered-baseline error is 51,496 s. Their medians are far smaller. The capped comparison is therefore a necessary sensitivity check, not a second tuned baseline. GRU sample MAE on the excluded subset is 6.29 s when averaged across seeds; it remains visible in the all-eligible score.

The common mask is applied only after full-sequence inference. Dropping a scoring row never resets a recurrent state or removes a TCN input. The excluded subset is reported separately rather than silently disappearing from the learned-model evaluation.

![Aligned errors for the fixed seed-0 GRU and the two uncapped baselines.](assets/posts/ttg/model-comparison.svg "Figure 3. This band comparison uses the predeclared GRU seed-0 deployment checkpoint and the baseline-common timestamps. It is distinct from the three-seed, all-eligible comparison above.")

## Look at where the models fail

| Entering profile | GRU | LSTM | TCN | MLP |
| --- | --- | --- | --- | --- |
| balloon_buoyancy_loss | 4.91 | 6.10 | 6.28 | 15.57 |
| balloon_drift | 11.10 | 14.16 | 14.54 | 26.11 |
| balloon_shear | 10.69 | 10.34 | 10.10 | 19.49 |
| climbing_transit | 1.58 | 2.11 | 2.42 | 3.92 |
| descending_transit | 1.69 | 2.26 | 2.06 | 4.09 |
| drone_gust | 3.98 | 4.52 | 5.07 | 8.74 |
| drone_hover_resume | 9.72 | 11.80 | 9.90 | 13.09 |
| drone_speed_change | 10.84 | 10.01 | 9.80 | 9.04 |
| drone_thrust_loss | 3.60 | 4.61 | 5.17 | 8.64 |
| drone_turbulence | 4.16 | 4.89 | 5.55 | 8.79 |
| drone_turn | 4.86 | 5.98 | 6.97 | 9.23 |
| fast_transit | 1.29 | 1.66 | 1.91 | 2.77 |
| irregular_transit | 1.28 | 1.75 | 1.66 | 3.11 |
| oscillating_transit | 1.34 | 1.81 | 1.90 | 3.56 |
| parachute_drift | 2.54 | 2.52 | 2.53 | 3.80 |
| slow_transit | 3.38 | 4.05 | 3.85 | 12.25 |
| straight_transit | 1.34 | 1.59 | 1.70 | 3.19 |

Values are per-profile sample MAE in seconds, averaged over three seeds. Balloon shear has only seven entering test runs; every other row has ten. The ordinary transit controls are comparatively easy. Balloon drift, hover/resume and speed changes produce larger errors. On `drone_speed_change`, MLP scores 9.04 s versus GRU’s 10.84 s, while TCN is slightly better on balloon shear. Overall superiority does not imply a win in every family.

The event schedule is hidden from every predictor. A future speed change or pause cannot necessarily be inferred from past positions; a model may learn a prior over the generator’s event times. These experiments do not show that the network discovers an unobserved future command.

| True remaining time | GRU | LSTM | TCN | MLP |
| --- | --- | --- | --- | --- |
| 0-5s | 0.50 | 0.90 | 0.61 | 1.43 |
| 5-15s | 0.89 | 1.19 | 1.14 | 2.22 |
| 15-40s | 2.23 | 2.63 | 2.78 | 5.73 |
| 40s+ | 9.32 | 10.72 | 10.80 | 17.60 |

These are all-eligible, sample-weighted band errors in seconds averaged over seeds. Band membership uses the simulated remaining time and is applied after inference.

For the paired uncertainty check, each run's absolute error is averaged over the three fixed training seeds. The analysis resamples test runs 2,000 times and computes the alternative-minus-GRU run-macro difference. Negative values favor the alternative. These percentile intervals reflect held-out run sampling within this generator; they do not cover weather-model error, new motion families, real sensor behavior or the full uncertainty of model selection.

| Alternative minus GRU | Mean difference (s) | Paired run-bootstrap 95% interval (s) |
| --- | --- | --- |
| LSTM | +0.640 | [+0.427, +0.860] |
| TCN | +0.714 | [+0.472, +0.961] |
| MLP | +4.092 | [+3.470, +4.793] |

All three intervals favor GRU within this test distribution. The resampling is over whole runs rather than correlated timestamps, but remains conditional on the fixed profile mixture and selected configurations.

## Non-entry paths still test the tracker

Outside crossings, receding routes, circles and figure-eight circuits are retained in the observation and tracking datasets. They are excluded from TTG loss because no finite event label exists. Position and velocity errors against simulation truth remain defined. Tracking diagnostics omit the first six sensor samples of each run to match the initial filter settling period; they then include all remaining tracked rows, independently of TTG eligibility.

| Test profile | Entries / runs | Position RMSE (m) | Velocity RMSE (m/s) | Recorded median CPA (m) |
| --- | --- | --- | --- | --- |
| crossing_route | 0 / 10 | 26.07 | 14.80 | 1789.8 |
| receding_route | 0 / 10 | 27.13 | 16.00 | 3910.8 |
| drone_orbit | 0 / 10 | 26.16 | 14.76 | 2108.6 |
| drone_figure_eight | 0 / 10 | 26.75 | 14.89 | 2157.0 |
| balloon_shear | 7 / 10 | 27.21 | 15.33 | 1000.0 |

The balloon-shear diagnostic combines its seven entering and three non-entering runs; the other four rows are entirely non-entry. Velocity RMSE is approximately 15 m/s on the slow outside circuits. With 25 m position noise at a half-second interval, that is large relative to their speeds. The default filter is shared across all profiles and was not tuned for low-speed balloons or drones. A learned TTG improvement does not repair this underlying velocity uncertainty. Full diagnostics for all 21 profiles are in the comparison JSON.

These errors measure the observation/filter chain, not the GRU or an entry classifier. CPA for entering runs is near the boundary because simulation stops there; it must not be interpreted as the minimum distance of an unrecorded continuation.

## Measure streaming cost separately from accuracy

The alternative-model benchmark uses one CPU thread and a fresh process per model. It replays every accepted test sequence three times, resets model state at each run, and times normalized feature input through the inverse target transform and nonnegative clamp. It includes warmup and nonclosing steps, and verifies every streamed output against batch inference first.

| Model | Weights (KiB, float32) | Mean update (µs) | Median (µs) | p95 (µs) |
| --- | --- | --- | --- | --- |
| GRU | 55.75 | 23.10 | 22.58 | 26.62 |
| LSTM | 74.25 | 24.95 | 24.17 | 28.58 |
| TCN | 49.75 | 211.30 | 214.50 | 227.21 |
| MLP | 18.75 | 16.77 | 16.46 | 18.12 |

Measured on an Apple M2 with Python 3.13.5, PyTorch 2.13.0 and one CPU thread. Training used MPS. Each timing pass contains 26,433 usable feature updates, including the five warmup features per accepted run. No training or dataset generation ran concurrently with these benchmarks.

These are **Python model-only timings**, excluding Kalman filtering and normalization. TCN timing includes recomputing its finite window; an implementation with cached convolution states could have a different cost. Timing also includes Python call and tensor-dispatch overhead, so parameter count alone does not explain latency.

The separate baseline/GRU benchmark includes the full measurement-to-estimate chain and records process peak RSS. The scopes must not be mixed. Whole-process RSS includes Python, PyTorch and loaded replay buffers; it is not weight storage or per-track state. Neither benchmark measures C++ latency.

![Python streaming latency and process peak RSS for measurement, filtered and full GRU estimators.](assets/posts/ttg/inference-performance.svg "Figure 4. Complete Python estimator timing is measured in isolated workers. GRU includes filtering, features and normalization. Process RSS includes runtime and replay data.")

## Preserve a testable C++ reference

The selected GRU seed-0 checkpoint, normalization and fixed-interval filter matrices are exported to a C++17 header. LSTM, TCN and MLP checkpoints remain available for Python research comparison; they have not been ported to C++.

C++ keeps filtering and normalization in double precision, then evaluates the GRU in float32. It matches PyTorch gate order, recurrent bias placement, inverse target transform and nonnegative clamp. Kalman and GRU states reset together on a new track. The first usable feature has `delta_t = 0`. Filter matrices are baked for 0.5 s observations; passing a different update interval does not rebuild them.

The full Python suite passed **210 tests**. The regenerated C++ references cover three complete long sequences and **169,830 numerical comparisons**, with zero failures. The suite checks filtering, normalized features, recurrent hidden states and final time estimates without loosening tolerances. Causal-prefix and full-streaming tests also cover all four Python model families, including state resets.

Parity checks establish agreement with this Python implementation, not physical validity. The trajectory viewer also needs a real HTTP server because it fetches JSON; a `file://` page cannot supply that data.

## Reproduce the experiment

Use Python 3.13+, the locked `uv` environment, a C++17 compiler and `make`. No new numerical or plotting dependencies were added. Figures are standalone SVGs and the viewer uses local three.js with canvas charts.

```bash
uv sync
uv run scripts/make_dataset.py --count 630 --output out/airspace/train --seed 0 --workers 4
uv run scripts/make_dataset.py --count 210 --output out/airspace/test --seed 777 --workers 4
uv run scripts/track.py --dataset out/airspace/train
uv run scripts/track.py --dataset out/airspace/test
uv run scripts/run_experiments.py
uv run scripts/publish_experiment.py
uv run scripts/export_cpp.py
make -C cpp test
uv run scripts/evaluate_ttg.py
uv run scripts/benchmark_alternatives.py
uv run scripts/plot_scores.py
uv run scripts/plot_experiments.py
uv run scripts/generate_trajectories.py
uv run pytest
```

The experiment runner resumes completed matching trials and refuses changed training data or protocol in the same output directory. Use a new output directory for a new experiment. Dataset source hashes and generation settings are recorded in the [data manifest](assets/posts/ttg/data-manifest.json). The [comparison record](assets/posts/ttg/comparison.json), [aligned deployment evaluation](assets/posts/ttg/aligned-scores.json), [runtime record](assets/posts/ttg/runtime.json) and final checkpoint directories provide the underlying evidence.

## What this experiment establishes

Adding force-driven balloons, multicopters and parachutes changes both the trajectory distribution and the interpretation of performance. The completed 24-trial search and 12 final fits support GRU as the current reference on this dataset: it has the lowest overall held-out errors, while simpler or convolutional models retain profile-specific advantages. The result is qualified by substantial baseline-mask exclusions, relatively noisy low-speed velocity estimates, a small test sample per profile and a limited search budget. The regenerated C++ artifacts make the chosen implementation numerically reviewable.

The next useful tests are held-out motion families, independently varied noise and sampling rates, missed observations, and an explicit model for entry probability or censored time-to-entry. Those require new protocols and labels. The current results describe this finite synthetic distribution, not general airborne-object performance.
