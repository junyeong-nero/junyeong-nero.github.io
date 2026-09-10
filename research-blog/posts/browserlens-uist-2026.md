**BrowserLens has been submitted to the UIST 2026 Posters track.** This is the story behind our paper, *BrowserLens: Interactive Diagnosis of Web-Agent Trajectories with a Layered State–Action Graph*, joint work with Mingyu Kim and Seongkook Heo at UNIST.

Imagine asking a browser agent to find French startups from two Y Combinator batches that are currently hiring. It opens the directory, applies filters, visits company pages, and keeps working. Eventually, it stops because it has used up its step budget.

You have screenshots, tool calls, and a long transcript. You know how the run ended. But where did it stop making progress? Did a filter fail to apply? Did the agent keep revisiting companies it had already checked? Was a repeated visit useful verification, or was it trapped in a loop?

BrowserLens starts from that review problem. It reorganizes a recorded run around **the browser states the agent visited**, so a reviewer can find recurring structure and inspect the evidence behind it.

![Three panels show scattered visits in a linear log, their aggregation into a graph with a navigation cycle, and recorded before-and-after evidence for a no-op click.](assets/posts/browserlens/overview.png "Figure 1. The paper's overview figure: move from scattered log entries to a structural cue, then inspect the recorded evidence. A cue identifies somewhere to investigate; the reviewer still has to establish what happened.")

[Open Figure 1 at full resolution](assets/posts/browserlens/overview.png).

## Background: completing a task leaves another task behind

A browser agent uses a language model to turn an instruction into a sequence of browser operations: opening pages, clicking controls, entering text, and checking what changed. Its **trajectory** is the record of those observations and actions over time.

Research has developed several ways to study these agents. [Mind2Web](https://arxiv.org/abs/2306.06070) provides tasks and demonstrated action sequences across real websites. [WebArena](https://proceedings.iclr.cc/paper_files/paper/2024/hash/4410c0711e9154a7a2d26f9b3816d1ef-Abstract-Conference.html) provides a reproducible environment with functional websites and checks of task completion. [WebVoyager](https://aclanthology.org/2024.acl-long.371/) studies a multimodal agent interacting with live websites. These settings make it possible to ask how well agents perform, under different assumptions about the environment.

But a success rate does not explain an individual run. Even the success judgment needs care: the [Online-Mind2Web study](https://arxiv.org/abs/2504.01382) reports that agents' hallucinated final responses can mislead automatic evaluation, and that intermediate screenshots can matter for judging completion.

For someone building or studying an agent, the next task is therefore to reconstruct what happened. This is a human–computer interaction problem: how should an autonomous system expose its behavior to the person responsible for judging it?

## Two gaps in reviewing a browser agent

### The agent's plan does not tell us the browser's state

A plan might say “apply the filters” or “check each company's jobs.” That helps explain what the agent was trying to do. It does not establish whether the filter menu was open, which part of the page was visible, or whether the requested filter actually took effect.

[DiLLS](https://arxiv.org/abs/2602.05446), for example, organizes multi-agent behavior into activities, actions, and operations, making planning and execution easier to inspect. Our reading of this work suggests a complementary axis for browser diagnosis: **where the action happened**. A useful summary of intent still needs browser evidence to answer a state-specific question.

Think of a click on a filter control. On one screen it may open the menu. On another it may be intercepted by an overlay. The action description alone cannot distinguish those outcomes. We call this the **environment-axis gap**.

### A complete log can still hide a pattern

Suppose the log already includes the URL, screenshot, and action at every step. That solves an evidence-availability problem, but leaves a representation problem.

In a sequence such as `directory → company A → company B → company A → company B`, every visit occupies another position on the timeline. A reviewer has to recognize the repeated pages, remember earlier visits, and piece together the cycle. The records can be complete while the relationship between them remains difficult to see.

We call this the **linear-trace gap**. It becomes especially relevant when a failure spans many steps: revisits, navigation loops, or repeated attempts that leave the page unchanged.

The two gaps lead to three design goals: make browser state an explicit unit of review; expose structure across distant steps with a path from overview to detail; and connect suspicious structure to evidence without prematurely declaring failure.

## Where BrowserLens fits

BrowserLens builds on several lines of research, each answering a different part of the problem.

Agent diagnosis tools already go beyond a raw transcript. Alongside DiLLS, [AgentDiagnose](https://aclanthology.org/2025.emnlp-demos.15/) evaluates agent competencies and provides views such as action embeddings and state-transition timelines. BrowserLens focuses on interactive inspection of one run through recurring browser-state identities. This is a choice of diagnostic unit, rather than a claim that earlier tools have no structure or no browser support.

Visualization research also offers precedents. [LifeFlow](https://www.cs.umd.edu/projects/hcil/lifeflow/) aggregates event sequences to make temporal patterns inspectable. [ScreenTrack](https://doi.org/10.1145/3313831.3376753) uses a visual history of the screen to help people retrieve previously used documents and pages. These projects address different tasks, but motivate a useful design direction: reorganize history around meaningful units while preserving access to detail.

Our contribution brings that direction to the diagnosis of browser-agent runs: a layered index of visited states, visual cues for recurring structure, and a synchronized route back to the recorded evidence.

## The representation: page, viewport, action

BrowserLens organizes a single logged trajectory into **three graph layers**. At each layer, visits with the same deterministic identity are grouped into one node. Edges preserve movement at the corresponding scale.

![Three stacked graph layers depict movement between pages, scrolling between viewports within a selected page, and actions within a selected viewport. Dashed connectors indicate drill-down rather than time. A separate evidence strip shows the original records available for inspection.](assets/posts/browserlens/graph-stack.svg "Figure 2. A schematic of the graph stack, using an illustrative shopping task. Each layer is a graph. Solid arrows show recorded transitions; dashed connectors show drill-down. The graph indexes original evidence rather than storing screenshots inside its nodes.")

[Open Figure 2 at full resolution](assets/posts/browserlens/graph-stack.svg).

**URL: which page?** The top layer groups visits by normalized URL. The prototype removes fragments and tracking parameters while retaining and sorting other query parameters. Search terms, filters, and pagination therefore remain relevant to identity. Repeated visits can accumulate in one node instead of appearing only as distant timeline entries.

**Viewport: which visible region?** A viewport is the portion of a page visible in the browser window. Within a URL, BrowserLens uses viewport geometry and scroll position to distinguish these contexts. This adds a way to inspect movement within a page, even when the URL stays the same.

**State-anchored action: what was done there?** The lowest layer places tool calls and their arguments in the viewport context where they occurred. A click issued in one context is distinguished from a click issued elsewhere. The reviewer can inspect local action structure after narrowing down the relevant page and viewport.

This identity is a reproducible grouping rule, **not a guarantee that two visits are semantically identical**. The same URL and scroll position can contain a different modal, form value, or dynamic result. That is why the original records remain essential.

The graph acts as a diagnosis index over those records. Selecting a node lets the workspace retrieve the associated screenshots, DOM and ARIA snapshots, tool logs, model context, and replay artifacts. The DOM records page structure; ARIA snapshots expose the accessibility representation, including elements' roles and names. Together with screenshots, these provide different views of what the agent encountered.

## From a visual cue to a supported diagnosis

BrowserLens uses four visual cues:

- **Repeated node highlight:** visit counts, node size, and color draw attention to revisited identities.
- **Loop edge highlight:** marked cycle edges reveal paths returning to an earlier identity.
- **No-op node highlight:** an action marker points to explicit evidence of no recorded page progress.
- **Hidden-cue badge:** a collapsed parent summarizes cues in its lower layers, helping the reviewer decide where to drill down.

A reviewer follows **cue → tentative failure point → evidence**. The tentative failure vocabulary includes repeated state, repeated action, navigation loop, dead-end, navigation stuck, and grounding error. These are hypotheses to investigate, not labels automatically established by the graph.

A loop might mean the agent is stuck. It might also mean the agent is comparing two products. A repeated action could be a failed attempt, a correction, or a deliberate re-check. Several cues can point toward one hypothesis, and one cue can suggest several explanations.

The no-op cue is deliberately tied to before-and-after evidence. In the current prototype, it requires no difference under the normalized DOM and ARIA comparison and a screenshot difference of at most 1% under the implemented image comparison. Returning to the same URL alone is insufficient. These are comparisons of captured artifacts, however; they cannot prove that no hidden application state changed.

## A walkthrough: a directory search that keeps circling

The paper illustrates a recorded Y Combinator directory task: find startups from the 2022 and 2023 batches, headquartered in France, with open jobs. This particular run ended with `exceeded max steps` after **98 tool calls**. These numbers describe one demonstration trace, not an aggregate benchmark result.

At the URL layer, a company page has accumulated **35 visits**, and the graph exposes a circuit between company pages. That is a useful place to begin reviewing: repeated movement is now visible without manually matching every occurrence in the transcript.

![The actual BrowserLens URL graph shows company-page nodes, repeated visits, highlighted cycle edges, and badges for cues within collapsed layers. The task and plan remain visible beside the graph.](assets/posts/browserlens/url-graph.png "Figure 3. The prototype's URL layer provides an overview of the recorded directory run. A highly visited node narrows the review target; its prominence does not by itself explain whether the revisits were necessary.")

[Open Figure 3 at full resolution](assets/posts/browserlens/url-graph.png).

Drilling into the directory page's actions reveals an “All batches” click with a no-op marker. Its evidence panel reports unchanged DOM and ARIA and no detected screenshot difference. The immediate conclusion is narrow but concrete: **the captured page evidence shows no change after this click**.

That observation supports investigating navigation stuck or a grounding error. It does not settle which mechanism caused the ineffective click, or prove that this click alone explains the entire failed run. The reviewer needs the target, tool arguments, surrounding steps, and available model context to make that causal argument.

![The BrowserLens action layer shows an All batches click with a no-op marker. The right-hand evidence panel displays unchanged DOM and ARIA, zero screenshot difference, a before-and-after comparison, and supporting action context.](assets/posts/browserlens/action-evidence.png "Figure 4. Drilling down brings a local action and its recorded evidence into the same workspace. This is an actual prototype screenshot; the evidence supports a local no-progress observation, while the root-cause interpretation remains a reviewer judgment.")

[Open Figure 4 at full resolution](assets/posts/browserlens/action-evidence.png).

The timeline remains available throughout. Graph aggregation helps locate recurring structure; the chronological record helps reconstruct the order of events once the reviewer has selected somewhere to investigate.

## What the poster establishes, and what remains to evaluate

The poster presents a representation, an implemented workspace, and a walkthrough grounded in a logged run. **It does not report a completed user study or establish that BrowserLens makes diagnosis faster or more accurate.**

The prototype supports read-only review of logging-enabled live sessions and saved sessions. The poster's walkthrough concerns a completed run. It does not demonstrate automatic agent repair, steering, or universal compatibility with arbitrary external logs.

Our next evaluation asks how the representation changes reviewers' reasoning. The planned comparison uses three interfaces: a linear step viewer; that viewer with orientation and linked evidence; and the full BrowserLens workspace with graph and cues. Think-aloud review and retrospective interviews can reveal when a graph helps someone notice a pattern, when evidence changes their explanation, and when a cue misleads them.

The broader study plan introduces the interfaces in a fixed order and rotates trajectory groups across conditions. That supports qualitative comparison, but leaves learning and order effects. Each interface increment also adds multiple features together, so it would not isolate the causal effect of an individual cue or panel. Any eventual claims need to match those limits.

## Current limits and the next research questions

**State identity can both merge too much and split too much.** Two meaningful application states can share a URL and viewport. Conversely, volatile query parameters can split visits that a person would consider equivalent. Similarity-aware grouping and inspectable explanations of why visits were merged are promising directions, but the current deterministic rules do not solve semantic equivalence.

**Visible change is not the same as task progress.** A wrong click may substantially change the page. A correct action may update hidden state or produce a delayed result outside the captured interval. A quiet graph cannot certify success, and a busy graph cannot certify failure. Task requirements and original evidence remain necessary.

**The diagnosis is bounded by what was logged.** Missing screenshots, tool results, or browser states cannot be reconstructed reliably from the graph. Recorded model context can help explain an action choice; it does not reveal an unrecorded internal reasoning process. Non-browser operations also need their own instrumentation and representation.

**Portability and scale still need evidence.** The workspace has been developed around one reference agent runtime. Adapting other frameworks requires translating their logs into the expected trajectory records and checking evidence alignment. We also need to investigate how well the interface works on much longer or denser runs and across multiple runs.

**A visual signal can become an anchor for a mistaken explanation.** Reviewers may over-trust highlighted nodes or overlook failures with no prominent cue. Evaluation should include benign revisits, misleading cues, and missing evidence, alongside cases where the design works well. Logged URLs, screenshots, form contents, and model context can also contain sensitive information; sharing and redaction are practical constraints on real deployment.

These questions motivate the next stage of BrowserLens. Before asking a reviewer to intervene in an autonomous run, we need to understand whether they can reliably explain the run they are looking at. This poster offers a concrete workspace for studying that question: recurring browser states make a pattern visible, and recorded evidence gives the reviewer a way to challenge it.

## References

The links below point to publisher records, author-hosted project pages, or author-submitted papers. Bibliographic details and the claims cited above were checked against those primary sources on September 11, 2026.

1. Xiang Deng, Yu Gu, Boyuan Zheng, Shijie Chen, Sam Stevens, Boshi Wang, Huan Sun, and Yu Su. **Mind2Web: Towards a Generalist Agent for the Web.** NeurIPS, 2023. [Proceedings](https://proceedings.neurips.cc/paper_files/paper/2023/hash/5950bf290a1570ea401bf98882128160-Abstract-Datasets_and_Benchmarks.html) · [Paper](https://arxiv.org/abs/2306.06070).
2. Shuyan Zhou, Frank F. Xu, Hao Zhu, Xuhui Zhou, Robert Lo, Abishek Sridhar, Xianyi Cheng, Tianyue Ou, Yonatan Bisk, Daniel Fried, Uri Alon, and Graham Neubig. **WebArena: A Realistic Web Environment for Building Autonomous Agents.** ICLR, 2024. [Proceedings and paper](https://proceedings.iclr.cc/paper_files/paper/2024/hash/4410c0711e9154a7a2d26f9b3816d1ef-Abstract-Conference.html).
3. Hongliang He, Wenlin Yao, Kaixin Ma, Wenhao Yu, Yong Dai, Hongming Zhang, Zhenzhong Lan, and Dong Yu. **WebVoyager: Building an End-to-End Web Agent with Large Multimodal Models.** ACL, 2024, pp. 6864–6890. [ACL Anthology](https://aclanthology.org/2024.acl-long.371/).
4. Tianci Xue, Weijian Qi, Tianneng Shi, Chan Hee Song, Boyu Gou, Dawn Song, Huan Sun, and Yu Su. **An Illusion of Progress? Assessing the Current State of Web Agents.** COLM, 2025. [Paper, including Online-Mind2Web](https://arxiv.org/abs/2504.01382).
5. Rui Sheng, Yukun Yang, Chuhan Shi, Yanna Lin, Zixin Chen, Huamin Qu, and Furui Cheng. **DiLLS: Interactive Diagnosis of LLM-based Multi-agent Systems via Layered Summary of Agent Behaviors.** CHI, 2026. [DOI](https://doi.org/10.1145/3772318.3790815) · [Paper](https://arxiv.org/abs/2602.05446).
6. Tianyue Ou, Wanyao Guo, Apurva Gandhi, Graham Neubig, and Xiang Yue. **AgentDiagnose: An Open Toolkit for Diagnosing LLM Agent Trajectories.** EMNLP System Demonstrations, 2025, pp. 207–215. [ACL Anthology](https://aclanthology.org/2025.emnlp-demos.15/).
7. Krist Wongsuphasawat, John Alexis Guerra Gómez, Catherine Plaisant, Taowei David Wang, Meirav Taieb-Maimon, and Ben Shneiderman. **LifeFlow: Visualizing an Overview of Event Sequences.** CHI, 2011, pp. 1747–1756. [Author project and publication record](https://www.cs.umd.edu/projects/hcil/lifeflow/).
8. Donghan Hu and Sang Won Lee. **ScreenTrack: Using a Visual History of a Computer Screen to Retrieve Documents and Web Pages.** CHI, 2020, pp. 1–13. [DOI](https://doi.org/10.1145/3313831.3376753) · [Paper](https://arxiv.org/abs/2001.10898).
