/* Two players in one studio: they see each other, one draws, the other watches live. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const A = await t.client('A'); await t.enter(A, '첫째'); const B = await t.client('B'); await t.enter(B, '둘째');
  await A.waitForTimeout(3000);
  check(/2\/20/.test(await A.textContent('#online')) && /2\/20/.test(await B.textContent('#online')), 'both see 2/20: ' + await A.textContent('#online') + ' | ' + await B.textContent('#online'));
  let tapped = false;                                          /* both start at the same spot, so the same screen point hits the same easel */
  for (let y = 60; y < 700 && !tapped; y += 30) for (let x = 20; x < 380 && !tapped; x += 25) { await A.mouse.click(x, y); await A.waitForTimeout(60); tapped = await A.evaluate(() => { const e = document.querySelector('#toast'); return !!(e && !e.hidden && /걸어가요/.test(e.textContent)); }); }
  check(tapped, 'A taps an easel');
  check(await until(A, () => !document.querySelector('#pad').hidden, null, 90), 'A sits and the pad opens');
  const box = await A.evaluate(() => { const r = document.querySelector('#padCanvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await A.mouse.move(box.x + box.w * 0.2, box.y + box.h * 0.3); await A.mouse.down(); await A.mouse.move(box.x + box.w * 0.8, box.y + box.h * 0.7, { steps: 12 }); await A.mouse.up(); await A.waitForTimeout(1200);
  let w = false;
  for (let y = 60; y < 700 && !w; y += 30) for (let x = 20; x < 380 && !w; x += 25) { await B.mouse.click(x, y); await B.waitForTimeout(40); w = await vis(B, '#watch'); }
  check(w, 'B taps the occupied easel and the watch view opens');
  await B.waitForTimeout(1500);
  const ink = w ? await B.evaluate(() => { const c = document.querySelector('#watchCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 90) n++; return n; }) : 0;
  check(ink > 100, "B sees A's line being drawn (ink pixels: " + ink + ')');
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
