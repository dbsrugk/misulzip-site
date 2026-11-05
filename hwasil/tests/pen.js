/* A stylus (S Pen / Apple Pencil): the line is thicker where pressed harder, the friend watching gets the pressure too. */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const A = await t.client('A', '', { width: 390, height: 800 }); await t.enter(A, '펜화가');
  const B = await t.client('B', '', { width: 390, height: 800 }); await t.enter(B, '지켜봐');
  await A.waitForTimeout(3000);
  await A.evaluate(() => window.__hw.go(0));
  check(await until(A, () => !document.querySelector('#pad').hidden, null, 90), 'the pad opens');
  const box = await A.evaluate(() => { const r = document.querySelector('#padCanvas').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  await A.evaluate(() => { const r = document.querySelector('#padSize'); r.value = 40; r.dispatchEvent(new Event('input', { bubbles: true })); });
  await A.evaluate(b => {
    const cv = document.querySelector('#padCanvas'), mk = (type, x, y, pr) => new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 7, pointerType: 'pen', pressure: pr, clientX: x, clientY: y, isPrimary: true });
    cv.dispatchEvent(mk('pointerdown', b.x + b.w * 0.1, b.y + b.h * 0.5, 0.95));
    for (let i = 1; i <= 40; i++) cv.dispatchEvent(mk('pointermove', b.x + b.w * (0.1 + 0.8 * i / 40), b.y + b.h * 0.5, 0.95 - 0.85 * i / 40));
    cv.dispatchEvent(mk('pointerup', b.x + b.w * 0.9, b.y + b.h * 0.5, 0));
  }, box);
  await A.waitForTimeout(800);
  const st = await A.evaluate(() => window.__hw.padStrokes());
  check(st.length === 1 && st[0].q && st[0].q.length === st[0].n, 'the stroke stores one pressure value per point: ' + JSON.stringify(st[0] && st[0].q && st[0].q.length));
  check(st[0].q && st[0].q[1] > st[0].q[st[0].q.length - 1] + 30, 'pressure falls along the line (start ' + (st[0].q && st[0].q[1]) + ', end ' + (st[0].q && st[0].q[st[0].q.length - 1]) + ')');
  const thick = fx => A.evaluate(fx => { const c = document.querySelector('#padCanvas'), x = Math.floor(c.width * fx), g = c.getContext('2d'); let top = -1, bot = -1; const d = g.getImageData(x, 0, 1, c.height).data; for (let y = 0; y < c.height; y++) if (d[y * 4] < 120 && d[y * 4 + 1] < 120) { if (top < 0) top = y; bot = y; } return top < 0 ? 0 : bot - top + 1; }, fx);
  const t0 = await thick(0.2), t1 = await thick(0.8);
  check(t0 > t1 * 2 && t1 > 0, 'the line is clearly thicker at the start than at the end: ' + t0 + ' px vs ' + t1 + ' px');
  await B.waitForTimeout(2500);
  await B.evaluate(() => window.__hw.go(0)); await B.waitForTimeout(3000);
  check(await until(B, () => !document.querySelector('#watch').hidden, null, 150), 'the friend opens the watch view');
  await B.waitForTimeout(1500);
  const w = await B.evaluate(() => { const c = document.querySelector('#watchCanvas'), g = c.getContext('2d'); const col = fx => { const x = Math.floor(c.width * fx), d = g.getImageData(x, 0, 1, c.height).data; let top = -1, bot = -1; for (let y = 0; y < c.height; y++) if (d[y * 4] < 120 && d[y * 4 + 1] < 120) { if (top < 0) top = y; bot = y; } return top < 0 ? 0 : bot - top + 1; }; return [col(0.2), col(0.8)]; });
  check(w[0] > w[1] * 2 && w[1] > 0, 'the friend sees the thick-to-thin line too: ' + w.join(' vs '));
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
