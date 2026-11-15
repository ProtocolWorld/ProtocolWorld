# Build a Protocol World .docx from the same spec JSON used by make_deck.js.
# Usage: python3 tools/make_docx.py spec.json out.docx   (then run tools/fix_docx.py on out.docx)
import json, sys, re
import docx
from docx.shared import Pt, RGBColor, Inches
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.shared import OxmlElement, qn
from docx.oxml import parse_xml
from docx.opc.constants import RELATIONSHIP_TYPE as RT
CR = RGBColor(0x7A, 0x12, 0x26)
S = json.load(open(sys.argv[1], encoding='utf8'))
d = docx.Document()
sec = d.sections[0]
sec.left_margin = sec.right_margin = Inches(1); sec.top_margin = sec.bottom_margin = Inches(0.9)
st = d.styles['Normal']; st.font.name = 'Calibri'; st.font.size = Pt(11)
st.element.rPr.rFonts.set(qn('w:eastAsia'), 'Calibri')
for n, sz in (('Heading 1', 15), ('Heading 2', 13)):
    h = d.styles[n]; h.font.name = 'Cambria'; h.font.size = Pt(sz); h.font.bold = True; h.font.color.rgb = CR
    h.element.rPr.rFonts.set(qn('w:ascii'), 'Cambria'); h.element.rPr.rFonts.set(qn('w:hAnsi'), 'Cambria')
def shade(cell, hexcolor):
    tcPr = cell._tc.get_or_add_tcPr(); sh = OxmlElement('w:shd')
    sh.set(qn('w:val'), 'clear'); sh.set(qn('w:color'), 'auto'); sh.set(qn('w:fill'), hexcolor); tcPr.append(sh)
def add_link(p, url, text):
    rid = p.part.relate_to(url, RT.HYPERLINK, is_external=True)
    h = OxmlElement('w:hyperlink'); h.set(qn('r:id'), rid)
    r = OxmlElement('w:r'); rpr = OxmlElement('w:rPr')
    c = OxmlElement('w:color'); c.set(qn('w:val'), '0563C1'); rpr.append(c)
    u = OxmlElement('w:u'); u.set(qn('w:val'), 'single'); rpr.append(u)
    r.append(rpr); t = OxmlElement('w:t'); t.text = text; r.append(t); h.append(r); p._p.append(h)
def table(headers, rows, widths):
    t = d.add_table(rows=1, cols=len(headers)); t.style = 'Table Grid'
    for i, h in enumerate(headers):
        c = t.rows[0].cells[i]; c.text = ''; r = c.paragraphs[0].add_run(h); r.bold = True; r.font.color.rgb = RGBColor(255, 255, 255); shade(c, '7A1226')
    for k, row in enumerate(rows):
        cells = t.add_row().cells
        for i, v in enumerate(row):
            cells[i].text = ''; r = cells[i].paragraphs[0].add_run(v)
            if i == 0: r.bold = True
            if k % 2 == 0: shade(cells[i], 'F7EEF0')
    for row in t.rows:
        for i, w in enumerate(widths): row.cells[i].width = Inches(w)
    d.add_paragraph()
def bullets(items):
    for x in items: d.add_paragraph(x, style='List Bullet')
t = d.add_paragraph(); t.alignment = WD_ALIGN_PARAGRAPH.LEFT
r = t.add_run(S['title']); r.font.name = 'Cambria'; r.font.size = Pt(24); r.bold = True; r.font.color.rgb = CR
p = d.add_paragraph(); r = p.add_run(f"Estimated time: {S['duration']} | Protocol World"); r.italic = True; r.font.color.rgb = RGBColor(0x6B, 0x6B, 0x6B)
d.add_heading('Purpose', 1); d.add_paragraph(S['purpose'])
d.add_heading('Principle', 1); d.add_paragraph(S['principle'])
d.add_heading('Materials and reagents', 1); table(['Item', 'Details'], [[m['item'], m['detail']] for m in S['materials']], [2.2, 4.3])
d.add_heading('Equipment', 1); bullets(S['equipment'])
d.add_heading('Procedure', 1)
for i, s in enumerate(S['steps'], 1):
    p = d.add_paragraph(style='List Number'); p.add_run(s['text'])
    if s.get('time'): rr = p.add_run(f"  ({s['time']})"); rr.italic = True; rr.font.color.rgb = RGBColor(0x6B, 0x6B, 0x6B)
d.add_heading('Pause points', 1)
bullets(S.get('pause') or [s['text'].split('.')[0] + ' (' + s['time'] + ').' for s in S['steps'] if re.search(r'overnight|day|-day', s.get('time', ''), re.I)] or ['The protocol can be paused after sterilization and labeling; store solutions as described.'])
d.add_heading('Expected results', 1); bullets(S['results'])
d.add_heading('Controls', 1); bullets(S['controls'])
d.add_heading('Troubleshooting', 1); table(['Problem', 'Likely cause', 'Solution'], [[x['problem'], x['cause'], x['fix']] for x in S['troubleshooting']], [1.8, 2.2, 2.5])
d.add_heading('Safety and waste', 1); bullets(S['safety'])
d.add_heading('References', 1)
for i, r in enumerate(S['references'], 1):
    p = d.add_paragraph(); p.add_run(f"[{i}] {r['citation']} ")
    if r.get('link'): add_link(p, r['link'], r['link'])
    else: p.add_run('(no stable link available)')
fp = sec.footer.paragraphs[0]; fp.text = 'Protocol World'; fp.alignment = WD_ALIGN_PARAGRAPH.CENTER
d.save(sys.argv[2])
