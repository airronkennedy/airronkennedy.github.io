/* Bubble Pop: tap floating bubbles to pop them. Cause & effect + pointing with one finger.
   Every touch does something: bubbles pop (pitch follows size), empty taps blow a stream of tiny bubbles,
   some bubbles hold a surprise friend who is named out loud, golden bubbles burst into a shower, scenes change. */
(function () {
  'use strict';
  var T = window.Toddler, S, scene, bubbles = [], last = 0, pops = 0, sceneIx = 0, decoEls = [];
  var SCENES = [
    { k: 'sea', deco: ['🐠', '🐟', '🐙', '🐢'], say: 'Bubbles in the sea!' },
    { k: 'sky', deco: ['☁️', '☁️', '🌈', '🐦'], say: 'Bubbles in the sky!' },
    { k: 'space', deco: ['🪐', '🌙', '⭐', '🚀'], say: 'Bubbles in space!' }
  ];
  var FRIENDS = [['🐟', 'A fish!'], ['🦆', 'A duck!'], ['⭐', 'A star!'], ['🐸', 'A frog!'], ['🐶', 'A puppy!'], ['🍎', 'An apple!'], ['🚗', 'A car!'], ['🐱', 'A kitty!'], ['🐝', 'A bee!'], ['🎈', 'A balloon!']];
  function W() { return innerWidth; } function H() { return innerHeight; }

  function setScene(i) {
    sceneIx = i % SCENES.length; var sc = SCENES[sceneIx];
    scene.className = 'scene ' + sc.k;
    decoEls.forEach(function (d) { d.remove(); }); decoEls = [];
    sc.deco.forEach(function (e, j) { var d = T.el('div', 'deco'); d.textContent = e; d.dataset.ph = j * 1.7; d.dataset.y = 18 + j * 19; scene.appendChild(d); decoEls.push(d); });
  }
  function spawn(o) {
    o = o || {};
    var s = o.size || T.rand(125, 195), b = T.el('div', 'bub' + (o.gold ? ' gold' : ''));
    b.style.width = b.style.height = s + 'px'; b.style.setProperty('--s', s + 'px'); b.style.setProperty('--h', (Math.random() * 360) | 0);
    var friend = o.gold ? ['✨', ''] : (!o.mini && Math.random() < .22 ? T.pick(FRIENDS) : null);
    if (friend) { var inn = T.el('div', 'in'); inn.textContent = friend[0]; b.appendChild(inn); }
    var it = { el: b, s: s, x: o.x != null ? o.x : T.rand(10, W() - s - 10), y: o.y != null ? o.y : H() + T.rand(10, 80), vy: T.rand(38, 70) * (T.reduceMotion ? .6 : 1), vx: o.vx || 0, ph: Math.random() * 6.28, friend: friend, gold: !!o.gold, born: performance.now() };
    T.onTap(b, function (ev) { pop(it, ev); });
    S.appendChild(b); bubbles.push(it); return it;
  }
  function pop(it, ev) {
    if (it.dead) return; it.dead = true;
    var cx = it.x + it.s / 2, cy = it.y + it.s / 2;
    T.sfx.pop(Math.max(0, 10 - (it.s - 120) / 10)); /* small = high, big = low */
    T.burst(cx, cy, { n: 12, colors: ['#ffffff', '#bfefff', 'hsl(' + it.el.style.getPropertyValue('--h') + ',100%,80%)'], spread: it.s * .9 });
    var r = T.el('div', 'ring'); r.style.width = r.style.height = it.s + 'px'; S.appendChild(r);
    r.animate([{ transform: 'translate(' + it.x + 'px,' + it.y + 'px) scale(.8)', opacity: 1 }, { transform: 'translate(' + it.x + 'px,' + it.y + 'px) scale(1.5)', opacity: 0 }], { duration: 400 }).onfinish = function () { r.remove(); };
    it.el.remove(); bubbles.splice(bubbles.indexOf(it), 1);
    pops++;
    if (it.gold) {
      T.sfx.sparkle(); T.bigWord('🌟'); T.say('Wow! A golden bubble!');
      for (var i = 0; i < 6; i++) spawn({ x: Math.min(W() - 130, Math.max(0, cx - 60 + T.rand(-160, 160))), y: Math.min(H() - 140, cy + T.rand(-60, 60)), size: T.rand(120, 140), vx: T.rand(-30, 30) });
    } else if (it.friend) {
      var d = T.el('div', 'drop'); d.textContent = it.friend[0]; S.appendChild(d);
      d.animate([{ transform: 'translate(' + (cx - 35) + 'px,' + (cy - 35) + 'px) scale(.5)' }, { transform: 'translate(' + (cx - 35) + 'px,' + (cy - 90) + 'px) scale(1.5)', offset: .35 },
        { transform: 'translate(' + (cx - 35) + 'px,' + (cy - 60) + 'px) scale(1.3)', opacity: 1, offset: .8 }, { transform: 'translate(' + (cx - 35) + 'px,' + (cy - 40) + 'px) scale(1)', opacity: 0 }], { duration: 1600 }).onfinish = function () { d.remove(); };
      T.sfx.boing(); T.say(it.friend[1]);
    } else if (pops % 4 === 0) T.say(T.pick(['Pop!', 'Pop pop!', 'Pop!']), { pitch: 1.3 });
    if (pops % 6 === 0) {
      var full = T.reward(null);
      if (full) setTimeout(function () { setScene(sceneIx + 1); T.say(SCENES[sceneIx].say); }, 3400);
    }
    if (pops % 13 === 0) setTimeout(function () { spawn({ gold: true, size: 220 }); T.sfx.chime(); }, 600);
  }
  /* empty-space touches: blow a stream of tiny bubbles from the finger */
  function wand(x, y) {
    T.tone(900 + Math.random() * 500, .07, { type: 'sine', vol: .12 });
    for (var i = 0; i < 3; i++) {
      var m = T.el('div', 'mini'), sz = T.rand(14, 34); m.style.width = m.style.height = sz + 'px'; S.appendChild(m);
      var dx = T.rand(-60, 60), dy = T.rand(-160, -60);
      m.animate([{ transform: 'translate(' + (x - sz / 2) + 'px,' + (y - sz / 2) + 'px)', opacity: .95 }, { transform: 'translate(' + (x + dx) + 'px,' + (y + dy) + 'px)', opacity: 0 }], { duration: T.rand(700, 1200), easing: 'ease-out' }).onfinish = (function (m) { return function () { m.remove(); }; })(m);
    }
  }
  function loop(t) {
    var dt = Math.min(.05, (t - (last || t)) / 1000); last = t;
    var want = W() > 700 ? 7 : 5;
    if (bubbles.length < want && Math.random() < .09) spawn();
    for (var i = bubbles.length - 1; i >= 0; i--) {
      var b = bubbles[i]; b.y -= b.vy * dt; b.x += (b.vx + Math.sin(t / 900 + b.ph) * 18) * dt; b.vx *= .98;
      b.x = Math.max(-20, Math.min(W() - b.s + 20, b.x));
      var sq = T.reduceMotion ? 1 : 1 + Math.sin(t / 300 + b.ph) * .035;
      b.el.style.transform = 'translate(' + b.x + 'px,' + b.y + 'px) scale(' + sq + ',' + (2 - sq) + ')';
      if (b.y < -b.s - 20) { b.el.remove(); bubbles.splice(i, 1); }
    }
    decoEls.forEach(function (d, j) { var ph = +d.dataset.ph; d.style.transform = 'translate(' + (((t / 60 + ph * 300) % (W() + 200)) - 100) + 'px,' + (H() * +d.dataset.y / 100 + Math.sin(t / 1200 + ph) * 14) + 'px)'; });
    requestAnimationFrame(loop);
  }
  T.init({
    title: 'Bubble Pop', icon: '🫧', color: '#4fb3e8', jarIcon: '⭐',
    intro: 'Pop the bubbles!',
    start: function () {
      S = T.stage; scene = T.el('div', 'scene'); S.appendChild(scene); setScene(0);
      S.addEventListener('pointerdown', function (e) { if (e.target === S || e.target === scene) { T.unlockAudio(); T.poke(); wand(e.clientX, e.clientY); } });
      S.addEventListener('pointermove', function (e) { if (e.buttons && (e.target === S || e.target === scene) && Math.random() < .35) wand(e.clientX, e.clientY); });
      for (var i = 0; i < 4; i++) spawn({ y: T.rand(H() * .35, H() * .8) });
      requestAnimationFrame(loop);
      T.idle(function () { var b = bubbles.filter(function (x) { return x.y > 100 && x.y < H() - 150; })[0]; if (b) b.el.animate([{ filter: 'brightness(1)' }, { filter: 'brightness(1.9)' }, { filter: 'brightness(1)' }], { duration: 800, iterations: 2 }); T.say('Pop the bubbles!'); }, 9000);
    }
  });
})();
