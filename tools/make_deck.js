// Protocol World deck generator.  Usage: node tools/make_deck.js spec.json out.pptx
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

(async () => {
  const pres = new pptxgen();
  pres.layout = "LAYOUT_16x9"; // 10 x 5.625
  pres.theme = { headFontFace: HF, bodyFontFace: BF };
  pres.title = S.title; pres.author = "Protocol World"; pres.company = "Protocol World";
  const total = () => pres.slides.length;
  const footer = (s, dark) => {
    s.addText("Protocol World  ·  " + S.title, { x: 0.5, y: 5.22, w: 7.5, h: 0.28, fontFace: BF, fontSize: 10, color: dark ? GDL : MUT, margin: 0, isTextBox: true, objectName: "Footer" });
    s.addText(String(total()), { x: 9.0, y: 5.22, w: 0.5, h: 0.28, fontFace: BF, fontSize: 10, color: dark ? GDL : MUT, align: "right", margin: 0, isTextBox: true, objectName: "Page number" });
  };
  const title = (s, t, sub) => {
    s.background = { color: "FFFFFF" };
    s.addText(t, { x: 0.5, y: 0.3, w: 9, h: 0.65, fontFace: HF, fontSize: 32, bold: true, color: CR, margin: 0, valign: "middle", isTextBox: true, objectName: "Title" });
    if (sub) s.addText(sub, { x: 0.5, y: 0.93, w: 9, h: 0.3, fontFace: BF, fontSize: 14, color: MUT, margin: 0, isTextBox: true, objectName: "Subtitle" });
  };
  const chip = (s, txt, x, y, w, fill, color) => {
    s.addShape(pres.ShapeType.roundRect, { x, y, w, h: 0.36, rectRadius: 0.18, fill: { color: fill }, line: { color: fill }, objectName: "Chip" });
    s.addText(txt, { x, y, w, h: 0.36, fontFace: BF, fontSize: 12, bold: true, color, align: "center", valign: "middle", margin: 0, isTextBox: true });
  };
  const circle = async (s, ic, x, y, d, fill) => {
    s.addShape(pres.ShapeType.ellipse, { x, y, w: d, h: d, fill: { color: fill }, line: { color: fill }, objectName: "Icon circle" });
    const k = d * 0.5; s.addImage({ data: await icon(ic), x: x + (d - k) / 2, y: y + (d - k) / 2, w: k, h: k, altText: ic });
  };

  // ---- 1. Title (dark)
  let s = pres.addSlide(); s.background = { color: CRD };
  s.addShape(pres.ShapeType.ellipse, { x: 6.4, y: -1.2, w: 5.2, h: 5.2, fill: { color: CR }, line: { color: CR }, objectName: "Decor" });
  s.addShape(pres.ShapeType.ellipse, { x: 7.5, y: 2.7, w: 3.6, h: 3.6, fill: { color: GD, transparency: 15 }, line: { color: GD }, objectName: "Decor 2" });
  chip(s, (S.category || "Protocol").toUpperCase(), 0.6, 0.7, Math.max(1.8, (S.category || "").length * 0.13 + 0.5), GD, CRD);
  if (S.organism) chip(s, S.organism, 0.6 + Math.max(1.8, (S.category || "").length * 0.13 + 0.5) + 0.15, 0.7, Math.max(1.6, S.organism.length * 0.13 + 0.5), CR, "FFFFFF");
  s.addText(S.title, { x: 0.6, y: 1.5, w: 6.6, h: 1.9, fontFace: HF, fontSize: 38, bold: true, color: "FFFFFF", valign: "top", margin: 0, fit: "shrink", isTextBox: true, objectName: "Title" });
  s.addText([{ text: "Estimated time  ", options: { color: GDL } }, { text: S.duration || "", options: { color: "FFFFFF", bold: true } }], { x: 0.6, y: 3.7, w: 6.4, h: 0.4, fontFace: BF, fontSize: 16, margin: 0, isTextBox: true });
  s.addText("Protocol World", { x: 0.6, y: 4.8, w: 5, h: 0.4, fontFace: HF, fontSize: 18, italic: true, color: GD, margin: 0, isTextBox: true });
  s.addNotes(S.purpose || "");

  // ---- 2. Purpose + principle
  s = pres.addSlide(); title(s, "Purpose and principle");
  const cards = [["FaBullseye", "Purpose", S.purpose], ["FaFlask", "Principle", S.principle]];
  for (let i = 0; i < 2; i++) {
    const x = 0.5 + i * 4.6;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.3, w: 4.4, h: 3.7, rectRadius: 0.12, fill: { color: TINT }, line: { color: TINT }, objectName: "Card" });
    await circle(s, cards[i][0], x + 0.25, 1.5, 0.6, i ? GD : CR);
    s.addText(cards[i][1], { x: x + 1.0, y: 1.5, w: 3.2, h: 0.6, fontFace: HF, fontSize: 22, bold: true, color: CR, valign: "middle", margin: 0, isTextBox: true });
    s.addText(clip(cards[i][2] || "", 520), { x: x + 0.3, y: 2.3, w: 3.8, h: 2.55, fontFace: BF, fontSize: 14, color: INK, valign: "top", margin: 0, fit: "shrink", isTextBox: true, objectName: cards[i][1] + " text" });
  }
  footer(s);

  // ---- 3. At a glance
  const nSteps = (S.steps || []).length;
  s = pres.addSlide(); title(s, "At a glance");
  const stats = [[S.duration || "—", "Total time"], [String(nSteps), "Procedure steps"], [String((S.materials || []).length), "Key reagents & items"], [S.organism || "General", "Organism / system"]];
  stats.forEach((st, i) => {
    const x = 0.5 + i * 2.3;
    s.addShape(pres.ShapeType.roundRect, { x, y: 1.4, w: 2.1, h: 1.9, rectRadius: 0.12, fill: { color: i % 2 ? TINT : CR }, line: { color: i % 2 ? TINT : CR }, objectName: "Stat card" });
    s.addText(st[0], { x: x + 0.1, y: 1.55, w: 1.9, h: 1.0, fontFace: HF, fontSize: st[0].length > 8 ? 20 : 36, bold: true, color: i % 2 ? CR : "FFFFFF", align: "center", valign: "middle", margin: 0, fit: "shrink", isTextBox: true });
    s.addText(st[1], { x: x + 0.1, y: 2.6, w: 1.9, h: 0.5, fontFace: BF, fontSize: 14, color: i % 2 ? MUT : GDL, align: "center", valign: "top", margin: 0, isTextBox: true });
  });
  const eq = (S.equipment || []).slice(0, 8);
  await circle(s, "FaTools", 0.5, 3.65, 0.5, GD);
  s.addText("Equipment", { x: 1.15, y: 3.65, w: 3, h: 0.5, fontFace: HF, fontSize: 18, bold: true, color: CR, valign: "middle", margin: 0, isTextBox: true });
  s.addText(eq.join("  ·  "), { x: 0.5, y: 4.2, w: 9, h: 0.9, fontFace: BF, fontSize: 14, color: INK, valign: "top", margin: 0, fit: "shrink", isTextBox: true, objectName: "Equipment list" });
  footer(s);

  // ---- 4. Materials (paged, 6 rows per slide)
  const mats = S.materials || []; const PER = 8;
  for (let p = 0; p * PER < mats.length; p++) {
    s = pres.addSlide(); const pages = Math.ceil(mats.length / PER);
    title(s, "Materials and reagents" + (pages > 1 ? ` (${p + 1} of ${pages})` : ""));
    const rows = [[{ text: "Item", options: { bold: true, color: "FFFFFF", fill: { color: CR }, fontSize: 14 } }, { text: "Details / concentration", options: { bold: true, color: "FFFFFF", fill: { color: CR }, fontSize: 14 } }]];
    mats.slice(p * PER, p * PER + PER).forEach((m, i) => rows.push([{ text: clip(m.item, 70), options: { bold: true, color: CR, fontSize: 14, fill: { color: i % 2 ? "FFFFFF" : TINT } } }, { text: clip(m.detail || "", 120), options: { color: INK, fontSize: 14, fill: { color: i % 2 ? "FFFFFF" : TINT } } }]));
    s.addTable(rows, { x: 0.5, y: 1.2, w: 9, colW: [3.2, 5.8], fontFace: BF, valign: "middle", border: { type: "solid", color: LINE, pt: 0.75 }, margin: [0.06, 0.12, 0.06, 0.12], objectName: "Materials table" });
    footer(s);
  }

  // ---- 5. Procedure: 4 steps per slide as 2x2 cards
  const ST = S.steps || []; const SP = 4; const spages = Math.ceil(ST.length / SP);
  for (let p = 0; p < spages; p++) {
    s = pres.addSlide(); title(s, "Procedure" + (spages > 1 ? ` (${p + 1} of ${spages})` : ""));
    const part = ST.slice(p * SP, p * SP + SP);
    for (let i = 0; i < part.length; i++) {
      const col = i % 2, row = Math.floor(i / 2), x = 0.5 + col * 4.6, y = 1.2 + row * 1.95, num = p * SP + i + 1;
      s.addShape(pres.ShapeType.roundRect, { x, y, w: 4.4, h: 1.8, rectRadius: 0.1, fill: { color: TINT }, line: { color: TINT }, objectName: "Step card " + num });
      s.addShape(pres.ShapeType.ellipse, { x: x + 0.15, y: y + 0.15, w: 0.55, h: 0.55, fill: { color: CR }, line: { color: CR }, objectName: "Step number circle" });
      s.addText(String(num), { x: x + 0.15, y: y + 0.15, w: 0.55, h: 0.55, fontFace: HF, fontSize: 18, bold: true, color: "FFFFFF", align: "center", valign: "middle", margin: 0, isTextBox: true });
      s.addText(clip(part[i].text, 200), { x: x + 0.85, y: y + 0.12, w: 3.4, h: part[i].time ? 1.15 : 1.55, fontFace: BF, fontSize: 14, color: INK, valign: "top", margin: 0, fit: "shrink", isTextBox: true, objectName: "Step text" });
      if (part[i].time) { chip(s, part[i].time, x + 0.85, y + 1.3, Math.min(3.4, 0.9 + part[i].time.length * 0.09), GD, CRD); }
    }
    s.addNotes(part.map((q, i) => `${p * SP + i + 1}. ${q.text}${q.note ? " — " + q.note : ""}`).join("\n"));
    footer(s);
  }

  // ---- 6. Controls + expected results
  if ((S.results || []).length || (S.controls || []).length) {
    s = pres.addSlide(); title(s, "Expected results and controls");
    const blocks = [["FaCheckCircle", "Expected results", S.results || [], CR], ["FaBalanceScale", "Controls", S.controls || [], GD]];
    for (let i = 0; i < 2; i++) {
      const x = 0.5 + i * 4.6;
      s.addShape(pres.ShapeType.roundRect, { x, y: 1.2, w: 4.4, h: 3.85, rectRadius: 0.12, fill: { color: TINT }, line: { color: TINT }, objectName: "Card" });
      await circle(s, blocks[i][0], x + 0.25, 1.38, 0.55, blocks[i][3]);
      s.addText(blocks[i][1], { x: x + 0.95, y: 1.38, w: 3.2, h: 0.55, fontFace: HF, fontSize: 20, bold: true, color: CR, valign: "middle", margin: 0, isTextBox: true });
      const items = blocks[i][2].slice(0, 4).map((t, j, a) => ({ text: clip(t, 150), options: { bullet: true, breakLine: j < a.length - 1, paraSpaceAfter: 6 } }));
      s.addText(items.length ? items : [{ text: "—" }], { x: x + 0.3, y: 2.1, w: 3.85, h: 2.8, fontFace: BF, fontSize: 14, color: INK, valign: "top", margin: 0, fit: "shrink", isTextBox: true });
    }
    footer(s);
  }

  // ---- 7. Troubleshooting table (paged, 4 rows)
  const tr = S.troubleshooting || []; const TP = 5;
  for (let p = 0; p * TP < tr.length; p++) {
    s = pres.addSlide(); const pages = Math.ceil(tr.length / TP);
    title(s, "Troubleshooting" + (pages > 1 ? ` (${p + 1} of ${pages})` : ""));
    const h = (t) => ({ text: t, options: { bold: true, color: "FFFFFF", fill: { color: CR }, fontSize: 14 } });
    const rows = [[h("Problem"), h("Likely cause"), h("Fix")]];
    tr.slice(p * TP, p * TP + TP).forEach((r, i) => { const f = { color: i % 2 ? "FFFFFF" : TINT }; rows.push([{ text: clip(r.problem, 60), options: { bold: true, color: CR, fontSize: 13, fill: f } }, { text: clip(r.cause || "", 90), options: { color: INK, fontSize: 13, fill: f } }, { text: clip(r.fix || "", 110), options: { color: INK, fontSize: 13, fill: f } }]); });
    s.addTable(rows, { x: 0.5, y: 1.2, w: 9, colW: [2.2, 3.0, 3.8], fontFace: BF, valign: "middle", border: { type: "solid", color: LINE, pt: 0.75 }, margin: [0.07, 0.1, 0.07, 0.1], objectName: "Troubleshooting table" });
    footer(s);
  }

  // ---- 8. Safety (dark callout)
  if ((S.safety || []).length) {
    s = pres.addSlide(); s.background = { color: CRD };
    await circle(s, "FaExclamationTriangle", 0.5, 0.35, 0.7, GD);
    s.addText("Safety and waste", { x: 1.4, y: 0.35, w: 7, h: 0.7, fontFace: HF, fontSize: 32, bold: true, color: "FFFFFF", valign: "middle", margin: 0, isTextBox: true, objectName: "Title" });
    const items = S.safety.slice(0, 5).map((t, j, a) => ({ text: clip(t, 190), options: { bullet: true, breakLine: j < a.length - 1, paraSpaceAfter: 8 } }));
    s.addText(items, { x: 0.6, y: 1.35, w: 8.8, h: 3.6, fontFace: BF, fontSize: 16, color: "FFFFFF", valign: "top", margin: 0, fit: "shrink", isTextBox: true, objectName: "Safety list" });
    footer(s, true);
  }

  // ---- 9. References (paged)
  const refs = S.references || []; const RP = 5;
  for (let p = 0; p * RP < refs.length; p++) {
    s = pres.addSlide(); const pages = Math.ceil(refs.length / RP);
    title(s, "References" + (pages > 1 ? ` (${p + 1} of ${pages})` : ""));
    const runs = refs.slice(p * RP, p * RP + RP).map((r, j, a) => ({ text: `[${p * RP + j + 1}] ${clip(r, 420)}`, options: { breakLine: j < a.length - 1, paraSpaceAfter: 8 } }));
    s.addText(runs, { x: 0.5, y: 1.2, w: 9, h: 3.9, fontFace: BF, fontSize: 12, color: INK, valign: "top", margin: 0, fit: "shrink", isTextBox: true, objectName: "References" });
    footer(s);
  }

  await pres.writeFile({ fileName: outFile });
  if (applyTheme) await applyTheme(outFile, THEME);
  console.log("wrote", outFile, total(), "slides");
})().catch((e) => { console.error(e); process.exit(1); });
