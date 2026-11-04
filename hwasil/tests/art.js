/* The catalogue pictures show up inside the masterpiece frames of the grand gallery (screenshots in tests/out). */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A'); await t.enter(p, '구경꾼');
  await p.click('#placesBtn'); await p.waitForTimeout(300); await p.locator('#placesList .btn').nth(11).click(); await p.waitForTimeout(1800);
  const ids = ['venus', 'adam', 'lastsupper', 'pearl'];
  for (const id of ids) {
    const i = await p.evaluate(id => window.__hw.slots.findIndex(q => q.room === 'museum' && q.cat.id === id), id);
    await p.evaluate(i => { const s = window.__hw.slots[i]; window.__hw.pos.x = s.pos ? s.pos.x : window.__hw.pos.x; }, i).catch(() => {});
    check(await p.evaluate(i => window.__hw.slots[i].cat.img.startsWith('art/'), i), id + ' has a picture address');
  }
  check(await p.evaluate(async () => (await Promise.all(window.MUSEUM_CATALOG.filter(c => c.img).map(c => new Promise(r => { const im = new Image(); im.onload = () => r(im.naturalWidth > 100); im.onerror = () => r(false); im.src = c.img; })))).every(Boolean)), 'every catalogue picture loads');
  await p.screenshot({ path: t.out('art_grand.png') });
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
