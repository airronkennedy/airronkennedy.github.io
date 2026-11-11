/* RIFTSTRIKE — 6v6 auto-brawl. Original game. Art: Tiny Swords by Pixel Frog (CC0). */
(function () {
'use strict';
var LW = 1024, LH = 576, W = LW, H = LH, PORT = false;
var BOUNDS, ISL, VIEW;
function mp(x, y) { return PORT ? [y, LW - x] : [x, y]; } // landscape design coords -> current world
function setOrientation(port) {
  PORT = port; W = port ? LH : LW; H = port ? LW : LH;
  BOUNDS = port ? { x0: 92, x1: 484, y0: 112, y1: 922 } : { x0: 108, x1: 916, y0: 150, y1: 484 };
  ISL = port ? { c0: 1, c1: 7, r0: 1, r1: 14 } : { c0: 1, c1: 14, r0: 1, r1: 7 };
  VIEW = port ? { x: 40, y: 40, w: 496, h: 950 } : { x: 40, y: 40, w: 944, h: 500 };
}
setOrientation(false);
var cv = document.getElementById('cv'), ctx = cv.getContext('2d');
var stage = document.getElementById('stage'), ui = document.getElementById('ui');
var params = new URLSearchParams(location.search);

// ---------- assets ----------
var SRC = {
  warrior: 'assets/units/Warrior_Blue.png', archer: 'assets/units/Archer_Blue.png', pawn: 'assets/units/Pawn_Blue.png',
  torch: 'assets/units/Torch_Red.png', tnt: 'assets/units/TNT_Red.png', barrel: 'assets/units/Barrel_Red.png',
  dead: 'assets/units/Dead.png', dynamite: 'assets/fx/Dynamite.png', arrow: 'assets/fx/Arrow.png',
  explosion: 'assets/fx/Explosions.png', fire: 'assets/fx/Fire.png',
  flat: 'assets/terrain/Tilemap_Flat.png', water: 'assets/terrain/Water.png', foam: 'assets/terrain/Foam.png',
  rocks1: 'assets/terrain/Rocks_01.png', rocks3: 'assets/terrain/Rocks_03.png', tree: 'assets/terrain/Tree.png',
  tower: 'assets/terrain/Tower_Blue.png', ghouse: 'assets/terrain/Goblin_House.png', sheep: 'assets/terrain/HappySheep_Idle.png',
  ribbonBlue: 'assets/ui/Ribbon_Blue_3Slides.png', ribbonRed: 'assets/ui/Ribbon_Red_3Slides.png', ribbonYellow: 'assets/ui/Ribbon_Yellow_3Slides.png'
};
['01','02','03','04','05','07','08','09','10','11','12','13','14'].forEach(function (d) { SRC['deco' + d] = 'assets/deco/' + d + '.png'; });
var IMG = {}, WHITE = {}, CYAN = {};

function loadAll(cb) {
  var keys = Object.keys(SRC), left = keys.length;
  keys.forEach(function (k) {
    var im = new Image();
    im.onload = function () { if (--left === 0) cb(); };
    im.onerror = function () { console.error('missing asset', SRC[k]); if (--left === 0) cb(); };
    im.src = SRC[k]; IMG[k] = im;
  });
}
function silhouette(im, color) {
  var c = document.createElement('canvas'); c.width = im.width; c.height = im.height;
  var g = c.getContext('2d'); g.drawImage(im, 0, 0);
  g.globalCompositeOperation = 'source-in'; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
  return c;
}

// ---------- rng ----------
var R = Math.random;
function rand(a, b) { return a + R() * (b - a); }
function pick(a) { return a[(R() * a.length) | 0]; }
function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = (R() * (i + 1)) | 0, t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

// ---------- unit kinds (rows verified against the sheets) ----------
var S192 = { fw: 192, fh: 192, ax: 96, ay: 134 };
var KINDS = {
  warrior: { img: 'warrior', f: S192, head: 84, label: 'Warrior', hp: 1180, pow: 140, range: 52, speed: 118, ranged: null,
    idle: { r: 0, n: 6, fps: 10 }, run: { r: 1, n: 6, fps: 12 },
    atk: [{ r: 2, n: 6, fps: 16, hit: 3 }, { r: 3, n: 6, fps: 16, hit: 3 }],
    atkDown: [{ r: 4, n: 6, fps: 16, hit: 3 }, { r: 5, n: 6, fps: 16, hit: 3 }], atkUp: [{ r: 6, n: 6, fps: 16, hit: 3 }, { r: 7, n: 6, fps: 16, hit: 3 }],
    special: 'Rift Cleave' },
  archer: { img: 'archer', f: S192, head: 72, label: 'Archer', hp: 840, pow: 130, range: 340, speed: 100, ranged: 'arrow',
    idle: { r: 0, n: 6, fps: 10 }, run: { r: 1, n: 6, fps: 12 },
    atk: [{ r: 4, n: 8, fps: 18, hit: 5 }], atkUp: [{ r: 3, n: 8, fps: 18, hit: 5 }], atkDown: [{ r: 5, n: 8, fps: 18, hit: 5 }],
    special: 'Piercing Volley' },
  pawn: { img: 'pawn', f: S192, head: 64, label: 'Pawn', hp: 920, pow: 110, range: 46, speed: 128, ranged: null,
    idle: { r: 0, n: 6, fps: 10 }, run: { r: 1, n: 6, fps: 12 },
    atk: [{ r: 3, n: 6, fps: 16, hit: 3 }, { r: 2, n: 6, fps: 16, hit: 3 }], special: 'Hearth Hammer' },
  torch: { img: 'torch', f: S192, head: 76, label: 'Torch', hp: 1050, pow: 140, range: 52, speed: 122, ranged: null,
    idle: { r: 0, n: 7, fps: 10 }, run: { r: 1, n: 6, fps: 12 },
    atk: [{ r: 2, n: 6, fps: 16, hit: 3 }], atkDown: [{ r: 3, n: 6, fps: 16, hit: 3 }], atkUp: [{ r: 4, n: 6, fps: 16, hit: 3 }],
    special: 'Cinder Sweep' },
  tnt: { img: 'tnt', f: S192, head: 66, label: 'TNT', hp: 820, pow: 150, range: 290, speed: 100, ranged: 'dynamite',
    idle: { r: 0, n: 6, fps: 10 }, run: { r: 1, n: 6, fps: 12 },
    atk: [{ r: 2, n: 7, fps: 16, hit: 3 }], special: 'Big Bang' },
  barrel: { img: 'barrel', f: { fw: 128, fh: 128, ax: 64, ay: 101 }, head: 70, label: 'Barrel', hp: 1200, pow: 110, range: 48, speed: 108, ranged: null,
    idle: { r: 4, n: 3, fps: 5 }, run: { r: 3, n: 6, fps: 12 },
    atk: [{ r: 1, n: 6, fps: 16, hit: 2 }], special: 'Powder Keg' }
};
var ROSTER = {
  blue: [['warrior', 'Alden', 360, 265], ['warrior', 'Bryn', 360, 395], ['pawn', 'Tarin', 315, 185], ['pawn', 'Elow', 315, 470],
         ['archer', 'Wren', 205, 265], ['archer', 'Merrit', 205, 395]],
  red: null // built per battle: 2-6 goblins
};
var GOB_NAMES = ['Rusk', 'Kael', 'Sable', 'Drenn', 'Voss', 'Iven'];
var RED_SLOTS = { // landscape design coords, front (melee) slots first
  2: [[680, 280], [760, 395]],
  3: [[670, 260], [670, 400], [800, 330]],
  4: [[664, 240], [664, 420], [800, 265], [800, 395]],
  5: [[664, 200], [664, 330], [664, 460], [800, 265], [800, 395]],
  6: [[664, 265], [664, 395], [709, 185], [709, 470], [819, 265], [819, 395]]
};
function buildRedRoster(n) {
  var kinds = shuffle(['torch', 'torch', 'barrel', 'barrel', 'tnt', 'tnt']).slice(0, n);
  if (kinds.every(function (k) { return k === 'tnt'; })) kinds[0] = pick(['torch', 'barrel']);
  kinds.sort(function (a, b) { return (a === 'tnt') - (b === 'tnt'); });
  var names = shuffle(GOB_NAMES.slice()), slots = RED_SLOTS[n];
  return kinds.map(function (k, i) { return [k, names[i], slots[i][0], slots[i][1]]; });
};
var US = 0.8; // unit draw scale

// ---------- state ----------
var G = null; // battle
var phase = 'loading'; // loading | title | battle | ending | results
var paused = false, speed = 1, muted = false, AUTO = false;
try { muted = localStorage.getItem('rs_muted') === '1'; } catch (e) {}
var fx = [], projectiles = [], texts = [], shakeT = 0, shakeMag = 0, banner = null, now = 0, hitstop = 0;

function newBattle(n) {
  var units = [];
  n = n || +params.get('enemies') || pick([2, 3, 4, 5, 6]);
  ROSTER.red = buildRedRoster(n);
  var buff = Math.pow(6 / n, 0.8); // fewer goblins = tougher goblins
  ['blue', 'red'].forEach(function (team) {
    ROSTER[team].forEach(function (r, i) {
      var k = KINDS[r[0]], p = mp(r[2], r[3]), m = team === 'red' ? buff : 1, hp = Math.round(k.hp * m);
      units.push({ id: team + i, team: team, kind: r[0], K: k, name: r[1], x: p[0], y: p[1], hx: p[0], hy: p[1], hp: hp, maxhp: hp, shownHp: hp, pm: m,
        gauge: rand(0, 30), facing: team === 'blue' ? 1 : -1, anim: 'idle', at: rand(0, 1000), act: null, flash: 0, shake: 0, kx: 0,
        dead: false, deathT: 0, gone: false, dmg: 0, kos: 0, pop: 0, burn: null });
    });
  });
  G = { units: units, nRed: n, t: 0, turn: 0, side: 'blue', mode: 'select', queue: [], qi: 0, gap: 0, cur: null, endT: 0, result: null };
  fx = []; projectiles = []; texts = []; banner = null;
}

// ---------- audio (synth, no files) ----------
var AC = null;
function audio() { if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); var b = AC.createBuffer(1, 1, 22050), sb = AC.createBufferSource(); sb.buffer = b; sb.connect(AC.destination); sb.start(0); } catch (e) { AC = null; } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
function tone(freq, dur, type, vol, slide) {
  if (muted || !AC) return; var t = AC.currentTime, o = AC.createOscillator(), g = AC.createGain();
  o.type = type || 'square'; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq * slide), t + dur);
  g.gain.setValueAtTime(vol || 0.05, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t + dur + 0.02);
}
var noiseBuf = null;
function noise(dur, vol, hp) {
  if (muted || !AC) return; if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate * 0.5, AC.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  var t = AC.currentTime, s = AC.createBufferSource(), g = AC.createGain(), f = AC.createBiquadFilter();
  s.buffer = noiseBuf; f.type = 'lowpass'; f.frequency.value = hp || 2400; g.gain.setValueAtTime(vol || 0.08, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); s.stop(t + dur);
}
var lastSfx = 0;
var SFX = {
  hit: function () { var t = performance.now(); if (t - lastSfx < 35) return; lastSfx = t; noise(0.07, 0.07, 1800); tone(rand(150, 220), 0.06, 'square', 0.025, 0.5); },
  special: function () { tone(330, 0.18, 'sawtooth', 0.04, 2.2); noise(0.18, 0.08, 900); },
  boom: function () { noise(0.35, 0.14, 500); tone(90, 0.3, 'sine', 0.09, 0.4); },
  shoot: function () { tone(900, 0.05, 'triangle', 0.02, 0.6); },
  ko: function () { tone(420, 0.22, 'square', 0.035, 0.35); },
  fight: function () { tone(392, 0.1, 'square', 0.05); setTimeout(function () { tone(523, 0.18, 'square', 0.05); }, 90); },
  win: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tone(f, 0.18, 'square', 0.045); }, i * 110); }); },
  lose: function () { [392, 330, 262, 196].forEach(function (f, i) { setTimeout(function () { tone(f, 0.22, 'triangle', 0.05); }, i * 140); }); }
};

// ---------- simulation (turn-based) ----------
function alive(team) { return G.units.filter(function (u) { return u.team === team && !u.dead; }); }
function enemyOf(u) { return u.team === 'blue' ? 'red' : 'blue'; }
function surgeMult() { return G.turn > 5 ? 1 + (G.turn - 5) * 0.3 : 1; }
function homeFacing(u) { return u.team === 'blue' ? 1 : -1; }

function pickAtk(u, tgt, list) {
  var K = u.K, dx = tgt.x - u.x, dy = tgt.y - u.y;
  list = list || K.atk;
  if (Math.abs(dy) > Math.abs(dx) * 1.1) { if (dy < 0 && K.atkUp) list = K.atkUp; else if (dy > 0 && K.atkDown) list = K.atkDown; }
  else if (K.ranged && Math.abs(dy) > Math.abs(dx) * 0.45) { if (dy < 0 && K.atkUp) list = K.atkUp; else if (dy > 0 && K.atkDown) list = K.atkDown; }
  return list;
}
function setAnim(u, a) { if (u.anim !== a) { u.anim = a; u.at = 0; } }

// Each unit's own attack pattern:
//  Warrior  - dashes in, two-swing combo (0.6x + 0.6x)          special: Rift Cleave (cleaves neighbours)
//  Archer   - aimed arrow from the back line                      special: Piercing Volley (3 arrows + pierce splash)
//  Pawn     - dashes in, heavy axe chop with knockback           special: Hearth Hammer (stun shock)
//  Torch    - dashes in, flame swipe that leaves a burn tick     special: Cinder Sweep (fire burst)
//  TNT      - lobs a dynamite stick                               special: Big Bang (big blast splash)
//  Barrel   - rolls in and pops a powder blast (small splash)    special: Powder Keg (huge blast)
function startAction(u) {
  var foes = alive(enemyOf(u)); if (!foes.length) return false;
  var t = pick(foes), special = u.gauge >= 100;
  u.act = { target: t, special: special, stage: u.K.ranged ? 'atk' : 'go', t: 0, swing: 0, done: false, ready: false, readyT: 0 };
  if (u.K.ranged) beginSwing(u);
  if (special) {
    u.gauge = 0;
    addText(u.x, u.y - u.K.head * US - 30, u.K.special + '!', u.team === 'blue' ? '#9fe3ff' : '#ffb27a', 17, 1000, true);
    fx.push({ type: 'ring', x: u.x, y: u.y - 20, t: 0, life: 380, color: u.team === 'blue' ? '#7fd8ff' : '#ff9a4a' });
    SFX.special();
  } else u.gauge = Math.min(100, u.gauge + 22);
  return true;
}
function beginSwing(u) {
  var a = u.act, list = pickAtk(u, a.target);
  a.def = (u.kind === 'warrior' || u.kind === 'pawn') ? list[Math.min(a.swing, list.length - 1)] : list[0];
  a.stage = 'atk'; a.t = 0; a.hitDone = false;
  u.facing = a.target.x >= u.x ? 1 : -1;
}

function updateUnit(u, dt) {
  if (u.flash > 0) u.flash -= dt; if (u.shake > 0) u.shake -= dt;
  u.kx *= Math.pow(0.0001, dt / 1000);
  u.shownHp += (u.hp - u.shownHp) * Math.min(1, dt / 220);
  if (u.dead) { u.deathT += dt; if (u.deathT > 1700) u.gone = true; return; }
  u.at += dt;
  if (u.burn && u.burn.t > 0) { u.burn.t -= dt; if (u.burn.t <= 0) { var b = u.burn; u.burn = null; if (!b.owner.dead || true) { hit(b.owner, u, b.mult, false, true, '#ff9a3d'); fx.push({ type: 'sprite', img: 'fire', fw: 128, fh: 128, n: 7, fps: 16, x: u.x, y: u.y + 6, ax: 64, ay: 105, s: 0.5, t: 0, loops: 1 }); } } }
  var a = u.act;
  if (!a) { setAnim(u, 'idle'); return; }
  if (a.ready) a.readyT += dt;
  var t = a.target;
  if (a.stage === 'go') {
    if (t.dead) { var foes = alive(enemyOf(u)); if (foes.length) a.target = t = pick(foes); else { a.stage = 'back'; a.ready = true; return; } }
    var side = u.hx < t.x ? -1 : 1, gx = t.x + side * (u.K.range + 4), gy = t.y + 2;
    if (moveTo(u, gx, gy, 720, dt)) beginSwing(u);
    return;
  }
  if (a.stage === 'atk') {
    a.t += dt; var d = a.def, fr = Math.floor(a.t * d.fps / 1000);
    if (!a.hitDone && fr >= d.hit) { a.hitDone = true; resolveHit(u, a); }
    if (fr >= d.n) {
      if (u.kind === 'warrior' && a.swing === 0) { a.swing = 1; beginSwing(u); return; }
      if (u.K.ranged) { a.stage = 'wait'; } else { a.stage = 'back'; a.ready = true; }
    }
    return;
  }
  if (a.stage === 'wait') { setAnim(u, 'idle'); if (a.ready && a.readyT > 0) { u.act = null; u.facing = homeFacing(u); } return; }
  if (a.stage === 'back') {
    if (moveTo(u, u.hx, u.hy, 760, dt)) { u.act = null; u.facing = homeFacing(u); setAnim(u, 'idle'); }
  }
}
function moveTo(u, gx, gy, sp, dt) {
  var dx = gx - u.x, dy = gy - u.y, d = Math.sqrt(dx * dx + dy * dy), st = sp * dt / 1000;
  if (d <= st + 0.5) { u.x = gx; u.y = gy; return true; }
  u.x += dx / d * st; u.y += dy / d * st; if (Math.abs(dx) > 1) u.facing = dx > 0 ? 1 : -1; setAnim(u, 'run'); return false;
}

function resolveHit(u, a) {
  var t = a.target, K = u.K, sp = a.special;
  if (K.ranged === 'arrow') {
    SFX.shoot();
    var n = sp ? 3 : 1;
    for (var i = 0; i < n; i++) projectiles.push({ kind: 'arrow', owner: u, act: a, last: i === n - 1, target: t, x: u.x + u.facing * 20, y: u.y - 34 + (i - 1) * 7, special: sp, pierce: sp && i === 0, mult: sp ? 2.5 / 3 : 1, speed: 900 + i * 60, delay: i * 70 });
    return;
  }
  if (K.ranged === 'dynamite') {
    projectiles.push({ kind: 'dyn', owner: u, act: a, last: true, target: t, sx: u.x + u.facing * 18, sy: u.y - 40, x: u.x, y: u.y, t: 0, dur: 480, tx: t.x, ty: t.y, special: sp, rot: 0 });
    tone(500, 0.06, 'triangle', 0.02, 1.6);
    return;
  }
  if (t.dead) { addText(u.x + u.facing * 30, u.y - 50, 'miss', '#ddd', 12, 500); return; }
  var base = u.kind === 'warrior' ? 0.6 : u.kind === 'torch' ? 0.8 : 1;
  var final = !(u.kind === 'warrior' && a.swing === 0);
  hit(u, t, base * (sp ? 2.5 : 1), sp && final);
  if (u.kind === 'pawn') { t.kx = u.facing * 16; }
  if (u.kind === 'torch' && !t.dead) { t.burn = { t: 380, owner: u, mult: 0.3 * (sp ? 2 : 1) }; }
  if (u.kind === 'barrel' && !sp) { explode(t.x, t.y, 0.55); splash(u, t.x, t.y, 70, 0.12, t); }
  if (sp && final) {
    if (u.kind === 'warrior') { splash(u, t.x, t.y, 85, 0.4, t); fx.push({ type: 'slash', x: t.x, y: t.y - 30, t: 0, life: 260, dir: u.facing }); shake(6, 200); }
    if (u.kind === 'pawn') { addText(t.x, t.y - t.K.head * US - 30, 'SHOCK', '#fff27a', 13, 700); splash(u, t.x, t.y, 70, 0.3, t); shake(5, 160); }
    if (u.kind === 'torch') { fx.push({ type: 'sprite', img: 'fire', fw: 128, fh: 128, n: 7, fps: 14, x: t.x, y: t.y + 8, ax: 64, ay: 105, s: 0.8, t: 0, loops: 2 }); splash(u, t.x, t.y, 70, 0.35, t); shake(5, 160); }
    if (u.kind === 'barrel') { explode(t.x, t.y, 1.1); splash(u, t.x, t.y, 90, 0.4, t); }
  }
}

function explode(x, y, s) {
  fx.push({ type: 'sprite', img: 'explosion', fw: 192, fh: 192, n: 9, fps: 20, x: x, y: y + 10, ax: 96, ay: 120, s: 0.75 * (s || 1), t: 0, loops: 1 });
  SFX.boom(); shake(4 + 5 * (s || 1), 240);
}

function splash(u, x, y, r, mult, except) {
  G.units.forEach(function (e) {
    if (e.dead || e.team === u.team || e === except) return;
    var dx = e.x - x, dy = (e.y - y) * 1.4; if (dx * dx + dy * dy <= r * r) hit(u, e, 2.5 * mult, true, true);
  });
}

function hit(u, t, mult, special, isSplash, color) {
  if (t.dead) return;
  var crit = !special && !isSplash && R() < 0.1;
  var dmg = Math.round(u.K.pow * (u.pm || 1) * rand(0.85, 1.15) * mult * (crit ? 1.5 : 1) * surgeMult());
  t.hp = Math.max(0, t.hp - dmg); u.dmg += dmg;
  t.gauge = Math.min(100, t.gauge + 9);
  t.flash = 110; t.shake = 160; t.kx = (t.x >= u.x ? 1 : -1) * (special ? 9 : 5);
  var big = special && !isSplash;
  addText(t.x + rand(-10, 10), t.y - t.K.head * US - 6, String(dmg), color || (big ? '#ffd23f' : crit ? '#ff8a3d' : '#ffffff'), big ? 26 : crit ? 21 : 17, 760, big || crit);
  fx.push({ type: 'spark', x: t.x - t.kx * 2, y: t.y - 32, t: 0, life: big ? 260 : 170, big: big || crit, rot: R() * 6 });
  if (big) hitstop = Math.max(hitstop, 60);
  SFX.hit();
  if (t.hp <= 0) {
    t.dead = true; t.deathT = 0; t.act = null; t.burn = null; u.kos++;
    addText(t.x, t.y - t.K.head * US - 28, 'KO!', '#ff5a5a', 20, 800, true);
    SFX.ko(); shake(4, 140);
    if (G.queue) { var qi = G.queue.indexOf(t); if (qi >= 0 && qi >= G.qi) G.queue.splice(qi, 1); }
  }
}

function shake(m, d) { if (m >= shakeMag || shakeT <= 0) { shakeMag = m; shakeT = d; } }
function addText(x, y, s, color, size, life, pop) { texts.push({ x: x, y: y, s: s, color: color, size: size, t: 0, life: life || 700, pop: !!pop }); }

function landed(p) { if (p.last && p.act) p.act.ready = true; }
function updateProjectiles(dt) {
  for (var i = projectiles.length - 1; i >= 0; i--) {
    var p = projectiles[i], t = p.target;
    if (p.kind === 'arrow') {
      if (p.delay > 0) { p.delay -= dt; continue; }
      var tx = t.x, ty = t.y - 30, dx = tx - p.x, dy = ty - p.y, d = Math.sqrt(dx * dx + dy * dy), st = p.speed * dt / 1000;
      p.ang = Math.atan2(dy, dx);
      if (d <= st + 6 || t.dead) {
        if (!t.dead) hit(p.owner, t, p.mult, p.special);
        if (p.pierce) { splash(p.owner, tx, ty + 30, 75, 0.4, t); fx.push({ type: 'ring', x: tx, y: ty + 26, t: 0, life: 300, color: '#9fe3ff' }); }
        if (!t.dead || d < 60) fx.push({ type: 'stuck', x: tx, y: ty, ang: p.ang, t: 0, life: 260 });
        landed(p); projectiles.splice(i, 1); continue;
      }
      p.x += dx / d * st; p.y += dy / d * st;
    } else {
      p.t += dt; if (!t.dead) { p.tx += (t.x - p.tx) * Math.min(1, dt / 120); p.ty += (t.y - p.ty) * Math.min(1, dt / 120); }
      var k = Math.min(1, p.t / p.dur);
      p.x = p.sx + (p.tx - p.sx) * k; p.y = p.sy + (p.ty - 10 - p.sy) * k - Math.sin(k * Math.PI) * 110; p.rot += dt * 0.02;
      if (k >= 1) {
        explode(p.tx, p.ty, p.special ? 1.25 : 0.7);
        if (!t.dead) hit(p.owner, t, p.special ? 2.5 : 1, p.special);
        if (p.special) splash(p.owner, p.tx, p.ty, 95, 0.4, t);
        landed(p); projectiles.splice(i, 1);
      }
    }
  }
}

// ---- turn controller ----
function busy() { return projectiles.length > 0 || G.units.some(function (u) { return u.act; }); }
function beginPlayerTurn() {
  G.side = 'blue'; G.mode = 'select'; G.queue = []; G.qi = 0; G.turn++;
  banner = { text: 'YOUR TURN', sub: G.turn === 1 ? 'Tap knights to set the attack order' : 'Turn ' + G.turn, t: 0, life: 1000, color: 'blue' };
  if (G.turn === 6) { banner.sub = 'RIFT SURGE — damage rising!'; }
  tone(523, 0.08, 'square', 0.04); updateCmd();
}
function executeOrders() {
  if (!G || G.mode !== 'select' || !G.queue.length || phase !== 'battle') return;
  G.mode = 'resolve'; G.side = 'blue'; G.qi = 0; G.gap = 120; G.cur = null; SFX.fight(); updateCmd();
}
function beginEnemyTurn() {
  G.side = 'red'; G.mode = 'enemyIntro'; G.gap = 520; G.qi = 0; G.cur = null;
  G.queue = shuffle(alive('red'));
  banner = { text: 'ENEMY TURN', t: 0, life: 850, color: 'red' };
  tone(220, 0.15, 'sawtooth', 0.04, 0.8); updateCmd();
}
function controller(dt) {
  if (G.mode === 'select') return;
  if (G.mode === 'enemyIntro') { G.gap -= dt; if (G.gap <= 0) { G.mode = 'resolve'; G.gap = 0; } return; }
  if (G.mode === 'resolve') {
    var c = G.cur;
    if (c && !c.dead && c.act && (c.act.stage === 'go' || c.act.stage === 'atk' || !(c.act.ready && c.act.readyT >= 60))) return; // strictly one attacker at a time
    G.gap -= dt; if (G.gap > 0) return;
    if (alive(G.side === 'blue' ? 'red' : 'blue').length === 0) { G.mode = 'finish'; return; }
    while (G.qi < G.queue.length && G.queue[G.qi].dead) G.qi++;
    if (G.qi < G.queue.length) {
      var u = G.queue[G.qi++]; G.cur = u; startAction(u); G.gap = 90; return;
    }
    G.mode = 'finish';
  }
  if (G.mode === 'finish') {
    if (busy()) return;
    G.queue = []; G.cur = null;
    if (alive('red').length === 0 || alive('blue').length === 0) return; // step() will end the battle
    if (G.side === 'blue') beginEnemyTurn(); else beginPlayerTurn();
  }
}

function toggleQueue(u) {
  if (!G || G.mode !== 'select' || u.dead || u.team !== 'blue') return;
  var i = G.queue.indexOf(u);
  if (i >= 0) G.queue.splice(i, 1); else G.queue.push(u);
  u.pop = 160; tone(i >= 0 ? 440 : 660 + G.queue.length * 40, 0.05, 'square', 0.03); updateCmd();
}
function queueAll() { if (!G || G.mode !== 'select') return; alive('blue').forEach(function (u) { if (G.queue.indexOf(u) < 0) G.queue.push(u); }); tone(880, 0.06, 'square', 0.03); updateCmd(); }
function clearQueue() { if (!G || G.mode !== 'select') return; G.queue = []; tone(330, 0.05, 'square', 0.03); updateCmd(); }

function step(dt) {
  now += dt;
  if (phase === 'battle' || phase === 'ending') {
    if (hitstop > 0) { hitstop -= dt; dt *= 0.15; }
    G.t += dt;
    if (phase === 'battle' && AUTO && G.mode === 'select') { shuffle(alive('blue')).forEach(function (u) { G.queue.push(u); }); executeOrders(); }
    var order = shuffle(G.units.slice());
    for (var i = 0; i < order.length; i++) updateUnit(order[i], dt);
    updateProjectiles(dt);
    if (phase === 'battle') {
      controller(dt);
      var b = alive('blue').length, r = alive('red').length;
      if ((b === 0 || r === 0) && !busy()) {
        phase = 'ending'; G.endT = 0; G.result = b > 0 ? 'win' : r > 0 ? 'lose' : 'draw'; G.mode = 'over'; updateCmd();
        banner = { text: G.result === 'win' ? 'VICTORY!' : G.result === 'lose' ? 'DEFEAT' : 'DOUBLE KO', t: 0, life: 1400, color: G.result === 'win' ? 'blue' : G.result === 'lose' ? 'red' : 'yellow' };
        (G.result === 'win' ? SFX.win : SFX.lose)();
      }
    } else {
      G.endT += dt; if (G.endT > 1450) showResults();
    }
  } else if (G) {
    G.units.forEach(function (u) { u.at += dt; u.shownHp = u.hp; });
  }
  G && G.units.forEach(function (u) { if (u.pop > 0) u.pop -= dt; });
  for (var f = fx.length - 1; f >= 0; f--) { var e = fx[f]; e.t += dt; var life = e.life || (e.n / e.fps * 1000 * (e.loops || 1)); if (e.t >= life) fx.splice(f, 1); }
  for (var q = texts.length - 1; q >= 0; q--) { texts[q].t += dt; if (texts[q].t >= texts[q].life) texts.splice(q, 1); }
  if (shakeT > 0) shakeT -= dt;
  if (banner) { banner.t += dt; if (banner.t > banner.life) banner = null; }
}

// ---------- terrain ----------
var groundLayer, props = [];
function isIsland(c, r) { return c >= ISL.c0 && c <= ISL.c1 && r >= ISL.r0 && r <= ISL.r1; }
function buildTerrain() {
  groundLayer = document.createElement('canvas'); groundLayer.width = W; groundLayer.height = H;
  var g = groundLayer.getContext('2d'); g.imageSmoothingEnabled = false;
  for (var r = ISL.r0; r <= ISL.r1; r++) for (var c = ISL.c0; c <= ISL.c1; c++) {
    var sx = c === ISL.c0 ? 0 : c === ISL.c1 ? 2 : 1, sy = r === ISL.r0 ? 0 : r === ISL.r1 ? 2 : 1;
    g.drawImage(IMG.flat, sx * 64, sy * 64, 64, 64, c * 64, r * 64, 64, 64);
  }
  // ground deco
  var deco = [['13', 150, 120], ['10', 330, 110], ['01', 420, 140], ['02', 600, 120], ['11', 690, 112], ['04', 860, 120],
    ['08', 90, 300], ['14', 330, 470], ['03', 470, 480], ['05', 590, 470], ['12', 700, 482], ['07', 930, 300], ['10', 900, 440],
    ['13', 120, 450], ['01', 560, 320], ['14', 470, 215], ['02', 300, 330], ['10', 720, 330], ['09', 845, 495], ['07', 175, 500]];
  deco.forEach(function (d) { var im = IMG['deco' + d[0]], q = mp(d[1], d[2]); g.drawImage(im, Math.round(q[0] - im.width / 2), Math.round(q[1] - im.height + 10)); });
  // props drawn y-sorted with units
  props = [
    { img: 'tree', fw: 192, fh: 192, n: 4, ax: 96, ay: 178, x: 90, y: 112, s: 0.7, ph: 0 },
    { img: 'tree', fw: 192, fh: 192, n: 4, ax: 96, ay: 178, x: 250, y: 92, s: 0.62, ph: 2 },
    { img: 'tree', fw: 192, fh: 192, n: 4, ax: 96, ay: 178, x: 520, y: 86, s: 0.58, ph: 1 },
    { img: 'tree', fw: 192, fh: 192, n: 4, ax: 96, ay: 178, x: 790, y: 92, s: 0.62, ph: 3 },
    { img: 'tree', fw: 192, fh: 192, n: 4, ax: 96, ay: 178, x: 950, y: 520, s: 0.66, ph: 1 },
    { img: 'tree', fw: 192, fh: 192, n: 4, ax: 96, ay: 178, x: 76, y: 525, s: 0.66, ph: 2 },
    { img: 'tower', fw: 128, fh: 256, n: 1, ax: 64, ay: 235, x: 168, y: 128, s: 0.55 },
    { img: 'ghouse', fw: 128, fh: 192, n: 1, ax: 64, ay: 171, x: 880, y: 128, s: 0.62 },
    { img: 'sheep', fw: 128, fh: 128, n: 8, ax: 64, ay: 86, x: 400, y: 104, s: 0.6, ph: 0, fps: 8 },
    { img: 'sheep', fw: 128, fh: 128, n: 8, ax: 64, ay: 86, x: 650, y: 108, s: 0.6, ph: 3, fps: 8, flip: true }
  ];
  props.forEach(function (p) { var q = mp(p.x, p.y); p.x = q[0]; p.y = q[1]; });
}
var ROCKS = [['rocks1', 30, 120], ['rocks3', 990, 200], ['rocks1', 990, 470], ['rocks3', 40, 360], ['rocks1', 470, 30], ['rocks3', 700, 556], ['rocks1', 300, 556]];

function drawTerrain() {
  var ff = Math.floor(now / 110) % 8;
  for (var r = ISL.r0; r <= ISL.r1; r++) for (var c = ISL.c0; c <= ISL.c1; c++) {
    if (r === ISL.r0 || r === ISL.r1 || c === ISL.c0 || c === ISL.c1) ctx.drawImage(IMG.foam, ((ff + c + r) % 8) * 192, 0, 192, 192, c * 64 - 64, r * 64 - 64, 192, 192);
  }
  ROCKS.forEach(function (k, i) { var f = (Math.floor(now / 140) + i * 3) % 8, q = mp(k[1], k[2]); ctx.drawImage(IMG[k[0]], f * 128, 0, 128, 128, q[0] - 64, q[1] - 72, 128, 128); });
  ctx.drawImage(groundLayer, 0, 0);
}

// ---------- drawing ----------
function drawFrame(imgKey, src, fw, fh, col, row, x, y, ax, ay, s, flip, alpha) {
  var im = src || IMG[imgKey];
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (flip) ctx.scale(-1, 1);
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  ctx.drawImage(im, col * fw, row * fh, fw, fh, -ax * s, -ay * s, fw * s, fh * s);
  ctx.restore();
}

function unitFrame(u) {
  var K = u.K;
  if (u.act && u.act.stage === 'atk') { var d = u.act.def; return { r: d.r, c: Math.min(d.n - 1, Math.floor(u.act.t * d.fps / 1000)) }; }
  var a = K[u.anim] || K.idle; return { r: a.r, c: Math.floor(u.at * a.fps / 1000) % a.n };
}

function drawUnit(u) {
  var K = u.K, f = K.f;
  if (u.dead) {
    // brief white pop of the unit, then official Dead sheet
    if (u.deathT < 140) { var fr0 = unitFrame(u); drawFrame(null, WHITE[K.img], f.fw, f.fh, fr0.c, fr0.r, u.x, u.y, f.ax, f.ay, US * (1 + u.deathT / 900), u.facing < 0, 1 - u.deathT / 200); }
    var dt = u.deathT - 60; if (dt < 0) return;
    var idx = Math.floor(dt / 85); if (idx > 13) idx = 13;
    var al = u.deathT > 1300 ? Math.max(0, 1 - (u.deathT - 1300) / 400) : 1;
    drawFrame('dead', null, 128, 128, idx % 7, idx < 7 ? 0 : 1, u.x, u.y, 64, 96, US * 0.95, u.facing < 0, al);
    return;
  }
  var fr = unitFrame(u);
  var sx = u.shake > 0 ? (R() - 0.5) * 5 * (u.shake / 160) : 0;
  var x = u.x + u.kx + sx, y = u.y;
  var sq = u.flash > 0 ? 1 + 0.08 * (u.flash / 110) : 1;
  // special-ready aura
  if (u.gauge >= 100 && phase === 'battle') {
    var p = 0.5 + 0.5 * Math.sin(now / 90);
    ctx.save(); ctx.globalAlpha = 0.35 + 0.25 * p; ctx.fillStyle = u.team === 'blue' ? '#8fe6ff' : '#ffb35a';
    ctx.beginPath(); ctx.ellipse(x, y - 4, 26 + p * 4, 9 + p * 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  var qn = queuedNum(u);
  if (!qn && G && G.mode === 'select' && u.team === 'blue' && phase === 'battle') { // selectable hint
    ctx.save(); ctx.globalAlpha = 0.25 + 0.15 * Math.sin(now / 200); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y - 2, 24, 8, 0, 0, 7); ctx.stroke(); ctx.restore();
  }
  ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.scale(u.facing < 0 ? -1 / sq : 1 / sq, sq);
  if (qn) {
    var o = 2.6, sw = f.fw * US, sh = f.fh * US, ox0 = -f.ax * US, oy0 = -f.ay * US;
    ctx.globalAlpha = 0.95;
    [[o, 0], [-o, 0], [0, o], [0, -o], [o * 0.7, o * 0.7], [-o * 0.7, o * 0.7], [o * 0.7, -o * 0.7], [-o * 0.7, -o * 0.7]].forEach(function (d) {
      ctx.drawImage(CYAN[K.img], fr.c * f.fw, fr.r * f.fh, f.fw, f.fh, ox0 + d[0], oy0 + d[1], sw, sh);
    });
    ctx.globalAlpha = 1;
  }
  ctx.drawImage(IMG[K.img], fr.c * f.fw, fr.r * f.fh, f.fw, f.fh, -f.ax * US, -f.ay * US, f.fw * US, f.fh * US);
  if (u.flash > 0) { ctx.globalAlpha = Math.min(1, u.flash / 80); ctx.drawImage(WHITE[K.img], fr.c * f.fw, fr.r * f.fh, f.fw, f.fh, -f.ax * US, -f.ay * US, f.fw * US, f.fh * US); }
  ctx.restore();
}

function queuedNum(u) {
  if (!G || !G.queue || G.side !== 'blue' || u.team !== 'blue' || u.dead) return 0;
  if (G.mode !== 'select' && G.mode !== 'resolve') return 0;
  var i = G.queue.indexOf(u); if (i < 0) return 0;
  if (G.mode === 'resolve' && i < G.qi - 1) return 0;
  return i + 1;
}
function drawBadge(u) {
  var n = queuedNum(u); if (!n) return;
  var r = 11 * TS * (u.pop > 0 ? 1 + u.pop / 400 : 1), x = u.x, y = u.y - u.K.head * US - 24 - 14 * TS;
  ctx.save(); ctx.fillStyle = '#0d3d4a'; ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, 7); ctx.fill();
  ctx.fillStyle = '#38f2ff'; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
  ctx.font = '900 ' + Math.round(r * 1.35) + 'px Trebuchet MS, Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillStyle = '#062830'; ctx.fillText(String(n), x, y + 1); ctx.restore();
}
function drawBars(u) {
  if (u.dead) return;
  var w = 46 * TS, bh = 5 * TS, gh = 3 * TS, x = u.x - w / 2, y = u.y - u.K.head * US - 10 - 6 * TS;
  ctx.fillStyle = 'rgba(20,14,10,.85)'; ctx.fillRect(x - 2, y - 2, w + 4, bh + gh + 5);
  ctx.fillStyle = '#5a1f1f'; ctx.fillRect(x, y, w, bh);
  ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w * Math.max(0, u.shownHp) / u.maxhp, bh);
  var pc = u.hp / u.maxhp;
  ctx.fillStyle = u.team === 'blue' ? (pc > 0.35 ? '#4fd36b' : '#ffcf3a') : (pc > 0.35 ? '#ff5b4a' : '#ffcf3a');
  ctx.fillRect(x, y, w * pc, bh);
  var gp = Math.min(1, u.gauge / 100);
  ctx.fillStyle = '#2a2a3a'; ctx.fillRect(x, y + bh + 1, w, gh);
  ctx.fillStyle = gp >= 1 ? ((now / 120 | 0) % 2 ? '#fff6a0' : '#ffc928') : '#ffc928'; ctx.fillRect(x, y + bh + 1, w * gp, gh);
  ctx.font = '700 ' + Math.round(10 * TS) + 'px Trebuchet MS, Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
  ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(0,0,0,.75)'; ctx.strokeText(u.name, u.x, y - 4);
  ctx.fillStyle = u.team === 'blue' ? '#d6f1ff' : '#ffd9cf'; ctx.fillText(u.name, u.x, y - 4);
}

function drawFx(e) {
  if (e.type === 'sprite') {
    var fr = Math.floor(e.t * e.fps / 1000) % e.n;
    drawFrame(e.img, null, e.fw, e.fh, fr, 0, e.x, e.y, e.ax, e.ay, e.s, false);
  } else if (e.type === 'spark') {
    var k = e.t / e.life, r = (e.big ? 26 : 16) * (0.4 + k);
    ctx.save(); ctx.translate(e.x, e.y); ctx.rotate(e.rot); ctx.globalAlpha = 1 - k;
    ctx.strokeStyle = e.big ? '#ffe066' : '#ffffff'; ctx.lineWidth = e.big ? 4 : 3;
    for (var i = 0; i < 6; i++) { var a = i * Math.PI / 3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.35, Math.sin(a) * r * 0.35); ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, (e.big ? 9 : 6) * (1 - k), 0, 7); ctx.fill();
    ctx.restore();
  } else if (e.type === 'ring') {
    var kk = e.t / e.life; ctx.save(); ctx.globalAlpha = 1 - kk; ctx.strokeStyle = e.color; ctx.lineWidth = 5 * (1 - kk) + 1;
    ctx.beginPath(); ctx.ellipse(e.x, e.y, 20 + kk * 50, 10 + kk * 25, 0, 0, 7); ctx.stroke(); ctx.restore();
  } else if (e.type === 'slash') {
    var ks = e.t / e.life; ctx.save(); ctx.translate(e.x, e.y); ctx.scale(e.dir, 1); ctx.globalAlpha = 1 - ks;
    ctx.strokeStyle = '#e8fbff'; ctx.lineWidth = 7 * (1 - ks) + 2; ctx.beginPath(); ctx.arc(-10, 0, 40 + ks * 18, -1.2, 1.2); ctx.stroke(); ctx.restore();
  } else if (e.type === 'stuck') {
    ctx.save(); ctx.globalAlpha = 1 - e.t / e.life; ctx.translate(e.x, e.y); ctx.rotate(e.ang);
    ctx.drawImage(IMG.arrow, 0, 64, 64, 64, -40, -35 * 0.7, 64 * 0.7, 64 * 0.7); ctx.restore();
  }
}

function drawProjectile(p) {
  if (p.kind === 'arrow') {
    if (p.delay > 0) return;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.ang || 0); var s = p.special ? 0.85 : 0.7;
    if (p.special) { ctx.globalAlpha = 0.5; ctx.fillStyle = '#9fe3ff'; ctx.fillRect(-60, -3, 50, 6); ctx.globalAlpha = 1; }
    ctx.drawImage(IMG.arrow, 0, 0, 64, 64, -48 * s, -35 * s, 64 * s, 64 * s); ctx.restore();
  } else {
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,.25)'; var k = Math.min(1, p.t / p.dur);
    ctx.beginPath(); ctx.ellipse(p.sx + (p.tx - p.sx) * k, p.sy + 40 + (p.ty - p.sy - 40) * k, 9, 4, 0, 0, 7); ctx.fill(); ctx.restore();
    var fr = Math.floor(now / 70) % 6, s2 = p.special ? 0.95 : 0.7;
    ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.drawImage(IMG.dynamite, fr * 64, 0, 64, 64, -32 * s2, -32 * s2, 64 * s2, 64 * s2); ctx.restore();
  }
}

function drawText(t) {
  var k = t.t / t.life, y = t.y - 34 * (1 - Math.pow(1 - k, 2)), sc = t.pop ? (k < 0.12 ? 1.7 - k / 0.12 * 0.7 : 1) : (k < 0.08 ? 1.3 - k / 0.08 * 0.3 : 1);
  ctx.save(); ctx.globalAlpha = k > 0.7 ? 1 - (k - 0.7) / 0.3 : 1; ctx.translate(t.x, y); ctx.scale(sc, sc);
  var fsz = Math.round(t.size * TS); ctx.font = '900 ' + fsz + 'px Trebuchet MS, Verdana, sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, fsz / 4.5); ctx.strokeStyle = '#1a0f08'; ctx.strokeText(t.s, 0, 0);
  ctx.fillStyle = t.color; ctx.fillText(t.s, 0, 0); ctx.restore();
}

function draw3(img, x, y, w, h) {
  var s = h / 64, e = 64 * s;
  ctx.drawImage(img, 0, 0, 64, 64, x, y, e, h); ctx.drawImage(img, 64, 0, 64, 64, x + e, y, Math.max(0, w - 2 * e), h); ctx.drawImage(img, 128, 0, 64, 64, x + w - e, y, e, h);
}
function outlined(s, x, y, size, color, align) {
  ctx.font = '900 ' + size + 'px Trebuchet MS, Verdana, sans-serif'; ctx.textAlign = align || 'center'; ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(3, size / 5); ctx.strokeStyle = '#1a0f08'; ctx.strokeText(s, x, y); ctx.fillStyle = color; ctx.fillText(s, x, y);
}

function drawHud() {
  if (!G || phase === 'title' || phase === 'loading') return;
  var w = Math.min(300, (VWc - 96) / 2), h = Math.round(Math.min(44, Math.max(34, w / 6.5))), fs = Math.round(h * 0.38), pad = Math.round(h * 1.05), top = 6 + SAFE_T;
  ['blue', 'red'].forEach(function (team) {
    var us = G.units.filter(function (u) { return u.team === team; }), al = us.filter(function (u) { return !u.dead; }).length, tot = us.length;
    var hp = 0, mx = 0; us.forEach(function (u) { hp += Math.max(0, u.shownHp); mx += u.maxhp; });
    var x = team === 'blue' ? 6 : VWc - 6 - w, isB = team === 'blue';
    draw3(isB ? IMG.ribbonBlue : IMG.ribbonRed, x, top, w, h);
    outlined(w > 190 ? (isB ? 'KNIGHTS' : 'GOBLINS') : (isB ? 'BLUE' : 'RED'), x + (isB ? pad : w - pad), top + h * 0.42, fs, '#fff', isB ? 'left' : 'right');
    outlined(al + '/' + tot, x + (isB ? w - pad : pad), top + h * 0.42, fs, '#fff', isB ? 'right' : 'left');
    var bx = x + h * 0.6, bw = w - h * 1.2, by = top + h + 2;
    ctx.fillStyle = 'rgba(20,14,10,.85)'; ctx.fillRect(bx - 2, by - 2, bw + 4, 10);
    ctx.fillStyle = isB ? '#4fd36b' : '#ff5b4a';
    var fw = bw * hp / mx; ctx.fillRect(isB ? bx : bx + bw - fw, by, fw, 6);
  });
  var mine = G.side === 'blue' && G.mode !== 'over';
  var label = G.mode === 'over' ? '' : mine ? 'YOUR TURN' : 'ENEMY TURN';
  var cw = Math.max(70, VWc - 2 * w - 24);
  outlined('Turn ' + Math.max(1, G.turn), VWc / 2, top + h * 0.28, Math.round(fs * 0.85), '#fff');
  if (label) outlined(label, VWc / 2, top + h * 0.28 + fs * 1.15, Math.round(Math.min(fs * 1.35, cw / (label.length * 0.62))), mine ? '#7ff3ff' : '#ff8a7a');
  if (surgeMult() > 1) outlined('SURGE x' + surgeMult().toFixed(2), VWc / 2, top + h + 14, 11, '#ffd23f');
}

function drawBanner() {
  if (!banner) return;
  var k = banner.t / banner.life, sc = k < 0.12 ? 2.2 - k / 0.12 * 1.2 : 1, al = k > 0.8 ? 1 - (k - 0.8) / 0.2 : 1;
  var bs = Math.min(1, (VWc - 20) / 400);
  ctx.save(); ctx.globalAlpha = al; ctx.translate(VWc / 2, VHc / 2 - 30); ctx.scale(sc * bs, sc * bs);
  var img = banner.color === 'blue' ? IMG.ribbonBlue : banner.color === 'red' ? IMG.ribbonRed : IMG.ribbonYellow;
  draw3(img, -190, -40, 380, 80);
  outlined(banner.text, 0, -6, 40, '#fff');
  if (banner.sub) outlined(banner.sub, 0, 50, 16, '#ffe27a');
  ctx.restore();
}

var scale = 1, dpr = 1, OX = 0, OY = 0, VWc = 1024, VHc = 576, TS = 1, SAFE_T = 0;
function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#47aba9'; ctx.fillRect(0, 0, VWc, VHc);
  ctx.setTransform(scale * dpr, 0, 0, scale * dpr, OX * dpr, OY * dpr);
  ctx.imageSmoothingEnabled = false;
  ctx.save();
  if (shakeT > 0) ctx.translate((R() - 0.5) * shakeMag * 2 * (shakeT / 240), (R() - 0.5) * shakeMag * 2 * (shakeT / 240));
  drawTerrain();
  var list = [];
  props.forEach(function (p) { list.push({ y: p.y, p: p }); });
  if (G) G.units.forEach(function (u) { if (!u.gone) list.push({ y: u.dead ? u.y - 1000 : u.y, u: u }); });
  fx.forEach(function (e) { if (e.type === 'sprite') list.push({ y: e.y + 1, e: e }); });
  list.sort(function (a, b) { return a.y - b.y; });
  list.forEach(function (o) {
    if (o.p) { var p = o.p, fr = p.n > 1 ? (Math.floor(now / (1000 / (p.fps || 6))) + p.ph) % p.n : 0; drawFrame(p.img, null, p.fw, p.fh, fr, 0, p.x, p.y, p.ax, p.ay, p.s, p.flip); }
    else if (o.u) drawUnit(o.u); else drawFx(o.e);
  });
  fx.forEach(function (e) { if (e.type !== 'sprite') drawFx(e); });
  projectiles.forEach(drawProjectile);
  if (G && phase !== 'title') { G.units.forEach(drawBars); G.units.forEach(drawBadge); }
  texts.forEach(drawText);
  ctx.restore();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawHud(); drawBanner();
}

// ---------- layout ----------
function remap(toPort) {
  function f(o, kx, ky) { if (o[kx] === undefined) return; var x = o[kx], y = o[ky]; if (toPort) { o[kx] = y; o[ky] = LW - x; } else { o[kx] = LW - y; o[ky] = x; } }
  if (G) G.units.forEach(function (u) { f(u, 'x', 'y'); });
  projectiles.forEach(function (p) { f(p, 'x', 'y'); f(p, 'sx', 'sy'); f(p, 'tx', 'ty'); });
  fx.forEach(function (e) { f(e, 'x', 'y'); }); texts.forEach(function (t) { f(t, 'x', 'y'); });
}
function layout() {
  var vw = window.innerWidth, vh = window.innerHeight;
  var port = vh > vw * 1.05;
  if (port !== PORT) { var had = !!groundLayer; setOrientation(port); if (had) { remap(port); buildTerrain(); } }
  var sp = document.getElementById('safeProbe'); SAFE_T = sp ? sp.offsetHeight || 0 : 0;
  VWc = vw; VHc = vh; dpr = Math.min(window.devicePixelRatio || 1, 2.5);
  var topR = PORT ? 52 + SAFE_T : (vh < 520 ? 30 : 0), botR = PORT ? 96 : (vh < 520 ? 58 : 66);
  scale = Math.min(vw / VIEW.w, (vh - topR - botR) / VIEW.h);
  OX = (vw - VIEW.w * scale) / 2 - VIEW.x * scale;
  OY = topR + (vh - topR - botR - VIEW.h * scale) / 2 - VIEW.y * scale;
  TS = Math.max(1, Math.min(1.7, 0.9 / scale));
  stage.style.width = vw + 'px'; stage.style.height = vh + 'px';
  cv.style.width = vw + 'px'; cv.style.height = vh + 'px';
  cv.width = Math.round(vw * dpr); cv.height = Math.round(vh * dpr);
}
window.addEventListener('resize', layout);
window.addEventListener('orientationchange', function () { setTimeout(layout, 250); });
if (window.visualViewport) window.visualViewport.addEventListener('resize', layout);

// ---------- screens ----------
function $(id) { return document.getElementById(id); }
function show(id) { ['loading', 'title', 'results'].forEach(function (s) { $(s).classList.toggle('show', s === id); }); $('hudBtns').classList.toggle('show', id === null); $('cmdBar').classList.toggle('show', id === null); updateCmd(); }
function toTitle() { newBattle(); phase = 'title'; paused = false; $('pausedTag').style.display = 'none'; show('title'); }
function startFight() {
  audio(); newBattle(); phase = 'battle'; paused = false; $('pausedTag').style.display = 'none'; show(null);
  beginPlayerTurn(); banner.text = G.nRed + ' GOBLINS!'; banner.color = 'yellow'; banner.life = 1300;
}
function showResults() {
  if (phase === 'results') return; phase = 'results';
  var r = G.result, rib = $('resRibbon');
  rib.className = 'ribbon resTitle ' + (r === 'win' ? 'ribbon-blue' : r === 'lose' ? 'ribbon-red' : 'ribbon-yellow');
  rib.textContent = r === 'win' ? 'VICTORY' : r === 'lose' ? 'DEFEAT' : 'DRAW';
  $('resSub').textContent = r === 'win' ? 'The Knights hold the rift!' : r === 'lose' ? 'The Goblins overran the rift…' : 'Nobody left standing!';
  var blue = G.units.filter(function (u) { return u.team === 'blue'; }), red = G.units.filter(function (u) { return u.team === 'red'; });
  var bAlive = blue.filter(function (u) { return !u.dead; }).length, rAlive = red.filter(function (u) { return !u.dead; }).length;
  var mvp = G.units.slice().sort(function (a, b) { return b.dmg - a.dmg; })[0];
  var bd = blue.reduce(function (s, u) { return s + u.dmg; }, 0), rd = red.reduce(function (s, u) { return s + u.dmg; }, 0);
  $('resStats').innerHTML = '<span class="ln">Turns: <b>' + G.turn + '</b> · Raid size: <b class="r">' + G.nRed + ' Goblins</b></span>' +
    '<span class="ln">Standing: <b>' + bAlive + '/6 Knights</b> · <b class="r">' + rAlive + '/' + G.nRed + ' Goblins</b></span>' +
    '<span class="ln">Damage: <b>' + bd.toLocaleString() + '</b> vs <b class="r">' + rd.toLocaleString() + '</b></span>' +
    '<span class="ln">MVP: <b class="' + (mvp.team === 'red' ? 'r' : '') + '">' + mvp.name + '</b> the ' + mvp.K.label + ' — ' + mvp.dmg.toLocaleString() + ' dmg, ' + mvp.kos + ' KO' + (mvp.kos === 1 ? '' : 's') + '</span>';
  show('results');
}
function updateCmd() {
  var bar = $('cmdBar'); if (!bar) return;
  var sel = !!(G && phase === 'battle' && G.mode === 'select');
  bar.classList.toggle('locked', !sel);
  var n = sel ? G.queue.length : 0, liv = G ? alive('blue').length : 0;
  $('btnExec').classList.toggle('off', !n);
  $('btnExec').textContent = n ? 'EXECUTE ' + n : 'EXECUTE';
  $('btnAll').classList.toggle('off', !sel || n === liv);
  $('btnClear').classList.toggle('off', !n);
  $('cmdHint').textContent = !G || phase !== 'battle' ? '' : sel ? (n ? 'Tap again to remove · order = attack order' : 'Tap your knights in attack order') : G.side === 'blue' ? 'Your knights are attacking…' : 'Goblins are attacking…';
}
function canvasTap(cx, cy) {
  if (!G || phase !== 'battle' || G.mode !== 'select' || paused) return;
  var wx = (cx - OX) / scale, wy = (cy - OY) / scale, best = null, bd = 1e9, rad = Math.max(38, 24 / scale);
  alive('blue').forEach(function (u) {
    var dx = wx - u.x, dy = wy - (u.y - 26), d = Math.sqrt(dx * dx + dy * dy * 0.7);
    if (d < rad && d < bd) { bd = d; best = u; }
  });
  if (best) toggleQueue(best);
}
var lastTouch = 0;
cv.addEventListener('touchstart', function (e) { var t = e.changedTouches[0]; lastTouch = Date.now(); e.preventDefault(); canvasTap(t.clientX, t.clientY); }, { passive: false });
cv.addEventListener('mousedown', function (e) { if (Date.now() - lastTouch < 600) return; canvasTap(e.clientX, e.clientY); });
function togglePause() { if (phase !== 'battle' && phase !== 'ending') return; paused = !paused; $('pausedTag').style.display = paused ? 'block' : 'none'; $('btnPause').textContent = paused ? '▶' : 'II'; }
function toggleMute() { muted = !muted; try { localStorage.setItem('rs_muted', muted ? '1' : '0'); } catch (e) {} $('btnMute').classList.toggle('off', muted); if (!muted) audio(); }
function toggleSpeed() { speed = speed === 1 ? 2 : 1; $('btnSpeed').textContent = speed + 'x'; }
function tap(id, fn) {
  var el = $(id), lastFire = 0;
  function fire(e) { if (e) e.preventDefault(); var t = Date.now(); if (t - lastFire < 350) return; lastFire = t; el.classList.remove('down'); fn(); }
  el.addEventListener('touchstart', function () { el.classList.add('down'); }, { passive: true });
  el.addEventListener('touchcancel', function () { el.classList.remove('down'); }, { passive: true });
  el.addEventListener('touchend', fire, { passive: false });
  el.addEventListener('click', fire);
}
tap('btnFight', startFight); tap('btnRetry', startFight); tap('btnMenu', toTitle);
tap('btnExec', executeOrders); tap('btnAll', queueAll); tap('btnClear', clearQueue);
tap('btnPause', togglePause); tap('btnMute', toggleMute); tap('btnSpeed', toggleSpeed);
document.addEventListener('gesturestart', function (e) { e.preventDefault(); });
$('btnMute').classList.toggle('off', muted);
window.addEventListener('keydown', function (e) {
  if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); if (phase === 'title' || phase === 'results') startFight(); else executeOrders(); }
  else if (/^Digit[1-6]$/.test(e.code) && G && phase === 'battle') { var bl = G.units.filter(function (u) { return u.team === 'blue'; })[+e.code.slice(5) - 1]; if (bl) toggleQueue(bl); }
  else if (e.code === 'KeyA') queueAll(); else if (e.code === 'KeyC') clearQueue();
  else if (e.code === 'KeyP' || e.code === 'Escape') togglePause();
  else if (e.code === 'KeyM') toggleMute();
  else if (e.code === 'KeyS') toggleSpeed();
});

// ---------- loop ----------
var last = 0;
function frame(ts) {
  var dt = last ? Math.min(50, ts - last) : 16; last = ts;
  if (!paused && phase !== 'loading') {
    var total = dt * speed;
    while (total > 0) { var s = Math.min(total, 17); step(s); total -= s; }
  }
  if (phase !== 'loading') render();
  requestAnimationFrame(frame);
}

// test hooks
window.RIFTSTRIKE = {
  state: function () { return { phase: phase, t: G && G.t, units: G && G.units.map(function (u) { return { name: u.name, team: u.team, kind: u.kind, hp: u.hp, dead: u.dead, anim: u.act ? 'act:' + u.act.stage : u.anim, x: Math.round(u.x), y: Math.round(u.y), gauge: Math.round(u.gauge), dmg: u.dmg }; }), result: G && G.result }; },
  screenPos: function (name) { var u = G.units.filter(function (v) { return v.name === name; })[0]; return { x: u.x * scale + OX, y: (u.y - 26) * scale + OY }; },
  mode: function () { return G && { mode: G.mode, side: G.side, turn: G.turn, queue: G.queue.map(function (u) { return u.name; }), nRed: G.nRed }; },
  fight: startFight, sim: function (n) { var res = { win: 0, lose: 0, draw: 0, t: 0, turns: 0, byN: {} }; AUTO = true; muted = true; for (var k = 0; k < n; k++) { newBattle(); phase = 'battle'; beginPlayerTurn(); var guard = 0; while (phase === 'battle' && guard++ < 60000) step(17); res[G.result]++; res.t += G.t; res.turns += G.turn; var b = res.byN[G.nRed] = res.byN[G.nRed] || { w: 0, l: 0 }; if (G.result === 'win') b.w++; else b.l++; phase = 'title'; } AUTO = false; muted = false; res.avgT = res.t / n / 1000; res.avgTurns = res.turns / n; return res; }, step: function (ms) { var n = Math.ceil(ms / 17); for (var i = 0; i < n; i++) step(17); render(); },
  forceEnd: function (team) { G.units.forEach(function (u) { if (u.team === (team || 'red')) { u.hp = 0; u.dead = true; } }); }
};

layout(); show('loading');
loadAll(function () {
  Object.keys(KINDS).forEach(function (k) { WHITE[KINDS[k].img] = silhouette(IMG[KINDS[k].img], '#ffffff'); CYAN[KINDS[k].img] = silhouette(IMG[KINDS[k].img], '#38f2ff'); });
  buildTerrain(); toTitle();
  if (params.get('auto') === '1') { AUTO = true; startFight(); }
  requestAnimationFrame(frame);
});
})();
