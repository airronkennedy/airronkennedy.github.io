/* Counting Ducks: 1–3 ducks on a living pond. Every tap does something; no fail states. */
(function () {
  'use strict';
  var T = window.Toddler;
  var gen = 0, ducks = [], counted = {}, nTarget = 1, rounds = 0, busy = false;
  var SCENES = ['day', 'dawn', 'dusk', 'night'];
  var scene = 0;

  function quack(k) {
    var p = 1 + (k || 0) * 0.12;
    T.tone(280 * p, 0.16, { type: 'square', vol: 0.2, slide: 170 * p });
    T.tone(210 * p, 0.12, { type: 'sawtooth', vol: 0.1, at: 0.04, slide: 130 * p });
    T.noise(0.07, { freq: 900, vol: 0.1 });
  }
  function splash(x, y) {
    T.noise(0.18, { filter: 'bandpass', freq: 700, q: 0.5, vol: 0.22 });
    T.tone(420, 0.14, { type: 'sine', vol: 0.12, slide: 140 });
    var r = T.el('div', 'ripple');
    r.style.left = (x - 16) + 'px'; r.style.top = (y - 16) + 'px'; r.style.width = r.style.height = '32px';
    T.stage.appendChild(r);
    setTimeout(function () { r.remove(); }, 900);
  }
  function popNum(n, el) {
    var c = T.center(el);
    var p = T.el('div', 'num-pop'); p.textContent = String(n);
    p.style.left = c.x + 'px'; p.style.top = (c.y - 20) + 'px';
    document.body.appendChild(p);
    setTimeout(function () { p.remove(); }, 800);
  }

  function clearPond() {
    ducks.forEach(function (d) { d.remove(); });
    ducks = []; counted = {};
    [].slice.call(T.stage.querySelectorAll('.num-pop, .ripple')).forEach(function (n) { n.remove(); });
  }

  function paintScene() {
    var name = SCENES[scene % SCENES.length];
    T.stage.className = 'tg-stage scene-' + name;
    var sun = T.stage.querySelector('.sun');
    var moon = T.stage.querySelector('.moon');
    if (sun) sun.classList.toggle('hid', name === 'night');
    if (moon) moon.classList.toggle('hid', name !== 'night');
  }

  function buildWorld() {
    T.stage.innerHTML = '';
    T.stage.appendChild(T.el('div', 'sky'));
    var sun = T.el('div', 'sun'); T.stage.appendChild(sun);
    var moon = T.el('div', 'moon hid'); T.stage.appendChild(moon);
    var c1 = T.el('div', 'cloud'); c1.style.width = '18vmin'; c1.style.height = '6vmin'; c1.style.top = '16%'; c1.style.animationDuration = '50s';
    var c2 = T.el('div', 'cloud'); c2.style.width = '12vmin'; c2.style.height = '5vmin'; c2.style.top = '22%'; c2.style.animationDuration = '70s'; c2.style.animationDelay = '-20s';
    T.stage.appendChild(c1); T.stage.appendChild(c2);
    var water = T.el('div', 'water'); T.stage.appendChild(water);
    [8, 22, 78, 90].forEach(function (x, i) {
      var reed = T.el('div', 'reed' + (i % 2 ? ' r2' : ''));
      reed.style.left = x + '%';
      reed.style.animationDelay = (-i * 0.7) + 's';
      T.stage.appendChild(reed);
    });
    [18, 40, 70].forEach(function (x, i) {
      var lily = T.el('div', 'lily');
      lily.style.left = x + '%'; lily.style.bottom = (10 + i * 6) + '%';
      T.stage.appendChild(lily);
    });
    T.stage.addEventListener('pointerdown', function (ev) {
      if (ev.target.closest('.duck, .tg-btn, .tg-start, .tg-adult')) return;
      ev.preventDefault();
      T.unlockAudio && T.unlockAudio();
      splash(ev.clientX, ev.clientY);
      T.burst(ev.clientX, ev.clientY, { n: T.reduceMotion ? 4 : 8, colors: ['#b8e8ff', '#fff', '#7ec8f8'] });
      T.poke();
    });
    paintScene();
  }

  function makeDuck(i) {
    var d = T.el('div', 'duck tg-target d' + ((i % 3) + 1) + (i ? ' alt' : ''));
    d.innerHTML = '<div class="duck-inner"><div class="duck-body"><div class="duck-wing"></div></div><div class="duck-head"><div class="duck-eye"></div><div class="duck-bill"></div></div></div>';
    d.dataset.i = String(i);
    T.stage.appendChild(d);
    T.onTap(d, function (ev) {
      ev.stopPropagation();
      onDuck(d, i);
    });
    return d;
  }

  function layout() {
    var W = innerWidth, H = innerHeight, n = ducks.length;
    var top = Math.max(120, H * 0.28);
    var gap = Math.min(24, W * 0.03);
    var size = Math.max(120, Math.min(W, H) * 0.28);
    if (n > 0) size = Math.min(size, (W - 16 - (n - 1) * gap) / n);
    var total = n * size + (n - 1) * gap;
    var x0 = Math.max(8, (W - total) / 2);
    var y = Math.min(H * 0.52, H - size - 24);
    if (y < top) y = top;
    ducks.forEach(function (d, i) {
      d.style.width = d.style.height = size + 'px';
      d.style.left = (x0 + i * (size + gap)) + 'px';
      d.style.top = y + 'px';
    });
  }

  function onDuck(d, i) {
    if (busy && !Object.keys(counted).length) return;
    quack(i);
    T.bounce(d);
    d.classList.add('talk', 'counted');
    setTimeout(function () { d.classList.remove('talk'); }, 400);
    var c = T.center(d);
    T.burst(c.x, c.y, { n: T.reduceMotion ? 6 : 12, emoji: ['✨', '💧', '🦆'], spread: 100 });
    if (counted[i]) {
      T.sfx.tap();
      return;
    }
    counted[i] = true;
    var soFar = Object.keys(counted).length;
    popNum(soFar, d);
    T.sfx.note(soFar - 1);
    T.say(String(soFar), { rate: 0.92, pitch: 1.1 + soFar * 0.05 });
    if (soFar >= nTarget) finishRound(d);
  }

  function finishRound(last) {
    busy = true;
    var words = ['', 'one duck', 'two ducks', 'three ducks'];
    var my = gen;
    T.wait(500).then(function () {
      if (my !== gen) return;
      T.bigWord(nTarget === 1 ? '1' : nTarget === 2 ? '2' : '3');
      T.praise(words[nTarget] + '!');
      ducks.forEach(function (d) { T.bounce(d); quack(+d.dataset.i); });
      var c = last ? T.center(last) : { x: innerWidth / 2, y: innerHeight / 2 };
      T.burst(c.x, c.y, { n: T.reduceMotion ? 10 : 22, emoji: ['🦆', '⭐', '✨', '💧'], spread: 180 });
      var filled = T.reward(last || ducks[0]);
      if (!filled) { /* party already happens on jar fill */ }
      return T.wait(filled ? 2800 : 1800);
    }).then(function () {
      if (my !== gen) return;
      nextRound();
    });
  }

  function nextRound() {
    rounds++;
    scene = (scene + 1) % SCENES.length;
    /* Start with 1, then 2, then 3, cycling — first sessions favor smaller sets. */
    var cycle = [1, 1, 2, 2, 3, 2, 3, 1];
    nTarget = cycle[rounds % cycle.length];
    startRound();
  }

  function startRound() {
    var my = ++gen;
    busy = true;
    clearPond();
    paintScene();
    for (var i = 0; i < nTarget; i++) ducks.push(makeDuck(i));
    layout();
    T.idle(function () {
      var undone = ducks.filter(function (d) { return !counted[d.dataset.i]; });
      var t = undone.length ? T.pick(undone) : T.pick(ducks);
      if (t) { T.wiggle(t); T.say(undone.length ? 'Tap the ducks!' : 'Quack quack!'); }
    }, 7000);
    T.wait(200).then(function () {
      if (my !== gen) return;
      return countAloud(my, 0);
    }).then(function () {
      if (my !== gen) return;
      T.say('Can you tap the ducks?');
      busy = false;
    });
  }

  function countAloud(my, i) {
    if (my !== gen) return Promise.resolve();
    if (i >= ducks.length) return Promise.resolve();
    var d = ducks[i];
    T.bounce(d);
    d.classList.add('talk');
    setTimeout(function () { d.classList.remove('talk'); }, 350);
    quack(i);
    T.sfx.note(i);
    var words = ['One', 'Two', 'Three'];
    return T.say(words[i] + (i === ducks.length - 1 ? '.' : ','), { interrupt: i === 0, pitch: 1.1 + i * 0.06 }).then(function () {
      if (my !== gen) return;
      return T.wait(180).then(function () { return countAloud(my, i + 1); });
    });
  }

  T.init({
    title: 'Counting Ducks', icon: '🦆', color: '#f2cf3d', jarIcon: '🦆',
    intro: "Let's count ducks!",
    start: function () {
      buildWorld();
      nTarget = 1; rounds = 0; scene = 0;
      startRound();
      window.addEventListener('resize', layout);
    }
  });
})();
