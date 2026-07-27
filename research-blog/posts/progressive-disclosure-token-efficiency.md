I spent a few weeks testing a method for making browser agents cheaper, and the method turned out to do nothing. Getting to that answer meant fixing how I measured success three times, and each fix reversed a conclusion I had already written down. The thing that finally saved tokens was not the method. It was a line in my own harness that sent the model a copy of the page it had just been shown.

This is the writeup of that, including the two versions of this post that were wrong.

## The idea

Most browser agents pour a big observation into the model every step — the accessibility tree, a screenshot, the tool list, the running history. **Progressive observation disclosure** is the obvious fix. Keep the full page state in the controller, outside the model. Hand the model a small, grounded working set first, and disclose more candidates only when that set falls short.

Four arms, same tasks, same browser, differing only in how much of the page the model gets and when:

- **full** — the entire observation, every step. The baseline.
- **top-k** — a fixed cap of the k most relevant candidates. Prune once, no reveals.
- **static PD** — a small initial working set; the model calls `reveal_candidates` when it needs more.
- **adaptive PD** — the same, but the budget moves with run signals: an undisclosed-ref error grows it, a streak of clean grounded actions shrinks it.

Tasks are Korean online-Mind2Web samples on live sites. Model is GPT-5.4-mini throughout, with an earlier pass on a weaker free model.

## Version one: the ruler was not measuring success

My harness recorded a task as successful whenever the agent's plan terminated without a hard error. Not whether it answered the question — whether the run *finished*:

```python
# build_task_complete_event
"status": "complete",
"task_success": True,      # no condition. finishing is succeeding.
```

So an agent that hit a bot-block and reported "access is temporarily restricted" scored a success. So did one whose entire final answer was `**TASK_FAILED** I was unable to navigate to the 상가·업무 tab`. It announced its own failure and still counted.

Every arm scored 19/20 under this. Success looked like it carried no information, so I read the whole comparison off token counts and wrote that progressive disclosure "rescues a weak agent and taxes a strong one."

## Version two: my rule had a hole in it

I wrote a rule that reads the agent's final answer and fails it when the agent declares failure. Better. It moved GPT-5.4-mini's full-observation arm from 19/20 to 11/20, and it moved adaptive disclosure to 13/20 — which made adaptive the *best* arm, and I wrote that up too.

That was a missing Korean verb. My pattern list caught 확인할 수 없 ("cannot confirm") and 찾을 수 없 ("cannot find") but not 진행할 수 없 ("cannot proceed"). Answers reading *"검색을 진행할 수 없습니다"* — I cannot proceed with the search — sailed through as successes.

It was not a uniform error. It over-credited adaptive disclosure by five tasks and full observation by one, because the adaptive agent gave up in Korean more often. **The entire advantage I had just published was that gap.**

## Version three: let something else grade it

I ported [WebJudge](https://github.com/OSU-NLP-Group/Online-Mind2Web), the LLM evaluator from the Online-Mind2Web benchmark, which its authors validated against human labels. It reads the task, the action history and screenshots from the trajectory, and decides whether the task was actually done.

![The same 20 runs, scored by three successive measures of success](assets/posts/chart-three-rulers.svg "Nothing about the agent changed between these rows — only what I counted as success. The first two versions of this post took their headlines from the top row.")

Three rulers, one set of runs, 15 → 11 → 7. The rules and the judge agree on 30 of 40 trajectories, and every disagreement runs the same direction: the rule passes what the judge fails, never the reverse. A rule can only catch an agent that *announces* its failure. It cannot catch a confident wrong answer, so even 11 is an upper bound.

## The verdict on the method

With a trustworthy label and 20 paired tasks:

| | reported | strict | WebJudge | tokens/task | tokens per success (strict / judge) |
| --- | ---: | ---: | ---: | ---: | ---: |
| full | 15/20 | **11/20** | **7/20** | 164,756 | **299,556** / **470,730** |
| adaptive PD | 14/20 | 10/20 | 4/20 | 170,278 | 340,556 / 851,390 |

```
strict     adaptive 2 wins 3 losses   McNemar p = 1.000
WebJudge   adaptive 1 win  4 losses   McNemar p = 0.375
tokens     +5,522/task   95% CI [−43,034, +56,650]   p = 0.815
```

Nothing separates. Not success, not tokens, under either label.

What *is* measurable is the cost of getting nowhere: 4.9 reveal round-trips per task against 0.80, 22% more model calls, a higher invalid-action rate. Cost per delivered success is 14% worse on the rule and 81% worse under the judge.

That is a weaker claim than "progressive disclosure is harmful," and a more decisive one for anyone deciding whether to build it: **the complexity buys nothing measurable.**

## Where the tokens were actually going

Before running that comparison I did something I should have done at the start — read the prompts my own harness was sending. They were on disk the whole time.

![What the baseline actually sent the model, per call](assets/posts/chart-context-waste.svg "Every shaded payload carries a full page snapshot. Half of the context was a page the model had already been given.")

Every action result carried a complete page snapshot. Not just `observe_page` — `click`, `type`, `navigate`, all of them. A single click response looked like this:

```
url                    30 chars
active_tab_index        1
tab_count               1
aria_snapshot      25,232      ← the entire page, again
```

The action's actual result is 32 characters. Payloads carrying a page snapshot were **84% of context**, and half of that was a page the model had already been sent on the previous turn.

So progressive disclosure was shaving a slice off each of many copies rather than removing the duplication. Sending page state only from observation tools cut context per call by 50% — more than twice what PD achieved, with no round-trips at all.

It also explains the whole project. PD's apparent advantage existed only against a wasteful baseline. Once the waste is gone, so is the advantage.

## The second thing I found by reading prompts

Consecutive model calls shared an identical prefix of exactly **one turn**. Only the system prompt and the task ever hit the prompt cache — 37% of input — while the rest, including a page snapshot that often had not changed at all, was repaid in full every call.

Two causes, both mine. The recent-turn window slid by one every call, so every turn shifted position. And the compaction summary — which sits ahead of every recent turn — stamped a running step count and the active subgoal into itself, so it changed on every request and invalidated everything behind it.

Advancing the boundary in chunks and freezing the summary between advances took the shared prefix from 1.0 turns to 10.0, and the cache hit rate from 37% to 51–57%. That reproduced at both N=2 and N=20.

**It is the only result in this project whose magnitude I trust**, and the reason is worth stating: cache hit rate is a per-call mechanical property. It does not depend on how the agent happened to wander. Every behaviour-dependent number here needed twenty tasks to say anything; this one was solid at two.

## How much of this is just my bug

Fair question, so I checked two widely used harnesses.

**[playwright-mcp](https://github.com/microsoft/playwright-mcp)** has the same shape — a click returns a page snapshot, confirmed in its own tests. But the cost is known and already mitigated: there is a `--snapshot-mode full|none` flag, and the README steers users toward a CLI over MCP because MCP means "loading … verbose accessibility trees into the model context."

**[browser-use](https://github.com/browser-use/browser-use)** avoids it structurally. There is no accumulating transcript of tool responses; it rebuilds a single state message each step, so the page appears exactly once. Its prompt builder even carries this comment:

> Per-step varying metadata (step counter, date) lives at the tail of the message so that everything above can in principle be treated as a cacheable prefix.

They were thinking about the same problem. They do still slide a history window with a changing "N previous steps omitted" marker in the middle of the message, which is the same cache-invalidation shape — so that half is at least partly live elsewhere.

So: the duplication is a known problem with a known fix, and I rediscovered it the expensive way. What I have that I could not find published is the *quantification* — 84% of context, half of it redundant, 37% → 55% cache — and the methodology for getting it.

## What I would tell someone starting this

**Read the prompts your harness sends before you optimise anything.** Mine were sitting in a log directory the entire time. Half of my context was duplication, and I spent weeks building a method to shave the other half.

**Find out what your success flag actually tests.** Mine tested whether the program finished. Three consecutive measurements each produced a confident headline that the next one destroyed, and only the third involved anything outside my own code.

**Know which of your metrics need a big N.** Run-to-run variance on a single task in this setup is 2.0–2.6× on step count — larger than every effect I was trying to measure. Total tokens, steps and success rate are hostage to that. Cache hit rate, context composition and uncached input per call are not, and they answered the questions that mattered in one short run instead of twenty.

**Average tokens per task is a metric you can win by failing.** An arm that gives up early looks wonderfully efficient. Cost per delivered success does not have that hole.

The method I set out to test does not work. The harness it was compensating for does now, and it is roughly half as expensive per call, which was never the result I was looking for and is the only one I would stand behind.
