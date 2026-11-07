/* Weston's Planet: WebRTC mesh video room (PeerJS cloud signaling), people float as planets in the 360° sky. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var ICE = { config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] } };
  var PRE = 'akweston-', MAX = 6;
  var qs = new URLSearchParams(location.search);
  $('code').value = (qs.get('room') || '').toUpperCase();
  $('name').value = localStorage.getItem('weston-name') || '';
  var me, hub = null, hubConn = null, local, facing = 'user', code, myName, list = {}, people = {}, left = false;
  function status(t) { $('status').textContent = t || ''; }
  function newCode() { var a = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', s = ''; for (var i = 0; i < 5; i++) s += a[(Math.random() * a.length) | 0]; return s; }
  function silentStream() { /* lets you join with no camera/mic */
    var c = document.createElement('canvas'); c.width = c.height = 16; c.getContext('2d').fillRect(0, 0, 16, 16);
    var s = c.captureStream ? c.captureStream(1) : new MediaStream();
    try { var ac = new (window.AudioContext || window.webkitAudioContext)(), d = ac.createMediaStreamDestination(); s.addTrack(d.stream.getAudioTracks()[0]); } catch (e) {}
    return s; }
  function media() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return Promise.reject(new Error('Camera needs a secure (https) page.'));
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: facing, width: { ideal: 640 }, height: { ideal: 640 } }, audio: { echoCancellation: true, noiseSuppression: true } }); }

  /* ---------- planets ---------- */
  var SLOTS = [[0, 0], [60, 12], [-60, -10], [120, 8], [-120, 14], [180, -6]];
  function dir(k) { var s = SLOTS[k % SLOTS.length], y = s[0] * Math.PI / 180, p = s[1] * Math.PI / 180;
    return [Math.sin(y) * Math.cos(p), Math.sin(p), -Math.cos(y) * Math.cos(p)]; }
  var HUES = ['110,160,255', '255,150,110', '150,230,190', '220,140,255', '255,210,120', '140,220,255'];
  function addPerson(id, stream) {
    var p = people[id];
    if (!p) {
      var used = {}; Object.keys(people).forEach(function (k) { used[people[k].slot] = 1; });
      var slot = 0; while (used[slot]) slot++;
      var el = document.createElement('div'); el.className = 'vp'; el.style.setProperty('--glow', 'rgba(' + HUES[slot % 6] + ',.6)');
      el.innerHTML = '<div class="orb"><video autoplay playsinline></video></div><div class="nm"></div>';
      $('people').appendChild(el);
      p = people[id] = { el: el, slot: slot, v: el.querySelector('video') };
    }
    if (stream && p.v.srcObject !== stream) { p.v.srcObject = stream; var pr = p.v.play(); if (pr && pr.catch) pr.catch(function () {}); }
    p.el.querySelector('.nm').textContent = list[id] || 'Guest';
    count();
  }
  function dropPerson(id) { var p = people[id]; if (!p) return; p.el.remove(); delete people[id]; if (calls[id]) { try { calls[id].close(); } catch (e) {} delete calls[id]; } count(); }
  function count() { var n = Object.keys(people).length; status(n ? (n + 1) + ' in the room · turn around to find everyone' : 'Waiting for others… share the invite link'); }
  function place() {
    if (window.SKY) {
      var F = SKY.F();
      Object.keys(people).forEach(function (id) {
        var p = people[id], q = SKY.proj(dir(p.slot));
        if (!q) { p.el.style.display = 'none'; return; }
        p.el.style.display = '';
        p.el.style.setProperty('--d', Math.max(60, F * .3 / q[2]).toFixed(0) + 'px');
        p.el.style.transform = 'translate(' + q[0].toFixed(1) + 'px,' + q[1].toFixed(1) + 'px)';
      });
    }
    requestAnimationFrame(place);
  }
  requestAnimationFrame(place);

  /* ---------- calls (mesh) ---------- */
  var calls = {};
  function wire(call) {
    calls[call.peer] = call;
    call.on('stream', function (s) { addPerson(call.peer, s); });
    call.on('close', function () { dropPerson(call.peer); });
    call.on('error', function () { dropPerson(call.peer); });
  }
  function onList(l) {
    list = l;
    Object.keys(people).forEach(function (id) { if (!list[id]) dropPerson(id); else addPerson(id); });
    Object.keys(list).forEach(function (id) {
      if (id === me.id || calls[id]) return;
      if (me.id > id) wire(me.call(id, local, { metadata: { name: myName } })); /* one side dials, deterministically */
    });
  }

  /* ---------- hub: a shared peer id per room that relays who's here ---------- */
  function claimHub() {
    var h = new Peer(PRE + code, ICE), conns = {}, names = {};
    function bcast() { var l = {}; Object.keys(names).forEach(function (k) { l[k] = names[k]; }); Object.keys(conns).forEach(function (k) { if (conns[k].open) conns[k].send({ t: 'list', list: l }); }); }
    h.on('connection', function (c) {
      c.on('data', function (m) {
        if (m && m.t === 'hello') {
          if (Object.keys(names).length >= MAX && !names[c.peer]) { c.send({ t: 'full' }); setTimeout(function () { c.close(); }, 300); return; }
          conns[c.peer] = c; names[c.peer] = String(m.name || 'Guest').slice(0, 20); bcast(); }
      });
      c.on('close', function () { delete conns[c.peer]; delete names[c.peer]; bcast(); });
    });
    h.on('open', function () { hub = h; connectHub(); });
    h.on('error', function (e) { h.destroy(); if (e.type === 'unavailable-id') connectHub(); else status('Signal trouble: ' + e.type); });
  }
  function connectHub() {
    if (left) return;
    var c = me.connect(PRE + code, { reliable: true });
    var t = setTimeout(function () { if (!c.open) { c.close(); retryHub(); } }, 6000);
    c.on('open', function () { clearTimeout(t); hubConn = c; c.send({ t: 'hello', name: myName }); });
    c.on('data', function (m) { if (m.t === 'list') onList(m.list); if (m.t === 'full') { status('Room is full (6 max)'); } });
    c.on('close', function () { clearTimeout(t); if (hubConn === c) { hubConn = null; retryHub(); } });
  }
  function retryHub() { if (left || hub) return connectHub(); setTimeout(claimHub, 300 + Math.random() * 1500); } /* host left: someone else takes over */

  /* ---------- join ---------- */
  function join(c) {
    myName = ($('name').value.trim() || 'Guest').slice(0, 20); localStorage.setItem('weston-name', myName);
    code = c.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 3) { $('lerr').textContent = 'Enter a room code (or Create room).'; return; }
    $('lerr').textContent = 'Connecting…';
    history.replaceState(null, '', '?room=' + code);
    media().catch(function (e) { $('lerr').textContent = 'No camera/mic (' + (e.message || e.name) + '); joining without them.'; return silentStream(); })
      .then(function (s) {
        local = s; $('selfie').srcObject = s;
        me = new Peer(ICE);
        me.on('open', function () { $('lobby').hidden = true; $('hud').hidden = false; count(); claimHub(); });
        me.on('call', function (call) { call.answer(local); wire(call); });
        me.on('error', function (e) { if (e.type === 'peer-unavailable') return; $('lerr').textContent = 'Connection error: ' + e.type; status('Connection error: ' + e.type); });
        me.on('disconnected', function () { if (!left) try { me.reconnect(); } catch (e) {} });
      });
  }
  $('bJoin').onclick = function () { join($('code').value); };
  $('bCreate').onclick = function () { var c = newCode(); $('code').value = c; join(c); };
  $('code').onkeydown = function (e) { if (e.key === 'Enter') join($('code').value); };

  /* ---------- controls ---------- */
  function tracks(kind) { return local ? (kind === 'a' ? local.getAudioTracks() : local.getVideoTracks()) : []; }
  $('bMute').onclick = function () { var on = this.classList.toggle('on'); tracks('a').forEach(function (t) { t.enabled = !on; }); this.textContent = on ? 'Unmute' : 'Mute'; };
  $('bCam').onclick = function () { var on = this.classList.toggle('on'); tracks('v').forEach(function (t) { t.enabled = !on; }); this.textContent = on ? 'Cam on' : 'Camera'; };
  $('bFlip').onclick = function () {
    facing = facing === 'user' ? 'environment' : 'user';
    navigator.mediaDevices.getUserMedia({ video: { facingMode: facing } }).then(function (s) {
      var nt = s.getVideoTracks()[0], old = tracks('v')[0];
      if (old) { local.removeTrack(old); old.stop(); }
      nt.enabled = !$('bCam').classList.contains('on'); local.addTrack(nt);
      Object.keys(calls).forEach(function (id) { var pc = calls[id].peerConnection; if (!pc) return;
        pc.getSenders().forEach(function (sd) { if (sd.track && sd.track.kind === 'video' || (!sd.track && old && sd.track === null)) sd.replaceTrack(nt); }); });
      $('selfie').srcObject = local; document.querySelector('.me').classList.toggle('back', facing !== 'user');
    }).catch(function () { status('Could not switch camera'); facing = facing === 'user' ? 'environment' : 'user'; });
  };
  $('bCopy').onclick = function () {
    var url = location.origin + '/weston/?room=' + code;
    if (navigator.share) { navigator.share({ title: "Weston's Planet", url: url }).catch(function () {}); return; }
    (navigator.clipboard ? navigator.clipboard.writeText(url) : Promise.reject()).then(function () { status('Invite link copied'); }, function () { prompt('Invite link', url); });
  };
  function leave() { left = true; Object.keys(calls).forEach(function (k) { try { calls[k].close(); } catch (e) {} });
    try { if (hub) hub.destroy(); if (me) me.destroy(); } catch (e) {}
    if (local) local.getTracks().forEach(function (t) { t.stop(); }); }
  $('bLeave').onclick = function () { leave(); location.href = '/'; };
  addEventListener('pagehide', leave);
})();
