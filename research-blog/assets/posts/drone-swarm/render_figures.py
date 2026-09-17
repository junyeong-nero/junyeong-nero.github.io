"""Render blog figures from archived data, using the Research Blog CSS tokens.

Run with numpy and matplotlib, for example from the simulator checkout:
uv run python ../junyeong-nero.github.io/research-blog/assets/posts/drone-swarm/render_figures.py
"""

import gzip
import hashlib
import json
import re
from pathlib import Path

import matplotlib
import numpy as np
from matplotlib.colors import ListedColormap

matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
CSS = HERE.parents[2] / "style.css"
TOKENS = dict(re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})", CSS.read_text()))
BG = TOKENS["bg-canvas"]
INK = TOKENS["fg-primary"]
MUTED = TOKENS["fg-secondary"]
RULE = TOKENS["line-default"]
CORAL = TOKENS["accent"]
SOFT = TOKENS["accent-soft"]
STONE = TOKENS["bg-stone"]
FAMILIES = {
    "staggered_corridor": ("Corridor", INK, "o", "-"),
    "asymmetric_corner": ("Corner", CORAL, "s", "--"),
}
AXES = [
    ("standoff", "Minimum standoff", "constraint_dose2", 2.0, "Minimum distance to target [m]"),
    ("fov", "Sensor operation", "constraint_dose_fov", "gimbal", "Nadir half-angle [degrees]"),
    ("count", "Swarm size", "constraint_dose2", 8, "Number of drones"),
    ("comm", "Communication range", "constraint_dose", 4.0, "Communication range [m]"),
    ("separation", "Safety separation", "constraint_dose", 0.5, "Required separation [m]"),
    ("ceiling", "Ceiling above target", "constraint_dose2", 3.0, "Ceiling relative to target [m]"),
    ("width", "Corridor width", "constraint_dose2", 1.0, "Width multiplier"),
]


def data(study, name="effects.json"):
    return json.loads((HERE / "data" / f"{study}.{name}").read_text())


def rows(study):
    with gzip.open(HERE / "data" / f"{study}.runs.jsonl.gz", "rt") as f:
        return [json.loads(line) for line in f if line.strip()]


def save(fig, name, title, description):
    fig.savefig(
        HERE / f"{name}.svg",
        facecolor=BG,
        metadata={"Date": None, "Title": title, "Description": description},
    )
    plt.close(fig)


def heading(fig, title, subtitle):
    fig.text(0.04, 0.973, title, ha="left", va="top", fontsize=22, weight="bold", color=INK)
    fig.text(0.04, 0.921, subtitle, ha="left", va="top", fontsize=12.5, color=MUTED)


def clean(ax, grid="y"):
    ax.set_axisbelow(True)
    ax.grid(axis=grid, color=RULE, linewidth=0.8)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.tick_params(length=0, pad=8)


def overview():
    cases = [
        ("Minimum standoff", "2 → 3.5 m", "constraint_dose2", "standoff/3.5"),
        ("Sensor operation", "gimbal → nadir 20°", "constraint_dose_fov", "fov/20"),
        ("Swarm size", "8 → 4 drones", "constraint_dose2", "count/4"),
        ("Communication", "4 → 0.8 m", "constraint_dose", "comm/0.8"),
        ("Separation", "0.5 → 1.5 m", "constraint_dose", "separation/1.5"),
        ("Ceiling", "+3 → +0.5 m", "constraint_dose2", "ceiling/0.5"),
        ("Width", "×1 → ×0.7", "constraint_dose2", "width/0.7"),
    ]
    effects = [data(study)[key] for _, _, study, key in cases]
    assert all(r["quality_pairs"] == 36 and r["quality"]["maps"] == 12 for r in effects)
    fig, ax = plt.subplots(figsize=(9.5, 7.4))
    fig.subplots_adjust(left=0.30, right=0.91, top=0.79, bottom=0.21)
    heading(
        fig,
        "Which constraints move observation quality?",
        "One axis changes at a time · 12 maps · baseline CRLB 2.627 cm",
    )
    for i, row in enumerate(effects):
        q = row["quality"]
        ax.hlines(i, 0, q["mean"], color=RULE, linewidth=5)
        ax.errorbar(
            q["mean"],
            i,
            xerr=[[q["mean"] - q["low"]], [q["high"] - q["mean"]]],
            fmt="o",
            color=CORAL if i < 3 else INK,
            ecolor=INK,
            markersize=8,
            capsize=4,
            linewidth=1.5,
            zorder=3,
        )
        ax.text(2.48, i, f"+{q['mean']:.3f}", va="center", ha="right", fontsize=13)
    ax.set_yticks(range(7), [f"{title}\n{level}" for title, level, _, _ in cases], fontsize=12)
    ax.invert_yaxis()
    ax.set_xlim(-0.04, 2.52)
    ax.set_xticks([0, 0.5, 1, 1.5, 2])
    ax.set_xlabel("Increase in CRLB [cm]  →  worse observation", labelpad=14)
    clean(ax, "x")
    fig.text(
        0.04,
        0.08,
        "Whiskers: 95% map-cluster bootstrap intervals.\n"
        "All shown cells: 36/36 feasible solutions; no degenerate placements.",
        color=MUTED,
        fontsize=12,
        linespacing=1.6,
        va="top",
    )
    save(
        fig,
        "constraint-effects",
        "Seven constraint effects",
        "Paired CRLB increases and map-cluster 95% intervals; selected restrictive levels.",
    )


def dose_curves(specs, name, title):
    fig, axs = plt.subplots(len(specs), 1, figsize=(9.5, 3.7 * len(specs) + 1.6))
    fig.subplots_adjust(left=0.13, right=0.95, top=0.87, bottom=0.13, hspace=0.82)
    heading(fig, title, "Thin: individual maps · bold: family means · vertical scales differ")
    for i, (ax, spec) in enumerate(zip(axs, specs, strict=True)):
        axis, label, study, base, xlabel = spec
        rs = [r for r in rows(study) if r["condition"] in ("baseline", axis)]
        assert all(
            r["certificate"]["feasible"]
            and r["solution"]["feasible"]
            and not r["solution"]["degenerate"]
            for r in rs
        )
        levels = {r["level"] for r in rs if r["condition"] != "baseline"}
        levels = (
            ["gimbal", *sorted(levels, reverse=True)] if axis == "fov" else sorted(levels | {base})
        )

        def cell(level, rs=rs, base=base, axis=axis):
            return [
                r
                for r in rs
                if (
                    r["condition"] == "baseline"
                    if level == base
                    else r["condition"] == axis and r["level"] == level
                )
            ]

        for fam, (fam_label, color, marker, style) in FAMILIES.items():
            maps = sorted({r["map"] for r in rs if r["family"] == fam})
            values = np.array(
                [
                    [
                        np.mean(
                            [100 * r["solution"]["crlb_m"] for r in cell(level) if r["map"] == map_]
                        )
                        for level in levels
                    ]
                    for map_ in maps
                ]
            )
            for ys in values:
                ax.plot(range(len(levels)), ys, color=color, alpha=0.19, linewidth=1)
            ax.plot(
                range(len(levels)),
                values.mean(axis=0),
                color=color,
                marker=marker,
                linestyle=style,
                markersize=6,
                linewidth=2.4,
                label=fam_label,
            )
        ax.set_title(f"{chr(65 + i)}   {label}", loc="left", fontsize=15, weight="bold", pad=13)
        ax.set_xticks(
            range(len(levels)),
            [
                ("Gimbal" if lv == "gimbal" else f"{lv:g}") + ("\n(base)" if lv == base else "")
                for lv in levels
            ],
            fontsize=12,
        )
        ax.set_xlabel(xlabel, fontsize=12, labelpad=7)
        ax.set_ylabel("CRLB [cm]", fontsize=12)
        ax.margins(x=0.035, y=0.18)
        ax.legend(loc="best", frameon=False, fontsize=11, ncols=2)
        clean(ax)
    fig.text(
        0.04,
        0.025,
        "Every cell certified feasible; no static degeneracy. Sensor: corrected FOV run.",
        fontsize=11.5,
        color=MUTED,
        va="top",
    )
    save(fig, name, title, "Absolute CRLB curves from archived placements, grouped by map family.")


def interactions():
    effects = data("constraint_interaction")
    grids = [
        (
            "fov_standoff",
            "A   Sensor × minimum standoff",
            ["gimbal", "40", "30", "20"],
            ["1.5", "2.0", "2.5", "3.0", "3.5"],
            "Minimum standoff [m]",
            "Sensor half-angle [deg]",
        ),
        (
            "fov_ceiling",
            "B   Sensor × ceiling",
            ["gimbal", "40", "30", "20"],
            ["0.5", "1.0", "2.0", "3.0"],
            "Ceiling above target [m]",
            "Sensor half-angle [deg]",
        ),
        (
            "comm_separation",
            "C   Communication × separation",
            ["0.8", "1.2", "2.0", "4.0"],
            ["0.5", "0.75", "1.0", "1.5"],
            "Safety separation [m]",
            "Communication range [m]",
        ),
    ]
    fig, axs = plt.subplots(3, 1, figsize=(9.5, 15))
    fig.subplots_adjust(left=0.17, right=0.96, top=0.875, bottom=0.16, hspace=0.61)
    heading(
        fig,
        "Constraint pairs change the feasible region",
        "Frozen certification outcomes · 36 inputs per cell · 0.25 → 0.125 m grid",
    )
    cmap = ListedColormap([STONE, INK, SOFT])
    for ax, (key, title, xs, ys, ylabel, xlabel) in zip(axs, grids, strict=True):
        cells = [[effects[key][f"{x}/{y}"] for x in xs] for y in ys]
        colors = [
            [2 if c["undecided"] else 1 if c["certified"] else 0 for c in row] for row in cells
        ]
        ax.imshow(colors, origin="lower", aspect="auto", cmap=cmap, vmin=0, vmax=2)
        for j, row in enumerate(cells):
            for i, c in enumerate(row):
                bits = [
                    f"{c[k]} {letter}"
                    for k, letter in [("certified", "F"), ("infeasible", "I"), ("undecided", "U")]
                    if c[k]
                ]
                ax.text(
                    i,
                    j,
                    " / ".join(bits),
                    ha="center",
                    va="center",
                    fontsize=13,
                    color=BG if colors[j][i] == 1 else INK,
                    weight="bold",
                )
        ax.set_title(title, loc="left", fontsize=15, weight="bold", pad=14)
        ax.set_xticks(range(len(xs)), ["Gimbal" if x == "gimbal" else x for x in xs])
        ax.set_yticks(range(len(ys)), ys)
        ax.set_xlabel(xlabel, fontsize=12)
        ax.set_ylabel(ylabel, fontsize=12)
        ax.set_xticks(np.arange(-0.5, len(xs), 1), minor=True)
        ax.set_yticks(np.arange(-0.5, len(ys), 1), minor=True)
        ax.grid(which="minor", color=BG, linewidth=3)
        ax.tick_params(which="both", length=0, pad=8)
        for spine in ax.spines.values():
            spine.set_visible(False)
    fig.text(
        0.04,
        0.085,
        "F: certified feasible · I: grid-infeasible · U: budget exhausted\n"
        "54 undecided inputs were later re-certified: 21 feasible, 33 grid-infeasible.\n"
        "Original cells remain unchanged. Undecided does not mean infeasible.",
        fontsize=12,
        color=MUTED,
        linespacing=1.7,
        va="top",
    )
    save(
        fig,
        "interaction-feasibility",
        "Three interaction grids",
        "Feasible, grid-infeasible and undecided counts, preserving original outcomes.",
    )


def dynamic():
    summary = data("constraint_dynamic", "summary_by_condition.json")
    keys = ["baseline/None", "fov/30", "standoff/3.0"]
    labels = ["Baseline", "Nadir 30°", "Standoff 3 m"]
    fig, (a, b) = plt.subplots(2, 1, figsize=(9.5, 9.8))
    fig.subplots_adjust(left=0.24, right=0.93, top=0.82, bottom=0.30, hspace=1.07)
    heading(
        fig,
        "Good slots do not guarantee good flight",
        "108 closed-loop episodes · actual CRLB uses finite event-window samples",
    )
    y = np.arange(3)
    actual = [summary[k]["crlb_event_cm"] for k in keys]
    slot = [summary[k]["slot_crlb_cm"] for k in keys]
    a.barh(y - 0.18, slot, height=0.30, color=INK, label="Planned slots")
    a.barh(y + 0.18, actual, height=0.30, color=CORAL, label="Actual positions")
    for i in range(3):
        for value, offset in [(slot[i], -0.18), (actual[i], 0.18)]:
            a.text(value + 0.10, i + offset, f"{value:.2f}", va="center", fontsize=12)
    a.set_yticks(y, labels)
    a.invert_yaxis()
    a.set_xlim(0, 8.9)
    a.set_xlabel("Mean CRLB [cm]")
    a.set_title(
        "A   Planned and flown observation quality", loc="left", fontsize=14, pad=35, weight="bold"
    )
    a.legend(loc="lower left", bbox_to_anchor=(0, 1.03), ncols=2, frameon=False, fontsize=11)
    clean(a, "x")
    for i, key in enumerate(keys[1:]):
        static = data("constraint_dose_fov" if key.startswith("fov") else "constraint_dose2")[key][
            "quality"
        ]
        for offset, effect, color, marker in [
            (-0.13, static, INK, "s"),
            (0.13, summary[key]["effect"], CORAL, "o"),
        ]:
            b.errorbar(
                effect["mean"],
                i + offset,
                xerr=[[effect["mean"] - effect["low"]], [effect["high"] - effect["mean"]]],
                fmt=marker,
                color=color,
                markersize=7,
                capsize=4,
                label=("Static" if offset < 0 else "Flown") if i == 0 else None,
            )
            b.text(
                effect["high"] + 0.12,
                i + offset,
                f"+{effect['mean']:.2f}",
                va="center",
                fontsize=12,
            )
    b.set_yticks([0, 1], labels[1:])
    b.invert_yaxis()
    b.set_ylim(1.6, -0.6)
    b.set_xlim(0, 5.45)
    b.set_xlabel("Paired increase from baseline [cm] · 95% intervals")
    b.set_title("B   Condition effects", loc="left", fontsize=14, pad=35, weight="bold")
    b.legend(loc="lower left", bbox_to_anchor=(0, 1.03), ncols=2, frameon=False, fontsize=11)
    clean(b, "x")
    fig.text(
        0.04,
        0.18,
        "Safe throughout: baseline 35/36 · nadir 33/36 · standoff 36/36.\n"
        "Standoff: 3/36 episodes had degenerate observations.\n"
        "Mean episode degeneracy: 0.890%; maximum: 20.902%.\n"
        "Unsafe episodes remain in the averages. No estimator is in the flight loop.",
        fontsize=12,
        color=MUTED,
        linespacing=1.8,
        va="top",
    )
    save(
        fig,
        "dynamic-realisation",
        "Dynamic realisation and safety",
        "Actual and slot CRLB, paired static and flown effects, safety and degeneracy.",
    )


def estimator():
    d = data("estimator_check", "estimator_check.json")
    fig, ax = plt.subplots(figsize=(9.5, 8.3))
    fig.subplots_adjust(left=0.14, right=0.95, top=0.80, bottom=0.22)
    heading(
        fig,
        "Does an estimator reach the static bound?",
        "1,404 stored placements × 200 noisy trials · same observation model",
    )
    for fam, (label, color, marker, _) in FAMILIES.items():
        rs = [r for r in d["records"] if r["family"] == fam]
        ax.scatter(
            [100 * r["crlb_rms"] for r in rs],
            [100 * r["rmse"] for r in rs],
            s=20,
            color=color,
            marker=marker,
            alpha=0.42,
            edgecolors="none",
            label=label,
        )
    limit = max(100 * max(r["crlb_rms"], r["rmse"]) for r in d["records"]) * 1.05
    ax.plot([0, limit], [0, limit], "--", color=TOKENS["fg-muted"], lw=1.3, label="RMSE = CRLB")
    ax.set_xlim(0, limit)
    ax.set_ylim(0, limit)
    ax.set_xlabel("CRLB [cm]")
    ax.set_ylabel("Maximum-likelihood RMSE [cm]")
    ax.legend(frameon=False, loc="upper left", fontsize=12)
    clean(ax, "both")
    o = d["overall"]
    fig.text(
        0.04,
        0.10,
        f"Median RMSE / CRLB: {o['ratio_median']:.3f}"
        f" · 5–95%: {o['ratio_p5']:.3f}–{o['ratio_p95']:.3f}\n"
        "Includes the original sensor placements; does not validate real sensor noise.",
        fontsize=12,
        color=MUTED,
        linespacing=1.8,
        va="top",
    )
    save(
        fig,
        "estimator-check",
        "Static estimator check",
        "Static maximum-likelihood RMSE versus stored CRLB; all archived placements.",
    )


def main():
    manifest = json.loads((HERE / "provenance.json").read_text())
    for entry in manifest["files"]:
        assert hashlib.sha256((HERE / entry["file"]).read_bytes()).hexdigest() == entry["sha256"]
    plt.rcParams.update(
        {
            "font.family": "Arial",
            "font.size": 12.5,
            "text.color": INK,
            "axes.labelcolor": MUTED,
            "xtick.color": MUTED,
            "ytick.color": MUTED,
            "axes.facecolor": BG,
            "figure.facecolor": BG,
            "svg.fonttype": "none",
            "svg.hashsalt": "swarm-constraints-20260918",
        }
    )
    overview()
    dose_curves(AXES[:3], "main-dose-response", "Distance, sensing and swarm size")
    dose_curves(AXES[3:], "secondary-dose-response", "Where the other constraints begin to matter")
    interactions()
    dynamic()
    estimator()
    print("Rendered 6 SVGs from verified archived data using", CSS)


if __name__ == "__main__":
    main()
