/* One player: enter, fast travel, tap-to-walk through the east door, sit outdoors, scenery views. Screenshots go to tests/out/. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('solo');
  const def = await p.inputValue('#nameInput'); check(def.length > 0 && def.length <= 10 && !/^화가\d+$/.test(def), 'fun random default name: ' + def);
  await t.enter(p, '시험');
  check(/화실 1/.test(await p.textContent('#online')), 'enters a studio: ' + await p.textContent('#online'));
  /* camera: drag up looks up at the ceiling, the wheel zooms */
  await p.mouse.move(200, 500); await p.mouse.down(); await p.mouse.move(200, 100, { steps: 8 }); await p.mouse.up(); await p.waitForTimeout(600);
  const c1 = await p.evaluate(() => window.__hw.cam());
  check(c1.pitch < 0, 'dragging up tilts the camera to look up (pitch ' + c1.pitch.toFixed(2) + ')');
  await p.mouse.move(200, 400); await p.mouse.wheel(0, -600); await p.waitForTimeout(400);
  const c2 = await p.evaluate(() => window.__hw.cam());
  check(c2.want < c1.want, 'the wheel zooms the camera in (' + c1.want.toFixed(1) + ' -> ' + c2.want.toFixed(1) + ')');
  await p.mouse.move(200, 400); await p.mouse.wheel(0, 900); await p.waitForTimeout(300);
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
  /* music: a button turns it off and on, the volume is remembered */
  check(await p.evaluate(() => window.__hw.music().on === true && document.querySelector('#musicBtn').textContent === '🎵'), 'music is on by default');
  await p.click('#musicBtn'); await p.waitForTimeout(300);
  check(await p.evaluate(() => window.__hw.music().on === false && document.querySelector('#musicBtn').textContent === '🔇' && localStorage.getItem('hw-music') === '0'), 'music button turns it off (and remembers)');
  await p.click('#musicBtn'); await p.waitForTimeout(300);
  check(await p.evaluate(() => window.__hw.music().on === true && window.__hw.music().ctx !== 'none'), 'music turns on again and the audio engine starts');
  await p.evaluate(() => { const r = document.querySelector('#volRange'); r.value = 25; r.dispatchEvent(new Event('input')); });
  check(await p.evaluate(() => window.__hw.music().vol === 0.25 && localStorage.getItem('hw-vol') === '0.25'), 'volume slider sets and remembers the volume');
  const n = await p.evaluate(() => window.__hw.easels.length); check(n >= 36, 'easels: ' + n);
  await p.click('#placesBtn'); await p.waitForTimeout(200); check((await p.locator('#placesList .btn').count()) === 11, 'eleven places listed'); await p.click('#placesClose'); await p.waitForTimeout(200);
  /* the gallery has no partitions any more; the annex and the garden can be visited */
  await place(6, 'annex.png'); await place(7, 'garden.png'); await place(8, 'west1.png'); await place(9, 'west2.png'); await place(10, 'orchard.png');
  /* a place is reached on foot now: from the studio to the annex through both doors, then out to the garden through the east door */
  await place(0, 'studio.png');
  await p.evaluate(() => { window.__hwInstant = false; });
  const walkTo = async idx => { await p.click('#placesBtn'); await p.waitForTimeout(300); await p.locator('#placesList .btn').nth(idx).click(); await p.waitForTimeout(400); const w0 = await p.evaluate(() => window.__hw.walking()); const ok = await until(p, () => !window.__hw.walking(), null, 240); return { w0, ok }; };
  let wk = await walkTo(6);
  const near = (x, z) => p.evaluate(([x, z]) => Math.hypot(window.__hw.pos.x - x, window.__hw.pos.z - z) < 2.5, [x, z]);
  check(wk.w0 && wk.ok && await near(0, 58), 'a place is walked to (studio -> gallery -> annex), not jumped to');
  await p.evaluate(() => { window.__hwInstant = true; });
  await place(1, 'gallery.png');                                             /* back to the gallery, then on foot through the west doors */
  await p.evaluate(() => { window.__hwInstant = false; });
  wk = await walkTo(9);
  check(wk.ok && await near(-49, 39), 'and on foot from the gallery through both west doors to west hall 2');
  await p.evaluate(() => { window.__hwInstant = true; });
  await place(0, 'studio.png');
  check(await p.evaluate(() => window.__hw.occ().length) === 0, 'no see-through partitions are left');
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
  await p.waitForTimeout(100);                                            /* check first: the preview fades after 1 s and a screenshot can be slow */
  check(await p.evaluate(() => { const f = document.querySelector('#sizeFloat'), d = f.firstElementChild; return !f.hidden && parseFloat(d.style.width) > 8 && /굵기 30/.test(f.lastElementChild.textContent); }), 'brush size preview shows while the slider moves');
  await p.screenshot({ path: t.out('brush_preview.png') });
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
  /* frames: the halls have frames of three sizes in four rooms */
  const frames = await p.evaluate(() => window.__hw.slots.map(s => s.room + ':' + s.size));
  check(frames.length >= 40 && new Set(frames.map(f => f.split(':')[1])).size === 3 && ['studio', 'gallery', 'annex', 'westa', 'westb', 'garden', 'orchard'].every(r => frames.some(f => f.startsWith(r + ':'))), 'frames in four rooms, three sizes (' + frames.length + ')');
  const bq = await p.evaluate(() => { const r = document.querySelector('#padCanvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await p.mouse.move(bq.x + bq.w * 0.2, bq.y + bq.h * 0.3); await p.mouse.down(); await p.mouse.move(bq.x + bq.w * 0.8, bq.y + bq.h * 0.7, { steps: 8 }); await p.mouse.up();
  await p.fill('#padTitle', '큰 그림'); await p.click('#padSave'); await p.waitForTimeout(1500);
  check(await vis(p, '#exAsk') && (await p.locator('#exAskBtns .btn').count()) === 3, 'after saving, it asks whether to put the work on show (auto / choose / later)');
  await p.click('#exManual'); await p.waitForTimeout(600);
  check(!(await vis(p, '#pad')) && await vis(p, '#hangRow') && await vis(p, '#places'), 'choosing myself leaves the easel, starts hang mode and shows the places to walk to');
  await p.click('#placesClose'); await p.click('#hangBanner'); await p.waitForTimeout(300);
  check(!(await vis(p, '#hangRow')), 'the banner cancels hang mode');
  await p.click('#worksBtn'); await p.waitForTimeout(500);
  /* first come, first served: pick a frame, hang a work there; others cannot take that frame; an admin can take anything down */
  check(await p.evaluate(() => new Set(window.__hw.slots.map(s => s.id)).size === window.__hw.slots.length), 'every frame has its own id');
  const gi = await p.evaluate(() => window.__hw.slots.findIndex(s => s.room === 'garden' && s.size === 'l'));
  await p.locator('.work .btn', { hasText: '전시하기' }).first().click(); await p.waitForTimeout(400);
  check(await vis(p, '#exAsk'), 'the works list asks the same question');
  await p.click('#exAuto'); await p.waitForTimeout(2500);
  check(await p.evaluate(() => { const s = window.__hw.slots.filter(q => q.ex && /큰 그림/.test(q.ex.title)); return s.length === 1 && s[0].room !== 'studio'; }), 'auto: the work hangs on an empty frame by itself');
  check(await vis(p, '#exAsk') && (await p.locator('#exGo').count()) === 1, 'and offers to walk over and look');
  await p.click('#exStay'); await p.waitForTimeout(300);
  await p.locator('.work .btn', { hasText: '자리 옮기기' }).first().click(); await p.waitForTimeout(400);
  check(await vis(p, '#hangRow') && !(await vis(p, '#works')), 'moving: a banner asks for an empty frame');
  await p.evaluate(i => window.__hw.tapSlot(i), gi); await p.waitForTimeout(1500);
  check(await p.evaluate(i => { const s = window.__hw.slots[i]; return !!s.ex && /큰 그림/.test(s.ex.title) && window.__hw.slots.filter(q => q.ex && /큰 그림/.test(q.ex.title)).length === 1; }, gi), 'the work moved to the frame I chose and the old frame is free');
  check(await p.evaluate(i => Object.values(window.__db.gallery).some(g => g.slot === window.__hw.slots[i].id), gi), 'the server row records the frame');
  await p.evaluate(i => window.__hw.tapSlot(i), gi); await p.waitForTimeout(500);
  check(await vis(p, '#viewer') && (await p.locator('#viewerAct .btn').count()) === 2, 'my own frame offers take down / move');
  await p.screenshot({ path: t.out('hang.png') });
  await p.click('#viewerClose'); await p.waitForTimeout(300);
  /* somebody else gets the next frame at the same moment: the server says taken */
  const gj = await p.evaluate(() => window.__hw.slots.findIndex(s => s.room === 'garden' && s.size === 'm'));
  await p.evaluate(j => { const s = window.__hw.slots[j]; window.__db.gallery['zz_other'] = { id: 'zz_other', kind: 'exhibit', owner: 'zz', workId: 'w1', artist: '다른 화가', title: '남의 그림', slot: s.id, room: 'garden', size: 'm', w: 1000, h: 750, at: 5, strokes: [{ k: 'p', c: '#2c47c8', w: 12, p: [100, 100, 700, 600] }] }; }, gj);
  await p.evaluate(j => window.__hw.tapSlot(j), gj); await p.waitForTimeout(500);
  check(await vis(p, '#hang'), 'an empty frame opens the picker of my works');
  await p.locator('#hangList button').first().click(); await p.waitForTimeout(1200);
  check(/먼저 걸었어요/.test(await p.evaluate(() => document.querySelector('#toast').textContent)), 'a frame someone took a moment ago is refused (first come, first served)');
  await p.waitForTimeout(800);
  check(await p.evaluate(j => { const s = window.__hw.slots[j]; return !!s.ex && s.ex.title === '남의 그림'; }, gj), 'that frame now shows the other painter\'s work');
  await p.evaluate(j => window.__hw.tapSlot(j), gj); await p.waitForTimeout(500);
  check(await vis(p, '#viewer') && (await p.locator('#viewerAct .btn').count()) === 0, 'someone else\'s frame cannot be changed by me');
  await p.click('#viewerClose'); await p.waitForTimeout(300);
  /* admin */
  await p.click('#worksBtn'); await p.waitForTimeout(300); await p.evaluate(() => { document.querySelector('#adBox').open = true; });
  await p.fill('#adPw', 'nope'); await p.click('#adGo'); await p.waitForTimeout(500);
  check(!(await p.evaluate(() => window.__hw.admin())), 'a wrong admin password does nothing');
  await p.fill('#adPw', 'adminpw'); await p.click('#adGo'); await p.waitForTimeout(500);
  check(await p.evaluate(() => window.__hw.admin()), 'the admin password turns admin mode on');
  await p.click('#worksClose'); await p.waitForTimeout(300);
  await p.evaluate(j => window.__hw.tapSlot(j), gj); await p.waitForTimeout(500);
  check((await p.locator('#viewerAct .btn').count()) === 1, 'admin sees a take-down button on another painter\'s frame');
  await p.locator('#viewerAct .btn').click(); await p.waitForTimeout(200); await p.locator('#viewerAct .btn').click(); await p.waitForTimeout(1500);
  check(await p.evaluate(j => !window.__hw.slots[j].ex && !window.__db.gallery['zz_other'], gj), 'the admin takes the frame down');
  /* light loading: the list carries only summaries, the lines of a work are fetched when I come close */
  check(await p.evaluate(() => { const r = window.__rpcs || []; return r.includes('hwasil_gallery_index') && !r.includes('hwasil_gallery_list'); }), 'the gallery list is the light index (no lines)');
  check(await p.evaluate(gi => { const s = window.__hw.slots[gi]; return !!s.ex && !s.live && !s.cv; }, gi), 'a far frame holds its work as a summary only (no private picture)');
  await place(7, 'garden.png');
  check(await until(p, gi => window.__hw.slots[gi].live && !!window.__hw.slots[gi].cv, gi, 30), 'coming close loads the picture of that frame');
  await t.close(); process.exit(done(t) ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
