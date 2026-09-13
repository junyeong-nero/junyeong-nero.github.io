# TTG evaluation figures

`aligned-scores.json` is an exact copy of the simulator's
`out/model/aligned_scores.json`, including the Python streaming benchmark.
`model-comparison.svg` and `inference-performance.svg` read this same record.
Their palette comes from `research-blog/style.css`: warm canvas, slate/charcoal
baselines, coral GRU bars, and dark text for readable annotations.

From the simulator repository root, with the website checkout next to it:

```bash
# Refresh the snapshot after an evaluation.
cp out/model/aligned_scores.json ../junyeong-nero.github.io/research-blog/assets/posts/ttg/aligned-scores.json
uv run python scripts/plot_scores.py \
  --scores ../junyeong-nero.github.io/research-blog/assets/posts/ttg/aligned-scores.json \
  --theme-css ../junyeong-nero.github.io/research-blog/style.css \
  --output ../junyeong-nero.github.io/research-blog/assets/posts/ttg/model-comparison.svg \
  --performance-output ../junyeong-nero.github.io/research-blog/assets/posts/ttg/inference-performance.svg
```

The timing figure reports Python CPU update latency and whole-process peak RSS,
not C++ deployment cost. Its bars include complete histories, including warmup
and undefined predictions; accuracy uses the shared scoring subset. Do not
interpret process RSS as weights or per-track state. Update post tables and
captions when replacing the evaluation snapshot.
