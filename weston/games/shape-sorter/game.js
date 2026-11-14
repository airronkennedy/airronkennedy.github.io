/* Shape Sorter: drag (or tap a hole to send) a friendly shape into the matching hole of the sorter box.
   Research-driven choices: shape names said every time a piece is touched or fits (CDC: name each piece),
   varied, non-standard versions of each shape (tall / tipped triangles, different sizes) so he learns what
   makes a triangle a triangle, piece colors are random so he matches by shape (not color), and a tap on a hole
   also works because dragging is harder than tapping at this age. */
(function () {
  'use strict';
  var T = window.Toddler;
  var HOLE = { circle: '<circle class="cut" cx="50" cy="50" r="44"/>', square: '<rect class="cut" x="7" y="7" width="86" height="86" rx="6"/>', triangle: '<polygon class="cut" points="50,5 95,90 5,90" stroke-linejoin="round"/>' };
  var VAR = {
    circle: ['<circle class="shp" cx="50" cy="50" r="44"/>'],
    square: ['<rect class="shp" x="7" y="7" width="86" height="86" rx="6"/>'],
    triangle: ['<polygon class="shp" points="50,5 95,90 5,90"/>', '<polygon class="shp" points="50,0 84,96 16,96"/>', '<polygon class="shp" points="8,6 94,92 8,92"/>']
  };
  var COLORS = ['#ff5d73', '#3fa7ff', '#ffd23f', '#41d67a', '#ff8c2e', '#b57bff', '#ff6fd0'];
  var room, box, holes = {}, piece = null, queue = [], placed = 0, round = 0, busy = false;

  function face() { return '<g class="face"><circle class="eye" cx="38" cy="46" r="8"/><circle class="eye" cx="62" cy="46" r="8"/><circle class="pup" cx="39" cy="47" r="4"/><circle class="pup" cx="63" cy="47" r="4"/>' +
    '<rect class="lid" x="28" y="36" width="44" height="20" rx="8"/><path class="mouth" d="M40 62 Q50 72 60 62"/></g>'; }
  function layoutHoles() {
    box.innerHTML = '';
    T.shuffle(['circle', 'square', 'triangle']).forEach(function (k) {
      var h = T.el('div', 'hole'); h.dataset.k = k; h.innerHTML = '<svg viewBox="0 0 100 100">' + HOLE[k] + '</svg>'; h.setAttribute('aria-label', k + ' hole');
      T.onTap(h, function () { if (piece && !busy && !piece.dragging) tryHole(h); else if (!piece) { T.sfx.tap(); T.wiggle(h); T.say(k); } });
      box.appendChild(h); holes[k] = h;
    });
  }
  function home() { var s = piece.size; return { x: innerWidth / 2 - s / 2 + piece.offx, y: Math.max(110, innerHeight * .3 - s / 2) }; }
  function moveTo(x, y, ms, rot) {
    piece.x = x; piece.y = y; var tr = 'translate(' + x + 'px,' + y + 'px) rotate(' + (rot != null ? rot : piece.rot) + 'deg)';
    if (ms) return piece.el.animate([{ transform: piece.el.style.transform }, { transform: tr }], { duration: ms, easing: 'cubic-bezier(.2,.8,.3,1.2)' }).finished.then(function () { piece.el.style.transform = tr; });
    piece.el.style.transform = tr; return Promise.resolve();
  }
  function newPiece() {
    if (!queue.length) return roundDone();
    var k = queue.shift(), s = T.rand(140, 175) * (innerWidth < 500 ? .85 : 1), col = T.pick(COLORS);
    var el = T.el('div', 'piece'); el.style.width = el.style.height = s + 'px'; el.style.setProperty('--pc', col);
    el.innerHTML = '<svg viewBox="0 0 100 100">' + T.pick(VAR[k]).replace('class="shp"', 'class="shp" fill="' + col + '"') + face() + '</svg>';
    room.appendChild(el);
    piece = { el: el, k: k, size: s, rot: k === 'circle' ? 0 : T.pick([0, 0, -12, 12, 20, -20]), offx: T.rand(-60, 60), dragging: false };
    var h = home(); moveTo(h.x, -s, 0); moveTo(h.x, h.y, 700); T.sfx.boing();
    T.wait(500).then(function () { T.say('A ' + k + '!'); });
    var moved = false, sx = 0, sy = 0;
    T.drag(el, {
      start: function (x, y) { if (busy) return; moved = false; sx = x; sy = y; piece.dragging = true; el.classList.add('held'); T.sfx.snap(); },
      move: function (x, y, ox, oy) { if (busy || !piece.dragging) return; if (Math.hypot(x - sx, y - sy) > 12) moved = true; moveTo(x - ox, y - oy, 0, 0); },
      end: function (x, y) {
        if (busy || !piece.dragging) return; piece.dragging = false; el.classList.remove('held');
        if (!moved) { T.bounce(el.firstChild); T.sfx.tap(); T.say(piece.k + '!'); moveTo(piece.x, piece.y, 0, piece.rot); return; }
        var hit = null; Object.keys(holes).forEach(function (k) { var r = holes[k].getBoundingClientRect(), pad = 40; if (x > r.left - pad && x < r.right + pad && y > r.top - pad && y < r.bottom + pad) hit = holes[k]; });
        if (hit) tryHole(hit); else { var hm = home(); moveTo(hm.x, hm.y, 500); T.sfx.boing(); }
      }
    });
    blinkLoop(el);
  }
  function blinkLoop(el) { setTimeout(function () { if (!el.isConnected) return; el.classList.remove('blink'); void el.offsetWidth; el.classList.add('blink'); blinkLoop(el); }, T.rand(1800, 4200)); }
  function tryHole(h) {
    busy = true; var r = h.getBoundingClientRect(), s = piece.size, k = piece.k;
    var cx = r.left + r.width / 2 - s / 2, cy = r.top + r.height / 2 - s / 2;
    if (h.dataset.k === k) {
      moveTo(cx, cy - 40, 350, 0).then(function () {
        var el = piece.el; T.tone(180, .25, { type: 'sine', slide: 90, vol: .7 }); T.noise(.12, { freq: 400, vol: .3 });
        return el.animate([{ transform: el.style.transform + ' scale(1)', opacity: 1 }, { transform: 'translate(' + cx + 'px,' + (cy + 30) + 'px) scale(.2)', opacity: 0 }], { duration: 380, easing: 'ease-in' }).finished;
      }).then(function () {
        piece.el.remove(); box.classList.remove('shake'); void box.offsetWidth; box.classList.add('shake');
        var c = T.center(h); T.burst(c.x, c.y - 30, { n: 8, colors: ['#fff36b', '#ffffff'] });
        return T.say(T.pick(['Yes! ', 'It fits! ', 'Plunk! ']) + 'The ' + k + ' goes in the ' + k + '!');
      }).then(function () { T.burst(innerWidth / 2, innerHeight * .4, { emoji: ['⭐', '✨', '🔺', '🟦', '🟡'] }); T.reward(h); placed++; piece = null; busy = false; return T.wait(700); }).then(newPiece);
    } else {
      /* not a fail: the piece bumps the rim, says what it is, and the right hole lights up */
      moveTo(cx, cy - 30, 300, piece.rot).then(function () { T.sfx.soft(); T.wiggle(piece.el.firstChild); return T.wait(300); })
        .then(function () { var hm = home(); return moveTo(hm.x, hm.y, 550); })
        .then(function () { glow(k); return T.say("That's a " + h.dataset.k + ' hole. Where does the ' + k + ' go?'); }).then(function () { busy = false; });
    }
  }
  function glow(k) { var h = holes[k]; h.classList.remove('glow'); void h.offsetWidth; h.classList.add('glow'); setTimeout(function () { h.classList.remove('glow'); }, 3100); }
  function roundDone() {
    busy = true; T.party({ emoji: ['🔺', '🟦', '🟡', '⭐', '🎉'] }); T.say('You sorted all the shapes! Circle, square, triangle!');
    /* the shapes pop back out and dance */
    ['circle', 'square', 'triangle'].forEach(function (k, i) {
      var d = T.el('div', 'dancer'), c = T.center(holes[k]); d.innerHTML = '<svg viewBox="0 0 100 100" style="width:100%;height:100%;overflow:visible">' + VAR[k][0].replace('class="shp"', 'fill="' + COLORS[i * 2] + '" stroke="#fff" stroke-width="5"') + '</svg>';
      room.appendChild(d);
      d.animate([{ transform: 'translate(' + (c.x - 60) + 'px,' + (c.y - 60) + 'px) scale(.3)' }, { transform: 'translate(' + (c.x - 60) + 'px,' + (innerHeight * .25) + 'px) scale(1.1) rotate(20deg)', offset: .4 },
        { transform: 'translate(' + (c.x - 60) + 'px,' + (innerHeight * .32) + 'px) scale(1) rotate(-20deg)', offset: .7 }, { transform: 'translate(' + (c.x - 60) + 'px,' + (c.y - 60) + 'px) scale(.3)', opacity: 0 }], { duration: 3000, delay: i * 200 }).onfinish = function () { d.remove(); };
    });
    setTimeout(function () { round++; layoutHoles(); startRound(); busy = false; }, 3600);
  }
  function startRound() {
    var base = T.shuffle(['circle', 'square', 'triangle']);
    queue = round === 0 ? base : base.concat([T.pick(base)]);
    newPiece();
  }
  T.init({
    title: 'Shape Sorter', icon: '🔺', color: '#9a7bf0', jarIcon: '⭐',
    start: function () {
      room = T.el('div', 'room'); box = T.el('div', 'box'); room.appendChild(box); T.stage.appendChild(room);
      room.addEventListener('pointerdown', function (e) { if (e.target === room) { T.sfx.tap(); T.burst(e.clientX, e.clientY, { emoji: ['✨'], n: 4, spread: 50 }); } });
      layoutHoles();
      T.say('Put the shapes in the box!').then(startRound);
      T.idle(function () { if (piece && !busy) { glow(piece.k); T.wiggle(piece.el.firstChild); T.say('Where does the ' + piece.k + ' go?'); } }, 8000);
      addEventListener('resize', function () { if (piece && !busy && !piece.dragging) { var h = home(); moveTo(h.x, h.y, 0); } });
    }
  });
})();
