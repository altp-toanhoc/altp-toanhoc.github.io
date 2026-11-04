// The local server stands in for GitHub Pages during the trial: no request may stop it, read outside public/,
// or reach the Auth emulator's admin routes. Starts its own copy on a spare port.
import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import net from 'node:net';

const PORT = 8797;
let proc;
before(async () => {
  proc = spawn(process.execPath, ['tool/serve.mjs'], { env: { ...process.env, PORT: String(PORT) }, stdio: 'ignore' });
  for (let i = 0; i < 50; i++) { try { await fetch(`http://127.0.0.1:${PORT}/`); return; } catch { await new Promise((r) => setTimeout(r, 100)); } }
});
after(() => proc.kill());

// Raw request, so the client library cannot normalise the path first.
const raw = (path) => new Promise((resolve) => {
  const c = net.connect(PORT, '127.0.0.1', () => c.write(`GET ${path} HTTP/1.1\r\nHost: x\r\nConnection: close\r\n\r\n`));
  let out = '';
  c.on('data', (d) => { out += d; });
  c.on('close', () => resolve(out.split(' ')[1] || 'closed'));
  c.on('error', () => resolve('error'));
});

test('bad paths are refused and the server keeps running', async () => {
  for (const p of ['/%00', '/%E0%A4%A', '/..%2f..%2fetc%2fpasswd', '/../package.json', '/theme/%00x']) {
    assert.match(await raw(p), /^(400|403|404)$/, p);
  }
  assert.equal((await fetch(`http://127.0.0.1:${PORT}/host.html`)).status, 200, 'still serving after the bad requests');
});

test('the Auth emulator admin routes are not reachable through the page port', async () => {
  assert.equal(await raw('/emulator/v1/projects/demo-trangrua/accounts'), '404');
});
