# Swarm constraint study: blog figures

This directory accompanies the September 18, 2026 Research Blog post
drone-swarm-constraint-study. Experiments finished September 17.

The data files are byte-for-byte copies of the simulator's archived results.
[provenance.json](provenance.json) records original paths, source commit and SHA-256 hashes.
The original sensor run is retained for provenance and the estimator check;
only constraint_dose_fov is used for sensor-axis curves.

## Regenerate

The renderer needs Python 3.11+, NumPy and Matplotlib. From the simulator checkout
with the website beside it, run:

    uv run python ../junyeong-nero.github.io/research-blog/assets/posts/drone-swarm/render_figures.py

The script verifies every input hash, reads the blog's existing style.css tokens,
and writes six SVGs here. It does not run an experiment, change input records or
rewrite the simulator's archives. SVG metadata omits wall-clock generation dates.

| Figure | Input and meaning |
| --- | --- |
| constraint-effects.svg | Archived effects at seven selected restrictive levels; paired means and 95% map-cluster intervals |
| main-dose-response.svg | Stored raw placements for standoff, corrected FOV and count; per-map and per-family absolute CRLB |
| secondary-dose-response.svg | Stored raw placements for communication, separation, ceiling and width; each panel has its own vertical scale |
| interaction-feasibility.svg | Original certified, grid-infeasible and undecided counts; post-hoc labels do not replace original outcomes |
| estimator-check.svg | Every archived estimator record, including the superseded sensor placements, evaluated with the matching observation model |
| dynamic-realisation.svg | Archived condition summaries and static effects; unsafe episodes remain, finite CRLB averages are shown alongside degeneracy |

## Interpretation

- All one-factor cells are certified feasible and nondegenerate; the archived
  total includes repeated baselines and superseded sensor records.
- Solver seeds are not independent environments. Intervals resample maps.
- An exhausted search is undecided. Grid-infeasible is not a continuum proof.
- Dynamic actual CRLB averages finite samples within episode; slot CRLB pools
  valid actual/slot placement instants. Subtracting these bars does not recover
  the separately aggregated realisation gap.
- Static estimator agreement is not real-sensor or closed-loop tracking validation.
- The 104/108 safe count and three standoff episodes with degeneracy remain failures
  or losses in the final record; presentation changes do not relabel them.

## Theme

Colors are read from research-blog/style.css: warm canvas, coral accent, soft coral,
charcoal, secondary text and hairline rules. Map families also differ by marker
and line style. Certification cells spell out F / I / U rather than relying on color
alone. SVG text is retained as text.
