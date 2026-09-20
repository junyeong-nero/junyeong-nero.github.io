## TL;DR

- 4,878 closed-loop flights: 62 constraint cells × 27 maps from nine geometry families × 3 start seeds, each 20 s, each measured on the same 12 s event window. Every cell was flown, and the CRLB of the drones' real positions is reported next to the CRLB their own placement planned.
- Three constraints are mild on paper and severe in flight. A fixed 20° nadir cone raised the planned-slot CRLB by 1.98 cm and the flown CRLB by **9.06 cm**; a 0.8 m communication range by 0.26 cm planned and **6.92 cm** flown; a 1.5 m separation by 0.25 cm planned and **3.32 cm** flown.
- Two transfer from plan to flight almost exactly: minimum standoff 3.5 m (+2.06 planned, +1.83 flown) and four drones instead of eight (+1.15, +1.16). Ceiling and corridor width barely move either number.
- The separation loss depends on the walls: 3.3 cm in open space, 10.1 cm in corridors, 18.8 cm in closed corners. The communication loss does not: 10.5 cm in open space with no wall at all.
- Geometry alone changes nothing at baseline. The nine families sit between 2.56 and 2.64 cm with every episode safe and visible. The families act through the constraints.
- Safety held in 4,800 of 4,878 episodes. All 78 violations were wall clearance, 51 of them in closed corners, and 42 under a separation of 1 m or more. The grid certificate found no feasible placement at window entry in 987 episodes and ran out of budget in 102; those cells were flown anyway on the solver's fallback and are marked as such.

How much do a narrow corridor, a short radio range or a downward-looking camera limit what a drone swarm can see of a person walking past? The first version of this study answered that with static placements and a small flight check. This version flies everything. Each of the 62 constraint cells was run closed loop on 27 maps, and for each I report what the placement planner promised, what the drones' real positions delivered during the event window, and whether the flight stayed safe.

The answer changed. In the static study the largest effects came from distance, sensing and headcount. In flight, distance and headcount behave exactly as planned, while three other constraints that looked nearly free on paper become the largest losses: a narrow sensor cone, a short communication range and a large separation distance.

The experiments finished on September 19, 2026. All 4,878 episodes completed without error and were audited against their manifest before the tables below were generated.

![Dumbbell chart of seven constraint axes showing the planned-slot effect and the flown effect with confidence intervals. Sensor, communication and separation have flown effects far larger than their planned effects; standoff and swarm size match.](assets/posts/drone-swarm/plan-vs-flight.svg "Figure 1. The strongest level of each axis, paired against the shared baseline within map and start seed. Squares are the change in planned-slot CRLB, circles the change in flown event-window CRLB. Whiskers are 95% map-cluster bootstrap intervals. Baseline flown CRLB is 2.60 cm.")

[View full-size figure](assets/posts/drone-swarm/plan-vs-flight.svg)

[Source repository](https://github.com/junyeong-nero/constrained-swarm-observation) · [Full results tables](https://github.com/junyeong-nero/constrained-swarm-observation/blob/8b301ec/docs/RESULTS.md) · [Frozen protocol](https://github.com/junyeong-nero/constrained-swarm-observation/blob/8b301ec/experiments/dynamic_geometry/PROTOCOL.md) · [Figure data and provenance](assets/posts/drone-swarm/provenance.json)

## What replaced the static study

An earlier version of this post reported a static-placement study on twelve corridor and corner maps: single-axis sweeps of 1,404 placements, three constraint pairs, an estimator check and 108 flight episodes. That study is archived unchanged in the repository under `deprecated/static-study-2026-09/`, with its own results document and tests, and its numbers are not merged with anything here. Its baseline constraint levels, its metric and its grid certificate were kept; its maps and its unit of evidence were replaced.

Two things motivated the change. The 108 flight episodes showed that a placement's CRLB was a poor predictor of what the swarm realised in flight, so the static sweeps were measuring the wrong quantity for the original question. And twelve maps of two families could not say whether an effect depended on the walls or on the constraint. The dynamic study therefore flies every cell and uses nine generated families, including an open-space control.

## What is measured

The person's position is known to the placement planner throughout. The swarm's job is to keep good viewing geometry around it while it walks, under a set of constraints. This is not a search task, and there is no estimator in the loop.

Each drone supplies a bearing measurement with 1° angular noise. Observer positions are assumed known. Information weakens with the square of distance, and a bearing gives information perpendicular to its line of sight. I report the Cramér–Rao lower bound (CRLB) as the square root of the trace of the inverse Fisher information: an RMS bound on three-dimensional position error, in centimetres. **Lower is better.** It measures the quality of the viewing geometry under the assumed noise model, not the accuracy of a real tracker.

Two versions of the bound appear in every table:

- **Planned-slot CRLB.** At each replan, every 2 s, the placement solver returns one slot per drone. This is the bound those slots would give if the drones were on them.
- **Flown CRLB.** The bound at the drones' real positions, averaged over the finite samples of the event window. The evaluator counts sensor field of view, wall occlusion and drone–drone occlusion, and when the communication graph splits it uses the best-informed connected component rather than pooling information across the whole swarm.

The difference between the two, aggregated over placement instants where both are finite, is the realisation gap. Degenerate geometry has an infinite bound. Those samples are excluded from the mean and reported as a degeneracy fraction; a quality mean has to be read next to that fraction and the visible fraction, and unsafe episodes remain in every mean.

The solver's line-of-sight check traces walls only; the evaluator also counts drones as occluders. That is a modelling choice, disclosed rather than corrected.

## Nine families, one skeleton

Every map shares a skeleton. A person walks at 1.5 m/s for 20 s along a centreline, starting 6 m before the walled span, entering it at 4 s and leaving it at 16 s. That 4–16 s span is the event window of every map, and any turn is centred at 10 s. Walls are 6 m high and 0.5 m thick and extend 40 m behind the person, so the swarm always starts inside the corridor. The drones start in a box 2 m behind the person, sized to the cell's swarm and separation; a widely separated swarm in a narrow corridor is a long line and starts farther back, and that start transient can reach into the window.

![Nine top-view panels showing walls, the person's path with the event window highlighted, and the start box for each geometry family.](assets/posts/drone-swarm/geometry-families.svg "Figure 2. Variant 00 of each family. Black: walls. Coral: the 12 s event window of the person's walk. Soft coral: the baseline start box. Three random variants per family give 27 maps, generated from fixed seeds.")

[View full-size figure](assets/posts/drone-swarm/geometry-families.svg)

| Family | Turn | Walls | Width |
| --- | --- | --- | --- |
| open | none | none | – |
| one_wall | none | one side | 2.4–3.6 m |
| corridor | none | both | 2.4–3.6 m |
| taper | none | both | 3.6–4.4 → 2.0–2.6 m |
| corner_open | 90° | inner L | 2.4–3.6 m |
| corner_closed | 90° | both L | 2.4–3.6 m |
| curve | 40–60°, R 8–12 m | both | 2.4–3.6 m |
| curve_taper | same bend | both | 3.6–4.4 → 2.0–2.6 m |
| one_wall_curve | same bend | one side | 2.4–3.6 m |

One-walled families put their wall on a random side at half the listed width from the path. The 2.0 m tapered exits are deliberately tight for eight drones. The certificate, not a level change, records where placement becomes infeasible.

## 62 cells, 4,878 episodes

The baseline is eight drones, communication range 4 m, required separation 0.5 m, a free gimbal, standoff 2–4 m from the person, altitude −1 to +3 m relative to the person and wall clearance 0.5 m. One axis changes at a time:

| Axis | Levels tested |
| --- | --- |
| Communication range | 0.8, 1.2, 1.6, 2, 3, 4 m |
| Separation | 0.5, 0.75, 1, 1.25, 1.5 m |
| Sensor | gimbal, then fixed nadir half-angles 60°, 50°, 40°, 30°, 20° |
| Swarm size | 4, 6, 8, 10, 12 drones |
| Minimum standoff | 1, 1.5, 2, 2.5, 3, 3.5 m; maximum stays 4 m |
| Ceiling above person | +0.5, +1, +1.5, +2, +3 m |
| Corridor width multiplier | 0.7, 0.85, 1, 1.3, 1.7, on the five two-walled families only |

Three two-way grids add the cells not already in that list: sensor {40°, 30°, 20°} × standoff {1.5, 2.5, 3, 3.5 m}, sensor × ceiling {+0.5, +1, +2 m}, and communication {0.8, 1.2, 2 m} × separation {0.75, 1, 1.5 m}. Every cell runs on all 27 maps with three start seeds, which gives 62 × 27 × 3 minus the width cells on the four families without two walls: 4,878 episodes.

Each episode is a closed loop at 50 Hz for 20 s. Placement is re-solved every 2 s from a warm start (D-optimal objective, SLSQP), followed by Hungarian assignment, a local VisPlanner transit, a velocity controller and an ORCA safety filter with per-shape obstacle barriers. Before the flight, the grid certificate from the static study runs on the flight's own constraints with the person at the window entry: feasible, infeasible at the tested resolution (0.25 m, refined once to 0.125 m), or undecided when its budget is exhausted. The flight runs regardless of the verdict, and the verdict is recorded with the episode.

Effects are paired within map and start seed, cell minus baseline, averaged within a map, then over maps. The 95% intervals resample maps within each family, 10,000 draws, fixed seed. Start seeds are repeats, not independent maps. All of this was fixed in the protocol before the run. A first full run was stopped after 632 episodes when the separation cells could not sample their start box inside narrow corridors; the box rule was changed and the run restarted from scratch. That history is in the protocol file.

## Geometry alone changes nothing at baseline

Across the nine families, the baseline cell gives flown CRLB between 2.56 and 2.64 cm, with all 81 episodes safe and visible fractions at or above 0.997. The realisation gap is slightly negative everywhere, −0.02 to −0.12 cm: the drones' real positions are marginally better than the planned slots. I have not traced why.

| Family | Safe | Certified | Visible | Flown CRLB | Planned CRLB |
| --- | ---: | ---: | ---: | ---: | ---: |
| open | 9/9 | 9/9 | 1.000 | 2.611 cm | 2.618 cm |
| one_wall | 9/9 | 9/9 | 1.000 | 2.591 | 2.618 |
| corridor | 9/9 | 9/9 | 0.999 | 2.638 | 2.667 |
| taper | 9/9 | 9/9 | 1.000 | 2.583 | 2.660 |
| corner_open | 9/9 | 9/9 | 1.000 | 2.623 | 2.618 |
| corner_closed | 9/9 | 9/9 | 0.998 | 2.557 | 2.659 |
| curve | 9/9 | 9/9 | 0.997 | 2.593 | 2.666 |
| curve_taper | 9/9 | 9/9 | 1.000 | 2.561 | 2.668 |
| one_wall_curve | 9/9 | 9/9 | 1.000 | 2.602 | 2.618 |

So the walls themselves, at the baseline constraint levels, do not cost observation quality. Whatever the families do, they do through the constraints.

## Seven axes, planned and flown

![Seven dose-response panels, one per axis, with thin lines for each family, a bold line for the all-family flown mean and a dashed line for the all-family planned mean.](assets/posts/drone-swarm/dose-panels.svg "Figure 3. Flown and planned event-window CRLB against each constraint. Where bold and dashed lines coincide the plan is realised; where they part, the loss happens in flight. Vertical scales differ per panel; width uses the five two-walled families only.")

[View full-size figure](assets/posts/drone-swarm/dose-panels.svg)

### Standoff and swarm size: the plan is realised

Minimum standoff moves the bound almost linearly in distance, as the bearing model predicts, and the flown curve follows the planned one. From 2 m to 3.5 m the planned-slot CRLB rises by 2.06 cm and the flown CRLB by 1.83 cm [1.80, 1.86]. At 3.5 m the flown mean (4.42 cm) is a little better than the planned mean (4.70 cm). Standoff is a placement constraint, not a flight constraint, and the most likely explanation is that drones lagging their slots were closer to the person than the slots allowed. I have not confirmed that from the traces yet; it is listed under open checks below.

Swarm size follows the inverse-square-root shape from four to twelve drones: four drones cost +1.16 cm flown against +1.15 planned, twelve gain −0.46 against −0.49. Visibility stays at or above 0.998 across the axis. Within this range, crowding did not reverse the benefit of adding observers.

### Ceiling and width: small either way

The lowest ceiling, +0.5 m above the person, costs 0.35 cm planned and 0.14 cm [0.06, 0.23] flown. Like standoff, its flown mean sits below its planned mean, and the same unconfirmed explanation applies. Corridor width at ×0.7 costs 0.10 cm planned and 0.25 cm [0.09, 0.44] flown. The wider levels change almost nothing.

### Sensor cone: the loss is visibility

A fixed nadir sensor loses the person as soon as a drone leaves the cone, and in flight the drones are often off their slots. At 20° the visible fraction falls to 0.28 and every one of the 81 episodes contains degenerate samples, with 23% of the event window degenerate on average. The planned-slot CRLB rises by 1.98 cm; the flown CRLB, over the finite 77% of the window, rises by **9.06 cm** [8.75, 9.37], to 11.65 cm. The 30° level already shows it: visible fraction 0.73, degenerate samples in 52 of 81 episodes, +1.25 cm planned against +2.00 cm flown.

The loss is nearly the same in every family, from 9.86 cm in the taper to 13.09 cm with one wall. Walls are not what removes the person from the cone.

### Communication: the loss appears even in open space

At a communication range of 0.8 m, the required separation plus the slot margin (0.65 m) leaves the planner 0.15 m of play to chain its slots, and it does: the planned slots stay connected and barely notice (+0.26 cm). The flying swarm, off its slots, does not stay connected. It splits into components that cannot fuse their bearings, and the evaluator scores the best-informed component only. Flown CRLB rises by **6.92 cm** [6.68, 7.19], to 9.52 cm, with the visible fraction still at 0.998: every drone sees the person, but their measurements are not shared. Eighty of 81 episodes contain degenerate samples, 23% of the window on average.

This loss needs no walls. In the open control family it is 10.54 cm. At 1.2 m the flown increase is 0.70 cm with no degeneracy, and from 1.6 m upward it is below 0.25 cm.

![Two panels of flown CRLB by family. Separation: closed corner and corridor rise steeply while the other families stay flat. Communication: all families including open space rise at 0.8 m.](assets/posts/drone-swarm/family-dependence.svg "Figure 4. The same flown metric split by family. A: separation, with the closed corner and the corridor highlighted. B: communication, with the open control highlighted. Safe counts under each level are episodes without any hard-constraint violation over the full 20 s.")

[View full-size figure](assets/posts/drone-swarm/family-dependence.svg)

### Separation: mild in open space, severe between two walls

A required separation of 1.5 m costs 0.25 cm in planned-slot CRLB; the planner finds spread-out slots without trouble. In flight the all-family increase is **3.32 cm** [1.63, 5.78], and the wide interval is the point: the loss is 3.34 cm in open space, 3.29 cm with one wall, 10.05 cm in corridors and 18.84 cm in closed corners. Visibility stays at 0.97, so the loss is viewing geometry rather than occlusion. The likely mechanism is that eight drones 1.5 m apart between two walls form a line long enough that its tail cannot follow the person through the turn or the narrowing, so its bearings arrive from far behind. Safety also drops along this axis: 76 of 81 episodes at 1.25 m, 74 of 81 at 1.5 m, and in the closed corner 5 of 9 and 7 of 9.

## Constraint pairs

Every single-axis cell was certified feasible at window entry in every episode. Constraint pairs are where the certificate starts returning negatives, and where flying an infeasible cell shows what the solver's fallback placement does.

![Three grids of constraint pairs. Each cell shows the certification counts and the flown CRLB, coloured dark for fully certified, stone for grid-infeasible and soft coral for cells with undecided episodes.](assets/posts/drone-swarm/pair-grids.svg "Figure 5. Certification at window entry and flown CRLB for the three pairs. Cells marked with an asterisk were flown on the solver's fallback placement in at least some episodes; their CRLB is not the same kind of quality as in a certified cell. Undecided means the search budget was exhausted, not that the cell is infeasible.")

[View full-size figure](assets/posts/drone-swarm/pair-grids.svg)

A nadir cone of 30° or 20° with a minimum standoff of 3.5 m is infeasible on the tested grid in every episode, and so is any nadir cone under a ceiling of +1 m or lower. Communication shorter than the separation plus the slot margin leaves no neighbour that satisfies both distances, so every 0.8 m communication cell with a separation of 0.75 m or more is grid-infeasible, as is 1.2 m with 1.5 m. Those cells were still flown; the solver returns its least-violating placement and the swarm follows it. The grids report what happened, with the asterisk, and I do not quote those values as observation quality.

The pair that matters most for flight is communication × separation. At 2 m range and 1.5 m separation, a cell certified in 72 of 81 episodes, flown CRLB reaches **24.9 cm**, with a log interaction of +1.05 [+0.86, +1.25]: the two constraints multiply. At 1.2 m and 1.0 m, certified in 75 of 81 episodes, every episode is degenerate for the whole window; the placement exists on the grid, but the flying swarm never fuses. On the sensor grids, interactions on the log scale are mostly small or negative; a 20° cone with standoff 2.5 m has a log interaction of −0.39, meaning the two losses overlap rather than compound.

## Safety

Safety held in **4,800 of 4,878** episodes. Every one of the 78 violations was wall clearance: the minimum clearance slack ranged from −0.001 to −0.232 m (median −0.043 m), the violated time from 0.04 to 2.94 s (median 0.67 s), and 76 of the 78 first violations fell between 8 and 12 s, around the turn. Fifty-one were in closed corners, 23 in curved tapers, three in curves and one with one curved wall. Forty-two occurred under a separation of 1 m or more and 26 under a nadir cone of 40° or narrower; the worst single cell was communication 0.8 m × separation 1.5 m with 8 unsafe episodes. No cell was re-run and no episode was relabelled; all 78 stay in every mean above.

## What cannot be claimed

- A negative certificate is a statement at the tested grid resolution, not a proof that no placement exists in continuous space. Undecided is never counted as infeasible.
- Flown CRLB is a mean over finite samples. It has to be read next to the degeneracy and visible fractions of the same cell; the 11.65 cm at nadir 20° describes 77% of the window, and the infinite bound in the remaining 23% is not an acceptable error.
- The study does not decompose why a drone stopped contributing (out of cone, behind a wall, behind another drone, or cut off from the fused component). The explanations above for the sensor, communication and separation losses are interpretations consistent with the visibility and degeneracy numbers, not measured attributions.
- No safety guarantee, no estimator accuracy under motion, and no generality beyond these nine generated families are claimed. The transit and placement components are local implementations of published objectives, not the authors' systems, and nothing here ranks algorithms.

## What comes next

The remaining work is post-hoc analysis of the stored traces, not new experiments. The traces record, for each drone at each step, whether it was in the cone, occluded by a wall, occluded by another drone, or outside the fused component, so the loss can be decomposed per cell and the interpretations above replaced with counts. Two checks are pending: whether drones in the ceiling and standoff cells were in fact outside the placement limits during the window, which would explain their flown means beating their planned means, and where along the corner the 78 clearance violations occurred. After that comes a paper built around the three constraints where plan and flight part, with standoff and swarm size as the controls where they do not.

## Data, figures and reproduction

All five figures are rendered from the archived aggregates of the run. The renderer verifies the hash of every input, reads the blog's style tokens, and does not run an experiment or alter a record. The 5 MB per-episode file and the manifest remain in the source repository and are referenced by hash in the provenance file.

- [Figure source and reproduction notes](assets/posts/drone-swarm/README.md)
- [Figure renderer](assets/posts/drone-swarm/render_figures.py)
- [Source hashes and provenance](assets/posts/drone-swarm/provenance.json)
- [Per-cell effects and per-family aggregates](assets/posts/drone-swarm/data/effects.json), [two-way interactions](assets/posts/drone-swarm/data/interactions.json), [the 27 maps](assets/posts/drone-swarm/data/maps.json)
- [Frozen protocol](assets/posts/drone-swarm/data/PROTOCOL.md)
- [Full results tables in the repository](https://github.com/junyeong-nero/constrained-swarm-observation/blob/8b301ec/docs/RESULTS.md)
- [The archived static study](https://github.com/junyeong-nero/constrained-swarm-observation/blob/8b301ec/deprecated/static-study-2026-09/README.md)
