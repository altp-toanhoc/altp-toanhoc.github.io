// Test build only: a fake class of anonymous students that join and answer like a real class,
// so the teacher can see the % chart move without 30 phones. Loaded from the teacher screen on localhost.
import { signInAnonymously, inMemoryPersistence, ref, set, onValue, serverTimestamp } from '../vendor/vendor.js';
import { connect } from './common.js';
import { PHASE } from './logic.js';

const NAMES = ['An', 'Bình', 'Châu', 'Dũng', 'Giang', 'Hà', 'Hải', 'Hạnh', 'Hiếu', 'Hoa', 'Hùng', 'Huy', 'Khánh',
  'Khoa', 'Lan', 'Linh', 'Long', 'Mai', 'Minh', 'My', 'Nam', 'Ngọc', 'Nhung', 'Phúc', 'Phương', 'Quân', 'Quang',
  'Sơn', 'Thảo', 'Trang', 'Trung', 'Tú', 'Tuấn', 'Uyên', 'Vy'];

function weighted(weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * sum;
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i];
    if (weights[i] > 0 && r <= 0) return i;
  }
  return weights.findLastIndex((w) => w > 0);
}

class Bot {
  constructor({ db, uid, code, bank }) {
    Object.assign(this, { db, uid, code, bank });
    this.q = null;
    this.st = null;
    this.choice = null;
    this.timers = [];
    this.skill = Math.random(); // stronger students lean towards the key
    onValue(ref(db, `rooms/${code}/state`), (s) => this.onState(s.val()));
  }

  onState(st) {
    if (!st) return;
    this.st = st;
    if (st.q !== this.q) {
      this.clear();
      Object.assign(this, { q: st.q, choice: null, planned: false, saw50: false });
    }
    const q = this.bank.questions[st.q];
    if (!q) return;
    if (st.phase === PHASE.OPEN && !this.planned) {
      this.planned = true;
      const left = Math.max(2000, (st.endsAt || Date.now()) - Date.now());
      this.later(1200 + Math.random() * left * 0.8, () => this.answer(this.pick(q)));
    }
    if (st.removed && this.choice != null && st.removed[this.choice] && !this.saw50) {
      this.saw50 = true;
      this.later(800 + Math.random() * 4000, () => this.answer(this.pick(q)));
    }
    if ([PHASE.DECIDE, PHASE.CLOSED, PHASE.END].includes(st.phase)) this.clear();
  }

  pick(q) {
    const removed = this.st?.removed;
    const w = (q.demoSpread || [0.25, 0.25, 0.25, 0.25]).map((x, i) => (removed?.[i] ? 0 : x));
    w[q.answer] *= 0.6 + this.skill * 0.9;
    return weighted(w);
  }

  answer(choice) {
    this.choice = choice;
    set(ref(this.db, `rooms/${this.code}/answers/${this.q}/${this.uid}`), { choice, at: serverTimestamp() })
      .catch(() => { /* too late: a real student would miss it too */ });
  }

  later(ms, fn) { this.timers.push(setTimeout(fn, ms)); }

  clear() { this.timers.forEach(clearTimeout); this.timers = []; }
}

export async function addFakeClass({ code, bank, n = 30, onProgress }) {
  const offset = Math.floor(Math.random() * NAMES.length);
  for (let i = 0; i < n; i++) {
    const { auth, db } = connect('ao', inMemoryPersistence);
    await signInAnonymously(auth);
    const uid = auth.currentUser.uid;
    const base = NAMES[(offset + i) % NAMES.length];
    const name = i < NAMES.length ? base : `${base} ${Math.floor(i / NAMES.length) + 1}`;
    await set(ref(db, `rooms/${code}/players/${uid}`), { name, joinedAt: serverTimestamp(), online: true });
    new Bot({ db, uid, code, bank }); // eslint-disable-line no-new
    onProgress?.(i + 1);
  }
}
