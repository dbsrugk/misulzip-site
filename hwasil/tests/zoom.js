/* Paper zoom: the wheel zooms the sheet, drawing while zoomed lands under the cursor, "원래 크기" puts it back. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('a'); await t.enter(p, '확대');
  await p.evaluate(() => { window.__hw.pos.x = 50; window.__hw.pos.z = 4; window.__hw.go(0); });
  check(await until(p, () => !document.querySelector('#pad').hidden, null, 90), 'sat at an easel and the pad opened');
  await p.waitForTimeout(800);
  const box = () => p.evaluate(() => { const r = document.querySelector('#padCanvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const b0 = await box();
  check(await p.evaluate(() => document.querySelector('#zoomReset').hidden), 'no zoom button at normal size');
  await p.mouse.move(b0.x + b0.w / 2, b0.y + b0.h / 2); await p.mouse.wheel(0, -300); await p.waitForTimeout(500);
  const b1 = await box();
  check(b1.w > b0.w * 1.5, 'the wheel makes the paper bigger: ' + Math.round(b0.w) + ' -> ' + Math.round(b1.w));
  check(!(await p.evaluate(() => document.querySelector('#zoomReset').hidden)), 'the "원래 크기" button shows while zoomed');
  /* a dot drawn at the paper's centre while zoomed is still at the centre after going back */
  const cx = b1.x + b1.w / 2, cy = b1.y + b1.h / 2;
  await p.mouse.move(cx, cy); await p.mouse.down(); await p.mouse.move(cx + 6, cy + 6, { steps: 4 }); await p.mouse.up(); await p.waitForTimeout(300);
  await p.click('#zoomReset'); await p.waitForTimeout(800);
  const b2 = await box();
  check(Math.abs(b2.w - b0.w) < b0.w * 0.12 && b2.w < b1.w * 0.8, 'back to about the normal size: ' + Math.round(b0.w) + ' / ' + Math.round(b1.w) + ' / ' + Math.round(b2.w));
  const dark = await p.evaluate(() => { const c = document.querySelector('#padCanvas'), d = c.getContext('2d').getImageData(Math.floor(c.width / 2) - 4, Math.floor(c.height / 2) - 4, 8, 8).data; let n = 0; for (let i = 0; i < d.length; i += 4) if (d[i] < 90 && d[i + 1] < 90 && d[i + 2] < 90) n++; return n; });
  check(dark > 3, 'the stroke made while zoomed sits at the centre: ' + dark + ' dark pixels');
  check(await p.evaluate(() => document.querySelector('#zoomReset').hidden), 'the zoom button hides again');
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
