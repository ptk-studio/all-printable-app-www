/* Tests for AP.queryStart, the ?year=&month= preset deep link (#60).
 *
 *   node --test tools/test-query-start.mjs
 *
 * Loads the real docs/assets/js/core/util.js into a sandbox (it only needs a
 * `window`; the DOM helpers are never called here), so what is tested is
 * exactly what the site serves. Node's built-in runner: no dependency.
 *
 * The other conditions from the manager's OK on #60 are about the studio, not
 * this parser, and are checked in a browser on the live pages before the PR is
 * marked ready: a preset without ?year behaves as before, a bare ?year (no
 * preset) is ignored, and #c= share links are unchanged.
 */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const src = readFileSync(new URL('../docs/assets/js/core/util.js', import.meta.url), 'utf8');
// In a browser `window` is the global object, so util.js's bare `AP` resolves
// through it; mirror that.
const sandbox = vm.createContext({});
sandbox.window = sandbox;
vm.runInContext(src, sandbox);
const { queryStart, queryCount } = sandbox.AP;

test('year and month on a preset link', () => {
  assert.deepEqual({ ...queryStart('?preset=family-wall&year=2027&month=1') }, { year: 2027, month: 0 });
  assert.deepEqual({ ...queryStart('?year=2027&month=12&preset=x') }, { year: 2027, month: 11 });
});

test('year alone starts in January', () => {
  assert.deepEqual({ ...queryStart('?preset=year-at-a-glance&year=2027') }, { year: 2027, month: 0 });
});

test('no year means no override (presets keep the visitor month, as today)', () => {
  assert.equal(queryStart(''), null);
  assert.equal(queryStart('?preset=family-wall'), null);
  assert.equal(queryStart(undefined), null);
});

test('a month without a year is ignored', () => {
  assert.equal(queryStart('?preset=family-wall&month=3'), null);
});

test('invalid year is ignored', () => {
  for (const y of ['27', '20270', '1899', '2101', 'abcd', '2027.5', '-2027', '', '2O27']) {
    assert.equal(queryStart(`?preset=x&year=${y}`), null, `year=${y}`);
  }
});

test('invalid month throws the whole override away rather than guessing', () => {
  for (const m of ['0', '13', '1.5', 'jan', '', '-1', '001']) {
    assert.equal(queryStart(`?preset=x&year=2027&month=${m}`), null, `month=${m}`);
  }
});

test('bounds are inclusive', () => {
  assert.deepEqual({ ...queryStart('?year=1900') }, { year: 1900, month: 0 });
  assert.deepEqual({ ...queryStart('?year=2100&month=12') }, { year: 2100, month: 11 });
});

test('a fragment after the query does not leak into the values', () => {
  assert.deepEqual({ ...queryStart('?preset=x&year=2027&month=1#c=abc') }, { year: 2027, month: 0 });
});

test('count: an integer 1-24 on a preset link', () => {
  assert.equal(queryCount('?preset=family-wall&year=2027&month=1&count=1'), 1);
  assert.equal(queryCount('?preset=x&count=24'), 24);
});

test('count: 0, 25 and non-integers are ignored', () => {
  for (const c of ['0', '25', '1.5', 'one', '', '-1', '001', '2e1']) {
    assert.equal(queryCount(`?preset=x&count=${c}`), null, `count=${c}`);
  }
});

test('count: absent means no override', () => {
  assert.equal(queryCount('?preset=x&year=2027'), null);
  assert.equal(queryCount(''), null);
});

// "count without a preset": the parser returns the number, but studio.js only
// calls config.fromQuery inside its ?preset= branch, so a bare ?count (like a
// bare ?year) never reaches the state. That half is checked in the browser.
test('count parses independently of year', () => {
  assert.equal(queryCount('?count=3'), 3);
  assert.equal(queryStart('?count=3'), null);
});
