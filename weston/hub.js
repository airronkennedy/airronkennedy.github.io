/* Weston's Planet hub: draws the game tiles from games/games.js and a gentle starfield. */
(function () {
  'use strict';
  var menu = document.getElementById('menu');
  (window.WESTON_GAMES || []).forEach(function (g) {
    var t = document.createElement(g.live ? 'a' : 'div');
    t.className = 'tile' + (g.live ? '' : ' soon');
    t.style.setProperty('--c', g.color);
    if (g.live) t.href = '/weston/games/' + g.slug + '/';
    else { t.setAttribute('role', 'img'); t.setAttribute('aria-label', g.title + ', coming soon'); }
    t.innerHTML = '<span class="ic" aria-hidden="true"></span><span class="nm"></span><span class="sk"></span>' + (g.live ? '' : '<span class="badge">Soon</span>');
    t.querySelector('.ic').textContent = g.icon;
    t.querySelector('.nm').textContent = g.title;
    t.querySelector('.sk').textContent = g.skill;
    if (!g.live) t.addEventListener('click', function () { t.classList.remove('wiggle'); void t.offsetWidth; t.classList.add('wiggle'); });
    menu.appendChild(t);
  });
  /* starfield */
  var cv = document.getElementById('stars'), ctx = cv.getContext('2d'), stars = [], W, H;
  var still = matchMedia('(prefers-reduced-motion: reduce)').matches;
  function size() { var d = Math.min(devicePixelRatio || 1, 2); W = cv.width = innerWidth * d; H = cv.height = innerHeight * d;
    stars = []; for (var i = 0; i < 220; i++) stars.push({ x: Math.random() * W, y: Math.random() * H, r: (Math.random() * 1.3 + .3) * d, o: Math.random() * 6.28, s: .4 + Math.random() }); draw(0); }
  function draw(t) { ctx.clearRect(0, 0, W, H);
    for (var i = 0; i < stars.length; i++) { var s = stars[i]; ctx.globalAlpha = .35 + .45 * (still ? .6 : (Math.sin(t / 900 * s.s + s.o) * .5 + .5));
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.283); ctx.fill(); } }
  addEventListener('resize', size); size();
  if (!still) (function loop(t) { draw(t); requestAnimationFrame(loop); })(0);
})();
