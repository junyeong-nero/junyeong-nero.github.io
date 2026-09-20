# Swarm constraint study: blog figures

This directory accompanies the Research Blog post drone-swarm-constraint-study, revised
September 20, 2026 for the dynamic geometry study. The experiments finished September 19.

The data files are byte-for-byte copies of the simulator's archived aggregates under
`results/dynamic_geometry/`. [provenance.json](provenance.json) records original paths,
source commit and SHA-256 hashes, plus the hash of the 5 MB per-episode file that is
not copied here. The assets of the earlier static-study version of the post were removed
with that version; the static study itself is archived in the source repository under
`deprecated/static-study-2026-09/`.

## Regenerate

The renderer needs Python 3.11+, NumPy and Matplotlib. From the simulator checkout
with the website beside it, run:

    uv run python ../junyeong-nero.github.io/research-blog/assets/posts/drone-swarm/render_figures.py

The script verifies every input hash, reads the blog's existing style.css tokens,
and writes five SVGs here. It does not run an experiment, change input records or
rewrite the simulator's archives. SVG metadata omits wall-clock generation dates.

| Figure | Input and meaning |
| --- | --- |
| plan-vs-flight.svg | effects.json: planned-slot and flown paired effects at the strongest level of each axis, 95% map-cluster intervals |
| geometry-families.svg | maps.json: walls, person path, event window and baseline start box of variant 00 of each family |
| dose-panels.svg | effects.json: flown CRLB per family and pooled, planned CRLB pooled, for all seven axes |
| family-dependence.svg | effects.json: flown CRLB per family for the separation and communication axes, with safe counts |
| pair-grids.svg | effects.json: certification counts at window entry and flown CRLB for the three constraint pairs |

interactions.json supplies the log and additive interaction terms quoted in the text.

## Interpretation

- The unit of replication is the map. Start seeds are repeats, not independent maps.
- Flown CRLB is a mean over finite event-window samples and is always shown next to
  the visible fraction and degeneracy of the same cell in the text.
- An exhausted certificate is undecided. Grid-infeasible is not a continuum proof.
- Cells with any uncertified episode were flown on the solver's fallback placement;
  their CRLB is marked with an asterisk and not quoted as observation quality.
- The 78 unsafe episodes remain in every mean; presentation changes do not relabel them.

## Theme

Colors are read from research-blog/style.css: warm canvas, coral accent, soft coral,
charcoal, secondary and muted text and hairline rules. Families are drawn as thin muted
lines and only direct-labelled where the text singles them out, so no nine-hue palette is
needed. Certification cells spell out F / I / U rather than relying on color alone.
SVG text is retained as text.
