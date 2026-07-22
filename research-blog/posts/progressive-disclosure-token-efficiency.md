Most browser agents pour a big observation into the model every step: the accessibility tree, a screenshot, the tool list, the running history. It buys observability, but it is expensive, and a large context can make grounding *harder* because the model has to hunt for the one element it needs.

**Progressive observation disclosure** reframes this. Keep the full page state in the controller, outside the model. Hand the model a small, grounded working set first. Only when that set is insufficient do you disclose more candidates. The full state stays available to the controller; the model-visible prompt stays compact.

It is an appealing story. I wanted to know whether it survives contact with a real agent loop — and the answer turned out to depend entirely on which model sits in the loop.

## Four ways to show the page

Every arm sees the same tasks and the same browser. They differ only in how much of the page the model gets to see, and when.

- **full** — the entire observation, every step. The baseline.
- **top-k** — a fixed cap of the `k` most relevant candidates. Prune once, no reveals.
- **static PD** — a small initial working set; the model calls `reveal_candidates` when it needs more.
- **adaptive PD** — the same, but the disclosure budget adapts up and down from run signals.

The task set is 20 items from a Korean online-Mind2Web sample: 10 medium and 10 hard, two per domain across ten domains (shopping, maps, real estate, jobs, government, and so on). I ran the whole matrix twice — once on a free, weaker model (`Nemotron-3-super` via OpenRouter), once on `GPT-5.4-mini`. Same tasks, same arms, same disclosure ratios.

## The headline: it inverts

![Token cost relative to full observation, by model](assets/posts/chart-ratio.svg "Bars below the dashed line spend fewer tokens than showing the model everything. On the weak model (left), adaptive PD lands at 0.32x. On the strong model (right), every progressive arm sits above 1.0.")

On the weak model, adaptive disclosure is a triumph: it used **roughly a quarter of the tokens** of full observation. On the strong model, the same policy became the *most* expensive arm in the set. The direction flipped.

## On the weak model, disclosure looks like a win

The free model struggles with a full observation. It floods its own output with reasoning, and it misses grounding on the hardest pages. Give it a compact working set and it does better *and* cheaper: adaptive PD matched or beat full on success while spending far less.

The difficulty split is the tell. On hard tasks, full observation solved only 5 of 10 — the big context overwhelmed the model — while every leaner arm solved 7 or 8. Compaction was not just cheaper; it was better grounding.

![Task success rate by policy, per model](assets/posts/chart-success.svg "On the weak model, policy choice moved success by 15 points. On GPT-5.4-mini all four arms solve 19 of 20.")

## On the strong model, disclosure just adds round-trips

When the model can already ground against the full page, a small initial working set is not a gift — it is a missing-information problem the model has to solve by asking for more. And it does ask. Each `reveal_candidates` call is another model turn: another prompt, another response, more tokens.

This is the whole mechanism of the inversion, in one chart.

![Reveal round-trips per task, per model](assets/posts/chart-reveals.svg "The weak model barely reveals. The strong model, handed a compact set, asks for more 5.9 times per task under static PD and 6.6 under adaptive — pushing model calls from about 22 up to about 30.")

Put success and cost on the same axes and the two regimes separate cleanly. The weak model is a wide, cheap-when-adaptive cloud low on the success axis. The strong model is a tight band near the top, where the only thing that varies is how much you paid to get there.

![Success versus total tokens for every policy and model](assets/posts/chart-scatter.svg "Adaptive PD on the weak model (green ring, far left) is the standout efficiency point. On the strong model everything clusters near 95% success; disclosure just slides you rightward — costlier — for no height.")

## One cost that shows up on both models

Hiding a needed element is not free even when overall success holds. Under static and adaptive PD, the invalid-action rate is roughly double full's on *both* models — the agent reaches for a ref that has not been disclosed yet. On the weak model, static PD's invalid rate spiked to 5.7x full's. Disclosure trades some grounding reliability for compaction, and you pay that tax regardless of model strength.

> Progressive disclosure is not an intrinsic token saving. It is a rescue mechanism for a model that cannot handle a full observation. When the model handles it fine, the reveal round-trips become pure overhead — and the more adaptive the policy, the more it reveals, and the more it costs.

## The numbers

Both runs share the same 20 tasks, so the columns are directly comparable within a model. Token counts are **not** comparable across models — the weak model emits far more reasoning.

Weak model, Nemotron-3-super (free):

| Policy | Success | Avg tokens | vs full | Calls | Reveals | Invalid | Hard |
| --- | --- | --- | --- | --- | --- | --- | --- |
| full | 60% | 252,117 | 1.00x | 24.35 | 0.00 | 0.026 | 5/10 |
| top-k | 75% | 310,168 | 1.23x | 19.25 | 0.15 | 0.033 | 7/10 |
| static PD | 70% | 346,932 | 1.38x | 20.30 | 0.00 | 0.148 | 7/10 |
| adaptive PD | 70% | 80,011 | 0.32x | 13.45 | 0.00 | 0.074 | 8/10 |

Strong model, GPT-5.4-mini:

| Policy | Success | Avg tokens | vs full | Calls | Reveals | Invalid | Hard |
| --- | --- | --- | --- | --- | --- | --- | --- |
| full | 95% | 174,485 | 1.00x | 22.15 | 0.80 | 0.015 | 10/10 |
| top-k | 95% | 165,207 | 0.95x | 25.50 | 1.05 | 0.017 | 10/10 |
| static PD | 95% | 184,010 | 1.06x | 29.70 | 5.90 | 0.034 | 10/10 |
| adaptive PD | 95% | 190,942 | 1.09x | 30.50 | 6.60 | 0.032 | 9/10 |

## What this doesn't settle

This is a proof of concept: N=20, one weak and one strong model, disclosure ratios borrowed from an offline replay tuned against a different model. The reveal-heavy behavior on GPT-5.4-mini hints that its initial budget (0.30 of actionable candidates) is simply too small for these pages — a larger initial budget with fewer reveals might recover a token win, or might just confirm that fixed top-k pruning dominates on strong models. That is the next sweep.

The cleaner read for anyone building on this: if your agent runs on a capable model that already grounds well, reach for fixed pruning, not a reveal loop. If it runs on a small or cheap model that drowns in a full page, progressive disclosure can pay for itself twice — in tokens and in accuracy.
