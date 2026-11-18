# DAILY-CHECKS: All Printable (app.all-printable.com)

What is checked every day (R97; the standard is in the hub's `project-groups/AGENTS.md` → 'Daily checks'). The worker runs these in its first sweep of the day and writes the results into the manager's daily analytics; a major problem goes to the Owner the same sweep.

| Check | Where | Healthy looks like | If not, do this | Who |
|---|---|---|---|---|
| New user feedback (R64) | 88eggs Feedback inbox for this project; the hub feedback digest | every message read within a day | reply or file a Task; a bug report goes to the manager the same sweep | mm1-worker1 (first sweep of the day) · read by mm1-manager1 |
| AI cost yesterday (R83) | `mochi-factory/costs/<YYYY-MM>.csv` (hub), rows for this project | within its share of the $15/day, $300/month cap | flag to the manager; pause the costliest schedule if over (the manager's call) | mm1-worker1 (first sweep of the day) · read by mm1-manager1 |
| Site up and smoke test | `https://app.all-printable.com/` + `node tools/smoke-live.mjs` | HTTPS 200; the smoke test passes | tell the manager; revert the last release if it broke | mm1-worker1 (first sweep of the day) · read by mm1-manager1 |
| Pro subscriptions (Stripe) | Stripe (the Owner's account; read by director1) | new and cancelled subscriptions read | note in the Monday digest | director1 · read by mm1-manager1 |
| Certificate expiry | `https://app.all-printable.com` | > 14 days | tell the manager | mm1-worker1 (first sweep of the day) · read by mm1-manager1 |
