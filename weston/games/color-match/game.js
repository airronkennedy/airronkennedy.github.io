/* Color Match ("Paint Party"): a picture waits on the easel with a pale hint of its color, and a big splat shows the color.
   Tap the paint bucket that matches -> the brush paints the picture and the color is named.
   Research-driven choices: matching to a visible sample (a 2-year-old can match colors before naming them),
   only red/blue/yellow/green, choices grow 2 -> 3 -> 4, colors on things that really are that color (red apple,
   yellow sun), any other bucket just names its own color (early color mix-ups are normal, never "wrong"),
   spoken word first and sparkles after, finished paintings go on the "fridge". */
(function () {
  'use strict';
  var T = window.Toddler;
  var C = { red: '#e63946', blue: '#2f7de1', yellow: '#ffd23f', green: '#2fbf55' };
  var GHOST = { red: '#fbd5d8', blue: '#d3e4fb', yellow: '#fff3c4', green: '#d1f3db' };
  var PICS = {
    red: [['apple', '<path class="p o" d="M50 30c-10-8-34-6-34 22 0 22 16 38 34 38s34-16 34-38c0-28-24-30-34-22z"/><path class="o" fill="#7a4b2a" d="M49 30c0-8 2-14 6-18"/><path class="o" fill="#3cb44b" d="M54 20c8-8 18-6 20-4-6 8-14 8-20 4z"/>'],
          ['car', '<path class="p o" d="M10 62h80v14H10z M24 62l10-18h30l12 18z"/><circle class="o" fill="#333" cx="30" cy="78" r="9"/><circle class="o" fill="#333" cx="72" cy="78" r="9"/><path class="o" fill="#cfe8ff" d="M38 47h11v13H31z M53 47h10l8 13H53z"/>']],
    blue: [['fish', '<path class="p o" d="M14 50c14-22 44-24 62 0-18 24-48 22-62 0z M76 50l16-14v28z"/><circle fill="#222" cx="30" cy="46" r="4"/>'],
           ['ball', '<circle class="p o" cx="50" cy="52" r="38"/><path class="o" fill="none" d="M14 46c24 10 48 10 72 0 M22 76c18-12 38-12 56 0"/>']],
    yellow: [['sun', '<circle class="p o" cx="50" cy="50" r="24"/><g class="o"><path class="p" d="M50 4l6 16H44z M50 96l-6-16h12z M4 50l16-6v12z M96 50l-16 6V44z M18 18l15 7-8 8z M82 82l-15-7 8-8z M82 18l-7 15-8-8z M18 82l7-15 8 8z"/></g><path fill="none" stroke="#3b2a3a" stroke-width="3" stroke-linecap="round" d="M41 56q9 8 18 0"/><circle fill="#3b2a3a" cx="42" cy="46" r="3"/><circle fill="#3b2a3a" cx="58" cy="46" r="3"/>'],
             ['duck', '<path class="p o" d="M20 62c0-12 12-18 26-16 2-14 10-22 22-22 10 0 16 8 16 16 0 6-4 10-8 12 8 6 8 28-22 30-22 2-34-8-34-20z"/><path class="o" fill="#ff8c2e" d="M84 38l12 4-12 6z"/><circle fill="#222" cx="72" cy="38" r="3.5"/>']],
    green: [['leaf', '<path class="p o" d="M14 86C14 40 44 14 88 12c0 46-26 74-74 74z"/><path class="o" fill="none" d="M14 86L70 30 M36 64l-2-16 M50 50l18 2"/>'],
            ['frog', '<ellipse class="p o" cx="50" cy="62" rx="38" ry="26"/><circle class="p o" cx="32" cy="34" r="12"/><circle class="p o" cx="68" cy="34" r="12"/><circle fill="#fff" cx="32" cy="34" r="6"/><circle fill="#fff" cx="68" cy="34" r="6"/><circle fill="#222" cx="32" cy="35" r="3"/><circle fill="#222" cx="68" cy="35" r="3"/><path fill="none" stroke="#3b2a3a" stroke-width="3" stroke-linecap="round" d="M34 64q16 12 32 0"/>']]
  };
  var studio, easel, buckets, fridge, splat, painter, target = null, pic = null, round = 0, made = 0, busy = false, order = [];

  function nextColor() { if (!order.length) order = T.shuffle(Object.keys(C)); return order.shift(); }
  function showPicture() {
    target = nextColor(); pic = T.pick(PICS[target]);
    easel.classList.remove('done'); easel.style.setProperty('--ghost', GHOST[target]); easel.style.setProperty('--paint', C[target]);
    easel.innerHTML = '<svg viewBox="0 0 100 100">' + pic[1] + '</svg><div class="dots"></div>';
    splat.style.setProperty('--c', C[target]);
    easel.animate([{ transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1 }], { duration: 500, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
    var n = round === 0 ? 2 : round === 1 ? 3 : 4;
    var others = T.shuffle(Object.keys(C).filter(function (k) { return k !== target; })).slice(0, n - 1);
    buckets.innerHTML = '';
    T.shuffle([target].concat(others)).forEach(function (k) {
      var b = T.el('div', 'bucket'); b.dataset.k = k; b.style.setProperty('--c', C[k]); b.setAttribute('aria-label', k + ' paint');
      b.innerHTML = '<div class="handle"></div><div class="pail"></div>'; buckets.appendChild(b);
      T.onTap(b, function () { pickBucket(b); });
    });
    T.sfx.whoosh();
    return T.wait(400).then(function () { return T.say("Let's paint the " + pic[0] + ' ' + target + '! Find ' + target + '!'); });
  }
  function hint() { var b = buckets.querySelector('[data-k="' + target + '"]'); if (!b) return; b.classList.remove('hint'); void b.offsetWidth; b.classList.add('hint'); setTimeout(function () { b.classList.remove('hint'); }, 3100); }
  function flyBrush(from, to) {
    var br = T.el('div', 'brush'); br.textContent = '🖌️'; document.body.appendChild(br);
    var a = T.center(from), c = T.center(to);
    return br.animate([{ transform: 'translate(' + (a.x - 45) + 'px,' + (a.y - 90) + 'px) rotate(-30deg)' }, { transform: 'translate(' + (c.x - 120) + 'px,' + (c.y - 80) + 'px) rotate(10deg)', offset: .5 },
      { transform: 'translate(' + (c.x + 20) + 'px,' + (c.y - 40) + 'px) rotate(-20deg)', offset: .7 }, { transform: 'translate(' + (c.x - 80) + 'px,' + (c.y) + 'px) rotate(15deg)', offset: .85 }, { transform: 'translate(' + (c.x + 30) + 'px,' + (c.y + 10) + 'px) rotate(0deg)', opacity: 0 }],
      { duration: T.reduceMotion ? 300 : 1300, easing: 'ease-in-out' }).finished.then(function () { br.remove(); });
  }
  function pickBucket(b) {
    var k = b.dataset.k; T.bounce(b);
    if (busy || !target) { T.sfx.tap(); T.say(k); return; }
    busy = true;
    if (k === target) {
      T.sfx.snap();
      flyBrush(b, easel).then(function () {
        easel.classList.add('done'); T.noise(.4, { freq: 1800, q: .5, vol: .25 }); easel.classList.remove('pop'); void easel.offsetWidth; easel.classList.add('pop');
        return T.say(k.charAt(0).toUpperCase() + k.slice(1) + '! A ' + k + ' ' + pic[0] + '!');   /* word first */
      }).then(function () {
        var c = T.center(easel); T.burst(c.x, c.y, { n: 18, colors: [C[k], '#ffffff', C[k]], spread: 200 }); T.sfx.chime();
        T.reward(easel); made++; addToFridge();
        return T.wait(1100);
      }).then(function () {
        busy = false; target = null;
        if (made % 3 === 0) return party(); return showPicture();
      });
    } else {
      /* a different color: it makes a little dot of its own color and says its name, then the right bucket hops */
      var dots = easel.querySelector('.dots'), d = document.createElement('i'); d.style.background = C[k]; d.style.left = T.rand(6, 86) + '%'; d.style.top = T.rand(6, 86) + '%'; dots.appendChild(d);
      d.animate([{ transform: 'scale(0)' }, { transform: 'scale(1.4)' }, { transform: 'scale(1)' }], { duration: 350 });
      T.tone(500, .12, { type: 'sine', slide: 300, vol: .3 });
      T.say("That's " + k + '!').then(function () { T.sfx.soft(); hint(); return T.say('Can you find ' + target + '?'); }).then(function () { busy = false; });
    }
  }
  function addToFridge() {
    var m = T.el('div', 'mini'); m.style.setProperty('--r', T.rand(-8, 8) + 'deg');
    m.innerHTML = '<svg viewBox="0 0 100 100" style="--paint:' + C[target] + '">' + pic[1].replace(/class="p o"/g, 'class="o" fill="' + C[target] + '" stroke="#3b2a3a" stroke-width="3.5"').replace(/class="p"/g, 'fill="' + C[target] + '"') + '</svg>';
    fridge.appendChild(m); while (fridge.children.length > (innerWidth < 500 ? 3 : 6)) fridge.firstChild.remove();
    m.animate([{ transform: 'translateY(200px) scale(2)', opacity: 0 }, { transform: 'rotate(' + m.style.getPropertyValue('--r') + ')', opacity: 1 }], { duration: 700, easing: 'cubic-bezier(.2,.9,.3,1.3)' });
  }
  function party() {
    busy = true; T.party({ emoji: ['🎨', '🖍️', '⭐', '🎉'] }); T.say('Paint party! Red, blue, yellow, green!');
    var ks = Object.keys(C), i = 0, iv = setInterval(function () { splat.style.setProperty('--c', C[ks[i % 4]]); T.sfx.note(i * 2); i++; }, 300);
    return T.wait(3600).then(function () { clearInterval(iv); round++; busy = false; return showPicture(); });
  }
  T.init({
    title: 'Color Match', icon: '🎨', color: '#ef6a7a', jarIcon: '⭐',
    start: function () {
      studio = T.el('div', 'studio'); fridge = T.el('div', 'fridge'); easel = T.el('div', 'easel'); buckets = T.el('div', 'buckets');
      splat = T.el('div', 'splat'); splat.setAttribute('aria-label', 'this color'); painter = T.el('div', 'painter'); painter.textContent = '🧑‍🎨';
      [fridge, splat, painter, easel, buckets].forEach(function (e) { studio.appendChild(e); }); T.stage.appendChild(studio);
      T.onTap(splat, function () { T.bounce(splat); T.sfx.boing(); if (target) { T.say(target + '!'); hint(); } });
      T.onTap(easel, function (e) { T.sfx.tap(); T.burst(e.clientX, e.clientY, { n: 5, colors: [target ? C[target] : '#fff'], spread: 50 }); if (target && !busy) T.say('Find ' + target + '!'); else if (pic) T.say(pic[0] + '!'); });
      studio.addEventListener('pointerdown', function (e) { if (e.target === studio) { T.sfx.tap(); T.burst(e.clientX, e.clientY, { n: 6, spread: 60 }); } });
      T.say("Let's paint!").then(showPicture);
      T.idle(function () { if (target && !busy) { hint(); T.bounce(splat); T.say('Find ' + target + '!'); } }, 8000);
    }
  });
})();
