#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import tarfile
import tempfile
from pathlib import Path
from typing import Any


FIGURE_ENV_PATTERN = re.compile(
    r"\\begin\{figure\*?\}.*?\\end\{figure\*?\}",
    re.DOTALL | re.IGNORECASE,
)

TABLE_ENV_PATTERN = re.compile(
    r"\\begin\{table\*?\}.*?\\end\{table\*?\}",
    re.DOTALL | re.IGNORECASE,
)

INCLUDEGRAPHICS_PATTERN = re.compile(
    r"\\includegraphics(?:\s*\[.*?\])?\s*\{(?P<path>[^}]+)\}"
)

CAPTION_PATTERN_TEX = re.compile(r"\\caption\s*")

PDFTEX_PREAMBLE = r"""
\documentclass[varwidth=1200pt]{standalone}
\usepackage{booktabs,array,tabularx,longtable,threeparttable}
\usepackage{colortbl,multirow,makecell}
\usepackage{graphicx}
\usepackage{amsmath,amssymb}
\usepackage{xcolor}
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage[normalem]{ulem}
\usepackage{pifont}
\begin{document}
"""


def extract_balanced_braces(text: str, start: int) -> tuple[str, int]:
    depth = 0
    i = start
    result: list[str] = []
    while i < len(text):
        ch = text[i]
        if ch == '{':
            if depth > 0:
                result.append(ch)
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0:
                return ''.join(result), i + 1
            result.append(ch)
        elif depth > 0:
            result.append(ch)
        i += 1
    return '', start + 1


def download_arxiv_source(arxiv_id: str, dest_dir: Path) -> Path | None:
    url = f"https://arxiv.org/e-print/{arxiv_id}"
    tarball = dest_dir / f"{arxiv_id}.tar.gz"
    try:
        subprocess.run(
            ["curl", "-sL", url, "-o", str(tarball)],
            check=True, timeout=60,
        )
    except (subprocess.CalledProcessError, OSError):
        return None
    return tarball if tarball.exists() and tarball.stat().st_size > 0 else None


def extract_source(tarball: Path, dest_dir: Path) -> Path | None:
    try:
        with tarfile.open(tarball) as tf:
            tf.extractall(dest_dir)
    except (tarfile.TarError, OSError):
        return None
    return dest_dir


def find_tex_files(src_dir: Path) -> list[Path]:
    tex_files = list(src_dir.rglob("*.tex"))
    return sorted(tex_files, key=lambda p: (p.name != "main.tex", str(p)))


def strip_tex_comments(text: str) -> str:
    return re.sub(r"(?<!\\)%.*", "", text)


def resolve_figure_path(
    includegraphics_path: str, tex_file_dir: Path, src_dir: Path
) -> Path | None:
    lookup = includegraphics_path.strip()
    if not lookup:
        return None
    search_dirs = [tex_file_dir, src_dir]
    extensions = [".pdf", ".eps", ".png", ".jpg", ".jpeg", ".PNG", ".JPG", ".PDF", ".EPS"]
    for base in search_dirs:
        for ext in extensions:
            candidate = base / f"{lookup}{ext}"
            if candidate.exists():
                return candidate
        candidate = base / lookup
        if candidate.exists() and candidate.is_file():
            return candidate
    return None


def convert_to_png(src_path: Path, dst_path: Path, dpi: int = 200) -> bool:
    dst_path.parent.mkdir(parents=True, exist_ok=True)
    suffix = src_path.suffix.lower()

    if suffix in (".png",):
        shutil.copy2(src_path, dst_path)
        return True

    if suffix in (".jpg", ".jpeg"):
        if shutil.which("magick"):
            subprocess.run(
                ["magick", "convert", str(src_path), str(dst_path)],
                check=True, capture_output=True,
            )
            return dst_path.exists()
        shutil.copy2(src_path, dst_path)
        return True

    if suffix in (".pdf",):
        if shutil.which("pdftoppm"):
            prefix = dst_path.with_suffix("")
            subprocess.run(
                ["pdftoppm", "-png", "-singlefile", "-r", str(dpi), str(src_path), str(prefix)],
                check=True, capture_output=True,
            )
            rendered = prefix.with_suffix(".png")
            if rendered != dst_path and rendered.exists():
                rendered.replace(dst_path)
            return dst_path.exists()

    if suffix in (".eps",):
        if shutil.which("magick"):
            subprocess.run(
                ["magick", "convert", str(src_path), str(dst_path)],
                check=True, capture_output=True,
            )
            return dst_path.exists()

    return False


def extract_figures_from_tex(
    src_dir: Path,
    out_dir: Path,
    slug: str,
    limit_figures: int = 3,
) -> dict[str, Any]:
    manifest: dict[str, Any] = {"figures": [], "warnings": []}
    tex_files = find_tex_files(src_dir)
    if not tex_files:
        manifest["warnings"].append("No .tex files found in extracted source.")
        return manifest

    count = 0
    seen_figures: set[str] = set()

    for tex_file in tex_files:
        if count >= limit_figures:
            break
        try:
            raw = tex_file.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        cleaned = strip_tex_comments(raw)

        for env_match in FIGURE_ENV_PATTERN.finditer(cleaned):
            if count >= limit_figures:
                break

            env_text = env_match.group(0)

            inc_paths = [
                m.group("path").strip()
                for m in INCLUDEGRAPHICS_PATTERN.finditer(env_text)
            ]

            caption_texts: list[str] = []
            pos = 0
            while True:
                cap_match = CAPTION_PATTERN_TEX.search(env_text, pos)
                if not cap_match:
                    break
                caption_text, end = extract_balanced_braces(env_text, cap_match.end())
                caption_texts.append(caption_text.strip())
                pos = end

            for i, fig_path_str in enumerate(inc_paths):
                if count >= limit_figures:
                    break
                if not fig_path_str or fig_path_str in seen_figures:
                    continue
                seen_figures.add(fig_path_str)

                resolved = resolve_figure_path(fig_path_str, tex_file.parent, src_dir)
                if resolved is None:
                    manifest["warnings"].append(
                        f"Figure file not found: '{fig_path_str}' (referenced in {tex_file.name})"
                    )
                    continue

                count += 1
                stem = f"figure-{count:02d}.png"
                dst = out_dir / "figures" / stem

                converted = convert_to_png(resolved, dst)
                if not converted:
                    manifest["warnings"].append(
                        f"Failed to convert {resolved} to PNG"
                    )
                    continue

                cap = caption_texts[i] if i < len(caption_texts) else ""
                manifest["figures"].append({
                    "path": f"assets/{slug}/figures/{stem}",
                    "caption": cap,
                })

    if not manifest["figures"]:
        manifest["warnings"].append("No figures could be extracted from TeX source.")

    return manifest


def extract_tables_from_tex(
    src_dir: Path,
    out_dir: Path,
    slug: str,
    limit_tables: int = 3,
) -> dict[str, Any]:
    manifest: dict[str, Any] = {"tables": [], "warnings": []}
    tex_files = find_tex_files(src_dir)
    if not tex_files:
        manifest["warnings"].append("No .tex files found in extracted source.")
        return manifest

    if not shutil.which("pdflatex"):
        manifest["warnings"].append("pdflatex not available; cannot compile tables from TeX.")
        return manifest

    pdftoppm = shutil.which("pdftoppm")
    if not pdftoppm:
        manifest["warnings"].append("pdftoppm not available; cannot convert table PDF to PNG.")
        return manifest

    count = 0

    for tex_file in tex_files:
        if count >= limit_tables:
            break
        try:
            raw = tex_file.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue

        cleaned = strip_tex_comments(raw)

        for env_match in TABLE_ENV_PATTERN.finditer(cleaned):
            if count >= limit_tables:
                break

            env_text = env_match.group(0)

            cap_match = CAPTION_PATTERN_TEX.search(env_text)
            caption_raw = ""
            if cap_match:
                caption_raw, _ = extract_balanced_braces(env_text, cap_match.end())
                caption_raw = caption_raw.strip()

            count += 1
            stem = f"table-{count:02d}"
            dst = out_dir / "tables" / f"{stem}.png"
            dst.parent.mkdir(parents=True, exist_ok=True)

            tex_content = f"""{PDFTEX_PREAMBLE}
{env_text}
\\end{{document}}
"""

            tex_path = src_dir / f"_{stem}.tex"

            try:
                tex_path.write_text(tex_content, encoding="utf-8")

                result = subprocess.run(
                    ["pdflatex", "-interaction=nonstopmode",
                     f"-output-directory={src_dir}", str(tex_path)],
                    cwd=str(src_dir),
                    capture_output=True, text=True,
                    timeout=30,
                )

                pdf_path = src_dir / f"{stem}.pdf"
                if pdf_path.exists():
                    prefix = dst.with_suffix("")
                    subprocess.run(
                        [pdftoppm, "-png", "-singlefile", "-r", "200",
                         str(pdf_path), str(prefix)],
                        check=True, capture_output=True, timeout=30,
                    )
                    rendered = prefix.with_suffix(".png")
                    if rendered != dst and rendered.exists():
                        rendered.replace(dst)

                if dst.exists():
                    manifest["tables"].append({
                        "path": f"assets/{slug}/tables/{dst.name}",
                        "caption": caption_raw,
                    })
                else:
                    manifest["warnings"].append(
                        f"Failed to render table from {tex_file.name} (check LaTeX errors)."
                    )

                for f in src_dir.glob(f"{stem}.*"):
                    if f.suffix in (".aux", ".log", ".pdf", ".tex"):
                        try:
                            f.unlink()
                        except OSError:
                            pass

            except (subprocess.TimeoutExpired, OSError) as e:
                manifest["warnings"].append(
                    f"LaTeX compilation failed for table in {tex_file.name}: {e}"
                )

    if not manifest["tables"]:
        manifest["warnings"].append("No tables could be extracted from TeX source.")

    return manifest


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Extract figures and tables from arXiv TeX source."
    )
    parser.add_argument("--arxiv-id", required=True, help="arXiv paper ID (canonical, versionless)")
    parser.add_argument("--out-dir", required=True, type=Path,
                        help="Output directory under paper-review/assets")
    parser.add_argument("--slug", required=True, help="Paper slug used in relative asset paths")
    parser.add_argument("--limit-figures", type=int, default=3)
    parser.add_argument("--limit-tables", type=int, default=3)
    parser.add_argument("--keep-source", action="store_true",
                        help="Keep extracted TeX source (for debugging)")
    parser.add_argument("--manifest-out", type=Path,
                        help="Optional JSON manifest output path")
    args = parser.parse_args()

    out_dir = args.out_dir
    out_dir.mkdir(parents=True, exist_ok=True)

    temp_root = Path(tempfile.mkdtemp(prefix="arxiv_src_"))
    manifest: dict[str, Any] = {"figures": [], "tables": [], "warnings": []}

    try:
        tarball = download_arxiv_source(args.arxiv_id, temp_root)
        if tarball is None:
            manifest["warnings"].append(
                f"Failed to download arXiv e-print source for {args.arxiv_id}."
            )
        else:
            src_dir = temp_root / "src"
            src_dir.mkdir(parents=True, exist_ok=True)
            if extract_source(tarball, src_dir):
                fig_result = extract_figures_from_tex(
                    src_dir, out_dir, args.slug, args.limit_figures,
                )
                manifest["figures"] = fig_result["figures"]
                manifest["warnings"].extend(fig_result["warnings"])

                tbl_result = extract_tables_from_tex(
                    src_dir, out_dir, args.slug, args.limit_tables,
                )
                manifest["tables"] = tbl_result["tables"]
                manifest["warnings"].extend(tbl_result["warnings"])
            else:
                manifest["warnings"].append("Failed to extract TeX source tarball.")
    finally:
        if not args.keep_source:
            shutil.rmtree(temp_root, ignore_errors=True)

    output = json.dumps(manifest, ensure_ascii=False, indent=2)
    if args.manifest_out:
        args.manifest_out.write_text(output + "\n", encoding="utf-8")
    else:
        print(output)

    return 0 if manifest["figures"] or manifest["tables"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
