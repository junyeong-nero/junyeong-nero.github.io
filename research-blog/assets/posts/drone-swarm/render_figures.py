"""Render the blog figures for the dynamic geometry study from archived data.

Uses the Research Blog CSS tokens. Run with numpy and matplotlib, for example from the
simulator checkout with the website beside it:
uv run python ../junyeong-nero.github.io/research-blog/assets/posts/drone-swarm/render_figures.py
"""

import hashlib
import json
import re
from pathlib import Path

import matplotlib
import numpy as np
from matplotlib.colors import ListedColormap
from matplotlib.patches import Rectangle

matplotlib.use("Agg")
import matplotlib.pyplot as plt

HERE = Path(__file__).resolve().parent
CSS = HERE.parents[2] / "style.css"
TOKENS = dict(re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})", CSS.read_text()))
BG = TOKENS["bg-canvas"]
INK = TOKENS["fg-primary"]
MUTED = TOKENS["fg-secondary"]
FAINT = TOKENS["fg-muted"]
RULE = TOKENS["line-default"]
CORAL = TOKENS["accent"]
SOFT = TOKENS["accent-soft"]
STONE = TOKENS["bg-stone"]

FAMILIES = [
    "open",
    "one_wall",
    "corridor",
    "taper",
    "corner_open",
    "corner_closed",
    "curve",
    "curve_taper",
    "one_wall_curve",
]
FAMILY_TITLES = {
    "open": "open (control)",
    "one_wall": "one wall",
    "corridor": "corridor",
    "taper": "taper",
    "corner_open": "open corner",
    "corner_closed": "closed corner",
    "curve": "curve",
    "curve_taper": "curved taper",
    "one_wall_curve": "one curved wall",
}
BASE = {
    "fov": None,
    "comm": 4.0,
    "separation": 0.5,
    "standoff": 2.0,
    "count": 8,
    "ceiling": 3.0,
    "width": 1.0,
}
AXES = [
    ("fov", "Sensor", "Fixed nadir half-angle [deg]", [None, 60, 50, 40, 30, 20]),
    ("comm", "Communication", "Communication range [m]", [0.8, 1.2, 1.6, 2.0, 3.0, 4.0]),
    ("separation", "Separation", "Required separation [m]", [0.5, 0.75, 1.0, 1.25, 1.5]),
    (
        "standoff",
        "Minimum standoff",
        "Minimum distance to person [m]",
        [1.0, 1.5, 2.0, 2.5, 3.0, 3.5],
    ),
    ("count", "Swarm size", "Number of drones", [4, 6, 8, 10, 12]),
    ("ceiling", "Ceiling", "Ceiling above person [m]", [0.5, 1.0, 1.5, 2.0, 3.0]),
    ("width", "Corridor width", "Width multiplier", [0.7, 0.85, 1.0, 1.3, 1.7]),
]


def data(name):
    return json.loads((HERE / "data" / name).read_text())


def cell(effects, axis, level, family="all"):
    key = "baseline/None" if level == BASE[axis] else f"{axis}/{level}"
    return effects[key][family] if key in effects and family in effects[key] else None


def level_label(axis, level):
    if axis == "fov" and level is None:
        return "gimbal"
    return f"{level:g}"


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


def plan_vs_flight():
    effects = data("effects.json")
    cases = [
        ("Sensor", "gimbal → nadir 20°", "fov/20"),
        ("Communication", "4 → 0.8 m", "comm/0.8"),
        ("Separation", "0.5 → 1.5 m", "separation/1.5"),
        ("Minimum standoff", "2 → 3.5 m", "standoff/3.5"),
        ("Swarm size", "8 → 4 drones", "count/4"),
        ("Corridor width", "×1 → ×0.7", "width/0.7"),
        ("Ceiling", "+3 → +0.5 m", "ceiling/0.5"),
    ]
    rows = [effects[key]["all"] for _, _, key in cases]
    fig, ax = plt.subplots(figsize=(9.5, 8.2))
    fig.subplots_adjust(left=0.30, right=0.94, top=0.80, bottom=0.22)
    heading(
        fig,
        "Which constraints cost more in flight than on paper?",
        "Strongest level of each axis · paired against the same baseline · 27 maps",
    )
    for i, row in enumerate(rows):
        slot, flown = row["effect_slot"], row["effect_actual"]
        ax.plot([slot["mean"], flown["mean"]], [i, i], color=RULE, linewidth=4, zorder=1)
        for effect, color, marker, label in [
            (slot, INK, "s", "Planned slots"),
            (flown, CORAL, "o", "Flown positions"),
        ]:
            ax.errorbar(
                effect["mean"],
                i,
                xerr=[[effect["mean"] - effect["low"]], [effect["high"] - effect["mean"]]],
                fmt=marker,
                color=color,
                ecolor=color,
                markersize=8.5,
                capsize=4,
                linewidth=1.5,
                zorder=3,
                markeredgecolor=BG,
                markeredgewidth=1.5,
                label=label if i == 0 else None,
            )
        right = max(flown["high"], slot["high"]) + 0.2
        ax.text(
            right,
            i - 0.02,
            f"{flown['mean']:+.2f} flown",
            va="center",
            ha="left",
            fontsize=12.5,
            color=INK,
        )
        ax.text(
            right,
            i + 0.34,
            f"{slot['mean']:+.2f} planned",
            va="center",
            ha="left",
            fontsize=11.5,
            color=MUTED,
        )
    ax.set_yticks(range(len(cases)), [f"{a}\n{b}" for a, b, _ in cases], fontsize=12)
    ax.invert_yaxis()
    ax.set_xlim(-0.3, 12.2)
    ax.set_xticks([0, 2, 4, 6, 8, 10])
    ax.set_xlabel("Increase in event-window CRLB [cm]  →  worse observation", labelpad=14)
    ax.legend(loc="lower right", frameon=False, fontsize=12)
    clean(ax, "x")
    fig.text(
        0.04,
        0.085,
        "Whiskers: 95% map-cluster bootstrap intervals. Baseline flown CRLB 2.60 cm, planned 2.64 cm.\n"
        "Each cell: 81 episodes (27 maps × 3 start seeds); width: 45 episodes on the five two-walled families.",
        color=MUTED,
        fontsize=11.5,
        linespacing=1.6,
        va="top",
    )
    save(
        fig,
        "plan-vs-flight",
        "Planned and flown constraint effects",
        "Paired CRLB increases of the planned slots and the flown positions for seven axes.",
    )


def person_path(scenario):
    target = scenario["target"]
    speed = target["speed"]
    x, y = target["position"][:2]
    heading_rad = target.get("heading", 0.0)
    dt = 0.02
    if target["motion"] == "constant_velocity":
        segments = [{"duration": scenario["time"]["duration"]}]
    else:
        segments = target["segments"]
    t, pts = 0.0, [(0.0, x, y)]
    for seg in segments:
        rate = seg.get("a_lat", 0.0) / speed
        for _ in range(int(round(seg["duration"] / dt))):
            heading_rad += rate * dt
            x += speed * np.cos(heading_rad) * dt
            y += speed * np.sin(heading_rad) * dt
            t += dt
            pts.append((t, x, y))
    return np.array(pts)


def geometry():
    maps = {m["family"]: m for m in data("maps.json") if m["variant"] == 0}
    fig, axs = plt.subplots(3, 3, figsize=(9.5, 9.6))
    fig.subplots_adjust(left=0.04, right=0.97, top=0.85, bottom=0.13, hspace=0.38, wspace=0.10)
    heading(
        fig,
        "Nine geometry families, one skeleton",
        "Variant 00 of each family · top view · person walks left to right at 1.5 m/s",
    )
    for ax, family in zip(axs.flat, FAMILIES, strict=True):
        m = maps[family]
        scenario = m["scenario"]
        for wall in scenario["world"]["obstacles"]:
            pts = np.array(wall["points"])
            ax.plot(pts[:, 0], pts[:, 1], color=INK, linewidth=3.2, solid_capstyle="butt")
        path = person_path(scenario)
        w0, w1 = m["window"]
        before = path[:, 0] < w0
        after = path[:, 0] > w1
        inside = ~before & ~after
        for mask in (before, after):
            ax.plot(path[mask, 1], path[mask, 2], color=FAINT, linewidth=1.4, linestyle=(0, (2, 2)))
        ax.plot(path[inside, 1], path[inside, 2], color=CORAL, linewidth=2.4)
        (x0, y0, _), (x1, y1, _) = scenario["start"]["region"]
        ax.add_patch(
            Rectangle((x0, y0), x1 - x0, y1 - y0, facecolor=SOFT, edgecolor="none", alpha=0.8)
        )
        ax.plot(path[0, 1], path[0, 2], marker="*", markersize=10, color=INK, markeredgecolor=BG)
        ax.set_xlim(-14, 22)
        ax.set_ylim(-13, 15)
        ax.set_aspect("equal")
        ax.set_title(FAMILY_TITLES[family], loc="left", fontsize=13, weight="bold", pad=6)
        ax.set_xticks([])
        ax.set_yticks([])
        for spine in ax.spines.values():
            spine.set_color(RULE)
    fig.text(
        0.04,
        0.075,
        "Black: walls, 6 m high and 0.5 m thick, extending 40 m behind the person.\n"
        "Coral: the 12 s event window (4–16 s); dotted: the rest of the walk. Soft coral: baseline start box.\n"
        "Star: the person at t = 0. Turns are centred at 10 s; the generator picks their side at random.",
        fontsize=11.5,
        color=MUTED,
        linespacing=1.6,
        va="top",
    )
    save(
        fig,
        "geometry-families",
        "Nine geometry families",
        "Top views of variant 00 of each family from the archived maps.",
    )


def dose_panels():
    effects = data("effects.json")
    fig, axs = plt.subplots(4, 2, figsize=(9.5, 15.5))
    fig.subplots_adjust(left=0.10, right=0.96, top=0.865, bottom=0.05, hspace=0.75, wspace=0.30)
    heading(
        fig,
        "Where the plan is realised, and where it is not",
        "Thin: nine families, flown · bold: all families, flown · dashed: all families, planned",
    )
    axes = list(axs.flat)
    for i, (ax, (axis, title, xlabel, levels)) in enumerate(zip(axes[:7], AXES, strict=True)):
        x = np.arange(len(levels))
        for family in FAMILIES:
            cells = [cell(effects, axis, lv, family) for lv in levels]
            if all(c is None for c in cells):
                continue
            ys = [np.nan if c is None else c["actual_cm"] for c in cells]
            ax.plot(x, ys, color=FAINT, linewidth=1.0, alpha=0.55)
        cells = [cell(effects, axis, lv) for lv in levels]
        ax.plot(x, [c["slot_cm"] for c in cells], color=INK, linestyle="--", linewidth=2.0)
        ax.plot(
            x,
            [c["actual_cm"] for c in cells],
            color=CORAL,
            marker="o",
            markersize=6,
            linewidth=2.4,
            markeredgecolor=BG,
            markeredgewidth=1.2,
        )
        ax.axvline(levels.index(BASE[axis]), color=FAINT, linewidth=1.2, linestyle=(0, (1, 3)))
        ax.set_title(f"{chr(65 + i)}   {title}", loc="left", fontsize=14.5, weight="bold", pad=12)
        ax.set_xticks(
            x,
            [level_label(axis, lv) + ("\n(base)" if lv == BASE[axis] else "") for lv in levels],
            fontsize=11,
        )
        ax.set_xlabel(xlabel, fontsize=11.5, labelpad=6)
        if i % 2 == 0:
            ax.set_ylabel("Event-window CRLB [cm]", fontsize=11.5)
        ax.margins(x=0.06, y=0.2)
        clean(ax)
    legend_ax = axes[7]
    legend_ax.axis("off")
    handles = [
        plt.Line2D(
            [],
            [],
            color=CORAL,
            marker="o",
            markersize=6,
            linewidth=2.4,
            label="Flown positions, all families",
        ),
        plt.Line2D(
            [], [], color=INK, linestyle="--", linewidth=2.0, label="Planned slots, all families"
        ),
        plt.Line2D([], [], color=FAINT, linewidth=1.0, label="Flown positions, one family each"),
        plt.Line2D(
            [], [], color=FAINT, linewidth=1.2, linestyle=(0, (1, 3)), label="Shared baseline level"
        ),
    ]
    legend_ax.legend(
        handles=handles, loc="upper left", frameon=False, fontsize=12, labelspacing=1.1
    )
    legend_ax.text(
        0.0,
        0.22,
        "Vertical scales differ per panel.\nWidth: five two-walled families only.\n"
        "Means use finite event-window samples;\nvisibility and degeneracy are in the text.",
        transform=legend_ax.transAxes,
        fontsize=11.5,
        color=MUTED,
        linespacing=1.6,
        va="top",
    )
    save(
        fig,
        "dose-panels",
        "Seven dose-response panels",
        "Flown and planned event-window CRLB against each constraint, per family and pooled.",
    )


def family_dependence():
    effects = data("effects.json")
    fig, (a, b) = plt.subplots(2, 1, figsize=(9.5, 11.6))
    fig.subplots_adjust(left=0.11, right=0.84, top=0.865, bottom=0.12, hspace=0.62)
    heading(
        fig,
        "One loss depends on the walls, one does not",
        "Flown event-window CRLB by family · 9 episodes per family and level",
    )

    def panel(ax, axis, levels, highlight, xlabel, title):
        x = np.arange(len(levels))
        for family in FAMILIES:
            ys = [cell(effects, axis, lv, family)["actual_cm"] for lv in levels]
            if family in highlight:
                color, marker = highlight[family]
                ax.plot(
                    x,
                    ys,
                    color=color,
                    marker=marker,
                    markersize=7,
                    linewidth=2.4,
                    markeredgecolor=BG,
                    markeredgewidth=1.2,
                    zorder=3,
                )
                ax.text(
                    x[-1] + 0.12,
                    ys[-1],
                    FAMILY_TITLES[family],
                    va="center",
                    fontsize=12,
                    color=color,
                    weight="bold",
                )
            else:
                ax.plot(x, ys, color=FAINT, linewidth=1.1, alpha=0.7)
        pooled = [cell(effects, axis, lv)["actual_cm"] for lv in levels]
        ax.plot(x, pooled, color=INK, linestyle="--", linewidth=1.8, zorder=2)
        ax.text(x[-1] + 0.12, pooled[-1], "all families", va="center", fontsize=12, color=INK)
        ticks = []
        for lv in levels:
            c = cell(effects, axis, lv)
            ticks.append(f"{level_label(axis, lv)}\nsafe {c['safe']}/{c['episodes']}")
        ax.set_xticks(x, ticks, fontsize=11)
        ax.set_xlabel(xlabel, fontsize=12, labelpad=6)
        ax.set_ylabel("Event-window CRLB [cm]", fontsize=12)
        ax.set_title(title, loc="left", fontsize=14.5, weight="bold", pad=12)
        ax.margins(x=0.05, y=0.15)
        clean(ax)

    panel(
        a,
        "separation",
        [0.5, 0.75, 1.0, 1.25, 1.5],
        {"corner_closed": (CORAL, "o"), "corridor": (INK, "s")},
        "Required separation [m]",
        "A   Separation: mild in open space, severe between two walls",
    )
    panel(
        b,
        "comm",
        [4.0, 3.0, 2.0, 1.6, 1.2, 0.8],
        {"open": (CORAL, "o")},
        "Communication range [m], decreasing",
        "B   Communication: the loss appears even without walls",
    )
    fig.text(
        0.04,
        0.045,
        "Grey: the other families. Dashed: all-family mean. Safe counts are episodes without a hard "
        "constraint violation over 20 s;\nunsafe episodes remain in every mean.",
        fontsize=11.5,
        color=MUTED,
        linespacing=1.6,
        va="top",
    )
    save(
        fig,
        "family-dependence",
        "Separation and communication by family",
        "Flown CRLB per geometry family for the separation and communication axes.",
    )


def pair_grids():
    effects = data("effects.json")
    grids = [
        (
            "A   Sensor × minimum standoff",
            "fov",
            [None, 40, 30, 20],
            "standoff",
            [1.5, 2.0, 2.5, 3.0, 3.5],
            "fov_standoff",
            "Minimum standoff [m]",
            "Nadir half-angle [deg]",
        ),
        (
            "B   Sensor × ceiling",
            "fov",
            [None, 40, 30, 20],
            "ceiling",
            [0.5, 1.0, 2.0, 3.0],
            "fov_ceiling",
            "Ceiling above person [m]",
            "Nadir half-angle [deg]",
        ),
        (
            "C   Communication × separation",
            "comm",
            [4.0, 2.0, 1.2, 0.8],
            "separation",
            [0.5, 0.75, 1.0, 1.5],
            "comm_separation",
            "Required separation [m]",
            "Communication range [m]",
        ),
    ]

    def lookup(pair, a_axis, a, b_axis, b):
        if a == BASE[a_axis] and b == BASE[b_axis]:
            return effects["baseline/None"]["all"]
        if a == BASE[a_axis]:
            return effects[f"{b_axis}/{b}"]["all"]
        if b == BASE[b_axis]:
            return effects[f"{a_axis}/{a}"]["all"]
        return effects[f"{pair}/{a}/{b}"]["all"]

    fig, axs = plt.subplots(3, 1, figsize=(9.5, 16.5))
    fig.subplots_adjust(left=0.16, right=0.96, top=0.865, bottom=0.125, hspace=0.55)
    heading(
        fig,
        "Constraint pairs: certification and flown CRLB",
        "81 episodes per cell · grid certificate at 0.25 m, refined once to 0.125 m",
    )
    cmap = ListedColormap([STONE, INK, SOFT])
    for ax, (title, a_axis, a_levels, b_axis, b_levels, pair, xlabel, ylabel) in zip(
        axs, grids, strict=True
    ):
        cells = [[lookup(pair, a_axis, a, b_axis, b) for b in b_levels] for a in a_levels]
        colors = [
            [2 if c["undecided"] else 1 if c["certified"] == c["episodes"] else 0 for c in row]
            for row in cells
        ]
        ax.imshow(colors, origin="upper", aspect="auto", cmap=cmap, vmin=0, vmax=2)
        for j, row in enumerate(cells):
            for i, c in enumerate(row):
                bits = [
                    f"{c[k]} {letter}"
                    for k, letter in [("certified", "F"), ("infeasible", "I"), ("undecided", "U")]
                    if c[k]
                ]
                fallback = c["certified"] < c["episodes"]
                crlb = "always degenerate" if c["actual_cm"] is None else f"{c['actual_cm']:.1f} cm"
                dark = colors[j][i] == 1
                ax.text(
                    i,
                    j - 0.16,
                    " / ".join(bits),
                    ha="center",
                    va="center",
                    fontsize=12.5,
                    color=BG if dark else INK,
                    weight="bold",
                )
                ax.text(
                    i,
                    j + 0.20,
                    crlb + ("*" if fallback else ""),
                    ha="center",
                    va="center",
                    fontsize=11.5,
                    color=BG if dark else MUTED,
                )
        ax.set_title(title, loc="left", fontsize=14.5, weight="bold", pad=14)
        ax.set_xticks(
            range(len(b_levels)),
            [level_label(b_axis, b) + ("\n(base)" if b == BASE[b_axis] else "") for b in b_levels],
        )
        ax.set_yticks(
            range(len(a_levels)),
            [level_label(a_axis, a) + ("\n(base)" if a == BASE[a_axis] else "") for a in a_levels],
        )
        ax.set_xlabel(xlabel, fontsize=12)
        ax.set_ylabel(ylabel, fontsize=12)
        ax.set_xticks(np.arange(-0.5, len(b_levels), 1), minor=True)
        ax.set_yticks(np.arange(-0.5, len(a_levels), 1), minor=True)
        ax.grid(which="minor", color=BG, linewidth=3)
        ax.tick_params(which="both", length=0, pad=8)
        for spine in ax.spines.values():
            spine.set_visible(False)
    fig.text(
        0.04,
        0.078,
        "F: certified feasible · I: infeasible on the tested grid · U: search budget exhausted, undecided, not infeasible.\n"
        "Second line: mean flown event-window CRLB over finite samples; always degenerate: no finite sample in any episode.\n"
        "*: some episodes flew on the solver's fallback placement, so the value is not the same kind of quality\n"
        "as in a fully certified cell.",
        fontsize=11.5,
        color=MUTED,
        linespacing=1.7,
        va="top",
    )
    save(
        fig,
        "pair-grids",
        "Three constraint-pair grids",
        "Certification counts at window entry and flown CRLB for three constraint pairs.",
    )


def main():
    manifest = json.loads((HERE / "provenance.json").read_text())
    for entry in manifest["files"]:
        digest = hashlib.sha256((HERE / entry["file"]).read_bytes()).hexdigest()
        assert digest == entry["sha256"], entry["file"]
    assert data("summary.json") == {"expected": 4878, "completed": 4878, "errors": []}
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
            "svg.hashsalt": "swarm-dynamic-20260920",
        }
    )
    plan_vs_flight()
    geometry()
    dose_panels()
    family_dependence()
    pair_grids()
    print("Rendered 5 SVGs from verified archived data using", CSS)


if __name__ == "__main__":
    main()
