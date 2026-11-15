// Protocol World deck generator.  Usage: node tools/make_deck.js spec.json out.pptx
// All slide text is 20 pt or larger (owner requirement); content is paginated by an estimate of its height.
// Spec: {title, category, organism, duration, purpose, principle, materials:[{item,detail}], equipment:[str],
//  steps:[{text, time?, note?}], controls:[str], results:[str], troubleshooting:[{problem,cause,fix}],
//  safety:[str], references:[str]}   (keep each step text <= 190 chars; split long steps)
const fs = require("fs"), path = require("path");
const pptxgen = require("pptxgenjs");
const React = require("react"), RDS = require("react-dom/server"), sharp = require("sharp");
const fa = require("react-icons/fa");
const SKILL = process.env.PPTX_SKILL_DIR || "/root/.claude/skills/synced/6650539f-f5d1-4d7b-bf26-98d8e14d8eec_39683d76-6020-410c-97e7-8d083bf52e47/pptx";
let applyTheme = null; try { applyTheme = require(path.join(SKILL, "scripts/apply_theme.js")).applyTheme; } catch (e) {}

const [,, specFile, outFile] = process.argv;
const S = JSON.parse(fs.readFileSync(specFile, "utf8"));
const CR = "7A1226", CRD = "3F0A16", GD = "C9962B", GDL = "F3D98B", INK = "2B2B2B", MUT = "6B6B6B", TINT = "F7EEF0", LINE = "E6D5D9";
const HF = "Cambria", BF = "Calibri";
const THEME = { name: "Protocol World", headFontFace: HF, bodyFontFace: BF, colors: { dk1: INK, lt1: "FFFFFF", dk2: CR, lt2: TINT, accent1: CR, accent2: GD, accent3: CRD, accent4: "2E7D8C", accent5: "B5473A", accent6: "6B6B6B", hlink: CR, folHlink: MUT } };

async function icon(name, color = "#FFFFFF", size = 256) {
  const svg = RDS.renderToStaticMarkup(React.createElement(fa[name], { color, size: String(size) }));
  const buf = await sharp(Buffer.from(svg)).png().toBuffer();
  return "image/png;base64," + buf.toString("base64");
}
const clip = (t, n) => (t.length > n ? t.slice(0, n - 1).replace(/\s+\S*$/, "") + "…" : t);


const PT = 20;                       // minimum font size for ALL text
const LH = PT * 1.22 / 72;           // line height in inches
const cpl = (w, pt = PT, bold = false) => Math.max(4, Math.floor((w * 72) / (pt * (bold ? 0.47 : 0.44))));
const nlines = (t, w, pt = PT, bold = false) => { const c = cpl(w, pt, bold); return String(t || "").split("\n").reduce((a, p) => a + Math.max(1, Math.ceil((p.length * 1.04) / c)), 0); };
// split items into pages so that each page's total height stays within `budget` inches
function pages(items, heightOf, budget) {
  const out = []; let cur = [], h = 0;
  for (const it of items) { const ih = heightOf(it); if (cur.length && h + ih > budget) { out.push(cur); cur = []; h = 0; } cur.push(it); h += ih; }
  if (cur.length) out.push(cur); return out;
}
const TOP = 1.2, BUDGET = 3.95;      // content area below the title (inches)

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.theme = { headFontFace: HF, bodyFontFace: BF };
  pres.title = S.title; pres.author = "Protocol World"; pres.company = "Protocol World";
  const title = (s, t, n, tot) => {
    s.background = { color: "FFFFFF" };
    s.addText(t + (tot > 1 ? ` (${n} of ${tot})` : ""), { x: 0.5, y: 0.3, w: 9, h: 0.7, fontFace: HF, fontSize: 32, bold: true, color: CR, margin: 0, valign: "middle", isTextBox: true, objectName: "Title" });
  };
  const chip = (s, txt, x, y, w, fill, color) => {
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.5, rectRadius: 0.25, fill: { color: fill }, line: { color: fill }, objectName: "Chip" });
    s.addText(txt, { x, y, w, h: 0.5, fontFace: BF, fontSize: PT, bold: true, color, align: "center", valign: "middle", margin: 0, isTextBox: true });
  };
  const circle = async (s, ic, x, y, d, fill) => {
    s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, objectName: "Icon circle" });
    const k = d * 0.5; s.addImage({ data: await icon(ic), x: x + (d - k) / 2, y: y + (d - k) / 2, w: k, h: k, altText: ic });
  };
  const card = (s, x, y, w, h, fill = TINT) => s.addShape(pres.ShapeType.roundRect, { x, y, w, h, rectRadius: 0.12, fill: { color: fill }, line: { color: fill }, objectName: "Card" });
  const bulletSlides = async (name, ic, color, items, dark) => {
    const pg = pages(items, (t) => nlines(t, 8.3) * LH + 0.18, BUDGET);
    for (let p = 0; p < pg.length; p++) {
      const s = pres.addSlide();
      if (dark) { s.background = { color: CRD }; await circle(s, ic, 0.5, 0.3, 0.7, GD); s.addText(name + (pg.length > 1 ? ` (${p + 1} of ${pg.length})` : ""), { x: 1.4, y: 0.3, w: 8, h: 0.7, fontFace: HF, fontSize: 32, bold: true, color: "FFFFFF", valign: "middle", margin: 0, isTextBox: true, objectName: "Title" }); }
      else { title(s, name, p + 1, pg.length); }
      const runs = pg[p].map((t, j, a) => ({ text: t, options: { bullet: { indent: 24 }, breakLine: j < a.length - 1, paraSpaceAfter: 9 } }));
      s.addText(runs, { x: 0.6, y: TOP + 0.05, w: 8.8, h: BUDGET, fontFace: BF, fontSize: PT, color: dark ? "FFFFFF" : INK, valign: "top", margin: 0, isTextBox: true, objectName: name + " list" });
    }
  };

  // 1. Title
  let s = pres.addSlide(); s.background = { color: CRD };
  s.addShape(pres.ShapeType.ellipse, { x: 6.9, y: -1.4, w: 5.2, h: 5.2, fill: { color: CR }, line: { color: CR }, objectName: "Decor" });
  s.addShape(pres.ShapeType.ellipse, { x: 7.8, y: 3.0, w: 3.6, h: 3.6, fill: { color: GD, transparency: 15 }, line: { color: GD }, objectName: "Decor 2" });
  const cw = Math.max(2.2, (S.category || "").length * 0.17 + 0.5);
  chip(s, (S.category || "Protocol").toUpperCase(), 0.6, 0.55, cw, GD, CRD);
  if (S.organism) chip(s, S.organism, 0.6 + cw + 0.15, 0.55, Math.max(2.0, S.organism.length * 0.17 + 0.5), CR, "FFFFFF");
  s.addText(S.title, { x: 0.6, y: 1.35, w: 7.0, h: 2.1, fontFace: HF, fontSize: 38, bold: true, color: "FFFFFF", valign: "top", margin: 0, isTextBox: true, objectName: "Title" });
  s.addText([{ text: "Estimated time:  ", options: { color: GDL } }, { text: S.duration || "", options: { color: "FFFFFF", bold: true } }], { x: 0.6, y: 3.65, w: 7.2, h: 0.9, fontFace: BF, fontSize: PT, margin: 0, valign: "top", isTextBox: true, objectName: "Duration" });
  s.addText("Protocol World", { x: 0.6, y: 4.75, w: 5, h: 0.45, fontFace: HF, fontSize: 22, italic: true, color: GD, margin: 0, isTextBox: true, objectName: "Brand" });
  s.addNotes(S.purpose || "");

  // 2. Purpose, 3. Principle: one full-width card each
  for (const [ic, name, text, col] of [["FaBullseye", "Purpose", S.purpose, CR], ["FaFlask", "Principle", S.principle, GD]]) {
    const pg = pages((text || "").split(/(?<=[.!?\]])\s+/), (t) => nlines(t, 8.2) * LH + 0.05, 3.2);
    for (let p = 0; p < pg.length; p++) {
      s = pres.addSlide(); title(s, name, p + 1, pg.length);
      card(s, 0.5, 1.25, 9, 3.85);
      await circle(s, ic, 0.8, 1.5, 0.7, col);
      s.addText(pg[p].join(" "), { x: 0.9, y: 2.4, w: 8.2, h: 2.6, fontFace: BF, fontSize: PT, color: INK, valign: "top", margin: 0, isTextBox: true, objectName: name + " text" });
    }
  }

  // 4. At a glance
  s = pres.addSlide(); title(s, "At a glance");
  const stats = [[S.duration || "—", "Total time", CR, "FFFFFF", GDL], [String((S.steps || []).length), "Procedure steps", TINT, CR, MUT], [S.organism || "General", "Organism / system", CR, "FFFFFF", GDL]];
  stats.forEach((st, i) => {
    const x = 0.5 + i * 3.05;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.25, w: 2.9, h: 1.55, rectRadius: 0.12, fill: { color: st[2] }, line: { color: st[2] }, objectName: "Stat card" });
    const big = st[0].length <= 4;
    s.addText(st[0], { x: x + 0.1, y: 1.3, w: 2.7, h: 0.9, fontFace: HF, fontSize: big ? 40 : 20, bold: true, color: st[3], align: "center", valign: "middle", margin: 0, isTextBox: true });
    s.addText(st[1], { x: x + 0.1, y: 2.2, w: 2.7, h: 0.5, fontFace: BF, fontSize: PT, color: st[4], align: "center", valign: "middle", margin: 0, isTextBox: true });
  });
  await circle(s, "FaTools", 0.5, 3.0, 0.5, GD);
  s.addText("Equipment", { x: 1.15, y: 3.0, w: 4, h: 0.5, fontFace: HF, fontSize: 24, bold: true, color: CR, valign: "middle", margin: 0, isTextBox: true });
  const eq = (S.equipment || []).slice(0, 8), half = Math.ceil(eq.length / 2);
  [eq.slice(0, half), eq.slice(half)].forEach((col, i) => {
    if (!col.length) return;
    s.addText(col.map((t, j) => ({ text: t, options: { bullet: { indent: 20 }, breakLine: j < col.length - 1 } })), { x: 0.5 + i * 4.6, y: 3.6, w: 4.4, h: 1.7, fontFace: BF, fontSize: PT, color: INK, valign: "top", margin: 0, isTextBox: true, objectName: "Equipment list" });
  });

  // 5. Materials table, paged by estimated row height
  const mats = S.materials || [];
  const mrow = (m) => Math.max(nlines(m.item, 2.9, PT, true), nlines(m.detail, 5.6)) * LH + 0.22;
  const mpg = pages(mats, mrow, BUDGET - 0.25);
  mpg.forEach((chunk, p) => {
    const sl = pres.addSlide(); title(sl, "Materials and reagents", p + 1, mpg.length);
    const hd = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: CR }, fontSize: PT } });
    const rows = [[hd("Item"), hd("Details")]];
    chunk.forEach((m, i) => { const f = { color: i % 2 ? "FFFFFF" : TINT }; rows.push([{ text: m.item, options: { bold: true, color: CR, fontSize: PT, fill: f } }, { text: m.detail || "", options: { color: INK, fontSize: PT, fill: f } }]); });
    sl.addTable(rows, { x: 0.5, y: 1.2, w: 9, colW: [3.1, 5.9], fontFace: BF, valign: "middle", border: { type: "solid", color: LINE, pt: 0.75 }, margin: [0.05, 0.12, 0.05, 0.12], objectName: "Materials table" });
  });

  // 6. Procedure: step cards stacked, paged by height
  const ST = (S.steps || []).map((t, i) => ({ ...t, n: i + 1 }));
  const stepH = (t) => Math.max(0.95, nlines(t.text, t.time ? 6.0 : 7.7) * LH + 0.3);
  const spg = pages(ST, stepH, BUDGET);
  for (let p = 0; p < spg.length; p++) {
    s = pres.addSlide(); title(s, "Procedure", p + 1, spg.length);
    let y = TOP + 0.05;
    for (const st of spg[p]) {
      const h = stepH(st) - 0.08;
      card(s, 0.5, y, 9, h);
      s.addShape(pres.ShapeType.ellipse, { x: 0.65, y: y + (h - 0.6) / 2, w: 0.6, h: 0.6, fill: { color: CR }, line: { color: CR }, objectName: "Step number circle" });
      s.addText(String(st.n), { x: 0.65, y: y + (h - 0.6) / 2, w: 0.6, h: 0.6, fontFace: HF, fontSize: PT, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
      s.addText(st.text, { x: 1.45, y, w: st.time ? 6.0 : 7.7, h, fontFace: BF, fontSize: PT, color: INK, valign: "middle", margin: 0, isTextBox: true, objectName: "Step " + st.n });
      if (st.time) { s.addShape(pres.ShapeType.roundRect, { x: 7.6, y: y + h / 2 - 0.3, w: 1.75, h: 0.6, rectRadius: 0.3, fill: { color: GD }, line: { color: GD }, objectName: "Time chip" }); s.addText(st.time, { x: 7.6, y: y + h / 2 - 0.3, w: 1.75, h: 0.6, fontFace: BF, fontSize: PT, bold: true, color: CRD, align: "center", valign: "middle", margin: 0, isTextBox: true }); }
      y += h + 0.08;
    }
    s.addNotes(spg[p].map((q) => `${q.n}. ${q.text}${q.note ? " — " + q.note : ""}`).join("\n"));
  }

  // 7. Results, controls
  await bulletSlides("Expected results", "FaCheckCircle", CR, S.results || []);
  await bulletSlides("Controls", "FaBalanceScale", GD, S.controls || []);

  // 8. Troubleshooting table
  const tr = S.troubleshooting || [];
  const trow = (r) => Math.max(nlines(r.problem, 2.2, PT, true), nlines(r.cause, 3.0), nlines(r.fix, 3.8)) * LH + 0.22;
  const tpg = pages(tr, trow, BUDGET - 0.25);
  tpg.forEach((chunk, p) => {
    const sl = pres.addSlide(); title(sl, "Troubleshooting", p + 1, tpg.length);
    const hd = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: CR }, fontSize: PT } });
    const rows = [[hd("Problem"), hd("Cause"), hd("Fix")]];
    chunk.forEach((r, i) => { const f = { color: i % 2 ? "FFFFFF" : TINT }; rows.push([{ text: r.problem, options: { bold: true, color: CR, fontSize: PT, fill: f } }, { text: r.cause || "", options: { color: INK, fontSize: PT, fill: f } }, { text: r.fix || "", options: { color: INK, fontSize: PT, fill: f } }]); });
    sl.addTable(rows, { x: 0.5, y: 1.2, w: 9, colW: [2.3, 3.0, 3.7], fontFace: BF, valign: "middle", border: { type: "solid", color: LINE, pt: 0.75 }, margin: [0.05, 0.1, 0.05, 0.1], objectName: "Troubleshooting table" });
  });

  // 9. Safety, 10. References
  await bulletSlides("Safety and waste", "FaExclamationTriangle", GD, S.safety || [], true);
  // references: string or {citation, link}; links are clickable hyperlinks (text stays 20 pt)
  const shortLink = (u) => { const t = String(u || "").replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, ""); return t.length > 48 ? t.slice(0, 47) + "…" : t; };
  const refs = (S.references || []).map((r, i) => (typeof r === "string" ? { citation: r, link: "" } : r)).map((r, i) => ({ ...r, n: i + 1 }));
  const rpg = pages(refs, (r) => nlines(`[${r.n}] ${r.citation} ${r.link ? shortLink(r.link) : ""}`, 8.8) * LH + 0.16, BUDGET);
  rpg.forEach((chunk, p) => {
    const sl = pres.addSlide(); title(sl, "References", p + 1, rpg.length);
    const runs = [];
    chunk.forEach((r, j, a) => {
      const last = j === a.length - 1;
      runs.push({ text: `[${r.n}] ${r.citation}` + (r.link ? " " : ""), options: { breakLine: !r.link && !last, paraSpaceAfter: 9 } });
      if (r.link) runs.push({ text: shortLink(r.link), options: { hyperlink: { url: r.link, tooltip: r.link }, color: "0563C1", underline: { style: "sng" }, breakLine: !last, paraSpaceAfter: 9 } });
    });
    sl.addText(runs, { x: 0.5, y: TOP + 0.05, w: 9, h: BUDGET, fontFace: BF, fontSize: PT, color: INK, valign: "top", margin: 0, isTextBox: true, objectName: "References" });
  });

  await pres.writeFile({ fileName: outFile });
  if (applyTheme) await applyTheme(outFile, THEME);
  console.log("wrote", outFile, pres.slides.length, "slides");
})().catch((e) => { console.error(e); process.exit(1); });
