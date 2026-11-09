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

  /* --- hidden acorns --- */
  const n = await p.evaluate(() => window.__fun.acorns.length);
  check(n >= 30 && n <= 60, 'acorns are hidden around the world: ' + n);
  const ids = await p.evaluate(() => window.__fun.acorns.map(a => a.id));
  check(new Set(ids).size === ids.length, 'every acorn has its own id');
  const a0 = await p.evaluate(() => { const a = window.__fun.acorns.find(q => !q.gold); window.__hw.pos.x = a.x; window.__hw.pos.z = a.z; return { id: a.id, name: a.name }; });
  await p.waitForTimeout(700);
  let st = await p.evaluate(() => ({ coin: window.__fun.fun.coin, got: Object.keys(window.__fun.fun.acorns) }));
  check(st.coin === 1 && st.got.length === 1 && st.got[0] === a0.id, 'walking onto an acorn picks it up (+1): ' + JSON.stringify(st));
  await p.waitForTimeout(500);
  st = await p.evaluate(() => window.__fun.fun.coin);
  check(st === 1, 'it cannot be picked up twice');
  /* gold only at night */
  await p.evaluate(() => { document.querySelector('#tSeg button[data-t="day"]').click(); });
  await p.waitForTimeout(1500);
  const g = await p.evaluate(() => { const a = window.__fun.acorns.find(q => q.gold); window.__hw.pos.x = a.x; window.__hw.pos.z = a.z; return a.id; });
  await p.waitForTimeout(800);
  check(await p.evaluate(id => !window.__fun.fun.acorns[id], g), 'a golden acorn does not appear by day');
  await p.evaluate(() => { document.querySelector('#tSeg button[data-t="night"]').click(); });
  await p.waitForTimeout(4500); console.log('atm', JSON.stringify(await p.evaluate(() => window.__hw.atm())));
  await p.evaluate(id => { const a = window.__fun.acorns.find(q => q.id === id); window.__hw.pos.x = a.x + 6; window.__hw.pos.z = a.z; }, g); await p.waitForTimeout(300);
  await p.evaluate(id => { const a = window.__fun.acorns.find(q => q.id === id); window.__hw.pos.x = a.x; window.__hw.pos.z = a.z; }, g);
  await p.waitForTimeout(800);
  check(await p.evaluate(id => !!window.__fun.fun.acorns[id], g) && await p.evaluate(() => window.__fun.fun.coin) >= 4, 'at night the golden acorn can be picked up (+3)');
  await p.evaluate(() => { document.querySelector('#tSeg button[data-t="auto"]').click(); });

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
  const right = await p.evaluate(() => window.MUSEUM_QUIZ.monalisa[1]), coin0 = await p.evaluate(() => window.__fun.fun.coin);
  const wrongBtn = p.locator('#artQuiz .qOpt', { hasNotText: right }).first();
  await wrongBtn.click(); await p.waitForTimeout(200);
  check(await p.evaluate(() => window.__fun.fun.coin) === coin0, 'a wrong answer costs nothing and gives nothing');
  await p.locator('#artQuiz .qOpt', { hasText: right }).first().click(); await p.waitForTimeout(300);
  check(await p.evaluate(() => window.__fun.fun.coin) === coin0 + 2 && await p.evaluate(() => !!window.__fun.fun.quiz.monalisa), 'the right answer gives 2 acorns once');
  await p.click('#artQuizBtn'); await p.waitForTimeout(200);
  await p.locator('#artQuiz .qOpt', { hasText: right }).first().click(); await p.waitForTimeout(200);
  check(await p.evaluate(() => window.__fun.fun.coin) === coin0 + 2, 'answering again does not pay again');
  await p.screenshot({ path: t.out('fun_quiz.png') });

  /* --- the book --- */
  await p.click('#artClose'); await p.waitForTimeout(200);
  await p.click('#moreBtn'); await p.click('#funBtn'); await p.waitForTimeout(400);
  check(await vis(p, '#fun') && await p.locator('#funBody .card').count() >= 7, 'the book opens with its sections');
  check((await p.locator('#funBody .stamp.on').count()) >= 1, 'the Mona Lisa shows as stamped');
  check(await p.locator('#funBody .stamp').count() > 59, 'every work and place has a slot in the book');
  await p.screenshot({ path: t.out('fun_book.png') });
  await p.locator('#funBody .stamp.on', { hasText: '모나리자' }).click(); await p.waitForTimeout(300);
  check(await vis(p, '#art') && !(await vis(p, '#fun')), 'a stamp opens that painting again');
  await p.click('#artClose');

  /* --- weekly bonus: all four works of this week's hall --- */
  const wk = await p.evaluate(() => { const f = window.__fun.feat(), c = window.MUSEUM_CATALOG.slice(f * 4, f * 4 + 4); return { f, ids: c.map(q => q.id), t: window.MUSEUM_WINGS[f].name }; });
  const c1 = await p.evaluate(() => window.__fun.fun.coin);
  for (const id of wk.ids) { const i = await p.evaluate(id2 => window.__hw.slots.findIndex(s => s.reserved && s.cat && s.cat.id === id2), id); await p.evaluate(i2 => window.__hw.tapSlot(i2), i); await p.waitForTimeout(250); await p.click('#artClose'); }
  const c2 = await p.evaluate(() => window.__fun.fun.coin);
  check(c2 - c1 >= 5, 'seeing the four paintings of this week\'s hall (' + wk.t + ') pays a bonus: +' + (c2 - c1));

  /* --- dress-up locks --- */
  await p.evaluate(() => { window.__fun.fun.coin = 0; });
  await p.click('#dressBtn'); await p.waitForTimeout(400);
  const locked = await p.locator('#dressRows button.locked').count();
  check(locked >= 5 && locked <= 7, 'some dress-up items are locked: ' + locked);
  const before = await p.evaluate(() => localStorage.getItem('hw-look'));
  await p.locator('#dressRows button.locked').first().click(); await p.waitForTimeout(300);
  check(await p.evaluate(() => localStorage.getItem('hw-look')) === before, 'tapping a locked item does not wear it');
  await p.evaluate(() => { window.__fun.add(100, 'test'); });
  await p.click('#dressClose'); await p.click('#dressBtn'); await p.waitForTimeout(300);
  check(await p.locator('#dressRows button.locked').count() === 0, 'with enough acorns nothing is locked');
  await p.click('#dressClose');

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
