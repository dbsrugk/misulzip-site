/* 작은 화실 — Supabase backend that mimics the window.claude.use('room'|'db'|'user') surface
   the studio code was written against. Data lives in the private `hwasil` schema and is only
   reachable through hwasil_* RPCs that check the entry code. Realtime uses public broadcast/
   presence channels whose names are derived from the entry code. */
(function () {
  var SB_URL = 'https://ldmsoceblbyvcoddquvn.supabase.co';
  var SB_KEY = 'sb_publishable_Oxq65uoB-aYijOCtc4j_Vg_I3McW6Ao';
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} return null; }
  function hex(buf) { return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join(''); }
  function rand(n) { var a = new Uint8Array(n); crypto.getRandomValues(a); return hex(a.buffer); }
  function sha(s) { return crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)).then(hex); }
  function normCode(c) { return String(c || '').trim().toLowerCase(); }

  var sb = null, code = null, token = null, ownerId = null, chanBase = null, readyRes, ready = new Promise(function (r) { readyRes = r; });
  var lobbyRef = null;

  token = store('hw-key');
  if (!token || !/^[0-9a-f]{32,64}$/.test(token)) { token = rand(16); store('hw-key', token); }

  function rpc(fn, args) {
    return sb.rpc(fn, args).then(function (r) {
      if (r.error) { var m = r.error.message || ''; var e = new Error(m); e.code = /quota_exceeded/.test(m) ? 'quota_exceeded' : /too_big/.test(m) ? 'too_big' : /bad_code/.test(m) ? 'bad_code' : /invalid_argument|bad_token/.test(m) ? 'invalid_argument' : 'error'; throw e; }
      return r.data;
    });
  }

  /* ---------- entry code ---------- */
  var hw = window.hwasil = {
    savedCode: function () {
      var m = /[#&]c=([^&]+)/.exec(location.hash);
      if (m) return normCode(decodeURIComponent(m[1]));
      return store('hw-code');
    },
    enter: function (c) {
      c = normCode(c);
      if (!c) return Promise.resolve(false);
      if (!window.supabase || !window.supabase.createClient) return Promise.reject(new Error('no_supabase'));
      if (!sb) sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 40 } } });
      return sb.rpc('hwasil_check', { code: c }).then(function (r) {
        if (r.error) throw new Error(r.error.message);
        if (!r.data) { if (store('hw-code') === c) store('hw-code', null); return false; }
        code = c; store('hw-code', c);
        if (/[#&]c=/.test(location.hash)) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
        return Promise.all([sha(token), sha('hwasil-room:' + c)]).then(function (h) {
          ownerId = h[0].slice(0, 16); chanBase = 'hw-' + h[1].slice(0, 16);
          readyRes(); return true;
        });
      });
    },
    getKey: function () { return token; },
    setKey: function (k) {
      k = String(k || '').toLowerCase().replace(/[^0-9a-f]/g, '');
      if (!/^[0-9a-f]{32}$/.test(k)) return false;
      try { localStorage.setItem('hw-key', k); return localStorage.getItem('hw-key') === k; } catch (e) { return false; }
    },
    inviteLink: function () { return code ? location.origin + location.pathname + '#c=' + encodeURIComponent(code) : ''; }
  };

  /* ---------- room (presence + broadcast) ---------- */
  var FAST = { x: 1, z: 1, h: 1, w: 1 };
  function makeRoom(name, isLobby) {
    var peerId = rand(8);
    var ch = sb.channel(chanBase + '-' + name, { config: { presence: { key: peerId }, broadcast: { self: false, ack: false } } });
    var mine = {}, lastTrack = 0, trackT = 0, lastSlow = '', posT = 0, lastPosAt = 0;
    var fast = {};          // peer -> latest fast fields from broadcast
    var peersCbs = [], errCbs = [], topicCbs = {}, alive = true, joined = false;
    function peers() {
      var st = ch.presenceState(), out = [];
      Object.keys(st).forEach(function (k) {
        var metas = st[k]; if (!metas || !metas.length) return;
        var pr = Object.assign({}, metas[metas.length - 1]); delete pr.presence_ref;
        if (fast[k]) Object.assign(pr, fast[k]);
        out.push({ peer: k, kind: 'viewer', isMe: k === peerId, sameTab: k === peerId, presence: pr });
      });
      Object.keys(fast).forEach(function (k) { if (!st[k]) delete fast[k]; });
      return out;
    }
    var notifyT = 0;
    function notify() { if (notifyT) return; notifyT = setTimeout(function () { notifyT = 0; var p = { peers: peers() }; peersCbs.forEach(function (f) { try { f(p); } catch (e) {} }); }, 30); }
    ch.on('presence', { event: 'sync' }, notify);
    ch.on('broadcast', { event: '_pos' }, function (m) {
      var d = m.payload; if (!d || typeof d.k !== 'string') return;
      fast[d.k] = { x: d.x, z: d.z, h: d.h, w: d.w }; notify();
    });
    ch.on('broadcast', { event: '_m' }, function (m) {
      var d = m.payload; if (!d || typeof d.t !== 'string') return;
      (topicCbs[d.t] || []).forEach(function (f) { try { f({ topic: d.t, data: d.d, peer: d.k, isMe: false }); } catch (e) {} });
    });
    var subscribed = new Promise(function (res) {
      ch.subscribe(function (status) {
        if (status === 'SUBSCRIBED') { joined = true; doTrack(); res(true); }
        else if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') && alive && !joined) { res(false); }
        else if (status === 'CHANNEL_ERROR' && joined) { errCbs.forEach(function (f) { try { f(); } catch (e) {} }); }
      });
      setTimeout(function () { res(joined); }, 8000);
    });
    function doTrack() { if (!joined || !alive) return; lastTrack = Date.now(); ch.track(Object.assign({}, mine)).catch(function () {}); }
    function scheduleTrack(urgent) {
      if (trackT) return;
      var wait = urgent ? Math.max(0, 300 - (Date.now() - lastTrack)) : Math.max(0, 2500 - (Date.now() - lastTrack));
      trackT = setTimeout(function () { trackT = 0; doTrack(); }, wait);
    }
    function sendPos() {
      posT = 0; if (!joined || !alive) return; lastPosAt = Date.now();
      ch.send({ type: 'broadcast', event: '_pos', payload: { k: peerId, x: mine.x, z: mine.z, h: mine.h, w: mine.w } }).catch(function () {});
    }
    var api = {
      peer: peerId,
      presence: function (patch) {
        var slowChanged = false, fastChanged = false;
        Object.keys(patch || {}).forEach(function (k) {
          if (mine[k] === patch[k]) return;
          mine[k] = patch[k]; if (FAST[k]) fastChanged = true; else slowChanged = true;
        });
        var slow = JSON.stringify(Object.keys(mine).filter(function (k) { return !FAST[k]; }).map(function (k) { return [k, mine[k]]; }));
        if (slowChanged && slow !== lastSlow) { lastSlow = slow; scheduleTrack(true); }
        else if (fastChanged) {
          scheduleTrack(false);                       // keep late joiners' snapshot fresh, slowly
          if (!posT) posT = setTimeout(sendPos, Math.max(0, 220 - (Date.now() - lastPosAt)));
        }
        return Promise.resolve();
      },
      emit: function (topic, data) {
        if (!joined || !alive) return Promise.resolve();
        return ch.send({ type: 'broadcast', event: '_m', payload: { t: topic, k: peerId, d: data } }).then(function () {}, function () {});
      },
      on: function (topic, cb) { (topicCbs[topic] = topicCbs[topic] || []).push(cb); },
      onPeers: function (cb, err) { peersCbs.push(cb); if (err) errCbs.push(err); if (joined) notify(); },
      leave: function () { alive = false; clearTimeout(trackT); clearTimeout(posT); return sb.removeChannel(ch).then(function () {}, function () {}); }
    };
    if (isLobby) {
      api.join = function (n) {
        if (!/^studio-[1-9]$/.test(n)) return Promise.resolve(null);
        var r = makeRoom(n, false);
        return r._ready.then(function (ok) { if (!ok) { r.leave(); return null; } return r; });
      };
    }
    api._ready = subscribed;
    return api;
  }

  /* ---------- db: two collections, data/users/<me> and gallery ---------- */
  function autoId() { var s = '', a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; var b = new Uint8Array(20); crypto.getRandomValues(b); for (var i = 0; i < 20; i++) s += a[b[i] % a.length]; return s; }
  var listeners = { mine: [], gallery: [] };
  function refresh(kind) {
    listeners[kind].forEach(function (l) { l.load(); });
  }
  function galleryChanged() { refresh('gallery'); if (lobbyRef) lobbyRef.emit('_gal', {}).catch(function () {}); }
  function collection(path) {
    var kind = path === 'gallery' ? 'gallery' : (path === 'data/users/' + ownerId ? 'mine' : null);
    if (!kind) throw new Error('unknown collection');
    function doc(id) {
      id = id || autoId();
      return {
        id: id,
        set: function (d) {
          return (kind === 'mine' ? rpc('hwasil_work_set', { code: code, token: token, wid: id, d: d }) : rpc('hwasil_gallery_set', { code: code, token: token, gid: id, d: d }))
            .then(function () { kind === 'gallery' ? galleryChanged() : refresh('mine'); });
        },
        update: function (d) {
          if (kind !== 'mine') return Promise.reject(new Error('unsupported'));
          return rpc('hwasil_work_patch', { code: code, token: token, wid: id, d: d }).then(function () { refresh('mine'); });
        },
        delete: function () {
          return (kind === 'mine' ? rpc('hwasil_work_del', { code: code, token: token, wid: id }) : rpc('hwasil_gallery_del', { code: code, token: token, gid: id }))
            .then(function () { kind === 'gallery' ? galleryChanged() : refresh('mine'); });
        }
      };
    }
    function query(lim) {
      return {
        orderBy: function () { return query(lim); },
        limit: function (n) { return query(n); },
        onSnapshot: function (cb, err) {
          var seq = 0, l = {
            load: function () {
              var my = ++seq;
              (kind === 'mine' ? rpc('hwasil_works_list', { code: code, token: token, lim: lim || 30 }) : rpc('hwasil_gallery_list', { code: code, lim: lim || 27 }))
                .then(function (rows) {
                  if (my !== seq) return;
                  cb({ docs: (rows || []).map(function (r) { var id = r.id; var d = Object.assign({}, r); delete d.id; return { id: id, data: function () { return d; } }; }) });
                }, function (e) { if (err) err(e); });
            }
          };
          listeners[kind].push(l); l.load();
          var iv = kind === 'gallery' ? setInterval(function () { if (!document.hidden) l.load(); }, 60000) : 0;
          return function () { clearInterval(iv); listeners[kind] = listeners[kind].filter(function (x) { return x !== l; }); };
        }
      };
    }
    var q = query(0); q.doc = doc; return q;
  }

  window.claude = {
    use: function (what) {
      return ready.then(function () {
        if (what === 'user') return { id: function () { return Promise.resolve(ownerId); } };
        if (what === 'db') return { collection: collection };
        if (what === 'room') {
          var lobby = makeRoom('lobby', true);
          lobbyRef = lobby;
          lobby.on('_gal', function () { refresh('gallery'); });
          return lobby._ready.then(function (ok) { return ok ? lobby : null; });
        }
        return null;
      });
    }
  };
})();
