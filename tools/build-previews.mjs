/* Photographs one real sheet per printable into docs/assets/previews/<slug>.png
 *
 * The images come from the actual generators in preview mode (?preview=1), not
 * from mock-ups, so a landing page can never show something the site no longer
 * makes.
 *
 * Two passes per printable: the first reads the sheet's pixel size that preview
 * mode writes onto <body data-sheet>, the second screenshots a window of
 * exactly that size. Guessing the window size instead would letterbox every
 * sheet with whitespace.
 *
 * Needs the site served locally:
 *   cd docs && python3 -m http.server 8777
 *   node tools/build-previews.mjs
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, mkdirSync, existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const copy = require('../tools/landing-copy.js');

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ORIGIN = process.env.ORIGIN || 'http://localhost:8777';
const OUT = 'docs/assets/previews';
const LONG_EDGE = 700;          /* what we keep, after downscaling from 1000 */

const AP = {};
new Function('window', 'AP', readFileSync('docs/assets/js/registry.js', 'utf8'))({ AP }, AP);
const printables = AP.PRINTABLES.filter((p) => p.status === 'live' && copy[p.id]);

function chrome(args) {
  return execFileSync(CHROME, ['--headless', '--disable-gpu', ...args],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 * 1024 * 1024 });
}

mkdirSync(OUT, { recursive: true });
const tmp = `${OUT}/.tmp.png`;
let made = 0, failed = [];

for (const p of printables) {
  const url = `${ORIGIN}/${p.href}${p.href.includes('?') ? '&' : '?'}preview=1`;
  try {
    const dom = chrome(['--virtual-time-budget=6000', '--dump-dom', url]);
    const m = dom.match(/data-sheet="(\d+)x(\d+)"/);
    if (!m) throw new Error('preview mode reported no sheet size');
    const [w, h] = [Number(m[1]), Number(m[2])];

    chrome([`--screenshot=${tmp}`, '--virtual-time-budget=6000',
            `--window-size=${w},${h}`, '--force-device-scale-factor=1', url]);

    /* Downscale on the long edge; sips keeps the aspect ratio. */
    execFileSync('sips', ['-Z', String(LONG_EDGE), tmp, '--out', `${OUT}/${p.id}.png`],
      { stdio: 'ignore' });
    made++;
    process.stdout.write(`  ${p.id.padEnd(16)} ${w}x${h}\n`);
  } catch (err) {
    failed.push(`${p.id}: ${err.message.split('\n')[0]}`);
  }
}
if (existsSync(tmp)) rmSync(tmp);

console.log(`previews written: ${made}`);
if (failed.length) {
  console.log('failed:');
  failed.forEach((f) => console.log('  ' + f));
  process.exitCode = 1;
}
