"""Browser tests for the whole app: a 2x2 solve from the known photo cube in every language the
welcome switch offers, and a 3x3 solve from a random scramble. Needs the Playwright venv (README)
and node tests/e2e/fixtures.js (writes tests/fixtures/generated/scramble3.json).
The 3x3 solver is served from tests/vendor/cubejs instead of the CDN, so this runs offline."""
import asyncio, json, pathlib, re
from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parents[2]
URL = (ROOT / 'index.html').as_uri()
VENDOR = ROOT / 'tests' / 'vendor' / 'cubejs'
MAX = [['W','G','Y','O'],['W','B','Y','G'],['W','B','R','B'],['O','R','Y','G']]
MAX_SOLUTION = "U' R' F R U2 R2 U F' U"
LINKS = ['https://github.com/maxfokin/', 'https://www.linkedin.com/in/maxfokin/', 'https://github.com/MaxFokin/cube-coach']
VIEW = dict(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True)

async def new_page(browser, init_script=None, **ctx_opts):
    ctx = await browser.new_context(**VIEW, **ctx_opts)
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
        assert bool(await page.query_selector('.flat-tag')) == moves[-1].startswith('B'), f'the top-of-the-cube tag shows for back turns only: {moves[-1]}'
        assert await page.is_visible('.flat-after .flat-grid'), f'the After picture is on every turn: {moves[-1]}'
        await page.tap('#did'); await page.wait_for_timeout(80)
        if await page.query_selector('#another'): break
    return moves

async def direction(page, sel):
    return await page.evaluate(f"getComputedStyle(document.querySelector('{sel}')).direction")

RGB = {'rgb(246, 246, 241)': 'W', 'rgb(255, 212, 59)': 'Y', 'rgb(215, 38, 61)': 'R', 'rgb(255, 138, 30)': 'O', 'rgb(31, 111, 235)': 'B', 'rgb(31, 173, 92)': 'G'}
async def flat_cells(page, sel):
    return ''.join(RGB[c] for c in await page.eval_on_selector_all(f'{sel} .flat-cell', 'els => els.map((e) => getComputedStyle(e).backgroundColor)'))

async def strip_x(page):
    return await page.evaluate("new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.flat-strip')).transform).m41")

# The hold screen shows the front flat; a turn screen shows it with the arrow on the moving layer,
# the layer sliding, and a small picture of the front after the turn. The first turn of the photo
# cube is U': the top row slides to the right, and the new stickers come in from the left.
async def check_flat(page, code, hold=False):
    assert await page.is_visible('.flat .flat-grid'), 'the side is shown flat'
    assert hold or not await page.is_visible('#scene'), 'the 3D cube is away'
    assert await direction(page, '.flat') == 'ltr', 'the flat side never mirrors'
    if hold:
        # On the way in, the 3D cube turns to face the front and zooms into it, then the flat side alone remains.
        assert await page.get_attribute('#app', 'data-fly') is not None, 'the 3D cube flies into the side on the way to the hold screen'
        assert await page.is_visible('#scene'), 'the 3D cube still shows while it turns to the front and zooms in'
        await page.wait_for_timeout(4300)
        assert await page.get_attribute('#app', 'data-fly') is None and not await page.is_visible('#scene'), 'after the fly the flat side alone remains'
        assert await page.evaluate("getComputedStyle(document.querySelector('.flat')).opacity") == '1'
        assert await flat_cells(page, '.flat') == 'WGYO', 'the hold screen shows the front as it is'
        assert not await page.query_selector('.flat-arrow') and not await page.query_selector('.flat-after'), 'no arrow and no After picture before the first turn'
        return
    assert await page.query_selector('.flat-arrow svg'), 'the arrow sits on the flat side'
    label = (await page.text_content('.flat-after figcaption')).strip()
    if code == 'en': assert label == 'After', label
    elif code == 'he': assert not re.search(r'[A-Za-z]', label), label
    else: assert label != 'After', label
    assert await flat_cells(page, '.flat-after') == 'ORYO', 'the After picture is the front after the turn'
    x0 = await strip_x(page)
    assert x0 < 0, f'a slide to the right starts with the new stickers hidden on the left: {x0}'
    await page.wait_for_timeout(2000)
    assert await strip_x(page) > x0, 'the top row slides to the right'

async def flat_still(browser):
    page, errors = await new_page(browser, reduced_motion='reduce')
    await page.tap('#pick2'); await page.wait_for_timeout(200)
    await paint(page, MAX)
    await page.tap('#yes'); await page.tap('#yes'); await page.wait_for_timeout(150)
    assert await page.get_attribute('#app', 'data-fly') is None and not await page.is_visible('#scene'), 'with reduced motion the side just shows, no fly'
    await page.tap('#ready'); await page.wait_for_timeout(200)
    x0 = await strip_x(page); await page.wait_for_timeout(2600)
    assert await strip_x(page) == x0, 'with reduced motion nothing slides; the After picture tells'
    assert await page.is_visible('.flat-after .flat-grid') and await page.query_selector('.flat-arrow svg')
    assert not errors, errors
    print('flat view, reduced motion: ok')
    await page.context.close()

# A hidden helper for testing: press and hold the brand on a copying screen for 3 s and the sides
# fill with a random real cube, then the check begins. A tap or a short hold does nothing.
async def hold_brand(page, ms):
    box = await page.evaluate("(() => { const r = document.querySelector('.brand').getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()")
    await page.mouse.move(box[0], box[1]); await page.mouse.down(); await page.wait_for_timeout(ms); await page.mouse.up()
    await page.wait_for_timeout(300)

# Tapping I'm ready mid-fly cuts it short, and going back to the hold screen from a turn shows no fly.
async def fly_cut(browser):
    page, errors = await new_page(browser)
    await page.tap('#pick2'); await page.wait_for_timeout(200)
    await paint(page, MAX)
    await page.tap('#yes'); await page.tap('#yes'); await page.wait_for_timeout(600)
    assert await page.get_attribute('#app', 'data-fly') is not None
    await page.tap('#ready'); await page.wait_for_timeout(300)
    assert await page.get_attribute('#app', 'data-fly') is None and not await page.is_visible('#scene'), 'I\'m ready mid-fly lands on the turn screen with the flat side'
    assert await page.evaluate("getComputedStyle(document.querySelector('.flat')).opacity") == '1' and await page.query_selector('.flat-strip')
    await page.tap('#back'); await page.wait_for_timeout(150)
    assert await page.get_attribute('#app', 'data-fly') is None and not await page.is_visible('#scene'), 'back to the hold screen from a turn: no fly'
    assert await flat_cells(page, '.flat') == 'WGYO'
    assert not errors, errors
    print('fly into the side: ok')
    await page.context.close()

async def cheat(browser):
    page, errors = await new_page(browser)
    await hold_brand(page, 3400)
    assert await page.query_selector('#pick2'), 'holding the brand on the welcome screen does nothing'
    await page.tap('#pick2'); await page.wait_for_timeout(200)
    await hold_brand(page, 1500)
    assert await page.query_selector('button.cell') and not await page.query_selector('#yes'), 'a short hold does nothing'
    await hold_brand(page, 3400)
    assert await page.query_selector('#yes'), 'a long hold fills a random 2x2 and asks about the top'
    await page.tap('#yes'); await page.tap('#yes'); await page.tap('#ready'); await page.wait_for_timeout(200)
    moves = await moves_shown(page)
    assert moves and 'Solved!' in await page.text_content('h1'), 'the random cube is a real cube: it solves'
    await page.tap('#restart'); await page.tap('#restart'); await page.wait_for_timeout(200)
    await page.tap('#pick3'); await page.wait_for_timeout(200)
    await hold_brand(page, 3400)
    await page.wait_for_selector('#ready', timeout=30000)
    await page.tap('#ready'); await page.wait_for_timeout(200)
    moves = await moves_shown(page)
    assert moves and 'Solved!' in await page.text_content('h1'), 'the random 3x3 is a real cube: it solves'
    assert not errors, errors
    print(f'hidden random cube: ok (3x3 in {len(moves)} moves)')
    await page.context.close()

async def check_credits(page, code):
    assert await page.eval_on_selector_all('.credits a', 'els => els.map((a) => a.href)') == LINKS, 'the credits line links GitHub, LinkedIn and the repo, in that order'
    texts = await page.eval_on_selector_all('.credits a', 'els => els.map((a) => a.textContent.trim())')
    assert texts == ['@maxfokin', '@maxfokin', 'Source'], f'the credits line reads the same in every language: {texts}'
    assert await direction(page, '.credits') == 'ltr', 'the credits line never mirrors'
    font = await page.evaluate("getComputedStyle(document.querySelector('.credits')).fontFamily")
    assert font.startswith('Andika'), f'the credits line keeps its font in every language: {font}'
    bottom = await page.evaluate("document.querySelector('.credits').getBoundingClientRect().bottom")
    assert bottom <= VIEW['viewport']['height'], f'the credits line sits inside the phone screen on welcome: {bottom}'

async def flow2(browser, code):
    page, errors = await new_page(browser)
    if code != 'en':
        await page.tap(f'.lang[data-lang="{code}"]'); await page.wait_for_timeout(200)
    assert await page.get_attribute('html', 'lang') == code
    assert await page.get_attribute('html', 'dir') == ('rtl' if code == 'he' else 'ltr')
    assert await page.get_attribute(f'.lang[data-lang="{code}"]', 'aria-pressed') == 'true'
    assert await page.query_selector('.top .lang[data-lang="en"]'), 'the switch lives in the header'
    assert await page.query_selector('.top .tools .langs') and await page.query_selector('.top .tools #theme'), 'the switch and the theme toggle share the top-right group'
    assert not await page.is_visible('#restart'), 'Start over leaves the header on the welcome screen'
    await check_credits(page, code)
    assert (await page.text_content(f'.lang[data-lang="{code}"]')).strip().endswith(code.upper()), 'each segment shows its code'
    await page.tap('#pick2'); await page.wait_for_timeout(300)
    assert not await page.is_visible('.langs'), 'the switch shows on the welcome screen only'
    assert await page.is_visible('#restart') and await page.is_visible('#theme'), 'Start over and the toggle are back on the side screen'
    assert await page.is_visible('.credits'), 'the credits line is on every screen'
    assert await direction(page, '.face-grid') == 'ltr', 'the grid never mirrors'
    await paint(page, MAX)
    if code == 'en': assert 'Is this your top?' in await page.text_content('h1')
    await page.tap('#yes'); await page.wait_for_timeout(100)
    await page.reload(); await page.wait_for_timeout(300)  # a reload must land on the same screen, same language
    assert await page.get_attribute('html', 'lang') == code
    if code == 'en': assert 'bottom' in await page.text_content('h1'), await page.text_content('h1')
    await page.tap('#yes'); await page.wait_for_timeout(100)
    await check_flat(page, code, hold=True)
    await page.tap('#ready'); await page.wait_for_timeout(200)
    for sel in ('.key', '.stage', '.move-icon'):
        assert await direction(page, sel) == 'ltr', sel
    await check_flat(page, code)
    await page.reload(); await page.wait_for_timeout(300)
    assert await page.get_attribute('html', 'lang') == code and await page.query_selector('#did')
    got = ' '.join(await moves_shown(page))
    assert got == MAX_SOLUTION, got
    assert await page.is_visible('#scene'), 'the 3D cube is back on the done screen'
    await page.tap('#restart'); await page.tap('#restart'); await page.wait_for_timeout(200)  # resets the game, keeps the language
    assert await page.get_attribute('.lang[aria-pressed="true"]', 'data-lang') == code
    assert not errors, errors
    print(f'2x2 flow ({code}): ok')
    await page.context.close()

async def blocked_storage(browser):
    page, errors = await new_page(browser, "Object.defineProperty(window, 'localStorage', { get() { throw new Error('blocked'); } });")
    await page.tap('.lang[data-lang="he"]'); await page.wait_for_timeout(200)
    assert await page.get_attribute('html', 'lang') == 'he'
    await page.tap('#theme'); await page.wait_for_timeout(100)
    assert await page.get_attribute('html', 'data-theme') == 'dark', 'the toggle works without storage'
    await page.tap('#pick2'); await page.wait_for_timeout(200)
    assert await page.query_selector('button.cell')
    assert not errors, errors
    print('blocked storage: ok')
    await page.context.close()

async def locale_pick(browser):
    for locale, code in (('he-IL', 'he'), ('pl-PL', 'pl'), ('de-DE', 'en'), ('en-GB', 'en')):
        page, errors = await new_page(browser, locale=locale)
        assert await page.get_attribute('html', 'lang') == code, f'a phone in {locale} opens in {code}'
        assert await page.get_attribute(f'.lang[data-lang="{code}"]', 'aria-pressed') == 'true'
        assert await page.evaluate("localStorage.getItem('cube-coach-lang')") is None, 'a guess is not saved, so the app keeps following the phone'
        assert not errors, errors
        await page.context.close()
    page, errors = await new_page(browser, locale='he-IL')
    await page.tap('.lang[data-lang="en"]'); await page.wait_for_timeout(200)
    await page.reload(); await page.wait_for_timeout(300)
    assert await page.get_attribute('html', 'lang') == 'en', 'a tapped choice beats the phone'
    assert not errors, errors
    print('locale pick: ok')
    await page.context.close()

async def theme_toggle(browser):
    page, errors = await new_page(browser)
    assert await page.get_attribute('html', 'data-theme') is None, 'without a choice the app follows the phone'
    assert await page.get_attribute('#theme', 'aria-label') == 'Dark mode'
    await page.tap('#theme'); await page.wait_for_timeout(100)
    assert await page.get_attribute('html', 'data-theme') == 'dark'
    assert await page.get_attribute('#theme', 'aria-label') == 'Light mode'
    assert await page.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(15, 18, 24)'
    await page.reload(); await page.wait_for_timeout(300)
    assert await page.get_attribute('html', 'data-theme') == 'dark', 'a reload keeps the theme'
    await page.tap('.lang[data-lang="he"]'); await page.wait_for_timeout(200)
    assert not re.search(r'[A-Za-z]', await page.get_attribute('#theme', 'aria-label')), 'the toggle label follows the language'
    await page.tap('#theme'); await page.wait_for_timeout(100)
    assert await page.get_attribute('html', 'data-theme') == 'light'
    await page.tap('#pick2'); await page.wait_for_timeout(200)
    await page.tap('#restart'); await page.tap('#restart'); await page.wait_for_timeout(200)
    assert await page.get_attribute('html', 'data-theme') == 'light', 'Start over keeps the theme'
    assert not errors, errors
    await page.context.close()
    # A phone in dark mode: the toggle starts on dark (sun icon) and one tap gives light.
    page, errors = await new_page(browser, color_scheme='dark')
    assert await page.get_attribute('html', 'data-theme') is None
    assert await page.evaluate("document.getElementById('theme').classList.contains('dark')"), 'the icon shows the way out: a sun in the dark'
    assert await page.get_attribute('#theme', 'aria-label') == 'Light mode'
    await page.tap('#theme'); await page.wait_for_timeout(100)
    assert await page.get_attribute('html', 'data-theme') == 'light'
    assert await page.evaluate("getComputedStyle(document.body).backgroundColor") == 'rgb(237, 240, 245)'
    assert not errors, errors
    print('theme toggle: ok')
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
        await theme_toggle(browser)
        await locale_pick(browser)
        await flat_still(browser)
        await cheat(browser)
        await fly_cut(browser)

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
