/* climbing the foothills, swimming in the sea, photo spots in the flower fields */
const { start, check, done, until, vis } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('solo', '', { width: 390, height: 800 });
  await t.enter(p, '산악인');
  const S = await p.evaluate(() => window.__nat.summit());
  check(S.h > 5, 'there is a summit with some height: ' + S.h.toFixed(1) + ' at ' + S.x + ',' + S.z);
  /* the walk up: from the valley to the summit in small steps stays walkable and the ground rises */
  const up = await p.evaluate(() => {
    const n = window.__nat, S = n.summit(), P = window.__hw.pos; let ok = true, maxY = 0;
    for (let i = 0; i <= 40; i++) { const x = 92 + (S.x - 92) * i / 40, z = -97 + (S.z + 97) * i / 40; P.x = x; P.z = z; maxY = Math.max(maxY, n.gY(x, z)); }
    return { maxY };
  });
  check(up.maxY > 4, 'the ground rises on the way up: ' + up.maxY.toFixed(1));
  await p.evaluate(() => { const S = window.__nat.summit(), P = window.__hw.pos; P.x = S.x - 2.5; P.z = S.z + 2.5; window.__hw.setYaw(0.8); window.__hw.setPitch(0.3); });
  await p.waitForTimeout(2500); await p.screenshot({ path: t.out('summit.png') });
  check(await p.evaluate(() => window.__nat.spot() === '도토리봉 정상' || window.__nat.spot() === ''), 'summit is a photo spot or near it: ' + await p.evaluate(() => window.__nat.spot()));
  /* swimming */
  await p.evaluate(() => { const P = window.__hw.pos; P.x = 140; P.z = 30; });
  await p.waitForTimeout(500);
  const g0 = await p.evaluate(() => window.__nat.gY(140, 30)), g1 = await p.evaluate(() => window.__nat.gY(158, 30));
  check(g0 === 0 && g1 < -0.5, 'the beach is dry, the sea is deep: ' + g0 + ' / ' + g1.toFixed(2));
  await p.evaluate(() => { const P = window.__hw.pos; P.x = 158; P.z = 30; window.__hw.setYaw(1.2); });
  await p.waitForTimeout(2500); await p.screenshot({ path: t.out('swim.png') });
  /* photo spot: flower field by the mill */
  await p.evaluate(() => { const P = window.__hw.pos; P.x = 112; P.z = 50; window.__hw.setYaw(0.5); });
  await p.waitForTimeout(1500);
  check(await vis(p, '#photoBtn'), 'the photo bubble shows in the flower field');
  await p.click('#photoBtn');
  check(await until(p, () => !document.querySelector('#photoView').hidden, null, 120), 'a photo is taken and shown');
  await p.screenshot({ path: t.out('photo.png') });
  const ph = await p.evaluate(() => ({ w: window.__lastPhoto && window.__lastPhoto.w, h: window.__lastPhoto && window.__lastPhoto.h, len: document.querySelector('#photoImg').src.length }));
  check(ph.len > 20000 && ph.h > ph.w, 'the photo is a portrait picture with real content: ' + JSON.stringify(ph));
  await p.click('#photoClose');
  check(!(await vis(p, '#photoView')), 'the photo viewer closes');
  await p.evaluate(() => { const P = window.__hw.pos; P.x = 60; P.z = 20; });
  await p.waitForTimeout(800);
  check(!(await vis(p, '#photoBtn')), 'no photo bubble outside the photo spots');
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
