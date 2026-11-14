/* Post-release smoke test against the LIVE site (#64).
 *
 * Every merge to main is a production deploy (Pages serves /docs) and this repo
 * has no CI, so nothing used to check the site after it changed. Run this after
 * every merge, once the Pages build shows `built`, and paste the summary on the
 * PR:
 *
 *   node tools/smoke-live.mjs              # HTTP tests 1-6, no dependencies
 *   node tools/smoke-live.mjs --browser    # also 7-8, if Playwright is installed
 *
 * Read-only by design: one GET per URL (plus one read-only getPrice call), at
 * most 4 in flight, no sign-in, no forms, nothing that buys. The browser tests
 * never click anything but the page itself.
 *
 * Prints one PASS / FAIL / SKIP line per test, each FAIL naming the URL and the
 * reason, then a summary. Exits 1 if anything failed.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { SITE } from './site.mjs';

const REPO_SITEMAP = fileURLToPath(new URL('../docs/sitemap.xml', import.meta.url));
const MAKERS = ['calendar', 'cards', 'forms', 'paper', 'puzzles', 'tracker', 'worksheets'];
const KEY_PAGES = ['/', '/calendar/', '/pro/'];
const GET_PRICE = 'https://us-central1-ptk-studio-allprintable.cloudfunctions.net/getPrice';
// The live Pro price (#55). A change here is deliberate; a mismatch is a finding.
const EXPECTED_PRICE = { amount: 500, currency: 'usd', interval: 'month', livemode: true };
const TIMEOUT_MS = 15000;
const CONCURRENCY = 4;

const results = [];
const record = (status, name, detail = '') => {
  results.push({ status, name, detail });
  console.log(`${status.padEnd(4)} ${name}${detail ? ` — ${detail}` : ''}`);
};

async function get(url, { redirect = 'manual' } = {}) {
  const res = await fetch(url, { redirect, signal: AbortSignal.timeout(TIMEOUT_MS) });
  const body = res.status === 200 ? await res.text() : '';
  return { status: res.status, location: res.headers.get('location'), body };
}

// Run fn over items with at most CONCURRENCY in flight; collect failures.
async function pool(items, fn) {
  const failures = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      try {
        const why = await fn(item);
        if (why) failures.push(`${item}: ${why}`);
      } catch (err) {
        failures.push(`${item}: ${err.name === 'TimeoutError' ? 'timed out' : err.message}`);
      }
    }
  });
  await Promise.all(workers);
  return failures;
}

const statusWhy = (r) =>
  r.status === 200 ? null : `HTTP ${r.status}${r.location ? ` -> ${r.location}` : ''}`;

const sameOriginAssets = (html, pageUrl) =>
  [...html.matchAll(/<(?:script|link)\b[^>]*?\s(?:src|href)="([^"]+\.(?:js|css))(?:\?[^"]*)?"/g)]
    .map((m) => new URL(m[1], pageUrl))
    .filter((u) => u.origin === new URL(SITE).origin)
    .map((u) => u.href);

async function test(name, fn) {
  try {
    const why = await fn();
    if (why === 'SKIP') return;
    record(why ? 'FAIL' : 'PASS', name, why || '');
  } catch (err) {
    record('FAIL', name, err.message);
  }
}

// 1. robots.txt names the sitemap.
await test('1 robots.txt names the sitemap', async () => {
  const r = await get(`${SITE}/robots.txt`);
  if (r.status !== 200) return `${SITE}/robots.txt ${statusWhy(r)}`;
  return r.body.includes(`Sitemap: ${SITE}/sitemap.xml`) ? null : `${SITE}/robots.txt has no "Sitemap: ${SITE}/sitemap.xml"`;
});

// 2. Sitemap: parses, no fewer URLs than the repo's, all on SITE, all 200 with no redirect.
await test('2 sitemap: every listed URL returns 200', async () => {
  const r = await get(`${SITE}/sitemap.xml`);
  if (r.status !== 200) return `${SITE}/sitemap.xml ${statusWhy(r)}`;
  if (!r.body.includes('<urlset')) return `${SITE}/sitemap.xml has no <urlset>`;
  const locs = [...r.body.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  const floor = (readFileSync(REPO_SITEMAP, 'utf8').match(/<loc>/g) || []).length;
  if (locs.length < floor) return `live sitemap lists ${locs.length} URLs, repo's docs/sitemap.xml lists ${floor}`;
  const foreign = locs.filter((u) => !u.startsWith(`${SITE}/`));
  if (foreign.length) return `not on ${SITE}: ${foreign.slice(0, 3).join(', ')}`;
  const failures = await pool(locs, async (u) => statusWhy(await get(u)));
  return failures.length ? `${failures.length}/${locs.length} failed: ${failures.slice(0, 5).join('; ')}` : null;
});

// 3. Key pages: 200, a title, exactly one H1, canonical = SITE + path.
await test(`3 key pages (${KEY_PAGES.join(', ')}): title, one H1, canonical`, async () => {
  const failures = await pool(KEY_PAGES, async (path) => {
    const url = SITE + path;
    const r = await get(url);
    if (r.status !== 200) return statusWhy(r);
    const title = (r.body.match(/<title>([^<]*)<\/title>/) || [])[1];
    if (!title || !title.trim()) return 'empty or missing <title>';
    const h1s = (r.body.match(/<h1[\s>]/g) || []).length;
    if (h1s !== 1) return `${h1s} <h1> elements, expected 1`;
    const canonical = (r.body.match(/<link rel="canonical" href="([^"]+)"/) || [])[1];
    if (canonical !== url) return `canonical is ${canonical || 'missing'}, expected ${url}`;
    return null;
  });
  return failures.length ? failures.join('; ') : null;
});

// 4. The 7 makers, and every same-origin script and stylesheet they load.
await test(`4 the ${MAKERS.length} makers and their scripts/styles return 200`, async () => {
  const pages = MAKERS.map((m) => `${SITE}/printables/${m}/`);
  const assets = new Set();
  const failures = await pool(pages, async (url) => {
    const r = await get(url);
    if (r.status !== 200) return statusWhy(r);
    const found = sameOriginAssets(r.body, url);
    if (!found.length) return 'references no scripts or styles (page broken?)';
    found.forEach((a) => assets.add(a));
    return null;
  });
  failures.push(...(await pool([...assets], async (u) => statusWhy(await get(u)))));
  return failures.length ? failures.join('; ') : null;
});

// 5. A path that doesn't exist is a real 404, not a catch-all 200.
await test('5 an unknown path returns 404', async () => {
  const url = `${SITE}/smoke-test-no-such-page-${Date.now()}/`;
  const r = await get(url);
  return r.status === 404 ? null : `${url} returned HTTP ${r.status}, expected 404`;
});

// 6. The checkout backend answers: one read-only getPrice call, the same one /pro/ makes.
await test('6 getPrice returns the live $5.00/month price', async () => {
  const res = await fetch(GET_PRICE, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: '{"data":{}}',
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
  if (res.status !== 200) return `${GET_PRICE} HTTP ${res.status}`;
  const { result } = await res.json();
  const wrong = Object.entries(EXPECTED_PRICE).filter(([k, v]) => result?.[k] !== v);
  return wrong.length
    ? `${GET_PRICE} ${wrong.map(([k, v]) => `${k}=${JSON.stringify(result?.[k])} (expected ${JSON.stringify(v)})`).join(', ')}`
    : null;
});

// 7-8. Optional browser tests: only with --browser, and only if Playwright is
// already installed (it is not a dependency of this repo).
if (process.argv.includes('--browser')) {
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    record('SKIP', '7 makers render in a browser', 'Playwright is not installed');
    record('SKIP', '8 consent before analytics, /pro/ price', 'Playwright is not installed');
  }
  if (chromium) {
    const browser = await chromium.launch();
    try {
      await test('7 makers render a preview with no console errors', async () => {
        const failures = [];
        for (const m of MAKERS) {
          const ctx = await browser.newContext();
          const page = await ctx.newPage();
          const errors = [];
          page.on('pageerror', (e) => errors.push(e.message));
          page.on('console', (msg) => msg.type() === 'error' && errors.push(msg.text()));
          const url = `${SITE}/printables/${m}/`;
          await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
          const ok = await page
            .waitForFunction(() => {
              const c = document.querySelector('#canvas');
              return c && c.children.length > 0 && !c.querySelector('.empty');
            }, null, { timeout: 10000 })
            .then(() => true, () => false);
          if (!ok) failures.push(`${url}: #canvas did not render a preview`);
          if (errors.length) failures.push(`${url}: console error: ${errors[0]}`);
          await ctx.close();
        }
        return failures.length ? failures.join('; ') : null;
      });

      await test('8 consent banner before any analytics; /pro/ shows the price', async () => {
        const failures = [];
        const ctx = await browser.newContext(); // fresh storage: no consent choice yet
        const page = await ctx.newPage();
        const analytics = [];
        page.on('request', (req) => {
          const u = req.url();
          if (/google-analytics\.com|googletagmanager\.com|firebase-analytics/.test(u)) analytics.push(u);
        });
        await page.goto(`${SITE}/`, { waitUntil: 'networkidle', timeout: 30000 });
        if (!(await page.locator('#consent-bar').isVisible().catch(() => false))) {
          failures.push(`${SITE}/: consent banner #consent-bar not shown`);
        }
        if (analytics.length) failures.push(`${SITE}/: analytics loaded before consent: ${analytics[0]}`);
        // Never clicks Allow, Get Pro or anything else.
        await page.goto(`${SITE}/pro/`, { waitUntil: 'networkidle', timeout: 30000 });
        const price = await page
          .waitForFunction(() => document.querySelector('.pro-price')?.textContent.trim(), null, { timeout: 10000 })
          .then((h) => h.jsonValue(), () => '');
        if (!price) failures.push(`${SITE}/pro/: no price shown in .pro-price`);
        if ((await page.content()).includes('Checkout is not connected')) {
          failures.push(`${SITE}/pro/: shows "Checkout is not connected"`);
        }
        await ctx.close();
        return failures.length ? failures.join('; ') : null;
      });
    } finally {
      await browser.close();
    }
  }
}

const count = (s) => results.filter((r) => r.status === s).length;
console.log(`\n${count('PASS')} passed, ${count('FAIL')} failed, ${count('SKIP')} skipped — ${SITE}, ${new Date().toISOString()}`);
process.exit(count('FAIL') ? 1 : 0);
