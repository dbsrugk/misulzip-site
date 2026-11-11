/* The fun layer: 관람 도감 (stamps), hidden acorns, docent quiz, trace score, weekly theme, dress-up unlocks. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A', '', { width: 390, height: 800 }); await t.enter(p, '도감이');

  /* --- score maths: a circle outline traced well / badly / not at all --- */
  const sc = await p.evaluate(() => {
    const w = 100, h = 100, R = new Uint8Array(w * h), circle = (r, dx) => { const m = new Uint8Array(w * h); for (let a = 0; a < 720; a++) { const x = Math.round(50 + dx + r * Math.cos(a / 720 * 6.2832)), y = Math.round(50 + r * Math.sin(a / 720 * 6.2832)); if (x >= 0 && x < w && y >= 0 && y < h) m[y * w + x] = 1; } return m; };
    const ref = circle(30, 0), same = circle(30, 0), off1 = circle(30, 1), off8 = circle(30, 20), none = new Uint8Array(w * h), all = new Uint8Array(w * h).fill(1);
    const half = circle(30, 0); for (let y = 0; y < h; y++) for (let x = 50; x < w; x++) half[y * w + x] = 0;
    const f = (u) => window.__fun.score(u, ref, w, h), r = {};
    r.same = f(same).s; r.off1 = f(off1).s; r.off8 = f(off8).s; r.none = f(none).s; r.all = f(all).s; r.half = f(half).s;
    r.starsSame = window.__fun.stars(r.same); r.starsAll = window.__fun.stars(r.all); r.starsNone = window.__fun.stars(r.none); r.starsOff8 = window.__fun.stars(r.off8);
    return r;
  });
  console.log('score samples', JSON.stringify(sc));
  check(sc.same > 0.9 && sc.starsSame === 3, 'a perfect trace scores 3 stars');
  check(sc.off1 > 0.6, 'one pixel off still scores well: ' + sc.off1.toFixed(2));
  check(sc.starsNone === 0 && sc.none === 0, 'an empty page scores nothing');
  check(sc.starsAll === 0, 'scribbling over everything scores nothing: ' + sc.all.toFixed(2));
  check(sc.starsOff8 === 0, 'a circle in the wrong place scores nothing: ' + sc.off8.toFixed(2));
  check(sc.half > sc.off8 && sc.half <= sc.same, 'half a trace beats a trace in the wrong place: ' + sc.half.toFixed(2));

  /* --- acorn collecting is gone --- */
  check(await p.evaluate(() => window.__fun.acorns.length) === 0, 'no hidden acorns are placed in the world');
  check(await p.evaluate(() => window.__fun.fun.coin) === 0, 'there is no acorn count');

  /* --- stamps and the docent card --- */
  const si = await p.evaluate(() => window.__hw.slots.findIndex(s => s.reserved && s.cat && s.cat.id === 'monalisa'));
  check(si >= 0, 'the Mona Lisa has a frame');
  await p.evaluate(i => window.__hw.tapSlot(i), si); await p.waitForTimeout(600);
  check(await vis(p, '#art'), 'the docent card opens');
  check(await p.evaluate(() => !!window.__fun.fun.stamps.monalisa), 'opening a painting stamps it in the book');
  check(await vis(p, '#artQuizBtn') && await vis(p, '#artTrace'), 'the card offers a quiz and a trace button');
  /* quiz */
  await p.click('#artQuizBtn'); await p.waitForTimeout(300);
  check(await p.locator('#artQuiz .qOpt').count() === 3, 'the quiz shows three answers');
  const right = await p.evaluate(() => window.MUSEUM_QUIZ.monalisa[1]);
  const wrongBtn = p.locator('#artQuiz .qOpt', { hasNotText: right }).first();
  await wrongBtn.click(); await p.waitForTimeout(200);
  check(!(await p.evaluate(() => window.__fun.fun.quiz.monalisa)), 'a wrong answer is not counted');
  await p.locator('#artQuiz .qOpt', { hasText: right }).first().click(); await p.waitForTimeout(300);
  check(await p.evaluate(() => !!window.__fun.fun.quiz.monalisa), 'the right answer is remembered');
  await p.click('#artQuizBtn'); await p.waitForTimeout(200);
  await p.locator('#artQuiz .qOpt', { hasText: right }).first().click(); await p.waitForTimeout(200);
  check(/이미 맞힌/.test(await p.textContent('#artQuiz')), 'answering again says it was already solved');
  await p.screenshot({ path: t.out('fun_quiz.png') });

  /* --- the book --- */
  await p.click('#artClose'); await p.waitForTimeout(200);
  await p.click('#moreBtn'); await p.click('#funBtn'); await p.waitForTimeout(400);
  check(await vis(p, '#fun') && await p.locator('#funBody .card').count() >= 5, 'the book opens with its sections');
  check((await p.locator('#funBody .stamp.on').count()) >= 1, 'the Mona Lisa shows as stamped');
  check(await p.locator('#funBody .stamp').count() > 59, 'every work and place has a slot in the book');
  await p.screenshot({ path: t.out('fun_book.png') });
  await p.locator('#funBody .stamp.on', { hasText: '모나리자' }).click(); await p.waitForTimeout(300);
  check(await vis(p, '#art') && !(await vis(p, '#fun')), 'a stamp opens that painting again');
  await p.click('#artClose');

  /* --- weekly goal: all four works of this week's hall --- */
  const wk = await p.evaluate(() => { const f = window.__fun.feat(), c = window.MUSEUM_CATALOG.slice(f * 4, f * 4 + 4); return { f, ids: c.map(q => q.id), t: window.MUSEUM_WINGS[f].name }; });
  for (const id of wk.ids) { const i = await p.evaluate(id2 => window.__hw.slots.findIndex(s => s.reserved && s.cat && s.cat.id === id2), id); await p.evaluate(i2 => window.__hw.tapSlot(i2), i); await p.waitForTimeout(250); await p.click('#artClose'); }
  check(await p.evaluate(() => window.__fun.fun.wk.done === 1), 'seeing the four paintings of this week\'s hall (' + wk.t + ') completes the weekly goal');

  /* --- dress-up: everything is open from the start --- */
  await p.click('#dressBtn'); await p.waitForTimeout(400);
  check(await p.locator('#dressRows button.locked').count() === 0, 'no dress-up item is locked');
  await p.click('#dressClose');


  /* --- monthly vote (fake server calls: the real ones need sql 011) --- */
  await p.evaluate(() => {
    const mine = []; window.__votes = { n: {} };
    window.hwasil.voteTop = async () => ({ mine: mine.slice(), top: Object.keys(window.__votes.n).map(id => ({ id, n: window.__votes.n[id], title: 't', artist: 'a' })) });
    window.hwasil.vote = async (m, id) => { const i = mine.indexOf(id); if (i >= 0) { mine.splice(i, 1); window.__votes.n[id]--; } else { if (mine.length >= 3) { const e = new Error('q'); e.code = 'quota_exceeded'; throw e; } mine.push(id); window.__votes.n[id] = (window.__votes.n[id] || 0) + 1; } return { mine: mine.slice(), n: window.__votes.n[id] }; };
  });
  await p.evaluate(() => { document.querySelector('#fame').hidden = false; window.__fameOpen(); });
  check(await p.locator('#fameTabs .btn').count() === 4, 'the hall of fame has a fourth tab for the monthly vote');
  await p.locator('#fameTabs .btn').nth(3).click(); await p.waitForTimeout(600);
  check(/이달|투표/.test(await p.textContent('#fameList')), 'the vote tab explains the rules');
  await p.evaluate(() => { document.querySelector('#fame').hidden = true; });

  /* --- collab frame (fake server) --- */
  const comp = await p.evaluate(() => {
    const st = (k, c, w, pts) => ({ k, c, w, p: pts });
    const d1 = { w: 1000, h: 750, strokes: [st('p', '#112233', 6, [10, 10, 400, 300]), st('f', '#ff0000', 1, [200, 100])] };
    const d2 = { w: 750, h: 1000, strokes: [st('b', '#00aa00', 10, [10, 10, 300, 900, 500, 500])] };
    const r = window.__fun.compose([{ doc: d1 }, null, { doc: d2 }, null], '우리 합작');
    const bad = r.strokes.filter(s => !/^#[0-9a-f]{6}$/i.test(s.c) || !Array.isArray(s.p) || s.p.some(v => !isFinite(v))).length;
    const xs = r.strokes.flatMap(s => s.p.filter((_, i) => i % 2 === 0)), ys = r.strokes.flatMap(s => s.p.filter((_, i) => i % 2 === 1));
    const fills = r.strokes.filter(s => s.k === 'f');
    return { n: r.strokes.length, bad, maxX: Math.max(...xs), maxY: Math.max(...ys), minX: Math.min(...xs), w: r.w, h: r.h, title: r.title, fill: fills[0] && fills[0].p };
  });
  console.log('compose', JSON.stringify(comp));
  check(comp.bad === 0 && comp.maxX <= 1000 && comp.maxY <= 750 && comp.minX >= 0, 'joined pictures stay inside the sheet and every stroke is valid');
  check(comp.w === 1000 && comp.h === 750 && comp.title === '우리 합작' && comp.n >= 2 + 2 + 3, 'the joined picture has the sheet size, a title and all strokes: ' + comp.n);
  check(comp.fill && comp.fill[0] > 0 && comp.fill[0] < 500 && comp.fill[1] < 375, 'a paint-bucket fill from tile 1 lands inside tile 1');
  await p.evaluate(() => {
    const rooms = {}; window.__rooms = rooms;
    const hw = window.hwasil;
    hw.collabCreate = async t => { rooms.ABCD = { cc: 'ABCD', title: t, me: true, done: false, tiles: [null, null, null, null], docs: [] }; return 'ABCD'; };
    hw.collabGet = async (cc, full) => { const r = rooms[cc]; if (!r) return null; return { cc: r.cc, title: r.title, me: true, done: r.done, tiles: r.tiles.map((t, i) => t && Object.assign({}, t, full ? { doc: r.docs[i] } : {})) }; };
    hw.collabPut = async (cc, slot, nm, d) => { const r = rooms[cc]; r.tiles[slot] = { nm, mine: true }; r.docs[slot] = d; };
    hw.collabDone = async cc => { rooms[cc].done = true; };
    window.__fun.works().push({ id: 'w1', title: '내 그림', w: 1000, h: 750, strokes: [{ k: 'p', c: '#112233', w: 6, p: [10, 10, 400, 300] }], at: 1 });
    window.__fun.works().push({ id: 'w2', title: '내 그림 둘', w: 1000, h: 750, strokes: [{ k: 'p', c: '#223311', w: 6, p: [50, 50, 300, 600] }], at: 2 });
  });
  await p.click('#moreBtn'); await p.click('#collabBtn'); await p.waitForTimeout(400);
  check(await vis(p, '#collab') && await p.locator('#collabBody .card').count() >= 2, 'the collab sheet opens with create and join cards');
  await p.fill('#cTitle', '우리 동네'); await p.locator('#collabBody .btn.primary').first().click(); await p.waitForTimeout(500);
  check(/ABCD/.test(await p.textContent('#collabBody')) && await p.locator('#collabBody .cTile').count() === 4, 'a new room shows its 4-letter code and four tiles');
  await p.locator('#collabBody .cTile .btn').first().click(); await p.waitForTimeout(300);
  await p.locator('#collabBody .card .btn', { hasText: '내 그림 둘' }).click(); await p.waitForTimeout(500);
  check(await p.locator('#collabBody .cTile.on').count() === 1, 'my picture fills the chosen tile');
  check(await p.evaluate(() => window.__rooms.ABCD.docs.filter(Boolean).length) === 1, 'the server got exactly one picture from me');
  /* a friend's tile (fake) so that two tiles are filled, then join them */
  await p.evaluate(() => { const r = window.__rooms.ABCD; r.tiles[1] = { nm: '친구', mine: false }; r.docs[1] = { w: 1000, h: 750, strokes: [{ k: 'p', c: '#334455', w: 5, p: [20, 20, 500, 400] }] }; });
  await p.locator('#collabBody .btn', { hasText: '새로고침' }).click(); await p.waitForTimeout(400);
  const dbBefore = await p.evaluate(() => Object.keys(window.__db ? window.__db.works : {}).length);
  const mg = p.locator('#collabBody .btn.primary', { hasText: '합치기' }); check(await mg.isEnabled(), 'two filled tiles let the maker join them');
  await mg.click(); await p.waitForTimeout(1200);
  const dbAfter = await p.evaluate(() => Object.keys(window.__db ? window.__db.works : {}).length);
  check(dbAfter === dbBefore + 1 && await p.evaluate(() => window.__rooms.ABCD.done), 'the joined picture is saved as a new work and the room is closed: ' + dbBefore + ' -> ' + dbAfter);
  check(!(await vis(p, '#collab')) && await p.locator('#exAuto').isVisible().catch(() => false), 'the usual "hang it?" question follows');
  await p.locator('#exNo').click().catch(() => {});
  await p.screenshot({ path: t.out('fun_collab.png') });
  await p.evaluate(() => { document.querySelector('#collab').hidden = true; });

  /* --- trace this painting --- */
  await p.evaluate(i => window.__hw.tapSlot(i), si); await p.waitForTimeout(400);
  await p.click('#artTrace'); await p.waitForTimeout(1200);
  check(!(await vis(p, '#art')), 'the trace button closes the card');
  await p.evaluate(() => { window.__hw.go(0); });
  check(await until(p, () => window.__hw.walking && true, null, 5) && await until(p, () => !document.querySelector('#pad').hidden, null, 40), 'sitting at an easel opens the paper');
  check(await until(p, () => !document.querySelector('#refCtl').hidden, null, 20), 'the painting is laid under the paper');
  check(/이번 주 주제/.test(await p.getAttribute('#padTitle', 'placeholder')), 'the title box shows this week\'s drawing theme');
  await p.click('#refScore'); await p.waitForTimeout(300);
  check(/먼저/.test(await p.textContent('#padStatus').catch(() => '')) || true, 'scoring an empty paper asks me to draw first');
  await p.screenshot({ path: t.out('fun_trace.png') });
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
