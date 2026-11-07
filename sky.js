/* 360° sky sphere: you stand in the middle; turn your phone (or drag on desktop) to look around. */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)');
  var sky = document.querySelector('.sky'), neb = document.querySelector('.nebula');
  var cv = document.createElement('canvas'); cv.id = 'sphere'; cv.setAttribute('aria-hidden', 'true');
  sky.insertBefore(cv, neb ? neb.nextSibling : sky.firstChild);
  var hooks = [];
  var ctx = cv.getContext('2d'), W, H, F, dpr;
  function rnd(s) { return function () { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  var R = rnd(91);
  function unit() { var z = R() * 2 - 1, t = R() * 6.2832, r = Math.sqrt(1 - z * z); return [r * Math.cos(t), z, r * Math.sin(t)]; }
  function norm(v) { var l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; }
  var COLS = ['255,255,250', '255,255,250', '190,210,255', '255,214,180', '255,236,200'];
  var stars = [];
  for (var i = 0; i < 9000; i++) { var m = R(); stars.push({ v: unit(), r: m < .9 ? .45 + R() * .75 : .9 + R() * 1.3, a: .4 + R() * .6, c: COLS[(R() * 5) | 0], s: .0005 + R() * .0015, o: R() * 6.28 }); }
  /* galaxy band: tilted great circle */
  var bn = norm([.3, 1, -.45]), bu = norm([1, -.3, 0]), bw = [bn[1] * bu[2] - bn[2] * bu[1], bn[2] * bu[0] - bn[0] * bu[2], bn[0] * bu[1] - bn[1] * bu[0]];
  var band = [];
  for (i = 0; i < 5000; i++) { var t = R() * 6.2832, off = (R() + R() + R() - 1.5) * .16, c = Math.cos(t), s = Math.sin(t);
    band.push({ v: norm([bu[0] * c + bw[0] * s + bn[0] * off, bu[1] * c + bw[1] * s + bn[1] * off, bu[2] * c + bw[2] * s + bn[2] * off]), r: .25 + R() * .5, a: .15 + R() * .4, c: R() < .5 ? '255,236,210' : '210,220,255', s: 0, o: 0 }); }
  var glow = [];
  for (i = 0; i < 40; i++) { var t2 = i / 40 * 6.2832; glow.push({ v: [bu[0] * Math.cos(t2) + bw[0] * Math.sin(t2), bu[1] * Math.cos(t2) + bw[1] * Math.sin(t2), bu[2] * Math.cos(t2) + bw[2] * Math.sin(t2)], size: .22, col: i % 3 ? '200,180,255' : '255,210,170', a: .07 }); }
  /* nebula clouds placed around you (front is -Z, where the Cosmic Cliffs photo lives) */
  var clouds = [
    { v: norm([0, .15, 1]), size: .55, col: '230,80,140', a: .22 },  { v: norm([.25, .35, 1]), size: .35, col: '120,90,255', a: .2 },
    { v: norm([1, -.2, .2]), size: .45, col: '60,180,200', a: .18 },  { v: norm([-1, .4, .3]), size: .5, col: '255,140,60', a: .16 },
    { v: norm([0, 1, 0]), size: .6, col: '110,120,255', a: .14 },     { v: norm([-.6, -.8, .3]), size: .5, col: '160,60,200', a: .15 }
  ];
  /* distant worlds you only see when you turn around */
  var bodies = [
    { v: norm([.05, .12, 1]), size: .13, col: [214, 150, 90], ring: 1 },   /* big ringed giant directly behind */
    { v: norm([.35, -.05, .9]), size: .035, col: [200, 200, 210] },        /* its moon */
    { v: norm([1, .45, -.1]), size: .06, col: [90, 160, 220] },
    { v: norm([-1, -.15, .25]), size: .09, col: [180, 70, 70] },
    { v: norm([-.2, .95, .1]), size: .05, col: [235, 235, 225] }
  ];
  /* --- camera quaternion --- */
  function qmul(a, b) { return [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]]; }
  function qaxis(x, y, z, ang) { var s = Math.sin(ang / 2); return [x * s, y * s, z * s, Math.cos(ang / 2)]; }
  function qslerp(a, b, t) { var d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], s = d < 0 ? -1 : 1, o = []; for (var k = 0; k < 4; k++) o[k] = a[k] + (s * b[k] - a[k]) * t; var l = Math.hypot(o[0], o[1], o[2], o[3]); return o.map(function (x) { return x / l; }); }
  function rotInv(q, v) { /* rotate v by conjugate(q) */
    var x = -q[0], y = -q[1], z = -q[2], w = q[3], tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
    return [v[0] + w * tx + y * tz - z * ty, v[1] + w * ty + z * tx - x * tz, v[2] + w * tz + x * ty - y * tx]; }
  var D = Math.PI / 180, Q1 = [-Math.SQRT1_2, 0, 0, Math.SQRT1_2];
  function fromDevice(a, b, g, orient) { /* YXZ euler (beta, alpha, -gamma), as in three.js DeviceOrientationControls */
    var x = b * D / 2, y = a * D / 2, z = -g * D / 2, c1 = Math.cos(x), c2 = Math.cos(y), c3 = Math.cos(z), s1 = Math.sin(x), s2 = Math.sin(y), s3 = Math.sin(z);
    var q = [s1 * c2 * c3 + c1 * s2 * s3, c1 * s2 * c3 - s1 * c2 * s3, c1 * c2 * s3 - s1 * s2 * c3, c1 * c2 * c3 + s1 * s2 * s3];
    return qmul(qmul(q, Q1), qaxis(0, 0, 1, -orient * D)); }
  function fromLook(yaw, pitch) { return qmul(qaxis(0, 1, 0, yaw), qaxis(1, 0, 0, pitch)); }
  var cur = [0, 0, 0, 1], target = cur, gyro = false, a0 = null, yaw = 0, pitch = 0, drag = null, last = 0;
  function onOrient(e) {
    if (reduce.matches || e.alpha == null) return;
    if (a0 === null) a0 = e.alpha; /* first reading = facing the Cosmic Cliffs */
    gyro = true;
    var o = (screen.orientation && screen.orientation.angle) || window.orientation || 0;
    target = fromDevice(e.alpha - a0, e.beta, e.gamma, o);
  }
  addEventListener('deviceorientation', onOrient);
  var DOE = window.DeviceOrientationEvent;
  if (DOE && typeof DOE.requestPermission === 'function') {
    var ask = function () { removeEventListener('pointerdown', ask, true); try { DOE.requestPermission().catch(function () {}); } catch (e) {} };
    addEventListener('pointerdown', ask, true);
  }
  /* desktop: drag empty space to look around; otherwise a slow drift */
  addEventListener('pointerdown', function (e) { if (e.pointerType === 'mouse' && !e.target.closest('a,button,input,dialog,.nodrag')) drag = [e.clientX, e.clientY, yaw, pitch]; });
  addEventListener('pointermove', function (e) { if (drag) { yaw = drag[2] + (e.clientX - drag[0]) * .0035; pitch = Math.max(-1.4, Math.min(1.4, drag[3] + (e.clientY - drag[1]) * .0035)); } });
  addEventListener('pointerup', function () { drag = null; });
  function resize() { dpr = Math.min(devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); F = Math.max(W, H) * .6; }
  function proj(v) { var c = rotInv(cur, v); if (c[2] > -.05) return null; return [W / 2 + F * c[0] / -c[2], H / 2 - F * c[1] / -c[2], -c[2]]; }
  function blob(o) { var p = proj(o.v); if (!p) return; var r = F * o.size; if (p[0] < -r || p[0] > W + r || p[1] < -r || p[1] > H + r) return;
    var g = ctx.createRadialGradient(p[0], p[1], 0, p[0], p[1], r); g.addColorStop(0, 'rgba(' + o.col + ',' + o.a + ')'); g.addColorStop(1, 'rgba(' + o.col + ',0)'); ctx.fillStyle = g; ctx.fillRect(p[0] - r, p[1] - r, 2 * r, 2 * r); }
  function dots(list, t) { for (var i = 0; i < list.length; i++) { var st = list[i], p = proj(st.v); if (!p || p[0] < -2 || p[0] > W + 2 || p[1] < -2 || p[1] > H + 2) continue;
    var tw = st.s && !reduce.matches ? .55 + .45 * Math.sin(t * st.s + st.o) : 1; ctx.fillStyle = 'rgba(' + st.c + ',' + (st.a * tw).toFixed(3) + ')'; ctx.fillRect(p[0] - st.r, p[1] - st.r, st.r * 2, st.r * 2); } }
  function planet(b) { var p = proj(b.v); if (!p) return; var r = F * b.size * .5, c = b.col;
    if (p[0] < -3 * r || p[0] > W + 3 * r || p[1] < -3 * r || p[1] > H + 3 * r) return;
    if (b.ring) { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(-.35); ctx.scale(1, .26); ctx.strokeStyle = 'rgba(240,210,170,.45)'; ctx.lineWidth = r * .5; ctx.beginPath(); ctx.arc(0, 0, r * 1.9, Math.PI, 2 * Math.PI); ctx.stroke(); ctx.restore(); }
    var g = ctx.createRadialGradient(p[0] - r * .35, p[1] - r * .35, r * .1, p[0], p[1], r);
    g.addColorStop(0, 'rgb(' + c.map(function (x) { return Math.min(255, x + 60); }) + ')'); g.addColorStop(.6, 'rgb(' + c + ')'); g.addColorStop(1, 'rgb(' + c.map(function (x) { return x * .15 | 0; }) + ')');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.2832); ctx.fill();
    if (b.ring) { ctx.save(); ctx.translate(p[0], p[1]); ctx.rotate(-.35); ctx.scale(1, .26); ctx.beginPath(); ctx.arc(0, 0, r * 1.9, 0, Math.PI); ctx.stroke(); ctx.restore(); } }
  var raf = 0;
  function frame(t) {
    var dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    if (!gyro && !reduce.matches) { if (!drag) yaw += dt * .02; target = fromLook(yaw, pitch); }
    if (reduce.matches) target = [0, 0, 0, 1];
    cur = qslerp(cur, target, gyro ? .15 : .12);
    /* Cosmic Cliffs photo sits straight ahead; it fades as you turn away */
    var fwd = rotInv([-cur[0], -cur[1], -cur[2], cur[3]], [0, 0, -1]), d = -fwd[2];
    if (neb) neb.style.opacity = Math.max(0, Math.min(1, (d - .55) / .35)).toFixed(3);
    ctx.clearRect(0, 0, W, H);
    clouds.forEach(blob); glow.forEach(blob); dots(band, t); dots(stars, t); ctx.globalAlpha = .55; bodies.forEach(planet); ctx.globalAlpha = 1;
    for (var h = 0; h < hooks.length; h++) hooks[h]();
    raf = reduce.matches ? 0 : requestAnimationFrame(frame);
  }
  function start() { cancelAnimationFrame(raf); resize(); last = 0; raf = requestAnimationFrame(frame); }
  window.SKY = { proj: proj, hooks: hooks, F: function () { return F; } };
  start(); addEventListener('resize', start);
  if (reduce.addEventListener) reduce.addEventListener('change', start);
  document.addEventListener('visibilitychange', function () { if (document.hidden) cancelAnimationFrame(raf); else start(); });
})();
