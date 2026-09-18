## TL;DR

- The task is to predict how many seconds remain before a UAV first enters a 1 km observation sphere, trained only on synthetic motion because no public flight log carries that label.
- Four training arms at a matched budget (36 frozen models) tested whether richer UAV motion helps. It did not, broadly: the mixed arm cut synthetic validation error by 24.1% for the GRU and then raised MASC-3 error by 53.0%, and no added arm improved the AMOVFLY mean. On MASC-3's straight legs, two analytic constant-velocity estimators beat every trained model.
- One conditional gain held: adding fixed-wing profiles improved all three architectures by 13 to 17% on the predeclared ALFA 1,050 m geometry.
- Measuring instead of guessing, nine motion and sensor statistics showed all four arms sat far from AMOVFLY (summary gap 1.8 to 2.3) and much closer to each other than to the target, so their ordering carried no information.
- Changing **only** the generator's sampling to match three calibration dates brought the gap to 0.89 and cut GRU flight-macro MAE from 50.9 to 14.4 s and LSTM from 39.5 to 16.0 s on 69 held-out flights, in all three seeds. The MLP stayed at 16 s: matching removed the recurrent models' penalty, it did not beat a single-step model's floor.
- Distribution matching is target-specific. It transferred to ALFA, which shares the near-boundary geometry, and lost to the generic baseline on MASC-3, which does not.

How many seconds until a UAV enters a ground station's observation zone? That is the prediction task in this experiment. The label is easy to define; suitable training data is harder to find. The public flight logs used here were not recorded from a fixed station and have no entry-time labels for a zone placed after the flight. I used synthetic trajectories for training, then tested whether adding more varied UAV motion helped on real recordings.

The first study compared four synthetic training sets with the same budget: simple constant-velocity and constant-acceleration motion, that baseline with fixed-wing profiles, with multicopter profiles, and with both. Across the four sets and three model architectures (GRU, LSTM, and MLP), there were 72 tuning trials and 36 final models. I froze those models before scoring them on measured positions from three public UAV datasets.

**More varied synthetic motion did not reliably improve real-flight predictions.** The mixed-profile GRU cut synthetic validation error by 24.1%, then raised error on MASC-3 fixed-wing flights by 53.0%. There was a narrower gain: adding fixed-wing profiles improved all three architectures by 13 to 17% on a predeclared secondary ALFA geometry.

The follow-up asked whether the training data resembled the flights I wanted to predict. Motion and sensor statistics showed that all four training sets differed substantially from AMOVFLY, and much less from each other. I then built a matched training set using statistics from three calibration dates, changing how the generator sampled runs while keeping its physics, filter, and model candidates fixed. On five held-out dates, flight-macro mean absolute error (MAE) fell from 50.9 to 14.4 s for the GRU and from 39.5 to 16.0 s for the LSTM. The MLP stayed near 16 s.

![Change in macro MAE for the mixed-profile arm against the baseline, on synthetic validation and on three real UAV cohorts.](assets/posts/ttg-v2/02-transfer-gap.svg "Figure 1. Mixed profiles versus baseline, change in macro MAE, lower is better. The synthetic column is a selection set, not an independent test. Real cohorts are seed means; they are not on a common absolute-error scale. ALFA primary has one flight and is not shown.")

[Source repository](https://github.com/junyeong-nero/uav-lab) (findings, experiments table and reproduction commands in the README) · [v2 real-flight report](https://github.com/junyeong-nero/uav-lab/blob/main/docs/results_v2_real.md) · [v3 plan](https://github.com/junyeong-nero/uav-lab/blob/main/docs/plan_v3.md) · [v3 gap diagnostic](https://github.com/junyeong-nero/uav-lab/blob/main/docs/results_v3_gap.md) · [v3 result](https://github.com/junyeong-nero/uav-lab/blob/main/docs/results_v3_real.md) · [Figure provenance](assets/posts/ttg-v2/provenance.json), [v3](assets/posts/ttg-v2/provenance_v3.json)

This post replaces an earlier one about a balloon, multicopter and parachute generator. That work used a different task definition and its scores are not comparable to anything here.

## What counts as zone entry

The station sits at the origin, with x north, y east, and z up, in meters and seconds. Its observation zone is a sphere of radius 1,000 m. Entry is the first intersection between a trajectory segment and the sphere, interpolated within the step. At time t, the label is `entry_time - t`.

Only tracks that enter have a label. A track that never enters during the recording keeps a missing value, NaN in memory and null in Parquet, and is excluded from the loss and every metric. Missing labels are never replaced with zero or a large constant. The models therefore predict time conditional on eventual entry; they do not predict whether a UAV will enter.

For the real-flight evaluation, I place a virtual zone relative to each flight segment's first position, using a fixed horizontal distance to the station center, and count only the first crossing. A recording that ends outside the zone cannot tell us when, or whether, the aircraft would later enter. This evaluation tests measured trajectories against a constructed zone. It lets me check transfer to real motion, but it is not a test of a deployed ground-station sensor.

## Generate motion that never looks at the station

Each synthetic trajectory is a point mass integrated with RK4 at 0.05 s. No controller references the station position. Flights follow their own schedule, and a flight enters the zone only if that schedule happens to cross it.

Fixed-wing UAVs fly scheduled routes at 15 to 35 m/s and 100 to 500 m altitude, following heading, speed and climb-rate schedules, with optional sinusoidal heading changes, seeded lateral disturbances, doglegs, weaving and a temporary thrust loss. Multicopters are force driven at 1 to 25 m/s: a bounded thrust vector tracks a speed schedule that can hover, turn, orbit, fly a figure eight, lose thrust or change speed, all under a wind field that sums mean wind, altitude shear, a finite gust pulse and seeded sinusoidal turbulence. There are 30 profiles, 12 fixed-wing and 18 multicopter. Crossing, receding, orbit and figure-eight profiles pass outside the zone by design; they stay in the observation distribution and carry no label.

The force evaluation is a pure function of state and time, so RK4's intermediate stages never draw random numbers, and every scenario and sensor seed is drawn before worker dispatch. Regenerating a dataset with a different worker count gives identical files.

![Replay of a fixed-wing oscillating approach, a multicopter hover and resume, and an outside figure-eight circuit.](assets/posts/ttg-v2/demo.gif "Figure 2. The viewer replays a profile with its noisy observations, the filtered track and three TTG estimates. The blue wireframe is the 1 km zone. The GRU shown is a small demonstration model, not one of the research models, and the trajectories are illustrations.")

[Watch the MP4](assets/posts/ttg-v2/demo.mp4)

In the ablation datasets, every run draws its own observation period between 0.5 and 1.0 s and its own position noise between 1 and 10 m per axis. The 0.5 to 1.0 s range covers MASC-3's 1 Hz rows and the 0.5 s availability grid used for the other two datasets. A Singer-model Kalman filter tracks the observations with one fixed 5 m measurement setting for every arm; it is not told the sampled noise level, and its update interval follows the observed timestamps, as it must on real flights. Eight scalar features come out of the filter state: range, range rate, a constant-velocity entry estimate capped at 400 s, speed, lateral acceleration, approach cosine, innovation norm and elapsed time. Normalization is fit on training runs only. Models regress log1p-transformed or raw time with a Huber loss and clamp the output at zero.

## Hold the budget fixed and change only which profiles fill it

![Composition of the four training arms.](assets/posts/ttg-v2/01-training-design.svg "Figure 3. Every arm has 500 runs and 55,778 supervised timestamps. The added-profile arms replace half of the simple-motion runs with UAV profiles. The update budget is matched; initial-state distributions and the selected model settings are not.")

| Arm | Training runs | Supervised timestamps |
| --- | --- | --- |
| Baseline: 250 constant-velocity + 250 constant-acceleration runs, 1 to 35 m/s | 500 | 55,778 |
| + FW: 125 CV + 125 CA, plus 250 runs cycling the fixed-wing profiles | 500 | 55,778 |
| + MC: 125 CV + 125 CA, plus 250 runs cycling the multicopter profiles | 500 | 55,778 |
| Mixed (Ours): 125 CV + 125 CA, plus 250 runs cycling all profiles | 500 | 55,778 |

The baseline has no wind or maneuvers. Its runs start 1,100 to 4,000 m from the station, a range intended to include shorter pre-entry tracks. As the later distribution check shows, that did not make them representative of AMOVFLY launches. All four arms share one validation set of 100 synthetic runs: 25 constant-velocity, 25 constant-acceleration, and 50 entering UAV-profile runs, giving 12,473 eligible timestamps.

For each architecture and arm, six predeclared candidates are compared at tuning seed 17: hidden width 32 or 64, learning rate 0.001 or 0.003, log or raw target, and weight decay 0 or 0.0001, in six fixed combinations, each trained for 60 epochs or 480 updates. The candidate with the lowest validation run-macro MAE is retrained with seeds 0, 1 and 2 for 200 epochs or 1,600 updates, keeping the best validation checkpoint. That is 72 tuning trials and 36 final models. Every selected candidate used the log target. No real data touched any selection, and no model is retrained or renormalized on real data afterwards.

Two differences remain between the arms. Their initial states, trajectory lengths, and remaining-time distributions vary with the profiles. Each arm also selects its own model candidate, so the final hidden widths can differ. The comparison tests which profiles fill half the training budget; it cannot isolate the effect of environmental forces.

## Synthetic validation favored the mixed GRU

Three-seed mean run-macro MAE in seconds on the shared validation runs. Negative changes favor the mixed arm.

| Model | Baseline | + FW | + MC | Mixed | Mixed vs baseline |
| --- | --- | --- | --- | --- | --- |
| GRU | 6.224 | 5.690 | 4.875 | 4.723 | -24.1% |
| LSTM | 6.476 | 6.121 | 5.595 | 6.596 | +1.8% |
| MLP | 11.136 | 10.832 | 11.260 | 10.782 | -3.2% |

The GRU improved for every added arm and every seed. Its timestep MAE fell from 12.706 to 8.591 s and the mean seedwise 95th-percentile error from 66.593 to 42.508 s. The slow multicopter profiles moved most: GRU macro MAE on `drone_crawl` went from 68.401 to 46.717 s, on `drone_walk` from 37.595 to 13.855 s, and on hover-and-resume from 32.019 to 10.961 s, each on only two validation runs. Constant-velocity runs improved from 2.833 to 2.059 s while constant-acceleration runs got slightly worse, 5.645 to 5.788 s. The LSTM mixed arm beat its same-seed baseline in one seed out of three. The MLP moved by a few percent either way.

On the 10,759 timestamps (86.3%) where both analytic estimators are defined, the capped Kalman constant-velocity estimate scores 14.594 s against 4.774 s for the mixed GRU. On MASC-3 that ordering reverses.

These scores come from the same validation runs used to choose candidates and checkpoints, so they are not independent test results. The added arms also train on profile families present in that set. Some of the gain may come from that distribution match.

## Freeze everything, then score real flights

| Dataset | Platform | Source flights | What the recordings are |
| --- | --- | --- | --- |
| [MASC-3/WINSENT](https://doi.pangaea.de/10.1594/PANGAEA.947119) (CC BY 4.0) | fixed-wing UAS | 14 | 605 provider-processed straight legs over complex terrain, 1 Hz rows |
| [ALFA](https://kilthub.cmu.edu/articles/dataset/ALFA_A_Dataset_for_UAV_Fault_and_Anomaly_Detection/12707963) (CC BY 4.0) | fixed-wing UAV | 31 | 47 sequences, including injected control-surface and engine faults |
| [AMOVFLY](https://github.com/YujiaoHu/AMOVFLY-Dataset) | multicopter | 277 | MAVROS local positions with a horizontal extent of at most 172 m |

The zone radius is 1,000 m everywhere. What changes between conditions is where the station center sits relative to each segment's first position: 1,500 m for the fixed-wing primary condition and 1,050 m for the AMOVFLY primary condition, because AMOVFLY tracks are too short to reach a zone placed further away. ALFA at 1,050 m is a predeclared sensitivity condition and was not promoted to primary after the fact. Model file hashes and zone geometry were written into a protocol file before any prediction, and the hashes were checked against the v2 model files before and after evaluation.

Inputs stay causal. On a 0.5 s availability grid the filter receives the most recent raw observation and is never updated twice with the same one; the filter uses the raw timestamp and the target uses the availability time. No future position is interpolated into an input. Future positions are used only to compute the entry label.

The scoring unit is a case, one flight segment paired with one zone bearing. Case MAE is averaged within a flight, flights are averaged with equal weight, and then the three seeds are averaged. Several bearings on one flight never count as separate flights. Confidence intervals are paired differences against the same architecture's baseline, computed after averaging seeds, with 2,000 bootstrap resamples that treat each flight date as a cluster. They do not include training-seed uncertainty and are not adjusted for multiple comparisons. With five to ten dates per cohort they are conditional evidence, not population claims.

![Eligible flights, dates, zone cases and timestamps for each evaluated cohort.](assets/posts/ttg-v2/05-evaluation-coverage.svg "Figure 4. Coverage per cohort. MASC-3 at 1,050 m and AMOVFLY at 1,500 m produce no eligible crossings at all. ALFA at 1,500 m keeps one flight on one date, so its bootstrap collapses to a point.")

| Cohort | Role | Eligible / source flights | Dates | Cases kept / candidates | Timestamps |
| --- | --- | --- | --- | --- | --- |
| MASC-3, 1,500 m | primary | 14 / 14 | 10 | 313 / 4,840 | 9,234 |
| ALFA, 1,500 m | primary, n = 1 | 1 / 31 | 1 | 1 / 376 | 67 |
| ALFA, 1,050 m | sensitivity | 29 / 31 | 5 | 114 / 376 | 8,635 |
| AMOVFLY, 1,050 m | primary | 109 / 277 | 8 | 348 / 2,216 | 37,546 |

Every reported flight-macro MAE was recomputed from the saved prediction arrays by a separate script, 144 model, cohort and geometry combinations in all. That script originally scanned only the nested fixed-wing layout and silently skipped AMOVFLY; it now handles both layouts and fails on an empty result. No prediction or selection logic changed.

## Fixed-wing: MASC-3 got worse, one ALFA geometry got better

![Added arm minus baseline flight-macro MAE on MASC-3 and ALFA, with date-cluster bootstrap intervals.](assets/posts/ttg-v2/03-fixedwing-effects.svg "Figure 5. Each point is an added arm minus the same architecture's baseline, mean over three seeds. Positive is worse. The two panels have different axes in seconds. Intervals are paired date-cluster bootstraps without seed uncertainty or multiplicity correction.")

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

On the ALFA sensitivity geometry, adding fixed-wing profiles helped all three architectures: GRU by 10.581 s (17.3%), LSTM by 7.527 s (13.4%), and MLP by 2.930 s (17.2%), with every interval below zero. Adding multicopter profiles raised GRU error by 72.923 s. The mixed arm helped only the LSTM, by 22.6%. The fixed-wing arm beat the same-seed baseline in two of three seeds for the GRU and LSTM and in all three for the MLP. This was the clearest gain shared by all three architectures in v2, limited to this geometry and these five dates.

The ALFA primary geometry at 1,500 m keeps one flight, so its numbers are descriptive only: GRU 14.156 to 17.935 s, LSTM 15.272 to 15.663 s, MLP 3.646 to 2.810 s for baseline versus mixed.

## Multicopter: no added arm helped on AMOVFLY

![Added arm minus baseline flight-macro MAE on AMOVFLY, with date-cluster bootstrap intervals.](assets/posts/ttg-v2/04-multicopter-effects.svg "Figure 6. Same construction as Figure 5, for the 109 eligible AMOVFLY flights on eight dates. An interval that includes zero means the difference was not resolved, not that it is zero.")

| Cohort | Model | Baseline | + FW | + MC | Mixed | Mixed change | Mixed minus baseline, 95% CI (s) |
| --- | --- | --- | --- | --- | --- | --- | --- |
| AMOVFLY, 1,050 m | GRU | 53.948 | 54.883 | 101.348 | 57.310 | +6.2% | [-3.841, +10.442] |
| AMOVFLY, 1,050 m | LSTM | 41.307 | 41.812 | 42.146 | 49.733 | +20.4% | [+4.074, +12.626] |
| AMOVFLY, 1,050 m | MLP | 18.043 | 18.399 | 25.979 | 18.232 | +1.0% | [-0.011, +0.366] |

No added arm lowered mean error for any architecture. The mixed-arm GRU and MLP intervals include zero, leaving those differences unresolved; the LSTM is worse by 8.426 s, with an interval above zero. Adding multicopter profiles raised GRU error by 47.4 s. Matching the platform name was clearly not enough to make the synthetic data useful here.

Absolute errors are also much larger here than on MASC-3, and the MLP is the best architecture by a wide margin in every arm. AMOVFLY flights cover at most 172 m horizontally and approach a zone edge only about 50 m from their first position, so the eligible tracks are short and close to the boundary. Which of those properties drives the recurrent models' errors is not something this experiment isolates.

## Checks that rule out the easy explanations

Output collapse does not explain the differences. The largest fraction of exactly-zero predictions in any model, seed and cohort is 0.0217% on MASC-3, 0.0811% on ALFA sensitivity and 0.0719% on AMOVFLY.

Seed averaging is not hiding a consistent effect either. Counting how often an added arm beats the baseline trained with the same seed: on MASC-3, the only wins are one of three for the GRU mixed arm and one of three for the MLP mixed arm. On AMOVFLY the GRU mixed arm wins two seeds of three while losing on the mean, because its third seed scores 71.231 s against a 49.814 s baseline.

Simple analytic estimators did better on MASC-3. On the same timestamps, differencing consecutive measured ranges gives 0.993 s MAE, and extrapolating the Kalman state gives 1.065 s, lower than every trained model in every arm.

Both estimators are undefined when the estimated range rate is not closing. That excludes no MASC-3 timestamps, but it removes 48.4% of ALFA sensitivity timestamps and 42.7% of AMOVFLY timestamps. The report therefore compares methods on their common subsets and keeps those scores separate from full-cohort results.

## What the v2 design cannot separate

The v2 results left me with a question the design could not answer: why did added motion diversity help in some cases and hurt in others? Forces, maneuvers, initial states, remaining-time distributions, and selected hyperparameters all varied between arms. For the preregistered follow-up, I asked a more specific question: how far was the training distribution from the target, and would narrowing that gap help?

## Measure the distance before blaming the physics

I chose AMOVFLY because it had the most eligible flights (109 on 8 dates) and large errors in v2. Before measuring the distribution gap, I split its dates into three calibration dates (40 entering flights, 145 zone cases) and five evaluation dates (69 flights). Calibration statistics could inform the generator; evaluation positions stayed unread until prediction. The plan fixed the split, measured variables, allowed sampling adjustments, number of adjustment rounds, and decision rule.

I computed motion and sensor statistics from observed pre-entry tracks using the same definitions for real and synthetic data. These covered initial range to the boundary, pre-entry duration, ground speed (median, P10, P90), heading rate (P90), vertical speed (median and P90), the fraction of stopped samples, observation period, position noise estimated from second differences, and the remaining-time label.

Speeds came from windowed linear fits because directly differencing positions with 1 to 10 m of noise at 0.5 s intervals can create large apparent velocities. For each variable, I measured the one-dimensional Wasserstein distance and divided it by the RMS of the real and synthetic spreads. The summary gap is the unweighted mean across the twelve diagnostic variables.

![Normalized W1 per variable for the four v2 arms and the matched arm against AMOVFLY.](assets/posts/ttg-v2/06-distribution-gap.svg "Figure 7. Distance to the AMOVFLY calibration distribution, per variable. Values above 4 are clipped. The right-hand column is the matched arm described in the next section.")

| Statistic | AMOVFLY (median) | Baseline | + FW | + MC | Mixed |
| --- | --- | --- | --- | --- | --- |
| Range to the boundary at the first observation (m) | 50 | 1,586 | 1,809 | 1,323 | 1,476 |
| Ground speed, median (m/s) | 4.0 | 21.9 | 24.1 | 15.2 | 19.7 |
| Fraction of samples stopped | 0.13 | 0.00 | 0.00 | 0.00 | 0.00 |
| Position noise estimate (m) | 0.21 | 5.5 | 5.0 | 5.3 | 5.3 |
| Observation period (s) | 0.50 | 0.75 | 0.76 | 0.75 | 0.74 |
| Summary gap | | 2.05 | 2.25 | 1.81 | 1.90 |

The typical v2 track looked very different from an AMOVFLY track. Median initial distances exceeded a kilometre outside the zone, speeds were four to six times higher, the stopped fraction had a median of zero, and estimated position noise was about 25 times larger. AMOVFLY positions come from MAVROS EKF output, with about 0.2 m of estimated noise; the generator assumed 1 to 10 m.

All four arms were much farther from the target than from each other. Even their relative ordering was unhelpful: the closest arm (+ MC) had the worst GRU and MLP error. Before adding more profiles, I needed to test whether sampling trajectories closer to the target would help.

## Match the sampling, keep everything else

The matched arm changes how the generator samples runs: start range 1,013 to 1,027 m, altitude 10 to 40 m, speed 1.5 to 8 m/s, scheduled events starting at 1 to 6 s, a profile mix weighted toward hover, climb, and turn, observation periods of 0.5 to 0.58 s, and noise of 0.09 to 0.28 m. Profile physics, wind, the Kalman filter, eight features, model architectures, and six tuning candidates remain fixed. Five rounds of adjustment against calibration statistics reduced the summary gap from 2.05 to 0.89.

Before the first round, I amended the plan to allow additional altitude and event-timing adjustments, as recorded there. The original drone profiles cruised at 300 m, keeping the 3D boundary distance above 90 m. Events also needed to happen earlier: a drone starting 50 m from the boundary could enter in about 12 s, before a hover scheduled at 25 s began.

Sampling changes could not reproduce takeoff. Each AMOVFLY track starts when the aircraft passes 5 m, so its first seconds include a near-vertical climb. That phase contributes the stopped samples, vertical speeds around 1.3 m/s, and heading rates around 30 deg/s. None of the existing profiles reproduces it, and adding a profile was outside the plan. Those variables remain far apart in Figure 7.

The matched tracks are short: a median of 26 observations. Five hundred runs therefore supply only 14,400 supervised timestamps, compared with v2's 55,778. To match the label budget, I used 1,984 runs and subsampled their usable labels to exactly 55,778. The optimizer budgets were close, though not identical: 496 and 1,612 updates, compared with 480 and 1,600.

Candidates and checkpoints were still selected on the v2 synthetic validation set, where the matched models scored 29 to 87 s. That set is far from the matched distribution, so it remains a limitation of model selection. Real data informed generator calibration, but was not used to choose model candidates or checkpoints.

## The recurrent models lose most of their error

The nine frozen matched models were scored on the five evaluation dates (69 flights, 203 zone cases, 19,744 timestamps). The v2 arms were re-aggregated from their saved per-flight errors on the same 69 flights; nothing was re-predicted. The verdict rule, fixed before prediction, asks whether the matched-minus-baseline interval lies below zero in at least two of the three architectures.

![Matched minus baseline per architecture with intervals, and absolute means per arm.](assets/posts/ttg-v2/08-matched-effects.svg "Figure 8. Matched − baseline flight-macro MAE with paired date-cluster bootstrap intervals, seeds averaged first. Below, the absolute means of every arm on the same flights.")

| Model | Baseline | + FW | + MC | Mixed | Matched | Matched − baseline, 95% CI (s) | Seeds better |
| --- | --- | --- | --- | --- | --- | --- | --- |
| GRU | 50.87 | 51.55 | 89.09 | 49.07 | 14.40 | [-39.89, -34.27] | 3/3 |
| LSTM | 39.52 | 39.64 | 39.29 | 45.45 | 16.01 | [-25.43, -21.69] | 3/3 |
| MLP | 15.94 | 16.43 | 24.16 | 16.30 | 16.34 | [-0.36, +1.28] | 1/3 |

The GRU improved by 72% and the LSTM by 60%. Both improved in all three seeds, with intervals well below zero, satisfying the predeclared rule. The MLP stayed near 16 s, with an interval spanning zero. After matching, all three architectures had mean errors around 14 to 16 s.

This is consistent with a mismatch in the temporal patterns learned by the recurrent models: kilometre-long approaches at about 20 m/s differ greatly from short approaches with hovering near the boundary. The experiment does not isolate that mechanism, though, or establish a lower bound on achievable error.

Long-horizon cases remained difficult. Errors in the 40 s+ band were about 90 s, P95 was near 190 s, and all three architectures scored above 50 s on the seven manually flown Random-scenario flights. The experiment cannot separate the contribution of the unmodeled takeoff phase from uncertainty about what the pilot will do next.

An independent recomputation from saved prediction arrays reproduced all nine scores. On the common subset where the analytic estimators are defined, the capped Kalman constant-velocity estimate scores 29.6 s, compared with 11.1 s for the matched GRU. Here the learned model outperforms the analytic estimate, reversing the MASC-3 comparison.

![Summary gap against evaluation-date MAE for all arms.](assets/posts/ttg-v2/07-gap-vs-error.svg "Figure 9. Summary gap against flight-macro MAE on the evaluation dates. The four v2 arms cluster at gap 1.8 to 2.3, and their ordering does not track prediction error. The matched arm has a substantially smaller gap.")

Figure 9 also shows what the diagnostic alone could not do. The four v2 arms share one sampling envelope, so their gaps sit within 1.8 to 2.3 and their ordering does not track their error; the closest arm is the worst. The matched arm combines a much smaller gap with lower recurrent-model error. That makes the gap useful as a diagnostic here, but not a general predictor of accuracy.

## Transfer to another geometry has limits

A predeclared secondary check scored the same nine matched models on ALFA at 1,050 m: 29 flights on five dates, flown by fixed-wing aircraft at 15 to 35 m/s with injected actuator faults. Against the v2 baseline, GRU error fell from 61.2 to 11.1 s and LSTM error from 56.1 to 19.8 s, in all three seeds. The MLP worsened from 17.0 to 28.8 s.

The matched arm contains no fixed-wing profile, but it shares ALFA's near-boundary starting geometry. That suggests starting distance may explain some of the transfer. It does not isolate geometry from the other sampling changes.

I also scored MASC-3 at 1,500 m. This check was outside the plan and is descriptive only. The matched GRU scored 6.2 s against the v2 baseline's 1.2 s; the matched MLP scored 35 s against 1.9 s. Those straight legs start about 500 m outside the zone, beyond the matched sampling range.

Calibrating to AMOVFLY helped the recurrent models there and on the secondary ALFA geometry, but hurt transfer to MASC-3. The matched dataset is useful for a particular target distribution; these results do not establish a single training set that works across all three cohorts.

## What is still open

The follow-up changed sampling while holding the physics, filter, and model candidates fixed. It did not separate the contributions of start range, speed, noise, and event timing. ALFA makes starting distance worth testing next, but a separate ablation is needed.

There are other limits. Matching the label budget required about four times as many short runs; I did not train a 500-run matched version. Model selection still used a validation distribution unlike the matched training set. The confidence intervals resample dates rather than training seeds, although the recurrent-model gains appeared in all three seeds. Adding a takeoff profile would require a new experiment and preregistration.

## Reproduce the experiment

Run these commands from the source repository with Python 3.13+, its locked `uv` environment, a C++17 compiler, and `make`. Each step refuses to overwrite an existing output folder. Training takes hours.

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
uv run scripts/evaluate_fixedwing.py --models out/airspace/research/ablation_uav_tuning_v3 \
  --output out/airspace/research/fixedwing_uav_v3
uv run scripts/compare_v3.py --v2 out/airspace/research/fixedwing_uav_v2 \
  --v3 out/airspace/research/fixedwing_uav_v3 --cohort alfa --distance 1050
```

The `--models` option freezes model hashes and zone geometry into a protocol before prediction. Frozen protocols, selections, per-cohort scores, comparisons and the independent diagnostics are tracked in the repository; prediction arrays and source downloads are regenerated locally. The figures above are built from those JSON files, and [provenance.json](assets/posts/ttg-v2/provenance.json) records the SHA-256 of every input and every SVG.

## What this experiment establishes

The first study showed how misleading synthetic validation gains can be. Added UAV profiles helped the GRU on synthetic validation, hurt both recurrent models on MASC-3, and gave a more limited benefit on the secondary ALFA geometry. None of the added arms lowered mean error on AMOVFLY.

The follow-up made more progress by measuring how the synthetic tracks differed from AMOVFLY and adjusting their sampling. On 69 held-out flights, GRU error fell from 50.9 to 14.4 s and LSTM error from 39.5 to 16.0 s, while the MLP stayed near 16 s. That supports distribution mismatch as an important part of the problem, without identifying which sampling change mattered most.

For the next experiment, I would test those sampling choices individually before adding more complex physics. The useful question is whether the generated tracks resemble the situations the model will actually face, and which remaining differences explain its errors.
