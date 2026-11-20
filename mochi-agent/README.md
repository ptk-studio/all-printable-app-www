# mochi-agent

This folder is generated and managed by the **Mochi factory's
agents** (PTK Studio's agent setup). How the factory works:
[mochi-factory/README.md](https://github.com/ptk-studio/ptk-studio/blob/main/mochi-factory/README.md). The project's worker writes it through
PRs reviewed by the manager (prj-manager1), and the Owner approves
the plans. Don't edit it by hand outside that process.

- `plans/<YYYY>.md`: the yearly plan (direction, research,
  competition, monetization, quality, and the year's metric goals
  with quarterly targets).
- `plans/<YYYY>-Q<n>.md`: the quarterly plans, which hit the yearly
  plan's quarterly targets, each with an on-track/off-track review of
  the last quarter. (`plans/2026-12.md` was a one-month bridge plan.)
- `PROJECT.md`, `JOURNAL.md`, `METRICS.md` (if present): the agent's
  project notes.

Each plan has a `Status:` line (proposed, or approved with the date).

**Every PTK Studio project and its GitHub repos:** [mochi-factory/project-groups/PROJECTS.md](https://github.com/ptk-studio/ptk-studio/blob/main/mochi-factory/project-groups/PROJECTS.md).
