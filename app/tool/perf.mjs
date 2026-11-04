// Smoothness check on a slow machine: CPU throttled (teacher laptop ×4, phone ×6) while the clock runs with
// 30 students answering, and during the reveal. Measures how busy the main thread is and how long the longest
// frame gap is. Headless Chrome paints in software, so this measures our JavaScript/layout work, not the GPU.
// Needs `npm start`. Usage: CHROME=… node tool/perf.mjs
import assert from 'node:assert/strict';
import { launch, sleep, vis, txt } from './cdp.mjs';

const BASE = process.env.BASE || 'http://127.0.0.1:8790';
const BANK = {
  title: 'Đo', topic: 'Đo độ mượt',
  questions: [0, 1, 2].map((i) => ({ level: ['Dễ', 'Vừa', 'Khó'][i], seconds: 12, text: `Câu ${i + 1}: cho $u_1=2$, $q=3$. Tìm $u_${i + 2}$`, options: ['6', '18', '54', '162'], answer: i, source: 'đo', demoSpread: [0.25, 0.25, 0.25, 0.25] })),
};
const browser = launch(9261);
const { errors } = browser;

// Main-thread busy share and the longest gap between animation frames over `ms`.
async function measure(p, ms) {
  await p.send('Performance.enable');
  const m0 = Object.fromEntries((await p.send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]));
  const gaps = p.eval(`new Promise((res) => { let last = performance.now(), worst = 0, n = 0; const end = last + ${ms};
    function f(t) { worst = Math.max(worst, t - last); last = t; n++; if (t < end) requestAnimationFrame(f); else res({ worst: Math.round(worst), frames: n }); }
    requestAnimationFrame(f); })`);
  await sleep(ms);
  const g = await gaps;
  const m1 = Object.fromEntries((await p.send('Performance.getMetrics')).result.metrics.map((m) => [m.name, m.value]));
  const d = (k) => m1[k] - m0[k];
  return { busy: Math.round((d('TaskDuration') / (ms / 1000)) * 100), script: Math.round((d('ScriptDuration') / (ms / 1000)) * 100), layouts: d('LayoutCount'), styles: d('RecalcStyleCount'), worstFrameMs: g.worst };
}

try {
  const host = await browser.page('host', `${BASE}/host.html`, 1366, 768, { before: `localStorage.setItem('lop3cau.test.bank', ${JSON.stringify(JSON.stringify(BANK))});` });
  await host.until(`${vis('#setup')} && !document.querySelector('#bCreate').disabled`, 'setup');
  await host.click('#bCreate');
  await host.until(vis('#lobby'), 'lobby');
  const code = await host.text('#bigCode');
  const phone = await browser.page('hs', `${BASE}/play.html?room=${code}`, 390, 844);
  await phone.until(vis('#join'), 'join');
  await phone.eval(`document.querySelector('#name').value = 'Đo'; document.querySelector('#joinForm').requestSubmit(); true`);
  await phone.until(vis('#wait'), 'wait');
  await host.click('#bFake');
  await host.until(`${txt('#playerCount')} === '31'`, '31', 60000);
  await host.cpu(4);
  await phone.cpu(6);
  await host.click('#bNext');
  await phone.until(`!document.querySelector('#answers .ans').disabled`, 'open');
  await phone.click('#answers .ans:nth-child(1)');
  const [hOpen, pOpen] = await Promise.all([measure(host, 5000), measure(phone, 5000)]);
  await host.until(`${txt('#banner')} === 'HẾT GIỜ BÌNH CHỌN' && !document.querySelector('#answers .ans').disabled`, 'vote ended', 20000);
  await host.click('#answers .ans:nth-child(1)');
  await host.until(`!document.querySelector('#bLock').disabled`, 'lock enabled');
  await host.click('#bLock');
  await host.until(`document.body.classList.contains('suspense')`, 'drumroll', 10000);
  const [hReveal, pReveal] = await Promise.all([measure(host, 3500), measure(phone, 3500)]);
  const rows = { 'gv ×4, đang đếm giờ': hOpen, 'hs ×6, đang đếm giờ': pOpen, 'gv ×4, lộ đáp án': hReveal, 'hs ×6, lộ đáp án': pReveal };
  for (const [k, v] of Object.entries(rows)) console.log(`  ${k}: luồng chính bận ${v.busy}% (JS ${v.script}%), ${v.layouts} lần dàn trang, ${v.styles} lần tính kiểu, khung chậm nhất ${v.worstFrameMs} ms`);
  for (const [k, v] of Object.entries(rows)) assert.ok(v.busy < 50, `${k}: main thread ${v.busy}% busy`);
  console.log('PERF OK');
} catch (e) {
  console.log('PERF FAIL:', e.message);
  await browser.dump();
  process.exitCode = 1;
} finally {
  if (errors.length) { console.log('Page errors:\n' + errors.join('\n')); process.exitCode = 1; }
  browser.close();
}
