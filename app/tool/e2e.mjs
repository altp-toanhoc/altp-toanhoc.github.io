// End-to-end run of a whole game in headless Chrome: teacher screen (1600×900) + one student phone (390×844)
// + 30 fake students. Checks what each screen shows at every step and saves screenshots.
// Needs `npm start` first. Usage: CHROME=/path/to/chrome-headless-shell node tool/e2e.mjs [outDir]
// Themed run: serve the test theme on another port (THEME_DIR=… PORT=8791 node tool/serve.mjs), then
// BASE=http://127.0.0.1:8791 EXPECT_THEME=1 node tool/e2e.mjs <outDir>.
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { launch, sleep, vis, txt } from './cdp.mjs';
import { readFileSync } from 'node:fs';

const SET = JSON.parse(readFileSync(new URL('../bo_cau/cap_so_cong.json', import.meta.url), 'utf8'));
const K = SET.questions.map((q) => q.answer); // C, B, D, A, C
const L = (i) => 'ABCD'[i];

const OUT = process.argv[2] || '/tmp/trangrua_lop/shots';
const BASE = process.env.BASE || 'http://127.0.0.1:8790';
mkdirSync(OUT, { recursive: true });
const browser = launch(9231);
const { errors } = browser;
const page = async (label, url, w, h) => {
  const p = await browser.page(label, url, w, h);
  const shot = p.shot;
  p.shot = (name) => shot(`${OUT}/${name}.png`);
  return p;
};

const THEMED = !!process.env.EXPECT_THEME;
const played = (p) => p.eval('window.__played.map((u) => u.split("/").pop())');
const visibleButtons = `[...document.querySelectorAll('.controls .btn')].filter((b) => !b.closest('[hidden]') && !b.hidden).map((b) => b.firstChild.textContent.trim())`;

const key = (p, k) => p.eval(`document.body.dispatchEvent(new KeyboardEvent('keydown', { key: ${JSON.stringify(k)}, bubbles: true })); true`);
const pctSum = (p) => p.eval(`[...document.querySelectorAll('#answers .pct')].filter((e) => e.innerText).reduce((s, e) => s + parseInt(e.innerText, 10), 0)`);
const opt = (i) => `#answers .ans:nth-child(${i + 1})`;
// The vote ends at 0: banner, no key yet, the player can now pick.
async function expectVoteEnd(host, hs, n, { picked = false, ms = 30000 } = {}) {
  await host.until(`${txt('#banner')} === 'HẾT GIỜ BÌNH CHỌN' && !document.querySelector('#answers .ans').disabled`, `question ${n}: vote ended, player can pick`, ms);
  assert.equal(await host.eval(`!!document.querySelector('#answers .ans.correct')`), false, `question ${n}: no key before the lock`);
  assert.equal(await host.eval(`document.querySelector('#bLock').disabled`), !picked, picked ? `question ${n}: the pick made during the vote can now be locked` : `question ${n}: nothing to lock before a pick`);
  await hs.until(`${txt('#status')} === 'Hết giờ bình chọn. Chờ chốt đáp án…'`, `question ${n}: phone waits for the lock`);
}
// The key appears only after "Chốt đáp án" and the drumroll.
// After 50:50 the two removed options hide their share, so the visible shares add up to 100 or less.
async function expectReveal(host, hs, n, hostLine, phoneStatus, { fifty = false, ms = 15000 } = {}) {
  await host.until(`!!document.querySelector('#answers .ans.correct') && ${txt('#answered')} === ${JSON.stringify(hostLine)}`, `question ${n}: key and "${hostLine}" on the teacher screen`, ms);
  const sum = await pctSum(host);
  if (fifty) assert.ok(sum <= 100, `question ${n}: shares of the 2 options left (${sum})`); else assert.equal(sum, 100, `question ${n}: vote % add up to 100`);
  await hs.until(`${txt('#status')} === ${JSON.stringify(phoneStatus)} && [...document.querySelectorAll('#answers .pct')].some((e) => e.innerText.endsWith('%'))`, `question ${n}: phone shows "${phoneStatus}" and %`);
}
const NO_TEACHER_WORDS = /\bcô\b|\blớp\b/i;

try {
  const host = await page('host', `${BASE}/host.html`, 1600, 900);
  await host.until(vis('#setup') + ` && !document.querySelector('#bCreate').disabled`, 'setup with the official set');
  assert.equal(await host.text('#bankTitle'), 'Ôn tập cấp số cộng');
  const setupText = await host.eval(`[...document.querySelectorAll('#setup .setup-card > *')].filter((e) => e.id !== 'themeInfo').map((e) => e.innerText).join(' ').replace(/\\s+/g, ' ').trim()`);
  assert.equal(setupText, 'Ôn tập cấp số cộng Tạo phòng', 'setup screen: just the title and the button (plus the theme line when a theme is set up)');
  await host.shot('01_gv_chuan_bi');
  await host.click('#bCreate');
  await host.until(vis('#lobby'), 'lobby');
  const code = await host.text('#bigCode');
  assert.match(code, /^\d{4}$/);
  await host.until(`document.querySelector('#qr').src.startsWith('data:image/png')`, 'QR code');
  if (!THEMED) assert.match(await host.text('.lobby-badge'), /AI LÀ TRIỆU PHÚ\s*TOÁN HỌC/, 'built-in logo in the lobby');
  if (THEMED) {
    assert.match(await host.text('#themeInfo'), /^Giao diện riêng: 11 ảnh, 9 âm thanh, 2 màu\./, 'theme loaded with every slot');
    await host.until(`[...document.querySelectorAll('.brand.site .logo, img.theme-logo')].filter((i) => i.naturalWidth > 0 && !i.closest('[hidden]') && !i.hidden).length === 2`, 'logo in the top bar and the lobby');
    assert.equal(await host.eval(`getComputedStyle(document.querySelector('.brand.site .badge-wrap')).display`), 'none', 'theme logo replaces the built-in badge');
  }

  const hs = await page('hs', `${BASE}/play.html?room=${code}`, 390, 844);
  await hs.until(vis('#join'), 'student join form');
  await hs.eval(`document.querySelector('#name').value = 'Minh Anh'; document.querySelector('#joinForm').requestSubmit(); true`);
  await hs.until(vis('#wait'), 'student waiting screen');
  await host.click('#bFake');
  await host.until(`${txt('#playerCount')} === '31'`, '31 players', 60000);
  await host.until(`document.querySelectorAll('#names .chip').length === 31`, '31 chips');
  assert.deepEqual(await host.eval(visibleButtons), ['Bắt đầu', 'Thêm 30 học sinh ảo', 'Phòng mới']);
  await host.shot('02_gv_phong_cho');

  // Câu 1 (key C): vote with live %, pause; vote ends; pick C; then 50:50 and Tổ tư vấn; lock; right; explanation.
  await host.click('#bNext');
  await host.until(vis('#game') + ` && ${txt('#qLevel')} === 'CÂU 1/5'`, 'question 1 shown');
  assert.equal(await host.eval(`!!document.querySelector('#qSource') || /Nguồn/.test(document.querySelector('#game').innerText)`), false, 'no source line');
  assert.equal(await host.eval(`document.querySelector('#ll50').disabled && !document.querySelector('#answers .ans').disabled`), true, 'during the vote: options clickable, no lifeline yet');
  await hs.until(`${txt('#qLevel')} === 'CÂU 1/5' && !document.querySelector('${opt(0)}').disabled`, 'phone can vote at once');
  await hs.click(opt(0));
  await host.until(`[...document.querySelectorAll('#answers .pct')].some((e) => e.innerText.endsWith('%'))`, 'live vote % on the teacher screen', 10000);
  await host.shot('03_gv_cau1_binh_chon');
  await host.click('#bPause');
  await hs.until(`${txt('#banner')} === 'TẠM DỪNG'`, 'student sees pause');
  const frozen = await hs.text('#secs');
  await sleep(1500);
  assert.equal(await hs.text('#secs'), frozen, 'clock frozen while paused');
  await hs.click(opt(K[0]));
  await hs.until(`document.querySelector('${opt(K[0])}').classList.contains('chosen')`, 'student switches to C');
  await host.click('#bPause');
  await expectVoteEnd(host, hs, 1);
  await hs.shot('04_hs_cau1_het_gio');
  await host.click(opt(K[0]));
  await host.until(`document.querySelector('${opt(K[0])}').classList.contains('pick') && !document.querySelector('#bLock').disabled`, 'C picked, lock enabled');
  await host.click('#ll50');
  await hs.until(`document.querySelectorAll('#answers .ans.removed').length === 2`, '50:50 on the phone');
  assert.equal(await hs.eval(`document.querySelector('${opt(K[0])}').classList.contains('removed')`), false, 'the key is never removed');
  await host.click('#llTv');
  await hs.until(`${txt('#banner')} === 'TỔ TƯ VẤN ĐANG TRỢ GIÚP'`, 'Tổ tư vấn banner');
  assert.equal(await host.eval(`document.querySelector('${opt(K[0])}').classList.contains('pick')`), true, 'the pick survives the lifelines');
  await host.click(opt(K[0]));
  await sleep(2000);
  assert.equal(await host.eval(`!!document.querySelector('#answers .ans.correct')`), false, 'no key until "Chốt đáp án"');
  await host.shot('05_gv_cau1_da_chon');
  await host.click('#bLock');
  await expectReveal(host, hs, 1, 'Chính xác!', 'Chính xác! Đáp án là C.', { fifty: true });
  for (const p of [host, hs]) assert.equal(await p.eval(`!!document.querySelector('#explain') || /Giải thích/.test(document.body.innerText)`), false, `${p.label}: only the key, no explanation`);
  assert.equal(await hs.text('#teacher'), 'Bạn đã chọn C, đúng rồi.');
  if (THEMED) {
    const p2 = await played(host);
    for (const f of ['bat_dau.wav', 'nhac_nen.wav', 'dung_lai.wav', 'het_gio.wav', 'nam_muoi.wav', 'tu_van.wav', 'dap_an.wav']) assert.ok(p2.includes(f), `${f} played (${p2})`);
    const bi = (sel) => `getComputedStyle(document.querySelector(${JSON.stringify(sel)})).borderImageSource`;
    assert.match(await host.eval(bi('#answers .ans')), /theme\/dap_an/, 'answer frame from the theme');
    assert.match(await host.eval(bi('#qText')), /theme\/cau_hoi\.svg/, 'question frame from the theme');
    assert.match(await host.eval(`getComputedStyle(document.body).backgroundImage`), /theme\/nen\.svg/, 'background from the theme');
    assert.match(await hs.eval(bi('#answers .ans.correct')), /theme\/dap_an_dung\.svg/, 'correct frame on the phone');
  }
  await host.shot('06_gv_cau1_ket_qua');
  await hs.shot('06_hs_cau1_ket_qua');

  // Câu 2 (key B, display math in the question): keyboard: A then Enter: wrong.
  await host.click('#bNext');
  await hs.until(`${txt('#qLevel')} === 'CÂU 2/5' && !document.querySelector('${opt(0)}').disabled`, 'q2 open on phone');
  assert.equal(await host.eval(`!!document.querySelector('#qText .katex-display')`), true, 'the display formula of câu 2 is rendered');
  await hs.click(opt(0));
  await expectVoteEnd(host, hs, 2);
  assert.equal(await host.eval(`!document.querySelector('#ll50').disabled && !document.querySelector('#llTv').disabled && !document.querySelector('#ll50').classList.contains('used')`), true, 'lifelines are available again in the next question');
  await key(host, 'a');
  await host.until(`document.querySelector('${opt(0)}').classList.contains('pick')`, 'keyboard pick A');
  await key(host, 'Enter');
  await expectReveal(host, hs, 2, 'Chưa chính xác', 'Chưa chính xác. Đáp án đúng là B.');
  assert.equal(await host.eval(`document.querySelector('${opt(0)}').classList.contains('wrong-mine')`), true, 'the locked wrong answer turns red');
  await host.shot('07_gv_cau2_ket_qua');

  // Câu 3 (key D, with a note under the question): pick C, change to D, lock.
  await host.click('#bNext');
  await hs.until(`${txt('#qLevel')} === 'CÂU 3/5' && !document.querySelector('${opt(0)}').disabled`, 'q3 open on phone');
  assert.equal(await host.eval(`!document.querySelector('#qNote').hidden && /^Các hệ thức truy hồi được xét với/.test(document.querySelector('#qNote').innerText) && !!document.querySelector('#qNote .katex')`), true, 'the note under câu 3, with its formula');
  assert.equal(await hs.eval(`!document.querySelector('#qNote').hidden`), true, 'the note shows on the phone too');
  await hs.click(opt(K[2]));
  await expectVoteEnd(host, hs, 3);
  if (THEMED) assert.ok((await played(host)).includes('tich.wav'), 'tick sound in the last seconds');
  await host.click(opt(2));
  await host.click(opt(K[2]));
  await host.until(`document.querySelector('${opt(K[2])}').classList.contains('pick') && !document.querySelector('${opt(2)}').classList.contains('pick')`, 'pick changed to D');
  await host.click('#bLock');
  await expectReveal(host, hs, 3, 'Chính xác!', 'Chính xác! Đáp án là D.');
  await host.shot('08_gv_cau3_ket_qua');

  // Câu 4 and 5: pick the key and lock.
  for (const n of [4, 5]) {
    await host.click('#bNext');
    await hs.until(`${txt('#qLevel')} === 'CÂU ${n}/5' && !document.querySelector('${opt(0)}').disabled`, `q${n} open on phone`);
    await hs.click(opt(K[n - 1]));
    // The player picks while the students are still voting: allowed, but not lockable until time is up.
    await host.click(opt(K[n - 1]));
    await host.until(`document.querySelector('${opt(K[n - 1])}').classList.contains('pick')`, `q${n}: pick during the vote`);
    assert.equal(await host.eval(`document.querySelector('#bLock').disabled`), true, `q${n}: cannot lock during the vote`);
    await key(host, 'Enter');
    await sleep(500);
    assert.equal(await host.eval(`!!document.querySelector('#answers .ans.correct') || ${txt('#banner')} === 'HẾT GIỜ BÌNH CHỌN'`), false, `q${n}: Enter during the vote does nothing`);
    await expectVoteEnd(host, hs, n, { picked: true });
    assert.equal(await host.eval(`document.querySelector('${opt(K[n - 1])}').classList.contains('pick')`), true, `q${n}: the pick is kept when the vote ends`);
    await host.click('#bLock');
    await expectReveal(host, hs, n, 'Chính xác!', `Chính xác! Đáp án là ${L(K[n - 1])}.`);
  }
  await host.shot('09_gv_cau5_ket_qua');
  await hs.shot('09_hs_cau5_ket_qua');

  // Lead-in to the new lesson: 2 → 4 → 8 with the open question, then the title.
  assert.equal(await host.eval(`document.querySelector('#bNext').firstChild.textContent`), 'Tiếp');
  await host.click('#bNext');
  await host.until(vis('#final') + ` && !document.querySelector('#outroSeq').hidden && /quy luật nào/.test(${txt('#finalStats')})`, 'open-question screen');
  assert.equal(await host.eval(`document.querySelectorAll('#outroSeq .katex').length > 0 && /2.*4.*8/s.test(document.querySelector('#outroSeq .katex-mathml').textContent)`), true, '2 → 4 → 8 rendered');
  await hs.until(vis('#end') + ` && /quy luật nào/.test(${txt('#endTitle')})`, 'phone shows the open question');
  await host.shot('10_gv_cau_hoi_mo');
  await hs.shot('10_hs_cau_hoi_mo');
  assert.equal(await host.eval(`document.querySelector('#bNext').firstChild.textContent`), 'Bài mới');
  await host.click('#bNext');
  await host.until(`${txt('#finalTitle')} === 'BÀI MỚI: CẤP SỐ NHÂN'`, 'new-lesson title');
  await hs.until(`${txt('#endTitle')} === 'BÀI MỚI: CẤP SỐ NHÂN'`, 'phone shows the new-lesson title');
  assert.equal(await host.eval(`!!document.querySelector('#bNext') && document.querySelector('#bNext').hidden`), true, 'nothing after the title but Phòng mới');
  for (const [p, sel] of [[host, '#final'], [hs, '#end']]) {
    const t = await p.text(sel);
    assert.ok(!NO_TEACHER_WORDS.test(t), `no "cô"/"lớp" on ${p.label} ${sel}: ${t}`);
  }
  if (THEMED) assert.ok((await played(host)).includes('vinh_danh.wav'), 'final sound from the theme');
  await host.shot('11_gv_bai_moi');
  await hs.shot('11_hs_bai_moi');
  console.log(`E2E OK · room ${code} · 5 câu ${K.map(L).join('')} · ${await host.text('#finalTitle')}`);
} catch (e) {
  console.log('E2E FAIL:', e.message);
  await browser.dump();
  process.exitCode = 1;
} finally {
  if (errors.length) { console.log('Page errors:\n' + errors.join('\n')); process.exitCode = 1; }
  browser.close();
}
