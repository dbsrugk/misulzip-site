/* 작은 화실 — Supabase backend that mimics the window.claude.use('room'|'db'|'user') surface
   the studio code was written against. Data lives in the private `hwasil` schema and is only
   reachable through hwasil_* RPCs that check the entry code. Realtime uses public broadcast
   channels whose names are derived from the entry code. */
(function () {
  var SB_URL = 'https://ldmsoceblbyvcoddquvn.supabase.co';
  /* No entry screen: the page enters with this code by itself. Change it together with hwasil.config.code_hash. */
  var OPEN_CODE = '6nk9z69j';
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

  /* ---------- tiny diagnostics: shows up in Supabase edge logs as GET /rpc/hwasil_check?code=dg~... ---------- */
  var stats = { rx: 0, tx: 0, lobby: '연결 중', room: '-' };
  var sid = rand(2), t0 = Date.now(), dgN = 0, dgQ = [], dgT = 0;
  function diag(text) {
    if (!sb || dgN >= 45) return; dgN++;
    dgQ.push('dg~' + sid + '~' + (Date.now() - t0) + '~' + String(text).replace(/[^\w.:,=@+\-]/g, '_').slice(0, 90));
    if (!dgT) dgT = setTimeout(function flush() {
      dgT = 0; var m = dgQ.shift(); if (!m) return;
      try { sb.rpc('hwasil_check', { code: m }, { get: true }).then(function () {}, function () {}); } catch (e) {}
      if (dgQ.length) dgT = setTimeout(flush, 350);
    }, 50);
  }
  function uaTag() {
    var u = navigator.userAgent, t = [];
    t.push(/iPhone|iPad/.test(u) ? 'ios' : /Android/.test(u) ? 'and' : 'pc');
    if (/KAKAOTALK/i.test(u)) t.push('kakao'); if (/; wv\)/.test(u)) t.push('wv'); if (/NAVER/i.test(u)) t.push('naver');
    t.push(navigator.onLine ? 'on' : 'off'); return t.join('+');
  }
  window.addEventListener('error', function (e) { diag('jserr=' + (e && e.message)); });

  /* ---------- entry code ---------- */
  var hw = window.hwasil = {
    stats: stats,
    savedCode: function () {
      var m = /[#&]c=([^&]+)/.exec(location.hash);
      if (m) return normCode(decodeURIComponent(m[1]));
      return store('hw-code') || OPEN_CODE;
    },
    enter: function (c) {
      c = normCode(c);
      if (!c) return Promise.resolve(false);
      if (!window.supabase || !window.supabase.createClient) return Promise.reject(new Error('no_supabase'));
      if (!sb) sb = window.supabase.createClient(SB_URL, SB_KEY, { auth: { persistSession: false, autoRefreshToken: false }, realtime: { params: { eventsPerSecond: 40 } } });
      if (!sb.__dg) {
        sb.__dg = 1; diag('start ' + uaTag());
        try {
          var rt = sb.realtime;
          ['onOpen', 'onClose', 'onError'].forEach(function (k) { if (rt && typeof rt[k] === 'function') rt[k](function (e) { diag('ws.' + k.slice(2).toLowerCase() + (e && e.code ? '=' + e.code : '')); }); });
        } catch (e) {}
        [3000, 8000, 16000, 30000].forEach(function (ms) { setTimeout(function () {
          var rt = sb.realtime, st = '';
          try { st = rt && rt.connectionState ? rt.connectionState() : (rt && rt.isConnected && rt.isConnected() ? 'open' : '?'); } catch (e) {}
          diag('t' + ms / 1000 + ' ws=' + st + ' lobby=' + stats.lobby + ' room=' + stats.room + ' rx=' + stats.rx + ' tx=' + stats.tx);
        }, ms); });
      }
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

  /* ---------- room (broadcast only; no Supabase Presence, it is rate-limited on the free plan) ----------
     Every client sends its own state ("_st") whenever it changes (at most ~5/s with up to 3 people, ~3/s with many) and at least every 2.5 s.
     A joiner says "_hello" and everyone answers with their state. Peers that go quiet for 7 s are dropped. */
  var FAST = { x: 1, z: 1, h: 1, w: 1 };
  var STEP = 330, BEAT = 2500, EXPIRE = 7000;
  function makeRoom(name, isLobby) {
    var peerId = rand(8), slot = isLobby ? 'lobby' : 'room';
    var ch = null, firstRes = null, reopening = false, hiddenAt = 0, retryT = 0;
    var mine = {}, peers = {}, dirty = false, lastSend = 0, sendT = 0, joined = false, alive = true;
    var peersCbs = [], errCbs = [], topicCbs = {}, notifyT = 0, beatI = 0;
    function snapshot() {
      var out = [{ peer: peerId, kind: 'viewer', isMe: true, sameTab: true, presence: Object.assign({}, mine) }];
      Object.keys(peers).forEach(function (k) { out.push({ peer: k, kind: 'viewer', isMe: false, sameTab: false, presence: peers[k].pr }); });
      return out;
    }
    function notify() { if (notifyT) return; notifyT = setTimeout(function () { notifyT = 0; var c = { peers: snapshot() }; peersCbs.forEach(function (f) { try { f(c); } catch (e) {} }); }, 40); }
    function tx(event, payload) { if (!ch) return Promise.resolve(); stats.tx++; return ch.send({ type: 'broadcast', event: event, payload: payload }).then(function () {}, function () {}); }
    function sendState() {
      sendT = 0; dirty = false; if (!joined || !alive) return;
      lastSend = Date.now(); tx('_st', { k: peerId, p: mine });
    }
    function step() { var n = Object.keys(peers).length + 1; return n <= 3 ? 200 : n <= 4 ? 250 : n <= 5 ? 300 : STEP; }   /* few people: send faster (smoother), many: stay under the message limit */
    function queueState(urgent) {
      dirty = true; if (sendT || !joined) return;
      sendT = setTimeout(sendState, urgent ? 60 : Math.max(0, step() - (Date.now() - lastSend)));
    }
    /* (re)build the channel; phones freeze pages and drop the socket when the app is in the background */
    function open() {
      var c = sb.channel(chanBase + '-' + name, { config: { broadcast: { self: false, ack: false } } });
      ch = c;
      c.on('broadcast', { event: '_st' }, function (m) {
        var d = m.payload; if (!d || typeof d.k !== 'string' || d.k === peerId || !d.p || typeof d.p !== 'object') return;
        stats.rx++;
        var isNew = !peers[d.k];
        peers[d.k] = { pr: d.p, seen: Date.now() }; notify();
        if (isNew && joined) queueState(true);          /* tell a newcomer about me right away */
      });
      c.on('broadcast', { event: '_hello' }, function (m) {
        var d = m.payload; if (!d || d.k === peerId) return;
        stats.rx++; setTimeout(function () { if (alive && joined) { dirty = true; sendState(); } }, Math.random() * 250);
      });
      c.on('broadcast', { event: '_bye' }, function (m) {
        var d = m.payload; if (d && peers[d.k]) { delete peers[d.k]; notify(); }
      });
      c.on('broadcast', { event: '_m' }, function (m) {
        var d = m.payload; if (!d || typeof d.t !== 'string') return;
        stats.rx++;
        (topicCbs[d.t] || []).forEach(function (f) { try { f({ topic: d.t, data: d.d, peer: d.k, isMe: false }); } catch (e) {} });
      });
      c.subscribe(function (status) {
        if (c !== ch) return;                            /* a replaced channel */
        stats[slot] = status === 'SUBSCRIBED' ? '연결됨' : (status === 'TIMED_OUT' ? '시간 초과' : status === 'CLOSED' ? '끊김' : status === 'CHANNEL_ERROR' ? '오류' : status);
        diag(slot + ':' + name + ' ' + status + (arguments[1] ? ' ' + (arguments[1].message || arguments[1]) : ''));
        if (status === 'SUBSCRIBED') {
          joined = true; clearTimeout(retryT);
          tx('_hello', { k: peerId }); dirty = true; sendState(); notify();
          if (firstRes) { firstRes(true); firstRes = null; }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          var was = joined; joined = false;              /* do not keep sending (the library would fall back to REST) */
          if (!firstRes && was) errCbs.forEach(function (f) { try { f(); } catch (e) {} });   /* before the first join: keep waiting, retry below */
          scheduleRetry(was ? 1500 : 4000);
        }
      });
    }
    function reopen(why) {
      if (!alive || reopening) return; reopening = true; joined = false; clearTimeout(retryT);
      diag(slot + ' reopen ' + why);
      var old = ch, go = function () { reopening = false; if (alive) open(); };
      try { sb.removeChannel(old).then(go, go); } catch (e) { go(); }
    }
    function scheduleRetry(ms) {
      clearTimeout(retryT);
      retryT = setTimeout(function () { if (alive && !joined) { if (document.hidden) scheduleRetry(3000); else reopen('retry'); } }, ms);
    }
    function onVisible() {
      if (!alive) return;
      var away = hiddenAt ? Date.now() - hiddenAt : 0; hiddenAt = 0;
      if (!joined) reopen('visible');
      else if (away > 3000) { tx('_hello', { k: peerId }); dirty = true; sendState(); }   /* say hi again after being away */
    }
    function onVis() { if (document.hidden) hiddenAt = Date.now(); else onVisible(); }
    document.addEventListener('visibilitychange', onVis);
    window.addEventListener('pageshow', onVisible);
    window.addEventListener('online', onVisible);
    var subscribed = new Promise(function (res) {
      firstRes = res;
      open();
      setTimeout(function () { if (firstRes) { firstRes(joined); firstRes = null; } }, 12000);
    });
    beatI = setInterval(function () {
      if (!alive) return;
      var now = Date.now(), gone = false;
      Object.keys(peers).forEach(function (k) { if (now - peers[k].seen > EXPIRE) { delete peers[k]; gone = true; } });
      if (gone) notify();
      if (joined && now - lastSend > BEAT) { dirty = true; sendState(); }
    }, 1000);
    var api = {
      peer: peerId,
      presence: function (patch) {
        var changed = false, slow = false;
        Object.keys(patch || {}).forEach(function (k) {
          if (mine[k] === patch[k]) return;
          mine[k] = patch[k]; changed = true; if (!FAST[k]) slow = true;
        });
        if (changed) { queueState(slow); notify(); }
        return Promise.resolve();
      },
      emit: function (topic, data) {
        if (!joined || !alive) return Promise.resolve();
        return tx('_m', { t: topic, k: peerId, d: data });
      },
      on: function (topic, cb) { (topicCbs[topic] = topicCbs[topic] || []).push(cb); },
      onPeers: function (cb, err) { peersCbs.push(cb); if (err) errCbs.push(err); if (joined) notify(); },
      leave: function () {
        if (joined && alive) tx('_bye', { k: peerId });
        alive = false; clearTimeout(sendT); clearTimeout(retryT); clearInterval(beatI);
        document.removeEventListener('visibilitychange', onVis); window.removeEventListener('pageshow', onVisible); window.removeEventListener('online', onVisible);
        return sb.removeChannel(ch).then(function () {}, function () {});
      }
    };
    if (isLobby) {
      api.join = function (n) {
        if (!/^studio-[1-9]$/.test(n)) return Promise.resolve(null);
        var r = makeRoom(n, false);
        return r._ready.then(function (ok) { if (!ok) { r.leave(); stats.room = '연결 실패'; return null; } return r; });
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
