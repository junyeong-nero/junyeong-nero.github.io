#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
from pathlib import Path
from typing import Any


CAPTION_PATTERN = re.compile(
    r"\b(?P<label>fig(?:ure)?|table)\.?\s*(?P<number>\d+)\s*[:.]\s*(?P<caption>[^\n]+)",
    re.IGNORECASE,
)


def extract_caption_candidates(text: str) -> list[dict[str, Any]]:
    candidates: list[dict[str, Any]] = []
    pages = text.split("\f") if text else []

    for page_index, page_text in enumerate(pages or [text], start=1):
        for match in CAPTION_PATTERN.finditer(page_text):
            label = match.group("label").lower()
            kind = "figure" if label.startswith("fig") else "table"
            number = match.group("number")
            caption = f"{'Figure' if kind == 'figure' else 'Table'} {number}. {match.group('caption').strip()}"
            candidates.append(
                {
                    "kind": kind,
                    "number": number,
                    "caption": caption,
                    "page": page_index,
                }
            )

    return candidates


def limit_candidates(candidates: list[dict[str, Any]], limit_figures: int, limit_tables: int) -> list[dict[str, Any]]:
    selected: list[dict[str, Any]] = []
    counts = {"figure": 0, "table": 0}

    for candidate in candidates:
        kind = candidate["kind"]
        limit = limit_figures if kind == "figure" else limit_tables
        if counts[kind] >= limit:
            continue
        counts[kind] += 1
        selected.append(candidate)

    return selected


def render_page(pdf_path: Path, page: int, output_path: Path, dpi: int = 180) -> bool:
    pdftoppm = shutil.which("pdftoppm")
    if not pdftoppm:
        return False

    output_path.parent.mkdir(parents=True, exist_ok=True)
    prefix = output_path.with_suffix("")
    command = [
        pdftoppm,
        "-png",
        "-singlefile",
        "-f",
        str(page),
        "-l",
        str(page),
        "-r",
        str(dpi),
        str(pdf_path),
        str(prefix),
    ]
    subprocess.run(command, check=True)

    rendered = prefix.with_suffix(".png")
    if rendered != output_path and rendered.exists():
        rendered.replace(output_path)
    return output_path.exists()


def capture_candidates(
    pdf_path: Path,
    text: str,
    out_dir: Path,
    slug: str,
    limit_figures: int = 3,
    limit_tables: int = 3,
) -> dict[str, Any]:
    manifest: dict[str, Any] = {"figures": [], "tables": [], "warnings": []}
    candidates = limit_candidates(extract_caption_candidates(text), limit_figures, limit_tables)

    if not candidates:
        manifest["warnings"].append("No figure/table captions found in extracted text.")
        return manifest

    if not shutil.which("pdftoppm"):
        manifest["warnings"].append("pdftoppm is not available; no screenshots were rendered.")
        return manifest

    counters = {"figure": 0, "table": 0}
    for candidate in candidates:
        kind = candidate["kind"]
        counters[kind] += 1
        folder = "figures" if kind == "figure" else "tables"
        stem = "figure" if kind == "figure" else "table"
        output_path = out_dir / folder / f"{stem}-{counters[kind]:02d}.png"

        try:
            rendered = render_page(pdf_path, int(candidate["page"]), output_path)
        except (subprocess.CalledProcessError, OSError) as error:
            manifest["warnings"].append(f"Failed to render page {candidate['page']}: {error}")
            continue

        if rendered:
            manifest[folder].append(
                {
                    "path": f"assets/{slug}/{folder}/{output_path.name}",
                    "caption": candidate["caption"],
                    "page": candidate["page"],
                }
            )

    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(description="Capture candidate figure/table pages from an arXiv PDF.")
    parser.add_argument("--pdf", required=True, type=Path, help="Path to downloaded PDF")
    parser.add_argument("--text", required=True, type=Path, help="Path to pdftotext output")
    parser.add_argument("--out-dir", required=True, type=Path, help="Output directory for one paper under paper-review/assets")
    parser.add_argument("--slug", required=True, help="Paper slug used in relative asset paths")
    parser.add_argument("--limit-figures", type=int, default=3)
    parser.add_argument("--limit-tables", type=int, default=3)
    parser.add_argument("--manifest-out", type=Path, help="Optional JSON manifest output")
    args = parser.parse_args()

    text = args.text.read_text(encoding="utf-8", errors="replace")
    manifest = capture_candidates(args.pdf, text, args.out_dir, args.slug, args.limit_figures, args.limit_tables)
    output = json.dumps(manifest, ensure_ascii=False, indent=2)

    if args.manifest_out:
        args.manifest_out.write_text(output + "\n", encoding="utf-8")
    else:
        print(output)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
