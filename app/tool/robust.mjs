// Things that go wrong in a real classroom, played out in headless Chrome against the running stack (`npm start`):
// a phone reloads mid-question, a student joins late, the Wi-Fi drops, a name contains HTML, 62 students,
// the teacher's laptop reloads mid-question and again during the drumroll, a phone answers while offline.
// Usage: CHROME=… node tool/robust.mjs [outDir]
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { launch, sleep, vis, txt } from './cdp.mjs';

const OUT = process.argv[2] || '/tmp/trangrua_lop/shots_robust';
const BASE = process.env.BASE || 'http://127.0.0.1:8790';
mkdirSync(OUT, { recursive: true });
const SECS = 8;
const BANK = {
  title: 'Kiểm thử', topic: 'Kiểm thử chịu lỗi',
  questions: [
    { level: 'Dễ', seconds: SECS, text: 'Câu một: $1+1$ bằng', options: ['1', '2', '3', '4'], answer: 1, source: 'thử', demoSpread: [0.1, 0.7, 0.1, 0.1] },
    { level: 'Vừa', seconds: SECS, text: 'Câu hai: $2\\cdot 3$ bằng', options: ['6', '5', '8', '9'], answer: 0, source: 'thử', demoSpread: [0.6, 0.2, 0.1, 0.1] },
    { level: 'Khó', seconds: SECS, text: 'Câu ba: $2^5$ bằng', options: ['16', '64', '32', '10'], answer: 2, source: 'thử', demoSpread: [0.2, 0.3, 0.4, 0.1] },
  ],
};
const XSS = '<svg onload=alert(1)>'; // ≤ 24 characters, the name limit
const browser = launch(9241);
const { errors, pages } = browser;
const shot = (p, name) => p.shot(`${OUT}/${name}.png`);
const checks = [];
const ok = (what) => { checks.push(what); console.log('  ✓', what); };

async function join(label, code, name) {
  const p = await browser.page(label, `${BASE}/play.html?room=${code}`, 390, 844);
  await p.until(vis('#join'), `${label} join form`);
  await p.eval(`document.querySelector('#name').value = ${JSON.stringify(name)}; document.querySelector('#joinForm').requestSubmit(); true`);
  await p.until(`${vis('#wait')} || ${vis('#q')}`, `${label} joined`);
  return p;
}
const opt = (i) => `#answers .ans:nth-child(${i + 1})`;
const voteEnded = (host) => host.until(`${txt('#banner')} === 'HẾT GIỜ BÌNH CHỌN' && !document.querySelector('#answers .ans').disabled`, 'vote ended', (SECS + 10) * 1000);
async function lockKey(host, n) {
  await host.click(opt(BANK.questions[n].answer));
  await host.until(`!document.querySelector('#bLock').disabled`, 'lock enabled');
  await host.click('#bLock');
}
const revealed = (host) => host.until(`!!document.querySelector('#answers .ans.correct') && /^(Chính xác!|Chưa chính xác)$/.test(${txt('#answered')})`, 'key on the teacher screen', 20000);

try {
  const host = await browser.page('host', `${BASE}/host.html`, 1600, 900, { before: `localStorage.setItem('lop3cau.test.bank', ${JSON.stringify(JSON.stringify(BANK))});` });
  await host.until(`${vis('#setup')} && !document.querySelector('#bCreate').disabled`, 'setup');
  await host.click('#bCreate');
  await host.until(vis('#lobby'), 'lobby');
  const code = await host.text('#bigCode');

  // 1. A name with HTML in it is shown as text, never run.
  const s1 = await join('s1', code, 'An');
  const s2 = await join('s2', code, XSS);
  await host.until(`[...document.querySelectorAll('#names .chip')].some((c) => c.textContent === ${JSON.stringify(XSS)})`, 'HTML name shown as text');
  assert.equal(await host.eval(`document.querySelectorAll('#names svg, #names img').length`), 0);
  ok('tên chứa HTML hiện nguyên chữ, không chạy');

  // 2. 62 students.
  await host.click('#bFake');
  await host.until(`${txt('#playerCount')} === '32'`, '32 players', 60000);
  await host.until(`!document.querySelector('#bFake').textContent.startsWith('Đang')`, 'first batch done', 30000);
  await host.click('#bFake');
  await host.until(`${txt('#playerCount')} === '62'`, '62 players', 60000);
  await host.until(`document.querySelectorAll('#names .chip').length === 62`, '62 chips');
  ok('62 học sinh trong phòng, mỗi em một thẻ tên');
  await shot(host, '01_phong_62');

  // 3. Câu 1: a phone reloads and comes back with its choice; a late student joins and answers.
  await host.click('#bNext');
  await s1.until(`!document.querySelector('${opt(0)}').disabled`, 's1 can answer');
  await s1.click(opt(1));
  await s1.until(`document.querySelector('${opt(1)}').classList.contains('chosen')`, 's1 chose B');
  await s1.reload();
  await s1.until(`${vis('#q')} && document.querySelector('${opt(1)}')?.classList.contains('chosen')`, 's1 back after reload with B chosen');
  ok('điện thoại tải lại giữa câu: vào lại đúng phòng, giữ lựa chọn');
  const s3 = await join('s3', code, 'Muộn');
  await s3.until(`${vis('#q')} && !document.querySelector('${opt(0)}').disabled`, 'late student sees the open question');
  await s3.click(opt(1));
  await s3.until(`document.querySelector('${opt(1)}').classList.contains('chosen')`, 'late student chose');
  ok('học sinh vào muộn thấy ngay câu đang chạy và trả lời được');

  // 4. Wi-Fi drops on a phone: the banner shows, then clears when it is back.
  await s2.offline(true);
  await s2.until(`!document.querySelector('#netBanner').hidden`, 'offline banner', 30000);
  await shot(s2, '02_hs_mat_ket_noi');
  await s2.offline(false);
  await s2.until(`document.querySelector('#netBanner').hidden`, 'banner cleared', 30000);
  ok('mất mạng: hiện "MẤT KẾT NỐI", có mạng lại thì tự ẩn');

  // 5. The teacher's laptop reloads mid-question: the game carries on and the key still appears by itself.
  await host.reload();
  await host.until(`${vis('#game')} && ${txt('#qLevel')}.startsWith('CÂU 1/3')`, 'host back in the question');
  await voteEnded(host);
  await host.click(opt(1));
  await host.until(`document.querySelector('${opt(1)}').classList.contains('pick')`, 'picked B');
  await host.reload(); // the teacher's laptop reloads again while deciding: the pick is still there
  await host.until(`${vis('#game')} && document.querySelector('${opt(1)}')?.classList.contains('pick') && !document.querySelector('#bLock').disabled`, 'pick kept after reload');
  await host.click('#bLock');
  await revealed(host);
  await s1.until(`${txt('#status')} === 'Chính xác! Đáp án là B.' && ${txt('#teacher')} === 'Bạn đã chọn B, đúng rồi.'`, 's1 sees the key and its own vote');
  await s3.until(`${txt('#teacher')} === 'Bạn đã chọn B, đúng rồi.'`, 's3 sees its own vote');
  const total1 = await host.eval(`[...document.querySelectorAll('#answers .pct')].filter((e) => e.innerText).reduce((s, e) => s + parseInt(e.innerText, 10), 0)`);
  assert.equal(total1, 100);
  ok('máy giáo viên tải lại lúc bình chọn và lúc đang chọn: đồng hồ chạy tiếp, ô đã chọn vẫn giữ, chốt vẫn được');
  await shot(host, '03_gv_cau1');

  // 6. Câu 2: the teacher's laptop reloads during the drumroll (locked, key not yet out).
  await host.click('#bNext');
  await s1.until(`${txt('#qLevel')}.startsWith('CÂU 2/3') && !document.querySelector('${opt(0)}').disabled`, 'q2 open');
  await s1.click(opt(0));
  await voteEnded(host);
  await lockKey(host, 1);
  await host.until(`document.body.classList.contains('suspense')`, 'drumroll started', 5000);
  await host.reload();
  await host.until(`${vis('#game')} && ${txt('#qLevel')}.startsWith('CÂU 2/3')`, 'host back after reload');
  await revealed(host);
  await s1.until(`${txt('#teacher')} === 'Bạn đã chọn A, đúng rồi.'`, 's1 result on q2');
  ok('máy giáo viên tải lại đúng lúc trống dồn: đáp án vẫn được công bố');

  // 7. Câu 3: a phone answers while offline and comes back after time is up: the late answer is refused and not counted.
  await host.click('#bNext');
  await s1.until(`${txt('#qLevel')}.startsWith('CÂU 3/3') && !document.querySelector('${opt(0)}').disabled`, 'q3 open');
  await s3.click(opt(2));
  await s1.offline(true);
  await s1.click(opt(2));
  await voteEnded(host);
  await lockKey(host, 2);
  await revealed(host);
  const shares = `[...document.querySelectorAll('#answers .pct')].map((e) => e.innerText).join('|')`; // the class % on the teacher screen
  const before = await host.eval(shares);
  await s1.offline(false);
  await s1.until(`${txt('#note')}.startsWith('Hết giờ, lựa chọn này không được ghi') || ${txt('#teacher')} === 'Bạn chưa bình chọn câu này.'`, 'late offline answer refused', 40000);
  await sleep(1500);
  assert.equal(await host.eval(shares), before, 'class % unchanged by the refused answer');
  ok('chọn lúc mất mạng rồi có mạng lại sau giờ: bị từ chối, không làm sai số đếm');
  await shot(s1, '04_hs_tra_loi_tre');

  await host.click('#bNext');
  await host.until(`${vis('#final')}`, 'final');
  await s3.until(`${vis('#end')} && ${txt('#myScore')} === 'CHÚC MỪNG!'`, 'closing screen on a late student\'s phone');
  await s2.until(vis('#end'), 's2 end');
  ok('cuối buổi: điện thoại học sinh vào muộn hiện màn kết thúc');
  await shot(host, '05_gv_vinh_danh');

  const dialogs = Object.values(pages).flatMap((p) => p.dialogs);
  assert.deepEqual(dialogs, [], `no alert/confirm popped up (${dialogs})`);
  console.log(`ROBUST OK · ${checks.length} tình huống`);
} catch (e) {
  console.log('ROBUST FAIL:', e.message);
  await browser.dump();
  process.exitCode = 1;
} finally {
  if (errors.length) { console.log('Page errors:\n' + errors.join('\n')); process.exitCode = 1; }
  browser.close();
}
