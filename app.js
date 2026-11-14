// Protocol World — reads data/protocols.json and renders the site.
// You never need to edit this file: add or change protocols in the CMS (see README).
const $ = (id) => document.getElementById(id);
let ALL = [], activeCat = "All", query = "";

const TYPES = [
  { name: "Molecular Biology", icon: "🧬", desc: "DNA and RNA extraction, PCR, qPCR, electrophoresis, sequencing prep." },
  { name: "Cloning & CRISPR", icon: "✂️", desc: "Plasmid construction, transformation, Gibson assembly, genome editing." },
  { name: "Protein Analysis", icon: "🧫", desc: "Western blotting, immunoprecipitation, purification, mass spectrometry prep." },
  { name: "Imaging & Microscopy", icon: "🔬", desc: "Immunofluorescence, FISH, live-cell and confocal imaging." },
  { name: "Cell Culture", icon: "🧪", desc: "Cell lines, passaging, transfection, freezing, viability assays." },
  { name: "Microbiology", icon: "🦠", desc: "Bacterial and yeast culture, growth curves, selection, staining." },
  { name: "Model Organisms", icon: "🪱", desc: "C. elegans, Drosophila, zebrafish and other genetic model systems." },
  { name: "Genomics & Sequencing", icon: "📊", desc: "Library preparation, RNA-seq, ChIP-seq, ATAC-seq, genotyping." },
  { name: "Biochemistry", icon: "⚗️", desc: "Buffers, enzyme assays, chromatography, protein–nucleic acid binding." },
  { name: "Immunology", icon: "🛡️", desc: "ELISA, flow cytometry, immune cell isolation and staining." },
];

const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmtDate = (d) => { const x = new Date(d + "T12:00:00"); return isNaN(x) ? "" : x.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }); };

function sourcesHtml(p) {
  const list = Array.isArray(p.sources) ? p.sources.filter((x) => x && x.citation) : [];
  if (!list.length) return "";
  const items = list.map((x) => {
    const text = esc(x.citation);
    return `<li>${x.link ? `<a href="${esc(x.link)}" target="_blank" rel="noopener">${text}</a>` : text}</li>`;
  }).join("");
  return `<details class="src"><summary>Sources (${list.length})</summary><ol>${items}</ol></details>`;
}

function card(p) {
  const word = p.word_file ? `<a class="word" href="${esc(p.word_file)}" download>⬇ Word</a>` : `<span class="soon">Word · soon</span>`;
  const ppt = p.pptx_file ? `<a class="ppt" href="${esc(p.pptx_file)}" download>⬇ PowerPoint</a>` : `<span class="soon">PPTX · soon</span>`;
  return `<article class="card">
    <span class="tag">${esc(p.category || "Protocol")}</span>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.summary)}</p>
    <div class="meta">${esc(fmtDate(p.date))}${p.duration ? " · " + esc(p.duration) : ""}</div>
    <div class="dl">${word}${ppt}</div>
    ${sourcesHtml(p)}
    <button class="cmt" data-t="${esc(p.title)}">💬 Comments &amp; suggestions</button>
  </article>`;
}

// Comments: Giscus (free, GitHub Discussions). One thread per protocol title.
let SITE = {};
function openComments(title) {
  $("mTitle").textContent = title;
  const body = $("mBody");
  body.innerHTML = "";
  if (!SITE.giscus_repo || !SITE.giscus_repo_id || !SITE.giscus_category_id) {
    body.innerHTML = "<p class='empty'>Comments are being set up and will be available soon.</p>";
  } else {
    const s = document.createElement("script");
    s.src = "https://giscus.app/client.js";
    s.async = true; s.crossOrigin = "anonymous";
    Object.entries({
      repo: SITE.giscus_repo, "repo-id": SITE.giscus_repo_id,
      category: SITE.giscus_category, "category-id": SITE.giscus_category_id,
      mapping: "specific", term: title, strict: "0", "reactions-enabled": "1",
      "input-position": "top", theme: "light", lang: "en",
    }).forEach(([k, v]) => s.setAttribute("data-" + k, v));
    body.appendChild(s);
  }
  $("modal").hidden = false;
  document.body.style.overflow = "hidden";
}
function closeComments() { $("modal").hidden = true; $("mBody").innerHTML = ""; document.body.style.overflow = ""; }
document.addEventListener("click", (e) => {
  const b = e.target.closest(".cmt"); if (b) openComments(b.dataset.t);
  if (e.target.id === "modal" || e.target.id === "mClose") closeComments();
});
document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeComments(); });
fetch("data/site.json", { cache: "no-cache" }).then((r) => r.json()).then((d) => (SITE = d)).catch(() => {});

function render() {
  const sorted = [...ALL].sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  const latest = sorted[0]?.date;
  const today = sorted.filter((p) => p.date === latest).slice(0, 5);
  $("todayGrid").innerHTML = today.map(card).join("");
  $("todayDate").textContent = latest ? fmtDate(latest) : "";

  const q = query.trim().toLowerCase();
  const list = sorted.filter((p) =>
    (activeCat === "All" || p.category === activeCat) &&
    (!q || [p.title, p.summary, p.category, p.keywords].join(" ").toLowerCase().includes(q)));
  $("libGrid").innerHTML = list.map(card).join("");
  $("empty").hidden = list.length > 0;

  const used = ALL.map((p) => p.category).filter(Boolean);
  const cats = ["All", ...TYPES.map((t) => t.name).filter((n) => used.includes(n)), ...new Set(used.filter((c) => !TYPES.some((t) => t.name === c)))];
  const counts = {}; ALL.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
  $("typesGrid").innerHTML = TYPES.map((t) => {
    const n = counts[t.name] || 0;
    return `<button class="type ${n ? "" : "empty-type"}" data-c="${esc(t.name)}">
      <span class="ico">${t.icon}</span>
      <h3>${esc(t.name)}</h3>
      <p>${esc(t.desc)}</p>
      <span class="count">${n ? n + (n === 1 ? " protocol" : " protocols") : "Coming soon"}</span>
    </button>`;
  }).join("");
  $("chips").innerHTML = cats.map((c) => `<button class="chip ${c === activeCat ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");

  const days = new Set(ALL.map((p) => p.date)).size;
  $("stats").innerHTML = `<div><strong>${ALL.length}</strong><span>Protocols</span></div>
    <div><strong>${TYPES.length}</strong><span>Fields</span></div>
    <div><strong>${days}</strong><span>Days live</span></div>`;
}

$("typesGrid").addEventListener("click", (e) => {
  const b = e.target.closest(".type"); if (!b) return;
  activeCat = b.dataset.c; query = ""; $("search").value = ""; render();
  $("library").scrollIntoView({ behavior: "smooth" });
});
$("chips").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { activeCat = b.dataset.c; render(); } });
$("search").addEventListener("input", (e) => { query = e.target.value; render(); });
$("year").textContent = new Date().getFullYear();

fetch("data/protocols.json", { cache: "no-cache" })
  .then((r) => r.json())
  .then((d) => { ALL = d.protocols || []; render(); })
  .catch(() => { $("todayGrid").innerHTML = "<p class='empty'>Could not load protocols.</p>"; });
