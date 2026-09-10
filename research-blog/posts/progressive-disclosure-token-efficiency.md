Can a browser agent use fewer tokens by receiving only the page information it needs at each step? I investigated this question through **progressive observation disclosure**: keeping the full browser state outside the model and exposing a smaller working set on demand.

The experiments led to a more specific question: **which parts of an observation can be removed without adding work or withholding information needed for the task?** Adaptive disclosure of whole elements did not show a measurable benefit on 20 paired tasks. Removing per-link URL attributes, by contrast, reduced tokens per task by approximately 22%, with a 95% confidence interval excluding zero.

Reaching that result required revising the success evaluator and inspecting the context assembled by the agent harness. This post documents those revisions, the resulting comparisons, and the limits of what they establish.

## Research question and experimental setup

Browser agents receive substantial context at each step: page observations, tool definitions, and interaction history. Progressive observation disclosure aims to reduce this cost by retaining the full page state in the controller and initially providing the model with a small set of grounded candidates. The model can request additional candidates when necessary.

I compared four conditions using the same tasks and browser setup:

- **Full observation:** the entire observation at every step, serving as the baseline.
- **Top-k:** a fixed cap of the k most relevant candidates, without subsequent disclosure.
- **Static PD:** a small initial working set, expanded through `reveal_candidates` calls.
- **Adaptive PD:** a working set whose budget increases after an undisclosed-reference error and decreases after a sequence of grounded actions without errors.

The tasks were Korean online-Mind2Web samples executed on live websites. The results below use GPT-5.4-mini; an earlier exploratory pass used a weaker free model. The main paired comparison focuses on full observation and adaptive PD.

## Establishing a meaningful success measure

### Run completion was being counted as task success

The initial harness marked a task as successful whenever the agent's plan terminated without a hard error:

```python
# build_task_complete_event
"status": "complete",
"task_success": True,      # Unconditional: records termination, not task completion.
```

This conflated execution status with task outcome. An agent that encountered a bot block and reported restricted access received a success label. So did a run whose final answer began `**TASK_FAILED** I was unable to navigate to the 상가·업무 tab`.

Under this evaluator, every condition scored 19/20 in the initial experiment. With little apparent variation in success, I interpreted the comparison primarily through token counts. That supported an early conclusion that disclosure helped the weaker model but added overhead for GPT-5.4-mini. The success labels did not justify that interpretation.

### A final-answer rule introduced language-dependent errors

I then added a rule that rejected answers containing explicit failure statements. In that evaluation, the full-observation result fell from 19/20 to 11/20, while adaptive disclosure scored 13/20 and appeared to perform best.

The rule was incomplete. It recognized 확인할 수 없 ("cannot confirm") and 찾을 수 없 ("cannot find"), but missed 진행할 수 없 ("cannot proceed"). Answers such as *"검색을 진행할 수 없습니다"*—"I cannot proceed with the search"—were still counted as successful.

The error affected the conditions unequally: it over-credited adaptive disclosure by five tasks and full observation by one. The apparent advantage therefore depended on differences in how agents phrased their failures.

### Trajectory-based evaluation changed the comparison

To evaluate task completion beyond the final answer, I integrated [WebJudge](https://github.com/OSU-NLP-Group/Online-Mind2Web), the trajectory evaluator used in Online-Mind2Web. It considers the task, action history, and screenshots when judging whether the requested outcome was achieved.

![Success counts under three evaluators for the paired comparison](assets/posts/chart-three-rulers.svg "The same trajectories receive different success labels depending on the evaluator. For full observation, reported completion gives 15/20, the strict final-answer rule gives 11/20, and WebJudge gives 7/20.")

In the paired comparison shown here, the strict rule and WebJudge agreed on 30 of 40 trajectories. All ten disagreements were rule passes that WebJudge rejected. This exposes a limitation of failure-pattern matching: it can detect an admission of failure, but cannot establish that a confident answer is correct.

WebJudge provides a task-oriented assessment, though it remains an automated evaluator rather than ground truth. I report both the corrected final-answer rule, labeled **strict**, and WebJudge below.

## Adaptive disclosure: no measurable benefit in the paired comparison

The comparison used 20 paired tasks:

| Condition | Reported completion | Strict success | WebJudge success | Tokens/task | Tokens per success (strict / judge) |
| --- | ---: | ---: | ---: | ---: | ---: |
| Full observation | 15/20 | **11/20** | **7/20** | 164,756 | **299,556** / **470,730** |
| Adaptive PD | 14/20 | 10/20 | 4/20 | 170,278 | 340,556 / 851,390 |

The paired results were:

```text
Strict success:    adaptive PD 2 wins, 3 losses; McNemar p = 1.000
WebJudge success:  adaptive PD 1 win, 4 losses; McNemar p = 0.375
Tokens/task:      +5,522; 95% CI [−43,034, +56,650]; p = 0.815
```

Neither success measure nor token use showed a statistically significant difference. The token interval is wide, so this result does not establish equivalence or rule out a meaningful effect.

Adaptive PD also incurred additional interaction overhead: 4.9 reveal round-trips per task versus 0.80 in the baseline, 22% more model calls, and a higher invalid-action rate. Its observed tokens per success were 14% higher under the strict rule and 81% higher under WebJudge. These ratios are descriptive and sensitive to the small number of successful runs.

**In this setup, the additional disclosure mechanism did not demonstrate an efficiency benefit.** That is a narrower conclusion than claiming that progressive disclosure is ineffective in general.

## Context audit: repeated page snapshots

Inspecting the actual prompts revealed a separate source of cost. Every action result carried a complete page snapshot, including responses from `click`, `type`, and `navigate`, as well as `observe_page`.

![Composition of model-facing context in the full-observation baseline](assets/posts/chart-context-waste.svg "Across 86 model calls, payloads containing page snapshots accounted for 84% of context. Previously supplied page content accounted for approximately half of all context, measured in characters.")

One click response contained:

```text
Field                  Characters
url                            30
active_tab_index                1
tab_count                       1
aria_snapshot              25,232
```

The non-snapshot fields occupied 32 characters, alongside a 25,232-character page representation. Across the audited calls, snapshot-bearing payloads accounted for **84% of context**, and approximately half of all context repeated page content already supplied to the model.

Restricting page-state output to observation tools reduced context per call by approximately 50%, without introducing disclosure round-trips. This is a character-based context reduction; it should be distinguished from the task-level token results above.

The audit changed how I interpreted observation compression. Reducing individual snapshots can leave substantial duplication intact. The baseline's context assembly therefore needs to be examined before attributing savings to a disclosure policy.

## Prompt caching: preserving a stable prefix

The same audit found that consecutive model calls shared an identical prefix of only **one turn**. The system prompt and task benefited from caching, but much of the remaining context was processed again even when its content had changed little. The observed cache hit rate was 37%.

Two harness behaviors limited prefix reuse. First, a recent-turn window advanced on every call, shifting the position of historical messages. Second, a compaction summary placed before that history included the current step count and active subgoal. Updating those fields changed the prefix ahead of otherwise reusable content.

Advancing the history boundary in chunks and keeping the summary stable between advances increased the shared prefix from 1.0 to 10.0 turns. Cache hit rates rose from 37% to 51–57%, with the improvement observed in both two-task and twenty-task runs.

Prefix stability offers a directly inspectable explanation for this change. The realized cache hit rate still depends on request composition and execution conditions, however; a small diagnostic run does not establish a general task-level cost reduction.

## How these issues relate to other harnesses

I also inspected [playwright-mcp](https://github.com/microsoft/playwright-mcp) and [browser-use](https://github.com/browser-use/browser-use) to understand whether these behaviors were specific to my implementation.

In the playwright-mcp implementation I examined, clicks also returned page snapshots. It provided a `--snapshot-mode full|none` option, making snapshot verbosity an existing configuration concern.

The browser-use implementation used a different structure: it rebuilt a single state message at each step rather than accumulating page snapshots in tool responses. Its prompt builder also placed per-step metadata toward the end of the message to preserve a cacheable prefix. A sliding history window and changing omitted-step marker could still affect prefix reuse.

These observations place the harness changes in context. Avoiding duplicated state and preserving stable prefixes are existing engineering practices. The measurements here illustrate their impact in this particular setup; they do not establish a new general solution to context management.

## Attribute-level pruning reduced token use

After examining how snapshots accumulated, I inspected their contents. Across **69 distinct snapshots totaling 1.48 million characters**, the breakdown was:

| Snapshot content | Share of characters |
| --- | ---: |
| `- /url: ...` child lines | **28.9%** |
| `read-only` node lines | 43.8% |
| Actionable nodes and remaining content | 27.3% |

Playwright emitted a `/url:` child line beneath each link. The agent interacted through element references such as `click_by_ref(e2)`, so the click interface did not require these URLs. This suggested a narrower intervention: remove the URL attribute while retaining the link and its reference.

This tests observation reduction at the attribute level. Unlike the element-level PD conditions, it uses static pruning and does not require the model to request hidden information.

![Paired changes in tokens per task for element disclosure and URL-attribute pruning](assets/posts/chart-two-interventions.svg "Dots indicate paired mean differences and bars indicate 95% bootstrap confidence intervals. The URL-pruning interval excludes zero; the adaptive-disclosure interval does not.")

```text
Adaptive element disclosure:  +5,522 tokens/task; 95% CI [−43,034, +56,650]; p = 0.815
URL-attribute pruning:       −36,090 tokens/task; 95% CI [−65,130,  −9,150]; p = 0.006
```

Using the same 20 paired tasks, model, and analysis, URL pruning reduced tokens per task by approximately **22%**. Step count was 0.910 times the baseline, and strict success changed from 11/20 to 12/20. The observed success count did not decline, but this small sample does not establish non-inferiority. No reveal round-trips were introduced.

This was the only task-level token comparison reported here whose confidence interval excluded zero. The result is consistent with reducing observation size without adding retrieval interactions. Reference-based clicking explains why URLs were a plausible pruning target, but does not prove that URL text is irrelevant to every task or model decision.

The distinction matters: **the utility of the removed information, and the work required to recover it, are central to evaluating observation reduction.**

## Follow-up checks: answer-bearing text and cache boundaries

### Read-only text contained information needed for answers

Read-only nodes accounted for 43.8% of snapshot characters, making them another potential compression target. Before removing them, I traced successful answers back to the page content.

Of twelve successful answers examined, **six had their answer content only in read-only nodes; none had it only in actionable nodes**. Among answer tokens that could be located in the page, 51% were available only through read-only nodes.

These findings argue against removing read-only text wholesale. Although such nodes do not support direct interaction, they can supply the information the task asks the agent to retrieve. This was a content audit, not an ablation measuring the effect of deletion on task success.

### A wider cache boundary did not reproduce simulated savings

The revised history policy still interrupted prefix reuse at each boundary, approximately once every four calls. A simulation suggested that widening the boundary could increase the cached share from 70% to 82% and reduce cost by 9%.

A five-task check showed a different outcome: cache hit rate moved from 56% to 55%, context grew by 21%, and token use grew by 38%. The simulation assumed regularly spaced observations and similar message sizes; the live trajectories did not follow those assumptions.

The small check was sufficient to question the proposed change, even though it does not precisely estimate the regression. Cache reuse needs to be evaluated alongside the additional history retained to obtain it.

## Practical implications and limits

These experiments suggest a sequence for investigating browser-agent efficiency:

1. **Inspect the context actually sent to the model.** Measure duplication and payload composition before designing a compression policy.
2. **Separate execution status from task completion.** Final-answer rules are useful diagnostics, but language coverage and confidently incorrect answers limit their reliability.
3. **Report task outcomes alongside token use.** Early failure can reduce average tokens per task. Tokens per success provide another view, although the ratio becomes unstable when successes are few.
4. **Match the measurement to the question.** Prefix structure and context composition can be inspected directly. Task-level tokens, steps, and success require paired runs and uncertainty estimates; observed step-count variation on a single task was 2.0–2.6× in this setup.
5. **Check what the removed content contributes.** Action arguments, navigation cues, and answer-bearing text have different roles, even when they occupy similar amounts of context.

The main comparison covers 20 paired tasks on live websites with one model. Automated success judgments, trajectory variability, and the limited sample constrain broader claims. The separate context, caching, and pruning measurements also should not be added together as though they establish a single combined reduction in task cost.

The strongest task-level result here is the reduction from URL-attribute pruning. Adaptive element disclosure did not show a measurable benefit, while the context audit identified substantial duplication and opportunities for prefix reuse. Together, these findings motivate a more targeted research question: **how can an agent's observation preserve the information needed for action and verification while reducing redundant or unnecessary content?**
