/* ==========================================================================
   PLANET CONFIG  -  edit this to wire up the eight worlds.
   - id:    stable identifier (also used for data-testid), don't need to change
   - label: accessible name read by screen readers (never shown on screen).
            Leave '' to use the neutral fallback "World 1", "World 2", ...
   - url:   destination. '#' = placeholder (activation does nothing).
            Use a full URL ('https://...') or a path ('/about') to make it live.
   - color: dominant hue of the planet (six-digit hex, e.g. '#7a5aa6').
   ========================================================================== */
var PLANETS = [
  { id: 'cinder',   label: '', url: '#', color: '#d9773f' },
  { id: 'tidewell', label: '', url: '#', color: '#3f7fa8' },
  { id: 'aurelian', label: '', url: '#', color: '#d8b46a' },
  { id: 'verdigris',label: '', url: '#', color: '#4f9a8a' },
  { id: 'umbra',    label: '', url: '#', color: '#7a5aa6' },
  { id: 'frost',    label: '', url: '#', color: '#b9d3e6' },
  { id: 'carmine',  label: '', url: '#', color: '#a8434f' },
  { id: 'dune',     label: '', url: '#', color: '#c49a7a' }
];

(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Visual recipe per slot: surface type, texture params, ring, tilt. */
  var LOOKS = [
    { kind: 'bands', fx: 0.004, fy: 0.05, oct: 4, ring: 2.15, r1: 'rgba(240,206,160,.55)', r2: 'rgba(190,150,120,.32)', tilt: -14, ds: 140 },
    { kind: 'ocean', fx: 0.012, fy: 0.012, oct: 5, ds: 110 },
    { kind: 'bands', fx: 0.003, fy: 0.08, oct: 3, ds: 180 },
    { kind: 'rock',  fx: 0.03, fy: 0.03, oct: 6, ds: 90 },
    { kind: 'bands', fx: 0.006, fy: 0.035, oct: 5, ring: 2.0, r1: 'rgba(200,190,240,.45)', r2: 'rgba(150,140,200,.26)', tilt: 18, ds: 160 },
    { kind: 'ice',   fx: 0.02, fy: 0.008, oct: 4, ds: 130 },
    { kind: 'rock',  fx: 0.045, fy: 0.045, oct: 5, ds: 100 },
    { kind: 'storm', fx: 0.008, fy: 0.02, oct: 5, ds: 150 }
  ];

  /* Layouts: x,y as fraction of viewport, d = diameter in design px. */
  var DESKTOP = { w: 1440, h: 900, p: [
    [0.20, 0.60, 150], [0.39, 0.27, 92], [0.52, 0.68, 122], [0.655, 0.35, 70],
    [0.80, 0.63, 156], [0.885, 0.21, 82], [0.10, 0.25, 58], [0.355, 0.85, 62]
  ]};
  var MOBILE = { w: 390, h: 844, p: [
    [0.37, 0.17, 112], [0.81, 0.12, 74], [0.72, 0.33, 98], [0.24, 0.38, 68],
    [0.57, 0.53, 112], [0.23, 0.67, 84], [0.77, 0.74, 76], [0.42, 0.865, 86]
  ]};

  function texture(look, seed, color) {
    var m;
    switch (look.kind) {
      case 'ocean': m = '0 0 0 0 0.1  0 0 0 0 0.35  0 0 0 0 0.45  0 0 -2.2 0 1.6'; break;
      case 'ice':   m = '0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 2.4 -1.1'; break;
      default:      m = '0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  1.4 0 0 0 -0.35';
    }
    var lum = look.kind === 'bands' || look.kind === 'storm' || look.kind === 'rock'
      ? '<feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncR type="gamma" exponent="1.4" amplitude="1.2"/><feFuncG type="gamma" exponent="1.4" amplitude="1.2"/><feFuncB type="gamma" exponent="1.4" amplitude="1.2"/></feComponentTransfer>'
      : '<feColorMatrix type="matrix" values="' + m + '"/>';
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><filter id="f" x="0" y="0" width="100%" height="100%">' +
      '<feTurbulence type="' + (look.kind === 'rock' ? 'turbulence' : 'fractalNoise') + '" baseFrequency="' + look.fx + ' ' + look.fy +
      '" numOctaves="' + look.oct + '" seed="' + seed + '" stitchTiles="stitch"/>' + lum + '</filter><rect width="256" height="256" filter="url(#f)"/></svg>';
    return 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
  }

  function shift(hex, amt) {
    var n = parseInt(hex.replace('#', ''), 16);
    var r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    function c(v) { return Math.max(0, Math.min(255, Math.round(amt > 0 ? v + (255 - v) * amt : v * (1 + amt)))); }
    return 'rgb(' + c(r) + ',' + c(g) + ',' + c(b) + ')';
  }
  function alpha(hex, a) {
    var n = parseInt(hex.replace('#', ''), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function isPlaceholder(url) { return !url || url === '#'; }

  var nav = document.getElementById('worlds');
  var els = PLANETS.map(function (p, i) {
    var look = LOOKS[i % LOOKS.length];
    var hex = /^#[0-9a-f]{6}$/i.test(p.color) ? p.color : '#8899aa';
    var a = document.createElement('a');
    a.className = 'planet';
    a.href = p.url || '#';
    a.setAttribute('aria-label', p.label || ('World ' + (i + 1)));
    a.setAttribute('data-testid', 'link-planet-' + p.id);
    if (/^https?:\/\//.test(p.url) && p.url.indexOf(location.host) === -1) a.rel = 'noopener';
    var s = a.style;
    s.setProperty('--base', 'radial-gradient(circle at 34% 30%,' + shift(hex, .35) + ',' + hex + ' 38%,' + shift(hex, -.55) + ' 78%,' + shift(hex, -.85) + ')');
    s.setProperty('--glow', alpha(hex, .55));
    s.setProperty('--rimc', alpha(hex, .5));
    s.setProperty('--tex', texture(look, 7 + i * 13, hex));
    s.setProperty('--blend', look.kind === 'ocean' || look.kind === 'ice' ? 'normal' : 'overlay');
    s.setProperty('--to', look.kind === 'ice' ? '.55' : look.kind === 'ocean' ? '.75' : '.95');
    s.setProperty('--ds', look.ds + 's');
    s.setProperty('--fs', (7 + (i * 2.7) % 6).toFixed(1) + 's');
    s.setProperty('--fd', (-i * 1.9).toFixed(1) + 's');
    s.setProperty('--tilt', (look.tilt || (i % 2 ? 8 : -6)) + 'deg');
    var ring = '';
    if (look.ring) {
      s.setProperty('--rw', look.ring);
      s.setProperty('--r1', look.r1); s.setProperty('--r2', look.r2);
      ring = '<span class="ring back"></span>';
    }
    a.innerHTML = '<span class="float"><span class="tilt"><span class="halo"></span>' + ring +
      '<span class="atmo"></span><span class="body"><span class="tex"></span><span class="tex b" style="transform:scaleY(-1)"></span>' +
      (look.kind === 'storm' ? '<span style="position:absolute;left:58%;top:56%;width:22%;height:12%;border-radius:50%;background:radial-gradient(' + shift(hex, .5) + ',transparent 70%);opacity:.6"></span>' : '') +
      '<span class="shade"></span><span class="rim"></span></span>' +
      (look.ring ? '<span class="ring front"></span>' : '') + '</span></span>';
    a.addEventListener('click', function (e) { if (isPlaceholder(p.url)) e.preventDefault(); });
    a.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse') { a.classList.add('pressed'); setTimeout(function () { a.classList.remove('pressed'); }, 650); }
    });
    nav.appendChild(a);
    return a;
  });

  function layout() {
    var W = innerWidth, H = innerHeight;
    var L = W / H < 1 ? MOBILE : DESKTOP;
    var k = Math.min(W / L.w, H / L.h);
    els.forEach(function (a, i) {
      var p = L.p[i % L.p.length];
      a.style.setProperty('--x', (p[0] * W).toFixed(1) + 'px');
      a.style.setProperty('--y', (p[1] * H).toFixed(1) + 'px');
      a.style.setProperty('--d', (p[2] * k).toFixed(1) + 'px');
    });
  }
  layout();
  addEventListener('resize', layout);

  /* Starfield */
  var cv = document.getElementById('stars'), ctx = cv.getContext('2d'), stars = [], raf = 0;
  function seed() {
    var dpr = Math.min(devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    var n = Math.round(innerWidth * innerHeight / 5200);
    stars = [];
    for (var i = 0; i < n; i++) stars.push({ x: Math.random() * innerWidth, y: Math.random() * innerHeight,
      r: Math.random() < .93 ? Math.random() * .8 + .2 : Math.random() * 1.1 + .8,
      a: Math.random() * .6 + .2, s: Math.random() * .0015 + .0004, o: Math.random() * 6.28,
      w: Math.random() < .15 ? '255,214,180' : Math.random() < .3 ? '190,210,255' : '255,255,250' });
  }
  function draw(t) {
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    for (var i = 0; i < stars.length; i++) {
      var st = stars[i], tw = reduce.matches ? 1 : .55 + .45 * Math.sin(t * st.s + st.o);
      ctx.fillStyle = 'rgba(' + st.w + ',' + (st.a * tw).toFixed(3) + ')';
      ctx.beginPath(); ctx.arc(st.x, st.y, st.r, 0, 6.283); ctx.fill();
    }
    if (!reduce.matches) raf = requestAnimationFrame(draw);
  }
  function start() { cancelAnimationFrame(raf); seed(); draw(performance.now()); }
  start();
  addEventListener('resize', start);
  if (reduce.addEventListener) reduce.addEventListener('change', start);
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) cancelAnimationFrame(raf); else start();
  });
})();
