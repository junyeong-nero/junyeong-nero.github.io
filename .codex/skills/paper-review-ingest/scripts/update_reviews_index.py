#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
from datetime import date
from pathlib import Path
from typing import Any


VERSION_PATTERN = re.compile(r"v\d+$", re.IGNORECASE)


def canonical_id(arxiv_id: str) -> str:
    return VERSION_PATTERN.sub("", arxiv_id.strip())


def empty_index(today: str) -> dict[str, Any]:
    return {"version": 1, "updatedAt": today, "reviews": []}


def read_index(path: Path, today: str) -> dict[str, Any]:
    if not path.exists():
        return empty_index(today)

    payload = json.loads(path.read_text(encoding="utf-8"))
    if isinstance(payload, list):
        return {"version": 1, "updatedAt": today, "reviews": payload}
    if not isinstance(payload, dict):
        raise ValueError(f"Index must be a JSON object or list: {path}")

    payload.setdefault("version", 1)
    payload.setdefault("updatedAt", today)
    payload.setdefault("reviews", [])
    if not isinstance(payload["reviews"], list):
        raise ValueError("Index field 'reviews' must be a list")
    return payload


def normalize_entry(entry: dict[str, Any]) -> dict[str, Any]:
    required = ["id", "slug", "title", "summary", "pdfUrl", "reviewPath"]
    missing = [key for key in required if not entry.get(key)]
    if not entry.get("arxivUrl") and not entry.get("sourceUrl"):
        missing.append("arxivUrl or sourceUrl")
    if missing:
        raise ValueError(f"Missing required review fields: {', '.join(missing)}")

    normalized = dict(entry)
    normalized["id"] = canonical_id(str(normalized["id"]))
    normalized["authors"] = [str(author) for author in normalized.get("authors", []) if author]
    normalized["arxivUrl"] = str(normalized.get("arxivUrl", ""))
    normalized["sourceUrl"] = str(normalized.get("sourceUrl", ""))
    normalized["tags"] = sorted({str(tag).strip().lower() for tag in normalized.get("tags", []) if str(tag).strip()})

    assets = normalized.get("assets") if isinstance(normalized.get("assets"), dict) else {}
    normalized["assets"] = {
        "figures": list(assets.get("figures", [])),
        "tables": list(assets.get("tables", [])),
    }
    return normalized


def upsert_review(index_path: Path, entry: dict[str, Any], today: str | None = None) -> dict[str, Any]:
    today = today or date.today().isoformat()
    payload = read_index(index_path, today)
    normalized = normalize_entry(entry)
    target_id = canonical_id(normalized["id"])

    reviews = []
    replaced = False
    for existing in payload["reviews"]:
        existing_id = canonical_id(str(existing.get("id", "")))
        if existing_id == target_id:
            reviews.append(normalized)
            replaced = True
        else:
            reviews.append(existing)

    if not replaced:
        reviews.append(normalized)

    reviews.sort(key=lambda review: (review.get("reviewedAt") or review.get("publishedAt") or ""), reverse=True)
    payload["reviews"] = reviews
    payload["updatedAt"] = today

    index_path.parent.mkdir(parents=True, exist_ok=True)
    index_path.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return payload


def main() -> int:
    parser = argparse.ArgumentParser(description="Upsert a paper review entry into reviews.json.")
    parser.add_argument("--index", required=True, type=Path, help="Path to paper-review/data/reviews.json")
    parser.add_argument("--entry", required=True, type=Path, help="Path to a JSON review entry")
    args = parser.parse_args()

    entry = json.loads(args.entry.read_text(encoding="utf-8"))
    payload = upsert_review(args.index, entry)
    print(f"updated {args.index} ({len(payload['reviews'])} reviews)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
