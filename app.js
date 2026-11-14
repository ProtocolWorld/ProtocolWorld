// Protocol World — reads data/protocols.json and renders the site.
// You never need to edit this file: add or change protocols in the CMS (see README).
const $ = (id) => document.getElementById(id);
let ALL = [], activeCat = "All", query = "";

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

  const cats = ["All", ...new Set(ALL.map((p) => p.category).filter(Boolean))];
  $("chips").innerHTML = cats.map((c) => `<button class="chip ${c === activeCat ? "on" : ""}" data-c="${esc(c)}">${esc(c)}</button>`).join("");

  const days = new Set(ALL.map((p) => p.date)).size;
  $("stats").innerHTML = `<div><strong>${ALL.length}</strong><span>Protocols</span></div>
    <div><strong>${cats.length - 1}</strong><span>Categories</span></div>
    <div><strong>${days}</strong><span>Days live</span></div>`;
}

$("chips").addEventListener("click", (e) => { const b = e.target.closest(".chip"); if (b) { activeCat = b.dataset.c; render(); } });
$("search").addEventListener("input", (e) => { query = e.target.value; render(); });
$("year").textContent = new Date().getFullYear();

fetch("data/protocols.json", { cache: "no-cache" })
  .then((r) => r.json())
  .then((d) => { ALL = d.protocols || []; render(); })
  .catch(() => { $("todayGrid").innerHTML = "<p class='empty'>Could not load protocols.</p>"; });
