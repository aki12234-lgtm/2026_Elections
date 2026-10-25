// Renders the share image and the icons with headless Edge or Chrome.
//
// og.jpg: a close-up of the real scene (box and bouquet) at 1200×630, without text: the share title carries the name.
// The page is served locally with fonts/ blocked, so the licensed Tel Aviv files are never loaded or rendered here.
// favicon.ico (32 px) and apple-touch-icon.png (180 px, square corners) come from favicon.svg.
// Usage: node tools/make-images.mjs [notes=30]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const notes = Number(process.argv[2] || 30);
const CROP = { x: 112, y: 10, width: 1480 };   // in the 1920×1080 frame: the box centred, the bouquet whole, the box foot cut
const sleep = ms => new Promise(r => setTimeout(r, ms));

const exe = [process.env.CHROME,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', 'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
].find(p => p && fs.existsSync(p));
if (!exe) throw new Error('no Edge or Chrome found; set CHROME to its path');

// ---------- browser + a minimal DevTools protocol client ----------
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'kalpi-'));
const browser = spawn(exe, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const portFile = path.join(profile, 'DevToolsActivePort');   // written once the browser is listening
let port;
for (let i = 0; !port; i++) {
  if (i > 150) throw new Error('the browser did not start');
  await sleep(100);
  try { port = fs.readFileSync(portFile, 'utf8').split('\n')[0].trim(); } catch (e) { /* not yet */ }
}
const page = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find(t => t.type === 'page');
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });
let nextId = 0;
const waiting = new Map(), listeners = new Set();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (!m.id) return listeners.forEach(l => l(m));
  const w = waiting.get(m.id); waiting.delete(m.id);
  m.error ? w.rej(new Error(m.error.message)) : w.res(m.result);
};
const send = (method, params = {}) => new Promise((res, rej) => { const id = ++nextId; waiting.set(id, { res, rej }); ws.send(JSON.stringify({ id, method, params })); });
const once = method => new Promise(res => { const l = m => { if (m.method === method) { listeners.delete(l); res(m.params); } }; listeners.add(l); });
const evaluate = expression => send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }).then(r => r.result.value);

async function open(url, width, height) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: false });
  const loaded = once('Page.loadEventFired');
  await send('Page.navigate', { url });
  await loaded;
}
const capture = async (format, extra = {}) => Buffer.from((await send('Page.captureScreenshot', { format, ...extra })).data, 'base64');
function write(name, buf) { fs.writeFileSync(path.join(root, name), buf); console.log(`wrote ${name} (${Math.round(buf.length / 1024)} KB)`); }

// the repo over http, minus fonts/ (license) and live.js (no Firebase)
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
const server = http.createServer((req, res) => {
  const p = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  const file = path.join(root, p);
  if (p.startsWith('/fonts/') || p === '/live.js' || !file.startsWith(root) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  res.end(fs.readFileSync(file));
}).listen(0, '127.0.0.1');
await new Promise(r => server.once('listening', r));

try {
  await send('Page.enable');

  // ---------- og.jpg ----------
  // ?review gives the slider that simulates a count
  await open(`http://127.0.0.1:${server.address().port}/index.html?review`, 1920, 1080);
  await evaluate(`(async () => {
    document.querySelector('.headline').style.display = 'none';
    document.querySelector('.counter').style.visibility = 'hidden';
    await new Promise(r => setTimeout(r, 1500));          // initFonts re-lays out
    const n = document.getElementById('nRange');
    n.value = ${notes}; n.dispatchEvent(new Event('input'));
    document.getElementById('panel').hidden = true;
    await new Promise(r => setTimeout(r, 4000));          // the bouquet (and any patches) grow in
  })()`);
  const height = CROP.width * 630 / 1200;
  write('og.jpg', await capture('jpeg', { quality: 80, clip: { ...CROP, height, scale: 1200 / CROP.width } }));   // WhatsApp drops previews much over ~300 KB

  // ---------- icons ----------
  const svg = fs.readFileSync(path.join(root, 'favicon.svg'), 'utf8');
  const svgUrl = s => 'data:image/svg+xml;base64,' + Buffer.from(s).toString('base64');
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

  await open(svgUrl(svg), 32, 32);
  const png = await capture('png');
  const head = Buffer.alloc(22);                         // ICONDIR + one ICONDIRENTRY pointing at the PNG
  head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12);
  head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
  write('favicon.ico', Buffer.concat([head, png]));

  await open(svgUrl(svg.replace(/ rx="[\d.]+"/, '')), 180, 180);   // iOS rounds the corners itself
  write('apple-touch-icon.png', await capture('png'));
} finally {
  ws.close();
  server.close();
  browser.kill();
  await sleep(500);
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch (e) { /* the browser may still hold a file */ }
}
