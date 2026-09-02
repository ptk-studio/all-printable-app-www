/* Generates one landing page per printable into docs/<slug>/index.html.
 *
 * The site itself stays buildless — this is a maintenance tool whose output is
 * committed, not a step in serving or deploying. Run it after editing the
 * registry or tools/landing-copy.js:
 *
 *   node tools/build-landing.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { SITE } from './site.mjs';

const require = createRequire(import.meta.url);
const copy = require('../tools/landing-copy.js');

/* The registry is a browser script; evaluate it against a minimal shim. */
const AP = {};
const sandbox = { window: { AP }, AP };
new Function('window', 'AP', readFileSync('docs/assets/js/registry.js', 'utf8'))(sandbox.window, AP);
const printables = sandbox.window.AP.PRINTABLES;
const categories = sandbox.window.AP.CATEGORIES;

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Read a PNG's dimensions from its IHDR so the <img> can carry width and
   height and the page does not shift as the image loads. */
function pngSize(path) {
  if (!existsSync(path)) return null;
  const b = readFileSync(path);
  if (b.length < 24 || b.readUInt32BE(12) !== 0x49484452) return null;
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) };
}

function related(entry) {
  return printables
    .filter((p) => p.cat === entry.cat && p.id !== entry.id && copy[p.id])
    .slice(0, 4);
}

function page(entry, c) {
  /* The home page no longer lists every printable, so the crumb and the nav
     point at the category's own page rather than an anchor on the home page. */
  const cat = categories.find((x) => x.id === entry.cat) || {};
  const catName = cat.label || '';
  const maker = '../' + entry.href;
  const title = `${c.h1} — free, true to size · All Printable`;
  const desc = c.intro.replace(/\s+/g, ' ');
  const shot = pngSize(`docs/assets/previews/${entry.id}.png`);
  const shotUrl = `${SITE}/assets/previews/${entry.id}.png`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: c.h1,
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Any',
    url: `${SITE}/${entry.id}/`,
    description: desc.slice(0, 300),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    ...(shot ? { image: shotUrl } : {})
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc.slice(0, 200))}">
<link rel="canonical" href="${SITE}/${entry.id}/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="All Printable">
<meta property="og:title" content="${esc(c.h1)}">
<meta property="og:description" content="${esc(desc.slice(0, 200))}">
<meta property="og:url" content="${SITE}/${entry.id}/">
${shot ? `<meta property="og:image" content="${shotUrl}">
<meta property="og:image:width" content="${shot.w}">
<meta property="og:image:height" content="${shot.h}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:image" content="${shotUrl}">` : '<meta name="twitter:card" content="summary">'}
<meta name="twitter:title" content="${esc(c.h1)}">
<meta name="twitter:description" content="${esc(desc.slice(0, 200))}">
<link rel="stylesheet" href="../assets/css/base.css">
<link rel="stylesheet" href="../assets/css/home.css">
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='3' y='6' width='26' height='23' rx='3' fill='none' stroke='%23b4472e' stroke-width='2.5'/><path d='M3 13h26' stroke='%23b4472e' stroke-width='2.5'/><path d='M10 3v6M22 3v6' stroke='%23b4472e' stroke-width='2.5' stroke-linecap='round'/></svg>">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>

<header class="site-header">
  <a class="brand" href="../index.html"><span class="brand-mark"></span> All Printable</a>
  <nav class="nav"><a href="../index.html">All printables</a>${
    cat.slug ? `<a href="../${cat.slug}/">${esc(cat.label)}</a>` : ''}</nav>
  <span class="spacer"></span>
  <a class="btn btn-sm btn-primary" href="${esc(maker)}">Open the maker</a>
</header>

<div class="wrap lp">
  <nav class="lp-crumbs" aria-label="Breadcrumb">
    <a href="../index.html">All printables</a> <span>/</span>
    <a href="../${esc(cat.slug || '')}/">${esc(catName)}</a>
  </nav>

  <div class="lp-hero">
    <div class="lp-hero-copy">
      <h1>${esc(c.h1)}</h1>
      <p class="lp-intro">${esc(c.intro)}</p>
      <p class="lp-cta">
        <a class="btn btn-primary" href="${esc(maker)}">Open the maker</a>
        <span class="lp-free">Free · no sign-up · nothing uploaded</span>
      </p>
    </div>
    ${shot ? `<figure class="lp-shot">
      <a href="${esc(maker)}"><img src="../assets/previews/${entry.id}.png"
        width="${shot.w}" height="${shot.h}" loading="lazy" decoding="async"
        alt="A ${esc(c.h1.replace(/^Printable /i, '').toLowerCase())} sheet made with this generator"></a>
      <figcaption>An actual sheet from the maker, not a mock-up</figcaption>
    </figure>` : ''}
  </div>

  <section class="lp-cols">
    <div>
      <h2>What you can change</h2>
      <ul class="lp-points">
        ${c.points.map((p) => `<li>${esc(p)}</li>`).join('\n        ')}
      </ul>
    </div>
    <div>
      <h2>At a glance</h2>
      <table class="lp-specs">
        ${c.specs.map(([k, v]) => `<tr><th>${esc(k)}</th><td>${esc(v)}</td></tr>`).join('\n        ')}
      </table>
    </div>
  </section>

  <section class="lp-print">
    <h2>Printing it correctly</h2>
    <p>Choose <b>Print</b>, then pick <b>Save as PDF</b> as the destination if you want a file.
       Set scale to <b>100%</b> and margins to <b>None</b> — the sheet already carries its exact
       paper size, so the browser must not rescale it. Anything else and the dimensions you
       chose are no longer the dimensions on the page.</p>
  </section>

  <section class="lp-faq">
    <h2>Questions</h2>
    ${c.faq.map(([q, a]) => `<div><h3>${esc(q)}</h3><p>${esc(a)}</p></div>`).join('\n    ')}
  </section>

  ${related(entry).length ? `<section class="lp-related">
    <h2>Also in ${esc(catName.toLowerCase())}</h2>
    <div class="lp-links">
      ${related(entry).map((p) => `<a href="../${esc(p.id)}/">${esc(p.name)}</a>`).join('\n      ')}
    </div>
  </section>` : ''}

  <p class="lp-cta lp-cta-end">
    <a class="btn btn-primary" href="${esc(maker)}">Open the maker</a>
  </p>
</div>

<footer class="site-footer">
  <div class="wrap">
    <div class="row-wrap">
      <span>All Printable — printable generators that respect the paper.</span>
      <span class="spacer"></span>
      <a href="../index.html">All printables</a>
    </div>
  </div>
</footer>

</body>
</html>
`;
}

let made = 0, skipped = [];
for (const entry of printables) {
  const c = copy[entry.id];
  if (!c) { skipped.push(entry.id); continue; }
  if (entry.status !== 'live' || !entry.href) { skipped.push(entry.id); continue; }
  mkdirSync(`docs/${entry.id}`, { recursive: true });
  writeFileSync(`docs/${entry.id}/index.html`, page(entry, c));
  made++;
}

/* Sitemap covers the home page, the six category pages, the makers and every
   landing page. */
const makers = ['calendar', 'paper', 'tracker', 'cards', 'puzzles', 'forms', 'worksheets'];
const urls = [
  { loc: `${SITE}/`, pri: '1.0' },
  ...categories.map((c) => ({ loc: `${SITE}/${c.slug}/`, pri: '0.8' })),
  ...makers.map((m) => ({ loc: `${SITE}/printables/${m}/`, pri: '0.7' })),
  ...printables.filter((p) => copy[p.id] && p.status === 'live')
    .map((p) => ({ loc: `${SITE}/${p.id}/`, pri: '0.9' }))
];
writeFileSync('docs/sitemap.xml',
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map((u) => `  <url><loc>${u.loc}</loc><changefreq>monthly</changefreq><priority>${u.pri}</priority></url>`).join('\n') +
  '\n</urlset>\n');

console.log(`landing pages written: ${made}`);
console.log(`sitemap urls: ${urls.length}`);
if (skipped.length) console.log(`skipped (no copy or not live): ${skipped.join(', ')}`);
