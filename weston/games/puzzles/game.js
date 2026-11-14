/* Weston’s Planet — Simple Puzzles (game 9). 2 then 3 pieces, no fail. */
(function () {
  var T = window.Toddler;
  var scene = 'animals';
  var round = 0;
  var nPieces = 2;
  var puzzle = null;
  var placed = [];
  var chosen = null;
  var book = {};
  var waitForDrop = false;

  var SETS = {
    animals: [
      { name: 'dog', say: 'the dog', art: '🐶', color: '#f0a64a', buddy: '🐶' },
      { name: 'cat', say: 'the cat', art: '🐱', color: '#ef6a7a', buddy: '🐱' },
      { name: 'duck', say: 'the duck', art: '🦆', color: '#f2cf3d', buddy: '🦆' },
      { name: 'fish', say: 'the fish', art: '🐟', color: '#4fb3e8', buddy: '🐟' },
    ],
    vehicles: [
      { name: 'car', say: 'the car', art: '🚗', color: '#ef6a7a', buddy: '🚗' },
      { name: 'bus', say: 'the bus', art: '🚌', color: '#f2cf3d', buddy: '🚌' },
      { name: 'truck', say: 'the truck', art: '🚚', color: '#4fc2c9', buddy: '🚚' },
      { name: 'train', say: 'the train', art: '🚂', color: '#9a7bf0', buddy: '🚂' },
    ],
    shapes: [
      { name: 'circle', say: 'the circle', art: '🔵', color: '#4fb3e8', buddy: '🔵' },
      { name: 'heart', say: 'the heart', art: '❤️', color: '#ef6a7a', buddy: '❤️' },
      { name: 'star', say: 'the star', art: '⭐', color: '#f2cf3d', buddy: '⭐' },
      { name: 'square', say: 'the square', art: '🟩', color: '#5cc99a', buddy: '🟩' },
    ],
  };

  var HINTS = [
    { two: 'the left side', three: 'the left side' },
    { two: 'the right side', three: 'the middle' },
    { two: 'the right side', three: 'the right side' },
  ];

  function hintFor(i, n) {
    var h = HINTS[i] || HINTS[0];
    return n === 2 ? h.two : h.three;
  }

  function setScene(name) {
    scene = name;
    document.querySelectorAll('.pz-mode').forEach(function (b) {
      b.classList.toggle('on', b.getAttribute('data-scene') === name);
    });
    document.querySelector('.pz-sky').setAttribute('data-scene', name);
  }

  function showBoard(on) {
    document.querySelector('.pz-board-wrap').style.display = on ? '' : 'none';
    document.querySelector('.pz-tray').style.display = on ? '' : 'none';
    document.querySelector('.pz-book').classList.toggle('show', !on);
  }

  function clearPieces() {
    document.querySelectorAll('.pz-piece').forEach(function (p) { p.remove(); });
    placed = [];
    chosen = null;
  }

  function nextPuzzle() {
    if (scene === 'book') return;
    var pack = SETS[scene];
    puzzle = pack[round % pack.length];
    nPieces = round < pack.length ? 2 : 3;
    placed = [];
    chosen = null;
    waitForDrop = false;
    clearPieces();

    document.querySelector('.pz-buddy').textContent = puzzle.buddy;

    var board = document.querySelector('.pz-board');
    board.classList.toggle('n3', nPieces === 3);
    board.innerHTML = '<div class="pz-guide" aria-hidden="true">' + puzzle.art + '</div>';
    for (var i = 0; i < nPieces; i++) {
      var slot = T.el('div', 'pz-slot', '');
      slot.setAttribute('data-i', String(i));
      board.appendChild(slot);
    }

    var order = T.shuffle(Array.from({ length: nPieces }, function (_, i) { return i; }));
    order.forEach(function (i) { makePiece(i); });

    requestAnimationFrame(function () {
      layoutPieces();
    });
    T.say('Can you put ' + puzzle.say + ' together?');
    T.sfx.whoosh();
  }

  function makePiece(i) {
    var p = T.el('button', 'pz-piece tg-target', '');
    p.setAttribute('type', 'button');
    p.setAttribute('aria-label', hintFor(i, nPieces) + ' of ' + puzzle.say);
    p.setAttribute('data-i', String(i));
    p.setAttribute('data-n', String(nPieces));
    p.style.setProperty('--c', puzzle.color);
    var art = T.el('span', 'art', '');
    var emo = T.el('span', 'emo', puzzle.art);
    art.appendChild(emo);
    p.appendChild(art);
    document.body.appendChild(p);
    bindPiece(p);
    return p;
  }

  function traySpot(index, total) {
    var tray = document.querySelector('.pz-tray');
    var dock = document.querySelector('.pz-dock');
    var board = document.querySelector('.pz-board');
    var tr = tray.getBoundingClientRect();
    var dockTop = dock.getBoundingClientRect().top;
    var boardBottom = board.getBoundingClientRect().bottom;
    var size = 140;
    var gap = 22;
    var midY = (tr.top + tr.bottom) / 2;
    /* Keep the tray between the board and the mode dock. */
    var minY = boardBottom + size / 2 + 8;
    var maxY = dockTop - size / 2 - 8;
    var y = midY;
    if (minY <= maxY) y = Math.min(maxY, Math.max(minY, midY));
    else y = (boardBottom + dockTop) / 2;
    var totalW = total * size + (total - 1) * gap;
    var start = (window.innerWidth - totalW) / 2;
    return { x: start + index * (size + gap) + size / 2, y: y, size: size };
  }

  function paintSlice(piece) {
    var i = piece.getAttribute('data-i');
    var slot = document.querySelector('.pz-slot[data-i="' + i + '"]');
    var board = document.querySelector('.pz-board');
    var art = piece.querySelector('.art');
    var emo = piece.querySelector('.emo');
    if (!slot || !art || !emo || !board) return;
    var br = board.getBoundingClientRect();
    var sr = slot.getBoundingClientRect();
    var ar = art.getBoundingClientRect();
    if (sr.width < 8 || ar.width < 8) return;
    var s = Math.min(ar.width / sr.width, ar.height / sr.height);
    emo.style.fontSize = (Math.min(br.width, br.height) * 0.92 * s) + 'px';
    emo.style.width = (br.width * s) + 'px';
    emo.style.height = (br.height * s) + 'px';
    emo.style.top = ((br.top - sr.top) * s) + 'px';
    emo.style.left = ((br.left - sr.left) * s) + 'px';
    emo.style.right = 'auto';
    emo.style.transform = 'none';
  }

  function paintAllSlices() {
    document.querySelectorAll('.pz-piece').forEach(paintSlice);
  }

  function layoutPieces() {
    var loose = Array.from(document.querySelectorAll('.pz-piece:not(.locked)'));
    loose.forEach(function (p, k) {
      var spot = traySpot(k, loose.length);
      p.style.width = spot.size + 'px';
      p.style.height = spot.size + 'px';
      p.style.left = (spot.x - spot.size / 2) + 'px';
      p.style.top = (spot.y - spot.size / 2) + 'px';
    });
    paintAllSlices();
  }

  function snapInto(piece, slot) {
    var r = slot.getBoundingClientRect();
    piece.classList.add('locked');
    piece.style.left = r.left + 'px';
    piece.style.top = r.top + 'px';
    piece.style.width = r.width + 'px';
    piece.style.height = r.height + 'px';
    piece.style.borderRadius = getComputedStyle(slot).borderRadius;
    slot.classList.add('filled');
    paintSlice(piece);
  }

  function bindPiece(p) {
    T.drag(p, {
      onStart: function () {
        if (p.classList.contains('locked')) return false;
        if (chosen && chosen !== p) chosen.classList.remove('chosen');
        chosen = p;
        p.classList.add('chosen', 'dragging');
        T.sfx.tap();
      },
      onMove: function () {},
      onEnd: function (info) {
        p.classList.remove('dragging');
        tryPlace(p, info.clientX, info.clientY);
      },
    });
    T.onTap(p, function () {
      if (p.classList.contains('locked')) return;
      if (waitForDrop) return;
      if (chosen === p) {
        p.classList.remove('chosen');
        chosen = null;
        return;
      }
      if (chosen) chosen.classList.remove('chosen');
      chosen = p;
      p.classList.add('chosen');
      T.sfx.tap();
      T.say(hintFor(+p.getAttribute('data-i'), nPieces));
    });
  }

  function tryPlace(piece, x, y) {
    if (piece.classList.contains('locked')) return;
    var i = +piece.getAttribute('data-i');
    var hit = document.elementFromPoint(x, y);
    var slot = hit && hit.closest ? hit.closest('.pz-slot') : null;
    if (!slot) {
      layoutPieces();
      return;
    }
    var want = +slot.getAttribute('data-i');
    if (want !== i || slot.classList.contains('filled')) {
      T.sfx.soft();
      slot.classList.remove('hint');
      void slot.offsetWidth;
      var correct = document.querySelector('.pz-slot[data-i="' + i + '"]');
      if (correct) {
        correct.classList.add('hint');
        setTimeout(function () { correct.classList.remove('hint'); }, 800);
      }
      T.say('Try ' + hintFor(i, nPieces));
      layoutPieces();
      return;
    }
    snapInto(piece, slot);
    piece.classList.remove('chosen');
    if (chosen === piece) chosen = null;
    placed.push(i);
    T.sfx.snap();
    T.burst(x, y, 10);
    if (placed.length === nPieces) finishPuzzle();
    else {
      T.sfx.chime();
      layoutPieces();
    }
  }

  function finishPuzzle() {
    book[puzzle.name] = puzzle.art;
    T.sfx.sparkle();
    T.praise();
    T.bigWord(puzzle.art);
    T.say('You made ' + puzzle.say + '!');
    T.reward();
    T.bounce(document.querySelector('.pz-buddy'));
    document.querySelector('.pz-buddy').classList.add('yay');
    setTimeout(function () { document.querySelector('.pz-buddy').classList.remove('yay'); }, 900);
    if ((round + 1) % 4 === 0) T.party();
    setTimeout(function () {
      round += 1;
      nextPuzzle();
    }, 1600);
  }

  function bindSlots() {
    T.onTap(document.querySelector('.pz-board-wrap'), function (e) {
      if (!chosen || chosen.classList.contains('locked')) return;
      var t = e.target && e.target.closest ? e.target.closest('.pz-slot') : null;
      if (!t) return;
      var r = t.getBoundingClientRect();
      tryPlace(chosen, r.left + r.width / 2, r.top + r.height / 2);
    });
  }

  function openBook() {
    showBoard(false);
    clearPieces();
    var box = document.querySelector('.pz-book');
    box.innerHTML = '';
    var names = Object.keys(book);
    if (!names.length) {
      var empty = T.el('div', 'pz-sticker tg-target empty', '🧩');
      box.appendChild(empty);
      T.say('Finish a puzzle to earn a sticker!');
    } else {
      names.forEach(function (n) {
        var s = T.el('button', 'pz-sticker tg-target', book[n]);
        s.setAttribute('type', 'button');
        s.setAttribute('aria-label', n);
        T.onTap(s, function (e) {
          T.sfx.pop();
          T.burst(e.clientX, e.clientY, 8);
          T.say(n);
        });
        box.appendChild(s);
      });
      T.say('Your stickers!');
    }
  }

  function switchScene(name) {
    setScene(name);
    if (name === 'book') openBook();
    else {
      showBoard(true);
      round = 0;
      nextPuzzle();
    }
  }

  function buildStage() {
    var stage = T.stage;
    stage.classList.add('pz-stage');
    var sky = T.el('div', 'pz-sky');
    sky.setAttribute('data-scene', 'animals');
    sky.appendChild(T.el('div', 'pz-hill'));
    stage.appendChild(sky);

    var buddy = T.el('div', 'pz-buddy');
    buddy.textContent = '🧸';
    stage.appendChild(buddy);

    var wrap = T.el('div', 'pz-board-wrap');
    wrap.appendChild(T.el('div', 'pz-board'));
    stage.appendChild(wrap);

    var tray = T.el('div', 'pz-tray');
    tray.appendChild(T.el('div', 'pz-rail'));
    stage.appendChild(tray);

    stage.appendChild(T.el('div', 'pz-book'));

    var dock = T.el('div', 'pz-dock');
    [
      { id: 'animals', icon: '🐶', label: 'Animals' },
      { id: 'vehicles', icon: '🚗', label: 'Vehicles' },
      { id: 'shapes', icon: '⭐', label: 'Shapes' },
      { id: 'book', icon: '📖', label: 'Sticker book' },
    ].forEach(function (m) {
      var b = T.el('button', 'pz-mode tg-target');
      b.setAttribute('type', 'button');
      b.setAttribute('data-scene', m.id);
      b.setAttribute('aria-label', m.label);
      b.textContent = m.icon;
      if (m.id === 'animals') b.classList.add('on');
      dock.appendChild(b);
    });
    stage.appendChild(dock);

    stage.addEventListener('pointerdown', function (ev) {
      var t = ev.target;
      if (t === stage || t === sky || (t.classList && (t.classList.contains('pz-hill') || t.classList.contains('pz-board-wrap') || t.classList.contains('pz-tray') || t.classList.contains('pz-rail') || t.classList.contains('pz-sky')))) {
        T.sfx.tap();
        T.burst(ev.clientX, ev.clientY, 6);
      }
    });
  }

  function start() {
    buildStage();
    document.querySelectorAll('.pz-mode').forEach(function (btn) {
      T.onTap(btn, function () {
        T.sfx.tap();
        switchScene(btn.getAttribute('data-scene'));
      });
    });
    bindSlots();
    window.addEventListener('resize', function () {
      document.querySelectorAll('.pz-piece.locked').forEach(function (p) {
        var i = p.getAttribute('data-i');
        var slot = document.querySelector('.pz-slot[data-i="' + i + '"]');
        if (slot) snapInto(p, slot);
      });
      layoutPieces();
      paintAllSlices();
    });
    T.idle(function () {
      var loose = document.querySelectorAll('.pz-piece:not(.locked)');
      if (loose.length) T.wiggle(loose[0]);
    }, 7000);
    setScene('animals');
    showBoard(true);
    nextPuzzle();
  }

  T.init({
    title: 'Puzzles',
    icon: '🧩',
    color: '#4fc2c9',
    jarIcon: '⭐',
    intro: 'Put the big pieces together. Two pieces first, then three. You can drag or tap.',
    start: start,
  });
})();
