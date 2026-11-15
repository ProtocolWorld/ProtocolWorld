# Post-process a Protocol World .docx: remove the 'Category:' info, use proper symbols (°C, ×, µ, −, –, superscripts), US spelling, and add the 'ProtocolWorld' watermark.
# Usage: python3 tools/fix_docx.py uploads/<slug>.docx   (idempotent; requires python-docx)
import docx, re, sys, glob, copy
from docx.oxml import parse_xml
SUP=str.maketrans("0123456789-","⁰¹²³⁴⁵⁶⁷⁸⁹⁻")
US={"minimising":"minimizing","maximise":"maximize","solubilise":"solubilize","optimise":"optimize","Optimise":"Optimize","sterilises":"sterilizes","self-normalises":"self-normalizes","normalises":"normalizes","centred":"centered","recognised":"recognized","colour":"color","homogenise":"homogenize","behaviour":"behavior","organised":"organized","analyse":"analyze","litre":"liter"}
EXTRA=[('100x stock','100× stock'),('e.g. ','e.g., ')]
def fix(t):
    if not t.strip(): return t
    toks=re.split(r'(\s+)',t); out=[]
    for k in toks:
        if re.search(r'https?://|doi:|www\.|\.org|\.com',k): out.append(k); continue
        k=re.sub(r'10\^(-?\d+)',lambda m:'10'+m.group(1).translate(SUP),k)
        k=re.sub(r'(?<=\d)-(?=\d)','–',k)
        k=re.sub(r'(?<![\w.])-(?=\d)','−',k)
        out.append(k)
    t=''.join(out)
    t=re.sub(r'(?<=[\d)]) C(?![A-Za-z0-9])',' °C',t)
    t=re.sub(r'(?<=\d)C\b',' °C',t) if False else t
    t=re.sub(r'(\d) x (\d|10|g\b)',r'\1 × \2',t)
    t=re.sub(r'(?<=\d) x g\b',' × g',t)
    t=re.sub(r'(?<![A-Za-z])u(g|L|l|M)(?![a-z])',lambda m:'µ'+m.group(1).replace('l','L'),t)
    t=re.sub(r'(?<![A-Za-z])(\d+(?:\.\d+)?) ?([mnk]?)g/uL',r'\1 \2g/µL',t)
    t=t.replace('CO2','CO₂').replace(' -> ',' → ')
    for a,b in US.items(): t=t.replace(a,b)
    for a,b in EXTRA: t=t.replace(a,b)
    return t
def fix_par(p):
    changed=False
    for r in p.runs:
        n=fix(r.text)
        if n!=r.text: r.text=n; changed=True
    return changed
WM='''<w:r xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w10="urn:schemas-microsoft-com:office:word"><w:rPr><w:noProof/></w:rPr><w:pict><v:shapetype id="_x0000_t136" coordsize="21600,21600" o:spt="136" adj="10800" path="m@7,l@8,m@5,21600l@6,21600e"><v:formulas><v:f eqn="sum #0 0 10800"/><v:f eqn="prod #0 2 1"/><v:f eqn="sum 21600 0 @1"/><v:f eqn="sum 0 0 @2"/><v:f eqn="sum 21600 0 @3"/><v:f eqn="if @0 @3 0"/><v:f eqn="if @0 21600 @1"/><v:f eqn="if @0 0 @2"/><v:f eqn="if @0 @4 21600"/><v:f eqn="mid @5 @6"/><v:f eqn="mid @8 @5"/><v:f eqn="mid @7 @8"/><v:f eqn="mid @6 @7"/><v:f eqn="sum @6 0 @5"/></v:formulas><v:path textpathok="t" o:connecttype="custom" o:connectlocs="@9,0;@10,10800;@11,21600;@12,10800" o:connectangles="270,180,90,0"/><v:textpath on="t" fitshape="t"/><v:handles><v:h position="#0,bottomRight" xrange="6629,14971"/></v:handles><o:lock v:ext="edit" text="t" shapetype="t"/></v:shapetype><v:shape id="PowerPlusWaterMarkObject1" o:spid="_x0000_s2049" type="#_x0000_t136" style="position:absolute;margin-left:0;margin-top:0;width:468pt;height:78pt;rotation:315;z-index:-251658752;mso-position-horizontal:center;mso-position-horizontal-relative:margin;mso-position-vertical:center;mso-position-vertical-relative:margin" o:allowincell="f" fillcolor="#c9a0a8" stroked="f"><v:fill opacity=".3"/><v:textpath style="font-family:&quot;Cambria&quot;;font-size:1pt" string="ProtocolWorld"/><w10:wrap anchorx="margin" anchory="margin"/></v:shape></w:pict></w:r>'''
def process(f):
    d=docx.Document(f)
    # remove Category from the info line
    for p in d.paragraphs[:3]:
        if p.text.startswith('Category:'):
            for r in p.runs: r.text=re.sub(r'Category:[^|]*\|\s*','',r.text)
            if p.text.startswith('Category:'):  # split across runs
                t=re.sub(r'Category:[^|]*\|\s*','',p.text); 
                for r in p.runs[1:]: r.text=''
                p.runs[0].text=t
            p.runs[0].text=re.sub(r'^\s*\|?\s*','',p.runs[0].text)
    for p in d.paragraphs: fix_par(p)
    for t in d.tables:
        for row in t.rows:
            for c in row.cells:
                for p in c.paragraphs: fix_par(p)
    sec=d.sections[0]
    for part in (sec.footer,):
        for p in part.paragraphs: fix_par(p)
    h=sec.header; h.is_linked_to_previous=False
    p=h.paragraphs[0] if h.paragraphs else h.add_paragraph()
    for old in p._p.xpath('.//w:pict'): old.getparent().getparent().remove(old.getparent())
    p._p.append(parse_xml(WM))
    d.save(f)
if __name__=='__main__':
    for f in sys.argv[1:]: process(f)
