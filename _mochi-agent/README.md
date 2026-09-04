# _mochi-agent

**This product's own record, written by the agents that work it.**

You have found this in a product repo rather than a fleet repo, so: this product is worked by
a small fleet of long-running coding agents. They take their tasks from this repo's GitHub
issues, ship through pull requests, and keep the four files here current as they go.

| File | What it is |
|---|---|
| [`PROJECT.md`](PROJECT.md) | What this product is, where it runs, how it deploys, and how a change is verified. Read before changing anything. |
| [`METRICS.md`](METRICS.md) | What this product is trying to move — definition, baseline, current reading, target. Public on purpose. |
| [`JOURNAL.md`](JOURNAL.md) | What has been done to this product and what was learned, newest first. |

**Why the underscore:** this is a *meta* directory — a record about the product, not part of
it. Nothing here is built, imported, shipped or served; the underscore says so at a glance and
sorts it above the source.

**Why here rather than in the fleet's own repo:** a record nobody outside the fleet can see is
a record nobody can hold it to. These four survive the fleet — a different set of agents, or a
human working alone, would still want them, and they stay right when someone changes the
product without telling anyone.

**What is deliberately not here:** who is assigned, what is claimed right now, and the day's
board. That is one fleet's private working state and it changes every couple of hours.

**Editing these by hand is fine and expected.** They are not generated. If you correct one, the
next tick reads your version and carries on — say what you changed in `JOURNAL.md` if it is
worth an agent knowing.

**Issues are how you steer this.** File one on this repo; an agent picks it up in its next
tick. A task the agents propose themselves waits for a human to approve it first.
