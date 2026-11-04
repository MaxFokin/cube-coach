# Cube Coach in Hebrew and Polish - design

Date: 2026-11-04. Status: approved by Max on 2026-11-04 and built on branch `translations`.

## Intent

Cube Coach speaks English only. Max wants the child and the family to use it in Hebrew and in
Polish. A language switch sits on the home screen, the choice sticks, and Max reviews every
translated line before it ships. The app must stay exactly as good in English.

## Goals

- Every word the child sees, and every label a screen reader speaks, exists in English, Hebrew and
  Polish: all screens, buttons, move names and instructions, the camera sheet, error screens,
  warnings, notes, the Start over button.
- A switch on the welcome screen only: three buttons, each language in its own name
  (English, עברית, Polski). The choice is remembered on the device and survives Start over, a
  finished solve and a reload.
- English on first open. No automatic detection of the phone's language (Max's decision).
- Hebrew reads right to left. Text, headings and buttons flow right to left, but the cube grids,
  the 3D cube, the arrows and the move icons keep their physical left and right. "Turn the top
  layer to the left" still means the child's left.
- The translations are easy for Max to review: each string's three versions sit side by side in
  one file.
- No new dependencies. Nothing fetched beyond the fonts already used plus one Hebrew text font.

## Non-goals

- Guessing the language from the phone.
- A switch anywhere except the home screen.
- Translating the cube notation badges (R, U′, F2). They stay Latin, as on every cube site.
- Translating the README, CLAUDE.md or the tests.
- Other languages, language packs, downloads. Adding a fourth language later should be a matter of
  filling in one more column, but nothing is built for it now.
- Full screen. Dropped on 2026-11-04.

## Anti-goals (what would make this a failure even if it works)

- A mirrored cube: in Hebrew, a grid, arrow or 3D view that flips left and right, so the child
  turns the wrong way.
- Broken grammar from gluing words together. Polish colors change with case ("czerwony",
  "czerwonych"), Hebrew adjectives change with gender. "Make it red" must read naturally.
- A screen that no longer fits a 375x667 phone in Polish, whose words run long, or in Hebrew.
- A screen that is half English after switching.
- Hebrew in a font without Hebrew glyphs (empty boxes). Andika has none.
- A changed English word. English copy is moved, not rewritten.

## Constraints

- One-file app assembled by `build.py`, no framework, no bundler. Strings are plain JavaScript.
- CLAUDE.md copy rules: child audience, short sentences, no all caps, hyphens not em dashes,
  typographic apostrophes in English UI text. Polish uses „ ” quotes when quotes are needed.
  Hebrew uses none of these.
- Fonts, checked against Google Fonts on 2026-11-04: Fredoka (display) ships Hebrew and Latin
  Extended; Andika (text) ships Latin Extended but no Hebrew.
- Digits stay Western in all three languages (Hebrew and Polish both use them).
- The browser tests tap ids and classes (`#pick2`, `.sw[data-col]`, `#next`, `#did`, `.key`), which
  do not change. Tests that match text ("Is this your top?", "Solved!", "bottom") must read the
  expected text for the language under test.

## Decisions

### Where the words live

- New file `src/strings.js`, built in before `ui.js` (order in `build.py`: core2, core3, colorread,
  strings, ui, camera, main). One object, keyed by short names in screen order, each entry holding
  the three languages together:

  ```js
  const STRINGS = {
    welcomeTitle: { en: 'Let’s solve your cube', he: '…', pl: '…' },
    sideOf:       { en: 'Side {n} of {total}', he: '…', pl: '…' },
    tookTurns:    { en: { one: 'That took {n} turn.', other: 'That took {n} turns.' },
                    he: { one: '…', two: '…', other: '…' },
                    pl: { one: '…', few: '…', many: '…', other: '…' } },
    makeIt:       { en: 'Make it {color}', he: { W: '…', Y: '…', R: '…', O: '…', B: '…', G: '…' }, pl: { … } },
  };
  ```

- `t(key, vars)` returns the entry for `app.lang`, with `{name}` placeholders filled from `vars`.
  An entry's value is one of three shapes, and any language may use a different shape for the same
  key:
  - a plain string with placeholders;
  - a plural set, chosen with `new Intl.PluralRules(lang).select(vars.n)`, falling back to `other`;
  - a per-color set keyed W Y R O B G, chosen with `vars.color`, for every sentence where a color
    name is inflected. This is how Polish cases and Hebrew gender stay correct: the translator
    writes six whole sentences instead of one template.
- Color names, 3x3 face names, the move titles and move instructions (`MOVE_TEXT`), the square
  names used in labels, and every literal in `ui.js` and `camera.js` move into `STRINGS`. About
  130 strings today: screens around 60, moves 36, camera around 25, labels around 10. English
  values are copied verbatim from the current code.
- A missing key or language falls back to English at runtime, and the Node test fails, so a gap can
  never ship unnoticed.
- The brand name "Cube Coach", the page `<title>` and the home-screen title stay as they are in
  every language.

### The switch and the saved choice

- `app.lang` is `'en'`, `'he'` or `'pl'`, kept under its own localStorage key `cube-coach-lang`,
  separate from the progress record, so `restore()` validation and Start over never touch it.
  Default `'en'`.
- Welcome screen, under the two cube tiles: a row of three pill buttons with `aria-pressed`,
  labelled English, עברית, Polski (never flags; a flag is a country, not a language). A tap sets
  `app.lang`, saves it, applies it to the page and re-renders the welcome screen. The fonts and
  text direction change on the spot.
- One function `applyLang()` sets `<html lang>` and `<html dir>`. It runs at start-up, before the
  first render, and on every tap of the switch.

### Right to left

- Hebrew sets `<html dir="rtl">`. Text, headings, buttons, the panel and the camera sheet follow
  it on their own.
- Everything that shows the physical cube is pinned with `direction: ltr` in CSS: `.stage` (3D
  cube and arrows), every `.face-grid` (the editable one, `.mini`, `.check`, the 3x3 variant),
  `.cam-view` and `.cam-guide`, `.move-icon`, `.chips` and `.bar` (progress reads left to right,
  like the move icons), and `.palette` (the colors keep the same order in every language, so the
  child sees one familiar row).
- Rules that name a physical side switch to logical properties: `.move-head h1`, `.help` and `.howto`
  (`text-align: left` becomes `start`). The Photo button beside the grid and the Retake button in the
  camera view stay on the right in every language, because `.grid-row` and `.cam-view` are pinned
  with the cube (decided during the build: the button belongs to the physical grid). The builder
  finds the rest by searching the CSS for `left`, `right` and `text-align`.
- Left and right inside the move instructions are physical directions and are translated as such.

### Fonts

- Fredoka stays the display font for all three languages; it already has Hebrew glyphs.
- Hebrew text uses Assistant 400 and 700 from Google Fonts (my call: clean, open letters, a good
  match for Andika's role; Varela Round was the other candidate but has one weight). It is added
  to the existing font link. Google Fonts serves the Hebrew subset only to pages that render Hebrew,
  so English and Polish download nothing extra.
- `:root[lang="he"]` overrides `--text` with `'Assistant', 'Arial Hebrew', system-ui, sans-serif`.
- Polish needs nothing: Fredoka and Andika both carry Latin Extended.

### Fitting the phone

- Polish runs about a quarter longer than English. The small-phone block (`max-height: 720px`) and
  the `31ch` lead width still apply. The builder measures the same screens CLAUDE.md lists, at
  375x667 in all three languages, and keeps each screen within today's numbers (side 1 fits; later
  sides within 705). Shorten the Polish or Hebrew wording first; a small CSS change is allowed
  when faithful wording still does not fit (Max, 2026-11-04, for the Polish side-1 screens).

### Tests

- New `tests/strings.test.js` (Node): every key has `en`, `he` and `pl`; placeholder names match
  across the three; plural sets include `other`; per-color sets have all six colors; no em dashes;
  no all-caps words; every English value equals the string it replaced (a one-time snapshot taken
  before the move, so English provably did not change).
- `tests/e2e/flows.py`: the 2x2 solve runs once per language (tap the switch, then the usual taps).
  The solution is read from the notation badges, which are language-free. Headings are compared
  against `STRINGS` for that language.
- The layout measurement from the 2026-11-04 review runs for Hebrew and Polish; Hebrew also
  checks `scrollWidth` so nothing hangs off the right edge.
- Max reviews `src/strings.js` directly (it opens in a cmux panel) and then the live site in each
  language on the phone.

### Shipping

- Nothing goes live before Max has reviewed both languages. If one review lags, Max may choose to
  ship the other first; the switch shows only the languages that are in.

## Left to the builder

- Key names and the order of entries (follow the order of screens in `ui.js`).
- The Hebrew and Polish drafts themselves (Max reviews).
- Which CSS rules need logical properties beyond the ones named above.
- Whether the capitalisation helper `cap()` is still needed per language.
- How `sideText` and `camText` are restructured so each branch is one `t()` call.
