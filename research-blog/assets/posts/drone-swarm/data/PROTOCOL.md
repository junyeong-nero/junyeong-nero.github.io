# Dynamic constraint study on nine geometry families — frozen protocol

Status: **frozen with the full run of 2026-09-18.** A first full run was stopped after 632
episodes when the separation ≥ 1 m cells could not sample their start box inside narrow
corridors; the box rule below replaced the fixed 4 m box and the run restarted from scratch.
From then on this file, the runner and the generator are frozen; their SHA-256 is written into `runs/dynamic_geometry/full/manifest.json`
and the runner refuses to continue if any of them changes.

## Question

How much observation quality does a swarm actually realise while flying through confined
geometry, as a function of one constraint at a time and of three constraint pairs, and how far
is that from what its own placement planned?

## Maps

`generate.py`, seeds 8300–8326, nine families × three variants = 27 maps. All share one
skeleton: a person walks at 1.5 m/s for 20 s along a centreline, is at s = −6 m at t = 0,
enters the walled span (s = 0–18 m) at t = 4 s and leaves it at t = 16 s. That 4–16 s span is
the **event window** of every map; a turn, where there is one, is centred at t = 10 s. Walls
are 6 m high, 0.5 m thick, run from s = −40 to 20 m and are `SegmentWall` polylines (0.5 m
chord along arcs); a corner's L is two shapes, one per leg. Drones start in a box that
begins 2 m behind the person, 1–3 m up, laterally inside the walls (±2 m, or half-width
minus 0.6 m on a walled side), and long enough along the corridor for the cell's swarm at
its start spacing (1.25 × spacing pitch, 1.5 × packed length, ≥ 4 m; 7 m at baseline, up to
26 m for separation 1.5 m in one-row corridors). A long box is a property of that cell: a
widely separated swarm in a narrow corridor is a long line and starts farther back, and its
start transient can reach into the event window. The box depth is recorded with every
episode.

| family | turn | walls | width |
|---|---|---|---|
| open | – | none | – |
| one_wall | – | one side (random) | 2.4–3.6 m from the path centre × 2 |
| corridor | – | both | 2.4–3.6 m |
| taper | – | both | 3.6–4.4 m → 2.0–2.6 m linearly over the span |
| corner_open | 90°, R ≈ w/2 ± 0.3 m (≥ 1 m) | inner L only | 2.4–3.6 m |
| corner_closed | same | inner and outer L | 2.4–3.6 m |
| curve | 40–60°, R 8–12 m | both, offset polylines | 2.4–3.6 m |
| curve_taper | same | both | 3.6–4.4 m → 2.0–2.6 m |
| one_wall_curve | same | one side (random) | 2.4–3.6 m |

Every map passed: person path ≥ 0.3 m from every wall and inside the workspace; with two
walls the path stays between them throughout the window; the baseline start box is free
and every cell's start box samples its swarm. The 2.0 m
tapered exits are deliberately tight for eight drones; the certificate, not a level change,
records where placement becomes infeasible.

## Cells (62)

Baseline: 8 drones, communication 4 m, separation 0.5 m (hard centre distance; drone radius
0.15 m, downwash ratio 3, slot margin 0.15 m), free gimbal, standoff 2–4 m, altitude −1 to
+3 m relative to the person, wall clearance 0.5 m, map width ×1.

| axis | levels (baseline excluded) |
|---|---|
| communication range | 0.8, 1.2, 1.6, 2, 3 m |
| separation | 0.75, 1, 1.25, 1.5 m |
| sensor | nadir half-angle 60, 50, 40, 30, 20° (baseline: free gimbal) |
| swarm size | 4, 6, 10, 12 |
| minimum standoff | 1, 1.5, 2.5, 3, 3.5 m (maximum 4 m fixed) |
| ceiling above person | +0.5, +1, +1.5, +2 m (floor −1 m fixed) |
| width multiplier | ×0.7, ×0.85, ×1.3, ×1.7 — two-walled families only (corridor, taper, corner_closed, curve, curve_taper) |

Two-way grids, each including only the cells not already in the single-axis list:
sensor {40, 30, 20°} × standoff {1.5, 2.5, 3, 3.5 m}; sensor {40, 30, 20°} × ceiling
{+0.5, +1, +2 m}; communication {0.8, 1.2, 2 m} × separation {0.75, 1, 1.5 m}.

Start seeds 0–2 per map and cell. Episodes: 62 cells × 27 maps × 3 seeds minus the width
cells on the four families without two walls = **4,878**. Pilot: baseline only, 81 episodes.

## Episode

`run.py`: closed loop at 50 Hz for 20 s; placement re-solved every 2 s from a warm start
(D-optimal, SLSQP), Hungarian assignment, local VisPlanner transit, velocity controller, ORCA
safety filter with per-shape obstacle barriers. Before the flight, the grid certificate
(0.25 m, refined once to 0.125 m, 200,000 expansions) is run on the flight's own constraints
object with the person at the window entry (t = 4 s): feasible / infeasible at resolution /
undecided (budget exhausted). The flight runs regardless of the verdict.

Recorded per episode: certificate; safety (no hard violation of separation, wall clearance,
motion limits or workspace over the whole 20 s; first violation time, violated time, minimum
clearance slack, minimum separation); event-window visible fraction, degeneracy fraction and
mean CRLB over finite samples of the actual positions; per placement instant the CRLB,
visibility and degeneracy of the planned slots and of the actual positions, plus the mean
tracking error; the full state trace.

## Analysis (fixed before the run)

- Unit of replication is the map. Effects are paired within (map, seed): cell − baseline on
  the event-window actual CRLB and on the slot CRLB, averaged within a map, then averaged
  over maps. 95% intervals: stratified map bootstrap within each family, 10,000 resamples,
  seed 8103. Start seeds are repeats, not independent maps.
- Realisation gap = actual − slot CRLB over placement instants in the window where both are
  nondegenerate with a finite CRLB; slot CRLB is reported over the same instants.
- Quality means are conditional on finite samples and are always shown next to the
  degeneracy fraction, visible fraction and the certificate verdict of that cell.
- Two-way grids: additive and log interaction as in the archived study, over quadruples
  where all four cells have finite means.
- Unsafe episodes stay in every mean; nothing is relabelled or re-run.

## Not claimed

Safe flight, estimator accuracy under motion, generality beyond these generator families,
continuum infeasibility from a negative certificate, or causal attribution of the loss to
cone exit, occlusion or lag (that decomposition is post-hoc work on the traces, if done).
