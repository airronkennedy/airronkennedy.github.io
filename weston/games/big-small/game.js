/* Big & Small: two same-kind friends, a huge size gap, no fail states. */
(function () {
  'use strict';
  var T = window.Toddler;
  var KINDS = [
    { id: 'duck', name: 'duck', emoji: '🦆' },
    { id: 'bear', name: 'bear', emoji: '🐻' },
    { id: 'cup', name: 'cup', emoji: '🥤' },
    { id: 'truck', name: 'truck', emoji: '🚚' },
    { id: 'apple', name: 'apple', emoji: '🍎' },
    { id: 'elephant', name: 'elephant', emoji: '🐘' },
    { id: 'ball', name: 'ball', emoji: '⚽' }
  ];
  var SCENES = ['meadow', 'room', 'sky', 'dusk'];
  var gen = 0, rounds = 0, kind, askBig = true, locked = false;
  var bigEl, littleEl, doorRow;

  function figHtml(id) {
    var extra = '';
    if (id === 'duck') extra = '<div class="bill"></div>';
    if (id === 'bear') extra = '<div class="ear l"></div><div class="ear r"></div>';
    if (id === 'cup') extra = '<div class="handle"></div>';
    if (id === 'truck') extra = '<div class="wheel l"></div><div class="wheel r"></div>';
    if (id === 'elephant') extra = '<div class="ear"></div><div class="trunk"></div>';
    return '<div class="fig ' + id + '">' + extra +
      '<div class="body-shape"></div><div class="head-shape"></div>' +
      '<div class="fig-eye l"></div><div class="fig-eye r"></div></div>';
  }

  function boop(isBig) {
    if (isBig) {
      T.tone(220, 0.2, { type: 'triangle', vol: 0.35, slide: 180 });
      T.tone(160, 0.22, { type: 'sine', vol: 0.2 });
    } else {
      T.tone(520, 0.16, { type: 'triangle', vol: 0.3, slide: 680 });
      T.tone(740, 0.12, { type: 'sine', vol: 0.18, at: 0.05 });
    }
  }

  function buildWorld() {
    T.stage.innerHTML = '';
    T.stage.appendChild(T.el('div', 'sky'));
    var ha = T.el('div', 'hill a'); var hb = T.el('div', 'hill b');
    T.stage.appendChild(ha); T.stage.appendChild(hb);
    T.stage.appendChild(T.el('div', 'ground'));
    doorRow = T.el('div', 'door-row');
    doorRow.innerHTML = '<div class="door big"></div><div class="door little"></div>';
    T.stage.appendChild(doorRow);
    T.stage.addEventListener('pointerdown', function (ev) {
      if (ev.target.closest('.size-char, .tg-btn, .tg-start, .tg-adult')) return;
      ev.preventDefault();
      T.unlockAudio && T.unlockAudio();
      T.sfx.tap();
      T.burst(ev.clientX, ev.clientY, { n: T.reduceMotion ? 4 : 8, colors: ['#ffd86b', '#fff', '#7fa6c9'] });
      T.poke();
    });
  }

  function setScene() {
    T.stage.className = 'tg-stage scene-' + SCENES[rounds % SCENES.length];
  }

  function layout() {
    var W = innerWidth, H = innerHeight;
    var top = Math.max(120, H * 0.2);
    var big = Math.max(200, Math.min(W * 0.42, H * 0.46));
    var little = Math.max(130, big * 0.52);
    var y = Math.min(H * 0.34, H - big - 20);
    if (y < top) y = top;
    var gap = Math.max(16, W * 0.04);
    /* Put the two side by side; which side is big alternates. */
    var bigLeft = (rounds % 2 === 0);
    var total = big + little + gap;
    var x0 = Math.max(8, (W - total) / 2);
    if (bigEl && littleEl) {
      bigEl.style.width = bigEl.style.height = big + 'px';
      littleEl.style.width = littleEl.style.height = little + 'px';
      if (bigLeft) {
        bigEl.style.left = x0 + 'px';
        littleEl.style.left = (x0 + big + gap) + 'px';
      } else {
        littleEl.style.left = x0 + 'px';
        bigEl.style.left = (x0 + little + gap) + 'px';
      }
      bigEl.style.top = y + 'px';
      /* Align bottoms so size contrast is obvious. */
      littleEl.style.top = (y + (big - little)) + 'px';
    }
  }

  function clearChars() {
    if (bigEl) bigEl.remove();
    if (littleEl) littleEl.remove();
    bigEl = littleEl = null;
    if (doorRow) doorRow.classList.remove('show');
  }

  function makeChar(isBig) {
    var el = T.el('div', 'size-char tg-target ' + (isBig ? 'big' : 'little'));
    el.innerHTML = figHtml(kind.id);
    el.dataset.size = isBig ? 'big' : 'little';
    T.stage.appendChild(el);
    T.onTap(el, function (ev) {
      ev.stopPropagation();
      onChar(el, isBig);
    });
    return el;
  }

  function onChar(el, isBig) {
    if (locked) {
      boop(isBig);
      T.bounce(el);
      return;
    }
    var wanted = askBig;
    boop(isBig);
    T.bounce(el);
    var c = T.center(el);
    T.burst(c.x, c.y, { n: 8, emoji: [kind.emoji, '✨'] });
    if (isBig === wanted) {
      success(el, isBig);
    } else {
      /* Kind truth, then a wiggle on the one we asked for. Never a fail. */
      T.sfx.soft();
      var otherWord = isBig ? 'big' : 'little';
      var wantWord = wanted ? 'big' : 'little';
      T.say("That's the " + otherWord + ' ' + kind.name + '! This one is ' + wantWord + '.');
      var right = wanted ? bigEl : littleEl;
      if (right) {
        T.wiggle(right);
        right.classList.add('glow');
        setTimeout(function () { right.classList.remove('glow'); }, 1600);
      }
    }
  }

  function success(el, isBig) {
    locked = true;
    var word = isBig ? 'big' : 'little';
    el.classList.add('celebrate', 'glow');
    T.sfx.chime();
    var c = T.center(el);
    T.burst(c.x, c.y, {
      n: T.reduceMotion ? 10 : 24,
      emoji: isBig ? ['⭐', kind.emoji, '✨'] : ['✨', kind.emoji, '💛'],
      spread: isBig ? 200 : 120
    });
    if (isBig) T.bigWord(kind.emoji); else T.bigWord('✨');
    var my = gen;
    T.say('Yes! That is the ' + word + ' ' + kind.name + '!').then(function () {
      if (my !== gen) return;
      T.praise();
    });
    var filled = T.reward(el);
    /* Occasional big-door / little-door payoff, still about size. */
    if (rounds % 2 === 1 && doorRow) {
      doorRow.classList.add('show');
    }
    T.wait(filled ? 3000 : 2000).then(function () {
      if (my !== gen) return;
      nextRound();
    });
  }

  function nextRound() {
    rounds++;
    startRound();
  }

  function startRound() {
    var my = ++gen;
    locked = true;
    clearChars();
    setScene();
    kind = KINDS[rounds % KINDS.length];
    askBig = rounds % 2 === 0;
    bigEl = makeChar(true);
    littleEl = makeChar(false);
    layout();

    T.idle(function () {
      var right = askBig ? bigEl : littleEl;
      if (right) T.wiggle(right);
      T.say('Where is the ' + (askBig ? 'big' : 'little') + ' ' + kind.name + '?');
    }, 7000);

    T.wait(200).then(function () {
      if (my !== gen) return;
      var label = 'Look! A big ' + kind.name + ' and a little ' + kind.name + '.';
      return T.say(label);
    }).then(function () {
      if (my !== gen) return T.wait(0);
      return T.wait(250);
    }).then(function () {
      if (my !== gen) return;
      locked = false;
      T.say('Where is the ' + (askBig ? 'big' : 'little') + ' ' + kind.name + '?');
    });
  }

  T.init({
    title: 'Big & Small', icon: '🐘', color: '#7fa6c9', jarIcon: '⭐',
    intro: "Let's find the big one and the little one!",
    start: function () {
      buildWorld();
      rounds = 0;
      startRound();
      window.addEventListener('resize', layout);
    }
  });
})();
