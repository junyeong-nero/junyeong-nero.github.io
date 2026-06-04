#!/usr/bin/env python3
from __future__ import annotations

import argparse
import re
from typing import NamedTuple


ARXIV_ID_PATTERN = re.compile(
    r"(?P<id>(?:\d{4}\.\d{4,5}|[a-z-]+(?:\.[A-Z]{2})?/\d{7})(?P<version>v\d+)?)",
    re.IGNORECASE,
)
VERSION_PATTERN = re.compile(r"^(?P<canonical>.+?)(?P<version>v\d+)$", re.IGNORECASE)


class ParsedArxivId(NamedTuple):
    raw: str
    canonical: str
    version: str | None


def parse_arxiv_id(value: str) -> ParsedArxivId:
    cleaned = value.strip()
    cleaned = cleaned.removesuffix(".pdf")
    match = ARXIV_ID_PATTERN.search(cleaned)
    if not match:
        raise ValueError(f"Could not parse arXiv id from: {value}")

    raw = match.group("id")
    version_match = VERSION_PATTERN.match(raw)
    if version_match:
        return ParsedArxivId(
            raw=raw,
            canonical=version_match.group("canonical"),
            version=version_match.group("version"),
        )

    return ParsedArxivId(raw=raw, canonical=raw, version=None)


def main() -> int:
    parser = argparse.ArgumentParser(description="Parse an arXiv URL or identifier.")
    parser.add_argument("value", help="arXiv URL or ID")
    args = parser.parse_args()

    parsed = parse_arxiv_id(args.value)
    print(parsed.canonical)
    if parsed.version:
        print(parsed.version)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
