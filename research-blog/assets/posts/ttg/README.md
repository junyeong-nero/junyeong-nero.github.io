# Observation-zone experiment assets

All assets in this directory describe the September 16, 2026 experiment:
21 airborne-motion profiles, 630 training-source runs and 210 independently
seeded test runs, with 24 tuning fits and 12 final fits.

| File | Source and scope |
| --- | --- |
| `comparison.json` | `out/airspace/experiments/comparison.json`: all four families, three seeds, common and all-eligible masks, profile/band errors and tracking diagnostics |
| `protocol.json` | Frozen data split, candidate configurations and budgets |
| `selection.json` | Every tuning result and the four selected configurations |
| `runtime.json` | Isolated Python CPU model-only streaming timings |
| `data-manifest.json` | Generation settings, source hashes and Parquet hashes |
| `aligned-scores.json` | Exact copy of `out/airspace/model/aligned_scores.json`: fixed seed-0 GRU, baselines and complete estimator timings |
| `alternative-models.svg` | `scripts/plot_experiments.py`, using comparison and selection JSON |
| `model-comparison.svg` | `scripts/plot_scores.py`, using aligned scores |
| `inference-performance.svg` | Same aligned report, full estimator timing and process RSS |
| `demo.gif`, `demo.mp4` | New balloon shear, hover/resume and outside figure-eight viewer replay |

From the simulator checkout, with this website next to it:

```bash
uv run scripts/run_experiments.py
uv run scripts/publish_experiment.py
uv run scripts/export_cpp.py
make -C cpp test
uv run scripts/evaluate_ttg.py
uv run scripts/benchmark_alternatives.py
uv run scripts/plot_experiments.py
uv run scripts/plot_scores.py \
  --theme-css ../junyeong-nero.github.io/research-blog/style.css \
  --output ../junyeong-nero.github.io/research-blog/assets/posts/ttg/model-comparison.svg \
  --performance-output ../junyeong-nero.github.io/research-blog/assets/posts/ttg/inference-performance.svg
```

Copy the listed JSONs, alternative SVG and regenerated demo into this directory
and update the article tables from the same records. Do not mix three-seed
learned-model metrics with the fixed seed-0 deployment figure. The all-eligible
comparison has 25,598 timestamps; the baseline-common subset has 15,237.

Alternative model-only timings exclude filtering and normalization. The aligned
report's GRU timing includes both. Whole-process RSS includes Python, libraries
and loaded replay data; it is not model weights, per-track memory or C++ timing.
The two baseline figures use the website CSS color tokens; the four-family SVG
uses the same warm background with distinct model colors.
