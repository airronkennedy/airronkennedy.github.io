(function () {
  'use strict';
  var grid = document.getElementById('grid');
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  (window.GIFTS || []).forEach(function (g) {
    var ready = g.file && g.tag;
    var url = ready ? 'https://github.com/' + GIFT_REPO + '/releases/download/' + encodeURIComponent(g.tag) + '/' + encodeURIComponent(g.file) : '';
    var card = document.createElement('article');
    card.className = 'card' + (ready ? '' : ' soon');
    card.innerHTML = '<div class="icon">' + esc(g.icon || '🎁') + '</div><p class="who">For ' + esc(g.who) + '</p><h3>' + esc(g.app) + '</h3><p class="desc">' + esc(g.desc || '') + '</p>' +
      (ready ? '<a class="dl" href="' + url + '" download>Download for Windows</a>' : '<span class="dl off">Coming soon</span>');
    grid.appendChild(card);
  });
  /* string lights */
  var L = document.getElementById('lights'), cols = ['#ff4b5c', '#ffd166', '#3ddc84', '#5ab8ff'];
  var n = Math.max(10, Math.round(innerWidth / 46));
  for (var i = 0; i < n; i++) { var b = document.createElement('i'); b.style.left = (i + .5) / n * 100 + '%'; b.style.background = cols[i % 4]; b.style.color = cols[i % 4]; b.style.animationDelay = (i % 4) * .4 + 's'; b.style.top = (Math.sin(i / n * Math.PI * 6) * 6 + 10) + 'px'; L.appendChild(b); }
  /* snow */
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = document.getElementById('snow'), ctx = cv.getContext('2d'), flakes = [], W, H;
  function size() { var d = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; cv.width = W * d; cv.height = H * d; ctx.setTransform(d, 0, 0, d, 0, 0);
    flakes = []; for (var i = 0; i < Math.round(W * H / 9000); i++) flakes.push({ x: Math.random() * W, y: Math.random() * H, r: Math.random() * 2.2 + .5, v: Math.random() * .6 + .3, o: Math.random() * 6 }); }
  function draw(t) { ctx.clearRect(0, 0, W, H); ctx.fillStyle = 'rgba(255,255,255,.85)';
    for (var i = 0; i < flakes.length; i++) { var f = flakes[i]; if (!reduce) { f.y += f.v; f.x += Math.sin(t / 1500 + f.o) * .3; if (f.y > H + 4) { f.y = -4; f.x = Math.random() * W; } }
      ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.283); ctx.fill(); }
    if (!reduce) requestAnimationFrame(draw); }
  size(); addEventListener('resize', size); requestAnimationFrame(draw);
})();
