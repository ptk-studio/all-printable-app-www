# AGENTS.md

## Agent files: `mochi-agent/`

The files the Mochi factory's agents generate and manage live in [`mochi-agent/`](mochi-agent/README.md): `PROJECT.md`, `METRICS.md`, `HEALTH-CHECK.md`, `RELEASE-CHECKS.md`, `FEEDBACK.md`, `JOURNAL.md`, `plans/` and `proposals/` (standard layout: ptk-studio/ptk-studio → `mochi-factory/README.md`, "The mochi-agent/ folder in every project repo").

## Schedules, daily checks and release checks

- **What runs on a schedule:** [`SCHEDULE.md`](SCHEDULE.md) (R93).
- **What is checked every day:** [`DAILY-CHECKS.md`](DAILY-CHECKS.md) (R97).
- **Before any release: run every check in `mochi-agent/RELEASE-CHECKS.md`; the First run (or First visit) section is blocking.**
