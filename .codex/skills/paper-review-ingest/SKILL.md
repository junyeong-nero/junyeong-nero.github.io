---
name: paper-review-ingest
description: Ingest arXiv papers into the `junyeong-nero.github.io` paper-review archive. Use when the user provides an arXiv URL/ID and asks to add it to `/paper-review`, generate a paper review page entry, update search/tag metadata, or capture paper figures/tables for reuse in Markdown reviews.
---

# Paper Review Ingest

## Target Repository

Default repo root:

```text
/Users/junyeong-nero/workspace/junyeong-nero.github.io
```

Archive paths are relative to that root:

```text
paper-review/data/reviews.json
paper-review/reviews/<slug>.md
paper-review/assets/<slug>/figures/figure-01.png
paper-review/assets/<slug>/tables/table-01.png
```

This skill is stored repo-locally at:

```text
.codex/skills/paper-review-ingest
```

## Workflow

1. Parse the arXiv ID.
- Use `.codex/skills/paper-review-ingest/scripts/arxiv_id.py`.
- Preserve the raw version suffix for reporting.
- Use the versionless canonical ID for duplicate detection in `reviews.json`.

2. Fetch paper metadata and text.
- Prefer the arXiv Atom API for title, authors, abstract, and published date.
- Download the PDF from `https://arxiv.org/pdf/<canonical-id>.pdf`.
- Use `pdftotext -layout` when available.
- If network or text extraction fails, ask the user for a PDF, abstract, or pasted text.

3. Generate the Markdown review.
- Save to `paper-review/reviews/<slug>.md`.
- Use this section order: TL;DR, Background, Problem, Method, Experiments, Critical Analysis, Implementation Notes, Captured Figures and Tables.
- Include LaTeX equations where useful.
- Keep figure/table image paths relative to the review file, for example `../assets/<slug>/figures/figure-01.png`.

4. Capture figures and tables.
- Use `.codex/skills/paper-review-ingest/scripts/capture_arxiv_figures.py`.
- Default limit: 3 figures and 3 tables.
- The script downloads the arXiv e-print source tarball, extracts figures from `\includegraphics` in `.tex` files, and compiles `\begin{table}` environments with `pdflatex`.
- Captions are extracted from `\caption{}` in the TeX source.
- `pdflatex` must be available and `pdftoppm` is used to convert compiled table PDFs to PNG.
- Capture failure must not block the review or JSON index update.

5. Update the JSON index.
- Create a JSON entry with keys matching `paper-review/data/reviews.json`.
- Use `.codex/skills/paper-review-ingest/scripts/update_reviews_index.py` to upsert by canonical arXiv ID.
- Store paths relative to `paper-review/`, not the repository root.
- Keep tags lowercase and sorted.

6. Verify before reporting completion.
- Run `node --test paper-review/script.test.js` from the repo root.
- Run `python3 /private/tmp/paper_review_ingest_tests.py` if the temporary helper tests exist.
- Run the skill validator:

```bash
python3 /Users/junyeong-nero/.codex/skills/.system/skill-creator/scripts/quick_validate.py .codex/skills/paper-review-ingest
```

## Standard Commands

Parse an ID:

```bash
python3 .codex/skills/paper-review-ingest/scripts/arxiv_id.py "https://arxiv.org/abs/2403.01469v2"
```

Fetch metadata:

```bash
curl -fsSL "https://export.arxiv.org/api/query?id_list=2403.01469" > /private/tmp/arxiv_2403.01469.xml
```

Download PDF:

```bash
curl -fL "https://arxiv.org/pdf/2403.01469.pdf" -o /private/tmp/arxiv_2403.01469.pdf
```

Extract text:

```bash
pdftotext -layout /private/tmp/arxiv_2403.01469.pdf /private/tmp/arxiv_2403.01469.txt
```

Capture candidate figures and tables:

```bash
python3 .codex/skills/paper-review-ingest/scripts/capture_arxiv_figures.py --arxiv-id 2403.01469 --out-dir /Users/junyeong-nero/workspace/junyeong-nero.github.io/paper-review/assets/kormedmcqa --slug kormedmcqa --manifest-out /private/tmp/kormedmcqa_assets.json
```

Update index:

```bash
python3 .codex/skills/paper-review-ingest/scripts/update_reviews_index.py --index /Users/junyeong-nero/workspace/junyeong-nero.github.io/paper-review/data/reviews.json --entry /private/tmp/kormedmcqa_entry.json
```

## JSON Entry Shape

```json
{
  "id": "2403.01469",
  "slug": "kormedmcqa",
  "title": "Paper title",
  "authors": ["Author One", "Author Two"],
  "publishedAt": "2024-03-03",
  "reviewedAt": "2026-06-04",
  "summary": "One sentence summary.",
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

## Failure Handling

- If `reviews.json` is missing, create it with `version`, `updatedAt`, and an empty `reviews` list.
- If `reviews.json` is invalid JSON, stop and report the parse error before writing.
- If arXiv metadata fetch fails, continue only with user-provided metadata.
- If figure/table capture fails, keep `assets.figures` and `assets.tables` as empty arrays and report why.
- Never duplicate a paper with the same canonical arXiv ID.
