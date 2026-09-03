/* Fails when a hand-maintained page carries an absolute URL of ours that
 * disagrees with SITE.
 *
 * The generators write 33 pages and take every absolute URL from
 * tools/site.mjs, so changing SITE and rerunning them keeps those in step.
 * Nothing writes the seven makers under docs/printables/ or docs/pro/ — they
 * are typed by hand, and their canonicals are the only URLs on the site that
 * do not flow from the constant. Change SITE and they would silently keep
 * pointing at the old origin while sitemap.xml advertised the new one, which
 * asks the index to prefer a host the sitemap no longer names.
 *
 * Run it from the repo root after changing SITE, alongside the generators:
 *
 *   node tools/check-site-urls.mjs
 *
 * Nothing runs it automatically; this repo has no CI. It exits 1 on a
 * disagreement, 2 if it found no pages to check at all.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { SITE } from './site.mjs';

/* The pages no generator writes. Read from disk rather than hardcoded, so an
   eighth maker is covered the day it is added. */
function handMaintainedPages() {
  const pages = [];
  const makers = 'docs/printables';
  if (existsSync(makers)) {
    for (const dir of readdirSync(makers, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      const page = `${makers}/${dir.name}/index.html`;
      if (existsSync(page)) pages.push(page);
    }
  }
  if (existsSync('docs/pro/index.html')) pages.push('docs/pro/index.html');
  return pages.sort();
}

const APEX = 'all-printable.com';
const expected = new URL(SITE).origin;

/* Ours is the apex or any subdomain of it — app. today, something else on a
   staging host. A different host is not ours to keep in step: ptk-studio.com
   in /pro/ and the w3.org SVG namespace in every one of these files are both
   correct as they stand. */
const isOurs = (host) => host === APEX || host.endsWith(`.${APEX}`);

const pages = handMaintainedPages();
if (pages.length === 0) {
  console.error('check-site-urls: no hand-maintained pages found — run this from the repo root.');
  process.exit(2);
}

const offenders = [];
const empty = [];
let checked = 0;

for (const page of pages) {
  const html = readFileSync(page, 'utf8');
  let ours = 0;
  for (const match of html.match(/https?:\/\/[^\s"'<>()]+/g) ?? []) {
    let url;
    try {
      url = new URL(match);
    } catch {
      continue;
    }
    if (!isOurs(url.hostname)) continue;
    ours += 1;
    checked += 1;
    if (url.origin !== expected) offenders.push({ page, url: match });
  }
  if (ours === 0) empty.push(page);
}

if (offenders.length) {
  console.error(`check-site-urls: ${offenders.length} URL(s) disagree with SITE (${expected}):`);
  for (const { page, url } of offenders) console.error(`  ${page}  ${url}`);
  console.error('These pages are hand-maintained: no generator will fix them. Edit them by hand, or put SITE back.');
  process.exit(1);
}

console.log(`check-site-urls: ${checked} URL(s) across ${pages.length} hand-maintained page(s) agree with SITE (${expected}).`);

/* Not a failure — a page may legitimately carry no absolute URL of ours — but
   these seven and /pro/ each carry a canonical today, so a zero here means one
   was dropped and this check passed over the page without seeing anything. */
if (empty.length) {
  console.log(`check-site-urls: no URL of ours in ${empty.join(', ')} — worth a look; every one of these pages carries a canonical.`);
}
