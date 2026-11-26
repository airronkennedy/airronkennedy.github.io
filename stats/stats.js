(() => {
const TZ = 'America/Los_Angeles';
const SB = 'https://agdjsmtluawwmrkqazfl.supabase.co';
const SBK = 'sb_publishable_Dt4XzAh4Ac_xfhekaV7mMw_onG3Ajwx';
const CLICK_DEFAULTS = ['Resume','LinkedIn','GitHub','Magic Commander',"Airron's Fall","Airron's Quest"];

const fmt = iso => {
  try {
    return new Date(iso).toLocaleString('en-US', {
      timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true
    }) + ' PT';
  } catch { return iso; }
};
const fmtDay = iso => {
  try {
    const d = iso.length <= 10 ? new Date(iso + 'T12:00:00-08:00') : new Date(iso);
    return d.toLocaleDateString('en-US', {timeZone: TZ, month: 'short', day: 'numeric'});
  } catch { return iso; }
};
const fmtDayLong = iso => {
  try {
    const d = iso.length <= 10 ? new Date(iso + 'T12:00:00-08:00') : new Date(iso);
    return d.toLocaleDateString('en-US', {timeZone: TZ, month: 'short', day: 'numeric', year: 'numeric'});
  } catch { return iso; }
};
const esc = s => String(s).replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const num = n => (n == null || n === '') ? '—' : Number(n).toLocaleString('en-US');

function rows(id, list, empty) {
  const tb = document.querySelector('#' + id + ' tbody');
  if (!tb) return;
  tb.innerHTML = (list && list.length)
    ? list.map(r => `<tr><td>${esc(r.name || '(none)')}</td><td class="n">${num(r.count)}</td></tr>`).join('')
    : `<tr><td colspan="2">${esc(empty || 'No data yet')}</td></tr>`;
}

function whenCell(v) {
  if (v.time) {
    const text = v.approx ? 'around ' + fmt(v.time).replace(/:\d\d /, ' ') : fmt(v.time);
    const extra = (v.count > 1 ? ' · ×' + v.count : '') + (v.source && v.source !== 'web' && !v.approx ? ' · ' + esc(v.source) : '');
    return text + extra;
  }
  return (v.day ? fmtDayLong(v.day) : '') + (v.count > 1 ? ' · ×' + v.count : '');
}

function inRange(isoOrDay, range) {
  if (!range || range.key === 'all' || !range.start) return true;
  const raw = isoOrDay || '';
  const day = raw.length >= 10 ? raw.slice(0, 10) : raw;
  return day >= range.start && (!range.end || day <= range.end);
}

function kpi(label, value, sub) {
  return `<article class="kpi"><p class="label">${esc(label)}</p><p class="value">${esc(String(value))}</p>${sub ? `<p class="sub">${esc(sub)}</p>` : ''}</article>`;
}

function drawChart(container, points, mode) {
  if (!points.length) {
    container.innerHTML = '<p class="empty">No visits in this range yet.</p>';
    return;
  }
  const max = Math.max(1, ...points.map(p => p.visits || 0));
  const showEvery = points.length > 16 ? Math.ceil(points.length / 8) : 1;
  container.innerHTML = points.map((p, i) => {
    const h = Math.max(p.visits ? 4 : 0, Math.round((p.visits / max) * 140));
    const label = mode === 'hour'
      ? String(p.hour).padStart(2, '0')
      : (showEvery === 1 || i % showEvery === 0 || i === points.length - 1 ? fmtDay(p.day) : '');
    const title = mode === 'hour'
      ? `${String(p.hour).padStart(2,'0')}:00 PT — ${p.visits} visit${p.visits===1?'':'s'}`
      : `${p.day} — ${p.visits} visit${p.visits===1?'':'s'}`;
    return `<div class="col" title="${esc(title)}"><span class="bar" style="height:${h}px"></span><span class="lab">${esc(label)}</span></div>`;
  }).join('');
}

function periodRows(id, list, labelKey) {
  const tb = document.querySelector('#' + id + ' tbody');
  tb.innerHTML = (list && list.length)
    ? list.map(r => `<tr><td>${esc(r.label || r[labelKey] || '')}</td><td class="n">${num(r.visits)}</td></tr>`).join('')
    : '<tr><td colspan="2">No data yet</td></tr>';
}

function showPlayers(players, live) {
  const sessions = players.reduce((n, p) => n + (p.count || 1), 0);
  const unique = new Set(players.map(p => p.name)).size;
  document.getElementById('arena-counts').textContent =
    (players.length ? `${unique} unique name${unique===1?'':'s'} · ${sessions} session${sessions===1?'':'s'}` : 'No sessions yet')
    + (live ? ' · live' : '');
  const atb = document.querySelector('#arena-players tbody');
  atb.innerHTML = players.length
    ? players.map(v => `<tr><td>${esc(v.name)}</td><td>${whenCell(v)}</td></tr>`).join('')
    : '<tr><td colspan="2">No players yet</td></tr>';
}

let liveTimer = null;
function loadLivePlayers() {
  let code = null;
  try { code = sessionStorage.getItem('airron-stats-code'); } catch {}
  if (!code) return;
  fetch(SB + '/rest/v1/rpc/arena_players_recent', {
    method: 'POST',
    headers: {apikey: SBK, 'Content-Type': 'application/json'},
    body: JSON.stringify({p_code: code})
  })
    .then(r => r.ok ? r.json() : Promise.reject(r.status))
    .then(list => showPlayers(list.map(p => ({
      name: p.name, time: p.played_at, source: p.source,
      approx: /hour only/.test(p.source || '')
    })), true))
    .catch(() => {});
  if (!liveTimer) liveTimer = setInterval(loadLivePlayers, 30000);
}

let DATA = null;
let RANGE = 'all';

function activeRange(d) {
  const r = (d.ranges && d.ranges[RANGE]) || null;
  return r || {
    key: RANGE,
    start: RANGE === 'all' ? d.tracking_started : null,
    end: null,
    total_visits: d.total_visits,
    total_events: d.total_events,
    daily: d.daily,
    weekly: d.weekly,
    monthly: d.monthly,
    pages: d.pages,
    planets: d.planets,
    referrers: d.referrers,
    sources: d.sources,
    countries: d.countries,
    regions: d.regions,
    browsers: d.browsers,
    browser_versions: d.browser_versions,
    systems: d.systems,
    devices: d.devices,
    screens: d.screens,
    clicks: d.clicks,
    click_total: d.click_total,
    recruiter_pages: d.recruiter_pages,
    recruiter_page_hits: d.recruiter_page_hits,
    recruiter_skip_total: d.recruiter_skip_total,
    hourly: d.today_hourly
  };
}

function namedInRange(list, r) {
  return (list || []).filter(v => inRange(v.time || v.day, r));
}

function render() {
  const d = DATA;
  if (!d) return;
  const r = activeRange(d);
  r.key = RANGE;
  const start = r.start || d.tracking_started || '';
  const end = r.end || '';
  const rangeLabel = RANGE === 'all'
    ? `All time since ${fmtDay(d.tracking_started || start)}`
    : RANGE === 'day'
      ? `Today (${fmtDay(end || start)} PT)`
      : `${fmtDay(start)} – ${fmtDay(end)} PT`;
  document.getElementById('range-label').textContent = rangeLabel;

  document.querySelectorAll('.period button').forEach(btn => {
    btn.setAttribute('aria-selected', btn.dataset.range === RANGE ? 'true' : 'false');
  });

  const visitors = namedInRange(d.visitors, r);
  const uniqueNamed = new Set(visitors.map(v => v.name)).size;
  const recTotal = r.recruiter_skip_total || r.recruiter_page_hits || 0;
  const clickTotal = r.click_total || 0;
  const unique = RANGE === 'all' && d.unique_visitors != null ? d.unique_visitors : r.total_visits;

  document.getElementById('kpis').innerHTML = [
    kpi('Visits', num(r.total_visits), RANGE === 'day' ? 'Unique sessions today' : 'Unique sessions in this range'),
    kpi('Unique visitors', num(unique), RANGE === 'all' ? 'Sessions across the full record' : 'Same as visits in this range'),
    kpi('Named visitors', num(uniqueNamed), visitors.length ? `${visitors.length} gate entr${visitors.length===1?'y':'ies'}` : 'Experience Planet gate'),
    kpi('Recruiter links', num(recTotal), 'Skip-link hits'),
    kpi('Outbound clicks', num(clickTotal), clickTotal ? '' : 'Starts with this update')
  ].join('');
  document.getElementById('unique-note').textContent = d.unique_visitors_note || '';

  const useHourly = RANGE === 'day' && (r.hourly || d.today_hourly || []).length;
  if (useHourly) {
    const today = r.end || r.start;
    const hours = (r.hourly || d.today_hourly).filter(h => !h.day || h.day === today);
    const pts = Array.from({length: 24}, (_, hour) => {
      const found = hours.find(h => Number(h.hour) === hour);
      return {hour, visits: found ? found.visits : 0};
    });
    document.getElementById('trend-title').textContent = 'Visits today, by hour (PT)';
    drawChart(document.getElementById('chart'), pts, 'hour');
  } else {
    document.getElementById('trend-title').textContent = 'Visits over time';
    drawChart(document.getElementById('chart'), r.daily || [], 'day');
  }
  periodRows('weekly', r.weekly || [], 'label');
  periodRows('monthly', r.monthly || [], 'label');

  const nvr = d.new_vs_returning;
  const nvrBlock = document.getElementById('new-returning-block');
  if (nvr && RANGE === 'all') {
    nvrBlock.hidden = false;
    const total = (nvr.new || 0) + (nvr.returning || 0) || 1;
    document.getElementById('nvr-note').textContent = 'From GoatCounter session export (first visit vs later visits).';
    document.getElementById('nvr').innerHTML =
      kpi('New', num(nvr.new), Math.round((nvr.new / total) * 100) + '% of unique sessions') +
      kpi('Returning', num(nvr.returning), Math.round((nvr.returning / total) * 100) + '% of unique sessions');
  } else {
    document.getElementById('nvr-note').textContent = nvr
      ? 'New vs returning is available for all-time sessions only.'
      : 'New vs returning will show up after a successful GoatCounter export. The API allows one export per hour, and this refresh used daily session totals instead.';
    document.getElementById('nvr').innerHTML = '';
    if (!nvr) nvrBlock.hidden = false;
  }

  rows('planets', r.planets, 'No planet visits yet');
  rows('pages', r.pages, 'No page visits yet');
  rows('sources', r.sources, 'No sources yet');
  rows('refs', r.referrers, 'No referrers yet');

  const ntb = document.querySelector('#names tbody');
  ntb.innerHTML = visitors.length
    ? visitors.map(v => `<tr><td>${esc(v.name)}</td><td>${whenCell(v)}</td></tr>`).join('')
    : '<tr><td colspan="2">No names yet</td></tr>';

  document.getElementById('recruiter-total').textContent = num(recTotal);
  const recNote = document.getElementById('recruiter-note');
  const ev = r.recruiter_skip_total && r.recruiter_page_hits !== r.recruiter_skip_total;
  recNote.textContent = ev
    ? `Skip-link events: ${r.recruiter_skip_total}. Pages opened with ?r=recruiter: ${r.recruiter_page_hits || 0}.`
    : 'Pages opened with ?r=recruiter, plus dedicated skip-link events once that tracking is live.';
  rows('recruiter-pages', r.recruiter_pages, 'No recruiter-link hits yet');

  if (!liveTimer) showPlayers(namedInRange(d.arena_players || [], r), false);

  const clicks = [...(r.clicks || [])];
  const have = new Set(clicks.map(c => c.name));
  CLICK_DEFAULTS.forEach(name => { if (!have.has(name)) clicks.push({name, count: 0}); });
  rows('clicks', clicks, 'No outbound clicks recorded yet');

  const citiesNote = document.getElementById('cities-note');
  citiesNote.textContent = d.cities_note || '';
  rows('locations', r.countries, 'No countries yet');
  const regionList = (d.cities && d.cities.length && RANGE === 'all') ? d.cities : (r.regions || []);
  rows('regions', regionList, 'No regions yet');

  rows('devices', r.devices, 'No device data yet');
  rows('systems', r.systems, 'No system data yet');
  rows('browsers', r.browsers, 'No browser data yet');
  rows('browser-versions', r.browser_versions, 'No version data yet');
  rows('screens', r.screens, 'No screen data yet');
}

window.addEventListener('stats-unlocked', loadLivePlayers);
document.addEventListener('click', e => {
  const btn = e.target.closest('.period button');
  if (!btn) return;
  RANGE = btn.dataset.range;
  render();
});

fetch('/stats/data.json?t=' + Date.now()).then(r => r.json()).then(d => {
  DATA = d;
  document.getElementById('updated').textContent = 'Last updated: ' + (d.updated ? fmt(d.updated) : 'not yet');
  if (d.note) {
    const n = document.getElementById('note');
    n.textContent = d.note;
    n.hidden = false;
  }
  render();
  loadLivePlayers();
}).catch(() => {
  document.getElementById('updated').textContent = 'Could not load stats data.';
});
})();
