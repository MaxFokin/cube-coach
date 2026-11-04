# Review: translations (12717ed..b5ba491)

Reviewed in one pass by me, without subagents: the source diff (ui.js, camera.js, main.js, CSS, template, build, test loaders), all of `src/strings.js`, `tests/strings.test.js`, `tests/e2e/flows.py`, `tests/e2e/screens.py`, the spec and plan headings, and the CLAUDE.md and README changes. I did not read `index.html` line by line, because `build.py --check` passes.

Verified on this checkout (the tree is still clean):
- `python3 build.py --check`: up to date.
- `npm test`: strings (133 keys, en he pl), core2, core3, colorread. All pass.
- `screens.py en | he | pl`: 19/19 screens pass in each language. side 2 (3x3) is 705 in en and he and 703 in pl, and move help is 766.
- `flows.py`: the 2x2 flow passes in en, he and pl, as do blocked storage and the 3x3 flow. `camera.py` passes all three paths.

## Strengths

- The architecture is clean and small. `t()` is 17 lines, has no DOM, and caches `PluralRules` per language, so calling it on every render costs nothing. Nested plural and color sets cover both Polish cases and Hebrew gender without a grammar engine.
- Writing the English screen snapshot first (Task 1) is a strong proof that the refactor changed no English. Heights and a width check are measured per language, and the zoom-out trap (`scrollWidth` vs a 375 px viewport) was caught and closed.
- The strings test protects the table well. It checks every key in every language, placeholder parity, full color sets, an `other` in every plural set, no em dashes and no shouting.
- The language is saved apart from the progress record, so `resetAll` and `restore` cannot touch it. `setLang` and the start-up read are wrapped in try/catch, and the throwing-localStorage case is tested in a browser.
- Cube pinning is done carefully. `.key` gets both `direction: ltr` and `unicode-bidi: isolate`, which is what actually prevents `′U`, since `direction` alone does nothing on an inline element. Buttons in the switch carry `lang=` for screen readers.
- All five Review Focus items have a test:
  - A Hebrew reload mid-solve lands on the same move (`flow2`, reload on the move screen).
  - Start over keeps the language.
  - `.key` stays left-to-right.
  - Plurals are right in en, he and pl (Polish one, few and many differ). The 3x3 lengths come out correctly too: 20 and 21 give "ruchów", 22 gives "ruchy".
  - Throwing storage does not break the switch or start-up.

## Issues

### Critical (Must Fix)

None.

### Important (Should Fix)

1. **`src/strings.js:389` (`oopsOneLead3.he`): a Hebrew grammar error in all 6 variants.** Each one reads "בהצד הלבן…", "בהצד הירוק…". In Hebrew the ה is absorbed after ב, so the correct form is "בצד הלבן". `oopsOneLead2.he` on line 385 already has it right ("בצד {n}"). Any native reader will notice. This shows on the 3x3 "Check this square" screen, which a child sees after any single wrong square.
   - **Fix:** replace `בהצד` with `בצד` in the six strings.

2. **`src/strings.js:174, 329-332` with `src/ui.js:428` (`turnedNote` and `t('and')`): the sentence is assembled by joining words, which breaks Polish and Hebrew.** `finishSides` builds `{sides}` from `faceName3` names joined with `t('and')`. That breaks the project's own rule in CLAUDE.md: "whole sentences may be joined, words never".
   - **Polish:** "Strona w kolorze **zielony** była skopiowana obrócona." After "w kolorze" Polish needs the locative ("zielonym"), so the nominative masculine `colorName` is wrong in every case. With two sides it becomes "Strona w kolorze zielony i czerwony była…", a singular subject and verb for two sides.
   - **Hebrew:** "צד ירוק הועתק מסובב" is indefinite where it should be definite ("הצד הירוק"). With two sides it becomes "צד ירוק ואדום הועתק", with a singular noun and verb.
   - **Who sees it:** every 3x3 user whose copy the auto-fix rescues, on the hold screen. That is the feature's main success path.
   - **Fix:** remove the joined list. Use a per-color set when one side is turned, and one generic plural sentence for two or more. For example `turnedNote: { en: { one: { W…G }, other: '…sides…' } }` with `vars.n = r.turned.length` and `color = r.turned[0]`, then delete the `and` key. The English for one side stays byte-identical, so the snapshot holds. English with two or more sides currently reads "the green and red side", so any change there is Max's call.
   - **Why the tests missed 1 and 2:** neither screen is in the walks. `screens.py` never renders the 3x3 single-square oops screen or a hold screen with a turned-side note (SCR3 is copied correctly), and `flows.py` covers only those two paths in English.
   - **Fix:** add both to `screens.py`, for example by copying SCR3 with one side rotated and then with one square changed. The he and pl walks would then at least render them, and Max can read them in context.

### Minor (Nice to Have)

3. **`CLAUDE.md:289`: the backlog is stale.** "Hebrew (RTL) version with a language switch." is still listed under "Backlog ideas (not started)", but this branch ships it. The file says it must stay true, so delete the line.

4. **`src/main.js:30`: `savedLang in LANGS` also accepts inherited keys.** A stored value of `constructor` or `toString` passes the check. `t()` would then return every key name, because `entry.constructor` is a function, and `dir` would become `"undefined"`. This only happens with tampered storage. Use `Object.hasOwn(LANGS, savedLang)`. The same pattern exists in `restore()` (`x in MOVE_TEXT`), but that predates this branch.

5. **`src/ui.js:467`: tapping a language button loses focus.** `render(false)` replaces the panel, so keyboard and screen-reader users land on `<body>`. After the render, focus the new button with `panelEl.querySelector(`.lang[data-lang="${code}"]`).focus()`.

6. **`tests/e2e/flows.py:59-60`: the notation test checks a proxy.** It asserts computed `direction` on `.key`, `.stage` and `.move-icon`. Removing `unicode-bidi: isolate` would bring back `′U` and the test would still pass. Also assert `getComputedStyle(key).unicodeBidi === 'isolate'`, or compare the badge's bounding box with the U glyph's position.

7. **`tests/strings.test.js`: a gap in the color check.** When English has `{color}` and a translation leaf is a plain string, nothing checks that the leaf still contains `{color}`. A translator could drop the color silently. A one-line assert would close it: if the English leaves contain `{color}` or `{Color}`, then every plain-string leaf in another language must contain one of them.

8. **`tests/strings.test.js`: English `doneLead` with n = 1 is only checked through `_probe`.** The real key's "That took 1 turn" is not asserted, and the snapshot only covers 9. Add `assert.strictEqual(t('doneLead', { n: 1 }).startsWith('That took 1 turn.'), true)`.

9. **Translated strings go into `innerHTML` and attributes without escaping (`src/ui.js`, `src/camera.js`).** Today nothing breaks. The only `"` is in `camTipGood.he`, which goes through `textContent`. But a future translation with `"` inside an `aria-label` value would break the markup. Either note it in the strings.js header or escape `"` in attribute-bound calls.

10. **`src/camera.js:110`: `setTip` declares a local `const t`, which shadows the global `t()` inside that function.** It is harmless now. Renaming the local to `tip` keeps a later edit from calling an element.

### Hebrew and Polish lines a native speaker may stop at

These are for Max's review. Items 1 and 2 above are the clear errors. These are naturalness notes.

**Hebrew**
- `:87` `F'` title "הצד הקדמי הפוך משעון" is awkward. Something like "הצד הקדמי נגד השעון" reads better.
- `:35, :51` "ממך והלאה" is stilted for a child. "הרחק ממך" is more natural.
- `:515` "נפתר!" is masculine. The cube is feminine elsewhere ("היא כבר פתורה!" on line 455), so "נפתרה!" would be consistent.
- `:519` has two issues:
  - "לסיבוב נוסף" reuses סיבוב ("turn") to mean "round" in the same sentence that counts סיבובים. "לעוד סבב" avoids the clash.
  - The one form, "זה לקח 1 סיבוב", is more natural as "סיבוב אחד".
- Throughout: "מול הפנים שלך" literally means "in front of your face". "מולך" or "פונה אליך" is the usual phrasing.
- `:369, :425` "התבלבל / התבלבלו" for objects is colloquial. "התערבב" is more precise.
- `:532` "התאם את הצד לתוך הריבוע" is clunky.

**Polish**
- `:373, :417, :429` "Przejdźmy strony" sounds wrong. Use "Przejdźmy przez strony" or "Sprawdźmy strony".
- `:185` "Dotknij znów: od nowa" is telegraphic. Compare "Dotknij jeszcze raz, by zacząć od nowa" (it may need width checking on the header).
- `:215` "Popraw każde złe pole": "błędne" fits better than "złe".
- The `R2`/`L2`/etc. moves read "…dwa razy. Obojętnie w którą stronę." "Stronę" appears twice with two meanings (side and direction). "Obojętnie, w którym kierunku" avoids that.
- `:532` "z wybraną górą u góry" repeats itself.
- `:588, :628` "Podejdź blisko / bliżej" means "walk closer". For a camera, "Zbliż telefon" is the natural phrase.
- `:344` "wszystko się zgadza" ("everything matches") drifts from "I sorted it out".
- Aria labels only: in `:164` "Środkowe pole: biały" and `squareLabel` the colors are masculine but pole is neuter (should be "białe"), and the square name is capitalized mid-sentence ("Pole Lewe górne").

## Declined to judge

- **Progress chips and bar read left to right in Hebrew.** The spec chose it explicitly (spec line 115).
- **Photo and Retake buttons stay on the right in Hebrew (Task 7 ruling).** They belong to the pinned physical grid, so this is reasonable and I accept it.
- **The English turned-side note says "side" in the singular for several sides.** That is pre-existing English copy locked by the snapshot, and changing it is Max's call (relevant if item 2 is fixed).
- **`x in MOVE_TEXT` in `restore()` accepts inherited keys.** The pattern predates this branch.
- **`app.note` is saved as rendered text rather than a key plus vars.** It cannot go stale: the language only changes on welcome, and leaving welcome always calls `resetAll()`.
- **Fonts on real devices.** I did not check how Assistant and Fredoka render Hebrew on a real phone; every test is headless Chromium with fonts blocked.
- **General naturalness of all 133 keys.** This is beyond the lines listed above, and Max is the native-language reviewer.
- **The other rulings are all reasonable and I accept them:**
  - working on a branch rather than a worktree
  - moving MOVE_TEXT out of ui.js early
  - the Hebrew one-vs-other probe
  - looping flows.py over the languages the switch offers
  - leaving the switch row out of the screen text
  - Polish palette labels at 12 px
  - the stricter width check

## Recommendations

1. Fix items 1 and 2 first: the "בהצד" error is a one-word fix, and the turned-side note needs a per-color or plural set and the `and` key removed. Add the 3x3 oops and turned-side screens to `screens.py` so every language renders them.
2. Do the cheap hygiene: drop the stale backlog line, use `Object.hasOwn`, restore focus after a language switch, and assert `unicode-bidi`.
3. Hand Max the language list above along with `src/strings.js` for his review.

## Assessment

**Ready to merge?** With fixes.

**Reasoning:** The architecture, tests and RTL handling are solid, and every suite passes in all three languages. But two user-visible strings on the 3x3 path are wrong for native readers: the "בהצד" construction, and the turned-side note assembled by joining words, which gives the wrong case and number in Polish and Hebrew. The tests miss both because neither screen is walked.
