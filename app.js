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
    <div class="tags"><span class="tag">${esc(p.category || "Protocol")}</span><span class="tag org">${esc(orgOf(p))}</span></div>
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

Promise.all([
  fetch("data/protocols.json", { cache: "no-cache" }).then((r) => r.json()),
  fetch("data/organisms.json", { cache: "no-cache" }).then((r) => r.json()).catch(() => ({})),
])
  .then(([d, o]) => { ALL = d.protocols || []; ORG = o || {}; render(); })
  .catch(() => { $("todayGrid").innerHTML = "<p class='empty'>Could not load protocols.</p>"; });

// Hero slideshow: a new protocol-type picture every 3 seconds
(function () {
  const slides = [...document.querySelectorAll("#slideshow .slide")];
  const dots = document.getElementById("dots");
  if (!slides.length || !dots) return;
  let i = 0, timer;
  slides.forEach((_, n) => { const d = document.createElement("i"); d.onclick = () => { go(n); restart(); }; dots.appendChild(d); });
  const go = (n) => {
    slides[i].classList.remove("on"); dots.children[i].classList.remove("on");
    i = n; slides[i].classList.add("on"); dots.children[i].classList.add("on");
  };
  const restart = () => { clearInterval(timer); timer = setInterval(() => go((i + 1) % slides.length), 3000); };
  dots.children[0].classList.add("on");
  restart();
})();

// "What's new" feed: earlier days, newest first
function renderNews(sorted, latest) {
  const el = $("news");
  if (!el) return;
  const byDate = {};
  sorted.forEach((p) => { if (p.date && p.date !== latest) (byDate[p.date] = byDate[p.date] || []).push(p); });
  const days = Object.keys(byDate).sort().reverse().slice(0, 7);
  // protocols added on the latest date without the daily flag (library batches) also belong to the feed
  const extra = sorted.filter((p) => p.date === latest && !p.daily && sorted.some((x) => x.daily && x.date === latest));
  if (extra.length) byDate[latest] = extra, days.unshift(latest);
  if (!days.length) { el.innerHTML = ""; return; }
  el.innerHTML = `<h3 class="news-h">📰 Recently added</h3>` + days.map((d) => `
    <div class="news-day"><div class="news-date">${esc(fmtDate(d))}<span>${byDate[d].length} new</span></div>
    ${byDate[d].map((p, i) => `<div class="news-item" style="animation-delay:${i * 60}ms">
      <span class="newpill">NEW</span><b>${esc(p.title)}</b>
      <em>${esc(p.category || "")} · ${esc(orgOf(p))}</em>
      <span class="news-dl">${p.word_file ? `<a href="${esc(p.word_file)}" download>Word</a>` : ""}${p.pptx_file ? `<a href="${esc(p.pptx_file)}" download>PPTX</a>` : ""}</span>
    </div>`).join("")}</div>`).join("");
}

// Pop-up announcing the newest protocols (once per browser session)
function showToast(today, latest) {
  const t = $("toast");
  if (!t || !today.length) return;
  try { if (sessionStorage.getItem("pw_toast") === latest) return; } catch (e) {}
  t.innerHTML = `<button class="x" aria-label="Close">×</button><div class="tt">🔔 ${today.length} new protocol${today.length > 1 ? "s" : ""} added</div><ul>${today.map((p) => `<li>${esc(p.title)}</li>`).join("")}</ul><a href="#new">See what's new →</a>`;
  setTimeout(() => t.classList.add("show"), 1200);
  const hide = () => { t.classList.remove("show"); try { sessionStorage.setItem("pw_toast", latest); } catch (e) {} };
  t.querySelector(".x").onclick = hide;
  t.querySelector("a").onclick = hide;
  setTimeout(hide, 12000);
}
