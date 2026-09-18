## TL;DR

- BrowserLens was submitted to the UIST 2026 Posters track, joint work with Mingyu Kim and Seongkook Heo at UNIST. This post covers the review problem, the representation, and the limits of what it shows.
- A finished browser-agent run tells you how it ended, not where it stopped making progress. Two gaps explain why: the agent's plan does not say what the browser's state was, and a complete linear log still hides patterns spread across distant steps.
- The representation is a three-layer graph over one recorded run: page, viewport, and action. Visits with the same deterministic identity collapse into one node, and the graph indexes the original screenshots, DOM and ARIA snapshots, and tool logs rather than replacing them.
- Four visual cues (visit counts, cycle edges, no-op markers, and badges on collapsed layers) point the reviewer at a place to look. The tool does not label failures; the reviewer forms a hypothesis and checks it against evidence.
- A walkthrough on a Y Combinator directory run that ended at `exceeded max steps` after 98 tool calls surfaces a company page visited 35 times and an "All batches" click whose captured evidence shows no page change.
- Not established: there is no user study, no claim that diagnosis becomes faster or more accurate, and portability and scale to longer runs are untested. State identity can also merge or split visits a person would judge differently.

We submitted BrowserLens to the UIST 2026 Posters track. The paper, *BrowserLens: Interactive Diagnosis of Web-Agent Trajectories with a Layered State–Action Graph*, is joint work with Mingyu Kim and Seongkook Heo at UNIST. It grew out of a question that comes up whenever a browser agent fails: with the entire run recorded, why is it still so hard to see what went wrong?

Suppose you ask a browser agent to find French startups from two Y Combinator batches that are currently hiring. It opens the directory, applies filters, visits company pages, and keeps going until it runs out of step budget.

You have screenshots, tool calls, and a long transcript. You can see how the run ended, but finding where it stopped making progress takes more work. Did a filter fail to apply? Did the agent keep revisiting companies it had already checked? Was a repeated visit useful verification, or was it stuck in a loop?

BrowserLens helps with that review. It groups a recorded run by the browser states the agent visited, making repeated visits easier to spot. A reviewer can start with a pattern in the graph, then open the records to see what happened.

![Three panels show scattered visits in a linear log, their aggregation into a graph with a navigation cycle, and recorded before-and-after evidence for a no-op click.](assets/posts/browserlens/overview.png "Figure 1. The paper's overview figure. A scattered log becomes a structural cue, and the cue points to recorded evidence. The cue tells the reviewer where to look; the reviewer still has to work out what happened.")

[Open Figure 1 at full resolution](assets/posts/browserlens/overview.png).

## Background: a finished run is the start of another task

A browser agent uses a language model to turn an instruction into a sequence of browser operations: opening pages, clicking controls, entering text, and checking what changed. Its trajectory is the record of those observations and actions over time.

There are several established ways to study these agents. [Mind2Web](https://arxiv.org/abs/2306.06070) provides tasks and demonstrated action sequences across real websites. [WebArena](https://proceedings.iclr.cc/paper_files/paper/2024/hash/4410c0711e9154a7a2d26f9b3816d1ef-Abstract-Conference.html) provides a reproducible environment with functional websites and checks of task completion. [WebVoyager](https://aclanthology.org/2024.acl-long.371/) studies a multimodal agent on live websites. Each lets us ask how well agents perform under some set of assumptions about the environment.

A success rate does not explain an individual run, though, and even the success judgment takes care. The [Online-Mind2Web study](https://arxiv.org/abs/2504.01382) reports that agents' hallucinated final responses can mislead automatic evaluation, and that intermediate screenshots matter for judging completion.

Once the run finishes, the person building or studying the agent still has to reconstruct what happened. That is the human-computer interaction problem behind BrowserLens: how can an autonomous system make its behavior easier for someone to judge?

## Two gaps in reviewing a browser agent

### The agent's plan does not tell you the browser's state

A plan might say "apply the filters" or "check each company's jobs." That explains what the agent was trying to do. It does not tell you whether the filter menu was open, which part of the page was visible, or whether the requested filter took effect.

[DiLLS](https://arxiv.org/abs/2602.05446), for example, organizes multi-agent behavior into activities, actions, and operations, which makes planning and execution easier to inspect. Reading that work suggested a complementary axis for browser diagnosis: where the action happened. A good summary of intent still needs browser evidence to answer a state-specific question.

Take a click on a filter control. On one screen it opens the menu. On another it is intercepted by an overlay. The action description alone cannot tell those outcomes apart. We call this the environment-axis gap.

### A complete log can still hide a pattern

Suppose the log already includes the URL, screenshot, and action at every step. That solves evidence availability but leaves a representation problem.

In a sequence like `directory → company A → company B → company A → company B`, each visit is one more entry on the timeline. The reviewer has to recognize the repeated pages, remember the earlier visits, and piece the cycle together. The records are complete, but the relationship between them is hard to see.

We call this the linear-trace gap. It matters most when a failure spans many steps: revisits, navigation loops, or repeated attempts that leave the page unchanged.

These gaps shaped three design goals: organize the review around browser state, make patterns across distant steps visible, and let reviewers check those patterns against the recorded evidence before deciding that something failed.

## Where BrowserLens fits

Agent diagnosis tools already go beyond a raw transcript. Alongside DiLLS, [AgentDiagnose](https://aclanthology.org/2025.emnlp-demos.15/) evaluates agent competencies and provides views such as action embeddings and state-transition timelines. BrowserLens differs in its diagnostic unit: it supports interactive inspection of one run through recurring browser-state identities.

Visualization research offers precedents too. [LifeFlow](https://www.cs.umd.edu/projects/hcil/lifeflow/) aggregates event sequences so that temporal patterns can be inspected. [ScreenTrack](https://doi.org/10.1145/3313831.3376753) uses a visual history of the screen to help people find previously used documents and pages. They address different tasks, but they point in the same direction: reorganize history around meaningful units while keeping access to the detail.

BrowserLens follows the same principle. Its graph groups visited states at several levels, highlights recurring patterns, and links each view to the original records.

## The representation: page, viewport, action

BrowserLens organizes a single logged trajectory into three graph layers. At each layer, visits with the same deterministic identity are grouped into one node, and edges preserve movement at that scale.

![Three stacked graph layers depict movement between pages, scrolling between viewports within a selected page, and actions within a selected viewport. Dashed connectors indicate drill-down rather than time. A separate evidence strip shows the original records available for inspection.](assets/posts/browserlens/graph-stack.svg "Figure 2. Schematic of the graph stack on an illustrative shopping task. Each layer is a graph. Solid arrows are recorded transitions; dashed connectors are drill-down. The graph indexes the original evidence instead of storing screenshots inside its nodes.")

[Open Figure 2 at full resolution](assets/posts/browserlens/graph-stack.svg).

The top layer answers "which page?" It groups visits by normalized URL. The prototype strips fragments and tracking parameters but keeps and sorts the other query parameters, so search terms, filters, and pagination still count toward identity. Repeated visits accumulate in one node instead of appearing as distant timeline entries.

The middle layer answers "which visible region?" A viewport is the part of a page visible in the browser window. Within a URL, BrowserLens uses viewport geometry and scroll position to tell these contexts apart, which exposes movement within a page even when the URL does not change.

The bottom layer answers "what was done there?" It places tool calls and their arguments in the viewport context where they occurred, so a click issued in one context is distinct from a click issued elsewhere. Once the reviewer has narrowed down the page and viewport, they can inspect the local action structure.

These identities make grouping reproducible, but they do not capture everything about a page. The same URL and scroll position can contain a different modal, form value, or dynamic result. Selecting a node therefore opens the original screenshots, DOM and ARIA snapshots, tool logs, model context, and replay artifacts. The DOM records page structure; ARIA snapshots expose the accessibility tree, including element roles and names. Together with screenshots, they help the reviewer check what the agent actually encountered.

## From a visual cue to a supported diagnosis

BrowserLens uses four visual cues. Visit counts, node size, and color draw attention to revisited identities. Marked cycle edges show paths that return to an earlier identity. A no-op marker on an action node points to explicit evidence that the page did not change. And a badge on a collapsed parent summarizes the cues in its lower layers, so the reviewer can decide where to drill down.

A reviewer starts with a cue, forms a possible explanation, and checks it against the evidence. Possible explanations include repeated state, repeated action, navigation loop, dead-end, navigation stuck, and grounding error. The graph does not assign these labels; the reviewer decides whether the records support them.

The distinction matters in ordinary cases. An agent cycling between two pages might be stuck, or it might be comparing products. A repeated action could be a failed attempt, a correction, or an intentional re-check. A cue is a reason to look closer, and several explanations may still fit.

The no-op cue is the strictest of the four because it is tied to before-and-after evidence. In the current prototype it requires no difference under the normalized DOM and ARIA comparison and a screenshot difference of at most 1% under the implemented image comparison. Returning to the same URL is not enough on its own. Even so, these are comparisons of captured artifacts; they cannot prove that no hidden application state changed.

## A walkthrough: a directory search that keeps circling

The paper walks through a recorded Y Combinator directory task: find startups from the 2022 and 2023 batches, headquartered in France, with open jobs. This run ended with `exceeded max steps` after 98 tool calls. (These numbers describe one demonstration trace, not a benchmark aggregate.)

At the URL layer, one company page has accumulated 35 visits, and the graph shows a circuit between company pages. That is a good place to start: the repeated movement is visible without matching every occurrence in the transcript by hand.

![The actual BrowserLens URL graph shows company-page nodes, repeated visits, highlighted cycle edges, and badges for cues within collapsed layers. The task and plan remain visible beside the graph.](assets/posts/browserlens/url-graph.png "Figure 3. The prototype's URL layer for the recorded directory run. A heavily visited node narrows the review target. Its prominence does not by itself say whether the revisits were necessary.")

[Open Figure 3 at full resolution](assets/posts/browserlens/url-graph.png).

Drilling into the directory page's actions reveals an "All batches" click with a no-op marker. Its evidence panel reports unchanged DOM and ARIA and no detected screenshot difference. The conclusion at this point is narrow but concrete: the captured page evidence shows no change after this click.

The next question is why the click had no visible effect. Navigation may be stuck, or the agent may have targeted the wrong element. To distinguish those explanations, the reviewer needs the target, tool arguments, surrounding steps, and model context. The no-op marker alone cannot explain the failed run.

![The BrowserLens action layer shows an All batches click with a no-op marker. The right-hand evidence panel displays unchanged DOM and ARIA, zero screenshot difference, a before-and-after comparison, and supporting action context.](assets/posts/browserlens/action-evidence.png "Figure 4. Drilling down brings a local action and its recorded evidence into the same workspace. This is a prototype screenshot. The evidence supports a local no-progress observation; the root cause is still the reviewer's call.")

[Open Figure 4 at full resolution](assets/posts/browserlens/action-evidence.png).

The timeline stays available throughout. The graph helps locate recurring structure; the chronological record helps reconstruct the order of events once the reviewer has chosen where to look.

## What the poster establishes, and what it does not

The poster presents the representation, a working interface, and a walkthrough of one logged run. We have not yet run a user study, so we cannot say whether BrowserLens makes diagnosis faster or more accurate.

The prototype supports read-only review of logging-enabled live sessions and saved sessions. The walkthrough is of a completed run. Automatic agent repair, steering, and compatibility with arbitrary external logs are out of scope.

Our next step is an evaluation of how the representation changes reviewers' reasoning. The planned comparison uses three interfaces: a linear step viewer; the same viewer with orientation and linked evidence; and the full BrowserLens workspace with graph and cues. Think-aloud review and retrospective interviews should show when a graph helps someone notice a pattern, when evidence changes their explanation, and when a cue misleads them.

The study plan introduces the interfaces in a fixed order and rotates trajectory groups across conditions. That supports qualitative comparison but leaves learning and order effects in place. Each interface increment also adds several features at once, so the study will not isolate the effect of an individual cue or panel. Our eventual claims will have to respect those limits.

## Open problems

The grouping rules can both hide differences and create unnecessary ones. Two meaningful application states can share a URL and viewport, while changing query parameters can split visits a person would consider equivalent. Grouping similar states and showing why visits were merged are possible next steps; the current rules do not resolve those cases.

Visible change is not task progress. A wrong click may change the page substantially. A correct action may update hidden state or produce a delayed result outside the captured interval. A quiet graph cannot certify success, and a busy graph cannot certify failure. The reviewer still needs the task requirements and the original evidence.

The diagnosis is bounded by what was logged. Missing screenshots, tool results, or browser states cannot be reconstructed from the graph. Recorded model context can help explain an action choice, but it does not reveal unrecorded internal reasoning. Non-browser operations need their own instrumentation and representation.

We built the workspace around one reference agent runtime. Supporting other frameworks will require translating their logs and checking that each graph element still points to the right evidence. We also have not tested much longer or denser runs, or comparisons across multiple runs.

A visual signal can anchor a wrong explanation. Reviewers may over-trust highlighted nodes or miss failures with no prominent cue. Evaluation should include benign revisits, misleading cues, and missing evidence alongside the cases where the design works well. Logged URLs, screenshots, form contents, and model context can also contain sensitive information, so sharing and redaction are practical constraints on deployment.

For now, the question is whether reviewers can use this workspace to explain a run reliably: where progress stopped, what evidence supports that judgment, and what remains uncertain. That is what we want to study next.

## References

Links point to publisher records, author-hosted project pages, or author-submitted papers, checked on September 11, 2026.

1. Xiang Deng, Yu Gu, Boyuan Zheng, Shijie Chen, Sam Stevens, Boshi Wang, Huan Sun, and Yu Su. Mind2Web: Towards a Generalist Agent for the Web. NeurIPS, 2023. [Proceedings](https://proceedings.neurips.cc/paper_files/paper/2023/hash/5950bf290a1570ea401bf98882128160-Abstract-Datasets_and_Benchmarks.html) · [Paper](https://arxiv.org/abs/2306.06070).
2. Shuyan Zhou, Frank F. Xu, Hao Zhu, Xuhui Zhou, Robert Lo, Abishek Sridhar, Xianyi Cheng, Tianyue Ou, Yonatan Bisk, Daniel Fried, Uri Alon, and Graham Neubig. WebArena: A Realistic Web Environment for Building Autonomous Agents. ICLR, 2024. [Proceedings and paper](https://proceedings.iclr.cc/paper_files/paper/2024/hash/4410c0711e9154a7a2d26f9b3816d1ef-Abstract-Conference.html).
3. Hongliang He, Wenlin Yao, Kaixin Ma, Wenhao Yu, Yong Dai, Hongming Zhang, Zhenzhong Lan, and Dong Yu. WebVoyager: Building an End-to-End Web Agent with Large Multimodal Models. ACL, 2024, pp. 6864–6890. [ACL Anthology](https://aclanthology.org/2024.acl-long.371/).
4. Tianci Xue, Weijian Qi, Tianneng Shi, Chan Hee Song, Boyu Gou, Dawn Song, Huan Sun, and Yu Su. An Illusion of Progress? Assessing the Current State of Web Agents. COLM, 2025. [Paper, including Online-Mind2Web](https://arxiv.org/abs/2504.01382).
5. Rui Sheng, Yukun Yang, Chuhan Shi, Yanna Lin, Zixin Chen, Huamin Qu, and Furui Cheng. DiLLS: Interactive Diagnosis of LLM-based Multi-agent Systems via Layered Summary of Agent Behaviors. CHI, 2026. [DOI](https://doi.org/10.1145/3772318.3790815) · [Paper](https://arxiv.org/abs/2602.05446).
6. Tianyue Ou, Wanyao Guo, Apurva Gandhi, Graham Neubig, and Xiang Yue. AgentDiagnose: An Open Toolkit for Diagnosing LLM Agent Trajectories. EMNLP System Demonstrations, 2025, pp. 207–215. [ACL Anthology](https://aclanthology.org/2025.emnlp-demos.15/).
7. Krist Wongsuphasawat, John Alexis Guerra Gómez, Catherine Plaisant, Taowei David Wang, Meirav Taieb-Maimon, and Ben Shneiderman. LifeFlow: Visualizing an Overview of Event Sequences. CHI, 2011, pp. 1747–1756. [Author project and publication record](https://www.cs.umd.edu/projects/hcil/lifeflow/).
8. Donghan Hu and Sang Won Lee. ScreenTrack: Using a Visual History of a Computer Screen to Retrieve Documents and Web Pages. CHI, 2020, pp. 1–13. [DOI](https://doi.org/10.1145/3313831.3376753) · [Paper](https://arxiv.org/abs/2001.10898).
