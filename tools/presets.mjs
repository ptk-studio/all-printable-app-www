/* Reads each maker's preset list, so the generated pages can talk about them.
 *
 * The presets live in docs/printables/<maker>/app.js as ordinary JavaScript.
 * Rather than scrape that with a regular expression — which would break the
 * first time someone reformats an entry — this loads the file and stubs the
 * one call it makes at load time, AP.studio(), capturing the config it was
 * given. The presets that come back are the exact objects the browser uses.
 */
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const MAKERS = ['calendar', 'paper', 'tracker', 'cards', 'puzzles', 'forms', 'worksheets'];

/* Enough of a browser for a file that only means to describe itself. Anything
   an app.js actually touches at load is a no-op; anything it reads back is a
   shape that will not throw. */
function shim() {
  const node = new Proxy({}, {
    get(t, k) {
      if (k === 'style' || k === 'classList' || k === 'dataset') return node;
      if (k === 'textContent' || k === 'innerHTML' || k === 'value') return '';
      if (k === Symbol.toPrimitive) return () => '';
      return typeof k === 'string' ? (() => node) : undefined;
    },
    set() { return true; }
  });
  const AP = {
    el: () => node, $: () => node, $$: () => [],
    svg: () => '', fillPaperSizes() {}, fillSwatches() {}, fillLocales() {},
    fillPresets() {}, toolbarHtml: () => '', store: { get: () => null, set() {} },
    monthName: () => '', dayName: () => '', today: () => new Date(),
    debounce: (f) => f, clamp: (v) => v, pad: (v) => String(v)
  };
  return { AP, node };
}

export function loadPresets() {
  const out = {};
  for (const maker of MAKERS) {
    const { AP, node } = shim();
    let captured = null;
    AP.studio = (cfg) => { captured = cfg; return {}; };

    const ctx = vm.createContext({
      window: { AP, addEventListener() {}, matchMedia: () => ({ matches: false, addEventListener() {} }) },
      AP,
      document: {
        createElement: () => node, createElementNS: () => node,
        getElementById: () => node, querySelector: () => node, querySelectorAll: () => [],
        addEventListener() {}, readyState: 'complete', body: node, documentElement: node
      },
      location: { search: '', hash: '', pathname: '/' },
      navigator: { language: 'en-US' },
      localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
      console, Math, Date, JSON, Intl, setTimeout, encodeURIComponent, decodeURIComponent
    });

    /* The engines the app.js reads constants from at config time. Missing ones
       are not fatal — the shim answers for them. */
    for (const dep of ['layouts.js', 'engine.js', 'astro.js', 'holidays.js']) {
      try { vm.runInContext(readFileSync(`docs/printables/${maker}/${dep}`, 'utf8'), ctx); }
      catch { /* not every maker has every file, and none of it must block */ }
    }
    try { vm.runInContext(readFileSync(`docs/printables/${maker}/app.js`, 'utf8'), ctx); }
    catch (e) { throw new Error(`could not read ${maker} presets: ${e.message}`); }

    if (!captured) throw new Error(`${maker}/app.js did not call AP.studio()`);
    out[maker] = (captured.presets || []).map((p) => ({
      name: p.name, pro: !!p.pro, note: p.note || ''
    }));
  }
  return out;
}

/* Which maker a registry entry opens, from its href. */
export function makerOf(entry) {
  const m = /printables\/([^/]+)\//.exec(entry.href || '');
  return m ? m[1] : null;
}

export function proPresets(all, maker) {
  return (all[maker] || []).filter((p) => p.pro);
}
