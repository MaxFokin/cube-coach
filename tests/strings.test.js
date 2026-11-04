// The strings table: every key in every language, matching placeholders, well-formed plural and
// per-color sets, and t() picking the right variant.
const assert = require('assert');
const { STRINGS, MOVE_TEXT, LANGS, t, useLang } = require('./load.js');
const COLORS = ['W', 'Y', 'R', 'O', 'B', 'G'];
const placeholders = (s) => new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((p) => p !== 'color' && p !== 'Color'));
const leaves = (v) => (typeof v === 'string' ? [v] : Object.values(v).flatMap(leaves));
for (const [key, entry] of Object.entries(STRINGS)) {
  for (const code of Object.keys(LANGS)) assert(entry[code] !== undefined, `${key} lacks ${code}`);
  const want = placeholders(leaves(entry.en).join(' '));
  for (const code of Object.keys(LANGS)) for (const leaf of leaves(entry[code])) {
    for (const p of want) assert(leaf.includes(`{${p}}`), `${key}.${code} lacks {${p}}: ${leaf}`);
    for (const p of placeholders(leaf)) assert(want.has(p), `${key}.${code} has unknown {${p}}`);
    assert(!leaf.includes('—'), `${key}.${code} has an em dash`);
    assert(!/\b[A-Z]{3,}\b/.test(leaf.replace(/\{\w+\}/g, '')), `${key}.${code} shouts: ${leaf}`);
  }
  const checkSets = (v, path) => {
    if (typeof v === 'string') return;
    const keys = Object.keys(v);
    if (keys.some((k) => COLORS.includes(k))) assert.deepStrictEqual(keys.sort(), [...COLORS].sort(), `${path} is not a full color set`);
    else assert(v.other !== undefined, `${path} plural set lacks other`);
    Object.entries(v).forEach(([k, w]) => checkSets(w, `${path}.${k}`));
  };
  for (const code of Object.keys(LANGS)) checkSets(entry[code], `${key}.${code}`);
}
for (const [m, entry] of Object.entries(MOVE_TEXT)) for (const code of Object.keys(LANGS)) {
  assert(Array.isArray(entry[code]) && entry[code].length === 2, `move ${m} lacks ${code}`);
}
assert.strictEqual(Object.keys(MOVE_TEXT).length, 18);

// t(): placeholders, plurals, per-color, nesting, fallback, capitalisation.
STRINGS._probe = { en: { one: 'That took {n} turn.', other: 'That took {n} turns.' } };
STRINGS._probeColor = { en: 'Make it {color}, {Color} side' };
STRINGS._probeNest = { en: { few: { R: 'few red {n}', W: 'few white {n}', Y: '', O: '', B: '', G: '' }, other: { R: 'other red {n}', W: 'other white {n}', Y: '', O: '', B: '', G: '' } } };
useLang('en');
assert.strictEqual(t('_probe', { n: 1 }), 'That took 1 turn.');
assert.strictEqual(t('_probe', { n: 9 }), 'That took 9 turns.');
assert.strictEqual(t('_probeColor', { color: 'R' }), 'Make it red, Red side');
assert.strictEqual(t('_probeNest', { n: 7, color: 'W' }), 'other white 7');
assert.strictEqual(t('missingKey'), 'missingKey');
useLang('xx');
assert.strictEqual(t('_probe', { n: 1 }), 'That took 1 turn.', 'unknown language falls back to English');
useLang('en');
delete STRINGS._probe; delete STRINGS._probeColor; delete STRINGS._probeNest;
console.log('strings: ok (' + Object.keys(STRINGS).length + ' keys, ' + Object.keys(LANGS).join(' ') + ')');
