# Hebrew and Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Cube Coach speaks English, Hebrew and Polish, chosen with a switch on the welcome screen, with every word the child sees translated and the cube never mirrored.

**Architecture:** All copy moves out of `ui.js`, `camera.js` and `main.js` into one table in a new `src/strings.js`, read through `t(key, vars)`, which fills placeholders and picks plural and per-color variants. The language is a module variable saved under its own localStorage key and applied to `<html lang dir>`. Hebrew flips the page to RTL while a short CSS list pins the cube, grids, arrows and notation to physical left-to-right. A screen-walk browser test snapshots today's English before anything moves and later proves English unchanged, Hebrew and Polish complete, and layouts within limits.

**Tech Stack:** Vanilla JS in one IIFE (built by `build.py`), CSS, Node 26 tests (`node:assert`), Playwright 1.60 (Python, `.venv`), `Intl.PluralRules` (native).

**Spec:** `docs/superpowers/specs/2026-11-04-translations-design.md`

## Global Constraints

- No new dependencies. Only `Intl.PluralRules` and one Google Font (Assistant 400, 700) are added.
- English copy is moved verbatim, never rewritten. The baseline snapshot from Task 1 is the proof.
- Copy rules: child audience, short sentences, no all caps, hyphens not em dashes, typographic apostrophes (’) in English UI text; Polish uses „ ” when quotes are needed; digits stay Western in every language.
- Cube notation badges (R, U′, F2), the brand "Cube Coach", the page title and the home-screen title are not translated.
- The language is never guessed from the phone. Default `en`. The switch exists only on the welcome screen.
- Hebrew is RTL; `.stage`, every `.face-grid`, `.grid-row`, `.cam-view`, `.cam-guide`, `.move-icon`, `.chips`, `.bar`, `.palette`, `.key` and `.langs` stay `direction: ltr`.
- Whole sentences may be concatenated with a space; words never are. Any sentence whose color word inflects is written per color (W Y R O B G) in that language.
- Layout limits at 375x667, page height: welcome and every non-side screen fit (<= 667); side 1 fits; later sides <= 705; move screen with the help box open <= 766. Measured with the fixed 2x2 cube from the tests and the fixed 3x3 entry `SCR3` from Task 1.
- `python3 build.py` after every source change; `npm test` before every commit; `index.html` is committed with the sources; nothing is pushed before Max has reviewed `src/strings.js` for both languages.

## Review Focus

- A reload in the middle of a Hebrew solve must come back in Hebrew on the same move (language saved separately from progress, applied before the first render). Test in Task 5.
- "Start over" must reset the game but keep the language (`resetAll` never touches it). Test in Task 5.
- The notation badge `U′` in a Hebrew paragraph must not render as `′U` (`.key` pinned LTR). Test in Task 5.
- "That took 1 turn" and Polish 2-4 vs 5+ forms must come out right (`t` plural selection by `vars.n`). Tests in Tasks 2, 4 and 6.
- localStorage that throws (private mode) must not break the switch or start-up (`setLang` and the start-up read wrapped in try/catch, as `save()` is). Test in Task 5.

---

### Task 1: Baseline snapshot of the English screens

**Files:**
- Create: `tests/e2e/screens.py`
- Create: `tests/fixtures/en-screens.json`
- Modify: `README.md` (Develop section, one line), `package.json` (`"screens"` script)

**Interfaces:**
- Produces: `python3 tests/e2e/screens.py <lang> [--write]`. Walks the screens listed below in language `<lang>` (taps the welcome switch first when `<lang>` is not `en`; in this task only `en` exists). Collects, per screen, `{"text": ..., "height": N}` where `text` is `#panel` innerText plus `#restart` textContent, or the `.cam` innerText while the camera sheet is open. With `--write` it saves the collection to `tests/fixtures/en-screens.json` (only allowed for `en`). Without it: for `en`, every screen's text must equal the snapshot; for any language, heights must respect the Global Constraints limits, `document.documentElement.scrollWidth <= innerWidth`, and no `pageerror`. Prints one line per screen (`ok`/`OVER` plus the height) and exits 1 on any failure.
- Walk, at viewport 375x667, `is_mobile`, `has_touch`, fonts route aborted, cubejs route served from `tests/vendor/cubejs` (as `flows.py` does): `welcome`; `#pick2` -> `side 1 empty`; `#camera` (live camera fails headless, so the photo fallback shows) -> `camera sheet`, then `#cam-cancel`; paint the fixed 2x2 cube `MAX` from `flows.py` but with side 3 cell 1 set to `G` -> `oops` (heading "One of these is wrong"); `#review` -> `side 1 review`; `#next` twice, paint `B` into cell 1, `#next` twice -> `checkTop`; `#no` -> `mismatch`; `#review`, `#next` x4 -> `checkTop` again; `#yes` -> `checkBottom`; `#yes` -> `hold`; `#ready` -> `move 1`; `#lost` -> `move 1 help open`; `#lost`; `#did` x9 -> `done`; `#restart` x2 -> `welcome`; `#pick3` -> `side 1 (3x3)`; paint side 1 of the fixed 3x3 entry `SCR3` (below) -> `side 1 filled (3x3)`; `#next` -> `side 2 (3x3)`; paint the remaining 5 sides, `#next` after each -> last one lands on `solving` with the vendor solver; wait for `#ready` -> `hold (3x3)`; `#ready` -> `move 1 (3x3)`; `#restart` x2; `#pick3`; route the cubejs URLs to abort, paint all 6 sides -> `solverError`. `SCR3`, the solved cube after `R U2 F' L D B2 R' U F D2`, as the six copied sides F R B L U D (each 9 letters, row by row): `["GGWWGOBGG","RRYYRGOBY","GOROBWRWO","GYWROBYYO","YBORWBRRB","WWWGYYBOB"]`. It is fixed so every text, including the 3x3 move count and move names, is the same on every run.

- [ ] **Step 1: Write `tests/e2e/screens.py` as specified, reusing the helpers and routing from `tests/e2e/flows.py`**

- [ ] **Step 2: Generate the baseline and check it is stable**

Run: `.venv/bin/python tests/e2e/screens.py en --write && .venv/bin/python tests/e2e/screens.py en`
Expected: the second run prints `ok` for every screen and exits 0. Heights: welcome 667 or less, side 1 667 or less, sides 2+ 705 or less, move+help 766 or less (today's numbers from CLAUDE.md).

- [ ] **Step 3: Add the script and the README line**

`package.json`: `"screens": "python3 tests/e2e/screens.py en"`. README Develop section: one line saying `npm run screens` compares every screen's English text with `tests/fixtures/en-screens.json`.

- [ ] **Step 4: Commit**

```bash
git add tests/e2e/screens.py tests/fixtures/en-screens.json package.json README.md
git commit -m "Snapshot every screen's English text and height"
```

---

### Task 2: The strings table and `t()`

**Files:**
- Create: `src/strings.js`
- Create: `tests/strings.test.js`
- Modify: `build.py:10` (`JS_ORDER`: insert `"strings.js"` after `"colorread.js"`), `tests/load.js:7-10` (concatenate `strings.js`, return `STRINGS, MOVE_TEXT, LANGS, t, useLang, moveText`), `tests/run.js:3` (add `strings.test.js`)

**Interfaces:**
- Produces, in `src/strings.js` (same IIFE scope as everything else, no DOM access anywhere in the file):
  - `const LANGS = { en: { name: 'English', dir: 'ltr' } }` (Hebrew and Polish are added by Tasks 4 and 6).
  - `let lang = 'en'` and `function useLang(code)` which sets it (no storage, no DOM).
  - `const STRINGS = { key: { en: value, he: value, pl: value }, ... }` where a value is a string with `{name}` placeholders, a plural set `{ one, two, few, many, other }` (any subset, `other` required), or a per-color set with exactly the keys `W Y R O B G`; sets may nest in either order.
  - `function t(key, vars = {})`: picks `STRINGS[key][lang]`, falling back to `STRINGS[key].en`; returns the key itself when the key is unknown. While the value is an object: if `vars.color` is one of its keys, descend by color; else descend by `new Intl.PluralRules(lang).select(vars.n)` with fallback `other`. Then replace `{color}` with the color's name in the current language (from `STRINGS.colorName`), `{Color}` with the same name capitalised, and every other `{name}` with `String(vars[name])`; unknown placeholders are left as they are.
  - `const MOVE_TEXT = { "R": { en: ['Right side up', 'Turn the right side up, away from you.'] }, ... }` for all 18 moves, exactly the pairs now at `src/ui.js:7-26` with the `either` sentence written out in full.
  - `function moveText(m)` returning `MOVE_TEXT[m][lang] || MOVE_TEXT[m].en`.
- In this task `STRINGS` holds only `colorName` (English names from `src/ui.js:3`) plus whatever Task 2's tests need; Task 3 fills it.

- [ ] **Step 1: Write the failing tests in `tests/strings.test.js`**

```js
const assert = require('assert');
const { STRINGS, MOVE_TEXT, LANGS, t, useLang } = require('./load.js');
const COLORS = ['W', 'Y', 'R', 'O', 'B', 'G'];
const placeholders = (s) => new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).filter((p) => p !== 'color' && p !== 'Color'));
const leaves = (v) => (typeof v === 'string' ? [v] : Object.values(v).flatMap(leaves));
// Shape: every key has every language in LANGS; placeholders match English; sets are well formed.
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
// Behavior of t(): placeholders, plurals, per-color, nesting, fallback, capitalisation.
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
```

- [ ] **Step 2: Run it to verify it fails**

Run: `node tests/strings.test.js`
Expected: FAIL (cannot find `STRINGS` / `t` in `load.js` exports).

- [ ] **Step 3: Create `src/strings.js` with `LANGS`, `lang`, `useLang`, `STRINGS` (only `colorName` for now), `MOVE_TEXT` (English pairs copied from `ui.js`), `moveText` and `t` as specified; wire `build.py`, `tests/load.js` and `tests/run.js`**

`Intl.PluralRules` instances are cached per language in a small object. `t` must never throw on a bad `vars` (missing `n` selects `other`).

- [ ] **Step 4: Run the tests**

Run: `node tests/strings.test.js && npm test && python3 build.py --check`
Expected: `strings: ok (1 keys, en)`, all suites ok; the build check fails until `python3 build.py` runs (strings.js is now part of the bundle), then passes.

- [ ] **Step 5: Commit**

```bash
python3 build.py && git add src/strings.js tests/strings.test.js tests/load.js tests/run.js build.py index.html
git commit -m "Add the strings table and t() with plural and per-color variants"
```

---

### Task 3: Move every English word into the table

**Files:**
- Modify: `src/strings.js` (fill `STRINGS`), `src/ui.js` (every literal a person reads, `MOVE_TEXT`, `NAME`, `sideText`, `refreshSide` names, `screen*`), `src/camera.js` (`camText`, every `setTip`/`setMsg`/label literal), `src/main.js:3,7` (Start over texts), `src/page.template.html:19` (leave the button text as a fallback; JS sets it at start-up)

**Interfaces:**
- Consumes: `t`, `moveText`, `STRINGS.colorName` from Task 2.
- Produces: the final key set. Naming: camelCase, prefixed by screen (`welcome…`, `side2…`, `side3…`, `check…`, `mismatch…`, `oops…`, `solving…`, `solverError…`, `hold…`, `move…`, `done…`, `cam…`), shared buttons by their label (`yes`, `no`, `back`, `cancel`, `tryAgain`, `copyAgain`, `startOver`, `startOverArmed`), square names `sqTopLeft` … `sqBottomRight`, labels `colors`, `language`, `sideLabel2` ('Side {n}'), `sideLabel3` ('{Color} side'), `middleSquare`, `squareLabel` ('{square} square: {state}'), `notSet`. Keys are listed in screen order in the file. Decisions the mover must follow:
  - `sideText` and `camText` become one `t()` call per branch; the "Fix any square that’s wrong." sentence is its own key `fixLine`, appended with a space where today's code appends `fixLine`.
  - `refreshSide` warning: key `tooMany`, called as `t('tooMany', { n: limit, have: count, color })`; English `{ other: 'A cube has only {n} {color} squares, and you have <b>{have}</b>. Look closely at red and orange too.' }`.
  - Done screen: key `doneLead`, English `{ one: 'That took {n} turn. Mix it up and copy it again to go another round.', other: 'That took {n} turns. Mix it up and copy it again to go another round.' }`.
  - The 3x3 turned note: key `turnedNote`, English `'You copied the {sides} side turned around. I fixed it.'`, with `{sides}` built by joining the face names with `t('and')` (`' and '`), the only word-level join; Task 4 and 6 write it as whole sentences if their grammar needs it (the note then ignores `{sides}` count differences, which is why `and` is a key).
  - 2x2 single-square oops: `oopsOneLead2` ('On side {n}, this square doesn’t fit with the others.'), 3x3: `oopsOneLead3` ('On the {color} side, this square doesn’t fit with the others.'); the guess sentence `iThink` ('I think it’s {color}.') appended with a space; buttons `letMeLook`, `makeIt` ('Make it {color}'), `checkSide2` ('Check side {n}'), `checkSide3` ('Check the {color} side').
  - Progress labels `sideOf` ('Side {n} of {total}'), `moveOf` ('Move {n} of {total}'), `cubeCode` ('Cube code {m}').
  - `camTitle3` ('Photo of the {color} side') is used for all six 3x3 sides; hints `camHint3Side` ('{Color} in the middle square, white at the top.'), `camHint3Top`, `camHint3Bottom`.
  - `main.js` sets `restartBtn.textContent = t('startOver')` at start-up and in `disarm()`, and `t('startOverArmed')` when armed.
  - `NAME` is removed; every use becomes `t('colorName', { color })`. `cap()` stays.

- [ ] **Step 1: Move the copy, one screen at a time, running `node tests/strings.test.js` after each screen**

Also replace `const NAME = …` uses and delete `MOVE_TEXT`/`either` from `ui.js`. `screenMove` reads `const [title, sub] = moveText(m)`.

- [ ] **Step 2: Verify nothing a person reads is left behind**

Run: `grep -nE "'[A-Z][a-z]+ [a-z]" src/ui.js src/camera.js src/main.js | grep -v "^.*//"`
Expected: no sentence literals (hits are only CSS class strings, ids, or comments).

- [ ] **Step 3: Build and prove English is unchanged**

Run: `python3 build.py && npm test && .venv/bin/python tests/e2e/screens.py en && source .venv/bin/activate && npm run e2e`
Expected: `strings: ok (N keys, en)` with N around 120; every screen `ok` against the snapshot; e2e ok.

- [ ] **Step 4: Commit**

```bash
git add src/strings.js src/ui.js src/camera.js src/main.js src/page.template.html index.html
git commit -m "Read every word through the strings table; English unchanged"
```

---

### Task 4: Hebrew

**Files:**
- Modify: `src/strings.js` (`LANGS.he = { name: 'עברית', dir: 'rtl' }`, `he` on every key and every move)

**Interfaces:**
- Consumes: the key set from Task 3.
- Produces: complete Hebrew. Address form: masculine singular imperative (Max's son is the first user); Max changes it in review if he prefers neutral forms. Colors as adjectives agree in gender with the noun, so `makeIt`, `checkSide3`, `oopsOneLead3`, `sideLabel3`, `camTitle3`, `camHint3Side`, `camTipCenter`, `side3…` leads and `tooMany` are per-color sets. `doneLead` uses `{ one, two, other }`. `turnedNote` is written for one side and for two sides as whole sentences only if `{sides}` cannot be joined naturally; otherwise `and` is ' ו' with no spaces handled by the join (decide while writing; the test only needs `{sides}`).

- [ ] **Step 1: Add `he` to `LANGS` and run the strings test to see every key reported missing**

Run: `node tests/strings.test.js`
Expected: FAIL on the first key lacking `he`.

- [ ] **Step 2: Write the Hebrew for every key and move, then run the test until it passes**

Run: `node tests/strings.test.js`
Expected: `strings: ok (N keys, en he)`.

- [ ] **Step 3: Plural check**

Add to `tests/strings.test.js` after the probes: `useLang('he'); assert(t('doneLead', { n: 1 }) !== t('doneLead', { n: 2 }) && t('doneLead', { n: 2 }) !== t('doneLead', { n: 9 }), 'Hebrew one, two, other');` and back to `useLang('en')`.
Run: `node tests/strings.test.js`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
python3 build.py && git add src/strings.js tests/strings.test.js index.html
git commit -m "Add Hebrew"
```

---

### Task 5: The switch, the saved language, RTL and fonts

**Files:**
- Modify: `src/ui.js` (`screenWelcome`: language row; new `setLang(code)`), `src/main.js` (read the saved language before `restore()`), `src/base.css` (pins, logical properties, Hebrew text font, `.langs`/`.lang`), `src/extra.css:44-46` (`.grid-row` pin), `src/page.template.html:12` (font link adds `&family=Assistant:wght@400;700`), `tests/e2e/flows.py` (run the 2x2 flow once per language), `tests/e2e/screens.py` (no-Latin check for `he`)

**Interfaces:**
- Consumes: `LANGS`, `useLang`, `t` from Task 2; Hebrew from Task 4.
- Produces: `function setLang(code)` in `ui.js`: `useLang(code)`; `localStorage.setItem('cube-coach-lang', code)` in try/catch; `document.documentElement.lang = code`; `document.documentElement.dir = LANGS[code].dir`. `main.js` start-up: read `'cube-coach-lang'` in try/catch, `setLang` it if it is a key of `LANGS`, else `setLang('en')`; this runs before `restore()` and the first `render`. Welcome screen markup after `.choose`: `<div class="langs" role="group" aria-label="${t('language')}">` + one `<button class="lang" type="button" data-lang="${code}" lang="${code}" aria-pressed="${code === lang}">${LANGS[code].name}</button>` per `LANGS` key, in `en he pl` order; a tap calls `setLang(code)` then `render(false)`. `resetAll()` and `restore()` never touch the language.
- CSS: `.stage, .face-grid, .grid-row, .cam-view, .cam-guide, .move-icon, .chips, .bar, .palette, .key, .langs { direction: ltr; }`; `.key { unicode-bidi: isolate; }`; `.move-head h1`, `.help`, `.howto` use `text-align: start`; `:root[lang="he"] { --text: 'Assistant', 'Arial Hebrew', system-ui, sans-serif; }`; `.langs { display: flex; justify-content: center; gap: 8px; }`; `.lang` styled like `.restart` (same border, radius, font) with `[aria-pressed="true"]` in `var(--ink)` color and border and weight 700. If the welcome screen exceeds 667 at 375x667 after the row is added, add inside the `max-height: 720px` block: `.app[data-screen="welcome"] .stage { height: clamp(200px, 30vh, 320px); }` and re-measure.

- [ ] **Step 1: Write the failing browser checks**

In `tests/e2e/flows.py`, wrap the 2x2 flow in `for code in ('en', 'he', 'pl')` (skip codes missing from the page's switch: `page.query_selector(f'.lang[data-lang="{code}"]')`); for a non-`en` code tap that button first and assert `await page.get_attribute('html', 'lang') == code` and `dir` is `rtl` only for `he`. Keep the English heading asserts under `if code == 'en'`. After `#ready`, on the first move: assert `page.evaluate("getComputedStyle(document.querySelector('.key')).direction") == 'ltr'` and the same for `.face-grid` on a side screen and `.stage`. Then `page.reload()` and assert `html[lang] == code` and the move screen is still showing (`#did` exists). Then `#restart` twice and assert the welcome `.lang[aria-pressed="true"]` is still `code`. Finally, for `he`, a context with `await ctx.add_init_script("Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } })")`: the page loads without `pageerror` and the switch still changes `html[lang]`.
In `tests/e2e/screens.py`, for `he`: assert no match of `[A-Za-z]{2,}` in any screen text except the tokens `Cube Coach`, `English`, `Polski`, the move keys (`.key` text) and `2×2`/`3×3`.

- [ ] **Step 2: Run them to verify they fail**

Run: `.venv/bin/python tests/e2e/flows.py`
Expected: FAIL at the first `.lang` tap (no switch yet).

- [ ] **Step 3: Implement the switch, `setLang`, the start-up read, the CSS and the font link as specified**

- [ ] **Step 4: Build, measure, and run everything**

Run: `python3 build.py && npm test && .venv/bin/python tests/e2e/screens.py en && .venv/bin/python tests/e2e/screens.py he && source .venv/bin/activate && npm run e2e`
Expected: English screens unchanged; Hebrew screens within the layout limits, no Latin words, no horizontal overflow; flows ok for en and he.

- [ ] **Step 5: Commit**

```bash
git add src tests index.html
git commit -m "Language switch on the welcome screen, saved per device; Hebrew reads right to left"
```

---

### Task 6: Polish

**Files:**
- Modify: `src/strings.js` (`LANGS.pl = { name: 'Polski', dir: 'ltr' }`, `pl` on every key and move), `tests/strings.test.js` (plural probe), `tests/e2e/screens.py` (no-English check for `pl`)

**Interfaces:**
- Consumes: the key set and the Hebrew pattern of per-color keys.
- Produces: complete Polish. Imperatives are ungendered; avoid gendered past tense ("you copied") with impersonal phrasing. Color adjectives inflect by case and number, so the same keys as in Task 4 are per-color sets, and `tooMany` is `{ few: {…per color…}, many: {…per color…}, other: {…} }` driven by `n` = 4 or 9. `doneLead` uses `{ one, few, many, other }`.

- [ ] **Step 1: Add `pl` to `LANGS`, see the strings test fail, write the Polish until it passes**

Run: `node tests/strings.test.js`
Expected: `strings: ok (N keys, en he pl)`.

- [ ] **Step 2: Plural probe**

Add: `useLang('pl'); const f = [1, 3, 5].map((n) => t('doneLead', { n })); assert(new Set(f).size === 3, 'Polish one, few, many differ'); useLang('en');`
Run: `node tests/strings.test.js`
Expected: PASS.

- [ ] **Step 3: No-English check in `screens.py` for `pl`**

Build the set of words of 4+ letters from `tests/fixtures/en-screens.json`; assert none occurs as a whole word in any Polish screen text, except `Cube`, `Coach`, `English`, `Polski` and the move keys.

- [ ] **Step 4: Build, measure, run everything**

Run: `python3 build.py && npm test && for l in en he pl; do .venv/bin/python tests/e2e/screens.py $l || exit 1; done && source .venv/bin/activate && npm run e2e`
Expected: all ok; Polish screens within the layout limits (shorten Polish wording where a screen is over; never touch CSS for it).

- [ ] **Step 5: Commit**

```bash
git add src/strings.js tests index.html
git commit -m "Add Polish"
```

---

### Task 7: Docs, review hand-off

**Files:**
- Modify: `CLAUDE.md` (Layout: `strings.js`; How the app works: a "Languages" subsection with `t()` shapes, the saved key, the RTL pin list, the fonts; Testing: `strings.test.js`, `screens.py`, the per-language flows; Known weak points and the layout table per language; History item 8), `README.md` (one sentence: three languages, switch on the first screen)

- [ ] **Step 1: Update CLAUDE.md and README.md as listed; keep every number from the final `screens.py` runs**

- [ ] **Step 2: Full verification**

Run: `python3 build.py --check && npm test && for l in en he pl; do .venv/bin/python tests/e2e/screens.py $l || exit 1; done && source .venv/bin/activate && npm run e2e`
Expected: everything ok.

- [ ] **Step 3: Commit, then hand over without pushing**

```bash
git add CLAUDE.md README.md
git commit -m "Document the languages"
cmux markdown open CLAUDE.md
cmux open src/strings.js
```

Max reviews `src/strings.js` (Hebrew first, then Polish) and the app in each language. Push only after his word.
