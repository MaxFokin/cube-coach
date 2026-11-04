"""Browser tests for copying a side from the camera: the photo fallback (real photos when present,
otherwise the synthetic side) and a fake live camera. Needs the fixtures from node tests/e2e/fixtures.js."""
import asyncio, pathlib
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
URL = (ROOT / 'index.html').as_uri()
GEN = ROOT / 'tests' / 'fixtures' / 'generated'
PHOTOS = ROOT / 'tests' / 'fixtures' / 'photos'
TRUTH = {1: 'WGYO', 2: 'WBYG', 3: 'WBRB', 4: 'ORYG'}
NAME = {'white': 'W', 'yellow': 'Y', 'red': 'R', 'orange': 'O', 'blue': 'B', 'green': 'G'}

async def grid(page):
    labels = await page.eval_on_selector_all('.face-grid button.cell', 'els => els.map(e => e.getAttribute("aria-label").split(": ")[1])')
    return ''.join(NAME.get(l, '?') for l in labels)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)
        page = await ctx.new_page(); errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        await page.route('**/fonts.g*/**', lambda r: r.abort())
        await page.goto(URL); await page.wait_for_timeout(300)
        photos = sorted(PHOTOS.glob('side*.jpg'))
        if photos:
            await page.tap('#pick2'); await page.wait_for_timeout(400)
            right = 0
            for i, ph in enumerate(photos, start=1):
                await page.tap('#camera'); await page.wait_for_timeout(500)
                async with page.expect_file_chooser() as fc:
                    await page.tap('.picks .pick >> nth=0')
                await (await fc.value).set_files(str(ph)); await page.wait_for_timeout(700)
                await page.tap('#cam-use'); await page.wait_for_timeout(200)
                got = await grid(page)
                right += sum(a == b for a, b in zip(got, TRUTH[i]))
                await page.tap('#next'); await page.wait_for_timeout(150)
            assert right >= 15, f'photos read {right}/16'
            print(f'photo path (real photos): ok, {right}/16 squares')
            await page.tap('#restart'); await page.tap('#restart'); await page.wait_for_timeout(200)
        face3 = GEN / 'face3.jpg'
        if face3.exists():
            await page.tap('#pick3'); await page.wait_for_timeout(400)
            await page.tap('#camera'); await page.wait_for_timeout(500)
            await page.set_input_files('.picks .pick-input >> nth=0', str(face3)); await page.wait_for_timeout(700)
            await page.tap('#cam-use'); await page.wait_for_timeout(200)
            assert await grid(page) == 'WRGBYOWR', await grid(page)
            print('photo path (synthetic 3x3 side): ok')
        assert not errors, errors
        await browser.close()
        clip = GEN / 'fake-camera.mjpeg'
        if clip.exists():
            browser = await p.chromium.launch(args=['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream', f'--use-file-for-fake-video-capture={clip}'])
            ctx = await browser.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, permissions=['camera'])
            page = await ctx.new_page()
            await page.route('**/fonts.g*/**', lambda r: r.abort())
            await page.goto(URL); await page.wait_for_timeout(300)
            await page.tap('#pick2'); await page.wait_for_timeout(400)
            await page.tap('#camera'); await page.wait_for_timeout(2500)
            assert await page.is_enabled('#cam-use')
            await page.tap('#cam-use'); await page.wait_for_timeout(200)
            assert await grid(page) == 'WGYO', await grid(page)
            print('live camera (fake device): ok')
            await browser.close()

asyncio.run(main())
