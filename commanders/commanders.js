/**
 * Commander Wall: search Scryfall for legal commanders, post via a Supabase
 * RPC that only accepts a card id, and scroll a shared wall of large images.
 * Mirrors the Scryfall search + 2 req/s throttle used in MTG Commander.
 */
const SUPABASE_URL = "https://fxdzfqijogsdmcqclpaf.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ4ZHpmcWlqb2dzZG1jcWNscGFmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUyMTAxMjEsImV4cCI6MjExMDc4NjEyMX0.iSsBxm-2RLsHCSTqVlniu2ZtKNcuzRJE1FbmzY5WGGc";

const PAGE = 8;
const SCRYFALL_GAP_MS = 500;
const DEBOUNCE_MS = 280;

const restHeaders = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  Accept: "application/json",
};

const search = document.getElementById("search");
const resultsEl = document.getElementById("results");
const statusEl = document.getElementById("status");
const pickedEl = document.getElementById("picked");
const postBtn = document.getElementById("post");
const wallEl = document.getElementById("wall");
const moreStatus = document.getElementById("more-status");
const sentinel = document.getElementById("sentinel");

/** @type {{ id: string, name: string, type_line?: string, image: string } | null} */
let picked = null;
/** @type {{ id: string, name: string, image_url: string, created_at: string }[]} */
let posts = [];
let cursor = 0;
let done = false;
let loading = false;
let posting = false;
let scryfallQueue = Promise.resolve();
let lastScryfall = 0;
let debounceTimer = 0;
let activeIndex = -1;
/** @type {{ id: string, name: string, type_line?: string, image: string }[]} */
let hits = [];

function setStatus(text, isError = false) {
  statusEl.textContent = text;
  statusEl.classList.toggle("error", Boolean(isError));
}

function imageOf(card) {
  const uris = card.image_uris || card.card_faces?.[0]?.image_uris || {};
  return uris.large || uris.normal || uris.border_crop || uris.small || "";
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scryfallGet(url) {
  const run = scryfallQueue.then(async () => {
    const wait = lastScryfall + SCRYFALL_GAP_MS - Date.now();
    if (wait > 0) await delay(wait);
    lastScryfall = Date.now();
    const res = await fetch(url, { headers: { Accept: "application/json" } });
    if (res.status === 404) return { data: [] };
    if (!res.ok) throw new Error("search failed");
    return res.json();
  });
  scryfallQueue = run.then(() => undefined, () => undefined);
  return run;
}

async function searchCommanders(query) {
  const q = query.trim();
  if (!q) return [];
  const url = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(`is:commander ${q}`)}&unique=cards&order=name`;
  const data = await scryfallGet(url);
  const rows = Array.isArray(data?.data) ? data.data : [];
  return rows.slice(0, 8).map((card) => ({
    id: card.id,
    name: card.name,
    type_line: card.type_line || card.card_faces?.[0]?.type_line || "",
    image: imageOf(card),
  })).filter((row) => row.id && row.name && row.image);
}

function renderResults() {
  if (!hits.length) {
    resultsEl.hidden = true;
    resultsEl.innerHTML = "";
    return;
  }
  resultsEl.hidden = false;
  resultsEl.innerHTML = hits
    .map((hit, i) => `
      <button type="button" class="result" role="option" data-index="${i}" aria-selected="${i === activeIndex}">
        <img src="${escapeAttr(thumb(hit.image))}" alt="" width="44" height="61" />
        <span class="meta">
          <strong>${escapeHtml(hit.name)}</strong>
          <span>${escapeHtml(hit.type_line || "")}</span>
        </span>
      </button>`)
    .join("");
}

function thumb(url) {
  return url.replace("/large/", "/small/").replace("/normal/", "/small/");
}

function selectHit(hit) {
  picked = hit;
  hits = [];
  activeIndex = -1;
  renderResults();
  search.value = hit.name;
  pickedEl.hidden = false;
  pickedEl.innerHTML = `
    <img src="${escapeAttr(thumb(hit.image))}" alt="" width="72" height="100" />
    <p>${escapeHtml(hit.name)}</p>`;
  postBtn.disabled = posting;
  setStatus("Post this commander to the wall.");
}

function clearPicked() {
  picked = null;
  pickedEl.hidden = true;
  pickedEl.innerHTML = "";
  postBtn.disabled = true;
}

async function onSearchInput() {
  const q = search.value.trim();
  if (picked && q !== picked.name) clearPicked();
  if (!q) {
    hits = [];
    renderResults();
    setStatus("");
    return;
  }
  setStatus("Searching…");
  try {
    hits = await searchCommanders(q);
    // Ignore stale responses if the box changed while we waited.
    if (search.value.trim() !== q) return;
    activeIndex = hits.length ? 0 : -1;
    renderResults();
    setStatus(hits.length ? "" : "No commanders matched. Try another name.");
  } catch {
    if (search.value.trim() !== q) return;
    hits = [];
    renderResults();
    setStatus("Scryfall is busy. Try again in a moment.", true);
  }
}

function scheduleSearch() {
  window.clearTimeout(debounceTimer);
  debounceTimer = window.setTimeout(() => {
    void onSearchInput();
  }, DEBOUNCE_MS);
}

resultsEl.addEventListener("click", (event) => {
  const btn = event.target.closest("[data-index]");
  if (!btn) return;
  const hit = hits[Number(btn.dataset.index)];
  if (hit) selectHit(hit);
});

search.addEventListener("input", scheduleSearch);
search.addEventListener("keydown", (event) => {
  if (event.key === "ArrowDown" && hits.length) {
    event.preventDefault();
    activeIndex = (activeIndex + 1) % hits.length;
    renderResults();
  } else if (event.key === "ArrowUp" && hits.length) {
    event.preventDefault();
    activeIndex = (activeIndex - 1 + hits.length) % hits.length;
    renderResults();
  } else if (event.key === "Enter") {
    event.preventDefault();
    if (hits[activeIndex]) selectHit(hits[activeIndex]);
    else if (picked) void postPicked();
    else void onSearchInput();
  } else if (event.key === "Escape") {
    hits = [];
    renderResults();
  }
});

postBtn.addEventListener("click", () => {
  void postPicked();
});

async function postPicked() {
  if (!picked || posting) return;
  posting = true;
  postBtn.disabled = true;
  setStatus("Posting…");
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/post_commander`, {
      method: "POST",
      headers: { ...restHeaders, "Content-Type": "application/json" },
      body: JSON.stringify({ p_scryfall_id: picked.id }),
    });
    const body = await res.json().catch(() => null);
    if (res.status === 429 || (typeof body?.message === "string" && /rate limited/i.test(body.message))) {
      throw new Error("Slow down — try again in a moment.");
    }
    if (!res.ok) {
      const msg = typeof body?.message === "string" ? body.message : "";
      if (/not a commander|invalid card/i.test(msg)) throw new Error("That card can’t be posted as a commander.");
      throw new Error("Couldn’t post. Try again.");
    }
    const row = normalizeRow(body);
    if (row) prepend(row);
    search.value = "";
    clearPicked();
    hits = [];
    renderResults();
    setStatus("Posted.");
  } catch (err) {
    setStatus(err instanceof Error ? err.message : "Couldn’t post. Try again.", true);
  } finally {
    posting = false;
    postBtn.disabled = !picked;
  }
}

function normalizeRow(row) {
  if (!row || typeof row !== "object") return null;
  const id = String(row.id || "");
  const name = String(row.name || "");
  const image_url = String(row.image_url || "");
  const created_at = String(row.created_at || "");
  if (!id || !name || !image_url.startsWith("https://cards.scryfall.io/")) return null;
  return { id, name, image_url, created_at, scryfall_id: String(row.scryfall_id || "") };
}

function cardFigure(row, eager) {
  const fig = document.createElement("figure");
  fig.className = "wall-card";
  fig.dataset.id = row.id;
  const img = document.createElement("img");
  img.src = row.image_url;
  img.alt = row.name;
  img.width = 672;
  img.height = 936;
  img.decoding = "async";
  if (eager) img.fetchPriority = "high";
  else img.loading = "lazy";
  const cap = document.createElement("figcaption");
  cap.textContent = row.name;
  fig.append(img, cap);
  return fig;
}

function renderWall(reset) {
  if (reset) wallEl.innerHTML = "";
  if (!posts.length) {
    wallEl.innerHTML = `<p class="wall-empty">No commanders yet. Search one and post it to start the wall.</p>`;
    return;
  }
  const empty = wallEl.querySelector(".wall-empty");
  if (empty) empty.remove();
}

function prepend(row) {
  if (posts.some((p) => p.id === row.id)) return;
  posts.unshift(row);
  cursor += 1;
  renderWall(false);
  const empty = wallEl.querySelector(".wall-empty");
  if (empty) empty.remove();
  wallEl.prepend(cardFigure(row, true));
}

function appendRows(rows) {
  const empty = wallEl.querySelector(".wall-empty");
  if (empty) empty.remove();
  for (const row of rows) {
    if (posts.some((p) => p.id === row.id)) continue;
    posts.push(row);
    wallEl.append(cardFigure(row, posts.length <= 2));
  }
  if (!posts.length) renderWall(true);
}

async function loadMore() {
  if (loading || done) return;
  loading = true;
  moreStatus.textContent = posts.length ? "Loading more…" : "Loading the wall…";
  try {
    const to = cursor + PAGE - 1;
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/commander_wall?select=id,scryfall_id,name,image_url,created_at&order=created_at.desc,id.desc`,
      { headers: { ...restHeaders, Range: `${cursor}-${to}`, Prefer: "count=exact" } },
    );
    if (!res.ok) throw new Error("load failed");
    const rows = (await res.json()).map(normalizeRow).filter(Boolean);
    appendRows(rows);
    const contentRange = res.headers.get("content-range");
    const total = contentRange && contentRange.includes("/") ? Number(contentRange.split("/")[1]) : NaN;
    cursor += rows.length;
    done = rows.length < PAGE || (!Number.isNaN(total) && cursor >= total);
    moreStatus.textContent = posts.length === 0 ? "" : done ? "" : "";
    if (!posts.length) renderWall(true);
  } catch {
    moreStatus.textContent = "Couldn’t load the wall. Scroll or refresh to try again.";
  } finally {
    loading = false;
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function escapeAttr(value) {
  return escapeHtml(value).replaceAll("'", "&#39;");
}

const observer = new IntersectionObserver((entries) => {
  if (entries.some((e) => e.isIntersecting)) void loadMore();
}, { rootMargin: "800px 0px" });
observer.observe(sentinel);

void loadMore();
