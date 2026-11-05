/* Tapping a masterpiece opens the big picture with its description and a read-aloud button (the browser's speech is faked here). */
const { start, vis, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('a', '', { width: 390, height: 800 });
  await p.addInitScript(() => {
    window.__blips = 0; window.__cuts = 0;
    const node = () => new Proxy(function () {}, { get: (o, k) => k === 'start' ? () => { window.__blips++; } : k === 'disconnect' ? () => { window.__cuts++; } : k === 'value' ? 1 : node(), set: () => true, apply: () => node() });
    window.AudioContext = function () { Object.defineProperty(this, 'currentTime', { get: () => performance.now() / 1000 }); this.state = 'running'; this.sampleRate = 44100; this.destination = {}; return new Proxy(this, { get: (o, k) => k in o ? o[k] : (() => node()) }); };
  });
  await p.reload(); await p.waitForTimeout(1000); await t.enter(p, '관람객');
  const mi = await p.evaluate(() => window.__hw.slots.findIndex(q => q.room === 'museum' && q.cat && q.cat.id === 'monalisa'));
  check(mi >= 0, 'the Mona Lisa frame exists');
  await p.evaluate(i => window.__hw.tapSlot(i), mi); await p.waitForTimeout(800);
  check(await vis(p, '#art'), 'tapping a masterpiece opens the artwork view');
  check(/모나리자/.test(await p.textContent('#artTitle')) && (await p.textContent('#artText')).length > 20, 'title and description are shown under the picture');
  check(await until(p, () => { const i = document.querySelector('#artImg'); return i.complete && i.naturalWidth > 100; }, null, 20), 'the picture itself is loaded');
  const w0 = await p.evaluate(() => document.querySelector('#artImg').getBoundingClientRect().width);
  await p.mouse.move(195, 250); await p.mouse.wheel(0, -300); await p.waitForTimeout(400);
  check(await p.evaluate(w => document.querySelector('#artImg').getBoundingClientRect().width > w * 1.4, w0), 'the wheel zooms the picture');
  check(!(await p.evaluate(() => document.querySelector('#artZoomOff').hidden)), 'the "원래 크기" button shows while zoomed');
  await p.click('#artZoomOff'); await p.waitForTimeout(300);
  await p.click('#artSpeak'); await p.waitForTimeout(300);
  check(await p.evaluate(() => window.__blips > 40), 'the docent babbles a blip for each syllable: ' + await p.evaluate(() => window.__blips));
  check((await p.textContent('#artSpeak')).includes('멈추기'), 'the button now says stop');
  const full = await p.evaluate(() => document.querySelector('#artText').textContent.length); await p.waitForTimeout(1500);
  const part = await p.evaluate(() => document.querySelector('#artText').textContent.length);
  check(part > 0 && part < 100, 'the description is blank at first and grows as it is read: ' + full + ' -> ' + part);
  const c0 = await p.evaluate(() => window.__cuts); await p.click('#artSpeak'); await p.waitForTimeout(200);
  check(await p.evaluate(c => window.__cuts > c, c0), 'pressing again stops the sound');
  check(await p.evaluate(() => document.querySelector('#artText').textContent.length > 100), 'stopping brings the whole text back');
  await p.click('#artSpeak'); await p.waitForTimeout(200); const c1 = await p.evaluate(() => window.__cuts);
  await p.click('#artClose'); await p.waitForTimeout(300);
  check(!(await vis(p, '#art')) && await p.evaluate(c => window.__cuts > c, c1), 'closing hides the view and stops the voice');
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
