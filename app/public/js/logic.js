// Pure game rules shared by the teacher screen, the student screen, the fake class and the tests.
// No Firebase, no DOM: everything here can run in Node.

export const LETTERS = ['A', 'B', 'C', 'D'];

// Phases of the room, in the order a question goes through them.
export const PHASE = {
  LOBBY: 'lobby', // students are joining
  SHOW: 'show', // question on screen, clock not started, answers not accepted
  OPEN: 'open', // vote clock running, students vote
  PAUSED: 'paused', // vote clock frozen, votes still accepted
  DECIDE: 'decide', // vote locked, the player looks at the shares, may use lifelines, picks and locks
  CLOSED: 'closed', // the player locked an answer; after the drumroll the key appears
  END: 'end', // closing screen
};

// Answers whose option was removed by 50:50 do not count: the student has to choose again.
export function countAnswers(answers, removed = null, n = 4) {
  const counts = Array(n).fill(0);
  for (const a of Object.values(answers || {})) {
    if (!a || !Number.isInteger(a.choice) || a.choice < 0 || a.choice >= n) continue;
    if (removed && removed[a.choice]) continue;
    counts[a.choice]++;
  }
  return counts;
}

// Largest-remainder rounding: the four shown percentages always add up to exactly 100
// (plain rounding can show 33 + 33 + 33 = 99 and the class notices).
export function percentages(counts) {
  const total = counts.reduce((s, c) => s + c, 0);
  if (!total) return counts.map(() => 0);
  const raw = counts.map((c) => (c * 100) / total);
  const out = raw.map(Math.floor);
  let left = 100 - out.reduce((s, x) => s + x, 0);
  const order = raw.map((r, i) => [r - out[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (const [, i] of order) {
    if (left <= 0) break;
    out[i]++;
    left--;
  }
  return out;
}

// 50:50 removes two wrong options at random, never the key.
export function pickFifty(correct, rng = Math.random, n = 4) {
  const wrong = [...Array(n).keys()].filter((i) => i !== correct);
  for (let i = wrong.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [wrong[i], wrong[j]] = [wrong[j], wrong[i]];
  }
  return wrong.slice(0, 2).sort((a, b) => a - b);
}

// Time left on the clock, from the room state and the server clock.
export function remainingMs(state, serverNow) {
  if (!state) return 0;
  if (state.phase === PHASE.OPEN && state.endsAt) return Math.max(0, state.endsAt - serverNow);
  if (state.phase === PHASE.PAUSED) return Math.max(0, state.remainingMs || 0);
  if (state.phase === PHASE.SHOW) return state.durationMs || 0;
  return 0;
}

// Random 4-digit room code (1000–9999).
export function newRoomCode(rng = Math.random) {
  return String(1000 + Math.floor(rng() * 9000));
}

// A loaded question set must have what the screens rely on; returns a list of problems (empty = valid).
export function validateBank(bank) {
  const errs = [];
  if (!bank || !Array.isArray(bank.questions) || !bank.questions.length) return ['Bộ câu không có câu nào.'];
  bank.questions.forEach((q, i) => {
    const n = i + 1;
    if (!q.text) errs.push(`Câu ${n}: thiếu đề.`);
    if (!Array.isArray(q.options) || q.options.length !== 4) errs.push(`Câu ${n}: cần đúng 4 phương án.`);
    if (!Number.isInteger(q.answer) || q.answer < 0 || q.answer > 3) errs.push(`Câu ${n}: đáp án phải là 0–3.`);
    if (!(q.seconds > 0)) errs.push(`Câu ${n}: thiếu số giây.`);
    for (const k of ['note', 'explain', 'source']) if (q[k] != null && typeof q[k] !== 'string') errs.push(`Câu ${n}: ${k} phải là chữ.`);
  });
  if (bank.outro != null && (typeof bank.outro !== 'object' || !bank.outro.title)) errs.push('Màn bài mới (outro) cần có title.');
  return errs;
}
