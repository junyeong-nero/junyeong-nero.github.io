Most browser agents pour a big observation into the model every step — the accessibility tree, a screenshot, the tool list, the running history. It buys observability, and it is expensive. **Progressive observation disclosure** is the obvious fix: keep the full page state in the controller, outside the model. Hand the model a small, grounded working set first, and disclose more candidates only when that set falls short.

I ran it against a real agent loop on hard tasks. The result: on a weak model, adaptively sizing the working set cut token cost to **roughly a third of full observation** — 172,000 fewer tokens per task, 95% CI [−324k, −51k] — **with no measurable change in how many tasks got done**. Cost per task actually completed improved 4.2×.

That is a narrower claim than the one this post used to make. An earlier version of it said adaptive disclosure also *rescued* the weak model's accuracy, solving 8 hard tasks against full observation's 5. That claim was an artifact of how I was measuring success, and the correction is the more useful half of the story. I've kept it in, below.

## The bug was in the ruler

My harness recorded a task as successful whenever the agent's plan terminated without a hard error. Not whether the agent answered the question — whether the run *finished*. One line:

```python
# build_task_complete_event
"status": "complete",
"task_success": True,      # no condition. finishing is succeeding.
```

So an agent that navigated to a page, hit a bot-block, and reported "access is temporarily restricted" was a success. So was one whose final answer read, in full, `**TASK_FAILED** I was unable to navigate to the 상가·업무 tab`. It announced its own failure and still scored.

I re-scored every run on whether the agent actually produced the answer the task asked for. Three labels: **fail** (non-terminal status, or the agent declared failure), **review** (no declared failure but not an answer either — "Opened the homepage." — a rule can't tell a terse correct answer from a terse non-answer, so a human looks), and **pass**.

![Reported success versus strict success, by policy and model](assets/posts/chart-reported-vs-strict.svg "Pale bars are the old measure: did the run finish. Solid bars are the real one: did the agent answer. The gap is largest exactly where the old numbers looked best.")

The inflation is everywhere, and it is not a constant offset — which is what makes it dangerous. GPT-5.4-mini's `full` arm drops from 19/20 to 8/20; the weak model's `adaptive` arm drops from 14/20 to 4–8. Every arm on the strong model reported 19/20, so success looked like it carried no information and I read the whole comparison off tokens alone. It wasn't that success didn't discriminate. It was that my ruler was pinned at the ceiling.

## Four ways to show the page

Every arm sees the same tasks and the same browser. They differ only in how much of the page the model gets, and when.

- **full** — the entire observation, every step. The baseline.
- **top-k** — a fixed cap of the k most relevant candidates. Prune once, no reveals.
- **static PD** — a small initial working set; the model calls `reveal_candidates` when it needs more, at a fixed budget.
- **adaptive PD** — the same, but the disclosure budget moves up and down from run signals: an undisclosed-ref error grows it, a streak of clean grounded actions shrinks it.

The task set is 20 items from a Korean online-Mind2Web sample — 10 medium and 10 hard, two per domain across ten domains (shopping, maps, real estate, jobs, government, and more). I ran the matrix twice: once on a free, weak model (`Nemotron-3-super`), once on `GPT-5.4-mini`. Same tasks, same arms, same disclosure ratios.

## Showing less is not the win. Showing the right amount is.

This part survived the correction intact, because it was never about success — it's token data, and tokens are measured, not judged.

The tempting story is "small observation, fewer tokens." It is wrong, and the data says so bluntly. Two of the three compaction policies spent **more** total tokens than full observation on the weak model — top-k pruning at 1.23×, fixed progressive disclosure at 1.38×. A compact-but-fixed observation makes a weak model flounder: it cannot find what it needs, so it burns turns, and input piles up across those turns until the per-step saving is more than erased. Fixed disclosure also kept the agent reaching for elements it had never been shown, spiking invalid actions.

Only the *adaptive* policy — the one that grows the disclosure budget when the model struggles and shrinks it when the model is cruising — actually cut cost, to 0.32×.

![Token cost relative to full observation, by model](assets/posts/chart-token-cost.svg "Bars below the dashed line spend fewer tokens than full observation. On the weak model only adaptive PD clears it, at 0.32×. On the strong model the arms sit within noise of each other — that cluster is not the clean 'PD costs more' story I first read into it.")

Progressive disclosure is not a pruning trick; it is a control loop. Size the window to the model's need, step by step, or you get the worst of both worlds: a starved model that thrashes, and a token bill higher than if you had shown it the whole page.

## Is it cheap because it gave up faster?

This is the objection that matters, and it's the first thing I checked once the success numbers moved. An arm that abandons tasks early looks wonderfully token-efficient. Average tokens per task rewards quitting.

It doesn't hold here. Adaptive PD's strict success on the weak model is at or above full observation's — it is not buying its savings with abandonment. And when you charge each arm for its failures by dividing total spend by tasks actually completed, the gap widens rather than closing: **400k tokens per success against full observation's 1.68M**.

That's why I now lead with cost-per-success rather than cost-per-task. Average tokens alone is a metric you can win by failing.

![Token cost versus strict task success, every policy and model](assets/posts/chart-tradeoff.svg "Vertical position is what got done; horizontal position is what it cost. On the weak model the arms overlap vertically — nobody separates on success — and adaptive sits far to the left. The horizontal gap is the finding.")

## On the strong model, the reveal loop is real but the tax isn't proven

When a model can already ground against the full page, a small initial working set is not a gift — it is a missing-information problem it solves by asking for more. And it asks. Under static PD, GPT-5.4-mini revealed 5.9 times per task; under adaptive PD, 6.6 — against 0.8 for full. Model calls climbed from about 22 to about 30. That behavior is solidly measured.

What I previously concluded from it was not. I wrote that adaptive PD was therefore "the most expensive arm" and that progressive disclosure "taxes a strong model." Its 1.09× token ratio has a 95% confidence interval of [−69k, +89k] tokens per task, p=0.65 — never distinguishable from zero.

Nor does anything replace it. Relabelled, no arm separates from full observation on this model: adaptive PD is 8/20 against full's 8/20 on the rule-based label, and 5/20 against 7/20 under an LLM judge. The honest strong-model statement is that I don't know, in either direction, and the adaptive arm was rerun on a different day than the other three, which mixes a date effect into everything above.

I'll admit I had a better-sounding paragraph here for about a day. A first pass at strict scoring put adaptive PD at 13/20 against full's 9/20 and I wrote it up as the arm quietly winning all along. Then the judge disagreed, and the reason was a single Korean verb missing from my pattern list: answers reading "검색을 진행할 수 없습니다" — *cannot proceed with the search* — sailed through as passes. It over-credited adaptive by five tasks and full by one, because the adaptive agent gave up in Korean more often. The entire advantage was that gap. Two rulers in a row, each producing a confident headline the next one destroyed.

## One tax you do pay on both models

Hiding a needed element is never free. Under static and adaptive PD the invalid-action rate is roughly double full's on *both* models — the agent reaches for a ref that hasn't been disclosed yet. On the weak model, fixed static PD spiked to 5.7× full's invalid rate. Disclosure trades some grounding reliability for compaction, and you pay that regardless of model strength.

## The numbers

Both runs share the same 20 tasks, so columns are comparable within a model. Token counts are **not** comparable across models — the weak model emits far more reasoning per step. "Reported" is the old finished-without-error measure, kept so the correction is auditable.

Weak model — Nemotron-3-super (free):

| Policy | Reported | Strict | Avg tokens | vs full | Tokens/success | Calls | Invalid |
| --- | --- | --- | --- | --- | --- | --- | --- |
| full | 12/20 | 3–4/20 | 252,117 | 1.00× | 1,680,778 | 24.35 | 0.026 |
| top-k | 15/20 | 5–7/20 | 310,168 | 1.23× | 1,240,674 | 19.25 | 0.033 |
| static PD | 14/20 | 6–8/20 | 346,932 | 1.38× | 1,156,441 | 20.30 | 0.148 |
| adaptive PD | 14/20 | 4–8/20 | 80,011 | **0.32×** | **400,056** | 13.45 | 0.074 |

Strong model — GPT-5.4-mini:

| Policy | Reported | Strict | Avg tokens | vs full | Tokens/success | Calls | Reveals |
| --- | --- | --- | --- | --- | --- | --- | --- |
| full | 19/20 | 8/20 | 174,485 | 1.00× | 436,211 | 22.15 | 0.80 |
| top-k | 19/20 | 8/20 | 165,207 | 0.95× | 413,018 | 25.50 | 1.05 |
| static PD | 19/20 | 10/20 | 184,010 | 1.06× | 368,021 | 29.70 | 5.90 |
| adaptive PD | 19/20 | 8/20 | 190,942 | 1.09× | 477,356 | 30.50 | 6.60 |

An LLM judge, run on the two decisive arms, is harsher still: full 7/20, adaptive PD 5/20.

Weak-model adaptive PD in one sentence: **the same number of tasks completed, for a third of the tokens** — bootstrap p=0.001 on the token difference, McNemar p=1.00 on the success difference. Token savings at maintained performance, which is a smaller claim than "it rescues a weak agent" and a much better supported one.

## What this doesn't settle

N=20, two models, disclosure ratios borrowed from an offline replay tuned against a different model. Every comparison is paired — same tasks in every arm — which is what makes N=20 informative at all, but the strong-model differences still sit at p=0.22 and p=0.65. The next run is four arms at N=50 in a single session, on one model, with the site-blocked tasks removed.

Strict scoring has its own ceiling, worth stating plainly: there are no gold answers for these tasks, so an answer that is confident and wrong still scores as a pass. The strict numbers above are an upper bound on real success. The true rates are lower — I just don't yet know by how much.

The read for anyone building on this. If your agent runs on a small or cheap model, an *adaptive* disclosure loop is worth trying: it cut cost to a third here without costing completions, while a fixed compact observation quietly cost more than showing everything. The savings live in the adaptation, not the trimming. And before you believe any agent benchmark — including this one — go read what your success flag actually tests. Mine tested whether the program finished.
