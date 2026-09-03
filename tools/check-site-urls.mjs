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

/* Not a failure — a file may legitimately carry no absolute URL of ours — but
   the seven makers and /pro/ each carry a canonical today and robots.txt names
   the sitemap, so a zero in one of those means it was dropped and this check
   passed over the file without seeing anything. */
if (empty.length) {
  console.log(`check-site-urls: no URL of ours in ${empty.join(', ')} — worth a look; each of these carries one today.`);
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
 * found, and silently is not. */
const pages = files.filter((f) => f.path.endsWith('/index.html'));
if (existsSync('docs/sitemap.xml') && pages.length) {
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
    console.error(`check-site-urls: ${missing.length} hand-written page(s) exist under docs/ but are not in docs/sitemap.xml:`);
    for (const path of missing) console.error(`  ${path}`);
    console.error('Add them to the urls list in tools/build-landing.mjs and rerun it. A page absent from the sitemap and unlinked from elsewhere is a page nothing crawls.');
    process.exit(1);
  }
  console.log(`check-site-urls: all ${pages.length} hand-written page(s) appear in docs/sitemap.xml.`);
}
