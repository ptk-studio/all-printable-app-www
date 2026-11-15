#!/usr/bin/env bash
# Release checks for app.all-printable.com (RELEASE-CHECKS.md). Runs the repo's existing checks in order.
#   tools/release-check.sh pre    # on the PR branch: generators in step, URL/sitemap rules, unit tests, no secrets
#   tools/release-check.sh post   # after the merge's Pages build: build status + tools/smoke-live.mjs
# Read-only: nothing is written outside the working tree, nothing signs in, nothing buys.
set -u
cd "$(dirname "$0")/.."
REPO=ptk-studio/all-printable-app-www
fail=0; ok(){ printf 'PASS  %s\n' "$1"; }; bad(){ printf 'FAIL  %s\n' "$1"; fail=1; }

pre(){
  git diff --quiet && git diff --cached --quiet || { bad "uncommitted changes: commit first, so the generator check is meaningful"; return; }
  node tools/build-categories.mjs >/dev/null 2>&1 && node tools/build-landing.mjs >/dev/null 2>&1 || bad "a page generator failed"
  if git diff --quiet; then ok "generated pages and sitemap match their generators (no diff after re-running them)"
  else bad "generators changed files (commit the regenerated output):"; git diff --stat | sed 's/^/      /'; git checkout -q -- .; fi
  node tools/check-site-urls.mjs >/dev/null 2>&1 && ok "check-site-urls: origins, descriptions, sitemap coverage" || bad "check-site-urls failed (run it for details)"
  node --test tools/test-query-start.mjs >/dev/null 2>&1 && ok "test-query-start (preset/year URL parsing)" || bad "test-query-start failed"
  (cd functions && node --test test-entitlement.js >/dev/null 2>&1) && ok "functions/test-entitlement (Pro entitlement rules)" || bad "test-entitlement failed"
  base=$(git merge-base HEAD origin/main)
  if git diff "$base"...HEAD -- . ':!tools/release-check.sh' | grep -E '^\+' | grep -Eq 'sk_live_[A-Za-z0-9]{10,}|rk_live_[A-Za-z0-9]{10,}|whsec_[A-Za-z0-9]{10,}|AKIA[0-9A-Z]{16}|"private_key"'; then
    bad "possible secret in the diff (Stripe live/webhook key or a service-account key)"; else ok "no secret-like strings in the diff"; fi
}

post(){
  st=$(gh api repos/$REPO/pages/builds/latest --jq '.status+" "+.commit[0:7]' 2>/dev/null)
  main=$(git ls-remote "https://github.com/$REPO" refs/heads/main | cut -c1-7)
  [ "$st" = "built $main" ] && ok "Pages build: $st" || bad "Pages build '$st', main is $main"
  node tools/smoke-live.mjs | sed 's/^/      /'; [ "${PIPESTATUS[0]}" = 0 ] && ok "smoke-live" || bad "smoke-live"
}
case "${1:-}" in pre) pre;; post) post;; *) echo "usage: $0 pre|post"; exit 2;; esac
exit $fail
