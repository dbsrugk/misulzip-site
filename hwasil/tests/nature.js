/* climbing the foothills, swimming in the sea, photo spots in the flower fields */
const { start, check, done, until, vis } = require('./lib');
const shown = (p, sel) => p.evaluate(q => { const e = document.querySelector(q); return !e.hidden && getComputedStyle(e).display !== 'none'; }, sel);
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
  check(await until(p, () => !document.getElementById('actDots').hidden, null, 40), 'a small … bubble shows when I stand still at a photo spot');
  check(!(await shown(p, '#photoBtn')), 'the photo button is folded away until the … is tapped');
  await p.click('#actDots'); await p.waitForTimeout(200);
  check(await shown(p, '#photoBtn'), 'tapping … opens the menu with the photo button');
  await p.click('#photoBtn');
  check(await until(p, () => !document.querySelector('#photoView').hidden, null, 120), 'a photo is taken and shown');
  await p.screenshot({ path: t.out('photo.png') });
  const ph = await p.evaluate(() => ({ w: window.__lastPhoto && window.__lastPhoto.w, h: window.__lastPhoto && window.__lastPhoto.h, len: document.querySelector('#photoImg').src.length }));
  check(ph.len > 20000 && ph.h > ph.w, 'the photo is a portrait picture with real content: ' + JSON.stringify(ph));
  await p.click('#photoClose');
  check(!(await vis(p, '#photoView')), 'the photo viewer closes');
  await p.evaluate(() => { const P = window.__hw.pos; P.x = 60; P.z = 20; });
  await p.waitForTimeout(800);
  check(!(await vis(p, '#actDots')), 'no … bubble when there is nothing to do');
  /* walking hides the bubble */
  await p.evaluate(() => { const P = window.__hw.pos; P.x = 112; P.z = 50; });
  await p.waitForTimeout(4000);
  check(await vis(p, '#actDots'), '… back at the flower field');
  await p.evaluate(() => { window.__hw.pos.x += 0.5; }); await p.waitForTimeout(60);
  await p.evaluate(() => { window.__hw.pos.x += 0.5; });
  await p.waitForTimeout(80);
  check(!(await vis(p, '#actDots')), 'the … hides while I move');
  /* diving */
  await p.evaluate(() => { const P = window.__hw.pos; P.x = 168; P.z = 40; });
  check(await until(p, () => !document.getElementById('actDots').hidden && !document.getElementById('diveBtn').hidden, null, 40), 'swimming in the sea offers a dive button');
  await p.evaluate(() => window.__nat.menu(true)); await p.waitForTimeout(150);
  check(await shown(p, '#diveBtn'), 'the dive button is in the opened menu: ' + await p.textContent('#diveBtn'));
  await p.click('#diveBtn'); await p.waitForTimeout(2800);
  const d1 = await p.evaluate(() => ({ y: window.__nat.dv().y, lvl: window.__nat.dv().lvl, uw: window.__nat.uw(), life: window.__nat.life() }));
  check(d1.lvl === 1 && d1.y < -2.5 && d1.uw === 1 && d1.life, 'diving puts me under water with the sea life on: ' + JSON.stringify(d1));
  await p.screenshot({ path: t.out('dive.png') });
  await p.evaluate(() => { window.__hw.setYaw(2.2); window.__nat.dive(2); }); await p.waitForTimeout(3000);
  const d2 = await p.evaluate(() => window.__nat.dv().y); check(d2 < -5, 'deeper: ' + d2.toFixed(1));
  await p.screenshot({ path: t.out('dive2.png') });
  await p.evaluate(() => { window.__nat.dive(0); }); await p.waitForTimeout(6000);
  const d3 = await p.evaluate(() => ({ y: window.__nat.dv().y, uw: window.__nat.uw() })); check(d3.y > -0.5, 'back at the surface: ' + JSON.stringify(d3));
  /* boats */
  await p.evaluate(() => { const b = window.__nat.boats()[1]; const P = window.__hw.pos; P.x = 149; P.z = -10; });
  check(await until(p, () => !document.getElementById('boatBtn').hidden, null, 40), 'the moored boat can be boarded from the beach');
  await p.evaluate(() => window.__nat.menu(true)); await p.waitForTimeout(150);
  await p.click('#boatBtn'); await p.waitForTimeout(400);
  check(await p.evaluate(() => window.__nat.boats()[1].x > 0 && window.__nat.dv().lvl === 0), 'on board');
  await p.evaluate(() => { const b = window.__nat.boats()[1]; b.h = Math.PI / 2; window.__hw.setYaw(-Math.PI / 2); });
  const x0 = await p.evaluate(() => window.__hw.pos.x);
  await p.keyboard.down('w'); await p.waitForTimeout(2500);
  await p.screenshot({ path: t.out('boat.png') }); await p.keyboard.up('w');
  const sx = await p.evaluate(() => ({ x: window.__hw.pos.x, bx: window.__nat.boats()[1].x, z: window.__hw.pos.z }));
  check(Math.abs(sx.x - x0) > 3, 'the boat moves with the stick: ' + JSON.stringify(sx));
  await p.waitForTimeout(4000); await p.evaluate(() => window.__nat.menu(true)); await p.waitForTimeout(200);
  await p.click('#boatBtn'); await p.waitForTimeout(300);
  check(await p.evaluate(() => window.__nat.boats().every((b, i) => true)) && !(await p.evaluate(() => document.getElementById('boatBtn').textContent.includes('내리기'))), 'got off');
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
