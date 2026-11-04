# Cube Coach

A one-file web app that guides a child through solving a 2x2 or 3x3 Rubik's cube. Copy the cube's
colors by tapping or with the camera, let the app check the copy and work out a short solution, then
follow each turn on an animated 3D cube. Everything runs in the browser; nothing is uploaded.
It speaks English, Hebrew and Polish; pick the language on the first screen.

Live: https://maxfokin.github.io/cube-coach/ (open it on a phone, then Share > Add to Home Screen).

## Develop

- Edit the files in `src/`, then run `python3 build.py` to rebuild `index.html` (the deployed file).
- `npm install` then `npm test` runs the Node tests.
- Browser tests, once: `python3 -m venv .venv && .venv/bin/pip install playwright && .venv/bin/playwright install chromium`.
  Then `node tests/e2e/fixtures.js` and `source .venv/bin/activate && npm run e2e`.
- `npm run screens` (venv active) compares every screen's English text and height with `tests/fixtures/en-screens.json`;
  `python3 tests/e2e/screens.py he` (or `pl`) walks a translation the same way.
- See `CLAUDE.md` for how everything works.

## Credits

The 3x3 solver is cubejs (MIT), loaded from jsDelivr. Fonts: Fredoka
and Andika from Google Fonts.
