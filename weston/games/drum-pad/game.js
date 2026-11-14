/* Music Pad: free play, copy-me, parade/freeze, and an animal band.
   Every pad maps to one sound. Nothing plays unless someone touches it (or taps GO).
   No fail states — copy-me never grades accuracy. */
(function () {
  'use strict';
  var T = window.Toddler;

  var PADS = [
    { id: 'drum',   icon: '🥁', name: 'Drum',   color: '#e8804f', emoji: ['💥', '🧡'] },
    { id: 'shaker', icon: '🫘', name: 'Shaker', color: '#f0a64a', emoji: ['✨', '💛'] },
    { id: 'bell',   icon: '🔔', name: 'Bell',   color: '#ffd86b', emoji: ['⭐', '💛'] },
    { id: 'block',  icon: '🪵', name: 'Block',  color: '#c9845a', emoji: ['🤎', '✨'] },
    { id: 'cymbal', icon: '💥', name: 'Crash',  color: '#7ee0ff', emoji: ['💧', '✨'] },
    { id: 'toot',   icon: '🎺', name: 'Toot',   color: '#9a7bf0', emoji: ['💜', '🎵'] }
  ];
  var MODES = [
    { id: 'free',   icon: '🥁', say: 'Drums! Tap to play.' },
    { id: 'echo',   icon: '👂', say: 'Copy me! You can play along.' },
    { id: 'parade', icon: '🥳', say: 'Parade! Tap go, then stop.' },
    { id: 'band',   icon: '🦊', say: 'Band time! Play with friends.' }
  ];
  var FRIENDS = [
    { id: 'fox',  icon: '🦊', need: 1 },
    { id: 'bird', icon: '🐦', need: 3 },
    { id: 'bear', icon: '🐻', need: 6 }
  ];

  function playSound(id) {
    if (id === 'drum') {
      T.sfx.drum();
      T.noise(0.14, { freq: 180, filter: 'lowpass', q: 0.6, vol: 0.45 });
    } else if (id === 'shaker') {
      T.noise(0.08, { freq: 4200, filter: 'bandpass', q: 0.8, vol: 0.35 });
      T.noise(0.07, { freq: 3200, filter: 'highpass', q: 0.5, vol: 0.22, at: 0.07 });
      T.noise(0.07, { freq: 3800, filter: 'bandpass', q: 0.7, vol: 0.2, at: 0.14 });
    } else if (id === 'bell') {
      T.tone(784, 0.7, { type: 'sine', vol: 0.42 });
      T.tone(1175, 0.55, { type: 'sine', vol: 0.22, at: 0.02 });
      T.tone(1568, 0.35, { type: 'triangle', vol: 0.12, at: 0.04 });
    } else if (id === 'block') {
      T.tone(420, 0.08, { type: 'square', vol: 0.18 });
      T.tone(210, 0.12, { type: 'triangle', vol: 0.4 });
      T.noise(0.05, { freq: 1400, filter: 'bandpass', q: 2, vol: 0.2 });
    } else if (id === 'cymbal') {
      T.noise(0.55, { freq: 5000, filter: 'highpass', q: 0.5, vol: 0.32 });
      T.tone(620, 0.25, { type: 'triangle', vol: 0.12, slide: 280 });
    } else {
      T.tone(392, 0.28, { type: 'square', vol: 0.16 });
      T.tone(784, 0.45, { type: 'triangle', vol: 0.4, slide: 620 });
    }
  }

  T.init({
    title: 'Music Pad', icon: '🥁', color: '#e8804f', jarIcon: '🎵',
    intro: 'Tap a drum!',
    start: function () { boot(); }
  });

  function boot() {
    var stage = T.stage;
    stage.classList.add('drum-stage');
    var tried = {};
    var hits = 0;
    var mode = 'free';
    var paradeOn = false;
    var paradeBeat = null;
    var echoPattern = [];
    var echoStep = 0;
    var echoBusy = false;
    var padEls = {};
    var friendEls = {};
    var unlocked = 0;

    var sky = T.el('div', 'drum-sky'); sky.setAttribute('data-scene', 'free');
    var hills = T.el('div', 'drum-hill'); sky.appendChild(hills);
    var stars = T.el('div', 'drum-stars');
    for (var i = 0; i < 12; i++) {
      var st = T.el('span', 'drum-star');
      st.style.left = (6 + i * 8 + (i % 3) * 3) + '%';
      st.style.top = (8 + (i % 5) * 7) + '%';
      st.style.animationDelay = (i * 0.2) + 's';
      stars.appendChild(st);
    }
    sky.appendChild(stars);
    stage.appendChild(sky);

    var banner = T.el('div', 'drum-banner'); stage.appendChild(banner);
    function flashBanner(txt) {
      banner.textContent = txt;
      banner.classList.add('show');
      setTimeout(function () { banner.classList.remove('show'); }, 1600);
    }

    var mascot = T.el('div', 'drum-mascot');
    mascot.innerHTML = '<div class="body">🦊</div>';
    stage.appendChild(mascot);

    var friends = T.el('div', 'drum-friends');
    FRIENDS.forEach(function (f) {
      var el = T.el('div', 'drum-friend'); el.textContent = f.icon; el.setAttribute('data-id', f.id);
      friends.appendChild(el); friendEls[f.id] = el;
    });
    stage.appendChild(friends);

    var padBox = T.el('div', 'drum-pads');
    PADS.forEach(function (p) {
      var b = T.el('button', 'tg-target drum-pad');
      b.setAttribute('aria-label', p.name);
      b.style.setProperty('--c', p.color);
      b.innerHTML = '<span class="rim"></span>' + p.icon;
      padBox.appendChild(b);
      padEls[p.id] = b;
      T.onTap(b, function (ev) { ev.stopPropagation(); hitPad(p, b); });
    });
    stage.appendChild(padBox);

    var dock = T.el('div', 'drum-dock');
    var modeBtns = {};
    MODES.forEach(function (m) {
      var b = T.el('button', 'drum-mode tg-target');
      b.textContent = m.icon;
      b.setAttribute('aria-label', m.id);
      if (m.id === 'free') b.classList.add('on');
      dock.appendChild(b);
      modeBtns[m.id] = b;
      T.onTap(b, function (ev) { ev.stopPropagation(); setMode(m.id); });
    });
    stage.appendChild(dock);

    var go = T.el('button', 'tg-target drum-go'); go.textContent = '▶️'; go.setAttribute('aria-label', 'Go');
    var stop = T.el('button', 'tg-target drum-stop'); stop.textContent = '⏹️'; stop.setAttribute('aria-label', 'Stop');
    stage.appendChild(go); stage.appendChild(stop);
    T.onTap(go, function (ev) { ev.stopPropagation(); startParade(); });
    T.onTap(stop, function (ev) { ev.stopPropagation(); stopParade(true); });

    /* A tap on empty space still sparkles — every touch does something. */
    stage.addEventListener('pointerdown', function (ev) {
      if (ev.target === stage || ev.target === sky || ev.target === hills || ev.target === stars || ev.target === padBox || ev.target === friends) {
        T.sfx.tap();
        T.burst(ev.clientX, ev.clientY, { n: 6, colors: ['#ffd86b', '#e8804f', '#fff'] });
      }
    });

    function uniqueTried() { return Object.keys(tried).length; }

    function revealFriends() {
      var n = uniqueTried();
      FRIENDS.forEach(function (f, i) {
        if (n >= f.need && !friendEls[f.id].classList.contains('in')) {
          friendEls[f.id].classList.add('in');
          unlocked++;
          T.sfx.chime();
          T.bigWord(f.icon);
          T.say('A new friend! ' + (f.id === 'fox' ? 'A fox!' : f.id === 'bird' ? 'A bird!' : 'A bear!'));
          T.reward(mascot);
        } else if (n >= f.need) friendEls[f.id].classList.add('in');
      });
    }

    function danceFriends(id) {
      var keys = Object.keys(friendEls);
      keys.forEach(function (k, i) {
        if (friendEls[k].classList.contains('in')) {
          friendEls[k].classList.remove('play');
          void friendEls[k].offsetWidth;
          if (!id || PADS[i] && PADS[i].id === id || true) {
            setTimeout(function () { friendEls[k].classList.add('play'); }, i * 40);
          }
        }
      });
    }

    function pressPad(el) {
      el.classList.add('pressed');
      setTimeout(function () { el.classList.remove('pressed'); }, 140);
    }

    function hitPad(p, el, fromEcho) {
      playSound(p.id);
      pressPad(el);
      var c = T.center(el);
      T.burst(c.x, c.y, { n: 10, emoji: p.emoji, spread: 110 });
      mascot.classList.add('hit');
      setTimeout(function () { mascot.classList.remove('hit'); }, 180);
      danceFriends(p.id);
      tried[p.id] = true;
      hits++;
      if (hits === 1) revealFriends();
      if (uniqueTried() >= 3) revealFriends();
      if (uniqueTried() >= 6) revealFriends();

      if (mode === 'echo' && !fromEcho && !echoBusy) {
        echoStep++;
        if (echoStep >= Math.max(1, echoPattern.length)) {
          finishEcho();
        }
      }

      if (hits % 5 === 0) {
        var filled = T.reward(el);
        T.praise(p.name + '!');
        if (filled) danceParty();
      } else {
        T.say(p.name + '!');
      }
    }

    function danceParty() {
      flashBanner('🎉');
      Object.keys(padEls).forEach(function (id, i) {
        setTimeout(function () { playSound(id); pressPad(padEls[id]); T.bounce(padEls[id]); }, 180 * i);
      });
    }

    function setMode(id) {
      if (id === mode && id !== 'echo') { T.sfx.tap(); return; }
      stopParade(false);
      mode = id;
      sky.setAttribute('data-scene', id);
      stage.classList.toggle('parade-on', id === 'parade');
      Object.keys(modeBtns).forEach(function (k) { modeBtns[k].classList.toggle('on', k === id); });
      var m = MODES.filter(function (x) { return x.id === id; })[0];
      T.sfx.whoosh();
      T.say(m.say);
      if (id === 'echo') startEcho();
      if (id === 'band') {
        revealFriends();
        if (!unlocked) { friendEls.fox.classList.add('in'); unlocked = 1; }
      }
      if (id === 'parade') flashBanner('▶️');
    }

    function startEcho() {
      echoBusy = true;
      echoStep = 0;
      var n = 1 + Math.min(2, Math.floor(hits / 6));
      echoPattern = [];
      for (var i = 0; i < n; i++) echoPattern.push(T.pick(PADS));
      T.wait(700).then(playEchoPattern);
    }

    function playEchoPattern() {
      if (mode !== 'echo') { echoBusy = false; return; }
      var i = 0;
      function step() {
        if (mode !== 'echo') { echoBusy = false; return; }
        if (i >= echoPattern.length) { echoBusy = false; T.say('Your turn!'); return; }
        var p = echoPattern[i++];
        var el = padEls[p.id];
        el.classList.add('glow');
        playSound(p.id);
        pressPad(el);
        T.bounce(el);
        setTimeout(function () { el.classList.remove('glow'); }, 380);
        setTimeout(step, 700);
      }
      step();
    }

    function finishEcho() {
      if (mode !== 'echo' || echoBusy) return;
      echoBusy = true;
      T.sfx.chime();
      T.bounce(mascot);
      var filled = T.reward(mascot);
      T.praise('You played too!');
      if (filled) danceParty();
      T.wait(1400).then(function () { if (mode === 'echo') startEcho(); });
    }

    function startParade() {
      if (paradeOn) return;
      paradeOn = true;
      go.classList.add('on');
      T.sfx.boing();
      T.say('Go!');
      flashBanner('🎵');
      var beat = 0;
      paradeBeat = setInterval(function () {
        if (!paradeOn) return;
        T.tone(180, 0.08, { type: 'sine', vol: 0.22 });
        if (beat % 2 === 0) T.tone(90, 0.1, { type: 'triangle', vol: 0.18 });
        beat++;
        mascot.classList.add('hit');
        setTimeout(function () { mascot.classList.remove('hit'); }, 140);
        danceFriends();
      }, 620);
    }

    function stopParade(sayIt) {
      paradeOn = false;
      go.classList.remove('on');
      if (paradeBeat) { clearInterval(paradeBeat); paradeBeat = null; }
      if (sayIt) { T.sfx.soft(); T.say('Stop! Freeze!'); flashBanner('❄️'); }
    }

    T.idle(function () {
      if (mode === 'echo' && !echoBusy) {
        var first = echoPattern[0] || PADS[0];
        T.wiggle(padEls[first.id]);
        T.say('Your turn! Tap a drum.');
      } else if (mode === 'parade' && !paradeOn) {
        T.wiggle(go);
        T.say('Tap go!');
      } else {
        var p = T.pick(PADS);
        T.wiggle(padEls[p.id]);
        T.say('Tap the ' + p.name.toLowerCase() + '!');
      }
    }, 8000);
  }
})();
