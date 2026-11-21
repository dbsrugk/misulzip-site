// two friends: one sets off fireworks, the other sees the show start
const { start, check, done, until } = require('./lib');
(async () => {
  const t = await start(); const a = await t.client('A'); await t.enter(a, '가');
  const b = await t.client('B'); await t.enter(b, '나');
  for (const p of [a, b]) await p.evaluate(() => { const P = window.__hw.pos; P.x = 92; P.z = 150; });
  await a.waitForTimeout(2500);
  await a.evaluate(() => document.querySelector('#fwBtn').click());
  check(await until(a, () => window.__fw.t() > 20, null, 20), 'my own show starts');
  check(await until(b, () => window.__fw.t() > 15, null, 60), 'my friend, standing near, sees the show start too');
  await t.close(); process.exit(done(t));
})().catch(e => { console.error('ERR', e.message); process.exit(1); });
