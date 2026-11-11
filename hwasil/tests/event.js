/* The event zone: a golden wall in the annex where visitors hang a photo of their own picture. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const A = await t.client('A'); await t.enter(A, '이벤트러');
  const evIdx = await A.evaluate(() => window.__hw.slots.map((s, i) => s.ev ? i : -1).filter(i => i >= 0));
  check(evIdx.length >= 10 && await A.evaluate(ids => ids.every(i => window.__hw.slots[i].room === 'annex' && window.__hw.slots[i].x < -13), evIdx), 'the annex west wall has ' + evIdx.length + ' event frames');
  await A.evaluate(() => { window.__hw.pos.x = -4.5; window.__hw.pos.z = 70; }); await A.waitForTimeout(2500);
  await A.screenshot({ path: t.out('event_wall.png') });
  await A.evaluate(i => window.__hw.tapSlot(i), evIdx[0]); await A.waitForTimeout(400);
  check(await vis(A, '#evUp'), 'tapping an empty golden frame opens the upload window');
  const bad = await A.evaluate(() => { const c = document.createElement('canvas'); c.width = c.height = 8; return c.toDataURL('image/gif').split(',')[1]; });
  await A.setInputFiles('#evFile', { name: 'x.gif', mimeType: 'image/gif', buffer: Buffer.from(bad, 'base64') }); await A.waitForTimeout(300);
  check(/JPG 또는 PNG/.test(await A.textContent('#evMsg')), 'a gif is refused');
  await A.setInputFiles('#evFile', { name: 'big.png', mimeType: 'image/png', buffer: Buffer.alloc(5 * 1024 * 1024 + 10) }); await A.waitForTimeout(300);
  check(/5MB/.test(await A.textContent('#evMsg')), 'a file over 5MB is refused');
  const png = await A.evaluate(() => { const c = document.createElement('canvas'); c.width = 1600; c.height = 1000; const g = c.getContext('2d'); g.fillStyle = '#e8423a'; g.fillRect(0, 0, 1600, 1000); for (let i = 0; i < 400; i++) { g.fillStyle = 'hsl(' + (i * 37 % 360) + ',70%,55%)'; g.fillRect((i * 97) % 1500, (i * 53) % 900, 90, 70); } return c.toDataURL('image/png').split(',')[1]; });
  await A.setInputFiles('#evFile', { name: 'mine.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  check(await until(A, () => !document.querySelector('#evGo').disabled, null, 20), 'a good photo is shrunk and the button turns on');
  await A.fill('#evTitle', '우리 고양이'); await A.fill('#evArtist', '@kitty_art');
  await A.click('#evGo');
  check(await until(A, i => { const s = window.__hw.slots[i]; return !!(s.ex && s.ex.ev); }, evIdx[0], 20), 'the photo hangs in the frame');
  const first = await A.evaluate(i => { const s = window.__hw.slots[i]; return [s.ex.title, s.ex.artist]; }, evIdx[0]);
  check(first[0] === '우리 고양이' && first[1] === '@kitty_art', 'title and artist are kept: ' + first.join(' / '));
  check(!(await vis(A, '#evUp')), 'the window closes');
  /* one per person: a second upload takes the first one down */
  await A.evaluate(i => window.__hw.tapSlot(i), evIdx[1]); await A.waitForTimeout(300);
  check(/이미 올린 작품/.test(await A.textContent('#evNote')), 'a second try warns that the first picture will come down');
  await A.setInputFiles('#evFile', { name: 'mine2.png', mimeType: 'image/png', buffer: Buffer.from(png, 'base64') });
  await until(A, () => !document.querySelector('#evGo').disabled, null, 20); await A.fill('#evTitle', '두 번째'); await A.click('#evGo');
  check(await until(A, ids => { const e = window.__hw.slots[ids[1]].ex; return !!(e && e.ev && e.title === '두 번째'); }, evIdx, 20), 'the new picture hangs');
  check(await until(A, i => !window.__hw.slots[i].ex, evIdx[0], 20), 'one per person: the first frame is empty again');
  /* kept on the server: a fresh fetch of the gallery still shows it, and the big view shows the photo */
  await A.evaluate(() => { try { window.hwasil.refresh('gallery'); } catch (e) {} }); await A.waitForTimeout(2500);
  check(await A.evaluate(i => { const e = window.__hw.slots[i].ex; return !!(e && e.ev && e.title === '두 번째' && e.artist === '@kitty_art'); }, evIdx[1]), 'after a refresh from the server the picture is still there');
  await A.evaluate(i => window.__hw.tapSlot(i), evIdx[1]); await A.waitForTimeout(2500);
  const ink = await A.evaluate(() => { const c = document.querySelector('#viewerCanvas'); if (!c || document.querySelector('#viewer').hidden) return -1; const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] < 120) n++; return n; });
  check(ink > 1000, 'the big view shows the photo (red pixels ' + ink + ')');
  await A.screenshot({ path: t.out('event_view.png') });
  /* drawings stay out of the golden frames */
  const keep = await A.evaluate(() => window.__hw.slots.filter(s => s.ev && s.ex && !s.ex.ev).length);
  check(keep === 0, 'no ordinary drawing sits in a golden frame');
  done(t); await t.close(); process.exit(0);
})();
