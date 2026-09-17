A narrow corridor looks like the obvious enemy of a drone swarm trying to observe a person. In this experiment, the larger changes came from somewhere else: **how far the drones had to stay from the target, where their sensors could point, and how many drones were available**.

I varied seven quantities on twelve predefined corridor and corner maps, then separated three questions: does a feasible placement exist, how informative is the returned placement, and what happens when the swarm tries to fly it? The results are conditional on this simulator and observation model. They are not a comparison of tracking algorithms.

The experiment collection finished on September 17, 2026. The static sweeps and selected interaction grids are complete, along with a static estimator check and 108 closed-loop flight episodes. Four flight episodes violated safety constraints; those failures remain part of the result.

![Paired CRLB increases for seven constraint axes, with map-cluster confidence intervals. Standoff, sensor operation and swarm size have the largest effects at the selected levels.](assets/posts/drone-swarm/constraint-effects.svg "Figure 1. Selected restrictive levels of each axis. Positive values mean a larger position-error bound. Whiskers are 95% map-cluster bootstrap intervals, not uncertainty across independent solver seeds. The common baseline CRLB is 2.627 cm.")

[View full-size figure](assets/posts/drone-swarm/constraint-effects.svg)

[Source repository](https://github.com/junyeong-nero/drone-swarm-simulator) · [Full results](https://github.com/junyeong-nero/drone-swarm-simulator/blob/bd3a2e7/docs/RESULTS.md) · [Figure data and provenance](assets/posts/drone-swarm/provenance.json)

## Measure observation geometry before claiming tracking accuracy

The target position is known to the placement planner. The experiment asks where observers should be placed around that target under a set of constraints. It does not ask an autonomous swarm to find an unknown person.

Each observer supplies a bearing measurement with 1° angular noise. Observer positions are assumed known. The Fisher information depends on the viewing directions and the distance to the target: information weakens with the square of distance, and a bearing gives information perpendicular to its line of sight.

The reported CRLB is the square root of the trace of the inverse Fisher information matrix: an RMS bound on three-dimensional position error, expressed in centimetres. **Lower is better.** This is a model-based geometry metric, not a measurement of real drone localization accuracy.

Only visible observers contribute information. The evaluator includes sensor field of view, wall occlusion and drone–drone occlusion. When communication disconnects, it uses the best-informed connected component rather than silently pooling information across the whole swarm. Degenerate geometry has an infinite bound and is reported separately from finite averages.

The placement objective is D-optimal information, based on a log-determinant. That is not identical to the trace-based CRLB we report. A finite-budget local optimizer does not establish a globally optimal CRLB or guarantee that its returned values vary monotonically with every constraint.

## A failed solve does not prove that a placement is impossible

An early version of the study ran into a misleading result: both optimizers could fail on a condition even though a feasible placement could be recovered from another condition or initialization. Solver success was partly a search statistic.

For the main sweeps, every input first goes through a grid feasibility check. The check uses the same hard-constraint oracle as the placement solver. It looks for a connected set of separated slots on a 0.25 m grid, refining to 0.125 m when needed.

If it finds a witness, SLSQP starts from that witness, a seeded random ring and a connected arc, with up to 1,200 objective calls per start. If the certificate runs out of search budget, the outcome is **undecided**, not infeasible. A negative certificate is a statement about the tested grid, not a proof that no solution exists in continuous space.

The constraints include standoff, altitude, workspace, wall clearance, line of sight, sensor FOV, pairwise separation and communication. Separation uses a downwash-aware ellipsoidal distance with vertical scaling fixed at three. Planned slots keep an additional 0.15 m beyond the hard separation distance; this is distinct from the flight safety threshold.

The solver's hard LOS check considers walls, while the evaluator also counts drone–drone occlusion. That modelling difference remains a limitation of the placement stage.

## Seven axes, one shared reference

The maps contain six staggered corridors and six asymmetric corners. The person is represented by a target point moving at 1.5 m/s; the static experiment evaluates the middle of its manoeuvre. Walls are 6 m high. The maps were defined before the earlier held-out validation and reused in the later studies. They are not a new independent map set at every stage.

The reference condition uses eight drones, communication range 4 m, required separation 0.5 m, a free gimbal, target standoff 2–4 m and ceiling 3 m above the target. One axis changes at a time.

| Axis | Levels tested |
| --- | --- |
| Communication | 0.8, 1.2, 1.6, 2, 3, 4 m |
| Separation | 0.5, 0.75, 1, 1.25, 1.5 m |
| Sensor operation | Gimbal, then fixed nadir half-angles 60°, 50°, 40°, 30°, 20° |
| Swarm size | 4, 6, 8, 10, 12 drones |
| Minimum standoff | 1, 1.5, 2, 2.5, 3, 3.5 m; maximum stays 4 m |
| Ceiling above target | 0.5, 1, 1.5, 2, 3 m |
| Corridor width multiplier | 0.7, 0.85, 1, 1.3, 1.7 |

Each cell has twelve maps and three solver seeds. Effects are condition-minus-baseline differences within the same map and seed, averaged within map and then across maps. The 95% intervals resample maps within the two geometry families, retaining the seed pairs, for 10,000 bootstrap draws. Solver seeds are repeated searches, not independent environments.

Three stored sweep studies contain 1,404 records. All were grid-certified feasible and returned valid, nondegenerate placements. That count includes repeated baseline cells and the first sensor run; it is not the number of independent samples or unique final conditions. The final sensor curves use only the corrected sensor study.

### Distance, sensor operation and drone count

Increasing minimum standoff from 2 m to 3.5 m raised CRLB by **2.030 cm**, to 4.657 cm. Across the tested range, the curve was approximately linear in distance, consistent with the distance dependence of the bearing information model.

Switching from a gimbal to a fixed nadir sensor with a 20° half-angle raised CRLB by **1.963 cm**. The increases at 40° and 30° were 0.565 and 1.268 cm. The comparison with a gimbal changes sensor operation as well as angular coverage; it is not a pure half-angle change with the boresight held fixed.

Reducing the swarm from eight drones to four increased CRLB by **1.089 cm**. Twelve drones reduced it by 0.477 cm. The curve was close to the familiar inverse-square-root dependence on observer count. Within this static 4–12 drone range, crowding did not reverse the benefit of adding observers.

![Three dose-response panels showing absolute CRLB against minimum standoff, sensor half-angle and drone count, with separate corridor and corner curves.](assets/posts/drone-swarm/main-dose-response.svg "Figure 2. The three larger effects over the tested ranges. Charcoal circles are corridors; coral squares are corners. Thin lines retain individual maps, bold lines show family means. Each panel has its own vertical scale.")

[View full-size figure](assets/posts/drone-swarm/main-dose-response.svg)

The sensor curve needed a measurement correction before it was interpretable. The original solver tolerated 1 mm of hard-constraint violation, but the sensor evaluator used a strict cone test. At 20°, accepted cone-edge slots could be counted as blind. A separate rerun added a 2 mm inward cone margin. Its strict and cone-tolerant evaluations agree, and it supplies all sensor-axis values in this post. The original records remain archived.

### The other constraints mattered nearer the extremes

Communication range had little effect over much of the sweep, then became more costly at the shortest levels. The CRLB increase was 0.066 cm at 1.2 m and **0.665 cm at 0.8 m**, with a relatively wide map-cluster interval of 0.378–1.099 cm. Visibility at 0.8 m was 98.6%, reflecting the evaluator's treatment of mutual occlusion.

The strongest tested separation, lowest ceiling and narrowest width produced smaller mean increases: **0.186, 0.165 and 0.035 cm**, respectively. Those values describe this baseline and these ranges. They do not establish that walls or safety separation are unimportant in other environments.

![Four dose-response panels for communication range, safety separation, ceiling and corridor width, using the same charcoal and coral map-family colors.](assets/posts/drone-swarm/secondary-dose-response.svg "Figure 3. Smaller single-axis effects. Vertical scales differ and some curves are not monotone. All tested single-axis cells were certified feasible; a flat feasibility curve would not imply flat observation quality.")

[View full-size figure](assets/posts/drone-swarm/secondary-dose-response.svg)

## Constraint pairs can remove the feasible region

The one-factor sweeps stayed feasible. The selected two-factor grids did not.

I tested sensor × standoff, sensor × ceiling, and communication × separation: 52 cells and 1,872 inputs in total. The original run contained **1,383 certified feasible inputs, 435 grid-infeasible inputs and 54 undecided inputs**. Every certified input returned a valid, nondegenerate placement.

A narrow nadir cone restricts where an observer can be while seeing the target. Combining it with a large minimum distance or low ceiling can leave no placement on the tested grid. Both 30° and 20° were grid-infeasible at standoff 3.5 m; every tested nadir condition was grid-infeasible at ceilings of 1 m and below. Communication also conflicts with separation when its range is smaller than the required separation plus the slot margin: no neighbor can satisfy both distance requirements.

![Three certification grids with feasible counts in charcoal, grid-infeasible cells in stone and budget-exhausted cells in soft coral. Each cell explicitly lists F, I or U counts.](assets/posts/drone-swarm/interaction-feasibility.svg "Figure 4. The original certification outcomes. F means certified feasible, I means infeasible on the tested grid, and U means the search budget was exhausted. Counts sum to 36 in every cell. Undecided cells have a distinct color and are never relabeled as failures.")

[View full-size figure](assets/posts/drone-swarm/interaction-feasibility.svg)

The 54 undecided inputs were re-certified post hoc on the 0.125 m grid with a larger budget. Twenty-one were feasible and 33 were grid-infeasible. The original cells and quality tables were preserved. Finding a later feasible witness does not create an additional optimized quality result for the frozen experiment.

Quality interaction also depends on the scale used to measure it. For each map and seed, the additive interaction subtracts both single-axis changes from the combined change. The log interaction makes the corresponding comparison on log CRLB, where zero represents a multiplicative relationship. Only quadruples with valid, nondegenerate results in all four cells contribute.

Many log interactions were small, but they were not universally zero. At nadir 20° and standoff 1.5 m, the log interaction was **+0.127 [0.115, 0.143]**. At 30° and 1.5 m it was **−0.051 [−0.072, −0.025]**. At 20° and 3 m, the additive interaction was +1.143 cm while the log interaction was only +0.019. These examples use 36 paired quadruples across twelve maps.

The conclusion is therefore narrower than saying that the constraints are independent: many feasible cells were close to multiplicative on this metric, some deviated, and feasibility had clear joint restrictions.

## An estimator can reach the static bound under the same model

A CRLB is not itself an estimator result. To check whether the scale of the bound was meaningful within the observation model, I generated 200 noisy bearing-measurement sets for each of the 1,404 stored sweep placements and ran a maximum-likelihood implementation.

The estimator initializes from the intersection of noisy measurement lines, then refines the position with Gauss–Newton iterations. The true target position is used to simulate measurements and score errors, not to supply the estimator's initial position.

The median **RMSE/CRLB ratio was 0.999**, with a 5th–95th percentile range of 0.951–1.055. The log-log correlation was 0.9924, and the stored and recomputed CRLB values agreed.

![Static maximum-likelihood RMSE versus CRLB for all stored placements. Charcoal and coral points follow the dashed equality line.](assets/posts/drone-swarm/estimator-check.svg "Figure 5. A post-hoc check under the same bearing-noise model. The percentile range describes the distribution of placement-level ratios, not a confidence interval on a condition effect. The original sensor placements are included using only the observers the evaluator counted as visible and fused.")

[View full-size figure](assets/posts/drone-swarm/estimator-check.svg)

This supports the bound as a useful static error scale under the chosen noise model. It does not validate real sensor noise, observer-position error, temporal filtering or tracking through missed observations.

## Flight makes the sensor penalty much larger

Static placements do not move, overshoot, or temporarily lose the target during reassignment. The dynamic study ran 108 episodes: twelve maps, three conditions and three random initial-position seeds, for 30 seconds each.

The three conditions were baseline, nadir 30°, and minimum standoff 3 m. The loop replanned every 2 s, using a warm-started placement solver, Hungarian assignment, a local VisPlanner transit implementation, a velocity controller and an ORCA safety filter. The dynamic placement stage did not run the static grid-certification procedure. No estimator was in the flight loop.

The safety filter had been corrected before this study: its obstacle barrier now considered each nearby shape rather than only the nearest surface. The 108 episodes are the results after that fix, not a mixture of old and new controllers.

| Condition | Actual CRLB | Planned slot CRLB | Visibility | Safe episodes |
| --- | ---: | ---: | ---: | ---: |
| Baseline | 2.965 cm | 2.636 cm | 91.9% | 35/36 |
| Nadir 30° | 7.368 cm | 3.955 cm | 55.3% | 33/36 |
| Standoff 3 m | 5.178 cm | 4.064 cm | 75.7% | 36/36 |

The baseline-to-nadir increase was **4.403 cm in flight**, compared with **1.268 cm statically**. Standoff 3 m increased flown CRLB by 2.212 cm versus 1.350 cm statically. These compare a static snapshot with a dynamic event window; I did not test the significance of their difference or isolate the causal contributions of FOV loss, occlusion and tracking lag.

![Planned and actual CRLB by condition, followed by static and flown condition effects with confidence intervals. Safety and observation-degeneracy counts appear below the panels.](assets/posts/drone-swarm/dynamic-realisation.svg "Figure 6. Observation quality during flight. Actual CRLB averages finite event-window samples within each episode. Planned slot CRLB pools valid actual/slot placement pairs. The two means therefore do not define the separately reported, paired realisation gap.")

[View full-size figure](assets/posts/drone-swarm/dynamic-realisation.svg)

**Safety held throughout 104 of 108 episodes.** The four failures were wall-clearance violations lasting 0.28–0.80 s, with minimum clearance slack down to −0.161 m. They remain failures and stay in the other statistics.

A second limitation is easy to miss in the mean: **3 of the 36 standoff episodes contained degenerate observations**. The mean episode-level event-window degeneracy fraction was 0.890%, and the maximum was 20.902%. Baseline and nadir 30° had no event-window degeneracy.

Every episode had some finite CRLB samples. The 5.178 cm standoff mean therefore describes the finite part of the observation record; it does not turn the periods with an infinite bound into an acceptable finite error. Visibility, degeneracy and safety must be read alongside the quality average.

## What I would carry into the next study

The completed experiment supports a practical distinction. Standoff, sensor operation and drone count strongly changed the returned static observation geometry over these tested ranges. Selected constraint pairs restricted feasibility, and some also produced measurable quality interactions. A matching static estimator approached the bound, but the configured flight stack lost substantially more quality under limited sensing.

It does not support a claim of guaranteed safe flight, continuous-space infeasibility, real-sensor accuracy, or generalization beyond the two map families. It also does not show that any particular transit planner is superior.

I am closing this experiment with its failures intact. Diagnosing the four wall-clearance violations, decomposing the flown loss, changing the replanning period or testing an estimator inside the loop would each answer a different follow-up question. They are follow-up studies; the current work closes with its measured limitations.

## Data, figures and reproduction

All six figures were redrawn from archived numerical records, using this blog's warm canvas, coral accent and charcoal text colors. Shape, line style and explicit certification labels carry meaning alongside color. The plotting script reads the color tokens from the existing stylesheet; the site-wide theme is unchanged.

- [Figure source and reproduction notes](assets/posts/drone-swarm/README.md)
- [Figure renderer](assets/posts/drone-swarm/render_figures.py)
- [Source-file hashes and provenance](assets/posts/drone-swarm/provenance.json)
- [Original full results and frozen protocols](https://github.com/junyeong-nero/drone-swarm-simulator/blob/bd3a2e7/docs/RESULTS.md)
- [Dynamic condition summary](assets/posts/drone-swarm/data/constraint_dynamic.summary_by_condition.json)
- [Post-hoc re-certification](assets/posts/drone-swarm/data/constraint_interaction.undecided_recertification.json)

The data copies are unchanged archives, including the first sensor run and original undecided outcomes. Figure generation runs no simulation and does not replace any original result.
