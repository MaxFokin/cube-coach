"""Browser tests for the whole app: a 2x2 solve from the known photo cube, and a 3x3 solve from a
random scramble. Needs: pip install playwright && playwright install chromium, and
node tests/e2e/fixtures.js (writes tests/fixtures/generated/scramble3.json).
The 3x3 solver is served from tests/vendor/cubejs instead of the CDN, so this runs offline."""
import asyncio, json, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
URL = (ROOT / 'index.html').as_uri()
VENDOR = ROOT / 'tests' / 'vendor' / 'cubejs'
MAX = [['W','G','Y','O'],['W','B','Y','G'],['W','B','R','B'],['O','R','Y','G']]
MAX_SOLUTION = "U' R' F R U2 R2 U F' U"

async def new_page(browser):
    ctx = await browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
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

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page, errors = await new_page(browser)
        await page.tap('#pick2'); await page.wait_for_timeout(300)
        await paint(page, MAX)
        assert 'Is this your top?' in await page.text_content('h1')
        await page.tap('#yes'); await page.wait_for_timeout(100)
        await page.reload(); await page.wait_for_timeout(300)  # a reload must land on the same screen
        assert 'bottom' in await page.text_content('h1'), await page.text_content('h1')
        await page.tap('#yes'); await page.tap('#ready'); await page.wait_for_timeout(200)
        got = ' '.join(await moves_shown(page))
        assert got == MAX_SOLUTION, got
        assert not errors, errors
        print('2x2 flow: ok')

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
