/* Regenerates the link-preview image (hwasil/og.jpg, 1200x630) from the windmill field.  node hwasil/tests/og.js */
const { start } = require('./lib');
const path = require('path');
(async () => {
  const t = await start(); const p = await t.client('og', '', { width: 1200, height: 630 }); await t.enter(p, '화가');
  await p.click('#placesBtn'); await p.waitForTimeout(300); await p.locator('#placesList .btn').nth(5).click(); await p.waitForTimeout(1500);
  await p.evaluate(() => { document.getElementById('hud').style.display = 'none'; });
  await p.mouse.move(600, 400); await p.mouse.down(); await p.mouse.move(600, 360, { steps: 6 }); await p.mouse.up();   /* tilt the camera up a little */
  await p.waitForTimeout(3500);
  await p.screenshot({ path: path.join(__dirname, '..', 'og.jpg'), type: 'jpeg', quality: 84 });
  await t.close(); console.log('wrote hwasil/og.jpg');
})().catch(e => { console.error(e); process.exit(1); });
