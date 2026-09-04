/* Fails when a hand-maintained file carries an absolute URL of ours that
 * disagrees with SITE.
 *
 * The generators write 33 pages and docs/sitemap.xml, and take every absolute
 * URL from tools/site.mjs, so changing SITE and rerunning them keeps those in
 * step. The seven makers under docs/printables/, docs/pro/ and docs/robots.txt
 * are typed by hand, and their URLs are the only ones on the site that do not
 * flow from the constant. Change SITE and they would silently keep pointing at
 * the old origin while sitemap.xml advertised the new one — asking the index
 * to prefer a host the sitemap no longer names, and, in robots.txt, pointing
 * every crawler at a sitemap on the old origin.
 *
 * It also fails when a hand-written page under docs/ is missing from
 * docs/sitemap.xml — see the second check at the foot of the file.
 *
 * Run it from the repo root after changing SITE or adding a hand-written page,
 * alongside the generators:
 *
 *   node tools/check-site-urls.mjs
 *
 * Nothing runs it automatically; this repo has no CI. It exits 1 on a
 * disagreement, 2 if it found no pages to check at all.
 *
 * ---------------------------------------------------------------------------
 * Every fault is collected and reported; only then does the script exit.
 *
 * It used to exit from wherever a fault was found, and with no CI behind it
 * that made the run that told you least the run where most was wrong: you
 * fixed the one reported fault, reran, and only then met the second. Worse,
 * two of the three faults below did not fail at all — absence was read as
 * "nothing to say" rather than as the thing going missing:
 *
 *   - a hand-maintained file carrying no URL of ours       was a note, exit 0
 *   - docs/sitemap.xml itself being absent                 skipped the whole
 *                                                          second check, exit 0
 *   - a page absent from the sitemap                       exit 1, but from
 *                                                          the middle
 *
 * A missing sitemap means every page on the site is unlisted, which is
 * strictly worse than the single omission the second check was written for —
 * so once again the most severe failure had the weakest signal.
 *
 * The one exit that stays where it is is the SITE disagreement: once the
 * origin is wrong, nothing measured after it can be trusted, so there is
 * nothing to be gained by collecting more.
 *
 * exit 0  nothing wrong
 * exit 1  one or more faults, all of them listed
 * exit 2  no hand-maintained files found at all — you ran this from the wrong
 *         directory. Deliberately distinct from 1: a missing sitemap in a tree
 *         that does have makers is a real fault, not a bad cwd.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { SITE } from './site.mjs';

/* Every file under docs/ that no generator writes — not only the pages, since
   robots.txt carries the sitemap URL and is typed by hand like the rest.
   docs/index.html and docs/sitemap.xml are generated and so are left out;
   docs/CNAME holds a bare host rather than a URL, so there is nothing here to
   compare, and the README says to edit it when the origin changes.

   The makers are read from disk rather than hardcoded, so an eighth is covered
   the day it is added. `carriesOne` marks the files that hold a URL of ours
   today: a zero there means one was dropped, which is worth saying. 404.html
   holds none and is listed so it is covered the day it gains one. */
function handMaintainedFiles() {
  const files = [];
  const makers = 'docs/printables';
  if (existsSync(makers)) {
    for (const dir of readdirSync(makers, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const page = `${makers}/${dir.name}/index.html`;
      if (existsSync(page)) files.push({ path: page, carriesOne: true });
    }
  }
  files.sort((a, b) => a.path.localeCompare(b.path));
  for (const path of ['docs/pro/index.html', 'docs/robots.txt']) {
    if (existsSync(path)) files.push({ path, carriesOne: true });
  }
  if (existsSync('docs/404.html')) files.push({ path: 'docs/404.html', carriesOne: false });
  return files;
}

const APEX = 'all-printable.com';
const expected = new URL(SITE).origin;

/* Ours is the apex or any subdomain of it — app. today, something else on a
   staging host. A different host is not ours to keep in step: ptk-studio.com
   in /pro/ and the w3.org SVG namespace in every one of these files are both
   correct as they stand. */
const isOurs = (host) => host === APEX || host.endsWith(`.${APEX}`);

const files = handMaintainedFiles();
if (files.length === 0) {
  console.error('check-site-urls: no hand-maintained files found — run this from the repo root.');
  process.exit(2);
}

/* Faults are pushed here and reported together at the foot. Each entry is a
   headline plus the lines that belong under it, so one run can explain several
   unrelated failures without them running into each other. */
const faults = [];
const fail = (headline, lines = [], hint = null) => faults.push({ headline, lines, hint });

const offenders = [];
const empty = [];
let checked = 0;

for (const { path, carriesOne } of files) {
  const text = readFileSync(path, 'utf8');
  let ours = 0;
  for (const match of text.match(/https?:\/\/[^\s"'<>()]+/g) ?? []) {
    let url;
    try {
      url = new URL(match);
    } catch {
      continue;
    }
    if (!isOurs(url.hostname)) continue;
    ours += 1;
    checked += 1;
    if (url.origin !== expected) offenders.push({ path, url: match });
  }
  if (ours === 0 && carriesOne) empty.push(path);
}

if (offenders.length) {
  console.error(`check-site-urls: ${offenders.length} URL(s) disagree with SITE (${expected}):`);
  for (const { path, url } of offenders) console.error(`  ${path}  ${url}`);
  console.error('These files are hand-maintained: no generator will fix them. Edit them by hand, or put SITE back.');
  process.exit(1);
}

console.log(`check-site-urls: ${checked} URL(s) across ${files.length} hand-maintained file(s) agree with SITE (${expected}).`);

/* A failure, though it reads like an absence. Only the files marked
   carriesOne reach this: the seven makers and /pro/ each carry a canonical
   today and robots.txt names the sitemap, so a zero in one of those means the
   URL was dropped and this check walked the file without seeing anything to
   compare. That is the check being blind, not the file being fine — which is
   why it used to pass, and why it no longer does. 404.html is marked
   carriesOne: false and is exempt, so it can gain a URL later without this
   complaining that it has none. */
if (empty.length) {
  fail(
    `${empty.length} hand-maintained file(s) carry no URL of ours, and each carries one today:`,
    empty,
    'A dropped canonical is invisible to every other check here: the file simply stops being compared. Put it back, or mark the file carriesOne: false in handMaintainedFiles() if it is genuinely meant to have none.'
  );
}

/* Second check: is every hand-written page actually in the sitemap?
 *
 * This is a different failure from the one above, and it is the one that
 * actually happened. /pro/ carried a correct canonical the whole time — it
 * would have passed every check above — and was simply absent from
 * sitemap.xml, so nothing crawled it. Nothing outside the site links to /pro/,
 * so the sitemap was its only route in.
 *
 * The reason is structural rather than careless. build-landing.mjs derives the
 * category and landing entries from JSON, so those cannot be forgotten; the
 * hand-written pages are typed into that list by hand, and a page added on its
 * own is easy to type into docs/ and not into the list. The files here are
 * already read from disk, so comparing them against the sitemap costs nothing
 * and covers the next hand-written page as well as today's.
 *
 * A missing entry is a failure, not a note: the page exists, is meant to be
 * found, and silently is not.
 *
 * And so is a missing sitemap. This block used to be wrapped in an existsSync
 * that skipped it silently when docs/sitemap.xml was gone, which meant the
 * check reported nothing at all in the one case where every page on the site
 * is unlisted — the same shape of mistake as the two above, in the code
 * written to fix them. Absence of the file is now the loudest fault here, not
 * the quietest. */
const pages = files.filter((f) => f.path.endsWith('/index.html'));
if (!existsSync('docs/sitemap.xml')) {
  fail(
    'docs/sitemap.xml does not exist.',
    [],
    'Every page on the site is unlisted, and robots.txt points crawlers at a sitemap that is not there. Run node tools/build-landing.mjs to regenerate it. This is a fault, not a reason to skip the check — which is what it used to be.'
  );
} else if (pages.length) {
  const sitemap = readFileSync('docs/sitemap.xml', 'utf8');
  const locs = new Set(
    [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
      try {
        return new URL(m[1]).pathname;
      } catch {
        return m[1];
      }
    })
  );
  /* docs/pro/index.html -> /pro/ */
  const missing = pages
    .map((f) => '/' + f.path.replace(/^docs\//, '').replace(/index\.html$/, ''))
    .filter((path) => !locs.has(path));

  if (missing.length) {
    fail(
      `${missing.length} hand-written page(s) exist under docs/ but are not in docs/sitemap.xml:`,
      missing,
      'Add them to the urls list in tools/build-landing.mjs and rerun it. A page absent from the sitemap and unlinked from elsewhere is a page nothing crawls.'
    );
  } else {
    console.log(`check-site-urls: all ${pages.length} hand-written page(s) appear in docs/sitemap.xml.`);
  }
}

/* The one exit for everything collected above. Each fault gets its own block,
   so a run with three faults says three things instead of the one it happened
   to reach first. */
if (faults.length) {
  console.error('');
  for (const { headline, lines, hint } of faults) {
    console.error(`check-site-urls: ${headline}`);
    for (const line of lines) console.error(`  ${line}`);
    if (hint) console.error(`  ${hint}`);
    console.error('');
  }
  console.error(`check-site-urls: ${faults.length} fault(s). Nothing here is fixed by a generator except where a hint says so.`);
  process.exit(1);
}
