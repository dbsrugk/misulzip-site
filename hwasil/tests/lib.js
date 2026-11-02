/* Test harness for 작은 화실: headless Chromium + a fake Supabase that connects several pages together.
   Run with:  NODE_PATH=$(npm root -g) node hwasil/tests/smoke.js   (see run.sh) */
const { chromium } = require('playwright');
const fs = require('fs'), os = require('os'), path = require('path'), cp = require('child_process');
const ROOT = path.resolve(__dirname, '..', '..');          /* repo root: pages are served as https://local.test/hwasil/ */
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });

function threeFile() {                                      /* three r128 comes from npm: the CDN is blocked in the sandbox */
  const dir = path.join(os.tmpdir(), 'hw-three'), f = path.join(dir, 'package/build/three.min.js');
  if (!fs.existsSync(f)) { fs.mkdirSync(dir, { recursive: true }); cp.execSync('npm pack three@0.128.0 --silent', { cwd: dir }); cp.execSync('tar xzf three-0.128.0.tgz package/build/three.min.js', { cwd: dir }); }
  return f;
}
const STUB = `window.supabase={createClient(){return{
 rpc(fn,a){window.__rpcs=(window.__rpcs||[]).concat([fn]);if(fn==='hwasil_check')return Promise.resolve({data:a.code==='6nk9z69j',error:null});
  if(/list/.test(fn))return Promise.resolve({data:[],error:null});return Promise.resolve({data:null,error:null});},
 channel(n,o){const h={};const c={on(t,f,cb){(h[f.event]=h[f.event]||[]).push(cb);return c;},
  subscribe(cb){window.__h=window.__h||{};window.__h[n]=h;window.__cb=window.__cb||{};window.__cb[n]=cb;window.__subs=window.__subs||{};window.__subs[n]=(window.__subs[n]||0)+1;setTimeout(()=>cb('SUBSCRIBED'),30);return c;},
  send(m){window.__busSend(n,m.event,m.payload);return Promise.resolve('ok');}};return c;},
 removeChannel(){return Promise.resolve();}};}};
window.__busRecv=(n,e,p)=>{const h=(window.__h||{})[n];if(h&&h[e])h[e].forEach(f=>f({payload:p}));};`;
const HOOK = "const ray = new T.Raycaster(); window.__hw = { pos: pos, easels: easels, go: (idx) => { const e = easels[idx]; goal = { x: e.sit.x, z: e.sit.z, idx: idx, stuck: 0 }; } };";

async function start(opts) {
  opts = opts || {};
  const browser = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist'] });
  const pages = [], errors = [];
  async function client(name, query) {
    const i = pages.length, ctx = await browser.newContext({ viewport: { width: 390, height: 800 } });
    const p = await ctx.newPage(); pages.push(p); p.name = name || ('p' + i);
    p.on('pageerror', e => errors.push(p.name + ': ' + e));
    await p.exposeFunction('__busSend', (n, e, pl) => { pages.forEach((q, j) => { if (j !== i) q.evaluate(([a, b, c]) => window.__busRecv(a, b, c), [n, e, pl]).catch(() => {}); }); });
    await p.route('**/*', r => {
      const u = new URL(r.request().url());
      if (u.hostname === 'cdn.jsdelivr.net') return r.fulfill({ contentType: 'application/javascript', body: STUB });
      if (u.hostname === 'cdnjs.cloudflare.com') return r.fulfill({ path: threeFile() });
      if (u.hostname === 'local.test') {
        const f = path.join(ROOT, u.pathname.endsWith('/') ? u.pathname + 'index.html' : u.pathname);
        if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: 'nf' });
        let body = fs.readFileSync(f);
        if (f.endsWith('.html')) body = Buffer.from(body.toString('utf8').replace('const ray = new T.Raycaster();', HOOK));
        return r.fulfill({ body, contentType: f.endsWith('.js') ? 'application/javascript' : 'text/html' });
      }
      return r.abort();                                      /* fonts etc. */
    });
    await p.goto('https://local.test/hwasil/' + (query || ''));
    await p.waitForTimeout(1000);
    return p;
  }
  async function enter(p, nick) {                           /* no entry-code step any more */
    if (nick) await p.fill('#nameInput', nick);
    await p.click('#startBtn'); await p.waitForTimeout(3500);
  }
  return { browser, pages, errors, client, enter, out: n => path.join(OUT, n), close: () => browser.close() };
}
const vis = (p, sel) => p.evaluate(s => !document.querySelector(s).hidden, sel);
async function until(p, fn, arg, secs) { for (let k = 0; k < (secs || 60); k++) { if (await p.evaluate(fn, arg)) return true; await p.waitForTimeout(1000); } return false; }
let fails = 0;
function check(ok, msg) { console.log((ok ? 'PASS ' : 'FAIL ') + msg); if (!ok) fails++; }
function done(t) { const bad = t.errors.filter(e => !/Failed to load resource/.test(e)); check(bad.length === 0, 'no page errors' + (bad.length ? ' ' + JSON.stringify(bad) : '')); console.log(fails ? 'RESULT: FAIL (' + fails + ')' : 'RESULT: OK'); return fails; }
module.exports = { start, vis, until, check, done };
