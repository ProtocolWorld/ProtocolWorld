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

def body_from_docx(path, title, keep_refs=False):
    """Full protocol text from the Word file: headings, numbered steps, bullet lists, tables.
    The Word 'References' section is dropped unless keep_refs (the page prints a linked Sources list instead)."""
    d = Document(path); out = []; kind = None
    def close():
        nonlocal kind
        if kind: out.append(f"</{kind}>"); kind = None
    for el in d.element.body.iterchildren():
        tag = el.tag.split('}')[1]
        if tag == "p":
            p = Paragraph(el, d); t = p.text.strip()
            if not t: continue
            st = (p.style.name or "").lower()
            if st == "title" or t == title or t.startswith("Estimated time:"): continue
            if st.startswith("heading"):
                close()
                if not keep_refs and t.lower() == "references": break
                out.append(f"<h2>{esc(t)}</h2>" if st.startswith("heading 1") else f"<h3>{esc(t)}</h3>")
            elif "list number" in st or "list bullet" in st or "list" in st:
                want = "ol" if "number" in st else "ul"
                if kind != want: close(); out.append(f"<{want}>"); kind = want
                out.append(f"<li>{esc(t)}</li>")
            else:
                close(); out.append(f"<p>{esc(t)}</p>")
        elif tag == "tbl":
            close()
            t = Table(el, d); rows = []
            for i, r in enumerate(t.rows):
                c = "th" if i == 0 else "td"
                rows.append("<tr>" + "".join(f"<{c}>{esc(x.text.strip())}</{c}>" for x in r.cells) + "</tr>")
            out.append('<div class="tw"><table>' + "".join(rows) + "</table></div>")
    close()
    return "\n".join(out)

CSS = ("@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&family=Inter:wght@400;500;600&display=swap');"
 ":root{--crimson:#7d1428;--crimson-d:#450a16;--gold:#c9983a;--gold-d:#8a6118;--ink:#1b1416;--muted:#6b5f62;--paper:#fbf8f3;--line:#eadfce}"
 "*{box-sizing:border-box}body{margin:0;font:16.5px/1.7 Inter,system-ui,sans-serif;color:var(--ink);background:var(--paper)}"
 ".top{position:sticky;top:0;background:rgba(251,248,243,.92);backdrop-filter:blur(10px);border-bottom:1px solid var(--line);padding:12px 5vw;display:flex;gap:18px;flex-wrap:wrap;align-items:center}"
 ".top a{color:var(--crimson-d);font-weight:600;text-decoration:none}.top a:hover{color:var(--crimson)}"
 "main{max-width:860px;margin:0 auto;padding:34px 5vw 70px}"
 "h1{font:700 clamp(2rem,5vw,3rem)/1.1 'Cormorant Garamond',Georgia,serif;color:var(--crimson-d);margin:8px 0 10px}"
 "h2{font:700 1.7rem/1.2 'Cormorant Garamond',Georgia,serif;color:var(--crimson);margin:2.2rem 0 .6rem;padding-bottom:.25rem;border-bottom:2px solid var(--line)}"
 "h3{font-size:1.1rem;color:var(--crimson-d);margin:1.4rem 0 .4rem}"
 "a{color:var(--crimson)}p{margin:.6rem 0}li{margin:.45rem 0}ol,ul{padding-left:1.4rem}"
 "ol li::marker{color:var(--crimson);font-weight:700}"
 ".meta{color:var(--muted);margin:0 0 6px}.sum{font-size:1.1rem;color:#3a2f32}"
 ".tags span{display:inline-block;background:#f6ecd8;color:var(--gold-d);font-size:.74rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;padding:3px 10px;border-radius:999px;margin-right:6px}"
 ".dl{margin:18px 0 6px}.dl a,.dl button{display:inline-block;margin:0 8px 8px 0;padding:.55rem 1rem;border:1px solid var(--crimson);border-radius:10px;text-decoration:none;font:600 .92rem Inter,sans-serif;color:var(--crimson);background:#fff;cursor:pointer}"
 ".dl a:hover,.dl button:hover{background:var(--crimson);color:#fff}"
 ".tw{overflow-x:auto;margin:.8rem 0}table{border-collapse:collapse;width:100%;font-size:.95rem;background:#fff}"
 "th{background:var(--crimson);color:#fff;text-align:left}td,th{border:1px solid var(--line);padding:8px 10px;vertical-align:top}tr:nth-child(even) td{background:#faf3f4}"
 ".src li{word-break:break-word}@media print{.top,.dl{display:none}body{background:#fff}}")
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
<div class="top"><a href="../">← Protocol World</a><a href="../#library">Library</a><a href="./">All protocols</a></div>
<main><p class="tags"><span>{esc(p.get('category',''))}</span><span>{esc(p.get('organism',''))}</span></p>
<h1>{esc(p['title'])}</h1>
<p class="meta">{esc(p.get('duration',''))} · {esc(p.get('date',''))}</p>
<p class="sum">{esc(desc)}</p>
<p class="dl"><a href="../{esc(p['word_file'])}" download>⬇ Word (.docx)</a><a href="../{esc(p['pptx_file'])}" download>⬇ PowerPoint (.pptx)</a><button onclick="window.print()">Print</button></p>
{body_from_docx(p['word_file'], p['title'], keep_refs=not srcs)}
{('<h2>References</h2><ol class="src">' + refs + '</ol>') if srcs else ''}</main></body></html>"""
    open(f"protocols/{slug}.html", "w", encoding="utf-8").write(page)
    urls.append((url, p.get("date") or datetime.date.today().isoformat()))
    items.append((p["title"], slug, desc))

li = "".join(f'<li><a href="{s}.html">{esc(t)}</a> – {esc(d)}</li>' for t, s, d in sorted(items))
open("protocols/index.html", "w", encoding="utf-8").write(f"""<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>All experimental biology protocols | Protocol World</title>
<meta name="description" content="Index of all Protocol World experimental biology protocols, each with Word and PowerPoint downloads and cited sources.">
<link rel="canonical" href="{BASE}/protocols/"><style>{CSS}</style></head><body><div class="top"><a href="../">← Protocol World</a><a href="../#library">Library</a></div><main><h1>All protocols</h1><ul>{li}</ul></main></body></html>""")
open("sitemap.xml", "w").write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    "".join(f"<url><loc>{u}</loc><lastmod>{d}</lastmod></url>\n" for u, d in urls) + "</urlset>\n")
open("robots.txt", "w").write(f"User-agent: *\nAllow: /\nSitemap: {BASE}/sitemap.xml\n")
print(f"built {len(items)} protocol pages; base {BASE}")
