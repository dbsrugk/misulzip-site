/* Hall of fame: a button on the screen, ranked lists by reactions, and "go see it" walks to the work. */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A'); await t.enter(p, '구경꾼');
  check(await p.isVisible('#fameBtn'), 'the hall of fame button is on the screen');
  await p.click('#fameBtn'); await p.waitForTimeout(400);
  check(await p.isVisible('#fame') && (await p.locator('#fameTabs .btn').count()) === 3, 'it opens with three tabs');
  await p.locator('#fameTabs .btn').nth(1).click(); await p.waitForTimeout(600);
  const n = await p.locator('#fameList .roomRow').count();
  check(n >= 5, 'the masterpieces tab lists works: ' + n);
  await p.locator('#fameTabs .btn').nth(2).click(); await p.waitForTimeout(600);
  check((await p.locator('#fameList .roomRow').count()) === 15, 'the sculpture tab lists the fifteen pieces');
  await p.evaluate(() => { window.__hwInstant = true; });
  const before = await p.evaluate(() => ({ x: window.__hw.pos.x, z: window.__hw.pos.z }));
  await p.locator('#fameList .roomRow .btn').first().click(); await p.waitForTimeout(800);
  const after = await p.evaluate(() => ({ x: window.__hw.pos.x, z: window.__hw.pos.z }));
  check(!(await p.isVisible('#fame')) && Math.hypot(after.x - before.x, after.z - before.z) > 5, 'tapping "go see it" closes the list and takes me there: ' + JSON.stringify(after));
  /* the cards carry the real picture: a friend's drawing (its lines are fetched on demand), the model of a sculpture */
  await p.evaluate(() => {
    const sl = window.__hw.slots.filter(q => !q.reserved && !q.ex)[0]; sl.ex = { id: 'tf1', at: 5, artist: '시험화가', title: '시험 그림', w: 1000, h: 750, slot: sl.id, room: sl.room };
    window.__db.gallery.tf1 = Object.assign({ strokes: [{ k: 'p', c: '#d9342b', w: 40, p: [150, 150, 500, 400, 850, 600] }] }, sl.ex); window.__fameOpen();
  });
  await p.locator('#fameTabs .btn').nth(0).click(); await p.waitForTimeout(500);
  const inkOf = sel => p.evaluate(sel => { const c = document.querySelector(sel); if (!c) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 150 && d[i + 1] < 110 && d[i + 2] < 110) n++; return n; }, sel);
  check(await until(p, () => { const c = document.querySelector('#fameList .card canvas'); if (!c) return false; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 150 && d[i + 1] < 110 && d[i + 2] < 110) n++; return n > 200; }, null, 40), 'a friend card shows the real drawing (red ink on the picture)');
  check(await p.locator('#fameList .card .btn').count() >= 1 && await p.locator('#fameList').evaluate(el => getComputedStyle(el).display) === 'grid', 'the list is a grid of cards with a big button each');
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
