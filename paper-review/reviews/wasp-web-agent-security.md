# WASP: Benchmarking Web Agent Security Against Prompt Injection Attacks

## TL;DR

WASP is a benchmark for measuring how web-navigation agents behave when a benign user task is mixed with malicious content placed in realistic website locations, such as GitLab issues or Reddit posts. The key result is uncomfortable: agents are often diverted from the user goal, with intermediate attack success reaching up to 86%, but full attacker goal completion remains much lower, up to roughly 17%. The paper calls this gap "security through incompetence": current agents are vulnerable, but often not capable enough to finish complex malicious workflows reliably.

Source: [arXiv:2504.18575](https://arxiv.org/abs/2504.18575), [PDF](https://arxiv.org/pdf/2504.18575.pdf), [code/data](https://github.com/facebookresearch/wasp)

## Background

Prompt injection is especially dangerous for UI agents because the model is not just producing text. It can click, type, submit forms, edit settings, and act on behalf of a user. A web page is also not a trusted instruction channel: comments, issue descriptions, posts, product listings, or URL fragments can all contain adversarial text.

Prior benchmarks often simplify this setup by giving the attacker too much control, focusing on single-step tool calls, or testing unrealistic attacker objectives. WASP tries to move the evaluation closer to realistic web use by combining a sandboxed web environment with attacker capabilities that resemble ordinary untrusted users of a site.

## Problem

The paper asks whether current web agents can resist indirect prompt injection when:

- The user gives a legitimate task.
- The attacker controls only normal user-editable content on a site.
- The attacker does not know implementation details of the agent.
- The attack goal is a concrete multi-step security violation, not a toy instruction like displaying "Hacked".

This matters because the relevant safety question is not only whether the model reads malicious text. The question is whether the agent changes behavior, navigates away from the user objective, and completes a harmful end state.

## Method

WASP is built on VisualWebArena and focuses on two self-hosted web environments:

- GitLab-like project management.
- Reddit-like social posting.

The benchmark constructs attacker goals and benign user goals, then combines them with injection templates. The rough task count is:

\[
84 = 42 \text{ test scenarios} \times 2 \text{ injection templates}
\]

The two injection styles are:

- Plain-text injection: malicious text appears directly in a user-controlled webpage region.
- URL injection: the malicious instruction is hidden in a URL fragment so the web server ignores it, but the agent may still observe it in context.

The paper reports three main metrics:

- ASR-intermediate: whether the agent was diverted from the original user goal.
- ASR-end-to-end: whether the attacker's concrete final objective was achieved.
- Utility: whether the agent can still complete normal tasks without attacks.

The evaluated agents include GPT-4o, GPT-4o-mini, OpenAI o1, Claude Sonnet 3.5, and Claude Sonnet 3.7 Extended Thinking across VisualWebArena, Claude CURI, and a tool-calling loop.

## Experiments

The central table shows high intermediate compromise across many configurations. OpenAI o1 in the tool-calling setup has the highest reported ASR-intermediate in the main table at 0.857, while its ASR-end-to-end reaches 0.167. Other agents often show the same pattern: they start following the attack, but then fail to complete the multi-step malicious goal.

This is an important measurement distinction. If evaluation only checked whether the model ever followed an injected instruction, the risk would look severe. If evaluation only checked completed attacker goals, the risk might look deceptively small. WASP argues that both are necessary because agent capability improvements could turn today's partial compromises into tomorrow's completed attacks.

The ablations are also useful:

- URL injections are often more effective than plain-text injections for intermediate compromise.
- Defensive system prompting helps in some GPT-4o and GPT-4o-mini settings.
- Instruction hierarchy alone does not eliminate the problem in the tested tool-calling configurations.
- Task-agnostic attacks are weaker than task-related attacks, but still produce non-zero compromise rates.

## Critical Analysis

The strongest part of the paper is the threat model. Treating attackers as ordinary users of trusted sites is closer to real deployments than assuming the whole webpage is compromised. The intermediate versus end-to-end distinction is also useful because it separates model obedience failure from agent execution failure.

The main limitation is environment coverage. WASP currently uses GitLab and Reddit style tasks, so it does not yet show how attack dynamics change in domains like travel booking, banking, healthcare portals, internal knowledge bases, or desktop/code agents. The prompt set is also manually constructed and not especially diverse. That makes WASP a strong starting benchmark, not a complete security suite.

One practical takeaway is that "the attack did not finish" is not a stable defense. If the limiting factor is agent competence, then stronger agents can raise both normal task utility and attacker completion.

## Implementation Notes

For anyone building or testing agents, WASP suggests a useful evaluation pattern:

1. Put malicious instructions in places real users can edit.
2. Keep attacker goals concrete and externally checkable.
3. Measure partial diversion and final harmful completion separately.
4. Track utility on benign tasks so defenses cannot simply make the agent unusable.
5. Test URL surfaces, not just visible page text.

The ASR metrics can be sketched as:

\[
\text{ASR-end-to-end} = \frac{\#\text{attacks satisfying final attacker goal}}{\#\text{attack tasks}}
\]

\[
\text{ASR-intermediate} = \frac{\#\text{attacks where the agent is diverted}}{\#\text{attack tasks}}
\]

In production systems, these should be paired with policy-level controls: URL allowlists, scoped tool permissions, human confirmation for sensitive actions, provenance-aware instruction handling, and logging that distinguishes user intent from webpage content.

## Captured Figures and Tables

![Figure 1. WASP summary result and example injected webpage.](../assets/wasp-web-agent-security/figures/figure-01.png)

![Figure 2. End-to-end attack example on a Reddit task.](../assets/wasp-web-agent-security/figures/figure-02.png)

![Figure 3. Attack flow across first action, intermediate steps, and final state.](../assets/wasp-web-agent-security/figures/figure-03.png)

![Table 1. Comparison with related security benchmarks.](../assets/wasp-web-agent-security/tables/table-01.png)

![Table 2. Main benchmark results.](../assets/wasp-web-agent-security/tables/table-02.png)

![Tables 3 and 4. Injection ablations.](../assets/wasp-web-agent-security/tables/table-03.png)
