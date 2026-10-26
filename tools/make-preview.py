"""Builds one self-contained HTML file from the site for previewing without a server.

The preview runs on a local count (no Firebase) and always shows the review panel.
Usage: python3 tools/make-preview.py [out.html]
"""
import base64
import pathlib
import sys

root = pathlib.Path(__file__).resolve().parent.parent
out = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else root / "preview.html")

html = (root / "index.html").read_text(encoding="utf-8")
paper = base64.b64encode((root / "paper.jpg").read_bytes()).decode()

html = html.replace('<script src="config.js"></script>',
                    "<script>window.KALPI_CONFIG = { goal: 60, sprout: 6, review: true };</script>")
html = html.replace("url(paper.jpg)", f"url(data:image/jpeg;base64,{paper})")
html = html.replace('<script type="module" src="live.js"></script>\n', "")

out.write_text(html, encoding="utf-8")
print(f"wrote {out} ({out.stat().st_size // 1024} KB)")
