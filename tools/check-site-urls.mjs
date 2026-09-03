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
 * Run it from the repo root after changing SITE, alongside the generators:
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
