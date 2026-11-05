/* Merging another key's drawings: the count is shown first, a second press merges, and the list refreshes. */
const { start, until, check, done } = require('./lib');
(async () => {
  const t = await start(); const p = await t.client('A'); await t.enter(p, '합치는이');
  const other = 'ab'.repeat(16);
  await p.evaluate(k => { window.__other = { key: k, works: [1, 2, 3].map(i => ({ id: 'w' + i, kind: 'work', at: 1000 + i, w: 100, h: 100, title: 'x' + i, strokes: [{ k: 'p', c: '#000', w: 2, p: [1, 1, 5, 5] }], exh: i === 1 })) }; }, other);
  await until(p, () => { const i = document.getElementById('intro'); return !i || i.offsetParent === null || getComputedStyle(i).display === 'none'; }, null, 30);
  await p.click('#worksBtn');
  await p.waitForTimeout(500);
  await p.evaluate(() => { document.getElementById('keyBox').open = true; });
  const key = () => p.locator('#keyInput');
  await key().fill(other); await p.evaluate(() => document.getElementById('keyMerge').click());
  check(await until(p, () => /3개/.test(document.getElementById('keyMerge').textContent), null, 10), 'the count (3 drawings) is shown before merging');
  check(/전시 중 1개/.test(await p.textContent('#keyMsg')), 'and how many are on show');
  await p.evaluate(() => document.getElementById('keyMerge').click());
  check(await until(p, () => /합쳤어요/.test(document.getElementById('keyMsg').textContent), null, 10), 'the second press merges');
  check(await until(p, () => document.getElementById('worksCount').textContent === '3', null, 10), 'my drawing list refreshes to 3');
  check(/바꾸기/.test(await p.textContent("#keyMsg")), 'the message tells the old device to switch keys');
  await t.close(); process.exit(done(t));
})().catch(e => { console.log('ERR', e.message); process.exit(1); });
