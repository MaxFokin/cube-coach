"""Takes the README's phone screenshots (docs/screenshots/*.png): 390x844 at 2x, with the web fonts,
so it needs the internet. Welcome, copying a 3x3 side, and the first turn of the 2x2 in the dark.
    source .venv/bin/activate && python3 tests/e2e/screenshots.py"""
import asyncio, pathlib, sys
from playwright.async_api import async_playwright
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from screens import MAX, SCR3, VENDOR, URL, paint

OUT = pathlib.Path(__file__).resolve().parents[2] / 'docs' / 'screenshots'

async def main():
    OUT.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 390, 'height': 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = await ctx.new_page()
        await page.route('https://cdn.jsdelivr.net/npm/cubejs@1.3.2/lib/*', lambda r: r.fulfill(path=str(VENDOR / r.request.url.split('/')[-1]), content_type='application/javascript'))
        await page.goto(URL); await page.evaluate('document.fonts.ready'); await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUT / 'welcome.png'))
        await page.tap('#pick3'); await page.wait_for_timeout(400)
        for c, col in enumerate(SCR3[0]):
            if c == 4: continue
            await page.tap(f'.sw[data-col="{col}"]'); await page.tap(f'button.cell[data-c="{c}"]')
        await page.tap('#next'); await page.wait_for_timeout(1200)
        for c, col in list(enumerate(SCR3[1]))[:3]:
            await page.tap(f'.sw[data-col="{col}"]'); await page.tap(f'button.cell[data-c="{c}"]')
        await page.wait_for_timeout(300)
        await page.screenshot(path=str(OUT / 'side.png'))
        await page.tap('#restart'); await page.tap('#restart'); await page.wait_for_timeout(300)
        await page.tap('#theme'); await page.tap('#pick2'); await page.wait_for_timeout(300)
        await paint(page, MAX)
        await page.tap('#yes'); await page.tap('#yes'); await page.tap('#ready'); await page.wait_for_timeout(500)
        await page.screenshot(path=str(OUT / 'move.png'))
        await browser.close()
    for f in sorted(OUT.glob('*.png')): print(f.relative_to(OUT.parents[1]), f.stat().st_size // 1024, 'KB')

asyncio.run(main())
