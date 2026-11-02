/* One player: enter, fast travel, tap-to-walk through the east door, sit outdoors, scenery views. Screenshots go to tests/out/. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('solo'); await t.enter(p, '시험');
  check(/화실 1/.test(await p.textContent('#online')), 'enters a studio: ' + await p.textContent('#online'));
  async function place(i, shot) { await p.click('#placesBtn'); await p.waitForTimeout(300); await p.locator('#placesList .btn').nth(i).click(); await p.waitForTimeout(1800); await p.screenshot({ path: t.out(shot) }); }
  await place(2, 'mountain.png'); await place(3, 'beach.png'); await place(4, 'lake.png'); await place(5, 'field.png'); await place(0, 'studio.png');
  const n = await p.evaluate(() => window.__hw.easels.length); check(n >= 36, 'easels: ' + n);
  await p.click('#placesBtn'); await p.waitForTimeout(200); check((await p.locator('#placesList .btn').count()) === 6, 'six places listed'); await p.click('#placesClose'); await p.waitForTimeout(200);
  await p.evaluate(() => window.__hw.go(25));                /* studio -> beach easel: through the east door */
  check(await until(p, () => !document.querySelector('#pad').hidden, null, 200), 'walks out the east door and sits at a beach easel');
  await p.waitForTimeout(2500);
  check(await p.evaluate(() => document.querySelector('#pad').classList.contains('split')), 'outdoor easel opens scenery split view');
  await p.screenshot({ path: t.out('split.png') });
  const clip = { x: 0, y: 60, width: 390, height: 190 };       /* the scenery panel: dragging it must turn the view */
  const before = await p.screenshot({ clip });
  await p.mouse.move(250, 160); await p.mouse.down(); await p.mouse.move(60, 150, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(2500);
  const after = await p.screenshot({ clip }); await p.screenshot({ path: t.out('look.png') });
  check(!before.equals(after), 'dragging the scenery panel turns the view');
  const box = await p.evaluate(() => { const r = document.querySelector('#padCanvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.mouse.move(box.x + box.w * 0.2, box.y + box.h * 0.3); await p.mouse.down(); await p.mouse.move(box.x + box.w * 0.8, box.y + box.h * 0.7, { steps: 10 }); await p.mouse.up();
  await p.click('#viewSeg button[data-view=ghost]'); await p.waitForTimeout(1500); await p.screenshot({ path: t.out('ghost.png') });
  check(await p.evaluate(() => document.querySelector('#pad').classList.contains('ghost')), 'see-through view');
  await p.click('#viewSeg button[data-view=off]'); await p.waitForTimeout(500);
  await p.click('#padClose'); await p.waitForTimeout(300); await p.click('#padClose'); await p.waitForTimeout(500);
  check(!(await vis(p, '#pad')), 'pad closes');
  await p.evaluate(() => localStorage.removeItem('hw-view'));  /* forget my choice: studio easels must also default to the scenery view */
  await p.evaluate(() => window.__hw.go(3));                  /* beach -> studio easel */
  check(await until(p, () => !document.querySelector('#pad').hidden, null, 200), 'walks back in through the door and sits at a studio easel');
  await p.waitForTimeout(1500); check(await p.evaluate(() => document.querySelector('#pad').classList.contains('split')), 'studio easels also open the scenery view');
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
