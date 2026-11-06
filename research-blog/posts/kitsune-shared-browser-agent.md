## TL;DR

- The question was whether a coding agent can work in the browser a person is already using, without moving their view or taking their input, and what that costs in tokens. Kitsune is the MCP server I built to try it. It works in Firefox, Zen and LibreWolf through an extension and a local bridge.
- **Coexistence held.** With a user in the browser, Kitsune v0.7.2 kept the user's tab in front in 28 of 28 personal tasks. Playwright MCP, which was not designed to share a browser with a person, kept it in 2. With a scripted user typing in one tab, Kitsune misdirected 0 characters and Playwright 300.
- **The first token audit went against me.** Kitsune used 30.5% more input than Playwright MCP even though its tool results were 42% smaller. The cost was in the fixed prefix (tool definitions) multiplied by more requests, and part of an earlier "improvement" came from the client truncating tool descriptions rather than from Kitsune.
- **Richer observations did not help.** A 72-run disclosure experiment and a 60-run catalog experiment both added input. As in my [earlier token study](post.html?slug=progressive-disclosure-token-efficiency), the gains came from removing specific content and avoiding round trips, not from rearranging what the model sees.
- **Eight planned A/B experiments:** three supported (input ratios 0.768, 0.878, 0.746), one inconclusive, one stopped because the change was never exercised, one not supported, and two early prototypes not adopted. The supported ones all cut requests the agent did not need, not characters per observation.
- **Release cohort (v0.7.2, one attempt per task):** Kitsune solved 96 of 98 tasks and Playwright MCP 98. On tasks both solved, Kitsune's input was 0.625× Playwright's on a crowded component gallery and 0.94–0.99× elsewhere. These are observations from one cohort and one model, not a general efficiency claim.

Coding agents can now drive a browser, but the usual setup gives them a browser of their own: Playwright launches a fresh Chromium or Firefox, signed in nowhere, and the agent owns every tab. That is the right design for testing. It is awkward when the task lives in your own browser: a page you are signed in to, a form half filled, a tab you want the agent to read but not touch.

I wanted the opposite arrangement. The agent should be a guest in a browser the user keeps using. It should open its own tabs in the background, read the user's tabs when asked, and never move the user's view or type into the field they are typing in. Kitsune is that experiment. It started on 2026-10-16, reached v0.7.3 three weeks later, and was measured throughout with a separate benchmark repository, [kitsune-benchmark](https://github.com/junyeong-nero/kitsune-benchmark).

This post covers two parts of that work: the coexistence design and how I measured it, and the observation and token work that followed. The two turned out to be linked. Several of the token costs came from the coexistence rules, and the cheapest fix for one of them was a single sentence in a tool result.

![Claude Code researches in background tabs, asks for the user's Wikipedia tab, the user approves in the toolbar popup, and later takes the tab back and closes the agent's tabs.](assets/posts/kitsune/demo-handoff.gif "Figure 1. A recorded handoff in v0.7.2, sped up while the agent thinks. The agent works in its own background tabs, asks for the user's tab, and the user approves, takes it back and cleans up from the toolbar popup.")

## Design: the agent is a guest

Two principles set Kitsune's trade-offs, and both are written down so that a fix or a benchmark win cannot quietly override them:

1. **The user's browser belongs to the user.** Agent work opens in background tabs. The user's tabs, focus and input are off limits unless the user hands one over. Refusing with guidance is preferred over acting somewhere else.
2. **Fewer, sharper tools.** Every tool, parameter and description line is paid for in context on every request. A tool or field is added only when it removes more agent work than it adds.

The architecture follows from the first principle. Kitsune does not launch a browser. Each agent starts its own `kitsune` MCP server over stdio. The servers share one bridge daemon per user on `127.0.0.1`, which talks to a browser extension over a local WebSocket. The extension tracks which tabs the agent opened and which belong to the user.

![Process chain from coding agent to MCP server, bridge daemon and browser extension, above a browser window whose tabs are split into the user's read-only tabs and the agent's background tabs, with a toolbar popup for handoffs.](assets/posts/kitsune/architecture.svg "Figure 2. Kitsune's process chain and tab ownership in v0.7.2. The user's tabs can be read but not written; the agent writes only in tabs it opened. A handoff of one user tab goes through the toolbar popup.")

The second principle shaped the tool surface. The agent starts with Playwright MCP's 25 core tools under the same names, plus `browser_ask_user` and `browser_resume` for handoffs, so prompts written for Playwright carry over. Everything else (page text, forms, batches, downloads) stays off until the user enables it. `KITSUNE_MODE=read`, `draft` or `act` limits what the agent can do, and the bridge enforces the limit on every request, not the prompt. In draft mode the agent can fill in a form but cannot click or submit.

Some rules came from failures rather than principles. In an early cohort, two runs deleted an existing wishlist item: one submitted the page's first form (a delete form) after filling a different one, and the other clicked the first of several buttons matching a selector. Playwright's strict locators reject ambiguous selectors, so Kitsune now does the same: a write whose target matches several elements fails with `ambiguous_target` and acts on nothing.

The tab rules changed the most, and I come back to them in the token section. For a stretch after v0.7.1, Kitsune's main branch *held* a write to the tab the user was viewing until the user approved it. In v0.7.2 the user's tabs became plainly read-only: writes and `select` on them are refused with `user_tab_read_only`, and the agent opens the page in a tab of its own instead.

## Measuring coexistence

A standard browser benchmark cannot see any of this. Its tasks start in an empty browser, and its grader checks the final page state. If the agent switched the user's tab ten times along the way, nothing records it.

So the benchmark has a coexistence track. Each of the 28 personal tasks is replayed in a *user-seeded* browser: the user's tabs are already open and one of them is in front. A sampler records which tab is shown after every tool call and every 0.25 s. On top of the ordinary task grade, a *user-view contract* passes only if the shown tab never left the user's starting tab. A separate task, `co-typing-01`, has a scripted user typing into a journal while the agent fills a memo in another tab.

The first run, on v0.3.1, already separated the two designs:

| User-seeded personal tasks (v0.3.1, 24 tasks) | Playwright MCP | Kitsune |
| --- | ---: | ---: |
| Task success (strict) | 24/24 | 24/24 |
| User-view contract | 2/24 | **24/24** |
| After-call samples away from the user's tab | 129 of 204 | **0 of 279** |

This is documented tool behavior, not a model choice. Playwright MCP brings a tab to the front when it opens or selects it, and every task that touches another tab needs one of those calls. Kitsune's `select` moves only its own cursor, and `new` opens in the background. The two runs where Playwright kept the user's view were the two tasks that never left one tab.

The typing task showed what a moved view means for the user. When Playwright selected the memo tab, the user's keystrokes followed the view: 87 of them landed in the memo and a notice page. Kitsune's agent wrote to its background tabs while all of the user's keys stayed in the journal.

The measurement itself needed fixing first. My first typing user sent keys through content-side WebDriver BiDi. A no-model probe showed that this permanently broke Playwright's instrumented pages, so later snapshots failed on fresh pages. That pair was invalid. The typing user now presses keys through the browser chrome's text input processor, and the no-model tests assert that a scripted reference agent sees no tool errors on either server.

The result has stayed the same through every release cohort since. In v0.7.2, Kitsune kept the user's view in 28 of 28 tasks and Playwright in 2. The typing user kept their input in 3 of 3 Kitsune runs and 0 of 3 Playwright runs, with 0 against 300 misdirected characters.

The comparison is lopsided by construction: Playwright MCP is not built to share a browser with a person, and this contract is not a claim that it is defective. What the track does show is the cost of reusing an automation browser while someone is in it. It also gave me a fixed contract that any token optimization had to keep.

## Where the tokens actually went

Coexistence was not free. In that first coexistence run, Kitsune used 1.33× Playwright's input and 1.37× its tool calls on the same tasks. I had already looked for the source of that gap two days earlier. My first guess was that Kitsune's observations were too large. A token audit on 24 personal tasks (Claude Code in `--bare` mode, Haiku) said otherwise:

| | Playwright MCP | Kitsune |
| --- | ---: | ---: |
| Total input tokens | 1,401,897 | 1,829,660 (+30.5%) |
| Model requests | 181 | 221 |
| First request (≈ system + tools + task) | 4,522 | 5,823 |
| Share of input that is prefix × requests | 58% | **70%** |
| Tool-result tokens, exact | 104,177 | **60,289** (−42%) |

Kitsune's tool results were 42% *smaller*. The extra input was the larger prefix (+1,301 tokens of tool definitions), multiplied by 40 more requests. Each result is carried in every later request, so a small prefix difference grows with the length of a run.

The audit turned up something I had not been looking for. Claude Code in `--bare` mode sends only the first paragraph of each MCP tool description. `browser_click`'s description went from 1,967 characters to 60. In default mode it sends them in full. Two consequences followed:

- An earlier drop in Kitsune's input per request, from 1.80× to 1.24× Playwright's, was about 42% Kitsune's own changes and **58% client truncation**. I had been counting it as progress.
- In truncating clients, the model never saw the action contract written into the descriptions (`expect`, ref lifetimes, the opt-in `snapshot(text=True)`). With full descriptions the agent used `expect` 14–20 times per cohort; with truncated ones, 0–5.

The audit also gave concrete targets. Five tools were never used in 72 runs. Dropping them (the `lean` preset) cut total input by 25.6% with truncated descriptions and 22.0% with full ones, with no detected loss in success; it became the default the same day. The audit also counted 34 read-only requests directly after another read-only request. The agent needed what the page said and what it could act on, and Kitsune split those across two tools.

## Two ideas that added work

Before changing the default observation, I tested two broader ideas against the native one. Both had plans written before any model run. Both ran on v0.3.0 with Haiku and were Kitsune-only.

**A richer observation bundle (72 runs).** A relay added an actionable snapshot to every page-text read and included more state in lists. On its own it added input (+6.2%), and expectation guidance on its own added +4.7%. The two together cut input by 6.1% against guidance alone, which suggests rich observations help only when the model is also told how to use them. The interaction was not statistically established.

The more useful finding was a mechanism. Stale-ref errors went from 1 to 5. Adding a snapshot to a read-only text response replaced the page's existing refs, even though the page had not changed. A no-model probe reproduced it. That turned into a design rule: an observation must not invalidate the refs the agent is holding. Today an unchanged node keeps its ref across snapshots, finds and post-action observations, and a stale ref reports why it is stale.

**A role-bucketed target catalog (60 runs).** The same snapshot was regrouped into INTERACTIONS, MEDIA and CONTEXT, with candidate actions listed per control. Requests fell 2.2%, input rose 6.0% and estimated cost rose 10.0%, with equal success. Separating every control from its surrounding text did not help the model act. In the chart task, the MEDIA group was empty because the underlying snapshot never contained the image.

The verdict on both was the same: do not add a learned selector or a new representation yet. The problems were specific interface gaps, refs that changed under the agent and assets missing from the snapshot, and those could be fixed directly. This matched my [earlier study](post.html?slug=progressive-disclosure-token-efficiency): disclosing whole elements adaptively added round trips without saving tokens, while removing one specific attribute did.

## Pre-registered interventions

From late October I ran each candidate change the same way:

- A hypothesis issue in the benchmark repository named the change and the cells it should affect.
- A frozen protocol fixed the primary cells, guard cells, decision thresholds and run order (ABBA/BAAB) before the first run.
- Arm A was Kitsune `main` and arm B was `main` plus one commit, both clean worktrees, with revisions checked before every run.
- The driver checked that the change was actually in effect, for example that B's truncated snapshots really contained no `/url` lines.
- The verdict (support, reject or inconclusive) followed the predeclared rule, even when the numbers looked good.

![Dot chart of input-token ratios for eight experiments. Three supported changes sit between 0.75 and 0.88 with guard cells near 1.0. H18 sits at 0.68 but its worst guard cell is at 1.17. The two early prototypes and #472 sit at or above 1.0. H321 has no estimate.](assets/posts/kitsune/interventions.svg "Figure 3. Input tokens, intervention ÷ baseline, on each experiment's primary cells; diamonds are guard cells. The first two rows are the planned prototype comparisons above; the rest used predeclared decision rules. Each experiment has its own cells, model and baseline, so the rows are not one pooled analysis.")

| Experiment | Change | Primary input ratio | Verdict |
| --- | --- | ---: | --- |
| H18 | List runs of similar items in full when the marker would hide ≤ 5 | 0.679 (table cells) | inconclusive |
| H310 | A snapshot cut for budget fills `main` first and drops link URLs | **0.768** | support |
| H321 | H310 on live sites | none | stopped |
| H323 | Compact inline `browser_find` results | **0.878** | support |
| H89 | Tell the agent the viewed tab is the user's before its first write | **0.746** | support |
| #472 | Tell the agent a copied tab has new refs | 1.001 | not supported |

**H18** shows why the guards are there. On the table cells the change met both support thresholds by a wide margin: 0.578 of the requests and 0.679 of the input, lower in all 24 pairs. Two guard cells, however, came in at 1.171 and 1.071, above the 1.05 limit, and the intervention had 4 recovered tool errors against 0. The change had no visible effect on those guard pages, so their difference is probably path variance, but the rule allowed no adoption claim from that cohort.

**H310** changed what a truncated snapshot keeps. When a page exceeded the snapshot budget, the first snapshot spent much of it on navigation links and their `/url:` lines, and the task's controls fell past the cut. B filled `main` first and dropped link URLs. Input fell to 0.768× on the crowded gallery, with guards at 0.973 and every gate held. B's truncated snapshots were about the same size as A's (8.9k vs 9.2k characters). The saving came from the agent acting on the first snapshot instead of searching for the section: `browser_find` calls fell from 60 to 18. The crowded fixture has 68 links sharing one URL, which inflates the effect. The issue was eventually resolved by a different change, Kitsune #319, which keeps `main` within the budget ahead of navigation link URLs.

**H321** was meant to test H310 on Wikipedia, MDN and Steam. I stopped it after 9 of 36 runs, a stop the protocol had not predeclared, because the change was never exercised. On live sites the agent never took an untargeted snapshot. It opened pages with `browser_tabs new`, moved around with `browser_find`, and scoped any snapshot to an element. Continuing would only have measured noise. The stopped cohort did show where live-site observations come from: `browser_find` produced 83% of tool-result characters and snapshots 5%.

**H323** followed from that measurement and compacted `browser_find`'s inline result. Input fell to 0.878×, just under the 0.90 threshold, and to 0.841× on the live cells alone. Find-result characters fell to 0.68×. The gain was concentrated on Wikipedia (0.62) and Steam (0.84), while MDN (1.17) and the long personal page (1.10) cost more. A small margin with mixed cells is still a support under the rule, and the report says so.

**H89** came from the coexistence rules. On main after v0.7.1, a write to the tab the user was viewing was held. A held run tried the write, received `needs_user`, opened its own tab, took a new snapshot and wrote again:

```text
tabs:list  snapshot  type!(needs_user)  tabs:new  snapshot  type  click  snapshot
```

On the held tasks, this made Kitsune use 1.35× Playwright's input. H89 added one sentence to the `browser_tabs` `list` and `select` results: the user is viewing this tab, writes there return `needs_user`, so open the page in a tab of your own first. Runs with a hold fell from 31 to 1, and every B run opened its own tab before the first write. Input fell to 0.746×, lower in 31 of 32 units, and Kitsune's input relative to Playwright on these units went from 1.35× to 1.007×. The hint shipped (#416), and v0.7.2 went further and replaced the hold with the read-only refusal described above.

**#472** tried the same move on a smaller problem. Refs are per document, and an agent that opened a copy of the user's tab sometimes sent a write with the old tab's refs in the same request, which failed with `stale_ref`. A sentence saying the new tab has new refs did not stop it (2 of 16 runs in B, 3 of 16 in A), and it may have split some requests in two. Input was unchanged at 1.001×. Not every agent mistake is a missing sentence.

The supported changes have something in common. H310 skipped search rounds, H323 kept large find results from being carried through the rest of the run, and H89 removed a failed write and its recovery. None of them made an individual observation dramatically smaller. They removed requests the agent did not need to make, and each request re-sends the whole prefix and history.

## Release-level results

The release cohorts compare Kitsune with Playwright MCP 0.0.83 on the same tasks, model (Claude Opus 5.5, medium effort) and 23-tool allowlist, one attempt per task.

![Benchmark chart of Kitsune v0.7.2 against Playwright MCP 0.0.83: user's tab kept in front 28 of 28 versus 2 of 28; list-price cost on tasks both solved 0.97×, 0.56× and 0.87× of Playwright's for personal, crowded and isolated tasks; task success 96 of 98 versus 98 of 98.](assets/posts/kitsune/benchmark.png "Figure 4. The v0.7.2 release cohort. Cost is Claude Code's list-price estimate, not an actual charge; the input-token ratios are in the table below.")

| Kitsune ÷ Playwright input, jointly solved units (v0.7.2) | Ratio |
| --- | ---: |
| Personal | 0.985 |
| Gallery, crowded | **0.625** |
| Gallery, isolated | 0.962 |
| Coexistence | 0.936 |
| External (live sites) | 0.936 |

Kitsune's two misses are one task in two variants: "note the return period, then go back to the order tab." The order tab never left the front, which is the point of the design. But the grader reads Kitsune's current tab as the one in front, and the agent left its own memo tab current. I count that as a grading mismatch I have not resolved, not as a pass.

The personal ratio is the one I watch most, and it is the least flattering. In the v0.7.0 cohort it was 0.807, and on the held tasks on main after v0.7.1 it was 1.35. The tasksets changed between those cohorts, so I do not read the sequence as a release trend. Within one taskset, H89 showed the shift was mostly the cost of the hold. In v0.7.2, 33 of 56 personal runs had a `select` refused on a user tab and then opened their own tab. That is cheaper than a hold, but it is still a round trip that Playwright, which owns every tab, never pays.

## What these results do not show

- **One attempt per task in the release cohorts.** Targets ran concurrently, with no counterbalanced order and different cache states. Read the release ratios as observations, not causal estimates. The A/B experiments are counterbalanced but have 2–4 repeats per cell.
- **One model family per experiment.** The early prototypes ran on Haiku and everything later on Opus, all through Claude Code. Description truncation alone shows how much the client matters.
- **Fixture effects.** The crowded gallery's shared-URL links favor URL-dropping changes. Live-site tasks behaved differently enough that H321 never exercised its change.
- **No comparison with Firefox-native peers.** The comparison is with Playwright MCP, which solves a different problem. The results say nothing about other extension-based tools.
- **No RAM or resource claim.** Reusing the user's browser should avoid a second browser process, but I have not measured it.
- **No protection against prompt injection.** Kitsune limits where the agent can write. It does nothing about a page that tells the agent what to do.

## What I would check first next time

1. **Read the exact request the client sends.** The biggest surprise in this project came from a logging proxy, not from a benchmark: the client was truncating tool descriptions, and part of my "progress" was the client's.
2. **Count requests before characters.** Every supported change removed requests. In a run where each request re-sends the prefix and history, an extra round trip costs more than a verbose result.
3. **Check that the change is exercised before measuring it.** H321 cost nine runs to learn that agents on live sites never took the snapshot it changed. A no-model in-effect check on real trajectories would have caught that.
4. **Write the guard cells and the stop rule into the protocol.** H18 looked like a clear win on its primary cells. The guards were the only reason it was not adopted on that evidence.
5. **Make the coexistence contract a gate for every optimization.** Several costs came from the coexistence rules, and the cheapest fix for the hold was one sentence, not a weaker rule.

The open question is the one H89 and v0.7.2 point to: how much of the remaining personal-task cost is the price of sharing a browser, and how much is interface the agent still has to work around? A held write, a refused `select` and a stale ref after copying a tab all cost a round trip that a browser of its own would not. I would rather make that cost small than give up the shared browser to remove it.
