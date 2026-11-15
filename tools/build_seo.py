#!/usr/bin/env python3
"""Build crawlable static pages for Protocol World (run from the repo root).

Creates protocols/<slug>.html (full protocol text taken from the Word file, with schema.org JSON-LD),
protocols/index.html, sitemap.xml and robots.txt. Site address comes from data/site.json "site_url".
Usage: python3 tools/build_seo.py
"""
import json, os, re, html, datetime
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
os.chdir(ROOT)
site = json.load(open("data/site.json"))
BASE = site.get("site_url", "https://srshovon69-source.github.io/protocolworld").rstrip("/")
protos = json.load(open("data/protocols.json"))["protocols"]
esc = lambda s: html.escape(str(s or ""), quote=True)
slug_of = lambda p: os.path.splitext(os.path.basename(p["word_file"]))[0] if p.get("word_file") else None

def body_from_docx(path):
    d = Document(path); out = []
    for el in d.element.body.iterchildren():
        tag = el.tag.split('}')[1]
        if tag == "p":
            p = Paragraph(el, d); t = p.text.strip()
            if not t: continue
            st = (p.style.name or "").lower()
            if st.startswith("heading 1") or st == "title": continue  # page already has its own h1
            if st.startswith("heading"): out.append(f"<h2>{esc(t)}</h2>")
            elif "list" in st: out.append(f"<li>{esc(t)}</li>")
            else: out.append(f"<p>{esc(t)}</p>")
        elif tag == "tbl":
            t = Table(el, d); rows = []
            for r in t.rows:
                cells = []
                for c in r.cells: cells.append(f"<td>{esc(c.text.strip())}</td>")
                rows.append("<tr>" + "".join(cells) + "</tr>")
            out.append("<table>" + "".join(rows) + "</table>")
    s = "\n".join(out)
    s = re.sub(r"(<li>.*?</li>\n?)+", lambda m: "<ul>" + m.group(0) + "</ul>", s, flags=re.S)
    return s

CSS = "body{font:17px/1.6 Georgia,serif;max-width:860px;margin:2rem auto;padding:0 1rem;color:#222}h1,h2{color:#7A1226}a{color:#7A1226}table{border-collapse:collapse;width:100%}td{border:1px solid #ddd;padding:6px;vertical-align:top}.meta{color:#666}.dl a{display:inline-block;margin:0 .5rem .5rem 0;padding:.4rem .8rem;border:1px solid #7A1226;border-radius:6px;text-decoration:none}"
os.makedirs("protocols", exist_ok=True)
urls = [(BASE + "/", datetime.date.today().isoformat()), (BASE + "/protocols/", datetime.date.today().isoformat())]
items = []
for p in protos:
    slug = slug_of(p)
    if not slug or not os.path.exists(p["word_file"]): continue
    url = f"{BASE}/protocols/{slug}.html"
    desc = p.get("summary", "")
    srcs = [s for s in p.get("sources", []) if s.get("citation")]
    ld = {"@context": "https://schema.org", "@type": "TechArticle", "headline": p["title"], "description": desc,
          "datePublished": p.get("date", ""), "keywords": p.get("keywords", ""), "url": url,
          "totalTime": "", "publisher": {"@type": "Organization", "name": "Protocol World", "url": BASE + "/"},
          "citation": [s["citation"] for s in srcs]}
    ld = {k: v for k, v in ld.items() if v}
    refs = "".join(f"<li>{esc(s['citation'])}" + (f' <a href="{esc(s["link"])}" rel="noopener">{esc(s["link"])}</a>' if s.get("link") else "") + "</li>" for s in srcs)
    page = f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(p['title'])} – Protocol | Protocol World</title>
<meta name="description" content="{esc(desc[:280])}">
<link rel="canonical" href="{url}">
<meta property="og:type" content="article"><meta property="og:title" content="{esc(p['title'])} – Protocol World"><meta property="og:description" content="{esc(desc[:280])}"><meta property="og:url" content="{url}">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script><style>{CSS}</style></head><body>
<p><a href="../">← Protocol World</a> · <a href="./">All protocols</a></p>
<h1>{esc(p['title'])}</h1>
<p class="meta">{esc(p.get('organism',''))} · {esc(p.get('duration',''))} · {esc(p.get('date',''))}</p>
<p>{esc(desc)}</p>
<p class="dl"><a href="../{esc(p['word_file'])}">Download Word (.docx)</a><a href="../{esc(p['pptx_file'])}">Download PowerPoint (.pptx)</a></p>
{body_from_docx(p['word_file'])}
<h2>Sources</h2><ol>{refs}</ol></body></html>"""
    open(f"protocols/{slug}.html", "w", encoding="utf-8").write(page)
    urls.append((url, p.get("date") or datetime.date.today().isoformat()))
    items.append((p["title"], slug, desc))

li = "".join(f'<li><a href="{s}.html">{esc(t)}</a> – {esc(d)}</li>' for t, s, d in sorted(items))
open("protocols/index.html", "w", encoding="utf-8").write(f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>All experimental biology protocols | Protocol World</title>
<meta name="description" content="Index of all Protocol World experimental biology protocols, each with Word and PowerPoint downloads and cited sources.">
<link rel="canonical" href="{BASE}/protocols/"><style>{CSS}</style></head><body><p><a href="../">← Protocol World</a></p><h1>All protocols</h1><ul>{li}</ul></body></html>""")
open("sitemap.xml", "w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "".join(f"<url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n" for u, d in urls) + "</urlset>\n")
open("robots.txt", "w").write(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n")
print(f"built {len(items)} protocol pages; base {BASE}")
