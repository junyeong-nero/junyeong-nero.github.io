## TL;DR

- The question was whether a coding agent can work in the browser a person is already using, without moving their view or taking their input, and what that costs in tokens. Kitsune is the MCP server I built to try it. It works in Firefox, Zen and LibreWolf through an extension and a local bridge.
- **Coexistence held.** With a user in the browser, Kitsune v0.7.2 kept the user's tab in front in 28 of 28 personal tasks. Playwright MCP, which was not designed to share a browser with a person, kept it in 2. With a scripted user typing in one tab, Kitsune misdirected 0 characters and Playwright 300.
- **The first token audit went against me.** Kitsune used 30.5% more input than Playwright MCP even though its tool results were 42% smaller. The cost was in the fixed prefix (tool definitions) multiplied by more requests, and part of an earlier "improvement" came from the client truncating tool descriptions rather than from Kitsune.
- **Richer observations did not help.** A 72-run disclosure experiment and a 60-run catalog experiment both added input. As in my [earlier token study](post.html?slug=progressive-disclosure-token-efficiency), the gains came from removing specific content and avoiding round trips, not from rearranging what the model sees.
- **Eight planned A/B experiments:** three supported (input ratios 0.768, 0.878, 0.746), one inconclusive, one stopped because the change was never exercised, one not supported, and two early prototypes not adopted. The supported ones all cut requests the agent did not need, not characters per observation.
- **Release benchmark (v0.7.2, one attempt per task):** Kitsune solved 96 of 98 tasks and Playwright MCP 98. On tasks both solved, Kitsune's input was 0.625× Playwright's on a crowded component gallery and 0.94–0.99× elsewhere. These are observations from one run and one model, not a general efficiency claim.

Coding agents can now drive a browser, but the usual setup gives them a browser of their own: Playwright launches a fresh Chromium or Firefox, signed in nowhere, and the agent owns every tab. That is the right design for testing. It is awkward when the task lives in your own browser: a page you are signed in to, a form half filled, a tab you want the agent to read but not touch.

I wanted the opposite arrangement. The agent should be a guest in a browser the user keeps using. It should open its own tabs in the background, read the user's tabs when asked, and never move the user's view or type into the field they are typing in. Kitsune is that experiment. It started on 2026-10-16, reached v0.7.3 three weeks later, and was measured throughout with a separate benchmark, [kitsune-benchmark](https://github.com/junyeong-nero/kitsune-benchmark).

This post covers two parts of that work: the coexistence design and how I measured it, and the observation and token work that followed. The two turned out to be linked. Several of the token costs came from the coexistence rules, and the cheapest fix for one of them was a single sentence in a tool result.

![Claude Code researches in background tabs, asks for the user's Wikipedia tab, the user approves in the toolbar popup, and later takes the tab back and closes the agent's tabs.](assets/posts/kitsune/demo-handoff.gif "Figure 1. A recorded handoff in v0.7.2, sped up while the agent thinks. The agent works in its own background tabs, asks for the user's tab, and the user approves, takes it back and cleans up from the toolbar popup.")

## Design: the agent is a guest

Two principles set Kitsune's trade-offs, and both are written down so that a fix or a benchmark win cannot quietly override them:

1. **The user's browser belongs to the user.** Agent work opens in background tabs. The user's tabs, focus and input are off limits unless the user hands one over. Refusing with guidance is preferred over acting somewhere else.
2. **Fewer, sharper tools.** Every tool, parameter and description line is paid for in context on every request. A tool or field is added only when it removes more agent work than it adds.

The architecture follows from the first principle. Kitsune does not launch a browser. Each agent starts its own Kitsune MCP server. The servers share one bridge process per user, running locally, which talks to a browser extension. The extension tracks which tabs the agent opened and which belong to the user.

![Process chain from coding agent to MCP server, bridge daemon and browser extension, above a browser window whose tabs are split into the user's read-only tabs and the agent's background tabs, with a toolbar popup for handoffs.](assets/posts/kitsune/architecture.svg "Figure 2. Kitsune's process chain and tab ownership in v0.7.2. The user's tabs can be read but not written; the agent writes only in tabs it opened. A handoff of one user tab goes through the toolbar popup.")

The second principle shaped the tool surface. The agent starts with Playwright MCP's 25 core tools under the same names, plus two tools for asking the user and resuming after a handoff, so prompts written for Playwright carry over. Everything else (page text, forms, batches, downloads) stays off until the user enables it. A mode setting (read, draft or act) limits what the agent can do, and the bridge enforces it on every request rather than relying on the prompt. In draft mode the agent can fill in a form but cannot click or submit.

As in Playwright, the agent sees a page as a text snapshot of its accessibility tree, and each element carries a short reference such as `e12`. Actions name the reference rather than a CSS selector. Several results below come down to how long those references stay valid.

Some rules came from failures rather than principles. In an early benchmark run, two runs deleted an existing wishlist item: one submitted the page's first form (a delete form) after filling a different one, and the other clicked the first of several buttons matching a selector. Playwright's strict locators reject ambiguous selectors, so Kitsune now does the same: a write whose target matches several elements fails and acts on nothing.

The tab rules changed the most, and I come back to them in the token section. For a while after v0.7.1, development builds *held* a write to the tab the user was viewing until the user approved it. In v0.7.2 the user's tabs became plainly read-only: writes to them, and switching to them, are refused with an explanation, and the agent opens the page in a tab of its own instead.

## Measuring coexistence

A standard browser benchmark cannot see any of this. Its tasks start in an empty browser, and its grader checks the final page state. If the agent switched the user's tab ten times along the way, nothing records it.

So the benchmark has a coexistence track. Each of the 28 personal tasks is replayed in a browser where the user's tabs are already open and one of them is in front. A sampler records which tab is shown after every tool call and every 0.25 s. On top of the ordinary task grade, a *user-view check* passes only if the shown tab never left the user's starting tab. A separate task has a scripted user typing into a journal while the agent fills a memo in another tab.

The first run, on v0.3.1, already separated the two designs:

| Personal tasks with the user's tabs open (v0.3.1, 24 tasks) | Playwright MCP | Kitsune |
| --- | ---: | ---: |
| Task success (strict) | 24/24 | 24/24 |
| User-view check | 2/24 | **24/24** |
| After-call samples away from the user's tab | 129 of 204 | **0 of 279** |

This is documented tool behavior, not a model choice. Playwright MCP brings a tab to the front when it opens or selects it, and every task that touches another tab needs one of those calls. Kitsune's tab switch moves only the agent's own cursor, and new tabs open in the background. The two runs where Playwright kept the user's view were the two tasks that never left one tab.

The typing task showed what a moved view means for the user. When Playwright selected the memo tab, the user's keystrokes followed the view: 87 of them landed in the memo and a notice page. Kitsune's agent wrote to its background tabs while all of the user's keys stayed in the journal.

The measurement itself needed fixing first. My first typing user sent keys through WebDriver BiDi from inside the page. A probe without any model showed that this permanently broke Playwright's instrumented pages, so later snapshots failed even on fresh pages. That pair of runs was invalid. The typing user now presses keys through the browser's own input layer, and a scripted reference agent checks that neither server sees tool errors.

The result has stayed the same through every release benchmark since. In v0.7.2, Kitsune kept the user's view in 28 of 28 tasks and Playwright in 2. The typing user kept their input in 3 of 3 Kitsune runs and 0 of 3 Playwright runs, with 0 against 300 misdirected characters.

The comparison is lopsided by construction: Playwright MCP is not built to share a browser with a person, and this check is not a claim that it is defective. What the track does show is the cost of reusing an automation browser while someone is in it. It also gave me a fixed requirement that any token optimization had to keep.

## Where the tokens actually went

Coexistence was not free. In that first coexistence run, Kitsune used 1.33× Playwright's input and 1.37× its tool calls on the same tasks. I had already looked for the source of that gap two days earlier. My first guess was that Kitsune's observations were too large. A token audit on 24 personal tasks (Claude Code in its minimal mode, Haiku) said otherwise:

| | Playwright MCP | Kitsune |
| --- | ---: | ---: |
| Total input tokens | 1,401,897 | 1,829,660 (+30.5%) |
| Model requests | 181 | 221 |
| First request (≈ system + tools + task) | 4,522 | 5,823 |
| Share of input that is prefix × requests | 58% | **70%** |
| Tool-result tokens, exact | 104,177 | **60,289** (−42%) |

Kitsune's tool results were 42% *smaller*. The extra input was the larger prefix (+1,301 tokens of tool definitions), multiplied by 40 more requests. Each result is carried in every later request, so a small prefix difference grows with the length of a run.

The audit turned up something I had not been looking for. In its minimal mode, Claude Code sends only the first paragraph of each MCP tool description. The click tool's description went from 1,967 characters to 60. In default mode it sends them in full. Two consequences followed:

- An earlier drop in Kitsune's input per request, from 1.80× to 1.24× Playwright's, was about 42% Kitsune's own changes and **58% client truncation**. I had been counting it as progress.
- In truncating clients, the model never saw the usage rules written into the descriptions, such as how to state an expected outcome or how long element references last. With full descriptions the agent stated an expected outcome 14–20 times per run set; with truncated ones, 0–5.

The audit also gave concrete targets. Five tools were never used in 72 runs. Dropping them cut total input by 25.6% with truncated descriptions and 22.0% with full ones, with no detected loss in success, and the smaller tool set became the default the same day. The audit also counted 34 read-only requests directly after another read-only request. The agent needed both what the page said and what it could act on, and Kitsune split those across two tools.

## Two ideas that added work

Before changing the default observation, I tested two broader ideas against the native one. Both had plans written before any model run. Both ran on v0.3.0 with Haiku and compared Kitsune only with itself.

**A richer observation bundle (72 runs).** A relay added an actionable snapshot to every page-text read and included more state in tab lists. On its own it added input (+6.2%), and guidance on stating expected outcomes added +4.7% on its own. The two together cut input by 6.1% against guidance alone, which suggests rich observations help only when the model is also told how to use them. The interaction was not statistically established.

The more useful finding was a mechanism. Errors from stale element references went from 1 to 5. Adding a snapshot to a read-only text response replaced the page's existing references, even though the page had not changed. A probe without any model reproduced it. That turned into a design rule: an observation must not invalidate the references the agent is holding. Today an unchanged element keeps its reference across snapshots, searches and post-action observations, and a stale reference reports why it is stale.

**A role-bucketed target catalog (60 runs).** The same snapshot was regrouped into interactions, media and context, with candidate actions listed per control. Requests fell 2.2%, input rose 6.0% and estimated cost rose 10.0%, with equal success. Separating every control from its surrounding text did not help the model act. In the chart task, the media group was empty because the underlying snapshot never contained the image.

The verdict on both was the same: do not add a learned selector or a new representation yet. The problems were specific interface gaps, references that changed under the agent and images missing from the snapshot, and those could be fixed directly. This matched my [earlier study](post.html?slug=progressive-disclosure-token-efficiency): disclosing whole elements adaptively added round trips without saving tokens, while removing one specific attribute did.

## Pre-registered experiments

From late October I ran each candidate change the same way:

- Before any run, I wrote down the change, the target tasks where it should help, and guard tasks where it should change nothing.
- The protocol fixed the decision thresholds and the run order before the first run. Each repeat alternated which version ran first.
- Version A was the current development build and version B was the same build plus one change. Both were clean checkouts, verified before every run.
- The driver checked that the change was actually in effect, for example that B's cut-off snapshots really contained no link URLs.
- The verdict (support, reject or inconclusive) followed the predeclared rule, even when the numbers looked good.

![Dot chart of input-token ratios for eight experiments. Three supported changes sit between 0.75 and 0.88 with guard tasks near 1.0. Expanding short lists sits at 0.68 but its worst guard task is at 1.17. The two early prototypes and the new-reference warning sit at or above 1.0. The live-site rerun has no estimate.](assets/posts/kitsune/interventions.svg "Figure 3. Input tokens, version B ÷ version A, on each experiment's target tasks; diamonds are guard tasks. The first two rows are the prototype comparisons above; the rest used predeclared decision rules. Each experiment has its own tasks, model and baseline, so the rows are not one pooled analysis.")

| Experiment | Change | Input ratio on target tasks | Verdict |
| --- | --- | ---: | --- |
| Expand short lists | Show a run of similar items in full instead of collapsing it, when collapsing would hide five or fewer | 0.679 (table tasks) | inconclusive |
| Truncate around main content | When a snapshot is too long, keep the page's main content first and drop link URLs | **0.768** | support |
| Same change on live sites | The previous change on Wikipedia, MDN and Steam | none | stopped |
| Compact search results | Shorter results from the in-page search tool | **0.878** | support |
| Name the user's tab | Say before the first write that the current tab is the user's | **0.746** | support |
| Warn about new references | Say that a copied tab has new element references | 1.001 | not supported |

**Expanding short lists** shows why the guards are there. Snapshots collapse a long run of similar items (table rows, for example) into a marker, and the agent has to read it again to expand it. Listing short runs in full met both support thresholds on the table tasks by a wide margin: 0.578 of the requests and 0.679 of the input, lower in all 24 pairs. Two guard tasks, however, came in at 1.171 and 1.071, above the 1.05 limit, and version B had 4 recovered tool errors against 0. The change had no visible effect on those guard pages, so their difference is probably variation in the agent's path, but the rule allowed no adoption claim from that run.

**Truncating around main content** changed what a cut-off snapshot keeps. When a page exceeded the snapshot budget, the first snapshot spent much of it on navigation links and the URL line printed under each one, and the task's controls fell past the cut. Version B kept the page's main content first and dropped link URLs. Input fell to 0.768× on the crowded gallery, with guards at 0.973 and every gate held. B's cut-off snapshots were about the same size as A's (8.9k vs 9.2k characters). The saving came from the agent acting on the first snapshot instead of searching for the right section: search calls fell from 60 to 18. The crowded test page has 68 links sharing one URL, which inflates the effect. The version that eventually shipped used a different implementation of the same idea.

**The same change on live sites** was meant to test it on Wikipedia, MDN and Steam. I stopped after 9 of 36 runs, a stop the protocol had not predeclared, because the change was never exercised. On live sites the agent never took a full-page snapshot. It opened pages in new tabs, moved around with the search tool, and scoped any snapshot to one element. Continuing would only have measured noise. The stopped run did show where live-site observations come from: search results produced 83% of tool-result characters and snapshots 5%.

**Compact search results** followed from that measurement. Input fell to 0.878×, just under the 0.90 threshold, and to 0.841× on the live sites alone. Search-result characters fell to 0.68×. The gain was concentrated on Wikipedia (0.62) and Steam (0.84), while MDN (1.17) and the long personal page (1.10) cost more. A small margin with mixed tasks is still a support under the rule, and the report says so.

**Naming the user's tab** came from the coexistence rules. In the development builds after v0.7.1, a write to the tab the user was viewing was held. A held run tried the write, was told the user had to approve it, opened its own tab, took a new snapshot and wrote again:

```text
list tabs → snapshot → type (held) → open own tab → snapshot → type → click → snapshot
```

On the held tasks, this made Kitsune use 1.35× Playwright's input. Version B added one sentence to the tab-list result: the user is viewing this tab, writes there will be held, so open the page in a tab of your own first. Runs with a hold fell from 31 to 1, and every B run opened its own tab before the first write. Input fell to 0.746×, lower in 31 of 32 tasks, and Kitsune's input relative to Playwright on these tasks went from 1.35× to 1.007×. The hint shipped, and v0.7.2 went further and replaced the hold with the read-only refusal described above.

**Warning about new references** tried the same move on a smaller problem. Element references belong to one page. An agent that opened a copy of the user's tab sometimes sent a write with the old tab's references in the same request, and the write failed. A sentence saying the new tab has new references did not stop it (2 of 16 runs in B, 3 of 16 in A), and it may have split some requests in two. Input was unchanged at 1.001×. Not every agent mistake is a missing sentence.

The supported changes have something in common. Truncating around main content skipped search rounds, compact search results kept large results from being carried through the rest of the run, and naming the user's tab removed a failed write and its recovery. None of them made an individual observation dramatically smaller. They removed requests the agent did not need to make, and each request re-sends the whole prefix and history.

## Release-level results

The release benchmarks compare Kitsune with Playwright MCP 0.0.83 on the same tasks, model (Claude Opus 5.5, medium effort) and the same 23 tools, one attempt per task.

![Benchmark chart of Kitsune v0.7.2 against Playwright MCP 0.0.83: user's tab kept in front 28 of 28 versus 2 of 28; list-price cost on tasks both solved 0.97×, 0.56× and 0.87× of Playwright's for personal, crowded and isolated tasks; task success 96 of 98 versus 98 of 98.](assets/posts/kitsune/benchmark.png "Figure 4. The v0.7.2 release benchmark. Cost is Claude Code's list-price estimate, not an actual charge; the input-token ratios are in the table below.")

| Kitsune ÷ Playwright input, tasks both solved (v0.7.2) | Ratio |
| --- | ---: |
| Personal | 0.985 |
| Gallery, crowded | **0.625** |
| Gallery, isolated | 0.962 |
| Coexistence | 0.936 |
| External (live sites) | 0.936 |

Kitsune's two misses are one task in two variants: "note the return period, then go back to the order tab." The order tab never left the front, which is the point of the design. But the grader reads Kitsune's current tab as the one in front, and the agent left its own memo tab current. I count that as a grading mismatch I have not resolved, not as a pass.

The personal ratio is the one I watch most, and it is the least flattering. In the v0.7.0 benchmark it was 0.807, and on the held tasks in the builds after v0.7.1 it was 1.35. The task set changed between those runs, so I do not read the sequence as a release trend. On a fixed task set, the tab-naming experiment showed the shift was mostly the cost of the hold. In v0.7.2, 33 of 56 personal runs were refused a switch to a user tab and then opened their own tab. That is cheaper than a hold, but it is still a round trip that Playwright, which owns every tab, never pays.

## What these results do not show

- **One attempt per task in the release benchmarks.** Both servers ran at the same time, with no counterbalanced order and different cache states. Read the release ratios as observations, not causal estimates. The A/B experiments alternate the order but have 2–4 repeats per task.
- **One model family per experiment.** The early prototypes ran on Haiku and everything later on Opus, all through Claude Code. Description truncation alone shows how much the client matters.
- **Test-page effects.** The crowded gallery's shared-URL links favor changes that drop URLs. Live sites behaved differently enough that the live-site rerun never exercised its change.
- **No comparison with Firefox-native peers.** The comparison is with Playwright MCP, which solves a different problem. The results say nothing about other extension-based tools.
- **No RAM or resource claim.** Reusing the user's browser should avoid a second browser process, but I have not measured it.
- **No protection against prompt injection.** Kitsune limits where the agent can write. It does nothing about a page that tells the agent what to do.

## What I would check first next time

1. **Read the exact request the client sends.** The biggest surprise in this project came from a logging proxy, not from a benchmark: the client was truncating tool descriptions, and part of my "progress" was the client's.
2. **Count requests before characters.** Every supported change removed requests. In a run where each request re-sends the prefix and history, an extra round trip costs more than a verbose result.
3. **Check that the change is exercised before measuring it.** The live-site rerun cost nine runs to learn that agents on live sites never took the snapshot it changed. A check on recorded trajectories, without a model, would have caught that.
4. **Write the guard tasks and the stop rule into the protocol.** Expanding short lists looked like a clear win on its target tasks. The guards were the only reason it was not adopted on that evidence.
5. **Make the coexistence check a gate for every optimization.** Several costs came from the coexistence rules, and the cheapest fix for the hold was one sentence, not a weaker rule.

The open question is the one the tab-naming experiment and v0.7.2 point to: how much of the remaining personal-task cost is the price of sharing a browser, and how much is interface the agent still has to work around? A held write, a refused tab switch and a stale reference after copying a tab all cost a round trip that a browser of its own would not. I would rather make that cost small than give up the shared browser to remove it.
