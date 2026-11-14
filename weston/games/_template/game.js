/* Template game: tap the star, it jumps somewhere new. Copy this folder to start a new game. */
(function () {
  'use strict';
  var T = window.Toddler;
  T.init({
    title: 'Template Game', icon: '⭐', color: '#4fb3e8', jarIcon: '⭐',
    intro: 'Tap the star!',
    start: function () {
      var s = T.el('div', 'tg-target star'); s.textContent = '⭐'; T.stage.appendChild(s);
      function place() { s.style.left = T.rand(10, 70) + 'vw'; s.style.top = T.rand(20, 65) + 'vh'; }
      place();
      var taps = 0;
      T.onTap(s, function () {
        var c = T.center(s); T.sfx.pop(); T.burst(c.x, c.y, { emoji: ['✨', '⭐'] }); T.bounce(s);
        taps++; if (taps % 3 === 0) { T.reward(s); T.praise(); } else T.say('Star!');
        setTimeout(place, 250);
      });
      T.idle(function () { T.wiggle(s); T.say('Where is the star?'); }, 7000);
    }
  });
})();
