"""Regenerate the README images in docs/screenshots from the sample data.

Requires: pip install playwright pillow && playwright install chromium
Run from the repository root after building: python scripts/screenshots.py
"""
import functools
import http.server
import io
import pathlib
import threading

from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "screenshots"


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd, f"http://127.0.0.1:{httpd.server_address[1]}/index.html"


def load(ctx, url):
    page = ctx.new_page()
    page.goto(url)
    page.click('button[data-act="loadsample"]')
    page.wait_for_selector("#sec-4")
    return page


def settle(page):
    """Scroll through the page so every section animates in, then return to the top."""
    for y in range(0, 7000, 400):
        page.evaluate(f"scrollTo(0,{y})")
        page.wait_for_timeout(90)
    page.wait_for_timeout(2600)
    page.evaluate("scrollTo(0,0)")
    page.mouse.move(1, 1)
    page.wait_for_timeout(300)


def section(page, n, name, pad=16):
    page.evaluate("document.querySelector('.snav').style.visibility='hidden'")
    box = page.locator(f"#sec-{n}").bounding_box()
    y = box["y"] + page.evaluate("scrollY") - pad
    page.screenshot(path=str(OUT / name), full_page=True, clip={"x": 0, "y": y, "width": 1280, "height": box["height"] + pad * 2})
    page.evaluate("document.querySelector('.snav').style.visibility=''")


def scroll_to_heading(page, text):
    page.evaluate(
        "t=>{const h=[...document.querySelectorAll('#cfg .csec h2')].find(x=>x.textContent.startsWith(t));"
        "h.scrollIntoView({block:'start'});scrollBy(0,-70)}",
        text,
    )
    page.wait_for_timeout(200)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    httpd, url = serve()
    with sync_playwright() as p:
        browser = p.chromium.launch()

        for scheme in ["light", "dark"]:
            ctx = browser.new_context(viewport={"width": 1280, "height": 820}, color_scheme=scheme)
            page = load(ctx, url)
            settle(page)
            page.screenshot(path=str(OUT / f"overview-{scheme}.png"))
            if scheme == "dark":
                ctx.close()
                continue

            section(page, 2, "what-has-changed.png")
            section(page, 3, "state-of-the-programme.png")
            section(page, 4, "ongoing-initiatives.png")
            page.click('.snav button[data-act="allview"][data-a="compact"]')
            page.click('button[data-act="hl"][data-a="a"]')
            page.wait_for_timeout(1500)
            section(page, 3, "compact-and-highlight.png")
            section(page, 1, "compact-overview.png")
            page.click('button[data-act="hl"][data-a=""]')
            page.click('.snav button[data-act="allview"][data-a="detail"]')

            page.evaluate("document.getElementById('sec-2').scrollIntoView({block:'start'}); scrollBy(0,-70)")
            page.wait_for_timeout(400)
            page.hover('.risks li[data-rid="r2"]')
            page.wait_for_timeout(500)
            page.screenshot(path=str(OUT / "tooltip-and-links.png"))
            page.hover(".irow")
            page.wait_for_timeout(500)
            page.screenshot(path=str(OUT / "incident-tooltip.png"))
            page.mouse.move(1, 1)

            page.evaluate("scrollTo(0,0)")
            page.click('button[data-act="collapseall"][data-a="1"]')
            page.wait_for_timeout(700)
            page.screenshot(path=str(OUT / "collapsed-sections.png"), clip={"x": 0, "y": 0, "width": 1280, "height": 560})
            page.click('button[data-act="collapseall"][data-a="0"]')

            page.click('button[data-act="view"][data-a="config"]')
            page.wait_for_timeout(300)
            page.mouse.move(1, 1)
            page.evaluate("scrollTo(0,0)")
            page.screenshot(path=str(OUT / "configure-quarter-data.png"))
            page.click('.qtabs button[data-a="mat"]')
            page.screenshot(path=str(OUT / "configure-dials.png"))
            page.click('.qtabs button[data-a="inc"]')
            page.screenshot(path=str(OUT / "configure-incidents.png"))

            page.click('button[data-act="tab"][data-a="register"]')
            page.click('.chip[data-k="en"][data-a="on"]')
            page.locator('button[data-act="editrisk"]').first.click()
            page.wait_for_timeout(400)
            page.evaluate("scrollTo(0,0)")
            page.screenshot(path=str(OUT / "configure-risk-register.png"), full_page=True, clip={"x": 0, "y": 0, "width": 1280, "height": 1300})

            page.click('button[data-act="regview"][data-a="inits"]')
            page.locator('button[data-act="editinit"]').first.click()
            page.wait_for_timeout(400)
            page.evaluate("document.querySelector('.rrow.open').scrollIntoView({block:'start'}); scrollBy(0,-90)")
            page.screenshot(path=str(OUT / "configure-initiative-value.png"))

            page.click('button[data-act="tab"][data-a="structure"]')
            page.evaluate("scrollTo(0,0)")
            page.screenshot(path=str(OUT / "configure-structure.png"))
            for heading, name in [("Exposure", "configure-exposure.png"), ("Appearance", "configure-appearance.png")]:
                scroll_to_heading(page, heading)
                page.locator("#cfg .csec", has=page.locator("h2", has_text=heading)).last.screenshot(path=str(OUT / name))

            page.click('button[data-act="tab"][data-a="io"]')
            page.set_input_files("#impfile", str(ROOT / "data" / "cyber-risk-library.json"))
            page.click('button[data-act="resetarm"][data-a="inits"]')
            page.wait_for_timeout(400)
            page.evaluate("document.querySelector('.savebar').style.visibility='hidden'")
            height = min(page.evaluate("document.documentElement.scrollHeight"), 1500)
            page.screenshot(path=str(OUT / "configure-data.png"), full_page=True, clip={"x": 0, "y": 0, "width": 1280, "height": height})
            ctx.close()

        ctx = browser.new_context(viewport={"width": 390, "height": 844}, device_scale_factor=2, is_mobile=True, has_touch=True)
        page = load(ctx, url)
        settle(page)
        page.screenshot(path=str(OUT / "mobile-overview.png"))
        page.evaluate("document.getElementById('sec-2').scrollIntoView({block:'start'}); scrollBy(0,-58)")
        page.wait_for_timeout(600)
        page.evaluate("var t=document.getElementById('tip'); if(t) t.classList.remove('show')")
        page.screenshot(path=str(OUT / "mobile-what-has-changed.png"))
        ctx.close()

        # Animated walkthrough: scroll from the overview into What has changed.
        ctx = browser.new_context(viewport={"width": 1280, "height": 820})
        page = load(ctx, url)
        page.wait_for_timeout(300)
        frames = []
        for i in range(46):
            if 8 <= i < 16:
                page.evaluate(f"scrollTo(0,{(i - 7) * 95})")
            png = page.screenshot(type="png")
            frames.append(Image.open(io.BytesIO(png)).convert("RGB").resize((800, 512), Image.LANCZOS))
            page.wait_for_timeout(70)
        palette = [f.quantize(colors=128, method=Image.Quantize.MEDIANCUT) for f in frames]
        palette[0].save(OUT / "demo.gif", save_all=True, append_images=palette[1:], duration=[900] + [110] * 44 + [2500], loop=0, optimize=True)
        ctx.close()
        browser.close()
    httpd.shutdown()
    print(f"Wrote {len(list(OUT.iterdir()))} files to {OUT.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
