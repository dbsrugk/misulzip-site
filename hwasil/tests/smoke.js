/* One player: enter, fast travel, tap-to-walk through the east door, sit outdoors, scenery views. Screenshots go to tests/out/. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('solo');
  const def = await p.inputValue('#nameInput'); check(def.length > 0 && def.length <= 10 && !/^화가\d+$/.test(def), 'fun random default name: ' + def);
  await t.enter(p, '시험');
  check(/화실 1/.test(await p.textContent('#online')), 'enters a studio: ' + await p.textContent('#online'));
  await p.click('#emoteBtn'); await p.waitForTimeout(200);                    /* emotes */
  check(await vis(p, '#emoteBar') && (await p.locator('#emoteBar .emo').count()) === 5, 'emote bar with five emotes opens');
  await p.click('#emoteBar .emo[data-e=heart]'); await p.waitForTimeout(500);
  check((await p.evaluate(() => window.__hw.emote())) === 'heart' && !(await vis(p, '#emoteBar')), 'emote plays and the bar closes');
  await p.click('#worksBtn'); await p.waitForTimeout(300);                    /* graphics quality setting is offered */
  check(await p.evaluate(() => !!document.querySelector('#qBox') && !!document.querySelector('#qSeg button.on')), 'graphics quality setting exists');
  await p.click('#worksClose'); await p.waitForTimeout(200);
  await p.click('#dressBtn'); await p.waitForTimeout(800);   /* dress-up sheet with a live preview */
  check(await vis(p, '#dress'), 'dress-up sheet opens');
  const look0 = await p.evaluate(() => window.__hw.look());
  await p.click('#dressRows button[data-i="1"][data-v="3"]'); await p.click('#dressRows button[data-i="3"][data-v="2"]'); await p.waitForTimeout(500);
  const look1 = await p.evaluate(() => window.__hw.look());
  check(look1[1] === '3' && look1[3] === '2', 'look changes with the buttons: ' + look0 + ' -> ' + look1);
  const drawn = await p.evaluate(() => { const c = document.querySelector('#dressCanvas'), d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) n++; return n; });
  await (await p.$('#dressCanvas')).screenshot({ path: t.out('dress.png') });
  check(drawn > 4000, 'character preview is drawn (' + drawn + ' px)');
  await p.click('#dressRandom'); await p.waitForTimeout(300);
  check(/^\d{7}$/.test(await p.evaluate(() => window.__hw.look())), 'random look is a valid look');
  await p.click('#dressClose'); await p.waitForTimeout(300);
  check(!(await vis(p, '#dress')), 'dress-up sheet closes');
  await p.reload(); await p.waitForTimeout(5000);          /* a reload must not ask to enter again */
  check(!(await vis(p, '#intro')) && /화실 1/.test(await p.textContent('#online')), 'reload goes straight back in: ' + await p.textContent('#online'));
  check((await p.evaluate(() => localStorage.getItem('hw-name'))) === '시험', 'name is remembered across the reload');
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
  await p.evaluate(() => { const r = document.querySelector('#padSize'); r.value = 30; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await p.waitForTimeout(300); await p.screenshot({ path: t.out('brush_preview.png') });
  check(await p.evaluate(() => { const f = document.querySelector('#sizeFloat'), d = f.firstElementChild; return !f.hidden && parseFloat(d.style.width) > 8 && /굵기 30/.test(f.lastElementChild.textContent); }), 'brush size preview shows while the slider moves');
  /* paint bucket, custom colour, eyedropper */
  await p.click('#padClear'); await p.click('#padClear');                      /* second tap confirms */
  const bb = await p.evaluate(() => { const r = document.querySelector('#padCanvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const at = (fx, fy) => [bb.x + bb.w * fx, bb.y + bb.h * fy];
  const px = (fx, fy) => p.evaluate(([fx, fy]) => { const c = document.querySelector('#padCanvas'), d = c.getContext('2d').getImageData(Math.floor(c.width * fx), Math.floor(c.height * fy), 1, 1).data; return [d[0], d[1], d[2]]; }, [fx, fy]);
  let [sx, sy] = at(0.3, 0.3); await p.mouse.move(sx, sy); await p.mouse.down();
  for (const [fx, fy] of [[0.7, 0.3], [0.7, 0.7], [0.3, 0.7], [0.3, 0.3]]) { const [x2, y2] = at(fx, fy); await p.mouse.move(x2, y2, { steps: 6 }); }
  await p.mouse.up();
  await p.click('#tools button[data-tool=f]');
  await p.locator('#swatches .sw:not(.tool)').nth(3).click();                  /* the 4th default swatch is red (#d9342b) */
  let [fxp, fyp] = at(0.5, 0.5); await p.mouse.click(fxp, fyp); await p.waitForTimeout(500);
  const inside = await px(0.5, 0.5), outside = await px(0.1, 0.1);
  await p.screenshot({ path: t.out('fill.png') });
  check(inside[0] > 200 && inside[1] < 80 && inside[2] < 80, 'paint bucket fills the closed shape red: ' + inside);
  check(outside[1] > 240, 'paint bucket does not leak outside the shape: ' + outside);
  await p.click('#padUndo'); await p.waitForTimeout(300);
  check((await px(0.5, 0.5))[1] > 240, 'undo removes the fill');
  await p.mouse.click(fxp, fyp); await p.waitForTimeout(400);                  /* fill again for the eyedropper */
  await p.evaluate(() => { const i = document.querySelector('#padColor'); i.value = '#00aa88'; i.dispatchEvent(new Event('input', { bubbles: true })); i.dispatchEvent(new Event('change', { bubbles: true })); });
  check(await p.evaluate(() => /rgb\(0, 170, 136\)/.test(document.querySelector('#sizeMini').style.background)), 'custom colour is used');
  check(await p.evaluate(() => !!document.querySelector('#swatches .sw[data-c="#00aa88"]')), 'custom colour is kept in the recent colours');
  await p.click('#eyeBtn'); await p.mouse.click(fxp, fyp); await p.waitForTimeout(300);
  check((await p.evaluate(() => document.querySelector('#padColor').value)) === '#d9342b', 'eyedropper picks the colour from the drawing');
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
  /* frames: the hall has frames of three sizes in two rooms; a saved work can be hung on the studio wall as a big frame */
  const frames = await p.evaluate(() => window.__hw.slots.map(s => s.room + ':' + s.size));
  check(frames.length >= 40 && new Set(frames.map(f => f.split(':')[1])).size === 3 && frames.some(f => f.startsWith('studio')) && frames.some(f => f.startsWith('gallery')), 'frames in both rooms, three sizes (' + frames.length + ')');
  const bq = await p.evaluate(() => { const r = document.querySelector('#padCanvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.mouse.move(bq.x + bq.w * 0.2, bq.y + bq.h * 0.3); await p.mouse.down(); await p.mouse.move(bq.x + bq.w * 0.8, bq.y + bq.h * 0.7, { steps: 8 }); await p.mouse.up();
  await p.fill('#padTitle', '큰 그림'); await p.click('#padSave'); await p.waitForTimeout(1500);
  await p.click('#padClose'); await p.waitForTimeout(500);
  await p.click('#worksBtn'); await p.waitForTimeout(500);
  await p.locator('.work .btn', { hasText: '전시하기' }).first().click(); await p.waitForTimeout(400);
  check(await vis(p, '#hang'), 'hang sheet opens (room and frame size)');
  await p.click('#hangRoom .opt[data-v=studio]'); await p.click('#hangSize .opt[data-v=l]'); await p.screenshot({ path: t.out('hang.png') });
  await p.click('#hangGo'); await p.waitForTimeout(1800);
  check(await p.evaluate(() => window.__hw.slots.some(s => s.ex && s.room === 'studio' && s.size === 'l' && /큰 그림/.test(s.ex.title))), 'the work hangs in a big studio frame');
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
