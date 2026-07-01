---
name: paper-review-ingest
description: Ingest arXiv papers into the paper-review archive. Use when the user provides an arXiv URL/ID and asks to add it to /paper-review, generate a paper review page entry, update search/tag metadata, or capture paper figures/tables for reuse in Markdown reviews.
license: MIT
compatibility: opencode
---

# Paper Review Ingest

## Target Repository

Repo root:
```
/Users/junyeong-nero/workspace/junyeong-nero.github.io
```

Archive paths relative to root:
```
paper-review/data/reviews.json
paper-review/reviews/<slug>.md
paper-review/assets/<slug>/figures/figure-01.png
paper-review/assets/<slug>/tables/table-01.png
```

Scripts are at `.codex/skills/paper-review-ingest/scripts/`:
- `arxiv_id.py` — Parse arXiv URL/ID
- `capture_pdf_regions.py` — Capture figure/table pages as PNG
- `update_reviews_index.py` — Upsert entry into reviews.json

## Workflow

1. **Parse the arXiv ID** — Use `python3 .codex/skills/paper-review-ingest/scripts/arxiv_id.py "<url-or-id>"`. Preserve the raw version suffix for reporting; use the versionless canonical ID for duplicate detection in reviews.json.

2. **Fetch paper metadata and text** — Prefer the arXiv Atom API for title, authors, abstract, and published date. Download PDF from `https://arxiv.org/pdf/<canonical-id>.pdf`. Use `pdftotext -layout` when available. If network or text extraction fails, ask the user for a PDF, abstract, or pasted text.

3. **Generate the Markdown review** — Save to `paper-review/reviews/<slug>.md`. Section order: TL;DR, Background, Problem, Method, Experiments, Critical Analysis, Implementation Notes, Captured Figures and Tables. Include LaTeX equations where useful. Keep figure/table image paths relative to the review file, e.g. `../assets/<slug>/figures/figure-01.png`.

4. **Capture figures and tables** — Use `python3 .codex/skills/paper-review-ingest/scripts/capture_pdf_regions.py --pdf <pdf> --text <text> --out-dir paper-review/assets/<slug> --slug <slug>`. Default limit: 3 figures and 3 tables. Capture failure must not block the review or JSON index update.

5. **Update the JSON index** — Create a JSON entry matching the shape below, write it to a temp file, then run `python3 .codex/skills/paper-review-ingest/scripts/update_reviews_index.py --index paper-review/data/reviews.json --entry <tmp-entry.json>`. Paths are relative to `paper-review/`, not the repo root. Tags are lowercase and sorted.

6. **Verify** — Run `node --test paper-review/script.test.js` from the repo root.

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
