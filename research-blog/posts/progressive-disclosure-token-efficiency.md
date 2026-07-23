Most browser agents pour a big observation into the model every step — the accessibility tree, a screenshot, the tool list, the running history. It buys observability, but a large context can make grounding *harder*: the model has to hunt through hundreds of elements for the one it needs. For a weak model, that hunt is where tasks go to die.

**Progressive observation disclosure** is the obvious fix. Keep the full page state in the controller, outside the model. Hand the model a small, grounded working set first, and disclose more candidates only when that set falls short. I ran it against a real agent loop on hard tasks — and the interesting result is not that it saves tokens. It is *which* version saves tokens, and *which model* it rescues.

Here is the headline, up front. On a weak model, adaptively sizing the working set solved **8 of 10 hard tasks against full observation's 5**, while spending **a third of the tokens**. Cheaper and better grounded, at the same time. But get the disclosure policy slightly wrong and you spend *more* than showing everything — and on a strong model, every disclosure policy does.

## Showing less is not the win. Showing the right amount is.

The tempting story is "small observation, fewer tokens." It is wrong, and the data says so bluntly. Two of the three compaction policies I tested spent **more** total tokens than full observation on the weak model — top-k pruning at 1.23x, fixed progressive disclosure at 1.38x. A compact-but-fixed observation makes a weak model flounder: it cannot find what it needs, so it burns turns, and input piles up across those turns until the per-step saving is more than erased. Fixed disclosure also kept the agent reaching for elements it had never been shown, spiking invalid actions.

Only the *adaptive* policy — the one that grows the disclosure budget when the model struggles and shrinks it when the model is cruising — actually cut cost, to 0.32x. That is the whole point. Progressive disclosure is not a pruning trick; it is a control loop. Size the window to the model's need, step by step, or you get the worst of both worlds: a starved model that thrashes, and a token bill higher than if you had shown it the whole page.

## Four ways to show the page

Every arm sees the same tasks and the same browser. They differ only in how much of the page the model gets, and when.

- **full** — the entire observation, every step. The baseline.
- **top-k** — a fixed cap of the k most relevant candidates. Prune once, no reveals.
- **static PD** — a small initial working set; the model calls `reveal_candidates` when it needs more, at a fixed budget.
- **adaptive PD** — the same, but the disclosure budget moves up and down from run signals: an undisclosed-ref error grows it, a streak of clean grounded actions shrinks it.

The task set is 20 items from a Korean online-Mind2Web sample — 10 medium and 10 hard, two per domain across ten domains (shopping, maps, real estate, jobs, government, and more). I ran the whole matrix twice: once on a free, weak model (`Nemotron-3-super`), once on `GPT-5.4-mini`. Same tasks, same arms, same disclosure ratios.

## On the weak model, a compact view grounds better

The difficulty split is the tell. On hard tasks, full observation solved only 5 of 10 — the big context overwhelmed the model — while every leaner arm solved 7 or 8.

![Hard-task success by policy, per model](assets/posts/chart-hard-success.svg "On the weak model, trimming the observation lifts hard-task success from 5/10 to 7–8. On GPT-5.4-mini every arm is already at 9–10, so there is no room left to help.")

Compaction here was not just cheaper; it was better grounding. A weaker model spends its limited attention searching a smaller haystack, and finds the needle more often.

## Adaptive disclosure is the only arm that also saves tokens

Put cost next to that success and the arms separate. On the weak model, adaptive PD lands at 0.32x — roughly a third of full's tokens, and less than a quarter of static PD's. The other two compaction arms cost *more* than full.

![Token cost relative to full observation, by model](assets/posts/chart-token-cost.svg "Bars below the dashed line spend fewer tokens than full observation. On the weak model only adaptive PD (coral) clears it, at 0.32x. On the strong model every progressive arm sits at or above 1.0 — and adaptive is now the tallest.")

That last detail is the turn in the story. Watch the coral bar: shortest of all on the weak model, tallest of all on the strong one. Same policy, opposite outcome.

## On the strong model, disclosure just buys round-trips

When the model can already ground against the full page, a small initial working set is not a gift — it is a missing-information problem the model has to solve by asking for more. And it asks. Each `reveal_candidates` call is another model turn: another prompt, another response, more tokens. Under static PD the strong model revealed 5.9 times per task; under adaptive PD, 6.6 — against 0.8 for full. Model calls climbed from about 22 to about 30. All four arms still solved 19 of 20, three of them 10 of 10 hard. The disclosure bought nothing but overhead.

Put both regimes on the same axes — cost across, success up — and they fall into two clean clusters.

![Token cost versus hard-task success, every policy and model](assets/posts/chart-tradeoff.svg "The weak-model adaptive point (coral ring, far left) is the sweet spot: cheapest and among the best-grounded. The strong-model cluster sits along the top, where success is already maxed, so disclosure only slides you rightward into more cost.")

The strong model is a tight band near the ceiling, where the only thing that varies is how much you paid to stay there. The weak model is a wide spread, where one point — adaptive disclosure — reaches down and to the left, into the corner you actually want.

## One tax you pay on both models

Hiding a needed element is never free, even when overall success holds. Under static and adaptive PD the invalid-action rate is roughly double full's on *both* models — the agent reaches for a ref that has not been disclosed yet. On the weak model, fixed static PD spiked to 5.7x full's invalid rate. Disclosure trades some grounding reliability for compaction, and you pay that tax regardless of model strength; the only question is whether the compaction is worth it.

## The numbers

Both runs share the same 20 tasks, so columns are comparable within a model. Token counts are **not** comparable across models — the weak model emits far more reasoning per step.

Weak model — Nemotron-3-super (free):

| Policy | Success | Avg tokens | vs full | Calls | Invalid | Hard |
| --- | --- | --- | --- | --- | --- | --- |
| full | 60% | 252,117 | 1.00x | 24.35 | 0.026 | 5/10 |
| top-k | 75% | 310,168 | 1.23x | 19.25 | 0.033 | 7/10 |
| static PD | 70% | 346,932 | 1.38x | 20.30 | 0.148 | 7/10 |
| adaptive PD | 70% | 80,011 | 0.32x | 13.45 | 0.074 | 8/10 |

Strong model — GPT-5.4-mini:

| Policy | Success | Avg tokens | vs full | Calls | Reveals | Invalid | Hard |
| --- | --- | --- | --- | --- | --- | --- | --- |
| full | 95% | 174,485 | 1.00x | 22.15 | 0.80 | 0.015 | 10/10 |
| top-k | 95% | 165,207 | 0.95x | 25.50 | 1.05 | 0.017 | 10/10 |
| static PD | 95% | 184,010 | 1.06x | 29.70 | 5.90 | 0.034 | 10/10 |
| adaptive PD | 95% | 190,942 | 1.09x | 30.50 | 6.60 | 0.032 | 9/10 |

Read the weak-model rows as one sentence: adaptive PD held overall success at 70% — up from full's 60% — while cutting tokens by two-thirds. Maintain performance, spend a third: that is the case for harnessing a small model with an adaptive observation, in a single row.

## What this doesn't settle

This is a proof of concept: N=20, one weak and one strong model, disclosure ratios borrowed from an offline replay tuned against a different model. The reveal-heavy behavior on GPT-5.4-mini hints that its initial budget — 0.30 of the actionable candidates — is simply too small for these pages. A larger initial budget with fewer reveals might recover a token win on the strong model, or might just confirm that fixed top-k pruning dominates there. That is the next sweep.

The cleaner read for anyone building on this. If your agent runs on a capable model that already grounds well, reach for fixed pruning over a reveal loop — or don't compact at all. If it runs on a small or cheap model that drowns in a full page, an *adaptive* disclosure loop can pay for itself twice, in tokens and in accuracy — while a fixed compact observation can quietly cost you more than showing everything. The savings live in the adaptation, not the trimming.
