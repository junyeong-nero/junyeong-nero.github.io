## TL;DR

- The question was whether a browser agent uses fewer tokens when it receives only the page information it needs. The answer depends entirely on what gets removed.
- Adaptive disclosure of whole page elements showed no measurable benefit on 20 paired tasks: +5,522 tokens/task, 95% CI [−43,034, +56,650], p = 0.815, while adding 4.9 reveal round-trips per task and 22% more model calls.
- Pruning the per-link `/url:` attribute cut **36,090 tokens/task, about 22%**, 95% CI [−65,130, −9,150], p = 0.006, with no round-trips and no drop in success. It is the only task-level token result here whose interval excludes zero.
- The success evaluator had to be fixed twice. Counting run completion gave 19/20 everywhere, a final-answer rule had language-dependent holes, and the trajectory judge scored full observation at 7/20 where reported completion gave 15/20.
- A context audit found the bigger cost was duplication, not snapshot size: payloads carrying page snapshots were 84% of context and about half of all context was page content the model had already seen. Stabilizing the prompt prefix raised the cache hit rate from 37% to 51–57%.
- Read-only text cannot be cut wholesale despite being 43.8% of snapshot characters: 51% of locatable answer tokens were available only there.

A browser agent gets a fresh bundle of context at every step: the page observation, tool definitions, and interaction history. I wanted to know how much of that page information it really needed. I tried progressive observation disclosure: keep the full browser state in the controller and let the model request a smaller set of relevant elements as it works.

Across 20 paired tasks, adaptive disclosure of whole page elements showed no measurable benefit. A smaller change worked better: removing the per-link URL attribute cut tokens per task by about 22%, with a 95% confidence interval that excludes zero. That shifted my attention from how much information to hide to which information the agent could do without.

Getting there took longer than I expected. My first success evaluator counted failed tasks as successes. Once I corrected it and inspected the prompts, I also found that the harness was repeatedly sending page content the model had already seen. Both problems changed how I read the experiment.

## Setup

Progressive disclosure keeps the full page state in the controller and initially gives the model a small set of grounded candidates. The model can ask for more when it needs them. I compared four conditions on the same tasks and browser setup:

- Full observation: the entire observation at every step. This is the baseline.
- Top-k: a fixed cap of the k most relevant candidates, with no way to request more.
- Static PD: a small initial working set, expanded through `reveal_candidates` calls.
- Adaptive PD: a working set whose budget grows after an undisclosed-reference error and shrinks after a run of grounded actions without errors.

The tasks were Korean online-Mind2Web samples run on live websites. The results below use GPT-5.4-mini; an earlier exploratory pass used a weaker free model. The main paired comparison is between full observation and adaptive PD.

## Getting the success measure right

### The harness counted run completion as task success

My first harness marked a task successful whenever the agent's plan terminated without a hard error:

```python
# build_task_complete_event
"status": "complete",
"task_success": True,      # Unconditional: records termination, not task completion.
```

The code recorded that the run had ended, regardless of whether the task was complete. An agent that hit a bot block and reported restricted access was labeled a success. So was a run whose final answer began `**TASK_FAILED** I was unable to navigate to the 상가·업무 tab`.

Under this evaluator every condition scored 19/20 in the initial experiment. With no visible variation in success, I read the comparison through token counts alone, and concluded early on that disclosure helped the weaker model but added overhead for GPT-5.4-mini. The success labels did not support that reading.

### A final-answer rule had language-dependent holes

Next I added a rule that rejected answers containing an explicit failure statement. Under it, full observation fell from 19/20 to 11/20, adaptive disclosure scored 13/20, and adaptive disclosure looked like the best condition.

The rule was incomplete. It caught 확인할 수 없 ("cannot confirm") and 찾을 수 없 ("cannot find") but missed 진행할 수 없 ("cannot proceed"), so an answer like *"검색을 진행할 수 없습니다"* ("I cannot proceed with the search") still counted as a success.

The missed wording affected the conditions unequally: it gave adaptive disclosure five extra successes and full observation one. What looked like an advantage for disclosure was largely a difference in how the agents described their failures.

### Judging the trajectory instead of the final answer

To judge completion from more than the final answer, I integrated [WebJudge](https://github.com/OSU-NLP-Group/Online-Mind2Web), the trajectory evaluator from Online-Mind2Web. It looks at the task, the action history, and the screenshots when deciding whether the requested outcome was achieved.

![Success counts under three evaluators for the paired comparison](assets/posts/chart-three-rulers.svg "The same trajectories get different success labels under different evaluators. For full observation, reported completion gives 15/20, the strict final-answer rule gives 11/20, and WebJudge gives 7/20.")

In the paired comparison, the strict rule and WebJudge agreed on 30 of 40 trajectories. All ten disagreements were rule passes that WebJudge rejected. That is the limit of failure-pattern matching: it can detect an admission of failure, but it cannot tell whether a confident answer is correct.

WebJudge is still an automated judge, not ground truth. I report both the corrected final-answer rule (labeled strict) and WebJudge below.

## Adaptive disclosure: no measurable benefit

On the 20 paired tasks:

| Condition | Reported completion | Strict success | WebJudge success | Tokens/task | Tokens per success (strict / judge) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Full observation | 15/20 | **11/20** | **7/20** | 164,756 | **299,556** / **470,730** |
| Adaptive PD | 14/20 | 10/20 | 4/20 | 170,278 | 340,556 / 851,390 |

Paired results:

```text
Strict success:    adaptive PD 2 wins, 3 losses; McNemar p = 1.000
WebJudge success:  adaptive PD 1 win, 4 losses; McNemar p = 0.375
Tokens/task:      +5,522; 95% CI [−43,034, +56,650]; p = 0.815
```

Neither success measure nor token use differed significantly. The token interval is wide, so this does not show equivalence either; a meaningful effect in either direction is still possible.

Adaptive PD also added interaction overhead: 4.9 reveal round-trips per task versus 0.80 in the baseline, 22% more model calls, and a higher invalid-action rate. Its tokens per success were 14% higher under the strict rule and 81% higher under WebJudge, though with so few successes those ratios are unstable.

For this implementation, model, and task set, adaptive disclosure added work without a measurable payoff. Other disclosure policies may behave differently, but these results gave me little reason to keep this one.

## Context audit: the same page snapshot, over and over

Reading the actual prompts showed a cost that had nothing to do with disclosure policy. Every action result, including the responses to `click`, `type`, and `navigate`, carried a complete page snapshot of the kind `observe_page` returns.

![Composition of model-facing context in the full-observation baseline](assets/posts/chart-context-waste.svg "Across 86 model calls, payloads containing page snapshots were 84% of context. Page content the model had already seen was about half of all context, measured in characters.")

One click response looked like this:

```text
Field                  Characters
url                            30
active_tab_index                1
tab_count                       1
aria_snapshot              25,232
```

The non-snapshot fields took 32 characters; the page representation took 25,232. Across the audited calls, payloads containing snapshots accounted for 84% of context, and roughly half of all context repeated page content the model had already received.

Restricting page-state output to observation tools cut context per call by about 50%, with no disclosure round-trips. That is a character-based measurement of context per call, separate from the task-level token results.

Before designing a better disclosure policy, I needed to fix how the harness assembled context. Even a small snapshot becomes expensive when it is sent repeatedly. Savings from removing that duplication also needed to be measured separately from savings due to disclosure.

## Prompt caching: keeping a stable prefix

The same audit found that consecutive model calls shared an identical prefix of only one turn. The system prompt and task were cached, but most of the rest was reprocessed on each call even when its content had barely changed. The observed cache hit rate was 37%.

Two harness behaviors were responsible. A recent-turn window advanced on every call, shifting the position of the historical messages. And a compaction summary placed ahead of that history included the current step count and active subgoal, so updating those fields invalidated the prefix in front of otherwise reusable content.

Advancing the history boundary in chunks and holding the summary fixed between advances raised the shared prefix from 1.0 to 10.0 turns. In the two-task and twenty-task runs, cache hit rates rose from 37% to 51–57%.

Prefix stability is a directly inspectable explanation for the change. The realized hit rate still depends on request composition and execution conditions, and a small diagnostic run does not establish a general task-level cost reduction.

## How other harnesses handle this

I looked at [playwright-mcp](https://github.com/microsoft/playwright-mcp) and [browser-use](https://github.com/browser-use/browser-use) to see whether these behaviors were specific to my implementation.

The playwright-mcp version I examined also returned page snapshots on clicks. It exposes a `--snapshot-mode full|none` option, so snapshot verbosity is already a recognized configuration concern there.

browser-use is structured differently. It rebuilds a single state message at each step instead of accumulating snapshots in tool responses, and its prompt builder puts per-step metadata toward the end of the message to preserve a cacheable prefix. A sliding history window and a changing omitted-step marker could still break prefix reuse.

These comparisons helped put my changes in perspective. Avoiding duplicate state and preserving stable prefixes are established engineering practices. The audit showed how much they mattered in my harness.

## Attribute-level pruning: the result that held

Having looked at how snapshots accumulate, I looked at what was in them. Across 69 distinct snapshots totaling 1.48 million characters:

| Snapshot content | Share of characters |
| --- | ---: |
| `- /url: ...` child lines | **28.9%** |
| `read-only` node lines | 43.8% |
| Actionable nodes and remaining content | 27.3% |

Playwright emits a `/url:` child line under every link. The agent interacts through element references such as `click_by_ref(e2)`, so the click interface never needs those URLs. That suggested a narrower intervention than element-level disclosure: drop the URL attribute, keep the link and its reference.

The change removes an attribute while retaining every element. It adds no request step: the model sees the same links and references, without the URL child lines.

![Paired changes in tokens per task for element disclosure and URL-attribute pruning](assets/posts/chart-two-interventions.svg "Dots are paired mean differences; bars are 95% bootstrap confidence intervals. The URL-pruning interval excludes zero; the adaptive-disclosure interval does not.")

```text
Adaptive element disclosure:  +5,522 tokens/task; 95% CI [−43,034, +56,650]; p = 0.815
URL-attribute pruning:       −36,090 tokens/task; 95% CI [−65,130,  −9,150]; p = 0.006
```

On the same 20 paired tasks, model, and analysis, URL pruning reduced tokens per task by about 22%. Step count was 0.910 times the baseline, and strict success moved from 11/20 to 12/20. Success did not drop, though a sample this small cannot establish non-inferiority. No reveal round-trips were introduced.

Of the task-level token comparisons here, only URL pruning produced a confidence interval that excludes zero. Reference-based clicking made URLs a reasonable candidate for removal, but URL text can still help a model understand a destination. The result supports this particular pruning choice on these tasks; it does not make URLs universally expendable.

## Two follow-up checks

### Read-only text carries answers

Read-only nodes were 43.8% of snapshot characters, the next obvious compression target. Before removing them I traced successful answers back to the page content.

Of twelve successful answers examined, six had their answer content only in read-only nodes, and none had it only in actionable nodes. Among answer tokens that could be located in the page, 51% were available only through read-only nodes.

That made wholesale removal of read-only text a poor next experiment. The agent often needs that text to answer the question, even when it cannot click it. This audit checked where answers came from; it did not measure task success after deleting the text.

### A wider cache boundary did not deliver the simulated savings

The revised history policy still broke prefix reuse at each boundary, roughly once every four calls. A simulation suggested that widening the boundary would raise the cached share from 70% to 82% and cut cost by 9%.

A five-task check said otherwise: cache hit rate went from 56% to 55%, context grew by 21%, and token use grew by 38%. The simulation assumed regularly spaced observations and similar message sizes, and the live trajectories did not look like that.

That five-task regression was enough for me to drop the change, though it gives only a rough estimate of the effect. A wider cache boundary also retains more history, and the extra context outweighed the hoped-for reuse in this check.

## What I would check first next time

If I were starting this study again, the order would be:

1. Inspect the context actually sent to the model. Measure duplication and payload composition before designing a compression policy.
2. Separate execution status from task completion. Final-answer rules are useful diagnostics, but language coverage and confidently wrong answers limit them.
3. Report task outcomes next to token use. Early failure lowers average tokens per task. Tokens per success is another view, though it becomes unstable when successes are few.
4. Match the measurement to the question. Prefix structure and context composition can be inspected directly. Task-level tokens, steps, and success need paired runs and uncertainty estimates; on a single task, step count varied 2.0 to 2.6 times between runs in this setup.
5. Check what the removed content was doing. Action arguments, navigation cues, and answer-bearing text play different roles even when they take up similar amounts of context.

The main comparison covers 20 paired tasks on live websites with one model. Automated success judgments, trajectory variability, and the small sample limit what can be claimed. The context, caching, and pruning measurements were made separately and should not be summed into a single combined reduction.

I would keep URL pruning as the most promising result from this study and start the next experiment with a context audit. The harder question remains: how can an observation retain what the agent needs to act and verify its answer, while leaving out information it already has or never uses?
