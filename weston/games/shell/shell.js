/* Weston's Planet toddler game shell (window.Toddler).
   Gives every game: start screen with a giant Play button, press-and-hold-2s home button,
   mute toggle, star reward jar, synthesized sound effects (Web Audio, no files), spoken cues (on-device speech),
   particle bursts / confetti, and touch helpers. No network calls, no tracking. See ../README.md. */
(function () {
  'use strict';
  var T = window.Toddler = {};
  if (!window.WESTON_VOICE) { var vs = document.createElement('script'); vs.src = '/weston/games/voice/clips.js?v=' + (window.WESTON_VOICE_V || '1'); document.head.appendChild(vs); }
  var muted = false; try { muted = localStorage.getItem('weston-muted') === '1'; } catch (e) {}
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  T.reduceMotion = reduce;
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  T.el = el;
  T.rand = function (a, b) { return a + Math.random() * (b - a); };
  T.pick = function (a) { return a[(Math.random() * a.length) | 0]; };
  T.shuffle = function (a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = (Math.random() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; };
  T.wait = function (ms) { return new Promise(function (r) { setTimeout(r, ms); }); };

  /* ---------------- audio (all synthesized) ---------------- */
  var ac, master;
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); master = ac.createGain(); master.gain.value = .55; master.connect(ac.destination); } catch (e) { return null; } }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  }
  T.unlockAudio = audio;
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  /* tone(freq, dur, {type, vol, slide, at}) */
  T.tone = function (f, d, o) {
    if (muted) return; var c = audio(); if (!c) return; o = o || {};
    var t = c.currentTime + (o.at || 0), osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(f, t);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, o.slide), t + d);
    env(g, t, o.attack || .01, o.vol || .5, d); osc.connect(g); g.connect(master); osc.start(t); osc.stop(t + d + .05);
  };
  function noise(d, o) {
    if (muted) return; var c = audio(); if (!c) return; o = o || {};
    var t = c.currentTime + (o.at || 0), n = c.sampleRate * d, b = c.createBuffer(1, n, c.sampleRate), ch = b.getChannelData(0);
    for (var i = 0; i < n; i++) ch[i] = Math.random() * 2 - 1;
    var s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = b; f.type = o.filter || 'bandpass'; f.frequency.value = o.freq || 1200; f.Q.value = o.q || 1;
    env(g, t, .005, o.vol || .4, d); s.connect(f); f.connect(g); g.connect(master); s.start(t); s.stop(t + d + .05);
  }
  T.noise = noise;
  var NOTES = [261.6, 293.7, 329.6, 392, 440, 523.3, 587.3, 659.3, 784, 880]; /* C major pentatonic-ish, always sounds nice */
  T.NOTES = NOTES;
  T.sfx = {
    pop: function (k) { var f = 500 + (k == null ? Math.random() * 500 : k * 60); T.tone(f, .12, { type: 'sine', slide: f * 2.2, vol: .6 }); noise(.05, { freq: 2500, vol: .25 }); },
    tap: function () { T.tone(660, .08, { type: 'triangle', vol: .35 }); },
    chime: function () { [0, .09, .18].forEach(function (a, i) { T.tone([784, 988, 1319][i], .5, { type: 'sine', vol: .35, at: a }); }); },
    sparkle: function () { for (var i = 0; i < 6; i++) T.tone(1200 + Math.random() * 1400, .18, { type: 'sine', vol: .18, at: i * .05 }); },
    boing: function () { T.tone(180, .35, { type: 'triangle', slide: 520, vol: .5 }); },
    whoosh: function () { noise(.35, { filter: 'bandpass', freq: 900, q: .6, vol: .3 }); },
    soft: function () { T.tone(392, .25, { type: 'sine', vol: .25 }); T.tone(330, .3, { type: 'sine', vol: .2, at: .12 }); }, /* gentle "try again" — never a buzzer */
    fanfare: function () { [[523, 0], [659, .12], [784, .24], [1047, .38]].forEach(function (n) { T.tone(n[0], .35, { type: 'triangle', vol: .4, at: n[1] }); T.tone(n[0] / 2, .35, { type: 'sine', vol: .2, at: n[1] }); }); setTimeout(T.sfx.sparkle, 520); },
    note: function (i) { T.tone(NOTES[((i % NOTES.length) + NOTES.length) % NOTES.length], .4, { type: 'triangle', vol: .45 }); },
    drum: function () { T.tone(150, .25, { type: 'sine', slide: 50, vol: .9 }); },
    snap: function () { T.tone(880, .06, { type: 'square', vol: .12 }); T.tone(1320, .1, { type: 'sine', vol: .3, at: .04 }); }
  };

  /* ---------------- speech (device voice, nothing downloaded) ---------------- */
  var voice = null;
  function chooseVoice() {
    if (!('speechSynthesis' in window)) return;
    var vs = speechSynthesis.getVoices() || [], pref = ['Samantha', 'Karen', 'Moira', 'Tessa', 'Google US English', 'Microsoft Aria'];
    for (var i = 0; i < pref.length && !voice; i++) voice = vs.filter(function (v) { return v.name.indexOf(pref[i]) === 0; })[0] || null;
    if (!voice) voice = vs.filter(function (v) { return /^en(-|_)US/i.test(v.lang); })[0] || vs.filter(function (v) { return /^en/i.test(v.lang); })[0] || null;
  }
  if ('speechSynthesis' in window) { chooseVoice(); speechSynthesis.onvoiceschanged = chooseVoice; }
  /* say(text, {rate, pitch, interrupt=true}) -> Promise resolved when done.
     Each sentence plays Dad's recording from /weston/games/voice/<file> when voice/clips.js maps it and the file exists;
     otherwise that sentence falls back to the device voice. Clips can be dropped in one at a time. */
  var VOICE_DIR = '/weston/games/voice/', clipBuf = {}, clipMissing = {}, sayGen = 0, curSrc = null;
  function splitSentences(t) { return (String(t).match(/[^.!?\u2026]+[.!?\u2026]*/g) || []).map(function (x) { return x.trim(); }).filter(Boolean); }
  function voiceKey(t) { return String(t).toLowerCase().replace(/[\u2018\u2019]/g, "'").replace(/[^a-z0-9' ]+/g, ' ').replace(/\s+/g, ' ').trim(); }
  T.voiceKey = voiceKey; T.splitSentences = splitSentences;
  function clipFor(sentence) { var m = window.WESTON_VOICE; return m && m[voiceKey(sentence)] || null; }
  function loadClip(file) {
    if (clipMissing[file]) return Promise.resolve(null);
    if (clipBuf[file]) return clipBuf[file];
    var c = audio(); if (!c || !window.fetch) return Promise.resolve(null);
    clipBuf[file] = fetch(VOICE_DIR + file).then(function (r) { if (!r.ok) throw 0; return r.arrayBuffer(); })
      .then(function (ab) { return new Promise(function (ok, no) { c.decodeAudioData(ab, ok, no); }); })
      .catch(function () { clipMissing[file] = 1; delete clipBuf[file]; return null; });
    return clipBuf[file];
  }
  T.preloadVoice = function (lines) { (lines || []).forEach(function (l) { splitSentences(l).forEach(function (s) { var f = clipFor(s); if (f) loadClip(f); }); }); };
  function stopSpeech() { if (curSrc) { try { curSrc.stop(); } catch (e) {} curSrc = null; } if ('speechSynthesis' in window) try { speechSynthesis.cancel(); } catch (e) {} }
  function playBuf(buf, gen) {
    return new Promise(function (res) {
      if (gen !== sayGen || muted) return res();
      var c = audio(), src = c.createBufferSource(), g = c.createGain(); g.gain.value = 1.6; src.buffer = buf; src.connect(g); g.connect(master);
      var done = false, fin = function () { if (!done) { done = true; if (curSrc === src) curSrc = null; res(); } };
      src.onended = fin; setTimeout(fin, buf.duration * 1000 + 400); curSrc = src; src.start();
    });
  }
  function tts(text, o, gen) {
    return new Promise(function (res) {
      if (gen !== sayGen || muted || !('speechSynthesis' in window)) return setTimeout(res, 300);
      try {
        var u = new SpeechSynthesisUtterance(text); if (voice) u.voice = voice; u.lang = (voice && voice.lang) || 'en-US';
        u.rate = o.rate || .88; u.pitch = o.pitch || 1.15; u.volume = 1;
        var done = false, fin = function () { if (!done) { done = true; res(); } };
        u.onend = fin; u.onerror = fin; setTimeout(fin, 900 + text.length * 90);
        speechSynthesis.speak(u);
      } catch (e) { res(); }
    });
  }
  T.say = function (text, o) {
    o = o || {};
    if (muted) return new Promise(function (r) { setTimeout(r, 300); });
    if (o.interrupt !== false) { sayGen++; stopSpeech(); }
    var gen = sayGen, parts = splitSentences(text);
    if (!parts.length) return Promise.resolve();
    /* start every clip download at once, then play in order; runs of unrecorded sentences are spoken together */
    var loads = parts.map(function (p) { var f = clipFor(p); return f ? loadClip(f) : Promise.resolve(null); });
    return Promise.all(loads).then(function (bufs) {
      var steps = [], pend = [];
      bufs.forEach(function (b, i) { if (b) { if (pend.length) { steps.push(pend.join(' ')); pend = []; } steps.push(b); } else pend.push(parts[i]); });
      if (pend.length) steps.push(pend.join(' '));
      return steps.reduce(function (p, st) { return p.then(function () { if (gen !== sayGen) return; return typeof st === 'string' ? tts(st, o, gen) : playBuf(st, gen); }); }, Promise.resolve());
    });
  };
  var PRAISE = ['Yay!', 'Great job!', 'You did it!', 'Wow!', 'Hooray!', 'Nice!', 'So good!', 'Way to go!'];
  T.praise = function (extra) { return T.say(extra ? T.pick(PRAISE) + ' ' + extra : T.pick(PRAISE)); };

  /* ---------------- visual fx ---------------- */
  var fx;
  var COLORS = ['#ffd86b', '#ff7aa2', '#7ee0ff', '#9dff9a', '#c59bff', '#ffa86b'];
  /* burst(x, y, {n, emoji:[..], colors:[..], spread}) */
  T.burst = function (x, y, o) {
    o = o || {}; if (!fx) return; var n = reduce ? Math.min(6, o.n || 14) : (o.n || 14);
    for (var i = 0; i < n; i++) (function () {
      var p = el('span', 'tg-p' + (o.emoji ? '' : ' tg-dot'));
      if (o.emoji) { p.textContent = T.pick(o.emoji); p.style.fontSize = (o.size || T.rand(24, 40)) + 'px'; }
      else p.style.background = T.pick(o.colors || COLORS);
      fx.appendChild(p);
      var a = Math.random() * 6.283, dist = (o.spread || 140) * T.rand(.4, 1.1), dx = Math.cos(a) * dist, dy = Math.sin(a) * dist;
      var an = p.animate([{ transform: 'translate(' + x + 'px,' + y + 'px) scale(.4)', opacity: 1 },
        { transform: 'translate(' + (x + dx) + 'px,' + (y + dy) + 'px) scale(1) rotate(' + T.rand(-180, 180) + 'deg)', opacity: 1, offset: .7 },
        { transform: 'translate(' + (x + dx * 1.1) + 'px,' + (y + dy * 1.1 + 40) + 'px) scale(.6)', opacity: 0 }], { duration: T.rand(650, 1000), easing: 'cubic-bezier(.2,.8,.3,1)' });
      an.onfinish = function () { p.remove(); };
    })();
  };
  /* party(): full-screen confetti rain + fanfare (end of a round) */
  T.party = function (o) {
    o = o || {}; T.sfx.fanfare(); if (!fx) return;
    var n = reduce ? 20 : 90, W = innerWidth, H = innerHeight;
    for (var i = 0; i < n; i++) (function (i) {
      var p = el('span', 'tg-p' + (o.emoji ? '' : ' tg-conf'));
      if (o.emoji) { p.textContent = T.pick(o.emoji); p.style.fontSize = T.rand(26, 46) + 'px'; } else p.style.background = T.pick(COLORS);
      fx.appendChild(p);
      var x = Math.random() * W, drift = T.rand(-120, 120);
      var an = p.animate([{ transform: 'translate(' + x + 'px,-60px) rotate(0deg)' }, { transform: 'translate(' + (x + drift) + 'px,' + (H + 60) + 'px) rotate(' + T.rand(360, 900) + 'deg)' }],
        { duration: T.rand(1600, 2800), delay: T.rand(0, 700), easing: 'cubic-bezier(.3,.1,.6,1)', fill: 'backwards' });
      an.onfinish = function () { p.remove(); };
    })(i);
  };
  /* bigWord('⭐'): a big emoji pops in the middle and floats away */
  T.bigWord = function (txt) { var w = el('div', 'tg-word'); w.textContent = txt; document.body.appendChild(w); requestAnimationFrame(function () { w.classList.add('go'); }); setTimeout(function () { w.remove(); }, 1500); };
  T.wiggle = function (e) { e.classList.remove('tg-wiggle'); void e.offsetWidth; e.classList.add('tg-wiggle'); };
  T.bounce = function (e) { e.classList.remove('tg-bounce'); void e.offsetWidth; e.classList.add('tg-bounce'); };
  T.center = function (e) { var r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };

  /* ---------------- touch helpers ---------------- */
  /* onTap(el, fn(ev)): fires on pointerdown (toddlers press, they don't "click"); works with several fingers */
  T.onTap = function (e, fn) { e.addEventListener('pointerdown', function (ev) { ev.preventDefault(); audio(); poke(); fn(ev); }); };
  /* drag(el, {start, move(x,y), end(x,y)}): pointer-captured dragging that keeps working when a finger slides off */
  T.drag = function (e, h) {
    var id = null, ox = 0, oy = 0;
    e.addEventListener('pointerdown', function (ev) { if (id !== null) return; ev.preventDefault(); audio(); poke(); id = ev.pointerId; try { e.setPointerCapture(id); } catch (x) {}
      var r = e.getBoundingClientRect(); ox = ev.clientX - r.left; oy = ev.clientY - r.top; h.start && h.start(ev.clientX, ev.clientY, ox, oy); });
    e.addEventListener('pointermove', function (ev) { if (ev.pointerId !== id) return; poke(); h.move && h.move(ev.clientX, ev.clientY, ox, oy); });
    function up(ev) { if (ev.pointerId !== id) return; id = null; h.end && h.end(ev.clientX, ev.clientY, ox, oy); }
    e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up);
  };
  /* idle hints: call T.idle(fn, ms) to get a gentle nudge (e.g. wiggle the answer) when nobody has touched for ms. Not a timer — nothing is lost. */
  var idleT = null, idleFn = null, idleMs = 6000;
  function poke() { if (idleFn) { clearTimeout(idleT); idleT = setTimeout(function () { if (idleFn) { idleFn(); poke(); } }, idleMs); } }
  T.idle = function (fn, ms) { idleFn = fn; idleMs = ms || 6000; poke(); };
  T.poke = poke;

  /* ---------------- reward jar ---------------- */
  var jar, slots = [], stars = 0, JAR = 5;
  /* reward(fromEl?) -> flies a star into the jar; every 5th star = party. Returns true when the jar filled. */
  T.reward = function (from) {
    if (!jar) return false;
    var s = slots[stars % JAR], c = from ? T.center(from) : { x: innerWidth / 2, y: innerHeight / 2 }, j = T.center(s);
    var p = el('span', 'tg-p'); p.textContent = T.jarIcon; p.style.fontSize = '54px'; fx.appendChild(p);
    var an = p.animate([{ transform: 'translate(' + (c.x - 27) + 'px,' + (c.y - 27) + 'px) scale(.5)' }, { transform: 'translate(' + (c.x - 27) + 'px,' + (c.y - 80) + 'px) scale(1.4)', offset: .3 },
      { transform: 'translate(' + (j.x - 27) + 'px,' + (j.y - 27) + 'px) scale(.7)' }], { duration: reduce ? 300 : 900, easing: 'cubic-bezier(.4,0,.2,1)' });
    an.onfinish = function () { p.remove(); s.classList.add('on'); jar.classList.remove('bump'); void jar.offsetWidth; jar.classList.add('bump'); T.sfx.chime(); };
    stars++;
    if (stars % JAR === 0) { setTimeout(function () { T.party(); T.bigWord('🏆'); T.say('You filled up all the stars! Hooray!'); setTimeout(function () { slots.forEach(function (x) { x.classList.remove('on'); }); }, 2600); }, 1000); return true; }
    return false;
  };
  T.stars = function () { return stars; };

  /* ---------------- chrome + start screen ---------------- */
  /* init({title, icon, color, jarIcon, intro: 'spoken line', start: fn}) */
  T.init = function (o) {
    o = o || {}; T.jarIcon = o.jarIcon || '⭐';
    if (o.color) document.documentElement.style.setProperty('--accent', o.color);
    document.body.insertBefore(el('div', 'tg-bg'), document.body.firstChild);
    T.stage = document.getElementById('stage') || document.body.appendChild(el('main', 'tg-stage'));
    T.stage.classList.add('tg-stage');
    fx = document.body.appendChild(el('div', 'tg-fx'));
    jar = document.body.appendChild(el('div', 'tg-jar')); jar.setAttribute('aria-hidden', 'true');
    for (var i = 0; i < JAR; i++) { var s = el('span', 'slot'); s.textContent = T.jarIcon; jar.appendChild(s); slots.push(s); }
    /* home: press and hold 2 seconds */
    var home = el('button', 'tg-btn tg-home', '🏠<svg class="ring" viewBox="0 0 80 80"><circle cx="40" cy="40" r="36"/></svg>');
    home.setAttribute('aria-label', 'Home (press and hold)');
    var tip = el('div', 'tg-tip'); tip.textContent = 'Grown-ups: hold 2 seconds to leave'; document.body.appendChild(tip);
    var ht = null, tipT = null;
    function hold(ev) { ev.preventDefault(); home.classList.add('holding'); tip.classList.add('show'); clearTimeout(tipT); ht = setTimeout(function () { T.sfx.whoosh(); location.href = '/weston/'; }, 2000); }
    function release() { clearTimeout(ht); home.classList.remove('holding'); tipT = setTimeout(function () { tip.classList.remove('show'); }, 1400); }
    home.addEventListener('pointerdown', hold); ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (k) { home.addEventListener(k, release); });
    home.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) hold(e); });
    home.addEventListener('keyup', release);
    home.addEventListener('click', function (e) { e.preventDefault(); });
    document.body.appendChild(home);
    /* mute */
    var mb = el('button', 'tg-btn tg-mute'); function paintMute() { mb.textContent = muted ? '🔇' : '🔊'; mb.setAttribute('aria-label', muted ? 'Sound off' : 'Sound on'); mb.setAttribute('aria-pressed', muted ? 'true' : 'false'); }
    paintMute();
    mb.addEventListener('pointerdown', function (e) { e.preventDefault(); muted = !muted; try { localStorage.setItem('weston-muted', muted ? '1' : '0'); } catch (x) {} if (muted) { sayGen++; stopSpeech(); } paintMute(); if (!muted) T.sfx.tap(); });
    document.body.appendChild(mb);
    /* start screen: icon, title, giant Play button */
    var st = el('section', 'tg-start');
    st.innerHTML = '<div class="big" aria-hidden="true"></div><h1></h1><button class="tg-play" aria-label="Play">▶</button>' +
      '';
    st.querySelector('.big').textContent = o.icon || '⭐'; st.querySelector('h1').textContent = o.title || document.title;
    document.querySelectorAll('.tg-why, .tg-research').forEach(function (s) { s.remove(); }); /* parent notes are no longer shown on game pages */
    document.body.appendChild(st);
    var started = false;
    st.querySelector('.tg-play').addEventListener('click', function () {
      audio(); T.sfx.boing();
      if ('speechSynthesis' in window) { try { var u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } catch (e) {} } /* iOS: unlock speech inside the tap */
      st.hidden = true; if (!started) { started = true; setTimeout(function () { o.start && o.start(); }, 250); }
      if (o.intro) setTimeout(function () { T.say(o.intro); }, 350);
    });
  };

  /* no zooming, no long-press menus, no rubber-band scrolling while playing */
  ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu'].forEach(function (k) { document.addEventListener(k, function (e) { e.preventDefault(); }); });
  document.addEventListener('touchmove', function (e) { if (!e.target.closest || !e.target.closest('.tg-start')) e.preventDefault(); }, { passive: false });
  document.addEventListener('visibilitychange', function () { if (document.hidden) { sayGen++; stopSpeech(); } });
  /* offline-ish: cache the games so they open with weak Wi-Fi (network first, cache fallback) */
  if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('/weston/games/sw.js', { scope: '/weston/games/' }).catch(function () {});
})();
