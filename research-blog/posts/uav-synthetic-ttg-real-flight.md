A ground station tracking a UAV wants one number early: how many seconds until the aircraft first enters its observation zone. The regression target is easy to state. The training data is the hard part. Public UAV flight logs are few, none were recorded from a fixed station, and none carry an entry-time label for a zone that did not exist when they were flown. So the data has to be synthetic, and then the question becomes whether richer synthetic motion actually helps on real flights.

This experiment compares four synthetic training arms with the same budget: constant-velocity and constant-acceleration motion only, that baseline with fixed-wing profiles added, with multicopter profiles added, and with both. Each arm trains a GRU, an LSTM and an MLP through 72 tuning trials and 36 final models, which are then frozen and scored on measured positions from three public UAV datasets. **The broad version of the hypothesis is not supported.** The mixed-profile GRU cut synthetic validation error by 24.1% and then raised error on MASC-3 fixed-wing flights by 53.0%. One conditional gain held up: adding fixed-wing profiles improved all three architectures by 13 to 17% on a predeclared secondary ALFA geometry.

That was the first half. The second half asks why, and measures instead of guessing. Nine motion and sensor statistics computed the same way on real and synthetic pre-entry tracks show that all four training arms sit far from AMOVFLY on almost every variable, and much closer to each other than to the target. So a second arm was built that keeps every profile, force model, filter setting and tuning candidate and changes only how runs are sampled, with the ranges read from three calibration dates. On the five held-out dates, GRU flight-macro MAE drops from 50.9 to 14.4 s and LSTM from 39.5 to 16.0 s; the MLP, already at 16 s, does not move.

![Change in macro MAE for the mixed-profile arm against the baseline, on synthetic validation and on three real UAV cohorts.](assets/posts/ttg-v2/02-transfer-gap.svg "Figure 1. Mixed profiles versus baseline, change in macro MAE, lower is better. The synthetic column is a selection set, not an independent test. Real cohorts are seed means; they are not on a common absolute-error scale. ALFA primary has one flight and is not shown.")

[Source repository](https://github.com/junyeong-nero/uav-lab) · [v2 real-flight report](https://github.com/junyeong-nero/uav-lab/blob/main/docs/results_v2_real.md) · [v3 plan](https://github.com/junyeong-nero/uav-lab/blob/main/docs/plan_v3.md) · [v3 gap diagnostic](https://github.com/junyeong-nero/uav-lab/blob/main/docs/results_v3_gap.md) · [v3 result](https://github.com/junyeong-nero/uav-lab/blob/main/docs/results_v3_real.md) · [Figure provenance](assets/posts/ttg-v2/provenance.json), [v3](assets/posts/ttg-v2/provenance_v3.json)

This post replaces an earlier one about a balloon, multicopter and parachute generator. That work used a different task definition and its scores are not comparable to anything here.

## Define the event, then be clear about what real data cannot supply

The station sits at the origin, with x north, y east and z up, in meters and seconds. The observation zone is a sphere of radius 1,000 m. Entry is the first intersection between a trajectory segment and that sphere, interpolated inside the step. The label at time t is `entry_time - t`, defined only for tracks that enter. A track that never enters during the recording keeps a missing label, NaN in memory and null in Parquet, and is masked out of the loss and every metric. It is never filled with zero or a large constant. The models therefore regress time conditional on eventual entry; they do not predict whether or with what probability a UAV enters.

Real flights cannot provide that label directly. A recording that ends outside the zone only says that the recording ended. So the real-flight evaluation places a virtual zone relative to each flight segment's first position, at a fixed horizontal distance from the station center, and counts only the first crossing. That makes the evaluation a test of measured trajectories against a constructed zone, not a test of a fielded sensor. It is still a much harder test than held-out data from the same generator, which says nothing about real motion.

## Generate motion that never looks at the station

Each synthetic trajectory is a point mass integrated with RK4 at 0.05 s. No controller references the station position. Flights follow their own schedule, and a flight enters the zone only if that schedule happens to cross it.

Fixed-wing UAVs fly scheduled routes at 15 to 35 m/s and 100 to 500 m altitude, following heading, speed and climb-rate schedules, with optional sinusoidal heading changes, seeded lateral disturbances, doglegs, weaving and a temporary thrust loss. Multicopters are force driven at 1 to 25 m/s: a bounded thrust vector tracks a speed schedule that can hover, turn, orbit, fly a figure eight, lose thrust or change speed, all under a wind field that sums mean wind, altitude shear, a finite gust pulse and seeded sinusoidal turbulence. There are 30 profiles, 12 fixed-wing and 18 multicopter. Crossing, receding, orbit and figure-eight profiles pass outside the zone by design; they stay in the observation distribution and carry no label.

The force evaluation is a pure function of state and time, so RK4's intermediate stages never draw random numbers, and every scenario and sensor seed is drawn before worker dispatch. Regenerating a dataset with a different worker count gives identical files.

In the ablation datasets, every run draws its own observation period between 0.5 and 1.0 s and its own position noise between 1 and 10 m per axis. The 0.5 to 1.0 s range covers MASC-3's 1 Hz rows and the 0.5 s availability grid used for the other two datasets. A Singer-model Kalman filter tracks the observations with one fixed 5 m measurement setting for every arm; it is not told the sampled noise level, and its update interval follows the observed timestamps, as it must on real flights. Eight scalar features come out of the filter state: range, range rate, a constant-velocity entry estimate capped at 400 s, speed, lateral acceleration, approach cosine, innovation norm and elapsed time. Normalization is fit on training runs only. Models regress log1p-transformed or raw time with a Huber loss and clamp the output at zero.

## Hold the budget fixed and change only which profiles fill it

![Composition of the four training arms.](assets/posts/ttg-v2/01-training-design.svg "Figure 2. Every arm has 500 runs and 55,778 supervised timestamps. The added-profile arms replace half of the simple-motion runs with UAV profiles. The update budget is matched; initial-state distributions and the selected model settings are not.")

| Arm | Training runs | Supervised timestamps |
| --- | --- | --- |
| Baseline: 250 constant-velocity + 250 constant-acceleration runs, 1 to 35 m/s | 500 | 55,778 |
| + FW: 125 CV + 125 CA, plus 250 runs cycling the fixed-wing profiles | 500 | 55,778 |
| + MC: 125 CV + 125 CA, plus 250 runs cycling the multicopter profiles | 500 | 55,778 |
| Mixed (Ours): 125 CV + 125 CA, plus 250 runs cycling all profiles | 500 | 55,778 |

The baseline has no wind and no maneuvers. Its runs start 1,100 to 4,000 m from the station so that short pre-entry tracks, which real launches produce, are well represented. All four arms share one validation set of 100 synthetic runs: 25 constant-velocity, 25 constant-acceleration and 50 entering UAV-profile runs, giving 12,473 eligible timestamps.

For each architecture and arm, six predeclared candidates are compared at tuning seed 17: hidden width 32 or 64, learning rate 0.001 or 0.003, log or raw target, and weight decay 0 or 0.0001, in six fixed combinations, each trained for 60 epochs or 480 updates. The candidate with the lowest validation run-macro MAE is retrained with seeds 0, 1 and 2 for 200 epochs or 1,600 updates, keeping the best validation checkpoint. That is 72 tuning trials and 36 final models. Every selected candidate used the log target. No real data touched any selection, and no model is retrained or renormalized on real data afterwards.

Two things this design does not match. The initial-state, trajectory-length and remaining-time distributions differ between arms, because the profiles differ. And because each arm selects its own candidate, the final hidden widths differ too. The intervention is "which profiles fill half the budget", not "environmental forces alone".

## Synthetic validation favored the mixed GRU

Three-seed mean run-macro MAE in seconds on the shared validation runs. Negative changes favor the mixed arm.

| Model | Baseline | + FW | + MC | Mixed | Mixed vs baseline |
| --- | --- | --- | --- | --- | --- |
| GRU | 6.224 | 5.690 | 4.875 | 4.723 | -24.1% |
| LSTM | 6.476 | 6.121 | 5.595 | 6.596 | +1.8% |
| MLP | 11.136 | 10.832 | 11.260 | 10.782 | -3.2% |

The GRU improved for every added arm and every seed. Its timestep MAE fell from 12.706 to 8.591 s and the mean seedwise 95th-percentile error from 66.593 to 42.508 s. The slow multicopter profiles moved most: GRU macro MAE on `drone_crawl` went from 68.401 to 46.717 s, on `drone_walk` from 37.595 to 13.855 s, and on hover-and-resume from 32.019 to 10.961 s, each on only two validation runs. Constant-velocity runs improved from 2.833 to 2.059 s while constant-acceleration runs got slightly worse, 5.645 to 5.788 s. The LSTM mixed arm beat its same-seed baseline in one seed out of three. The MLP moved by a few percent either way.

On the 10,759 timestamps (86.3%) where both analytic estimators are defined, the capped Kalman constant-velocity estimate scores 14.594 s against 4.774 s for the mixed GRU. On MASC-3 that ordering reverses.

Two cautions apply to this table. These are selection-set scores: the same runs chose the candidates and the checkpoints. And the added arms train on the same profile families the validation set contains, so part of the gain is distribution match rather than anything about UAV physics.

## Freeze everything, then score real flights

| Dataset | Platform | Source flights | What the recordings are |
| --- | --- | --- | --- |
| [MASC-3/WINSENT](https://doi.pangaea.de/10.1594/PANGAEA.947119) (CC BY 4.0) | fixed-wing UAS | 14 | 605 provider-processed straight legs over complex terrain, 1 Hz rows |
| [ALFA](https://kilthub.cmu.edu/articles/dataset/ALFA_A_Dataset_for_UAV_Fault_and_Anomaly_Detection/12707963) (CC BY 4.0) | fixed-wing UAV | 31 | 47 sequences, including injected control-surface and engine faults |
| [AMOVFLY](https://github.com/YujiaoHu/AMOVFLY-Dataset) | multicopter | 277 | MAVROS local positions with a horizontal extent of at most 172 m |

The zone radius is 1,000 m everywhere. What changes between conditions is where the station center sits relative to each segment's first position: 1,500 m for the fixed-wing primary condition and 1,050 m for the AMOVFLY primary condition, because AMOVFLY tracks are too short to reach a zone placed further away. ALFA at 1,050 m is a predeclared sensitivity condition and was not promoted to primary after the fact. Model file hashes and zone geometry were written into a protocol file before any prediction, and the hashes were checked against the v2 model files before and after evaluation.

Inputs stay causal. On a 0.5 s availability grid the filter receives the most recent raw observation and is never updated twice with the same one; the filter uses the raw timestamp and the target uses the availability time. No future position is interpolated into an input. Future positions are used only to compute the entry label.

The scoring unit is a case, one flight segment paired with one zone bearing. Case MAE is averaged within a flight, flights are averaged with equal weight, and then the three seeds are averaged. Several bearings on one flight never count as separate flights. Confidence intervals are paired differences against the same architecture's baseline, computed after averaging seeds, with 2,000 bootstrap resamples that treat each flight date as a cluster. They do not include training-seed uncertainty and are not adjusted for multiple comparisons. With five to ten dates per cohort they are conditional evidence, not population claims.

![Eligible flights, dates, zone cases and timestamps for each evaluated cohort.](assets/posts/ttg-v2/05-evaluation-coverage.svg "Figure 3. Coverage per cohort. MASC-3 at 1,050 m and AMOVFLY at 1,500 m produce no eligible crossings at all. ALFA at 1,500 m keeps one flight on one date, so its bootstrap collapses to a point.")

| Cohort | Role | Eligible / source flights | Dates | Cases kept / candidates | Timestamps |
| --- | --- | --- | --- | --- | --- |
| MASC-3, 1,500 m | primary | 14 / 14 | 10 | 313 / 4,840 | 9,234 |
| ALFA, 1,500 m | primary, n = 1 | 1 / 31 | 1 | 1 / 376 | 67 |
| ALFA, 1,050 m | sensitivity | 29 / 31 | 5 | 114 / 376 | 8,635 |
| AMOVFLY, 1,050 m | primary | 109 / 277 | 8 | 348 / 2,216 | 37,546 |

Every reported flight-macro MAE was recomputed from the saved prediction arrays by a separate script, 144 model, cohort and geometry combinations in all. That script originally scanned only the nested fixed-wing layout and silently skipped AMOVFLY; it now handles both layouts and fails on an empty result. No prediction or selection logic changed.

## Fixed-wing: MASC-3 got worse, one ALFA geometry got better

![Added arm minus baseline flight-macro MAE on MASC-3 and ALFA, with date-cluster bootstrap intervals.](assets/posts/ttg-v2/03-fixedwing-effects.svg "Figure 4. Each point is an added arm minus the same architecture's baseline, mean over three seeds. Positive is worse. The two panels have different axes in seconds. Intervals are paired date-cluster bootstraps without seed uncertainty or multiplicity correction.")

Three-seed mean flight-macro MAE in seconds.

| Cohort | Model | Baseline | + FW | + MC | Mixed | Mixed change | Mixed minus baseline, 95% CI (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| MASC-3, 1,500 m | GRU | 1.175 | 1.918 | 2.279 | 1.798 | +53.0% | [+0.492, +0.781] |
| MASC-3, 1,500 m | LSTM | 1.157 | 1.793 | 1.681 | 1.773 | +53.2% | [+0.473, +0.729] |
| MASC-3, 1,500 m | MLP | 1.862 | 3.154 | 2.376 | 1.705 | -8.4% | [-0.231, -0.062] |
| ALFA, 1,050 m | GRU | 61.227 | 50.647 | 134.150 | 71.423 | +16.7% | [+4.419, +14.161] |
| ALFA, 1,050 m | LSTM | 56.085 | 48.558 | 61.530 | 43.386 | -22.6% | [-16.861, -9.746] |
| ALFA, 1,050 m | MLP | 16.989 | 14.059 | 25.700 | 18.302 | +7.7% | [+1.045, +1.681] |

On MASC-3, every added arm made the GRU and the LSTM worse, and every interval sits above zero. The MLP mixed arm improved by 8.4% with an interval below zero, but it beat its own same-seed baseline in only one seed of three, and it is still worse than the analytic estimators below. MASC-3 consists of straight measurement legs, the kind of motion the baseline arm is made of. That the added profiles pull the recurrent models away from a prior that already fits is a plausible reading, not a tested one.

On the ALFA sensitivity geometry, adding fixed-wing profiles helped all three architectures: GRU by 10.581 s (17.3%), LSTM by 7.527 s (13.4%), MLP by 2.930 s (17.2%), with every interval below zero. Adding multicopter profiles hurt badly here, up to 72.923 s for the GRU. The mixed arm helped only the LSTM, by 22.6%. Per seed, the fixed-wing arm beat the baseline in two of three seeds for the GRU and LSTM and in all three for the MLP. That is the one result that can be called a positive finding, and it is limited to this geometry and these five dates.

The ALFA primary geometry at 1,500 m keeps one flight, so its numbers are descriptive only: GRU 14.156 to 17.935 s, LSTM 15.272 to 15.663 s, MLP 3.646 to 2.810 s for baseline versus mixed.

## Multicopter: no added arm helped on AMOVFLY

![Added arm minus baseline flight-macro MAE on AMOVFLY, with date-cluster bootstrap intervals.](assets/posts/ttg-v2/04-multicopter-effects.svg "Figure 5. Same construction as Figure 4, for the 109 eligible AMOVFLY flights on eight dates. An interval that includes zero means the difference was not resolved, not that it is zero.")

| Cohort | Model | Baseline | + FW | + MC | Mixed | Mixed change | Mixed minus baseline, 95% CI (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AMOVFLY, 1,050 m | GRU | 53.948 | 54.883 | 101.348 | 57.310 | +6.2% | [-3.841, +10.442] |
| AMOVFLY, 1,050 m | LSTM | 41.307 | 41.812 | 42.146 | 49.733 | +20.4% | [+4.074, +12.626] |
| AMOVFLY, 1,050 m | MLP | 18.043 | 18.399 | 25.979 | 18.232 | +1.0% | [-0.011, +0.366] |

No added arm lowered mean error for any architecture. The mixed-arm GRU and MLP intervals include zero, so those differences are unresolved; the LSTM is worse by 8.426 s with an interval above zero. The multicopter-only arm, the one most obviously matched to this platform, raised GRU error by 47.4 s. The naive expectation that platform-matched synthetic profiles help on that platform does not hold in this evaluation.

Absolute errors are also much larger here than on MASC-3, and the MLP is the best architecture by a wide margin in every arm. AMOVFLY flights cover at most 172 m horizontally and approach a zone edge only about 50 m from their first position, so the eligible tracks are short and close to the boundary. Which of those properties drives the recurrent models' errors is not something this experiment isolates.

## Checks that rule out the easy explanations

Output collapse does not explain the differences. The largest fraction of exactly-zero predictions in any model, seed and cohort is 0.0217% on MASC-3, 0.0811% on ALFA sensitivity and 0.0719% on AMOVFLY.

Seed averaging is not hiding a consistent effect either. Counting how often an added arm beats the baseline trained with the same seed: on MASC-3, the only wins are one of three for the GRU mixed arm and one of three for the MLP mixed arm. On AMOVFLY the GRU mixed arm wins two seeds of three while losing on the mean, because its third seed scores 71.231 s against a 49.814 s baseline.

The analytic estimators set an uncomfortable bar on MASC-3. On the identical timestamps, differencing consecutive measured ranges gives 0.993 s and extrapolating the Kalman state gives 1.065 s, lower than every trained model in every arm. Those two estimators are undefined wherever the estimated range rate is not closing, which costs nothing on MASC-3 but excludes 48.4% of ALFA sensitivity timestamps and 42.7% of AMOVFLY timestamps. Scores on those common subsets should not be compared with full-cohort scores, and the report keeps them apart.

## What the v2 design cannot separate

The v2 experiment shows that more diverse synthetic motion does not reliably help every architecture or every real-flight distribution. It does not show why. Environmental forces, maneuver profiles, initial-state and remaining-time distributions, and the validation-selected hyperparameters all change together between arms. Rather than add another arm and guess again, the follow-up was preregistered with a different question: how far is each training distribution from the target, and does closing that distance help?

## Measure the distance before blaming the physics

AMOVFLY was chosen as the target because it has the most flights (109 on 8 dates) and the worst v2 errors. Its eight dates were split before anything was measured: the first three (40 entering flights, 145 zone cases) are calibration dates whose statistics may inform the generator; the other five (69 flights) are evaluation dates whose positions stay unread until prediction. The plan fixed the split, the variables, the knobs the generator may turn, the number of adjustment rounds, and the verdict rule in advance.

Nine statistics are computed from the observed pre-entry track of every case with one definition for real and synthetic data: range to the zone boundary at the first observation, pre-entry duration, ground speed (median, P10, P90), heading rate, vertical speed, the fraction of samples stopped, observation period, a position-noise estimate from second differences, and the remaining-time label itself. Speeds come from windowed linear fits rather than raw differences, because 1 to 10 m of synthetic noise differenced at 0.5 s would read as 14 m/s of velocity. Each variable's distance is a one-dimensional Wasserstein distance divided by the RMS of the real and synthetic spreads; the summary gap is the plain mean over the twelve.

![Normalized W1 per variable for the four v2 arms and the matched arm against AMOVFLY.](assets/posts/ttg-v2/06-distribution-gap.svg "Figure 6. Distance to the AMOVFLY calibration distribution, per variable. Values above 4 are clipped. The right-hand column is the matched arm described in the next section.")

| Statistic | AMOVFLY (median) | Baseline | + FW | + MC | Mixed |
| --- | --- | --- | --- | --- | --- |
| Range to the boundary at the first observation (m) | 50 | 1,586 | 1,809 | 1,323 | 1,476 |
| Ground speed, median (m/s) | 4.0 | 21.9 | 24.1 | 15.2 | 19.7 |
| Fraction of samples stopped | 0.13 | 0.00 | 0.00 | 0.00 | 0.00 |
| Position noise estimate (m) | 0.21 | 5.5 | 5.0 | 5.3 | 5.3 |
| Observation period (s) | 0.50 | 0.75 | 0.76 | 0.75 | 0.74 |
| Summary gap | | 2.05 | 2.25 | 1.81 | 1.90 |

Every v2 arm starts more than a kilometre outside the zone, flies four to six times faster than the real drones, never hovers, and is observed with 25 times the position noise. AMOVFLY positions are MAVROS EKF output with about 0.2 m of noise, not the GPS-grade 1 to 10 m the sensor randomization assumed. The four arms differ from one another far less than all of them differ from the target, and the arm closest to it (+ MC) has the worst GRU and MLP error. The v2 ablation compared variants inside a distribution that was nowhere near this target, which is consistent with nothing helping.

## Match the sampling, keep everything else

The matched arm changes only how the generator samples runs: start range 1,013 to 1,027 m, altitude 10 to 40 m, speed 1.5 to 8 m/s, scheduled events starting at 1 to 6 s, a profile mix weighted toward hover, climb and turn, 0.5 to 0.58 s observation periods and 0.09 to 0.28 m noise. Profile physics, wind, the Kalman filter, the eight features, the model architectures and the six tuning candidates are untouched. Five rounds of adjustment against the calibration statistics bring the summary gap from 2.05 to 0.89. Three knobs had to be added to the plan before the first round and are logged there: altitude, because the drone profiles cruise at 300 m and the 3D boundary distance could not fall below 90 m otherwise; and event timing, because a drone starting 50 m from the boundary enters in about 12 s, before any hover scheduled at 25 s could happen.

What the sampling cannot reproduce is the takeoff. Every AMOVFLY track starts when the aircraft passes 5 m, so its first seconds are a near-vertical climb: that is where the real stops, the 1.3 m/s vertical speeds and the 30 deg/s heading rates come from. No profile does that, and adding one would be a profile change, which the plan forbids. Those variables stay far apart in Figure 6.

Because the matched tracks are short (26 observations at the median), 500 of them carry only 14,400 supervised timestamps against v2's 55,778. The arm therefore has 1,984 runs, its usable labels are subsampled per run to exactly 55,778, and the epoch counts are set so the optimizer budget matches (496 and 1,612 updates against 480 and 1,600). Candidates and checkpoints are still chosen on the v2 synthetic validation set, which is far from the matched distribution; the matched models score 29 to 87 s there. Nothing is selected on real data.

## The recurrent models lose most of their error

The nine frozen matched models were scored on the five evaluation dates (69 flights, 203 zone cases, 19,744 timestamps). The v2 arms were re-aggregated from their saved per-flight errors on the same 69 flights; nothing was re-predicted. The verdict rule, fixed before prediction, asks whether the matched-minus-baseline interval lies below zero in at least two of the three architectures.

![Matched minus baseline per architecture with intervals, and absolute means per arm.](assets/posts/ttg-v2/08-matched-effects.svg "Figure 7. Matched − baseline flight-macro MAE with paired date-cluster bootstrap intervals, seeds averaged first. Below, the absolute means of every arm on the same flights.")

| Model | Baseline | + FW | + MC | Mixed | Matched | Matched − baseline, 95% CI (s) | Seeds better |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GRU | 50.87 | 51.55 | 89.09 | 49.07 | 14.40 | [-39.89, -34.27] | 3/3 |
| LSTM | 39.52 | 39.64 | 39.29 | 45.45 | 16.01 | [-25.43, -21.69] | 3/3 |
| MLP | 15.94 | 16.43 | 24.16 | 16.30 | 16.34 | [-0.36, +1.28] | 1/3 |

The GRU improves by 72% and the LSTM by 60%, in all three seeds, with intervals well below zero. The MLP does not move: it was at 16 s before and is at 16 s after, and its interval spans zero. The hypothesis is supported by the rule, and the shape of the result is as informative as the verdict. All three architectures end at the same floor of 14 to 16 s. Matching the distribution removed the penalty the recurrent models paid for applying the time structure of kilometre-long 20 m/s approaches to 50 m hovering ones; it did not make them better than a single-step model. The floor is set by the long-horizon cases: errors in the 40 s+ band are about 90 s and the P95 is near 190 s, and the seven manually flown Random-scenario flights score above 50 s in every architecture. Whether that floor is the untreated takeoff phase or pilot intent that no position history can predict, this experiment cannot say.

Two checks: the independent recomputation of all nine scores from the saved arrays passed, and on the common subset where the analytic estimators are defined, the capped Kalman constant-velocity estimate scores 29.6 s against 11.1 s for the matched GRU. On AMOVFLY the learned models beat the analytic baseline, the opposite of MASC-3.

![Summary gap against evaluation-date MAE for all arms.](assets/posts/ttg-v2/07-gap-vs-error.svg "Figure 8. Summary gap against flight-macro MAE on the evaluation dates. The four v2 arms cluster at gap 1.8 to 2.3, so their ordering carries no information; the matched arm is the only point that moved along the axis.")

Figure 8 also shows what the diagnostic alone could not do. The four v2 arms share one sampling envelope, so their gaps sit within 1.8 to 2.3 and their ordering does not track their error; the closest arm is the worst. The relationship between gap and error only appears once an arm actually moves along the axis.

## What is still open

The comparison isolates sampling from physics, filter and model, but not the individual knobs from each other: which of start range, speed, noise and event timing did the work is a separate ablation. The label budget was matched by using four times as many short runs; the same 500-run version was not trained. The candidates were selected on a validation set the matched arm does not resemble, which is conservative but unresolved. The intervals resample dates, not training seeds, although all three seeds agree. And the result is one dataset and one geometry; transfer of the matched models to ALFA at 1,050 m is planned as a secondary check, and a v4 arm with a takeoff profile would be a profile change requiring its own preregistration.

## Reproduce the experiment

Python 3.13+, the locked `uv` environment, a C++17 compiler and `make`. Each step refuses to overwrite an existing output folder. Training takes hours.

```bash
uv sync
uv run scripts/make_ablation_datasets.py \
  --output out/airspace/research/ablation_uav_v2 \
  --train-count 500 --validation-count 100 \
  --train-candidates 1000 --validation-candidates 300 \
  --seed 20260917 --workers 4
uv run scripts/tune_ablation_models.py --config configs/ablation_tuning/config.yaml \
  --data out/airspace/research/ablation_uav_v2 \
  --output out/airspace/research/ablation_uav_tuning_v2
uv run scripts/download_fixedwing.py
uv run scripts/evaluate_fixedwing.py \
  --models out/airspace/research/ablation_uav_tuning_v2 \
  --output out/airspace/research/fixedwing_uav_v2
uv run scripts/evaluate_amovfly.py \
  --models out/airspace/research/ablation_uav_tuning_v2 \
  --output out/airspace/research/amovfly_uav_v2 --download
uv run scripts/verify_fixedwing.py --output out/airspace/research/fixedwing_uav_v2
uv run scripts/verify_fixedwing.py --output out/airspace/research/amovfly_uav_v2
uv run scripts/plot_research_figures.py --png

# v3: measure the gap, build the matched arm, tune with the label budget, score the evaluation dates
uv run scripts/measure_gap.py
uv run scripts/make_ablation_datasets.py --output out/airspace/research/ablation_uav_v3 \
  --arms matched --sampling configs/ablation_v3/matched.json \
  --validation-from out/airspace/research/ablation_uav_v2 \
  --train-count 1984 --train-candidates 2600 --seed 20260918 --workers 4
uv run scripts/tune_ablation_models.py --config configs/ablation_v3/config.yaml
uv run scripts/evaluate_amovfly.py --models out/airspace/research/ablation_uav_tuning_v3 \
  --output out/airspace/research/amovfly_uav_v3 \
  --days 2024-11-22 2024-11-29 2024-11-30 2024-12-2 unknown \
  --calibration-days 2024-11-9 2024-11-20 2024-11-21
uv run scripts/verify_fixedwing.py --output out/airspace/research/amovfly_uav_v3
uv run scripts/compare_v3.py
```

The `--models` option freezes model hashes and zone geometry into a protocol before prediction. Frozen protocols, selections, per-cohort scores, comparisons and the independent diagnostics are tracked in the repository; prediction arrays and source downloads are regenerated locally. The figures above are built from those JSON files, and [provenance.json](assets/posts/ttg-v2/provenance.json) records the SHA-256 of every input and every SVG.

## What this experiment establishes

Within one matched budget, UAV-specific synthetic profiles helped the GRU on the shared synthetic validation set and hurt both recurrent models on MASC-3. Adding fixed-wing profiles improved all three architectures on ALFA at 1,050 m. No added arm improved the mean on AMOVFLY, and on the straight MASC-3 legs two analytic constant-velocity estimators beat every trained model. Measured against AMOVFLY, all four arms were far from the target and close to each other. Changing only the generator's sampling to match three calibration dates cut GRU error from 50.9 to 14.4 s and LSTM error from 39.5 to 16.0 s on 69 held-out flights, in every seed, and left the MLP at 16 s. The defensible claims are that synthetic validation gains are not evidence of real-flight transfer, that the distance between training and target distributions can be measured before training and was the problem here, and that closing it recovers the recurrent models up to, and not past, a single-step model's floor.
