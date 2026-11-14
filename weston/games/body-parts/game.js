/* Weston’s Planet — Touch Your Nose (game 10). Find, on-you, song, friends. No fail, no camera. */
(function () {
  var T = window.Toddler;

  var PARTS = {
    eyes:    { say: 'eyes',    icon: '👀', face: true },
    nose:    { say: 'nose',    icon: '👃', face: true },
    mouth:   { say: 'mouth',   icon: '👄', face: true },
    hair:    { say: 'hair',    icon: '🟡', face: true, prompt: 'hair' },
    ears:    { say: 'ears',    icon: '👂', face: true },
    head:    { say: 'head',    icon: '🙂', face: true },
    tummy:   { say: 'tummy',   icon: '🟡', face: false },
    hands:   { say: 'hands',   icon: '✋', face: false },
    feet:    { say: 'feet',    icon: '🦶', face: false },
    toes:    { say: 'toes',    icon: '👣', face: false },
    knees:   { say: 'knees',   icon: '🦵', face: false },
    arms:    { say: 'arms',    icon: '💪', face: false },
    legs:    { say: 'legs',    icon: '🦵', face: false },
    shoulders:{ say: 'shoulders', icon: '👕', face: false, alias: 'arms' }
  };
  var EASY = ['eyes', 'nose', 'mouth', 'hair', 'ears'];
  var NEXT = ['tummy', 'hands', 'feet', 'toes', 'head'];
  var LATER = ['knees', 'arms', 'legs'];

  var FRIENDS = [
    { id: 'kid',   icon: '😊', say: 'our friend', unlock: 0,  skin: '#f3c7a3', hair: '#5a3a22', shirt: '#7ec8e8', pants: '#4a7c59', shoes: '#3d2a18' },
    { id: 'bear',  icon: '🐻', say: 'the bear',   unlock: 5,  skin: '#c4894a', hair: '#7a4a22', shirt: '#e8a07c', pants: '#6b3f22', shoes: '#3d2a18' },
    { id: 'robot', icon: '🤖', say: 'the robot',  unlock: 10, skin: '#9aa7b8', hair: '#5c6b7a', shirt: '#e8804f', pants: '#3d4a5c', shoes: '#1a2030' }
  ];
  var HATS = ['🎩', '🎀', '👑', '🌼'];

  var mode = 'find';
  var friend = FRIENDS[0];
  var target = 'nose';
  var finds = 0;
  var stars = 0;
  var busy = false;
  var singing = false;
  var hat = '';

  var FACE_AS_HEAD = { eyes: 1, nose: 1, mouth: 1, hair: 1, ears: 1, head: 1 };

  function pool() {
    var p = EASY.slice();
    if (finds >= 4) p = p.concat(NEXT);
    if (finds >= 8) p = p.concat(LATER);
    return p;
  }

  function pickTarget(avoid) {
    var p = pool().filter(function (id) { return id !== avoid; });
    if (!p.length) p = EASY.slice();
    return T.pick(p);
  }

  function partMeta(id) { return PARTS[id] || PARTS.nose; }

  function setMode(id) {
    mode = id;
    document.querySelectorAll('.bp-mode').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-mode') === id);
    });
    document.querySelector('.bp-sky').setAttribute('data-scene', id);
    document.querySelector('.bp-confirm').classList.toggle('show', id === 'you');
    document.querySelector('.bp-sing').classList.toggle('show', id === 'song');
    T.stage.classList.toggle('has-bar', id === 'you' || id === 'song');
    document.querySelector('.bp-book').classList.toggle('show', id === 'friends');
    document.querySelector('.bp-stage-area').style.display = id === 'friends' ? 'none' : '';
    document.querySelector('.bp-prompt').style.display = id === 'friends' ? 'none' : '';
    singing = false;
    clearGlow();
    if (id === 'friends') {
      renderBook();
      T.say('Pick a friend!');
    } else if (id === 'song') {
      showView(false);
      setPrompt('🎵', 'song');
      T.say('Tap the star to sing together!');
    } else if (id === 'you') {
      nextPrompt(true);
    } else {
      nextPrompt(true);
    }
  }

  function setFriend(f) {
    friend = f;
    var fig = document.querySelector('.bp-figure');
    fig.setAttribute('data-who', f.id);
    fig.style.setProperty('--skin', f.skin);
    fig.style.setProperty('--hair', f.hair);
    fig.style.setProperty('--shirt', f.shirt);
    fig.style.setProperty('--pants', f.pants);
    fig.style.setProperty('--shoes', f.shoes);
    var hatEl = document.querySelector('.bp-hat');
    hatEl.textContent = hat;
    hatEl.classList.toggle('on', !!hat);
  }

  function showView(face) {
    var fig = document.querySelector('.bp-figure');
    fig.classList.toggle('view-face', !!face);
    fig.classList.toggle('view-body', !face);
    requestAnimationFrame(keepPartsOnStage);
  }

  function setPrompt(icon, partId) {
    var el = document.querySelector('.bp-prompt');
    el.textContent = icon;
    el.setAttribute('data-part', partId || '');
    if (partId === 'hair') el.textContent = '';
    el.classList.remove('pulse');
    void el.offsetWidth;
    el.classList.add('pulse');
  }

  function clearGlow() {
    document.querySelectorAll('.bp-part').forEach(function (p) {
      p.classList.remove('glow', 'hint');
    });
  }

  function glow(id) {
    clearGlow();
    document.querySelectorAll('.bp-part[data-part="' + (PARTS[id] && PARTS[id].alias || id) + '"]').forEach(function (p) {
      p.classList.add('glow');
    });
  }

  function hint(id) {
    var sel = PARTS[id] && PARTS[id].alias ? PARTS[id].alias : id;
    document.querySelectorAll('.bp-part[data-part="' + sel + '"]').forEach(function (p) {
      p.classList.remove('hint');
      void p.offsetWidth;
      p.classList.add('hint');
      T.wiggle(p);
    });
  }

  function nextPrompt(fresh) {
    if (mode === 'friends' || mode === 'song') return;
    if (!fresh) target = pickTarget(target);
    else target = pickTarget('');
    var meta = partMeta(target);
    showView(meta.face);
    setPrompt(meta.icon, target);
    clearGlow();
    if (mode === 'you') {
      glow(target);
      T.say('Can you show me your ' + meta.say + '?');
    } else {
      T.say('Where is the ' + meta.say + '?');
    }
  }

  function found(atX, atY, word) {
    finds += 1;
    stars += 1;
    busy = true;
    T.sfx.sparkle();
    T.burst(atX, atY, { n: 12, emoji: [partMeta(target).icon, '⭐', '💛'] });
    T.bigWord(partMeta(target).icon);
    T.reward();
    T.bounce(document.querySelector('.bp-figure'));
    T.praise(word || ('The ' + partMeta(target).say + '!'));
    if (finds % 5 === 0) {
      T.party({ emoji: ['⭐', '💛', '🎉', partMeta(target).icon] });
      maybeUnlock();
    }
    setTimeout(function () {
      busy = false;
      if (mode === 'find' || mode === 'you') nextPrompt(false);
    }, 1400);
  }

  function maybeUnlock() {
    var next = FRIENDS.filter(function (f) { return f.unlock > 0 && stars >= f.unlock; })[0];
    if (next && !document.querySelector('.bp-card[data-id="' + next.id + '"]')) {
      /* book is rebuilt on open; just announce */
    }
    FRIENDS.forEach(function (f) {
      if (f.unlock && stars === f.unlock) {
        T.say(f.say.charAt(0).toUpperCase() + f.say.slice(1) + ' wants to play! Look in Friends.');
        hat = T.pick(HATS);
        document.querySelector('.bp-hat').textContent = hat;
        document.querySelector('.bp-hat').classList.add('on');
      }
    });
  }

  function onPart(id, ev) {
    if (busy || mode === 'friends') return;
    if (mode === 'song') {
      T.sfx.tap();
      T.burst(ev.clientX, ev.clientY, { n: 8 });
      T.say(partMeta(id).say);
      return;
    }
    if (mode === 'you') {
      /* tapping the friend models the part; the grown-up confirm is the real “yes” */
      T.sfx.tap();
      T.say('That is the ' + partMeta(id).say + ' on ' + friend.say + '. Now show me your ' + partMeta(target).say + '!');
      glow(target);
      return;
    }
    var want = target;
    var ok = id === want || (want === 'head' && FACE_AS_HEAD[id]) || (PARTS[want] && PARTS[want].alias === id);
    if (ok) {
      found(ev.clientX, ev.clientY);
    } else {
      T.sfx.soft();
      T.say("That's the " + partMeta(id).say + '! Where is the ' + partMeta(want).say + '?');
      hint(want);
    }
  }

  function onYouConfirm(ev) {
    if (busy || mode !== 'you') return;
    found(ev.clientX, ev.clientY, 'You found your ' + partMeta(target).say + '!');
  }

  /* Original sung-speech chant — not a recorded performance of any particular arrangement. */
  var SONG = [
    'head', 'shoulders', 'knees', 'toes', 'knees', 'toes',
    'head', 'shoulders', 'knees', 'toes', 'knees', 'toes',
    'eyes', 'ears', 'mouth', 'nose',
    'head', 'shoulders', 'knees', 'toes', 'knees', 'toes'
  ];
  var SONG_NOTES = [392, 440, 494, 523, 494, 523, 392, 440, 494, 523, 494, 523, 587, 659, 587, 523, 392, 440, 494, 523, 494, 523];

  function startSong() {
    if (singing || busy) return;
    singing = true;
    busy = true;
    showView(false);
    var i = 0;
    function step() {
      if (!singing || mode !== 'song') { busy = false; singing = false; return; }
      if (i >= SONG.length) {
        clearGlow();
        setPrompt('🎉', 'yay');
        T.party({ emoji: ['🎵', '⭐', '💛'] });
        T.praise('We sang together!');
        T.reward();
        singing = false;
        busy = false;
        return;
      }
      var id = SONG[i];
      var meta = partMeta(id);
      showView(!!meta.face && id !== 'head' && id !== 'shoulders');
      if (id === 'head' || id === 'shoulders') showView(false);
      setPrompt(meta.icon, target);
      glow(id);
      T.tone(SONG_NOTES[i] || 440, 0.35, { type: 'triangle', vol: 0.4 });
      T.say(meta.say, { interrupt: true, rate: 1 });
      i += 1;
      setTimeout(step, 700);
    }
    T.sfx.chime();
    T.say('Here we go!');
    setTimeout(step, 700);
  }

  function renderBook() {
    var box = document.querySelector('.bp-book');
    box.innerHTML = '';
    FRIENDS.forEach(function (f) {
      var open = stars >= f.unlock;
      var b = T.el('button', 'bp-card tg-target' + (open ? '' : ' locked') + (friend.id === f.id ? ' on' : ''), f.icon);
      b.setAttribute('type', 'button');
      b.setAttribute('data-id', f.id);
      b.setAttribute('aria-label', open ? f.say : 'Keep playing to meet ' + f.say);
      if (open) {
        T.onTap(b, function () {
          setFriend(f);
          T.sfx.pop();
          T.say('Hello, ' + f.say + '!');
          renderBook();
        });
      } else {
        T.onTap(b, function () { T.sfx.soft(); T.say('Play a little more to meet ' + f.say + '!'); });
      }
      box.appendChild(b);
    });
    HATS.forEach(function (h, i) {
      var open = stars >= 3 + i * 3;
      var b = T.el('button', 'bp-card tg-target' + (open ? '' : ' locked') + (hat === h ? ' on' : ''), h);
      b.setAttribute('type', 'button');
      b.setAttribute('aria-label', open ? 'hat' : 'Keep playing for a hat');
      T.onTap(b, function () {
        if (!open) { T.sfx.soft(); T.say('Find a few more body parts to earn a hat!'); return; }
        hat = hat === h ? '' : h;
        document.querySelector('.bp-hat').textContent = hat;
        document.querySelector('.bp-hat').classList.toggle('on', !!hat);
        T.sfx.pop();
        T.say(hat ? 'A hat!' : 'No hat.');
        renderBook();
      });
      box.appendChild(b);
    });
  }

  function keepPartsOnStage() {
    var area = document.querySelector('.bp-stage-area');
    if (!area) return;
    var bound = Math.min(innerHeight - 6, area.getBoundingClientRect().bottom);
    document.querySelectorAll('.bp-part[data-part="feet"], .bp-part[data-part="legs"], .bp-part[data-part="toes"], .bp-part[data-part="knees"]').forEach(function (p) {
      p.style.marginTop = '0px';
      var r = p.getBoundingClientRect();
      if (r.bottom > bound) p.style.marginTop = (bound - r.bottom) + 'px';
    });
  }

  function buildStage() {
    var stage = T.stage;
    stage.classList.add('bp-stage');
    var sky = T.el('div', 'bp-sky');
    sky.setAttribute('data-scene', 'find');
    sky.appendChild(T.el('div', 'bp-hill'));
    stage.appendChild(sky);

    var prompt = T.el('div', 'bp-prompt', '👃');
    stage.appendChild(prompt);

    var area = T.el('div', 'bp-stage-area');
    var fig = T.el('div', 'bp-figure sway view-face');
    fig.innerHTML =
      '<div class="bp-hair-vis"></div>' +
      '<div class="bp-ear-vis l"></div><div class="bp-ear-vis r"></div>' +
      '<div class="bp-head">' +
        '<div class="bp-eye-vis l"></div><div class="bp-eye-vis r"></div>' +
        '<div class="bp-nose-vis"></div><div class="bp-mouth-vis"></div>' +
      '</div>' +
      '<div class="bp-hat"></div>' +
      '<div class="bp-body-hide bp-arm-vis l"><div class="bp-hand-vis"></div></div>' +
      '<div class="bp-body-hide bp-arm-vis r"><div class="bp-hand-vis"></div></div>' +
      '<div class="bp-body-hide bp-torso"><div class="bp-tummy-vis"></div></div>' +
      '<div class="bp-body-hide bp-leg-vis l"><div class="bp-foot-vis"></div></div>' +
      '<div class="bp-body-hide bp-leg-vis r"><div class="bp-foot-vis"></div></div>' +
      hit('hair') +
      hit('ears', 'l') + hit('ears', 'r') +
      hit('eyes', 'l') + hit('eyes', 'r') +
      hit('nose') + hit('mouth') + hit('head') +
      hit('arms', 'l') + hit('arms', 'r') +
      hit('hands', 'l') + hit('hands', 'r') +
      hit('tummy') +
      hit('legs', 'l') + hit('legs', 'r') +
      hit('knees', 'l') + hit('knees', 'r') +
      hit('feet', 'l') + hit('feet', 'r') +
      hit('toes', 'l') + hit('toes', 'r');
    area.appendChild(fig);
    stage.appendChild(area);

    var book = T.el('div', 'bp-book');
    stage.appendChild(book);

    var confirm = T.el('button', 'bp-confirm tg-target', '❤️');
    confirm.setAttribute('type', 'button');
    confirm.setAttribute('aria-label', 'We found it');
    stage.appendChild(confirm);

    var sing = T.el('button', 'bp-sing tg-target', '⭐');
    sing.setAttribute('type', 'button');
    sing.setAttribute('aria-label', 'Sing together');
    stage.appendChild(sing);

    var dock = T.el('div', 'bp-dock');
    [
      { id: 'find', icon: '👃', label: 'Find it' },
      { id: 'you', icon: '👆', label: 'On you' },
      { id: 'song', icon: '🎵', label: 'Sing' },
      { id: 'friends', icon: '🧸', label: 'Friends' }
    ].forEach(function (m) {
      var b = T.el('button', 'bp-mode tg-target' + (m.id === 'find' ? ' on' : ''));
      b.setAttribute('type', 'button');
      b.setAttribute('data-mode', m.id);
      b.setAttribute('aria-label', m.label);
      b.textContent = m.icon;
      dock.appendChild(b);
    });
    stage.appendChild(dock);

    stage.addEventListener('pointerdown', function (ev) {
      if (ev.target === stage || ev.target === sky || ev.target === area || (ev.target.classList && ev.target.classList.contains('bp-hill'))) {
        T.sfx.tap();
        T.burst(ev.clientX, ev.clientY, { n: 6 });
      }
    });
  }

  function hit(part, side) {
    return '<button class="bp-part tg-target' + (side ? ' ' + side : '') + '" type="button" data-part="' + part + '" aria-label="' + part + '"></button>';
  }

  function start() {
    buildStage();
    setFriend(friend);
    document.querySelectorAll('.bp-mode').forEach(function (btn) {
      T.onTap(btn, function () {
        T.sfx.tap();
        setMode(btn.getAttribute('data-mode'));
      });
    });
    document.querySelectorAll('.bp-part').forEach(function (p) {
      T.onTap(p, function (ev) {
        ev.stopPropagation();
        onPart(p.getAttribute('data-part'), ev);
      });
    });
    T.onTap(document.querySelector('.bp-confirm'), function (ev) {
      ev.stopPropagation();
      onYouConfirm(ev);
    });
    T.onTap(document.querySelector('.bp-sing'), function (ev) {
      ev.stopPropagation();
      T.sfx.tap();
      startSong();
    });
    window.addEventListener('resize', keepPartsOnStage);
    T.idle(function () {
      if (busy || mode === 'friends' || singing) return;
      var el = document.querySelector('.bp-part[data-part="' + (PARTS[target] && PARTS[target].alias || target) + '"]');
      if (el && mode === 'find') T.wiggle(el);
    }, 8000);
    setMode('find');
    keepPartsOnStage();
  }

  T.init({
    title: 'Touch Your Nose',
    icon: '👃',
    color: '#e88fc2',
    jarIcon: '💛',
    intro: 'Where is the nose? You can tap the friend, or show me on you.',
    start: start
  });
})();
