// Teacher screen (projector). One player in front of the room; the students vote on their phones.
// Each question: the vote runs on the clock with live shares; when the clock ends the vote locks, the player
// looks at the shares, may use 50:50 or Tổ tư vấn, picks an option (click or A–D) and presses "Chốt đáp án"
// (or Enter). Only then the studio dims for a drumroll and the key appears. The key never leaves this browser before.
import {
  browserSessionPersistence, ref, set, update, get, onValue, serverTimestamp, QRCode,
} from '../vendor/vendor.js';
import { connect, serverClock, $, setRich, esc, show, IS_LOCAL, watchConnection, keepAwake, signIn, retry } from './common.js';
import {
  LETTERS, PHASE, countAnswers, percentages, pickFifty, remainingMs, newRoomCode, validateBank, prizes, money, TOP_PRIZE,
} from './logic.js';
import { sfx, toggle as toggleSound, isOn as soundOn, useSoundFiles, countdown, setUrgent } from './sound.js';
// The one question set of the game (official, verbatim from the author's document); bundled into the page.
import QUESTIONS from '../../bo_cau/cap_so_cong.json';
import { applyTheme } from './theme.js';

const { auth, db } = connect('host', browserSessionPersistence);
const now = serverClock(db);
watchConnection(db, $('#netBanner'));
keepAwake();
const ROOM_KEY = 'lop3cau.host.room';
const RING = 2 * Math.PI * 52;
const REVEAL_DELAY_MS = 1600; // dim + drumroll between "time is up" and the key
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ICON_SOUND_ON = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM16 8.5a5 5 0 0 1 0 7l-1.2-1.2a3.3 3.3 0 0 0 0-4.6zM18.6 6a8.5 8.5 0 0 1 0 12l-1.2-1.2a6.8 6.8 0 0 0 0-9.6z"/></svg>';
const ICON_SOUND_OFF = '<svg viewBox="0 0 24 24"><path d="M4 9h4l5-4v14l-5-4H4zM16.3 9.1l1.2-1.2 2.1 2.1 2.1-2.1 1.2 1.2-2.1 2.1 2.1 2.1-1.2 1.2-2.1-2.1-2.1 2.1-1.2-1.2 2.1-2.1z"/></svg>';

let bank = null;
let code = null;
let state = null;
let players = {};
let answers = {};
let lifelines = {};
let finalData = null;
let answersQ = null;
let stopAnswers = null;
let renderedQ = null;
let lastTick = null;
let revealing = false;
const published = new Set(); // questions whose key is on the server
const voted = new Set(); // questions whose final vote counts are on the server
const subs = [];
const chipOf = new Map(); // uid -> chip (players arrive in key order, not join order)

const roomRef = (p = '') => ref(db, `rooms/${code}${p ? `/${p}` : ''}`);
const Q = () => (state && bank ? bank.questions[state.q] : null);
const phaseIn = (...ps) => !!state && ps.includes(state.phase);

// ---------- question set ----------
// Test scripts on localhost (tool/robust, layout, perf) may swap in a short set via localStorage; the real site
// only ever plays QUESTIONS.
function showBank() {
  let set = QUESTIONS;
  const test = IS_LOCAL && localStorage.getItem('lop3cau.test.bank');
  if (test) { try { set = JSON.parse(test); } catch { set = QUESTIONS; } }
  const errs = validateBank(set);
  $('#bankErr').textContent = errs.join('\n');
  if (errs.length) return;
  bank = set;
  $('#bankTitle').textContent = bank.topic;
  $('#bCreate').disabled = false;
}

// ---------- room ----------
async function createRoom() {
  $('#bCreate').disabled = true;
  for (let t = 0; t < 25; t++) {
    const c = newRoomCode();
    try {
      await set(ref(db, `rooms/${c}`), {
        host: auth.currentUser.uid,
        createdAt: serverTimestamp(),
        meta: { title: bank.title || '', topic: bank.topic || '', total: bank.questions.length },
        state: { phase: PHASE.LOBBY },
      });
      code = c;
      sessionStorage.setItem(ROOM_KEY, c);
      attach();
      return;
    } catch (e) {
      if (!/permission/i.test(String(e?.message))) { $('#bankErr').textContent = `Không tạo được phòng: ${e.message}`; break; }
    }
  }
  if (!code && !$('#bankErr').textContent) $('#bankErr').textContent = 'Chưa tạo được phòng. Kiểm tra mạng rồi bấm lại.';
  $('#bCreate').disabled = false;
}

function attach() {
  subs.push(onValue(roomRef('state'), (s) => { state = s.val(); onState(); render(); }));
  subs.push(onValue(roomRef('players'), (s) => { players = s.val() || {}; renderPlayers(); }));
  subs.push(onValue(roomRef('lifelines'), (s) => { lifelines = s.val() || {}; render(); }));
  subs.push(onValue(roomRef('final'), (s) => { finalData = s.val(); render(); }));
  const url = new URL(`play.html?room=${code}`, location.href).href;
  $('#joinUrl').textContent = url;
  $('#bigCode').textContent = code;
  $('#roomCode').textContent = code;
  QRCode.toDataURL(url, { margin: 1, width: 420, color: { dark: '#06103a', light: '#ffffff' } }).then((d) => { $('#qr').src = d; });
  render();
}

function leaveRoom() {
  if (!confirm('Kết thúc phòng này và tạo phòng mới?')) return;
  subs.splice(0).forEach((u) => u());
  stopAnswers?.();
  sessionStorage.removeItem(ROOM_KEY);
  code = null; state = null; players = {}; answers = {}; lifelines = {}; finalData = null;
  answersQ = null; renderedQ = null; published.clear(); voted.clear();
  chipOf.clear(); $('#names').innerHTML = '';
  $('#bCreate').disabled = !bank;
  render();
}

function onState() {
  const q = state?.q;
  ensurePublished();
  if (q !== answersQ) {
    stopAnswers?.();
    answers = {};
    answersQ = q;
    stopAnswers = Number.isInteger(q) && q >= 0
      ? onValue(roomRef(`answers/${q}`), (s) => { answers = s.val() || {}; renderCounts(); })
      : null;
  }
}

// ---------- actions ----------
// Teacher actions run one after another, never dropped: a fast second press waits for the first to finish
// (each action re-checks the phase itself, so a repeated press is a no-op).
let chain = Promise.resolve();
function act(fn) {
  if (!code) return chain;
  document.activeElement?.blur?.(); // so Space never also "clicks" the last pressed button
  chain = chain.then(async () => {
    try { await fn(); } catch (e) { console.error(e); alert(`Không thực hiện được: ${e.message}`); } finally { render(); }
  });
  return chain;
}

// A question appears and the vote clock starts at the same moment.
function startQuestion(i) {
  const q = bank.questions[i];
  const ms = q.seconds * 1000;
  sfx.start();
  return update(roomRef(), {
    [`questions/${i}`]: { text: q.text, options: q.options, note: q.note || '', seconds: q.seconds, openedAt: serverTimestamp() },
    state: { phase: PHASE.OPEN, q: i, durationMs: ms, endsAt: now() + ms },
  });
}

function pausePatch() {
  return { 'state/phase': PHASE.PAUSED, 'state/remainingMs': remainingMs(state, now()), 'state/endsAt': null };
}

function togglePause() {
  if (phaseIn(PHASE.OPEN)) { sfx.pause(); return update(roomRef(), pausePatch()); }
  if (phaseIn(PHASE.PAUSED)) {
    sfx.start();
    return update(roomRef(), { 'state/phase': PHASE.OPEN, 'state/endsAt': now() + remainingMs(state, now()), 'state/remainingMs': null });
  }
  return null;
}

// The vote clock ran out: lock the vote (the server then refuses any further vote), then publish the final
// counts, read after the lock so they are complete. The player now decides, with no clock.
async function endVote() {
  if (!phaseIn(PHASE.OPEN)) return;
  const q = state.q;
  sfx.lock();
  await update(roomRef('state'), { phase: PHASE.DECIDE, endsAt: null, remainingMs: 0 });
  await publishVotes(q);
}

async function publishVotes(q) {
  const final = (await get(roomRef(`answers/${q}`))).val() || {};
  if (state?.q === q) answers = final;
  await set(roomRef(`results/${q}`), { counts: countAnswers(final, null) });
  voted.add(q);
}

// The player picks an option, also while the vote is still running (pressing it again keeps it); only
// "Chốt đáp án" / Enter locks it, and only once the vote has ended.
function pick(i) {
  if (!phaseIn(PHASE.OPEN, PHASE.PAUSED, PHASE.DECIDE) || state.removed?.[i] || state.pick === i) return null;
  sfx.tick(false);
  return update(roomRef('state'), { pick: i, advisor: null });
}
function lockPick() { return Number.isInteger(state?.pick) ? lockAnswer(state.pick) : null; }

// Lock, dim the studio for a drumroll, then publish the key.
async function lockAnswer(choice) {
  if (!phaseIn(PHASE.DECIDE) || state.removed?.[choice]) return;
  const q = state.q;
  sfx.lock();
  await update(roomRef(), { 'state/phase': PHASE.CLOSED, 'state/pick': null, 'state/advisor': null, 'state/final': choice, [`questions/${q}/final`]: choice });
  document.body.classList.add('suspense');
  sfx.drumroll(REVEAL_DELAY_MS / 1000);
  await sleep(REVEAL_DELAY_MS);
  await publishKey(q);
}

async function publishKey(q) {
  try {
    await set(roomRef(`keys/${q}`), bank.questions[q].answer);
    published.add(q);
    if (state?.final === bank.questions[q].answer) sfx.correct(); else sfx.wrong();
  } finally {
    document.body.classList.remove('suspense');
  }
}

// Recovery (reload in the middle, or a failed write on bad Wi-Fi): a locked vote without counts, or a locked
// answer without the key, gets published; retried from the clock loop every 2 s, without an alert.
let lastEnsure = 0;
function ensurePublished() {
  const q = state?.q;
  if (!Number.isInteger(q) || revealing || !bank) return;
  const needVotes = (phaseIn(PHASE.DECIDE) || phaseIn(PHASE.CLOSED)) && !voted.has(q);
  const needKey = phaseIn(PHASE.CLOSED) && !published.has(q);
  if (!needVotes && !needKey) return;
  if (Date.now() - lastEnsure < 2000) return;
  lastEnsure = Date.now();
  revealing = true;
  chain = chain.then(async () => {
    try {
      if (needVotes) { if ((await get(roomRef(`results/${q}`))).exists()) voted.add(q); else await publishVotes(q); }
      if (needKey) { if ((await get(roomRef(`keys/${q}`))).val() == null) await publishKey(q); else published.add(q); }
    } catch { /* next try in 2 s */ }
  }).then(() => { revealing = false; render(); });
}

function fifty() {
  if (lifelines.fifty === state.q || !phaseIn(PHASE.DECIDE)) return null; // once per question, again in every question
  const [a, b] = pickFifty(Q().answer);
  sfx.fifty();
  const patch = { 'state/removed': { [a]: true, [b]: true }, 'lifelines/fifty': state.q };
  if (state.pick === a || state.pick === b) patch['state/pick'] = null;
  return update(roomRef(), patch);
}

// Tổ tư vấn talks in the room; the screen only shows the banner until the player picks.
function advisor() {
  if (lifelines.tuvan === state.q || !phaseIn(PHASE.DECIDE)) return null;
  sfx.advisor();
  return update(roomRef(), { 'state/advisor': true, 'lifelines/tuvan': state.q });
}

// After the last question: the lead-in to the next lesson if the set has one (bridge screen, then the title),
// otherwise a closing screen with each question's key.
async function finish() {
  const total = bank.questions.length;
  sfx.final();
  await update(roomRef(), {
    keys: { ...bank.questions.map((q) => q.answer) },
    final: { rows: bank.questions.map((q) => ({ key: q.answer, text: q.options[q.answer] })), total },
    outro: bank.outro || null,
    state: { phase: PHASE.END, q: total - 1, outro: -1 }, // -1: the congratulations screen, then the lead-in (0, 1)
  });
}

function next() {
  if (phaseIn(PHASE.LOBBY)) return startQuestion(0);
  if (phaseIn(PHASE.END) && state.outro === -1 && bank.outro) return update(roomRef('state'), { outro: 0 });
  if (phaseIn(PHASE.END) && state.outro === 0) return update(roomRef('state'), { outro: 1 });
  if (!phaseIn(PHASE.CLOSED) || !published.has(state.q)) return null;
  return state.q + 1 < bank.questions.length ? startQuestion(state.q + 1) : finish();
}

let fakeBusy = false;
async function addFake() {
  if (fakeBusy || !code) return;
  fakeBusy = true;
  const btn = $('#bFake');
  try {
    const { addFakeClass } = await import('./lop_ao.js');
    await addFakeClass({ code, bank, n: 30, onProgress: (k) => { btn.textContent = `Đang thêm ${k}/30…`; } });
  } catch (e) { alert(`Lớp ảo lỗi: ${e.message}`); }
  btn.textContent = 'Thêm 30 học sinh ảo';
  fakeBusy = false;
}

// ---------- rendering ----------
const GAME = [PHASE.OPEN, PHASE.PAUSED, PHASE.DECIDE, PHASE.CLOSED];
function render() {
  const phase = code ? state?.phase : null;
  show($('#setup'), !code);
  show($('#lobby'), phase === PHASE.LOBBY);
  show($('#game'), GAME.includes(phase));
  show($('#final'), phase === PHASE.END);
  show($('#controls'), !!code);
  show($('#roomPill'), !!code);
  show($('#bFake'), IS_LOCAL && !!code && phase !== PHASE.END);
  $('#topic').textContent = bank?.topic || '';
  if (GAME.includes(phase)) renderQuestion();
  if (phase === PHASE.END) renderFinal();
  renderControls();
  renderCounts();
}

const onlineCount = () => Object.values(players).filter((p) => p.online !== false).length;
function renderPlayers() {
  const entries = Object.entries(players);
  const n = onlineCount();
  $('#playerCount').textContent = n;
  $('#lobbyCount').textContent = n ? `${n} học sinh đang trong phòng` : 'Chưa có học sinh nào vào phòng';
  const box = $('#names');
  for (const [uid, p] of entries) {
    if (chipOf.has(uid)) continue;
    const s = document.createElement('span');
    s.className = 'chip';
    s.textContent = p.name;
    box.append(s);
    chipOf.set(uid, s);
  }
  for (const [uid, chip] of chipOf) {
    if (!players[uid]) { chip.remove(); chipOf.delete(uid); } else chip.classList.toggle('away', players[uid].online === false);
  }
  renderCounts();
}

function renderQuestion() {
  const q = Q();
  if (!q) return;
  if (renderedQ !== state.q) {
    renderedQ = state.q;
    $('#qLevel').textContent = `CÂU ${state.q + 1}/${bank.questions.length}`;
    setRich($('#qText'), q.text);
    setRich($('#qNote'), q.note || '');
    show($('#qNote'), !!q.note);
    const box = $('#answers');
    box.innerHTML = '';
    q.options.forEach((opt, i) => {
      const d = document.createElement('button');
      d.type = 'button';
      d.className = 'ans';
      d.addEventListener('click', () => act(() => pick(i)));
      d.innerHTML = `<div class="fill"></div><span class="letter">${LETTERS[i]}</span><span class="txt"></span><span class="pct"></span>`;
      setRich(d.querySelector('.txt'), opt);
      box.append(d);
    });
    requestAnimationFrame(fitQuestion);
    document.fonts?.ready.then(() => requestAnimationFrame(fitQuestion));
    setTimeout(fitQuestion, 400);
    const pz = prizes(bank.questions.length);
    $('#ladder').innerHTML = pz.map((v, i) => `<li><span class="n">${i + 1}</span><span class="dot">◆</span>${money(v)}</li>`).join('');
  }
  const removed = state.removed || null;
  const revealed = phaseIn(PHASE.CLOSED) && published.has(state.q);
  const counts = countAnswers(answers, null);
  const pct = counts.some((c) => c > 0) ? percentages(counts) : null; // the vote, live from the first vote
  const deciding = phaseIn(PHASE.DECIDE);
  const picking = phaseIn(PHASE.OPEN, PHASE.PAUSED, PHASE.DECIDE);
  const final = phaseIn(PHASE.CLOSED) ? state.final : null;
  [...$('#answers').children].forEach((d, i) => {
    d.disabled = !picking || !!removed?.[i];
    d.classList.toggle('removed', !!removed?.[i]);
    d.classList.toggle('pick', picking && state.pick === i);
    d.classList.toggle('chosen', Number.isInteger(final) && final === i && !(revealed && i === q.answer));
    d.classList.toggle('correct', revealed && i === q.answer);
    d.classList.toggle('wrong-mine', revealed && final === i && i !== q.answer);
    d.querySelector('.fill').style.transform = `scaleX(${pct && !removed?.[i] ? pct[i] / 100 : 0})`;
    d.querySelector('.pct').textContent = pct && !removed?.[i] ? `${pct[i]}%` : '';
  });
  [...$('#ladder').children].forEach((li, i) => {
    li.classList.toggle('now', i === state.q);
    li.classList.toggle('past', i < state.q);
  });
  const banner = $('#banner');
  let text = '';
  if (phaseIn(PHASE.PAUSED)) text = 'TẠM DỪNG';
  else if (deciding) text = state.advisor ? 'TỔ TƯ VẤN ĐANG TRỢ GIÚP' : 'HẾT GIỜ BÌNH CHỌN';
  banner.textContent = text;
  show(banner, !!text);
  const ll50 = $('#ll50');
  const llTv = $('#llTv');
  const used50 = lifelines.fifty === state.q; // a lifeline is spent only for the current question
  const usedTv = lifelines.tuvan === state.q;
  ll50.classList.toggle('used', used50);
  llTv.classList.toggle('used', usedTv);
  ll50.disabled = used50 || !deciding;
  llTv.disabled = usedTv || !deciding;
}

function renderCounts() {
  if (!code || !state || !Number.isInteger(state.q) || !Q()) { $('#answered').textContent = ''; return; }
  const votes = countAnswers(answers, null).reduce((s, c) => s + c, 0);
  const revealed = phaseIn(PHASE.CLOSED) && published.has(state.q);
  let line = `Đã bình chọn <b>${votes}</b>/${onlineCount()}`;
  if (phaseIn(PHASE.DECIDE)) line = `<b>${votes}</b> phiếu bình chọn`;
  if (revealed) line = state.final === Q().answer ? '<b class="ok">Chính xác!</b>' : '<b class="no">Chưa chính xác</b>';
  $('#answered').innerHTML = line;
  renderQuestion();
}

// Runs every 100 ms for the logic (ticks, auto reveal) but touches the page only when what it shows changes:
// the ring moves in 250 ms steps and a CSS transition smooths it.
const clockShown = { offset: null, sec: null, low: null };
function setIf(key, value, apply) { if (clockShown[key] !== value) { clockShown[key] = value; apply(value); } }
function renderClock() {
  if (!state || !bank || !Q()) return;
  ensurePublished();
  const ms = remainingMs(state, now());
  const total = state.durationMs || Q().seconds * 1000;
  const closed = phaseIn(PHASE.DECIDE, PHASE.CLOSED);
  const frac = closed ? 0 : Math.max(0, Math.min(1, Math.ceil(ms / 250) * 250 / total));
  const sec = closed ? 0 : Math.ceil(ms / 1000);
  setIf('offset', (RING * (1 - frac)).toFixed(1), (v) => { $('#ring').style.strokeDashoffset = v; });
  setIf('sec', sec, (v) => { $('#secs').textContent = String(v); });
  setIf('low', !closed && sec <= 5, (v) => { $('#timer').classList.toggle('low', v); });
  if (phaseIn(PHASE.OPEN)) {
    setUrgent(sec <= 10);
    if (sec !== lastTick) { lastTick = sec; if (sec > 0 && sec <= 5) sfx.tick(sec <= 3); }
    if (ms <= 0 && !revealing) { revealing = true; act(endVote).then(() => { revealing = false; }); }
  }
}

function renderControls() {
  const p = $('#bPause');
  show(p, GAME.includes(state?.phase));
  p.disabled = !phaseIn(PHASE.OPEN, PHASE.PAUSED);
  p.firstChild.textContent = phaseIn(PHASE.PAUSED) ? 'Tiếp tục' : 'Tạm dừng';
  const lk = $('#bLock');
  show(lk, GAME.includes(state?.phase));
  lk.disabled = !(phaseIn(PHASE.DECIDE) && Number.isInteger(state?.pick));
  lk.classList.toggle('primary', !lk.disabled);
  const n = $('#bNext');
  const lead = phaseIn(PHASE.END) && (state.outro === 0 || (state.outro === -1 && !!bank?.outro));
  show(n, !phaseIn(PHASE.END) || lead);
  document.querySelectorAll('.controls .sep').forEach((x) => show(x, !phaseIn(PHASE.END)));
  n.disabled = !(phaseIn(PHASE.LOBBY) || lead || (phaseIn(PHASE.CLOSED) && published.has(state.q)));
  const last = bank && state && state.q + 1 >= bank.questions.length;
  n.firstChild.textContent = phaseIn(PHASE.LOBBY) ? 'Bắt đầu' : lead ? (state.outro === 0 ? 'Bài mới' : 'Tiếp') : last ? 'Kết thúc' : 'Câu tiếp';
  $('#soundBtn').innerHTML = soundOn() ? ICON_SOUND_ON : ICON_SOUND_OFF;
  countdown(phaseIn(PHASE.OPEN));
}

function renderFinal() {
  if (!finalData) return;
  const o = Number.isInteger(state?.outro) && state.outro >= 0 ? bank?.outro : null;
  const box = $('#board');
  show($('#outroSeq'), !!o && state.outro === 0);
  show(box, !o);
  $('#finalTitle').classList.toggle('big', !!o && state.outro === 1);
  $('#finalStats').classList.toggle('big', !!o && state.outro === 0);
  show($('#trophy'), !o);
  if (o && state.outro === 0) {
    $('#finalSmall').textContent = 'CÂU HỎI MỞ';
    setRich($('#outroSeq'), `\\[${o.sequence || ''}\\]`);
    $('#finalTitle').textContent = '';
    setRich($('#finalStats'), o.question || '');
    return;
  }
  if (o && state.outro === 1) {
    $('#finalSmall').textContent = 'AI LÀ TRIỆU PHÚ TOÁN HỌC';
    $('#finalTitle').textContent = o.title;
    $('#finalStats').textContent = '';
    return;
  }
  $('#finalSmall').textContent = 'CHÚC MỪNG BẠN ĐÃ TRỞ THÀNH';
  $('#finalTitle').textContent = 'TRIỆU PHÚ TOÁN HỌC';
  $('#finalStats').innerHTML = `<span class="prize">${money(TOP_PRIZE)}đ</span>`;
  box.innerHTML = '';
  (finalData.rows || []).forEach((r, i) => {
    const li = document.createElement('li');
    li.style.animationDelay = `${i * 0.12}s`;
    li.innerHTML = `<span>Câu ${i + 1} · Đáp án ${LETTERS[r.key]}:</span><span class="t"></span>`;
    setRich(li.querySelector('.t'), r.text || '');
    box.append(li);
  });
}

// ---------- wiring ----------
$('#bCreate').addEventListener('click', createRoom);
$('#bPause').addEventListener('click', () => act(togglePause));
$('#bNext').addEventListener('click', () => act(next));
$('#bLock').addEventListener('click', () => act(lockPick));
$('#ll50').addEventListener('click', () => act(fifty));
$('#llTv').addEventListener('click', () => act(advisor));
$('#bFake').addEventListener('click', addFake);
$('#bNew').addEventListener('click', leaveRoom);
$('#soundBtn').addEventListener('click', () => { toggleSound(); renderControls(); });
$('#fsBtn').addEventListener('click', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  else document.documentElement.requestFullscreen?.().catch(() => {});
});

// Long questions: shrink question and answers together until the column's content fits its height.
// (Measured as the sum of the children, because a centred flex column hides overflow at the top.)
function fitQuestion() {
  const col = $('.main-col');
  if (!col || $('#game').hidden) return;
  const kids = [...col.children];
  const gap = parseFloat(getComputedStyle(col).rowGap) || 0;
  const need = () => kids.reduce((sum, k) => sum + k.getBoundingClientRect().height, 0) + gap * (kids.length - 1);
  let f = 1;
  col.style.setProperty('--fit', '1');
  while (need() > col.clientHeight && f > 0.45) { f -= 0.05; col.style.setProperty('--fit', f.toFixed(2)); }
}
window.addEventListener('resize', () => requestAnimationFrame(fitQuestion));

const KEYS = {
  ' ': togglePause, n: next, f: fifty, t: advisor, enter: lockPick,
  a: () => pick(0), b: () => pick(1), c: () => pick(2), d: () => pick(3),
};
document.addEventListener('keydown', (e) => {
  if (e.repeat || e.target?.closest?.('input, textarea') || e.ctrlKey || e.metaKey || e.altKey) return;
  const fn = KEYS[e.key.toLowerCase()];
  if (!fn || !code) return;
  e.preventDefault();
  act(fn);
});

setInterval(renderClock, 100);

(async () => {
  const theme = await applyTheme();
  useSoundFiles(theme.sounds);
  // Only shown when theme.json has a mistake in it.
  $('#themeInfo').textContent = theme.errors.join(' ');
  show($('#themeInfo'), theme.errors.length > 0);
  render();
  await signIn(auth); // kept for this tab (session persistence), so a reload keeps the room
  const saved = sessionStorage.getItem(ROOM_KEY);
  if (saved) {
    let h;
    try { h = (await retry(() => get(ref(db, `rooms/${saved}/host`)))).val(); } catch { h = undefined; }
    if (h === auth.currentUser.uid) {
      showBank();
      code = saved;
      attach();
      return;
    }
    if (h !== undefined) sessionStorage.removeItem(ROOM_KEY);
    else $('#bankErr').textContent = 'Chưa kết nối lại được phòng đang chơi. Kiểm tra mạng rồi tải lại trang.';
  }
  showBank();
  render();
})();
