# Cube Coach - project memory for Claude Code

Cube Coach is a one-file web app that walks a child through solving a 2x2 or 3x3 Rubik's cube. The
child copies the cube's colors (by tapping or with the camera), the app checks that the copy is a real
cube, works out a short solution, and shows every turn on an animated 3D cube with an arrow.
It speaks English, Hebrew and Polish; the switch sits on the welcome screen.
Max (GitHub `MaxFokin`) built it for Max's son in a Claude chat on 2026-10-31. On 2026-11-04 Claude
Code reviewed every file, fixed what was found, and published it to GitHub Pages.

This file is the project's memory. Everything in it is current and was verified on 2026-11-04.
When a fact here changes, change it here in the same commit.

Live: https://maxfokin.github.io/cube-coach/

## Start of every session

1. `git pull`, then `python3 build.py --check` (must say index.html is up to date) and `npm test`
   (three Node tests must pass; run `npm install` first if `node_modules` is missing).
2. If the work touches `ui.js`, `camera.js`, `strings.js` or the CSS, also run the browser tests
   and the screen walks (see Testing).
3. Report what passed, then ask Max what to work on. Don't change behavior, copy or design on your own.

## How we work together

- Max decides scope. Bugs get a failing test first, then the smallest fix at the root cause.
  Features and design changes only when Max asks for them.
- Edit `src/`, run `python3 build.py`, and always commit `index.html` together with the sources.
  GitHub Pages serves `index.html`. Never edit `index.html` by hand.
- `npm test` before every commit. Browser tests before pushing a change to the UI, camera or CSS.
- Every push to `main` goes live within a minute. Ask before pushing unless Max asked for the push in
  the same conversation.
- Keep this file and `README.md` true. Test facts, layout numbers and the fix log live here.
- `tests/fixtures/photos/*.jpg` are personal photos of the family's cube and `cube-coach-project.zip`
  contains them too. Both are ignored by git on purpose; never commit them.

## Layout

- `index.html` - the whole app in one file, BUILT from `src/` by `build.py`. Served by GitHub Pages.
- `apple-touch-icon.png`, `.nojekyll` - home-screen icon, and a flag so Pages serves files as-is.
- `src/` - the real sources, concatenated into one script inside one IIFE, in this order:
  - `page.template.html` - head and body skeleton with `{{CSS}}` and `{{JS}}` placeholders.
  - `base.css` - tokens (light and dark), layout, stage, grids, palette, buttons, confetti, breakpoints.
  - `extra.css` - cube choice tiles, 3x3 grids, green edge bars, thinking spinner, camera sheet.
  - `core2.js` - 2x2 model: stickers, moves, deduction of the whole cube from 4 sides, validation,
    optimal solver. Also `cross` and `dot`, used by `core3.js` too.
  - `core3.js` - 3x3 model: Kociemba facelet order, all 18 moves, validation (pieces, twist, flip,
    parity), turned-side and single-square fix search, cubejs facelet string.
  - `colorread.js` - reads sticker colors from pixels (camera or photo) and finds the cube in a photo.
  - `strings.js` - every word a person reads, in English, Hebrew and Polish, plus `t()`, `moveText()`,
    `LANGS` and the current language. No DOM in this file.
  - `ui.js` - app state, 3D stage (CSS 3D), turn animations, arrows, saving, every screen.
  - `camera.js` - the camera sheet: live camera, photo fallback with drag and pinch, live color dots.
  - `main.js` - start-up: restore, build the stage, render; Start over button; resize handling.
- `build.py` - `python3 build.py` writes `index.html`; `--check` exits 1 if it is stale. Reads and
  writes UTF-8 explicitly (the copy has typographic apostrophes).
- `tests/` - Node unit tests (`run.js`, `load.js`, `*.test.js`), Playwright browser tests (`e2e/`,
  with `screens.py` walking every screen in one language), an offline copy of cubejs
  (`vendor/cubejs`), fixtures (`fixtures/`: `en-screens.json` is the English text snapshot; generated
  files are ignored).
- `docs/superpowers/` - the design and plan documents of features built with Claude Code.
- `floorplan/` - a visual map of the codebase made with the Floorplan plugin, committed on purpose so it
  travels with the repo and GitHub Pages serves it at https://maxfokin.github.io/cube-coach/floorplan/.
  `architecture.json`, `descriptions/` and `recent-work.json` are hand-written; `index.html`, `graph.json`,
  `serve.mjs` and `query.mjs` are generated; `.cache/` stays out of git. Ask to "update the floorplan"
  (`/floorplan:floorplan`) after bigger changes, then commit the folder with the change. If a build ever
  restores the folder's self-ignoring `.gitignore`, the tracked files stay tracked; put `.cache/` back.
- `package.json` / `package-lock.json` - cubejs 1.3.2 and sharp 0.34.5, for tests only.
- `.venv/` - Python venv with Playwright for the browser tests (ignored by git).

The template and the file order in `build.py` are the only places that decide how `index.html` is
assembled. Function declarations are hoisted inside the IIFE, so `ui.js` may call `openCamera` and
`closeCamera` from `camera.js`, but `const` values from later files are only safe at call time.

## How the app works

### Screens and state (ui.js)

`app` holds everything: `screen`, `cube` (2 or 3), `side` (which side is being copied), `mode`
(`first` | `review` | `fix`), `entry` (2x2: 4 sides x 4 colors), `entry3` (3x3: 6 sides x 9, middles
pre-filled), `selected` palette color, `analysis`, `solution`, `move`, `flags` (squares to highlight
after an error), `unsure` (squares the camera wasn't sure about), `helpOpen`, `note`.

Screens: `welcome` -> `side` (x4 or x6) -> 2x2: `checkTop` -> `checkBottom` -> `hold` / 3x3:
`solving` -> `hold` -> `move` (one per turn) -> `done`. Error screens: `oops` (bad copy), `mismatch`
(2x2 top or bottom didn't match), `solverError` (3x3 solver failed). `go(screen)` saves and renders.
`render()` always stops loops, closes the camera, picks the right 3D model, and sets `data-screen`
and `data-big` (bigger stage) on `#app`.

Progress is saved in `localStorage` under `cube-coach-v2`, including the solution, so a reload lands
on the same move. `restore()` validates everything it reads back and keeps `checkBottom` as well as
`mismatch`; any other mid-check screen restarts at `checkTop`.

### Languages

Every word a person reads lives in `src/strings.js`, in `STRINGS[key] = { en, he, pl }`, and is read
through `t(key, vars)`. A value is a plain string with `{name}` placeholders, a plural set (`one`,
`two`, `few`, `many`, `other`; `other` is required; picked with `Intl.PluralRules` from `vars.n`), or
a per-color set keyed W Y R O B G (picked with `vars.color`); sets nest either way. `{color}` and
`{Color}` are filled with the color's name in the current language, every other `{name}` from
`vars`. A missing language falls back to English; an unknown key returns the key. Move names are in
`MOVE_TEXT[move] = { en: [title, instruction], he, pl }`, read with `moveText(m)`.

Rules for the words: whole sentences may be joined with a space (`fixLine`, `iThink`); a list of
color names may be joined with the language's `and` using the `sideListName` forms (the turned-side
note, which also has a singular and a plural sentence); words are never glued otherwise. Any
sentence whose color word inflects is written per color (Polish cases, Hebrew gender). Hebrew
addresses the child in masculine singular; Polish uses imperatives and impersonal phrasing, never a
gendered past tense. Cube notation (R, U′, F2), "Cube Coach" and the page title are not translated.
Adding a language means adding it to `LANGS` and to every entry; `tests/strings.test.js` fails on any
gap, mismatched placeholder, or malformed set.

The current language is `lang` in `strings.js` (`useLang` sets it, no DOM). `setLang(code)` in
`ui.js` also saves it under the localStorage key `cube-coach-lang`, apart from the progress record,
so `resetAll()` and `restore()` never touch it, and sets `<html lang dir>`. `main.js` applies the
saved language before `restore()` and the first render; the default is English and the phone's
language is never guessed. The switch is one small segmented control under the brand in the header,
built once from `LANGS` (`refreshLangs`): each segment shows the language's flag over its code
(`LANGS[code].flag`, `.code`), the full name is its `aria-label`, and `aria-pressed` marks the
current one. CSS shows it on the welcome screen only. Max chose this over name buttons on
2026-11-04 after seeing mockups of five variants.

Hebrew sets `dir="rtl"`; text, headings, buttons and the camera sheet follow. The header never
mirrors (`.top` is pinned left-to-right), so the brand and the switch stay top-left. Everything that shows
the physical cube is pinned to `direction: ltr` in `base.css`: `.stage`, `.face-grid`, `.grid-row`,
`.cam-view`, `.cam-guide`, `.move-icon`, `.chips`, `.bar`, `.palette`, `.key` (also
`unicode-bidi: isolate`, so `U′` never renders as `′U`) and `.langs`. Fredoka already carries
Hebrew glyphs; Hebrew text uses Assistant (`:root[lang="he"]` overrides `--text`). Polish color
names are long, so `:root[lang="pl"] .sw` uses 12 px labels: at 14 px the palette row was 3 px
wider than a 375 px phone, and mobile Chromium zooms out for that.

### Cube models and conventions

Coordinates: x right, y up, z toward the viewer. Colors are single letters W Y R O B G.
Standard color scheme is assumed: white opposite yellow, green opposite blue, red opposite orange,
and with white on top and green in front, red is on the right.

- 2x2 (`core2.js`): 24 stickers, index = corner index * 3 + axis, corners in `POS` order
  (x, then y, then z, each -1 then 1). Moves R U F only (the back-bottom-left corner never moves,
  which fixes the cube in space). Solver: two-sided breadth-first search, optimal, at most 11 turns,
  about 20 ms. From 4 side faces the whole cube is deduced: each corner's third sticker follows from
  piece chirality. Both "turned the cube left" and "turned it right" copy orders are tried.
- 3x3 (`core3.js`): 54 facelets in Kociemba order U R F D L B, each face read row by row as seen from
  outside (U with the back at the top, D with the front at the top, sides with U at the top). This is
  exactly the string cubejs expects after mapping colors to face letters (`toFaceletString`).
  Validation = real pieces, no duplicates, twist sum 0 mod 3, flip sum 0 mod 2, corner parity = edge
  parity. When the plain copy is invalid, `analyze3` tries all 4^6 quarter-turn combinations of the
  copied sides (about 3 ms in Node). Hits are counted by resulting cube, not by combination (turning
  a solid face changes nothing), and the cube reached with the fewest turned faces wins unless two
  cubes tie. That matters for a nearly solved cube, which also reads as another valid cube when all
  four sides are turned 180. Then every single-square change (240 candidates) is tried to suggest the
  wrong square. Over 3000 random scrambles with one side copied turned, 2999 are fixed; the rest are
  copies that happen to be a different valid cube, which nothing can tell apart.
- Face cells (`FACE_CELLS` for 2x2, `cell3` for 3x3) are listed top-left, top-right, bottom-left,
  bottom-right as the child sees them. The 2x2 copy order is F R B L (turning the cube left); the 3x3
  copy order is `STEPS3 = F R B L U D` guided by middle colors (green, red, blue, orange, white, yellow).

### 3D stage

Pure CSS 3D, no library. `MODEL[2]` and `MODEL[3]` give cubie positions and a `slot(i)` map from
sticker index to (cubie, axis). Each cubie is a div with 6 face divs; outer faces carry a `.stk`
sticker. Orientation of the whole cube is `rotateX(vx) rotateY(vy) rotateX(ax) rotateY(ay)`
(`setOrient`, which takes the shortest way round for ay). Views: `input` (slightly from the left so
the previous side stays visible), `top`, `bottom`, `solve`.

Turn animation (`turn`): the layer's cubies get a Web Animations rotate3d, then the state is
repainted and the animations cancelled, so slots never move. CSS mapping of a clockwise face turn:
R = rotateX(+90), L = rotateX(-90), U = rotateY(-90), D = rotateY(+90), F = rotateZ(+90),
B = rotateZ(-90). Timings in `moveLoop`: arrow shown 1.4 s, quarter turn 1.5 s, half turn 2.3 s,
result held 1.6 s. Arrows are SVG on two planes: the front face for R L U D F, the top face for B
(its back row).

Never put `opacity` or `filter` on `.cube`, `.spinner` or `.cubie`: it flattens the 3D (fade the
`.scene` instead). Never put `overflow` other than `visible` or `clip` on an ancestor with
`transform-style: preserve-3d` (`clip` is fine and is what `.stage` and `body` use).

### 3x3 solver

Loaded only when a 3x3 is picked, from jsDelivr, pinned:
`https://cdn.jsdelivr.net/npm/cubejs@1.3.2/lib/cube.js` and `.../solve.js` (MIT). `Cube.initSolver()`
blocks the main thread for 2-8 s the first time, so the `solving` screen shows a spinner first.
`ensureSolver` keeps one shared promise for download plus init, so two overlapping `solving` screens
(a resize while the script downloads renders the screen twice) cannot run `initSolver` twice; a
failure clears the promise so "Try again" really retries. cubejs returns a non-empty "solution" for an
already solved cube, so `isSolved3` is checked first. Every solution is re-applied with the app's own
turns and must solve the cube, or `solverError` shows. Solutions are 20-22 moves. The copy of cubejs
in `tests/vendor/cubejs` exists only so tests run offline.

### Camera (camera.js, colorread.js)

The Photo button on every side screen opens a dark full-screen sheet. It tries `getUserMedia` (live
view with a square guide, live color dots, tips); if that fails it offers "Take a photo" and
"Choose a photo". Those are real `<input type=file>` elements laid invisibly over the buttons,
because a script-triggered `click()` on a hidden input is ignored by the iPhone app's web view.
`startLive` remembers which sheet asked for the camera: a stream that arrives after that sheet was
cancelled is stopped, never leaked. Only a denied permission (`NotAllowedError`, which is what the
Claude app's viewer gives) turns the live camera off for the rest of the session; a busy or missing
camera is tried again on the next side. Photos are decoded with `createImageBitmap` (falls back to a
data URL), downscaled to 1600 px, auto-fitted with `findFace` (the biggest squarish patch of black
plastic near the middle), and can be dragged and pinched. Nothing is uploaded anywhere.

`readFace` samples the middle 64% of each cell and judges color from the most vivid quarter of its
pixels, which glare rarely covers. Hue bands: red < 11 or >= 345, orange < 38, yellow < 72,
green < 175, blue < 265. Pale squares are white unless their tint is green-ish or pink/purple (a
washed-out color), which are returned as G or R but `unsure`. On a 3x3 the known middle squares tune
the red/orange and orange/yellow borders for the room's light (`camRefs`). Unsure squares get a
dashed outline in the grid and a note. Tuned on only four real photos of the 2x2
(`tests/fixtures/photos`, 16/16 right) plus a synthetic 3x3 side; under simulated warm or cool casts
it drops to 13-14 of 16.

### Copy and design rules

Audience is a child. Short sentences, one action per screen, no shouting (no all caps), hyphens not
em dashes in anything a person reads, typographic apostrophes (’) in UI text. Errors say exactly
what is wrong and never apologize. Fonts: Fredoka (display) and Andika (text, made for early
readers), from Google Fonts with real fallbacks. Colors are tokens on `:root` with dark-mode values;
cube sticker colors are fixed hex values in `HEX`. The coach color (magenta) is used only for arrows
and highlights, never for cube colors, so it reads on every sticker. The `@media (max-height: 720px)`
block is the small-phone layout; see Known weak points for where it still scrolls. Translations are
drafted by Claude Code and reviewed by Max before they ship; the review surface is `src/strings.js`,
where each key shows its three languages together.

## Testing

```
npm install                       # cubejs 1.3.2 and sharp 0.34.5, for tests only
npm test                          # Node: strings, core2, core3 (cross-checked against cubejs), colorread
python3 build.py --check          # index.html matches src/
python3 -m venv .venv && .venv/bin/pip install playwright && .venv/bin/playwright install chromium
node tests/e2e/fixtures.js        # random 3x3 scramble, synthetic side, fake camera clip
source .venv/bin/activate && npm run e2e   # Playwright: 2x2 solve per language, 3x3 solve, photo path, fake camera
npm run screens                   # every screen's English text and height against tests/fixtures/en-screens.json
python3 tests/e2e/screens.py he   # the same walk in Hebrew (no Latin left) or Polish (pl: no English left)
```

Verified on 2026-11-04 with Node 26.6, npm 11.18, Python 3.9.6, Playwright 1.60.0. Chromium lives
in `~/Library/Caches/ms-playwright`. Tests skip the real photos when they are absent and serve
cubejs from `tests/vendor/cubejs`, so everything runs offline.

Facts the tests guarantee: the 2x2 photo cube solves in `U' R' F R U2 R2 U F' U`; a single wrong
square on either cube is always detected and the wrong square is always among the suggestions; a
3x3 side copied a quarter turn off is fixed at least 147 times in 150 (random) and always next to a
solid face (fixed case); the app's turns match cubejs; every shown solution solves the copied cube;
a reload after confirming the 2x2 top lands on the bottom check. Every key and move exists in every
language with matching placeholders and well-formed plural and color sets; the English text of the
19 walked screens equals the snapshot; Hebrew screens hold no Latin word and Polish screens no
English word; a reload and Start over keep the language; the grids, the 3D stage, the move icon
and the notation badge stay left-to-right in Hebrew; the switch works when localStorage throws.

Layout, measured in headless Chromium with realistic entries (page height / viewport height):

| Screen                       | 375x667   | 360x640   |
|------------------------------|-----------|-----------|
| welcome, checks, hold, move, done, oops, mismatch | fits | fits, checkBottom 644 |
| side 1 (2x2 and 3x3)         | 667, fits | 649       |
| sides 2 and up (2x2 and 3x3) | 705       | 692       |
| move with the help box open  | 766       | 757       |

On sides 2 and up the extra 38 px is the "Show the turn again" link below the action buttons, so the
buttons stay visible at 375x667. Everything fits at 390x844. Hebrew and Polish measure the same on
the 19-screen walk of `screens.py` at 375x667: sides 2 and up 705 (Polish 703), the move screen with
the help box open 766, everything else fits.

## Deployment

- GitHub: `MaxFokin/cube-coach`, public, branch `main`. GitHub Pages is on since 2026-11-04:
  "Deploy from a branch", folder "/ (root)", HTTPS enforced, live at
  https://maxfokin.github.io/cube-coach/ and republished within a minute or two of every push to
  main. No CI; the tests above are the gate.
- The account is on GitHub's free plan, so Pages only works while the repo stays public. Making a
  repo public is Max's call, never Claude Code's (the auto-mode guard blocks it anyway).
- The `gh` CLI on this Mac is logged in as `MaxFokin`. This clone commits as
  `Max Fokin <24751127+MaxFokin@users.noreply.github.com>` (local git config, no global identity).
- Phones: open the URL in Safari or Chrome, Share, Add to Home Screen. The live camera needs HTTPS,
  which Pages provides. Inside the Claude app the live camera is blocked; the photo buttons are the
  path. The 3x3 needs internet the first time (solver download). There is no service worker or
  manifest, so offline use depends on the browser cache and the home-screen icon opens a browser tab.

## Known weak points

- Sides 2 and up scroll by 38 px on a 375x667 phone (the replay link), and every side screen scrolls
  a little at 360x640. Fixing it means a design decision (move or drop the link, or a shorter stage).
- Camera color reading was tuned on four photos. Red vs orange and glare are the weak spots.
- Not tested on a real iPhone or Android device; all browser testing was headless Chromium with
  phone-sized viewports, light and dark mode, 360x640 to 768x1024.
- Standard color scheme only. A cube with a different scheme (e.g. Japanese) fails validation.
- 3x3 solutions are 20-22 moves and include back-layer turns, which are the hardest for a child.
- `solverError` blames the internet for any failure in the solve step. cubejs can in theory find no
  solution within 22 moves (never seen in 400 random cubes), and then "Try again" fails the same way.
- If a turn is done wrong mid-solve, the app cannot see it; the child must tap "My cube looks
  different" and copy the cube again.
- Test code repeats itself: the synthetic 3x3 side is built in both `colorread.test.js` and
  `e2e/fixtures.js`, `entryOf` exists twice, and `SOLVED2` lives in `ui.js` but is recomputed in
  `core2.test.js`. Harmless, but change both copies together.
- The Hebrew and Polish were drafted by Claude Code and shipped on 2026-11-04 after Max tried the app;
  the reviewer's list of lines a native speaker may stop at (`docs/superpowers/reviews/`) is still open,
  and Hebrew is masculine singular throughout.
- `screens.py` cannot capture the short `solving` screen (the solver blocks the thread), so its two
  strings are covered by the strings test only.

## Backlog ideas (not started)

- A simpler beginner's method for the 3x3 (more moves, but teachable) as an option.
- Snap a photo when the live view is steady, instead of tapping.
- Better color calibration: ask for one photo of a solved side, or use all six 3x3 middles together.
- A mode that shows the previous and next move side by side for kids who turn too fast.
- A web manifest and service worker, so the home-screen icon opens full screen and works offline.

## History

Built on 2026-10-31 in one Claude chat, in this order:
1. Max photographed the 2x2 and got a 9-turn solution in chat (`U' R' F R U2 R2 U F' U`).
2. Cube Coach for the 2x2: copy 4 sides, confirm the deduced top and bottom, animated turn guide,
   error screens that point at the wrong square, progress saved on the device, confetti at the end.
3. 3x3 added with a cube choice on the start screen: 6 sides guided by middle colors, cubejs solver
   loaded on demand, turned-side auto-fix, arrows for all six faces including the back layer.
4. Camera copying: live camera with a guide and live color dots, photo fallback with auto-fit, drag
   and pinch, unsure squares marked. Color reading tuned on the four real photos (16/16).
5. After real-phone use: the photo buttons became real file inputs laid over the buttons (the iPhone
   Claude app ignored script-triggered clicks), and turn demos were slowed to roughly 2x.
6. Packaged for GitHub Pages (index.html at the root, home-screen icon, .nojekyll) and handed over
   with a brief on 2026-11-04.
7. 2026-11-04, Claude Code: full review of every file, browser tests run for the first time, then
   fixed: the turned-side search (hits by cube, fewest turned faces; a nearly solved cube with one
   side copied turned used to fail as ambiguous), double solver init on overlapping solving screens,
   a reload on the bottom check restarting at the top check, a leaked camera stream from a cancelled
   sheet, the live camera staying off after a busy camera, and locale-dependent builds. Added the
   regression tests and the layout measurements above, then pushed to GitHub. Max made the repo
   public and Pages went live the same day.
8. 2026-11-04, Claude Code, branch `translations`: Hebrew and Polish. All copy moved into
   `src/strings.js` with English proven unchanged by a screen snapshot, a language switch on the
   welcome screen, right-to-left Hebrew with the cube pinned left-to-right, per-language browser
   tests and screen walks. Design, plan and the final review in `docs/superpowers/`. Merged to main
   and live the same day.
