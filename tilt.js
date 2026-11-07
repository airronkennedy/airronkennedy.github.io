/* Tilt parallax: phone orientation (or mouse on desktop) gently turns the sky around the viewer. */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var layers = [
    { el: document.querySelector('.nebula'), m: 0.4, r: 0.5 },
    { el: document.getElementById('stars'), m: 0.6, r: 0.8 },
    { el: document.getElementById('worlds'), m: 0.55, r: 0.6 }
  ].filter(function (l) { return l.el; });
  if (!layers.length) return;
  var tx = 0, ty = 0, tr = 0, cx = 0, cy = 0, cr = 0, raf = 0, base = null, active = false;
  var MAX = 30; /* px at full tilt for nearest layer */
  function clamp(v, a) { return Math.max(-a, Math.min(a, v)); }
  function wrap(d) { return ((d + 540) % 360) - 180; }
  function tick() {
    cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08; cr += (tr - cr) * 0.08;
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i], s = l.el.style;
      s.translate = (cx * MAX * l.m).toFixed(2) + 'px ' + (cy * MAX * l.m).toFixed(2) + 'px';
      s.rotate = (cr * l.r).toFixed(3) + 'deg';
    }
    if (Math.abs(tx - cx) + Math.abs(ty - cy) + Math.abs(tr - cr) > 0.001) raf = requestAnimationFrame(tick);
    else raf = 0;
  }
  function kick() { if (!raf && !reduce.matches) raf = requestAnimationFrame(tick); }
  function onOrient(e) {
    if (reduce.matches || e.gamma == null) return;
    active = true;
    if (!base) base = { a: e.alpha || 0, b: e.beta || 0 };
    tx = -clamp(e.gamma / 35, 1);
    ty = -clamp(((e.beta || 0) - base.b) / 35, 1);
    tr = clamp(wrap((e.alpha || 0) - base.a) / 12, 4); /* turning the phone rotates the sky slightly */
    kick();
  }
  function listen() { addEventListener('deviceorientation', onOrient); }
  var DOE = window.DeviceOrientationEvent;
  if (DOE) listen(); /* Android/Chrome: events flow right away (HTTPS only; silently nothing over HTTP). */
  if (DOE && typeof DOE.requestPermission === 'function') {
    /* iOS 13+: events stay silent until permission is asked from a user gesture; ask on the first tap anywhere. */
    var ask = function () {
      removeEventListener('pointerdown', ask, true);
      try { DOE.requestPermission().catch(function () {}); } catch (err) {}
    };
    addEventListener('pointerdown', ask, true);
  }
  /* Desktop: gentle mouse parallax. */
  addEventListener('mousemove', function (e) {
    if (active || reduce.matches) return;
    tx = -(e.clientX / innerWidth - 0.5) * 0.8;
    ty = -(e.clientY / innerHeight - 0.5) * 0.8;
    tr = (e.clientX / innerWidth - 0.5) * 1.2;
    kick();
  });
  addEventListener('orientationchange', function () { base = null; });
  function reset() { tx = ty = tr = 0; if (reduce.matches) { layers.forEach(function (l) { l.el.style.translate = ''; l.el.style.rotate = ''; }); } else kick(); }
  if (reduce.addEventListener) reduce.addEventListener('change', reset);
})();
