// Protocol World — reads data/protocols.json and renders the site.
// You never need to edit this file: add or change protocols in the CMS (see README).
const $ = (id) => document.getElementById(id);
let ALL = [], ORG = {}, activeCat = "All", activeOrg = "All", query = "", shown = 24;
const orgOf = (p) => p.organism || ORG[p.title] || "General Lab Methods";

const ORGS = [
  { name: "Mammalian Cells", icon: "🧫", desc: "HEK293, HeLa, CHO, primary and stem cells." },
  { name: "Mouse", icon: "🐭", desc: "Tissues, embryos, behavior and primary mouse cells." },
  { name: "Plant", icon: "🌱", desc: "Arabidopsis, maize, rice, tobacco and plant cells." },
  { name: "Drosophila", icon: "🪰", desc: "Fly genetics, dissections, imaging and behavior." },
  { name: "C. elegans", icon: "🪱", desc: "Worm maintenance, RNAi, germline, CRISPR and imaging." },
  { name: "Yeast", icon: "🍞", desc: "Budding and fission yeast genetics and biochemistry." },
  { name: "E. coli & Bacteria", icon: "🦠", desc: "Cloning hosts, growth, protein expression, microbiology." },
  { name: "Zebrafish", icon: "🐟", desc: "Husbandry, injection, imaging and regeneration." },
  { name: "Other Organisms", icon: "🐸", desc: "Xenopus, planaria, Dictyostelium, parasites and more." },
  { name: "General Lab Methods", icon: "🧰", desc: "Techniques that work across many organisms." },
];

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

// Photos: Unsplash (photographer credited in footer + on slideshow)
const P = (id, w = 1280, h = 940) => `https://images.unsplash.com/photo-${id}?ixlib=rb-4.1.0&q=80&fm=jpg&crop=entropy&cs=srgb&w=${w}&h=${h}&fit=crop`;
const U = (u) => `https://unsplash.com/${u}?utm_source=protocol_world&utm_medium=referral`;
const S = [
  ["Molecular Biology", "DNA · RNA · PCR · qPCR · electrophoresis", "molecular-biology", "1614935151651-0bea6508db6b", "Julia Koblitz", "@jkoblitz"],
  ["Cloning & CRISPR", "plasmids · Gibson · transformation · genome editing", "cloning-crispr", "1637929476734-bd7f5f78e40a", "Warren Umoh", "@warrenumoh"],
  ["Protein Analysis", "Western blot · IP · purification · mass spec prep", "protein-analysis", "1532187863486-abf9dbad1b69", "Louis Reed", "@_louisreed"],
  ["Imaging & Microscopy", "immunofluorescence · FISH · live imaging · confocal", "imaging-microscopy", "1631556097152-c39479bbff93", "National Cancer Institute", "@nci"],
  ["Cell Culture", "cell lines · passaging · transfection · freezing", "cell-culture", "1595154038281-4beb9195415b", "Girl with red hat", "@girlwithredhat"],
  ["Microbiology", "bacteria · yeast · growth curves · selection", "microbiology", "1711626759619-9109ef622046", "masakazu sasaki", "@masakz"],
  ["Model Organisms", "C. elegans · Drosophila · zebrafish · mouse", "model-organisms", "1623137548283-825d61083525", "Matthew Mejia", "@___ginza___"],
  ["Genomics & Sequencing", "library prep · RNA-seq · ChIP-seq · genotyping", "genomics-sequencing", "1578496479530-799fd6d0803a", "National Cancer Institute", "@nci"],
  ["Biochemistry", "buffers · enzyme assays · chromatography · binding", "biochemistry", "1631557673853-b5c9c45527ef", "National Cancer Institute", "@nci"],
  ["Immunology", "ELISA · flow cytometry · immune cell staining", "immunology", "1624957485490-87d607854977", "CDC", "@cdc"],
];

// One representative photo per protocol type (same photos as the hero slideshow).
const PHOTO = Object.fromEntries(S.map((s) => [s[0], { id: s[3], by: s[4], url: U(s[5]) }]));
const photoUrl = (cat, w, h) => (PHOTO[cat] ? P(PHOTO[cat].id, w, h) : "");

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
  const ph = photoUrl(p.category, 700, 360);
  const pic = ph ? `<div class="pic"><img src="${ph}" alt="${esc(p.category)}" loading="lazy" onerror="this.parentNode.remove()"></div>` : "";
  return `<article class="card${ph ? " has-pic" : ""}">
    ${pic}<div class="tags"><span class="tag">${esc(p.category || "Protocol")}</span><span class="tag org">${esc(orgOf(p))}</span></div>
    <h3>${esc(p.title)}</h3>
    <p>${esc(p.summary)}</p>
    <div class="meta">${esc(fmtDate(p.date))}${p.duration ? " · " + esc(p.duration) : ""}${p.updated ? ` · <span class="upd" title="${esc(p.revision_note || "")}">Updated ${esc(fmtDate(p.updated))}</span>` : ""}</div>
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
  const dailies = sorted.filter((p) => p.daily);
  const latest = (dailies[0] || sorted[0])?.date;
  const today = (dailies.length ? dailies : sorted).filter((p) => p.date === latest).slice(0, 5);
  $("todayGrid").innerHTML = today.map(card).join("");
  $("todayDate").textContent = latest ? "Added " + fmtDate(latest) : "";
  renderNews(sorted, latest);
  showToast(today, latest);

  const q = query.trim().toLowerCase();
  const list = sorted.filter((p) =>
    (activeCat === "All" || p.category === activeCat) &&
    (activeOrg === "All" || orgOf(p) === activeOrg) &&
    (!q || [p.title, p.summary, p.category, orgOf(p), p.keywords].join(" ").toLowerCase().includes(q)));
  $("libGrid").innerHTML = list.slice(0, shown).map(card).join("");
  $("empty").hidden = list.length > 0;
  $("more").hidden = list.length <= shown;
  $("more").textContent = `Load more (${list.length - shown} remaining)`;

  const used = ALL.map((p) => p.category).filter(Boolean);
  const cats = ["All", ...TYPES.map((t) => t.name).filter((n) => used.includes(n)), ...new Set(used.filter((c) => !TYPES.some((t) => t.name === c)))];
  const counts = {}; ALL.forEach((p) => { counts[p.category] = (counts[p.category] || 0) + 1; });
  const ocounts = {}; ALL.forEach((p) => { const o = orgOf(p); ocounts[o] = (ocounts[o] || 0) + 1; });
  $("orgsGrid").innerHTML = ORGS.map((t) => {
    const n = ocounts[t.name] || 0;
    return `<button class="type org-card ${n ? "" : "empty-type"}" data-o="${esc(t.name)}">
      <span class="ico">${t.icon}</span>
      <h3>${esc(t.name)}</h3>
      <p>${esc(t.desc)}</p>
      <span class="count">${n ? n + (n === 1 ? " protocol" : " protocols") : "Coming soon"}</span>
    </button>`;
  }).join("");
  const ocats = ["All", ...ORGS.map((t) => t.name).filter((n) => ocounts[n])];
  $("orgChips").innerHTML = ocats.map((c) => `<button class="chip ${c === activeOrg ? "on" : ""}" data-o="${esc(c)}">${esc(c)}</button>`).join("");
  $("typesGrid").innerHTML = TYPES.map((t) => {
    const n = counts[t.name] || 0;
    const ph = photoUrl(t.name, 600, 340);
    return `<button class="type ${n ? "" : "empty-type"}" data-c="${esc(t.name)}">
      ${ph ? `<span class="tpic"><img src="${ph}" alt="" loading="lazy" onerror="this.parentNode.remove()"></span>` : ""}
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

$("orgsGrid").addEventListener("click", (e) => {
  const b = e.target.closest(".type"); if (!b) return;
  activeOrg = b.dataset.o; activeCat = "All"; query = ""; shown = 24; $("search").value = ""; render();
  $("library").scrollIntoView({ behavior: "smooth" });
});
$("orgChips").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { activeOrg = b.dataset.o; shown = 24; render(); } });
$("typesGrid").addEventListener("click", (e) => {
  const b = e.target.closest(".type"); if (!b) return;
  activeCat = b.dataset.c; activeOrg = "All"; query = ""; shown = 24; $("search").value = ""; render();
  $("library").scrollIntoView({ behavior: "smooth" });
});
$("chips").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { activeCat = b.dataset.c; shown = 24; render(); } });
$("search").addEventListener("input", (e) => { query = e.target.value; shown = 24; render(); });
$("more").addEventListener("click", () => { shown += 48; render(); });
$("year").textContent = new Date().getFullYear();
(() => { const n = document.querySelector(".credits-note"); if (!n) return;
  const seen = new Set(), names = S.filter((s) => !seen.has(s[5]) && seen.add(s[5])).map((s) => `<a href="${U(s[5])}" target="_blank" rel="noopener">${esc(s[4])}</a>`);
  n.innerHTML = `Photos via <a href="https://unsplash.com/?utm_source=protocol_world&utm_medium=referral" target="_blank" rel="noopener">Unsplash</a>: ${names.join(", ")}.`; })();

Promise.all([
  fetch("data/protocols.json", { cache: "no-cache" }).then((r) => r.json()),
  fetch("data/organisms.json", { cache: "no-cache" }).then((r) => r.json()).catch(() => ({})),
])
  .then(([d, o]) => { ALL = d.protocols || []; ORG = o || {}; render(); })
  .catch(() => { $("todayGrid").innerHTML = "<p class='empty'>Could not load protocols.</p>"; });

// Hero slideshow: a new protocol-type photo every 3 seconds (Unsplash photos; SVG art is the fallback)
(function () {
  const box = document.getElementById("slideshow"), dots = document.getElementById("dots");
  if (!box || !dots) return;
  const cap = document.getElementById("cap"), credit = document.getElementById("credit");
  const imgs = S.map((s, n) => {
    const im = document.createElement("img");
    im.className = "slide"; im.alt = s[0]; im.src = P(s[3]); if (n) im.loading = "lazy";
    im.onerror = () => { im.onerror = null; im.dataset.fb = "1"; im.src = `assets/slides/${s[2]}.svg`; if (n === i) show(); };
    box.insertBefore(im, cap);
    const d = document.createElement("i"); d.onclick = () => { go(n); restart(); }; dots.appendChild(d);
    return im;
  });
  let i = 0, timer;
  function show() {
    const s = S[i], fb = imgs[i].dataset.fb === "1";
    cap.style.display = fb ? "none" : "";
    cap.querySelector("b").textContent = s[0]; cap.querySelector("span").textContent = s[1];
    credit.style.display = fb ? "none" : "";
    credit.textContent = `Photo: ${s[4]} / Unsplash`; credit.href = U(s[5]);
  }
  function go(n) {
    imgs[i].classList.remove("on"); dots.children[i].classList.remove("on");
    i = n; imgs[i].classList.add("on"); dots.children[i].classList.add("on"); show();
  }
  const restart = () => { clearInterval(timer); timer = setInterval(() => go((i + 1) % S.length), 3000); };
  imgs[0].classList.add("on"); dots.children[0].classList.add("on"); show(); restart();
})();
