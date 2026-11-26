(() => {
'use strict';
const COUNT = 'https://airronkennedy.goatcounter.com/count';
const queue = [];

function goatReady() {
  return !!(window.goatcounter && typeof window.goatcounter.count === 'function');
}

function beacon(payload) {
  try {
    const u = new URL(COUNT);
    u.searchParams.set('p', payload.path);
    if (payload.title) u.searchParams.set('t', payload.title);
    u.searchParams.set('e', 'true');
    if (payload.referrer) u.searchParams.set('r', payload.referrer);
    if (navigator.sendBeacon) navigator.sendBeacon(u.toString());
    else fetch(u.toString(), {mode: 'no-cors', keepalive: true, credentials: 'omit'}).catch(() => {});
  } catch {}
}

function send(path, title, extra) {
  const payload = {path, title: title || path, event: true};
  if (extra) payload.referrer = extra;
  if (goatReady()) {
    try { window.goatcounter.count(payload); } catch {}
    return;
  }
  queue.push(payload);
}

function flush(useBeacon) {
  while (queue.length) {
    const payload = queue.shift();
    if (!useBeacon && goatReady()) {
      try { window.goatcounter.count(payload); } catch { beacon(payload); }
    } else {
      beacon(payload);
    }
  }
}

const flushTimer = setInterval(() => {
  if (goatReady()) { flush(false); clearInterval(flushTimer); }
}, 400);
setTimeout(() => { clearInterval(flushTimer); if (queue.length) flush(true); }, 20000);

function classify(a) {
  const explicit = a.getAttribute('data-goatcounter-click');
  if (explicit) {
    return {path: explicit, title: a.getAttribute('data-goatcounter-title') || a.getAttribute('aria-label') || (a.textContent || '').trim() || explicit};
  }
  let url;
  try { url = new URL(a.href, location.href); } catch { return null; }
  const href = url.href;
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  const path = url.pathname || '';
  const full = (path + url.search).toLowerCase();
  if (host === 'linkedin.com' || host.endsWith('.linkedin.com')) {
    return {path: 'click/linkedin', title: 'Click: LinkedIn'};
  }
  if (host === 'github.com' || host.endsWith('.github.com')) {
    return {path: 'click/github', title: 'Click: GitHub'};
  }
  if (/mtg-commander/i.test(href)) {
    return {path: 'click/mtg-commander', title: 'Click: Magic Commander'};
  }
  if (url.origin === location.origin && /^\/arena\/?$/i.test(path)) {
    return {path: 'click/airrons-fall', title: "Click: Airron's Fall"};
  }
  if (url.origin === location.origin && /^\/quest\/?$/i.test(path)) {
    return {path: 'click/airrons-quest', title: "Click: Airron's Quest"};
  }
  if ((/\.pdf($|\?)/i.test(full) && /resume/i.test(full)) || (url.origin === location.origin && /\/work\/files\/resume/i.test(path))) {
    return {path: 'click/resume', title: 'Click: Resume'};
  }
  return null;
}

const seen = new WeakSet();
function track(a) {
  if (!a || seen.has(a)) return;
  const ev = classify(a);
  if (!ev) return;
  seen.add(a);
  setTimeout(() => seen.delete(a), 1000);
  send(ev.path, ev.title, a.href);
}

document.addEventListener('click', (e) => {
  const a = e.target && e.target.closest && e.target.closest('a[href]');
  if (a) track(a);
}, true);
document.addEventListener('auxclick', (e) => {
  if (e.button !== 1) return;
  const a = e.target && e.target.closest && e.target.closest('a[href]');
  if (a) track(a);
}, true);
})();
