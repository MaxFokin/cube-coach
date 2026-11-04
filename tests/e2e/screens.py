"""Walks every screen in one language and records its text and page height at 375x667.
English: the text of every screen must equal tests/fixtures/en-screens.json (the proof that
English copy never changes). Hebrew: no Latin word may be left. Polish: no English word may be
left. Every language: heights within the limits in docs/superpowers/plans/2026-11-04-translations.md.
    python3 tests/e2e/screens.py en --write    # refresh the snapshot, only after a copy change Max asked for
    python3 tests/e2e/screens.py en|he|pl
Needs the Playwright venv (see README)."""
import asyncio, json, pathlib, re, sys
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
URL = (ROOT / 'index.html').as_uri()
VENDOR = ROOT / 'tests' / 'vendor' / 'cubejs'
SNAP = ROOT / 'tests' / 'fixtures' / 'en-screens.json'
MAX = [['W','G','Y','O'],['W','B','Y','G'],['W','B','R','B'],['O','R','Y','G']]
# The solved 3x3 after R U2 F' L D B2 R' U F D2, as the six copied sides F R B L U D.
SCR3 = ["GGWWGOBGG","RRYYRGOBY","GOROBWRWO","GYWROBYYO","YBORWBRRB","WWWGYYBOB"]
ALLOWED = ('Cube Coach', 'English', 'Polski', 'Cube', 'Coach')
VW, VH = 375, 667
FOOTER = 57  # the credits line below every screen: a 24 px gap and a 33 px line, under the buttons

async def new_page(browser, lang, solver=True):
    ctx = await browser.new_context(viewport={'width': VW, 'height': VH}, is_mobile=True, has_touch=True)
    page = await ctx.new_page(); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    await page.route('**/fonts.g*/**', lambda r: r.abort())
    if solver:
        await page.route('https://cdn.jsdelivr.net/npm/cubejs@1.3.2/lib/*', lambda r: r.fulfill(path=str(VENDOR / r.request.url.split('/')[-1]), content_type='application/javascript'))
    else:
        await page.route('https://cdn.jsdelivr.net/npm/cubejs@1.3.2/lib/*', lambda r: r.abort())
    await page.goto(URL); await page.wait_for_timeout(300)
    if lang != 'en':
        await page.tap(f'.lang[data-lang="{lang}"]'); await page.wait_for_timeout(200)
    return page, errors

async def paint(page, entry, n3=False):
    for row in entry:
        for c, col in enumerate(row):
            if n3 and c == 4: continue
            await page.tap(f'.sw[data-col="{col}"]'); await page.tap(f'button.cell[data-c="{c}"]')
        await page.tap('#next'); await page.wait_for_timeout(120)

async def walk(browser, lang):
    shots = []
    async def shot(page, label, cam=False):
        await page.wait_for_timeout(150)
        # The language switch shows every language's own name, so its text is left out.
        text = await page.evaluate("sel => { const el = document.querySelector(sel), l = el.querySelector('.langs'); return l ? el.innerText.replace('\\n' + l.innerText, '').replace(l.innerText, '') : el.innerText; }", '.cam' if cam else '#panel')
        if not cam: text += '\n' + (await page.text_content('#restart'))
        h = await page.evaluate('[document.documentElement.scrollHeight, document.documentElement.scrollWidth, window.innerWidth]')
        credits = cam or await page.evaluate("(() => { const f = document.querySelector('.credits'); return !!f && getComputedStyle(f).display !== 'none' && f.querySelectorAll('a').length === 3; })()")
        shots.append((label, text, h[0], h[1] <= VW and h[2] == VW, credits))  # content wider than the phone makes mobile Chromium zoom out
    page, errors = await new_page(browser, lang)
    await shot(page, 'welcome')
    await page.tap('#pick2'); await page.wait_for_timeout(300); await shot(page, 'side 1 empty')
    await page.tap('#camera'); await page.wait_for_timeout(600); await shot(page, 'camera sheet', cam=True)
    await page.tap('#cam-cancel'); await page.wait_for_timeout(100)
    wrong = [r[:] for r in MAX]; wrong[2][1] = 'G'
    await paint(page, wrong); await shot(page, 'oops')
    await page.tap('#review'); await page.wait_for_timeout(150); await shot(page, 'side 1 review')
    await page.tap('#next'); await page.tap('#next'); await page.wait_for_timeout(100)
    await page.tap('.sw[data-col="B"]'); await page.tap('button.cell[data-c="1"]')
    await page.tap('#next'); await page.tap('#next'); await page.wait_for_timeout(200); await shot(page, 'checkTop')
    await page.tap('#no'); await page.wait_for_timeout(100); await shot(page, 'mismatch')
    await page.tap('#review'); await page.wait_for_timeout(100)
    for _ in range(4):
        await page.tap('#next'); await page.wait_for_timeout(100)
    await shot(page, 'checkTop again')
    await page.tap('#yes'); await page.wait_for_timeout(100); await shot(page, 'checkBottom')
    await page.tap('#yes'); await page.wait_for_timeout(100); await shot(page, 'hold')
    await page.tap('#ready'); await page.wait_for_timeout(100); await shot(page, 'move 1')
    await page.tap('#lost'); await page.wait_for_timeout(100); await shot(page, 'move 1 help open')
    await page.tap('#lost'); await page.wait_for_timeout(100)
    for _ in range(9):
        await page.tap('#did'); await page.wait_for_timeout(60)
    await shot(page, 'done')
    await page.tap('#restart'); await page.tap('#restart'); await page.wait_for_timeout(200)
    await page.tap('#pick3'); await page.wait_for_timeout(300); await shot(page, 'side 1 (3x3)')
    for c, col in enumerate(SCR3[0]):
        if c == 4: continue
        await page.tap(f'.sw[data-col="{col}"]'); await page.tap(f'button.cell[data-c="{c}"]')
    await shot(page, 'side 1 filled (3x3)')
    await page.tap('#next'); await page.wait_for_timeout(150); await shot(page, 'side 2 (3x3)')
    await paint(page, [list(s) for s in SCR3[1:]], n3=True)
    await page.wait_for_selector('#ready', timeout=30000); await shot(page, 'hold (3x3)')
    await page.tap('#ready'); await page.wait_for_timeout(100); await shot(page, 'move 1 (3x3)')
    # The turned-side note (one side, then two) and the single-square oops, which the solve path never shows.
    rot = lambda s: ''.join(s[i] for i in (6, 3, 0, 7, 4, 1, 8, 5, 2))
    for turned, label in (((0,), 'hold (3x3) one side turned'), ((0, 1), 'hold (3x3) two sides turned')):
        await page.tap('#restart'); await page.tap('#restart'); await page.wait_for_timeout(200)
        await page.tap('#pick3'); await page.wait_for_timeout(300)
        await paint(page, [list(rot(s) if k in turned else s) for k, s in enumerate(SCR3)], n3=True)
        await page.wait_for_selector('#ready', timeout=30000); await shot(page, label)
    await page.tap('#restart'); await page.tap('#restart'); await page.wait_for_timeout(200)
    await page.tap('#pick3'); await page.wait_for_timeout(300)
    wrong3 = [list(s) for s in SCR3]; wrong3[0][0] = 'W'
    await paint(page, wrong3, n3=True); await shot(page, 'oops (3x3 one square)')
    await page.context.close()
    page2, errors2 = await new_page(browser, lang, solver=False)
    await page2.tap('#pick3'); await page2.wait_for_timeout(300)
    await paint(page2, [list(s) for s in SCR3], n3=True)
    await page2.wait_for_selector('#retry', timeout=10000); await shot(page2, 'solverError')
    await page2.context.close()
    return shots, errors + errors2

def english_left(text, snap):
    words = set(re.findall(r'[A-Za-z]{4,}', ' '.join(v['text'] for v in snap.values())))
    return [w for w in re.findall(r'[A-Za-z]{4,}', text) if w in words and w not in ALLOWED]

def latin_left(text):
    for tok in ALLOWED: text = text.replace(tok, '')
    return re.findall(r'[A-Za-z]{2,}', text)

async def main(lang, write):
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        shots, errors = await walk(browser, lang)
        await browser.close()
    snap = json.loads(SNAP.read_text(encoding='utf-8')) if SNAP.exists() else {}
    bad = 0
    for label, text, height, fits_wide, credits in shots:
        limit = FOOTER + (705 if re.search(r'side [2-6]', label) else 766 if 'help' in label else 667)
        problems = []
        if height > limit: problems.append(f'height {height} over {limit}')
        if not fits_wide: problems.append('wider than the screen')
        if not credits: problems.append('no credits line')
        if lang == 'en' and not write and snap.get(label, {}).get('text') != text: problems.append('text differs from the snapshot')
        if lang == 'he' and latin_left(text): problems.append('Latin left: ' + ' '.join(latin_left(text)[:6]))
        if lang == 'pl' and english_left(text, snap): problems.append('English left: ' + ' '.join(english_left(text, snap)[:6]))
        print(('   ok   ' if not problems else '   FAIL ') + f'{label:22s} {height:4d}  ' + '; '.join(problems))
        bad += bool(problems)
    if lang == 'en' and not write and set(snap) != {s[0] for s in shots}:
        print('   FAIL the list of screens differs from the snapshot'); bad += 1
    if errors:
        print('   FAIL page errors:', errors); bad += 1
    if write:
        assert lang == 'en', 'only the English snapshot is written'
        SNAP.write_text(json.dumps({l: {'text': t, 'height': h} for l, t, h, _, _ in shots}, ensure_ascii=False, indent=1), encoding='utf-8')
        print('snapshot written:', SNAP.relative_to(ROOT))
    print(f'{lang}: {len(shots)} screens, {bad} problems')
    sys.exit(1 if bad else 0)

if __name__ == '__main__':
    asyncio.run(main(sys.argv[1] if len(sys.argv) > 1 else 'en', '--write' in sys.argv))
