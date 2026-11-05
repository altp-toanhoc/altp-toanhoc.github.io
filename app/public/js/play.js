// Student screen: vote on each question while the clock runs (and change the vote until it ends); then wait for
// the player's locked answer and the key.
import { browserSessionPersistence, ref, set, get, onValue, onDisconnect, serverTimestamp } from '../vendor/vendor.js';
import { connect, serverClock, $, setRich, esc, show, watchConnection, keepAwake, signIn, retry } from './common.js';
import { LETTERS, PHASE, percentages, remainingMs, money, TOP_PRIZE, secs } from './logic.js';
import { applyTheme } from './theme.js';

const { auth, db } = connect('play', browserSessionPersistence);
const now = serverClock(db);
watchConnection(db, $('#netBanner'));
keepAwake();
let code = (new URLSearchParams(location.search).get('room') || '').trim();
let name = '';
let joined = false;
let state = null;
let meta = null;
let question = null;
let results = null;
let key = null;
let mine = null;
let finalData = null;
let outro = null;
let watchedQ = null;
let renderedQ = null;
let qSubs = [];
let note = '';

const roomPath = (p) => `rooms/${code}/${p}`;
const phaseIn = (...ps) => !!state && ps.includes(state.phase);
const nameKey = () => `lop3cau.play.${code}`;
let signedIn = null; // promise of the anonymous sign-in, started at page load

// ---------- join ----------
async function join(e) {
  e?.preventDefault();
  const c = $('#code').value.trim();
  const n = $('#name').value.trim().replace(/\s+/g, ' ');
  const err = $('#joinErr');
  err.textContent = '';
  if (!/^[0-9]{4}$/.test(c)) { err.textContent = 'Mã phòng gồm 4 chữ số.'; return; }
  if (!n) { err.textContent = 'Hãy nhập tên hiển thị.'; return; }
  $('#joinBtn').disabled = true;
  try {
    await signedIn; // a submit (Enter key) can come before the sign-in has finished
    code = c;
    const host = (await get(ref(db, roomPath('host')))).val();
    if (!host) { err.textContent = 'Không tìm thấy phòng này. Kiểm tra lại mã.'; return; }
    await set(ref(db, roomPath(`players/${auth.currentUser.uid}`)), { name: n.slice(0, 24), joinedAt: serverTimestamp() });
    name = n;
    sessionStorage.setItem(nameKey(), n);
    if (new URLSearchParams(location.search).get('room') !== c) history.replaceState(null, '', `?room=${c}`);
    attach();
  } catch (ex) {
    err.textContent = `Chưa vào được phòng (${ex.message}).`;
  } finally {
    $('#joinBtn').disabled = false;
  }
}

// Marks this student online while the tab is connected, so the teacher's counts leave out closed tabs.
function presence() {
  const me = ref(db, roomPath(`players/${auth.currentUser.uid}/online`));
  onValue(ref(db, '.info/connected'), (s) => {
    if (!s.val()) return;
    onDisconnect(me).set(false).then(() => set(me, true)).catch(() => {});
  });
}

function attach() {
  joined = true;
  presence();
  onValue(ref(db, roomPath('meta')), (s) => { meta = s.val(); render(); });
  onValue(ref(db, roomPath('state')), (s) => { state = s.val(); watchQuestion(); render(); });
  onValue(ref(db, roomPath('final')), (s) => { finalData = s.val(); render(); });
  onValue(ref(db, roomPath('outro')), (s) => { outro = s.val(); render(); });
  render();
}

function watchQuestion() {
  const q = state?.q;
  if (q === watchedQ) return;
  qSubs.splice(0).forEach((u) => u());
  watchedQ = q;
  question = null; results = null; key = null; mine = null; note = '';
  clearTimeout(pendingTimer); pendingChoice = null;
  if (!Number.isInteger(q) || q < 0) return;
  const uid = auth.currentUser.uid;
  qSubs = [
    onValue(ref(db, roomPath(`questions/${q}`)), (s) => { question = s.val(); renderedQ = null; render(); }),
    onValue(ref(db, roomPath(`results/${q}`)), (s) => { results = s.val(); render(); }),
    onValue(ref(db, roomPath(`keys/${q}`)), (s) => { key = s.val(); render(); }),
    onValue(ref(db, roomPath(`answers/${q}/${uid}`)), (s) => { mine = s.val(); render(); }),
  ];
}

let lastWrite = 0;
let pendingTimer = null;
let pendingChoice = null;
function choose(i) {
  if (!phaseIn(PHASE.OPEN, PHASE.PAUSED) || state.removed?.[i]) return;
  if (remainingMs(state, now()) <= 0 && phaseIn(PHASE.OPEN)) return;
  note = '';
  navigator.vibrate?.(15);
  pendingChoice = i;
  showChoice(i); // feedback at once, even when the write waits a moment
  const wait = 400 - (Date.now() - lastWrite); // margin over the server's 250 ms, for network jitter
  clearTimeout(pendingTimer);
  if (wait > 0) pendingTimer = setTimeout(writeChoice, wait); else writeChoice();
}
function writeChoice() {
  const i = pendingChoice;
  pendingChoice = null;
  if (i == null || !phaseIn(PHASE.OPEN, PHASE.PAUSED)) { render(); return; }
  if (mine && mine.choice === i) { render(); return; } // tapping the same answer again changes nothing (keeps the answer time)
  lastWrite = Date.now();
  const q = state.q;
  // The database shows the new choice at once and takes it back if the server refuses.
  set(ref(db, roomPath(`answers/${q}/${auth.currentUser.uid}`)), { choice: i, at: serverTimestamp() })
    .catch(() => {
      if (state?.q !== q) return;
      note = phaseIn(PHASE.OPEN, PHASE.PAUSED) && remainingMs(state, now()) > 0
        ? 'Chưa ghi được lựa chọn. Hãy chọn lại.'
        : 'Hết giờ, lựa chọn này không được ghi.';
      render();
    });
}
function showChoice(i) {
  [...$('#answers').children].forEach((b, k) => b.classList.toggle('chosen', k === i));
  $('#status').textContent = `Bạn chọn ${LETTERS[i]}. Đổi được đến khi hết giờ.`;
}

// ---------- rendering ----------
function render() {
  $('#who').innerHTML = joined ? `${esc(name)}<div class="muted">Phòng ${esc(code)}</div>` : '';
  const phase = state?.phase;
  const inQ = joined && [PHASE.OPEN, PHASE.PAUSED, PHASE.DECIDE, PHASE.CLOSED].includes(phase);
  show($('#join'), !joined);
  show($('#wait'), joined && (!phase || phase === PHASE.LOBBY));
  show($('#q'), inQ);
  show($('#end'), joined && phase === PHASE.END);
  if (inQ) renderQuestion(); else document.body.classList.remove('suspense');
  if (joined && phase === PHASE.END) renderEnd();
}

function renderQuestion() {
  if (!question) return;
  document.body.classList.toggle('suspense', phaseIn(PHASE.CLOSED) && key == null);
  const total = meta?.total || 3;
  if (renderedQ !== state.q) {
    renderedQ = state.q;
    $('#qLevel').textContent = `CÂU ${state.q + 1}/${total}`;
    setRich($('#qText'), question.text);
    setRich($('#qNote'), question.note || '');
    show($('#qNote'), !!question.note);
    const box = $('#answers');
    box.innerHTML = '';
    question.options.forEach((opt, i) => {
      const b = document.createElement('button');
      b.className = 'ans';
      b.type = 'button';
      b.innerHTML = `<div class="fill"></div><span class="letter">${LETTERS[i]}</span><span class="txt"></span><span class="pct"></span>`;
      setRich(b.querySelector('.txt'), opt);
      b.addEventListener('click', () => choose(i));
      box.append(b);
    });
  }
  const removed = state.removed || null;
  const open = phaseIn(PHASE.PAUSED) || (phaseIn(PHASE.OPEN) && remainingMs(state, now()) > 0);
  const reveal = phaseIn(PHASE.CLOSED) && key != null;
  const pct = phaseIn(PHASE.DECIDE, PHASE.CLOSED) && results?.counts && results.counts.some((c) => c > 0) ? percentages(results.counts) : null;
  const myChoice = pendingChoice != null && open ? pendingChoice : (mine && !(removed && removed[mine.choice]) ? mine.choice : null);
  const final = phaseIn(PHASE.CLOSED) && Number.isInteger(state.final) ? state.final : null;
  [...$('#answers').children].forEach((b, i) => {
    b.disabled = !open || !!removed?.[i];
    b.classList.toggle('removed', !!removed?.[i]);
    b.classList.toggle('chosen', myChoice === i && !reveal && final === null);
    b.classList.toggle('locked', final === i && !reveal);
    b.classList.toggle('correct', reveal && i === key);
    b.classList.toggle('wrong-mine', reveal && final === i && i !== key);
    b.querySelector('.fill').style.transform = `scaleX(${pct ? pct[i] / 100 : 0})`;
    b.querySelector('.pct').textContent = pct && !removed?.[i] ? `${pct[i]}%` : '';
  });

  const banner = $('#banner');
  let text = '';
  if (phaseIn(PHASE.PAUSED)) text = 'TẠM DỪNG';
  else if (phaseIn(PHASE.DECIDE)) text = state.advisor ? 'TỔ TƯ VẤN ĐANG TRỢ GIÚP' : 'HẾT GIỜ BÌNH CHỌN';
  banner.textContent = text;
  show(banner, !!text);

  const st = $('#status');
  let msg = '';
  let cls = '';
  let sub = '';
  if (open) {
    if (mine && removed?.[mine.choice]) msg = 'Phương án bạn chọn đã bị loại. Hãy chọn lại.';
    else msg = myChoice != null ? `Bạn chọn ${LETTERS[myChoice]}. Đổi được đến khi hết giờ.` : 'Bình chọn đáp án bạn cho là đúng.';
  } else if (reveal) {
    if (final === key) { msg = `Chính xác! Đáp án là ${LETTERS[key]}.`; cls = 'good'; }
    else { msg = `Chưa chính xác. Đáp án đúng là ${LETTERS[key]}.`; cls = 'bad'; }
    sub = myChoice != null ? `Bạn đã chọn ${LETTERS[myChoice]}${myChoice === key ? ', đúng rồi' : ''}.` : 'Bạn chưa bình chọn câu này.';
  } else if (final !== null) {
    msg = `Đã chốt đáp án ${LETTERS[final]}. Chờ công bố…`;
  } else {
    msg = 'Hết giờ bình chọn. Chờ chốt đáp án…';
    sub = myChoice != null ? `Bạn đã chọn ${LETTERS[myChoice]}.` : 'Bạn chưa bình chọn câu này.';
  }
  $('#teacher').textContent = sub;
  show($('#teacher'), !!sub);
  st.textContent = msg;
  st.className = `status ${cls}`;
  $('#note').textContent = note;
  show($('#note'), !!note);
}

// Touches the page only when the shown value changes; the bar moves in 250 ms steps (CSS transition).
const clockShown = { sec: null, bar: null, low: null, locked: false };
function renderClock() {
  if (!joined || !state || !question || !phaseIn(PHASE.OPEN, PHASE.PAUSED, PHASE.DECIDE, PHASE.CLOSED)) return;
  const ms = remainingMs(state, now());
  const total = state.durationMs || question.seconds * 1000;
  const closed = phaseIn(PHASE.DECIDE, PHASE.CLOSED);
  const sec = closed ? 0 : Math.ceil(ms / 1000);
  const bar = closed ? 0 : Math.max(0, Math.min(1, Math.ceil(ms / 250) * 250 / total)).toFixed(3);
  const low = !closed && sec <= 5;
  if (clockShown.sec !== sec) { clockShown.sec = sec; $('#secs').textContent = `${sec}s`; }
  if (clockShown.bar !== bar) { clockShown.bar = bar; $('#tfill').style.transform = `scaleX(${bar})`; }
  if (clockShown.low !== low) { clockShown.low = low; $('#tbar').classList.toggle('low', low); }
  // The clock may reach 0 a moment before the teacher's screen locks the question.
  if (phaseIn(PHASE.OPEN) && ms <= 0) [...$('#answers').children].forEach((b) => { b.disabled = true; });
}

function renderEnd() {
  if (!finalData) return;
  const step = state?.outro;
  const box = $('#board');
  const lead = !!outro && Number.isInteger(step) && step >= 0;
  show($('#outroSeq'), lead && step === 0);
  show(box, !lead);
  if (lead && step === 0) {
    setRich($('#outroSeq'), `\\[${outro.sequence || ''}\\]`);
    $('#myScore').textContent = '';
    setRich($('#endTitle'), outro.question || '');
    return;
  }
  if (lead && step === 1) {
    $('#myScore').textContent = '';
    $('#endTitle').textContent = outro.title;
    return;
  }
  const rows = finalData.ranking || [];
  const mine = rows.find((r) => r.uid === auth.currentUser?.uid);
  $('#myScore').textContent = 'CHÚC MỪNG!';
  $('#endTitle').innerHTML = `Bạn đã trở thành<br>Triệu phú Toán học<br><span class="prize">${money(TOP_PRIZE)}đ</span>`
    + (mine ? `<span class="my-rank">Hạng <b>${mine.rank}</b>/${rows.length} · ${mine.correct}/${finalData.total} câu đúng · ${secs(mine.ms)}</span>` : '');
  box.innerHTML = '';
  box.classList.add('rank');
  rows.slice(0, 5).forEach((r) => {
    const li = document.createElement('li');
    li.classList.toggle('me', r === mine);
    li.innerHTML = `<b class="r">${r.rank}</b><span class="nm">${esc(r.name)}</span><span class="t">${r.correct} đúng · ${secs(r.ms).replace(' giây', 's')}</span>`;
    box.append(li);
  });
}

$('#joinForm').addEventListener('submit', join);
setInterval(renderClock, 100);

window.__appStarted = true; // the page's fallback message stays hidden
(async () => {
  applyTheme(); // the phone shows the same theme images, colours and font
  $('#code').value = code;
  render();
  $('#joinBtn').disabled = true;
  signedIn = signIn(auth); // one anonymous identity per tab
  await signedIn;
  $('#joinBtn').disabled = false;
  const saved = code && sessionStorage.getItem(nameKey());
  if (saved) {
    try {
      const me = (await retry(() => get(ref(db, roomPath(`players/${auth.currentUser.uid}`))))).val();
      if (me) { name = me.name; attach(); return; }
    } catch { /* not in this room any more */ }
  }
  render();
  (code ? $('#name') : $('#code')).focus();
})();
