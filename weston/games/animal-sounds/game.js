/* Animal Sounds: meet farm animals, then "Who says moo?" — listen and tap the right one.
   Research-driven choices: the sound comes first (listening), the word is said clearly and repeated,
   the child must tap the named animal (specific contingency), praise is spoken right away and the big
   animation waits until after the word, every tap on any animal names that animal, 2 animals first then 3. */
(function () {
  'use strict';
  var T = window.Toddler;
  var A = [
    { e: '🐄', n: 'cow', s: 'Moooo!', fx: function () { T.tone(140, .7, { type: 'sawtooth', slide: 110, vol: .18 }); } },
    { e: '🐑', n: 'sheep', s: 'Baaa!', fx: function () { for (var i = 0; i < 5; i++) T.tone(330 + (i % 2) * 30, .09, { type: 'triangle', vol: .2, at: i * .08 }); } },
    { e: '🐖', n: 'pig', s: 'Oink oink!', fx: function () { T.tone(220, .12, { type: 'square', slide: 160, vol: .12 }); T.tone(220, .12, { type: 'square', slide: 160, vol: .12, at: .18 }); } },
    { e: '🦆', n: 'duck', s: 'Quack quack!', fx: function () { T.tone(600, .1, { type: 'square', slide: 420, vol: .12 }); T.tone(600, .1, { type: 'square', slide: 420, vol: .12, at: .16 }); } },
    { e: '🐕', n: 'dog', s: 'Woof woof!', fx: function () { T.tone(260, .1, { type: 'sawtooth', slide: 140, vol: .18 }); T.tone(260, .1, { type: 'sawtooth', slide: 140, vol: .18, at: .2 }); } },
    { e: '🐈', n: 'cat', s: 'Meow!', fx: function () { T.tone(500, .45, { type: 'triangle', slide: 760, vol: .2 }); } },
    { e: '🐎', n: 'horse', s: 'Neigh!', fx: function () { for (var i = 0; i < 6; i++) T.tone(700 - i * 50, .07, { type: 'triangle', vol: .18, at: i * .06 }); } },
    { e: '🐓', n: 'chicken', s: 'Cluck cluck!', fx: function () { [0, .14, .28].forEach(function (a) { T.tone(900, .05, { type: 'square', vol: .1, at: a }); }); } }
  ];
  var lastT = null, pen, barn, ask, round = 0, cast = [], target = null, finds = 0, busy = false, bag = [];
  function art(a) { return a.n === 'cow' ? '🐄' : a.e; }
  function nextAnimals(k) { if (bag.length < k) bag = bag.concat(T.shuffle(A.filter(function (x) { return bag.indexOf(x) < 0; }))); return bag.splice(0, k); }
  function cls(el, c, ms) { el.classList.remove(c); void el.offsetWidth; el.classList.add(c); setTimeout(function () { el.classList.remove(c); }, ms || 1200); }
  function notes(el) { var c = T.center(el); for (var i = 0; i < 3; i++) (function (i) { var n = T.el('div', 'note'); n.textContent = T.pick(['🎵', '🎶']); document.body.appendChild(n);
    n.animate([{ transform: 'translate(' + (c.x - 20) + 'px,' + (c.y - 60) + 'px)', opacity: 1 }, { transform: 'translate(' + (c.x - 20 + (i - 1) * 60) + 'px,' + (c.y - 200) + 'px)', opacity: 0 }], { duration: 1100, delay: i * 120 }).onfinish = function () { n.remove(); }; })(i); }
  function speak(a, line) { a.fx(); cls(a.el, 'talk', 1000); notes(a.el); return T.wait(450).then(function () { return T.say(line); }); }

  function build(k) {
    pen.innerHTML = ''; cast = nextAnimals(k);
    barn.classList.add('open'); T.sfx.whoosh();
    cast.forEach(function (a, i) {
      var d = T.el('div', 'ani'); d.innerHTML = '<div class="shadow"></div><div class="e"></div>'; d.querySelector('.e').textContent = art(a);
      d.setAttribute('role', 'button'); d.setAttribute('aria-label', a.n); a.el = d; pen.appendChild(d);
      d.animate([{ transform: 'translateX(-70vw) scale(.5)', opacity: 0 }, { transform: 'translateX(0) scale(1)', opacity: 1 }], { duration: 900, delay: i * 350, easing: 'cubic-bezier(.2,.9,.3,1.2)', fill: 'backwards' });
      T.onTap(d, function () { tapAnimal(a); });
    });
    setTimeout(function () { barn.classList.remove('open'); }, 1400);
  }
  /* meet each animal once: "This is the cow. The cow says moo!" */
  function meet() {
    busy = true;
    return cast.reduce(function (p, a) { return p.then(function () { cls(a.el, 'hop', 1200); return speak(a, 'This is the ' + a.n + '. The ' + a.n + ' says ' + a.s); }).then(function () { return T.wait(250); }); }, T.wait(cast.length * 350 + 900))
      .then(function () { busy = false; });
  }
  function askNext() {
    var choices = cast.filter(function (a) { return a !== lastT; });
    target = lastT = T.pick(choices.length ? choices : cast);
    ask.textContent = '👂'; ask.classList.add('show');
    target.fx(); /* sound first: listening */
    return T.wait(500).then(function () { return T.say('Who says ' + target.s + ' Find the ' + target.n + '!'); });
  }
  function tapAnimal(a) {
    if (busy) { cls(a.el, 'talk', 600); a.fx(); return; }
    if (!target) { speak(a, 'The ' + a.n + '! ' + a.s); return; }
    if (a === target) {
      busy = true; ask.classList.remove('show'); target = null;
      cls(a.el, 'hop', 1200); a.fx();
      T.say('Yes! The ' + a.n + '! ' + a.s).then(function () {   /* the word first, then the fun */
        var c = T.center(a.el); T.burst(c.x, c.y, { emoji: ['💖', '⭐', '✨'], n: 12 }); T.sfx.chime();
        T.reward(a.el); finds++;
        return T.wait(900);
      }).then(function () {
        busy = false;
        if (finds % 3 === 0) party(); else askNext();
      });
    } else {
      /* not wrong — just a different friend: name it, then point back at the one we're looking for */
      busy = true;
      speak(a, "That's the " + a.n + '! ' + a.s).then(function () { T.sfx.soft(); T.wiggle(target.el); target.fx(); return T.say('Where is the ' + target.n + '?'); }).then(function () { busy = false; });
    }
  }
  function party() {
    busy = true; T.party({ emoji: ['🎉', '🌻', '⭐', '🎵'] }); T.say('Animal dance party!');
    cast.forEach(function (a, i) { setTimeout(function () { a.el.classList.add('dance'); a.fx(); }, i * 200); });
    var beat = 0, iv = setInterval(function () { T.sfx.note([0, 2, 4, 2, 0, 4, 5, 4][beat % 8]); if (beat % 2 === 0) T.sfx.drum(); beat++; }, 260);
    setTimeout(function () {
      clearInterval(iv); cast.forEach(function (a) { a.el.classList.remove('dance'); });
      round++; build(round < 2 ? 2 : 3); meet().then(askNext);
    }, 3800);
  }
  T.init({
    title: 'Animal Sounds', icon: '🐮', color: '#f0a64a', jarIcon: '⭐',
    start: function () {
      var f = T.el('div', 'farm'); f.innerHTML = '<div class="sun"></div><div class="cloud" style="top:8vh;animation-duration:60s">☁️</div><div class="cloud" style="top:22vh;animation-duration:85s;animation-delay:-40s">☁️</div><div class="fence"></div>';
      barn = T.el('div', 'barn'); barn.innerHTML = '<div class="roof"></div><div class="wall"></div><div class="door"></div>'; f.appendChild(barn);
      pen = T.el('div', 'pen'); f.appendChild(pen);
      ask = T.el('div', 'ask'); ask.setAttribute('aria-label', 'Hear it again'); f.appendChild(ask);
      T.stage.appendChild(f);
      T.onTap(ask, function () { if (target && !busy) { T.bounce(ask); target.fx(); T.wait(450).then(function () { T.say('Who says ' + target.s + ' Find the ' + target.n + '!'); }); } });
      T.onTap(barn, function () { barn.classList.add('open'); T.sfx.boing(); setTimeout(function () { barn.classList.remove('open'); }, 700); });
      T.onTap(f.querySelector('.sun'), function (e) { T.sfx.sparkle(); T.burst(e.clientX, e.clientY, { emoji: ['☀️', '✨'] }); T.say('The sun!'); });
      f.addEventListener('pointerdown', function (e) { if (e.target === f) { T.sfx.tap(); T.burst(e.clientX, e.clientY, { emoji: ['🌼', '🌸', '🍀'], n: 5, spread: 60 }); } });
      build(2);
      T.say("Let's meet the animals!").then(meet).then(askNext);
      T.idle(function () { if (target && !busy) { T.wiggle(target.el); target.fx(); T.say('Find the ' + target.n + '!'); } }, 8000);
    }
  });
})();
