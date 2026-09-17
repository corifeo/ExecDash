"""Browser smoke test for the standalone dashboard.

Requires: pip install playwright && playwright install chromium
Run from the repository root: python tests/smoke_test.py
"""
import functools
import http.server
import json
import pathlib
import sys
import threading

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def serve():
    handler = functools.partial(QuietHandler, directory=str(ROOT))
    httpd = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=httpd.serve_forever, daemon=True).start()
    return httpd


def check(label, ok):
    print(("PASS " if ok else "FAIL ") + label)
    return ok


def main():
    httpd = serve()
    url = f"http://127.0.0.1:{httpd.server_address[1]}/index.html"
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 900})
        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(url)
        page.wait_for_selector('button[data-act="loadsample"]')
        page.click('button[data-act="loadsample"]')
        page.wait_for_selector("#sec-4")

        results.append(check("four dashboard sections render", page.locator("section.band").count() == 4))
        results.append(check("category cards render", page.locator("#l3body .kcard").count() >= 8))
        results.append(check("top risks render", page.locator(".risks li").count() == 5))
        results.append(check("programme summary renders", page.locator(".pulse .prow").count() >= 3))
        results.append(check("exposure shows appetite status", page.locator("#vtile .pill").count() == 1))
        results.append(check("notable incidents render", page.locator(".irow").count() >= 1))
        results.append(check("initiatives render", page.locator(".init").count() >= 1))

        page.click('button[data-act="collapse"][data-a="2"]')
        results.append(check("section collapses", "collapsed" in (page.get_attribute("#sec-2", "class") or "")))
        page.click('button[data-act="collapse"][data-a="2"]')

        page.click('.snav button[data-act="allview"][data-a="compact"]')
        results.append(check("nav bar switches every section to compact", page.locator("#l1view.cpt, #l2view.cpt, #l4view.cpt").count() == 3 and page.locator("#l3body .cptg").count() == 1))
        page.click('.snav button[data-act="allview"][data-a="detail"]')
        results.append(check("nav bar switches every section to detailed", page.locator(".cpt").count() == 0))
        page.click('button[data-act="secview"][data-a="1"][data-d="compact"]')
        results.append(check("nav bar shows mixed views", page.locator('.snav .allview button[aria-pressed="true"]').count() == 0))
        results.append(check("programme at a glance switches to compact", page.locator("#l1view.cpt .mbar").count() >= 3))
        page.click('button[data-act="secview"][data-a="2"][data-d="compact"]')
        results.append(check("what has changed switches to compact", "cpt" in (page.get_attribute("#l2view", "class") or "")))
        page.click('#l3body button.ref.jump')
        page.wait_for_timeout(800)
        results.append(check("initiative badge jumps to initiatives", page.locator(".init.found").count() >= 1))

        page.click('button[data-act="view"][data-a="config"]')
        for sub in ["cats", "mat", "risks", "inc", "exp", "init"]:
            page.click(f'.qtabs button[data-a="{sub}"]')
        results.append(check("quarter data section tabs work", page.get_attribute('.qtabs button[aria-current="true"]', "data-a") == "init"))
        for tab in ["data", "structure", "register", "quarters", "io"]:
            page.click(f'button[data-act="tab"][data-a="{tab}"]')
            results.append(check(f"configure tab '{tab}' renders", page.locator("#cfg .csec").count() >= 1))

        with page.expect_download() as dl:
            page.click('button[data-act="export"][data-a="backup"]')
        data = json.loads(pathlib.Path(dl.value.path()).read_text())
        results.append(check("backup export is valid", data.get("format") == "cyber-dashboard" and len(data.get("quarters", {})) >= 1))

        # Editing: text, select, slider, tag list, dial, switch, then save.
        page.click('button[data-act="tab"][data-a="structure"]')
        page.fill('input[data-b="c:title"]', 'Board cyber dashboard')
        page.fill('#ta\\:c\\:impacts', 'Legal')
        page.press('#ta\\:c\\:impacts', 'Enter')
        page.select_option('select[data-b="c:style.corners"]', 'square')
        page.click('button[data-act="tab"][data-a="data"]')
        page.click('.qtabs button[data-a="cats"]')
        slider = page.locator('input[data-b="q:categories.hr.value"]')
        slider.focus()
        page.keyboard.press('ArrowRight')
        slider.dispatch_event('change')
        page.click('.qtabs button[data-a="mat"]')
        page.locator('.knob').first.focus()
        page.keyboard.press('ArrowUp')
        page.click('.qtabs button[data-a="init"]')
        page.click('button[data-act="swb"][data-a="q:initiatives.i7.include"]')
        page.click('button[data-act="save"]')
        page.wait_for_timeout(400)
        stored = json.loads(page.evaluate("localStorage.getItem('cyberdash:store')"))
        cfg = stored["dashboard/config"]
        q3 = stored["quarters/2026-Q3"]
        results.append(check("text, tag and select edits are saved", cfg["title"] == "Board cyber dashboard" and "Legal" in cfg["impacts"] and cfg["style"]["corners"] == "square"))
        results.append(check("slider, dial and switch edits are saved", q3["categories"]["hr"]["value"] != 4 and q3["maturity"]["scores"]["gv"] != 2.9 and q3["initiatives"]["i7"]["include"] is False))

        page.click('button[data-act="tab"][data-a="io"]')
        results.append(check("data health finds no problems in the sample", page.locator(".iwarn").count() == 0))
        page.click('button[data-act="resetarm"][data-a="risks"]')
        page.click('button[data-act="reset"][data-a="risks"]')
        page.wait_for_timeout(500)
        stored = json.loads(page.evaluate("localStorage.getItem('cyberdash:store')"))
        results.append(check("clearing risks keeps the structure", len(stored["dashboard/risks"]["items"]) == 0 and len(stored["dashboard/config"]["categories"]) > 0))
        results.append(check("reset needs confirmation", page.locator('button[data-act="reset"][data-a="empty"]').count() == 0))
        page.click('button[data-act="resetarm"][data-a="empty"]')
        page.click('button[data-act="reset"][data-a="empty"]')
        page.wait_for_selector('button[data-act="loadsample"]')
        stored = page.evaluate("localStorage.getItem('cyberdash:store')")
        results.append(check("reset clears stored data", stored in (None, "{}")))
        page.click('button[data-act="loadsample"]')
        page.wait_for_selector("#sec-4")
        results.append(check("sample data reloads after reset", page.locator("section.band").count() == 4))

        results.append(check("no page errors", not errors))
        for e in errors:
            print("  error:", e)
        browser.close()
    httpd.shutdown()
    sys.exit(0 if all(results) else 1)


if __name__ == "__main__":
    main()
