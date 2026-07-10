# Expert Personas Don't Improve Factual Accuracy

## TL;DR

This paper systematically tests whether assigning expert personas to LLMs improves factual accuracy on difficult multiple-choice questions (GPQA Diamond, MMLU-Pro). Across six models (GPT-4o, GPT-4o-mini, o3-mini, o4-mini, Gemini 2.0 Flash, Gemini 2.5 Flash), expert personas consistently fail to improve accuracy. Low-knowledge personas (toddler, layperson) often degrade performance. The main exception is Gemini 2.0 Flash on MMLU-Pro, which shows modest gains from expert personas.

Source: [arXiv:2512.05858](https://arxiv.org/abs/2512.05858), [PDF](https://arxiv.org/pdf/2512.05858.pdf)

## Background

Major AI providers (Google Vertex AI, Anthropic, OpenAI) recommend persona prompting as a best practice in their official documentation. The idea is intuitive: telling a model "you are a physics expert" should activate knowledge patterns associated with that role. However, independent research on persona-based prompting shows mixed and inconsistent results (Kong et al. 2024 found some gains; Zheng et al. 2024 found no reliable improvement). The prompting science community has been moving from anecdotal "hacks" toward rigorous, reproducible testing.

## Problem

Does assigning persona prompts to LLMs improve factual accuracy on difficult objective questions? The paper asks three specific sub-questions:

1. **In-domain experts**: Does a physics expert persona improve performance on physics questions?
2. **Off-domain experts**: Does a physics expert persona affect performance on law questions?
3. **Low-knowledge personas**: Do personas like "layperson" or "toddler" reduce accuracy?

The null hypothesis is that persona prompts produce no measurable accuracy difference relative to a no-persona baseline.

## Method

**Models**: GPT-4o, GPT-4o-mini, o3-mini, o4-mini, Gemini 2.0 Flash, Gemini 2.5 Flash.

**Benchmarks**: GPQA Diamond (198 PhD-level questions across biology, physics, chemistry) and a 300-question MMLU-Pro subset (engineering, law, chemistry). Both are challenging—PhDs average 65% on GPQA Diamond; skilled non-experts with web access reach only 34%.

**Design**: 25 independent responses per question per model-prompt condition (4,950 runs per model-prompt pair for GPQA, 7,500 for MMLU-Pro). Temperature set to 1.0. Primary metric: average rating (fraction correct over 25 trials). Additional stricter thresholds (100%, 90%, 51% correct) reported in supplementary.

**Prompt conditions**:

- **Baseline**: No persona, just question + answer options.
- **Expert personas**: Domain-specific ("You are a world-class expert in physics..."), domain-adjacent, and domain-unrelated.
- **Low-knowledge personas**: Layperson, Young Child, Toddler.

## Experiments

### Overall Results

Across both benchmarks, persona prompts had little to no effect on factual accuracy. Most persona conditions produced performance statistically indistinguishable from baseline. When significant changes occurred, they were more often negative than positive.

On **GPQA Diamond**:
- No expert persona reliably improved performance for any model.
- The only significant positive effect was a small gain for "Young Child" on Gemini 2.5 Flash (RD = 0.098, p = 0.005)—likely a model-specific quirk.
- Low-knowledge personas reduced accuracy on o4-mini (all three) and GPT-4o (Toddler).

On **MMLU-Pro** (300 subset):
- For 5 of 6 models, no expert persona showed positive significant improvement.
- Nine statistically significant negative differences observed.
- **Gemini 2.0 Flash** was the sole exception: all five expert personas produced modest positive gains (e.g., Engineering Expert RD = 0.089, p = 0.002).
- Toddler and Layperson worsened results.

### Domain-Specific Analysis

Aligning expert personas with the question domain (in-domain expert) did not generally improve performance:
- GPQA Diamond: No positive significant differences for any in-domain, adjacent, or unrelated expert.
- MMLU-Pro: Gemini 2.0 Flash improved in Engineering and Chemistry for all variations; GPT-4o improved in Law for in-domain expert. These are model-specific rather than generalizable.

### Failure Mode: Domain-Mismatched Refusals

A notable failure mode emerged in the Gemini Flash family. When given an out-of-domain expert persona, Gemini 2.5 Flash frequently refused to answer, asserting it lacked relevant expertise or "cannot, in good conscience" select an answer—averaging 10.56 refusals out of 25 trials per question on GPQA Diamond in the Unrelated Expert condition. This illustrates a broader risk: overly narrow role instructions can cause models to under-utilize their actual knowledge.

## Critical Analysis

**Strengths**:
- Rigorous methodology: 25 trials per condition, proper confidence intervals, multiple models and benchmarks.
- Tests the practical advice given by major AI providers, making results directly actionable.
- Clear negative result that challenges a widespread prompting practice.
- Examines both beneficial and harmful directions (expert vs. low-knowledge personas).

**Limitations**:
- Only tests multiple-choice factual accuracy; personas may serve other purposes (tone, reasoning approach, user experience) that are not captured.
- Limited model subset; results may not generalize to all LLMs.
- Academic benchmarks may not reflect real-world usage where context, instructions, and tasks are more varied.
- Single persona format tested; more elaborate or differently framed personas might produce different results.
- Zero-shot setting only; few-shot persona prompting could behave differently.

**Broader implications**: The results suggest persona prompting is not a reliable mechanism for improving factual accuracy. Practitioners may get more value from task-specific instructions, examples, or evaluation workflows than from adding expert personas to prompts.

## Implementation Notes

- If you must use personas, do not expect accuracy gains—they are unlikely.
- Low-knowledge personas (especially "Toddler") can actively harm performance and should be avoided.
- Gemini 2.5 Flash with mismatched expert personas may refuse to answer, reducing effective coverage.
- The one exception (Gemini 2.0 Flash on MMLU-Pro) suggests model-specific effects exist but are not predictable.
- For production, invest in task-specific instructions and evaluation workflows rather than persona engineering.

## Captured Figures and Tables

No figures or tables were captured. The paper is a single PDF with embedded figures, and no separate figure files were available in the arXiv source.
