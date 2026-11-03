/* Two players in one studio: they see each other, one draws, the other watches live. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const A = await t.client('A'); await t.enter(A, '첫째'); const B = await t.client('B'); await t.enter(B, '둘째');
  await A.waitForTimeout(3000);
  check(/2\/20/.test(await A.textContent('#online')) && /2\/20/.test(await B.textContent('#online')), 'both see 2/20: ' + await A.textContent('#online') + ' | ' + await B.textContent('#online'));
  await A.click('#dressBtn'); await A.waitForTimeout(500);   /* A dresses up; B must see the new look */
  await A.click('#dressRows button[data-i="1"][data-v="5"]'); await A.click('#dressRows button[data-i="3"][data-v="4"]'); await A.click('#dressClose');
  const lookA = await A.evaluate(() => window.__hw.look()); await B.waitForTimeout(2500);
  check(await B.evaluate(l => Array.from(window.__hw.remotes.values()).some(r => r.look === l), lookA), "B sees A's new look: " + lookA);
  await A.click('#emoteBtn'); await A.click('#emoteBar .emo[data-e=wave]'); await B.waitForTimeout(900);
  check(await B.evaluate(() => Array.from(window.__hw.remotes.values()).some(r => r.av.emote && r.av.emote.id === 'wave')), "B sees A's wave emote");
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
  if (w) {                                                    /* paint bucket must show up live for the watcher too */
    await A.click('#padClear'); await A.click('#padClear'); await A.waitForTimeout(600);
    const bb = await A.evaluate(() => { const r = document.querySelector('#padCanvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    const at = (fx, fy) => [bb.x + bb.w * fx, bb.y + bb.h * fy];
    let [sx, sy] = at(0.3, 0.3); await A.mouse.move(sx, sy); await A.mouse.down();
    for (const [fx, fy] of [[0.7, 0.3], [0.7, 0.7], [0.3, 0.7], [0.3, 0.3]]) { const [x2, y2] = at(fx, fy); await A.mouse.move(x2, y2, { steps: 6 }); }
    await A.mouse.up();
    await A.click('#tools button[data-tool=f]'); await A.locator('#swatches .sw:not(.tool)').nth(3).click();
    const [cx, cy] = at(0.5, 0.5); await A.mouse.click(cx, cy); await B.waitForTimeout(2500);
    const red = await B.evaluate(() => { const c = document.querySelector('#watchCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 180 && d[i + 1] < 90 && d[i + 2] < 90) n++; return n; });
    check(red > 300, "B sees A's paint bucket fill (red pixels: " + red + ')');
  }
  /* hearts: B sends one while A is drawing, A sees it */
  await B.click('#watchLike'); await A.waitForTimeout(2500);
  check(await A.evaluate(() => !document.querySelector('#padLikes').hidden && /1/.test(document.querySelector('#padLikes').textContent) && document.querySelector('#padHearts').children.length >= 1), 'A sees the heart B sent while watching');
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
