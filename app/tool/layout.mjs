// Layout check with long questions on common projector and phone sizes: nothing may overflow, overlap the
// teacher's buttons, or scroll sideways. Needs `npm start`. Usage: CHROME=… node tool/layout.mjs [outDir]
import { mkdirSync } from 'node:fs';
import assert from 'node:assert/strict';
import { launch, sleep, vis, txt } from './cdp.mjs';

const OUT = process.argv[2] || '/tmp/trangrua_lop/shots_layout';
const BASE = process.env.BASE || 'http://127.0.0.1:8790';
mkdirSync(OUT, { recursive: true });
const SECS = 10;
const LONG = 'Một người gửi tiết kiệm 100 triệu đồng vào ngân hàng với lãi suất $6\\%$ một năm theo thể thức lãi kép, kì hạn một năm. Biết rằng nếu không rút tiền thì sau mỗi năm số tiền lãi được nhập vào vốn ban đầu. Hỏi sau ít nhất bao nhiêu năm người đó nhận được số tiền (cả vốn lẫn lãi) không dưới $185$ triệu đồng?';
const BANK = {
  title: 'Bố cục', topic: 'Kiểm tra bố cục câu dài',
  questions: [
    { level: 'Dễ', seconds: SECS, text: LONG, options: ['10 năm, vì $1{,}06^{10}\\approx 1{,}79$ chưa đủ', '11 năm, vì $1{,}06^{11}\\approx 1{,}90$', '12 năm, tính theo lãi đơn', '9 năm, làm tròn xuống kết quả logarit'], answer: 1, source: 'Bài kiểm tra bố cục, câu rất dài', demoSpread: [0.3, 0.4, 0.2, 0.1] },
    { level: 'Vừa', seconds: SECS, text: 'Cho cấp số nhân có $u_1=\\dfrac{1}{2}$ và $q=\\dfrac{3}{2}$. Tổng $S_5$ bằng', options: ['$\\dfrac{211}{32}$', '$\\dfrac{211}{16}$', '$\\dfrac{633}{64}$', '$\\dfrac{211}{64}$'], answer: 1, source: 'thử', demoSpread: [0.25, 0.25, 0.25, 0.25] },
    { level: 'Khó', seconds: SECS, text: 'Ngắn?', options: ['A', 'B', 'C', 'D'], answer: 0, source: '', demoSpread: [0.25, 0.25, 0.25, 0.25] },
    { seconds: SECS, text: 'Cho cấp số cộng \\((u_n)\\) thỏa mãn\n\n\\[\nu_n-u_{n+1}=5,\\quad \\forall n\\ge 1.\n\\]\n\nCông sai của cấp số cộng này bằng bao nhiêu?', options: ['\\(5\\)', '\\(-5\\)', '\\(\\dfrac{1}{5}\\)', 'Không xác định được'], answer: 1, explain: 'Công sai là \\(d=u_{n+1}-u_n\\). Vì \\(u_n-u_{n+1}=5\\) nên \\(d=-5\\). Một câu giải thích dài thêm để kiểm tra bố cục khi lời giải thích chiếm hai, ba dòng trên màn chiếu nhỏ.' },
    { seconds: SECS, text: 'Dãy số \\(10;\\ 7;\\ 4;\\ 1;\\ -2;\\ldots\\) được xác định bởi hệ thức truy hồi nào dưới đây?', note: 'Các hệ thức truy hồi được xét với \\(n\\ge 1\\).', options: ['\\(u_1=10;\\quad u_{n+1}=u_n+3\\)', '\\(u_1=7;\\quad u_{n+1}=u_n-3\\)', '\\(u_1=10;\\quad u_{n+1}=3u_n\\)', '\\(u_1=10;\\quad u_{n+1}=u_n-3\\)'], answer: 3, explain: 'Dãy bắt đầu bằng \\(u_1=10\\); mỗi số hạng sau ít hơn số hạng trước \\(3\\) đơn vị nên \\(u_{n+1}=u_n-3\\).' },
  ],
  outro: { sequence: '2\\quad\\longrightarrow\\quad4\\quad\\longrightarrow\\quad8', question: 'Đây không phải cấp số cộng. Vậy các số hạng được tạo ra theo quy luật nào?', title: 'BÀI MỚI: CẤP SỐ NHÂN' },
};
const HOST_SIZES = [[1280, 720], [1366, 768], [1600, 900], [1920, 1080]];
const PHONE_SIZES = [[320, 568], [360, 640], [390, 844], [768, 1024]];
const browser = launch(9251);
const { errors } = browser;
const problems = [];

const hostCheck = `(() => {
  const col = document.querySelector('.main-col'), ctl = document.querySelector('#controls').getBoundingClientRect();
  const boxes = [...document.querySelectorAll('.main-col .question, .main-col .ans, .side-col > *')].map((e) => e.getBoundingClientRect());
  return {
    colOverflow: col.scrollHeight - col.clientHeight,
    overControls: Math.max(...boxes.map((b) => b.bottom)) - ctl.top,
    sideways: document.documentElement.scrollWidth - innerWidth,
    textOverflow: [...document.querySelectorAll('.main-col .ans .txt, .main-col .question')].filter((e) => e.scrollWidth > e.clientWidth + 2).length,
  };
})()`;
const phoneCheck = `(() => ({
  sideways: document.documentElement.scrollWidth - innerWidth,
  textOverflow: [...document.querySelectorAll('#answers .ans .txt, #qText')].filter((e) => e.scrollWidth > e.clientWidth + 2).length,
  logoTall: Math.round(document.querySelector('.brand.site .badge').getBoundingClientRect().height) > 64,
}))()`;

async function checkAll(host, phone, n) {
  for (const [w, h] of HOST_SIZES) {
    await host.viewport(w, h);
    await sleep(450);
    const r = await host.eval(hostCheck);
    if (r.colOverflow > 1 || r.overControls > 0 || r.sideways > 0 || r.textOverflow) problems.push(`gv ${w}×${h} câu ${n}: ${JSON.stringify(r)}`);
    if (w === 1280 || w === 1920) await host.shot(`${OUT}/gv_cau${n}_${w}x${h}.png`);
  }
  for (const [w, h] of PHONE_SIZES) {
    await phone.viewport(w, h);
    await sleep(350);
    const r = await phone.eval(phoneCheck);
    if (r.sideways > 0 || r.textOverflow || r.logoTall) problems.push(`hs ${w}×${h} câu ${n}: ${JSON.stringify(r)}`);
    if (w === 320) await phone.shot(`${OUT}/hs_cau${n}_${w}x${h}.png`);
  }
}

try {
  const host = await browser.page('host', `${BASE}/host.html`, 1280, 720, { before: `localStorage.setItem('lop3cau.test.bank', ${JSON.stringify(JSON.stringify(BANK))});` });
  await host.until(`${vis('#setup')} && !document.querySelector('#bCreate').disabled`, 'setup');
  await host.shot(`${OUT}/gv_chuan_bi_1280x720.png`);
  await host.click('#bCreate');
  await host.until(vis('#lobby'), 'lobby');
  const code = await host.text('#bigCode');
  const phone = await browser.page('hs', `${BASE}/play.html?room=${code}`, 320, 568);
  await phone.until(vis('#join'), 'join');
  await phone.shot(`${OUT}/hs_vao_lop_320x568.png`);
  await phone.eval(`document.querySelector('#name').value = 'Nguyễn Thị Thu Phương Anh'; document.querySelector('#joinForm').requestSubmit(); true`);
  await phone.until(vis('#wait'), 'wait');
  await host.click('#bFake');
  await host.until(`${txt('#playerCount')} === '31'`, '31', 60000);
  for (const [w, h] of HOST_SIZES) {
    await host.viewport(w, h);
    await sleep(300);
    const r = await host.eval(`({ sideways: document.documentElement.scrollWidth - innerWidth, over: document.querySelector('#lobby > div').getBoundingClientRect().bottom - document.querySelector('#controls').getBoundingClientRect().top })`);
    if (r.sideways > 0 || r.over > 0) problems.push(`gv phòng chờ ${w}×${h}: ${JSON.stringify(r)}`);
  }
  await host.viewport(1280, 720);
  await host.shot(`${OUT}/gv_phong_cho_1280x720.png`);

  for (let n = 1; n <= BANK.questions.length; n++) {
    await host.click('#bNext');
    await host.until(`${txt('#qLevel')} === 'CÂU ${n}/${BANK.questions.length}'`, `question ${n}`);
    await phone.until(`${txt('#qLevel')} === 'CÂU ${n}/${BANK.questions.length}'`, `phone question ${n}`);
    await phone.click('#answers .ans:nth-child(2)');
    await checkAll(host, phone, n);
    await host.viewport(1280, 720);
    await host.until(`${txt('#banner')} === 'HẾT GIỜ BÌNH CHỌN' && !document.querySelector('#answers .ans').disabled`, 'vote ended', (SECS + 10) * 1000);
    await host.click('#answers .ans:nth-child(1)');
    await host.until(`!document.querySelector('#bLock').disabled`, 'lock enabled');
    await host.click('#bLock');
    await host.until(`!!document.querySelector('#answers .ans.correct')`, 'reveal', 15000);
    await checkAll(host, phone, `${n}_ket_qua`);
    await host.viewport(1280, 720);
  }
  await host.click('#bNext');
  await host.until(vis('#final') + ` && !document.querySelector('#outroSeq').hidden`, 'lead-in screen');
  await host.shot(`${OUT}/gv_cau_hoi_mo_1280x720.png`);
  await host.click('#bNext');
  await host.until(`${txt('#finalTitle')} === 'BÀI MỚI: CẤP SỐ NHÂN'`, 'new-lesson title');
  for (const [w, h] of HOST_SIZES) {
    await host.viewport(w, h);
    await sleep(300);
    const r = await host.eval(`({ sideways: document.documentElement.scrollWidth - innerWidth, over: document.querySelector('#final .final-wrap').scrollHeight - document.querySelector('#final .final-wrap').clientHeight })`);
    if (r.sideways > 0 || r.over > 0) problems.push(`gv kết thúc ${w}×${h}: ${JSON.stringify(r)}`);
  }
  await phone.until(vis('#end'), 'phone end');
  await phone.shot(`${OUT}/hs_bai_moi_320x568.png`);
  await phone.viewport(320, 568);
  await phone.shot(`${OUT}/hs_ket_thuc_320x568.png`);
  assert.deepEqual(problems, [], 'layout problems');
  console.log(`LAYOUT OK · ${HOST_SIZES.length} cỡ màn chiếu × ${PHONE_SIZES.length} cỡ điện thoại × 3 câu (lúc chạy và lúc hiện kết quả)`);
} catch (e) {
  console.log('LAYOUT FAIL:', e.message);
  for (const p of problems) console.log('  -', p);
  await browser.dump();
  process.exitCode = 1;
} finally {
  if (errors.length) { console.log('Page errors:\n' + errors.join('\n')); process.exitCode = 1; }
  browser.close();
}
