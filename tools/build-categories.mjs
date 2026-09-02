/* Generates the catalogue: docs/index.html plus one page per category into
 * docs/<slug>/index.html.
 *
 * The home page used to list all 26 printables at once, which made it long and
 * gave every printable the same weight. Each category now has its own page, and
 * the home page shows the six categories instead.
 *
 * Like the landing pages these are static and ship no JavaScript: their job is
 * to answer a browse or a search and hand the visitor to a maker.
 *
 *   node tools/build-categories.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { SITE } from './site.mjs';
import { loadPresets, makerOf, proPresets } from './presets.mjs';

const require = createRequire(import.meta.url);
const copy = require('../tools/landing-copy.js');

/* The registry and the art map are browser scripts; evaluate them on a shim. */
function load(path) {
  const AP = {};
  new Function('window', 'AP', readFileSync(path, 'utf8'))({ AP }, AP);
  return AP;
}
const { PRINTABLES: printables, CATEGORIES: categories } = load('docs/assets/js/registry.js');
const { ART } = load('docs/assets/js/art.js');

const ALL_PRESETS = loadPresets();

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const ICON = "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect x='3' y='6' width='26' height='23' rx='3' fill='none' stroke='%23b4472e' stroke-width='2.5'/><path d='M3 13h26' stroke='%23b4472e' stroke-width='2.5'/><path d='M10 3v6M22 3v6' stroke='%23b4472e' stroke-width='2.5' stroke-linecap='round'/></svg>";

/* A printable is only linkable if it is built and has a landing page written. */
const isLive = (p) => p.status === 'live' && !!p.href;
const hasLanding = (p) => isLive(p) && !!copy[p.id];

/* Pro presets reachable from a set of printables, grouped by the maker they
   live in. Deduped by maker, because six printables can share one engine and
   listing its presets six times helps nobody. */
function proSections(entries, up) {
  const makers = [...new Set(entries.map(makerOf).filter(Boolean))];
  const rows = [];
  for (const m of makers) {
    for (const p of proPresets(ALL_PRESETS, m)) rows.push(p);
  }
  if (!rows.length) return '';
  return `
  <section class="section">
    <div class="section-head">
      <h2>Pro presets here</h2>
      <p>Included with <a href="${up}pro/">Pro</a>. Everything above is free,
         and stays free.</p>
    </div>
    <ul class="lp-points pro-list">
${rows.map((p) => `      <li><b>${esc(p.name)}</b> ${esc(p.note)}</li>`).join('\n')}
    </ul>
  </section>`;
}

function card(p, up) {
  const art = `<svg viewBox="0 0 72 60" xmlns="http://www.w3.org/2000/svg">${ART[p.art] || ART.calendar}</svg>`;
  const bullets = (p.bullets || [])
    .map((b) => `<li>${esc(b)}</li>`).join('');

  /* The whole card is clickable via the stretched-link pattern rather than by
     nesting anchors, which is invalid and breaks keyboard navigation. */
  const title = hasLanding(p)
    ? `<a class="card-link" href="${up}${p.id}/"><h3>${esc(p.name)}</h3></a>`
    : `<h3>${esc(p.name)}</h3>`;

  return `      <div class="card${isLive(p) ? '' : ' is-soon'}">
        <div class="card-art">${art}</div>
        <div class="card-body">
          <div class="card-title">${title}${
            isLive(p) ? '' : '<span class="badge badge-soon">Planned</span>'}</div>
          <p>${esc(p.tagline)}</p>
          ${bullets ? `<ul>${bullets}</ul>` : ''}
          ${isLive(p) ? `<a class="card-go" href="${up}${p.href}">Open the maker →</a>` : ''}
        </div>
      </div>`;
}

function page(cat) {
  const items = printables.filter((p) => p.cat === cat.id);
  const live = items.filter(isLive);
  const others = categories.filter((c) => c.id !== cat.id);
  const title = `Printable ${cat.label.toLowerCase()} — free, true to size · All Printable`;
  const desc = `${cat.blurb} ${live.length} free printable ${
    live.length === 1 ? 'generator' : 'generators'}, every paper size, true to scale.`;
  const url = `${SITE}/${cat.slug}/`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.label,
    url,
    description: desc,
    isPartOf: { '@type': 'WebSite', name: 'All Printable', url: `${SITE}/` },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: live.length,
      itemListElement: live.map((p, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: p.name,
        url: hasLanding(p) ? `${SITE}/${p.id}/` : `${SITE}/${p.href.replace(/index\.html.*$/, '')}`
      }))
    }
  };

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="All Printable">
<meta property="og:title" content="${esc(cat.label)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="${esc(cat.label)}">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="stylesheet" href="../assets/css/base.css">
<link rel="stylesheet" href="../assets/css/home.css">
<link rel="icon" href="${ICON}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>

<header class="site-header">
  <a class="brand" href="../index.html"><span class="brand-mark"></span> All Printable</a>
  <nav class="nav">${categories.map((c) => c.id === cat.id
    ? `<a href="../${c.slug}/" aria-current="page">${esc(c.nav)}</a>`
    : `<a href="../${c.slug}/">${esc(c.nav)}</a>`).join('')}</nav>
  <span class="spacer"></span>
  <a class="btn btn-sm btn-primary" href="../printables/calendar/index.html">Make a calendar</a>
</header>

<div class="wrap lp lp-wide">
  <nav class="lp-crumbs" aria-label="Breadcrumb">
    <a href="../index.html">All printables</a> <span>/</span> ${esc(cat.label)}
  </nav>

  <h1>${esc(cat.label)}</h1>
  <p class="lp-intro">${esc(cat.blurb)} Every sheet prints at true scale on the
     paper size you pick, and nothing here asks you to sign up.</p>

  <div class="cards" style="margin-top:28px">
${items.map((p) => card(p, '../')).join('\n')}
  </div>

  ${proSections(items, '../')}

  <section class="section">
    <div class="section-head">
      <h2>Other categories</h2>
      <p>The rest of the catalogue.</p>
    </div>
    <p class="cat-links">${others.map((c) =>
      `<a href="../${c.slug}/">${esc(c.label)}</a>`).join('')}</p>
  </section>
</div>

<footer class="site-footer">
  <div class="wrap">
    <div class="row-wrap">
      <span>All Printable — printable generators that respect the paper.</span>
      <span class="spacer"></span>
      <a href="../index.html">All printables</a>
      <a href="../pro/">Pro</a>
    </div>
  </div>
</footer>

</body>
</html>
`;
}

/* Both generators write into docs/<slug>/. A category slug that matched a
   printable id would have one silently overwrite the other, and the damage
   would show up as a missing page long after the rename that caused it. */
const ids = new Set(printables.map((p) => p.id));
const clashes = categories.filter((c) => ids.has(c.slug));
if (clashes.length) {
  console.error('Category slug collides with a printable id: ' +
    clashes.map((c) => `${c.id} -> /${c.slug}/`).join(', '));
  process.exit(1);
}
const dupes = categories.map((c) => c.slug)
  .filter((s, i, a) => a.indexOf(s) !== i);
if (dupes.length) {
  console.error('Duplicate category slugs: ' + dupes.join(', '));
  process.exit(1);
}

/* The catalogue index at /.
 *
 * This host used to serve a copy of the marketing home page, which put the
 * same hero, comparison table and FAQ on two live domains — duplicate content,
 * and not what the 33 pages linking here as "All printables" are asking for.
 * The marketing page stays at all-printable.com; this is the catalogue. It is
 * also the only page that lists every printable at once. */
function indexPage() {
  const live = printables.filter(isLive);
  const desc = `Every printable on the site — ${live.length} free generators, ` +
    'each drawn in your browser and printed at true paper size, on any paper size.';
  const url = `${SITE}/`;

  const jsonld = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All printables',
    url,
    description: desc,
    isPartOf: { '@type': 'WebSite', name: 'All Printable', url },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: live.length,
      itemListElement: live.map((p, i) => ({
        '@type': 'ListItem', position: i + 1, name: p.name,
        url: hasLanding(p) ? `${SITE}/${p.id}/`
                           : `${SITE}/${p.href.replace(/index\.html.*$/, '')}`
      }))
    }
  };

  const sections = categories.map((cat) => {
    const items = printables.filter((p) => p.cat === cat.id);
    if (!items.length) return '';
    return `  <section class="section" id="${esc(cat.id)}">
    <div class="section-head">
      <h2><a class="plain" href="${esc(cat.slug)}/">${esc(cat.label)}</a></h2>
      <p>${esc(cat.blurb)}</p>
    </div>
    <div class="cards">
${items.map((p) => card(p, '')).join('\n')}
    </div>
  </section>`;
  }).join('\n\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>All printables — every generator, free and true to size</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${url}">
<meta name="robots" content="index,follow">
<meta property="og:type" content="website">
<meta property="og:site_name" content="All Printable">
<meta property="og:title" content="All printables">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${url}">
<meta name="twitter:card" content="summary">
<meta name="twitter:title" content="All printables">
<meta name="twitter:description" content="${esc(desc)}">
<link rel="stylesheet" href="assets/css/base.css">
<link rel="stylesheet" href="assets/css/home.css">
<link rel="icon" href="${ICON}">
<script type="application/ld+json">${JSON.stringify(jsonld)}</script>
</head>
<body>

<header class="site-header">
  <a class="brand" href="./"><span class="brand-mark"></span> All Printable</a>
  <nav class="nav">${categories.map((c) =>
    `<a href="${c.slug}/">${esc(c.nav)}</a>`).join('')}</nav>
  <span class="spacer"></span>
  <a class="btn btn-sm btn-primary" href="printables/calendar/index.html">Make a calendar</a>
</header>

<div class="wrap lp lp-wide">
  <nav class="lp-crumbs" aria-label="Breadcrumb">
    <a href="https://all-printable.com/">all-printable.com</a> <span>/</span> All printables
  </nav>

  <h1>All printables</h1>
  <p class="lp-intro">${esc(desc)} Nothing here asks you to sign up, and every
     setting lives in the link so you can come back to a sheet you liked.</p>

${sections}

${proSections(printables, '')}
</div>

<footer class="site-footer">
  <div class="wrap">
    <div class="row-wrap">
      <span>All Printable — printable generators that respect the paper.</span>
      <span class="spacer"></span>
      <a href="https://all-printable.com/">all-printable.com</a>
      <a href="pro/">Pro</a>
    </div>
  </div>
</footer>

<script src="assets/js/core/util.js"></script>
<script src="assets/js/core/analytics.js"></script>
<script src="assets/js/core/account.js"></script>

</body>
</html>
`;
}

writeFileSync('docs/index.html', indexPage());
console.log('catalogue index written: docs/index.html');

let made = 0;
for (const cat of categories) {
  mkdirSync(`docs/${cat.slug}`, { recursive: true });
  writeFileSync(`docs/${cat.slug}/index.html`, page(cat));
  made++;
}
console.log(`category pages written: ${made}`);
for (const c of categories) {
  const n = printables.filter((p) => p.cat === c.id).length;
  console.log(`  /${c.slug}/  ${n} printables`);
}
