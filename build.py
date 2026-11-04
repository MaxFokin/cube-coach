#!/usr/bin/env python3
"""Assemble index.html (the whole app, one file) from the pieces in src/.

    python3 build.py          # writes index.html
    python3 build.py --check  # exits 1 if index.html is out of date
"""
import sys, pathlib
ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
JS_ORDER = ["core2.js", "core3.js", "colorread.js", "ui.js", "camera.js", "main.js"]
CSS_ORDER = ["base.css", "extra.css"]

def build() -> str:
    tpl = (SRC / "page.template.html").read_text(encoding="utf-8")
    css = "".join((SRC / n).read_text(encoding="utf-8") for n in CSS_ORDER)
    js = "".join((SRC / n).read_text(encoding="utf-8") for n in JS_ORDER)
    assert tpl.count("{{CSS}}") == 1 and tpl.count("{{JS}}") == 1
    return tpl.replace("{{CSS}}", css).replace("{{JS}}", js)

if __name__ == "__main__":
    out = build()
    target = ROOT / "index.html"
    if "--check" in sys.argv:
        ok = target.exists() and target.read_text(encoding="utf-8") == out
        print("index.html is up to date" if ok else "index.html is OUT OF DATE: run python3 build.py")
        sys.exit(0 if ok else 1)
    target.write_text(out, encoding="utf-8")
    print(f"wrote {target} ({len(out):,} bytes)")
