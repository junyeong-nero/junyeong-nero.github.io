---
name: paper-review-ingest
description: Ingest arXiv papers into the paper-review archive. Use when the user provides an arXiv URL/ID and asks to add it to /paper-review, generate a paper review page entry, update search/tag metadata, or capture paper figures/tables for reuse in Markdown reviews.
license: MIT
compatibility: opencode
---

# Paper Review Ingest

## Target Repository

Repo root (`REPO_ROOT`):
```
 /Users/junyeong-nero/workspace/junyeong-nero.github.io
```

This skill writes to that repo even when invoked from another
working directory (e.g. via the global opencode skill). Always
operate on `REPO_ROOT` with absolute paths — do not assume `cwd`
is the repo root. `cd` to `REPO_ROOT` first, or prefix every repo
path with `REPO_ROOT`.

Archive paths relative to root:
```
paper-review/data/reviews.json
paper-review/reviews/<slug>.md
paper-review/assets/<slug>/figures/figure-01.png
paper-review/assets/<slug>/tables/table-01.png
```

Scripts live at `REPO_ROOT/.codex/skills/paper-review-ingest/scripts/`:
- `arxiv_id.py` — Parse arXiv URL/ID
- `capture_arxiv_figures.py` — Extract figures from arXiv TeX source (`\includegraphics`) and render tables from TeX via `pdflatex` + `pdftoppm`
- `update_reviews_index.py` — Upsert entry into reviews.json

Set `REPO_ROOT=/Users/junyeong-nero/workspace/junyeong-nero.github.io`
and invoke scripts as `$REPO_ROOT/.codex/skills/paper-review-ingest/scripts/<name>.py`.

## Workflow

1. **Parse the arXiv ID** — Use `python3 $REPO_ROOT/.codex/skills/paper-review-ingest/scripts/arxiv_id.py "<url-or-id>"`. Preserve the raw version suffix for reporting; use the versionless canonical ID for duplicate detection in reviews.json.

2. **Fetch paper metadata and text** — Prefer the arXiv Atom API for title, authors, abstract, and published date. Download PDF from `https://arxiv.org/pdf/<canonical-id>.pdf`. Use `pdftotext -layout` when available. If network or text extraction fails, ask the user for a PDF, abstract, or pasted text.

3. **Generate the Markdown review** — Save to `$REPO_ROOT/paper-review/reviews/<slug>.md`. Section order: TL;DR, Background, Problem, Method, Experiments, Critical Analysis, Implementation Notes, Captured Figures and Tables. Include LaTeX equations where useful. Keep figure/table image paths relative to the review file, e.g. `../assets/<slug>/figures/figure-01.png`.

4. **Capture figures and tables** — Use `python3 $REPO_ROOT/.codex/skills/paper-review-ingest/scripts/capture_arxiv_figures.py --arxiv-id <canonical-id> --out-dir $REPO_ROOT/paper-review/assets/<slug> --slug <slug>`. This downloads the arXiv TeX source (tar.gz from `https://arxiv.org/e-print/<id>`), extracts figure files (PDF/PNG/EPS) from `\includegraphics` in `.tex` files, converts them to PNG, and parses `\caption` from the `.tex` files for accurate captions. For tables, it finds `\begin{table}` environments, compiles them with `pdflatex` and converts to PNG via `pdftoppm`. Default limit: 3 figures and 3 tables. Capture failure must not block the review or JSON index update.

5. **Update the JSON index** — Create a JSON entry matching the shape below, write it to a temp file, then run `python3 $REPO_ROOT/.codex/skills/paper-review-ingest/scripts/update_reviews_index.py --index $REPO_ROOT/paper-review/data/reviews.json --entry <tmp-entry.json>`. Paths are relative to `paper-review/`, not the repo root. Tags are lowercase and sorted.

## Taxonomy (v2 — category + tags)

Every entry needs exactly one `category` plus at most 5 `tags`.

Categories (pick the paper's primary contribution, not its evaluation target):

| Category | Covers |
|---|---|
| `web-agents` | Web / GUI / computer-use agent methods (observation pruning, planning, world models, baselines) |
| `evaluation` | Benchmarks, eval methodology, reward/judge models (agent or LLM) |
| `rl-posttraining` | RL, RLVR, RLHF, GRPO variants, self-play / self-evolution, synthetic training data |
| `reasoning` | Test-time compute, CoT methods, recursive / efficient reasoning |
| `memory` | Agent memory, continual learning, long-context use |
| `safety` | Safety, security, oversight, incidents (prompt injection, CoT monitoring, model theft) |
| `architecture` | Model architecture, optimizers, efficient inference, document/OCR models |
| `interaction` | Human-agent interaction, HCI, copilots, debugging / research tools |

Tag rules:

- Lowercase, hyphenated, sorted, max 5 per paper.
- Reuse an existing tag from `reviews.json` when one fits; only coin a new tag if no existing tag covers the concept.
- Never use bare `llm` as a tag. Prefer the canonical forms below.

Canonical tags (left) and banned variants (right, normalize to canonical):

```
web-agents ← web-agent
llm-agents ← llm-agent, agentic
llm-judge ← llm-as-a-judge, llm-judges, llm-judge, judge-model, critic-models
reward-model ← reward-models
process-reward-model ← process-reward-models
vision-language ← vision-language-model(s), multimodal(-llm, -vlm), vlm
agent-evaluation ← agent-benchmark
long-horizon-agents ← long-horizon
computer-use ← gui-agent, ui-agents, ui-automation, web-automation
math-reasoning ← mathematical-reasoning
retrieval-augmented-generation ← rag
knowledge-distillation ← distillation
zero-data ← data-free
agent-memory ← ai-memory, memory-retrieval, memory-augmented-agents
world-models ← world-model
observation-reduction ← observation-retrieval
agent-security ← web-agent-security, model-security
human-agent-interaction ← hci, human-agent-collaboration, human-computer-interaction, interactive-systems, co-agency, agent-interfaces, mixed-initiative, user-agency
generative-writing ← writing
synthetic-data ← data-synthesis, procedural-generation, repository-generation
test-time-compute ← inference-scaling
sparse-attention ← sliding-window-attention
context-management ← context-pruning
diagnostic-evaluation ← error-localization, trajectory-auditing
evaluation ← test-based-evaluation, llm-evaluation
document-ai ← ocr
web-navigation ← open-web
rubric-rewards ← rubric-verification, rubrics
prompt-engineering ← persona-prompting, prompting-science
```

The filter UI shows categories plus tags used in 3+ reviews; rarer tags remain searchable but don't get a chip. Prefer frequent tags so papers stay jointly filterable.

6. **Verify** — Run `node --test paper-review/script.test.js` from `$REPO_ROOT`.

## JSON Entry Shape

```json
{
  "id": "2403.01469",
  "slug": "kormedmcqa",
  "title": "Paper title",
  "authors": ["Author One", "Author Two"],
  "publishedAt": "2024-03-03",
  "reviewedAt": "2026-07-01",
  "summary": "One sentence summary.",
  "category": "evaluation",
  "tags": ["benchmark", "medical-llm"],
  "arxivUrl": "https://arxiv.org/abs/2403.01469",
  "pdfUrl": "https://arxiv.org/pdf/2403.01469.pdf",
  "reviewPath": "reviews/kormedmcqa.md",
  "assets": {
    "figures": [
      {
        "path": "assets/kormedmcqa/figures/figure-01.png",
        "caption": "Figure 1. Dataset construction pipeline.",
        "page": 3
      }
    ],
    "tables": []
  }
}
```

For non-arxiv papers, omit `arxivUrl`/`pdfUrl` and use `sourceUrl` instead.

## Failure Handling

- If `reviews.json` is missing, create it with `version`, `updatedAt`, and an empty `reviews` list.
- If `reviews.json` is invalid JSON, stop and report the parse error before writing.
- If arXiv metadata fetch fails, continue only with user-provided metadata.
- If figure/table capture fails, keep `assets.figures` and `assets.tables` as empty arrays and report why.
- Never duplicate a paper with the same canonical arXiv ID.
