/* Real 3D models and floor pictures: they load when someone comes near (screenshots in tests/out). */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A'); await t.enter(p, '구경꾼');
  await p.evaluate(() => { window.__hw.pos.x = -1; window.__hw.pos.z = 6; });
  check(await until(p, () => window.__hw.props().some(q => q[0] === 'bust_1.glb' && q[1] === 2 && q[2]), null, 60), 'a bust model loads when I come near and is shown');
  await p.waitForTimeout(1500); await p.screenshot({ path: t.out('models_lobby.png') });
  await p.evaluate(() => { window.__hw.pos.x = 0; window.__hw.pos.z = -2; });
  await p.waitForTimeout(1000);
  console.log('props:', JSON.stringify(await p.evaluate(() => window.__hw.props())));
  await p.click('#placesBtn'); await p.waitForTimeout(300); await p.locator('#placesList .btn').nth(11).click(); await p.waitForTimeout(4000);
  await p.screenshot({ path: t.out('models_grand.png') });
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
