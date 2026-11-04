"""Browser tests for the whole app: a 2x2 solve from the known photo cube in every language the
welcome switch offers, and a 3x3 solve from a random scramble. Needs the Playwright venv (README)
and node tests/e2e/fixtures.js (writes tests/fixtures/generated/scramble3.json).
The 3x3 solver is served from tests/vendor/cubejs instead of the CDN, so this runs offline."""
import asyncio, json, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
URL = (ROOT / 'index.html').as_uri()
VENDOR = ROOT / 'tests' / 'vendor' / 'cubejs'
MAX = [['W','G','Y','O'],['W','B','Y','G'],['W','B','R','B'],['O','R','Y','G']]
MAX_SOLUTION = "U' R' F R U2 R2 U F' U"
VIEW = dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)

async def new_page(browser, init_script=None):
    ctx = await browser.new_context(**VIEW)
    if init_script: await ctx.add_init_script(init_script)
    page = await ctx.new_page(); errors = []
    page.on('pageerror', lambda e: errors.append(str(e)))
    await page.route('**/fonts.g*/**', lambda r: r.abort())
    await page.route('https://cdn.jsdelivr.net/npm/cubejs@1.3.2/lib/*', lambda r: r.fulfill(path=str(VENDOR / r.request.url.split('/')[-1]), content_type='application/javascript'))
    await page.goto(URL); await page.wait_for_timeout(300)
    return page, errors

async def paint(page, entry, n3=False):
    for row in entry:
        for c, col in enumerate(row):
            if n3 and c == 4: continue
            await page.tap(f'.sw[data-col="{col}"]'); await page.tap(f'button.cell[data-c="{c}"]')
        await page.tap('#next'); await page.wait_for_timeout(120)

async def moves_shown(page):
    moves = []
    for _ in range(40):
        moves.append((await page.text_content('.key')).replace('′', "'"))
        await page.tap('#did'); await page.wait_for_timeout(80)
        if await page.query_selector('#another'): break
    return moves

async def direction(page, sel):
    return await page.evaluate(f"getComputedStyle(document.querySelector('{sel}')).direction")

async def flow2(browser, code):
    page, errors = await new_page(browser)
    if code != 'en':
        await page.tap(f'.lang[data-lang="{code}"]'); await page.wait_for_timeout(200)
    assert await page.get_attribute('html', 'lang') == code
    assert await page.get_attribute('html', 'dir') == ('rtl' if code == 'he' else 'ltr')
    assert await page.get_attribute(f'.lang[data-lang="{code}"]', 'aria-pressed') == 'true'
    await page.tap('#pick2'); await page.wait_for_timeout(300)
    assert await direction(page, '.face-grid') == 'ltr', 'the grid never mirrors'
    await paint(page, MAX)
    if code == 'en': assert 'Is this your top?' in await page.text_content('h1')
    await page.tap('#yes'); await page.wait_for_timeout(100)
    await page.reload(); await page.wait_for_timeout(300)  # a reload must land on the same screen, same language
    assert await page.get_attribute('html', 'lang') == code
    if code == 'en': assert 'bottom' in await page.text_content('h1'), await page.text_content('h1')
    await page.tap('#yes'); await page.tap('#ready'); await page.wait_for_timeout(200)
    for sel in ('.key', '.stage', '.move-icon'):
        assert await direction(page, sel) == 'ltr', sel
    await page.reload(); await page.wait_for_timeout(300)
    assert await page.get_attribute('html', 'lang') == code and await page.query_selector('#did')
    got = ' '.join(await moves_shown(page))
    assert got == MAX_SOLUTION, got
    await page.tap('#restart'); await page.tap('#restart'); await page.wait_for_timeout(200)  # resets the game, keeps the language
    assert await page.get_attribute('.lang[aria-pressed="true"]', 'data-lang') == code
    assert not errors, errors
    print(f'2x2 flow ({code}): ok')
    await page.context.close()

async def blocked_storage(browser):
    page, errors = await new_page(browser, "Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });")
    await page.tap('.lang[data-lang="he"]'); await page.wait_for_timeout(200)
    assert await page.get_attribute('html', 'lang') == 'he'
    await page.tap('#pick2'); await page.wait_for_timeout(200)
    assert await page.query_selector('button.cell')
    assert not errors, errors
    print('blocked storage: ok')
    await page.context.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page, errors = await new_page(browser)
        codes = await page.eval_on_selector_all('.lang', 'els => els.map((e) => e.dataset.lang)')
        await page.context.close()
        assert 'en' in codes and 'he' in codes, f'welcome switch offers {codes}'
        for code in codes:
            await flow2(browser, code)
        await blocked_storage(browser)

        scr = json.loads((ROOT / 'tests' / 'fixtures' / 'generated' / 'scramble3.json').read_text())
        page, errors = await new_page(browser)
        await page.tap('#pick3'); await page.wait_for_timeout(300)
        await paint(page, scr['entry'], n3=True)
        await page.wait_for_selector('#ready', timeout=30000)
        await page.tap('#ready'); await page.wait_for_timeout(200)
        moves = await moves_shown(page)
        assert 'Solved!' in await page.text_content('h1')
        assert not errors, errors
        print(f'3x3 flow: ok ({len(moves)} moves shown)')
        await browser.close()

asyncio.run(main())
