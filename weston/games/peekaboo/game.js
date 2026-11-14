/* Peekaboo: a friend hides under a huge cover; a tap always reveals someone, never a fail. */
(function () {
  'use strict';
  var T = window.Toddler;
  var FRIENDS = [
    { id: 'teddy', name: 'Teddy', pitch: 0.95 },
    { id: 'puppy', name: 'Puppy', pitch: 1.15 },
    { id: 'kitty', name: 'Kitty', pitch: 1.25 },
    { id: 'bunny', name: 'Bunny', pitch: 1.2 },
    { id: 'duckling', name: 'Duck', pitch: 1.1 }
  ];
  var COVERS = [
    { id: 'blanket', name: 'blanket' },
    { id: 'leaf', name: 'leaf' },
    { id: 'box', name: 'box' },
    { id: 'cushion', name: 'cushion' },
    { id: 'hands', name: 'hands' }
  ];
  var SCENES = ['room', 'garden', 'night', 'beach'];
  var gen = 0, rounds = 0, friend, coverKind, nCovers = 1, hiding = false, found = false, hiddenAt = 0;
  var friendEl, covers = [], lump, worldReady = false;

  function giggle(p) {
    T.tone(520 * (p || 1), 0.12, { type: 'sine', vol: 0.28, slide: 700 * (p || 1) });
    T.tone(640 * (p || 1), 0.1, { type: 'triangle', vol: 0.18, at: 0.08 });
  }
  function rustle() {
    T.sfx.whoosh();
    T.noise(0.2, { filter: 'bandpass', freq: 1400, q: 0.7, vol: 0.18 });
  }

  function coverArt(kind) {
    if (kind === 'blanket') return '<div class="cover-art"><div class="cv-blanket"></div></div>';
    if (kind === 'leaf') return '<div class="cover-art"><div class="cv-leaf"></div></div>';
    if (kind === 'box') return '<div class="cover-art"><div class="cv-box"></div></div>';
    if (kind === 'cushion') return '<div class="cover-art"><div class="cv-cushion"></div></div>';
    return '<div class="cover-art"><div class="cv-hands"><span></span><span></span></div></div>';
  }

  function buddyHtml(id) {
    return '<div class="buddy ' + id + '"><div class="ear l"></div><div class="ear r"></div><div class="body"></div><div class="head"><div class="eyes"><div class="eye"></div><div class="eye"></div></div><div class="snout"></div><div class="nose"></div></div></div>';
  }

  function buildWorld() {
    T.stage.innerHTML = '';
    T.stage.appendChild(T.el('div', 'wall'));
    T.stage.appendChild(T.el('div', 'window'));
    T.stage.appendChild(T.el('div', 'floor'));
    T.stage.appendChild(T.el('div', 'rug'));
    lump = T.el('div', 'lump'); T.stage.appendChild(lump);
    friendEl = T.el('div', 'friend tg-target');
    T.stage.appendChild(friendEl);
    T.onTap(friendEl, function (ev) {
      ev.stopPropagation();
      if (found || !hiding) {
        var b = friendEl.querySelector('.buddy');
        if (b) b.classList.remove('wave'); void (b && b.offsetWidth); if (b) b.classList.add('wave');
        giggle(friend.pitch);
        T.sfx.tap();
        var c = T.center(friendEl);
        T.burst(c.x, c.y, { n: 8, emoji: ['💖', '✨'] });
        T.say(friend.name + '!');
      }
    });
    T.stage.addEventListener('pointerdown', function (ev) {
      if (ev.target.closest('.cover, .friend, .tg-btn, .tg-start, .tg-adult')) return;
      ev.preventDefault();
      T.unlockAudio && T.unlockAudio();
      T.sfx.soft();
      T.burst(ev.clientX, ev.clientY, { n: T.reduceMotion ? 4 : 8, emoji: ['✨'] });
      if (hiding && !found) {
        var right = covers[hiddenAt];
        if (right) { T.wiggle(right); if (lump) T.wiggle(lump); }
        T.say("Where's " + friend.name + '? Under the ' + coverKind.name + '!');
      }
      T.poke();
    });
    worldReady = true;
  }

  function setScene() {
    T.stage.className = 'tg-stage scene-' + SCENES[rounds % SCENES.length];
  }

  function layout() {
    var W = innerWidth, H = innerHeight;
    var top = Math.max(88, Math.min(120, H * 0.22));
    var fSize = Math.max(160, Math.min(W, H) * 0.32);
    if (fSize > H - top - 48) fSize = Math.max(160, H - top - 48);
    var y = Math.min(H * 0.38, H - fSize - 40);
    if (y < top) y = top;
    if (friendEl) {
      friendEl.style.width = friendEl.style.height = fSize + 'px';
      friendEl.style.left = ((W - fSize) / 2) + 'px';
      friendEl.style.top = y + 'px';
    }
    var cW = Math.max(180, Math.min(W * 0.42, 320));
    var cH = Math.max(160, cW * 0.85);
    var cTop = y + fSize * 0.22;
    if (cTop + cH > H - 8) {
      cH = Math.max(160, H - 8 - cTop);
      cW = Math.max(180, Math.min(cW, cH / 0.85));
    }
    if (covers.length === 1) {
      covers[0].style.width = cW + 'px'; covers[0].style.height = cH + 'px';
      covers[0].style.left = ((W - cW) / 2) + 'px';
      covers[0].style.top = cTop + 'px';
    } else if (covers.length === 2) {
      var gap = 24;
      var total = cW * 2 + gap;
      if (total > W - 16) { cW = (W - 16 - gap) / 2; cH = cW * 0.85; }
      var x0 = (W - (cW * 2 + gap)) / 2;
      covers.forEach(function (cv, i) {
        cv.style.width = cW + 'px'; cv.style.height = cH + 'px';
        cv.style.left = (x0 + i * (cW + gap)) + 'px';
        cv.style.top = (y + fSize * 0.18) + 'px';
      });
    }
    if (lump && covers[hiddenAt]) {
      var cr = covers[hiddenAt].getBoundingClientRect();
      lump.style.left = (cr.left + cr.width * 0.3) + 'px';
      lump.style.top = (cr.top + cr.height * 0.35) + 'px';
    }
  }
  /* Disable left/top transitions for one frame so a short landscape clamp doesn't flash the friend mid-move. */
  function snapLayout() {
    var els = [friendEl, lump].concat(covers);
    els.forEach(function (e) { if (e) e.style.transition = 'none'; });
    layout();
    els.forEach(function (e) { if (e) void e.offsetWidth; });
    els.forEach(function (e) { if (e) e.style.transition = ''; });
  }

  function clearCovers() {
    covers.forEach(function (c) { c.remove(); });
    covers = [];
    if (lump) lump.classList.remove('show');
  }

  function makeCover(kind, index) {
    var cv = T.el('div', 'cover tg-target');
    cv.innerHTML = coverArt(kind.id);
    cv.dataset.i = String(index);
    T.stage.appendChild(cv);
    T.onTap(cv, function (ev) {
      ev.stopPropagation();
      onCover(cv, index);
    });
    return cv;
  }

  function onCover(cv, index) {
    if (!hiding || found) {
      T.sfx.tap();
      T.wiggle(cv);
      return;
    }
    if (index !== hiddenAt) {
      T.sfx.soft();
      T.wiggle(cv);
      T.say('Not here…');
      var right = covers[hiddenAt];
      if (right) T.wiggle(right);
      if (lump) T.wiggle(lump);
      return;
    }
    reveal(cv);
  }

  function reveal(cv) {
    found = true;
    hiding = false;
    if (lump) lump.classList.remove('show');
    rustle();
    cv.classList.add('lifted');
    friendEl.classList.remove('hid');
    friendEl.classList.add('found');
    var b = friendEl.querySelector('.buddy');
    if (b) { b.classList.remove('dance'); void b.offsetWidth; b.classList.add('dance'); }
    giggle(friend.pitch);
    var c = T.center(friendEl);
    T.burst(c.x, c.y, { n: T.reduceMotion ? 10 : 22, emoji: ['💖', '✨', '⭐', '🎉'], spread: 160 });
    T.bigWord('🙈');
    var my = gen;
    T.say('Peekaboo! There\'s ' + friend.name + '!').then(function () {
      if (my !== gen) return;
      T.praise('You found ' + friend.name + '!');
    });
    var filled = T.reward(friendEl);
    T.wait(filled ? 3000 : 2200).then(function () {
      if (my !== gen) return;
      nextRound();
    });
  }

  function nextRound() {
    rounds++;
    /* After a few one-cover finds, sometimes use two cushions. */
    nCovers = (rounds >= 3 && rounds % 4 !== 0) ? 2 : 1;
    startRound();
  }

  function startRound() {
    var my = ++gen;
    found = false; hiding = false;
    clearCovers();
    setScene();
    friend = FRIENDS[rounds % FRIENDS.length];
    coverKind = nCovers === 2 ? { id: 'cushion', name: 'cushion' } : COVERS[rounds % COVERS.length];
    hiddenAt = nCovers === 2 ? (Math.random() < 0.5 ? 0 : 1) : 0;

    friendEl.innerHTML = buddyHtml(friend.id);
    friendEl.classList.remove('hid', 'found');
    layout();

    T.idle(function () {
      if (hiding && !found) {
        if (lump) T.wiggle(lump);
        var right = covers[hiddenAt];
        if (right) T.wiggle(right);
        giggle(friend.pitch * 0.8);
        T.say("Where's " + friend.name + '?');
      } else if (!hiding) {
        T.wiggle(friendEl);
      }
    }, 6500);

    var intro = T.wait(150).then(function () {
      if (my !== gen) return;
      var b = friendEl.querySelector('.buddy');
      if (b) { b.classList.remove('wave'); void b.offsetWidth; b.classList.add('wave'); }
      giggle(friend.pitch);
      return T.say("It's " + friend.name + '!');
    }).then(function () {
      if (my !== gen) return T.wait(0);
      return T.wait(400);
    }).then(function () {
      if (my !== gen) return;
      /* Covers appear first so we can watch the friend go under one. */
      for (var i = 0; i < nCovers; i++) covers.push(makeCover(coverKind, i));
      snapLayout();
      T.say('Peekaboo? Hide, ' + friend.name + '!');
      rustle();
      return T.wait(550);
    }).then(function () {
      if (my !== gen) return;
      snapLayout();
      friendEl.classList.add('hid');
      hiding = true; found = false;
      if (lump) lump.classList.add('show');
      snapLayout();
      return T.wait(350);
    }).then(function () {
      if (my !== gen) return;
      T.say("Where's " + friend.name + '?');
    });
    return intro;
  }

  T.init({
    title: 'Peekaboo', icon: '🙈', color: '#5cc99a', jarIcon: '💖',
    intro: "Peekaboo! Let's find our friends!",
    start: function () {
      buildWorld();
      rounds = 0; nCovers = 1;
      startRound();
      window.addEventListener('resize', snapLayout);
    }
  });
})();
