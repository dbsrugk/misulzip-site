/* The sculpture pavilion offers a guided walk through its fifteen pieces. */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A'); await t.enter(p, '구경꾼');
  await p.evaluate(() => { window.__hw.pos.x = 102; window.__hw.pos.z = 0.5; });
  check(await until(p, () => !document.getElementById('tourBtn').hidden, null, 30), 'the walk button shows in the sculpture pavilion');
  await p.click('#tourBtn'); await p.waitForTimeout(500);
  check(await p.evaluate(() => window.__sculptTour.active() && window.__hw.walking()), 'it starts walking to the first piece');
  check(await until(p, () => window.__hw.inspecting(), null, 60), 'it arrives and the camera circles the piece');
  const t0 = await p.textContent('#isTitle');
  check(await until(p, a => window.__hw.inspecting() && document.getElementById('isTitle').textContent !== a, t0, 60), 'after a few seconds it moves on to the next piece');
  await p.click('#tourBtn'); await p.waitForTimeout(400);
  check(await p.evaluate(() => !window.__sculptTour.active() && !window.__hw.inspecting()), 'the stop button ends the walk');
  await p.evaluate(() => { window.__hw.pos.x = 0; window.__hw.pos.z = -2; });
  check(await until(p, () => document.getElementById('tourBtn').hidden, null, 20), 'the button hides away from the pavilion');
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
