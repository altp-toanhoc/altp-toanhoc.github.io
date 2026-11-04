// Firebase connection and small helpers shared by the teacher and student screens.
import {
  initializeApp, initializeAuth, connectAuthEmulator, getDatabase, connectDatabaseEmulator, ref, onValue, signInAnonymously,
} from '../vendor/vendor.js';

// On the real site this becomes the Firebase web config of the project (it is public by design;
// access is controlled by database.rules.json, not by hiding this object).
export const FIREBASE_CONFIG = {
  apiKey: 'demo-key',
  authDomain: 'demo-trangrua.firebaseapp.com',
  projectId: 'demo-trangrua',
  databaseURL: 'https://demo-trangrua-default-rtdb.firebaseio.com',
};

// Test build: the page and the emulators share one origin through tool/serve.mjs.
export const IS_LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname);

let appCount = 0;
export function connect(name, persistence) {
  const app = initializeApp(FIREBASE_CONFIG, `${name}-${appCount++}`);
  const auth = initializeAuth(app, { persistence });
  const db = getDatabase(app);
  if (IS_LOCAL) {
    connectAuthEmulator(auth, location.origin, { disableWarnings: true });
    connectDatabaseEmulator(db, location.hostname, Number(location.port) || 80);
  }
  return { app, auth, db };
}

// Server clock (ms). The countdown and the "time is up" rule both use it, so every screen agrees.
export function serverClock(db) {
  let offset = 0;
  onValue(ref(db, '.info/serverTimeOffset'), (s) => { offset = s.val() || 0; });
  return () => Date.now() + offset;
}

export const $ = (sel, root = document) => root.querySelector(sel);

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// Question text: **bold** and LaTeX in $…$, \(…\) or \[…\] (display), rendered by KaTeX auto-render.
export function setRich(el, text) {
  // One inline wrapper, so flex/grid containers never split the sentence and its formulas into separate rows.
  el.innerHTML = `<span class="rich">${esc(text).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')}</span>`;
  if (window.renderMathInElement) {
    window.renderMathInElement(el, {
      delimiters: [{ left: '\\[', right: '\\]', display: true }, { left: '\\(', right: '\\)', display: false }, { left: '$', right: '$', display: false }],
      throwOnError: false,
    });
  }
}

export function show(el, on) { el.hidden = !on; }

// Shows the "lost connection" banner when the database link drops for more than 1.5 s
// (the database queues writes and resyncs by itself once the link is back).
export function watchConnection(db, el) {
  let timer = null;
  let seen = false;
  onValue(ref(db, '.info/connected'), (s) => {
    clearTimeout(timer);
    if (s.val()) { seen = true; el.hidden = true; return; }
    timer = setTimeout(() => { el.textContent = seen ? 'MẤT KẾT NỐI · ĐANG KẾT NỐI LẠI…' : 'ĐANG KẾT NỐI…'; el.hidden = false; }, 1500);
  });
}

// Keeps the screen awake while the page is visible (projector laptops and phones dim after a minute).
export function keepAwake() {
  if (!navigator.wakeLock) return;
  let lock = null;
  const get = () => { if (document.visibilityState === 'visible' && !lock) navigator.wakeLock.request('screen').then((l) => { lock = l; l.addEventListener('release', () => { lock = null; }); }).catch(() => {}); };
  document.addEventListener('visibilitychange', get);
  get();
}

// Anonymous sign-in that keeps retrying (offline at page load, or a brief "too many requests"):
// 1 s, 2 s, 4 s … up to 10 s between tries. The connection banner tells the user meanwhile.
export async function signIn(auth) {
  for (let wait = 1000; ; wait = Math.min(wait * 2, 10000)) {
    try { await signInAnonymously(auth); return auth.currentUser; } catch { await new Promise((r) => setTimeout(r, wait)); }
  }
}

// Retries a read until it works (a flaky classroom network must not lose the room on reload).
export async function retry(fn, tries = 6) {
  let wait = 500;
  for (let i = 1; ; i++) {
    try { return await fn(); } catch (e) { if (i >= tries) throw e; await new Promise((r) => setTimeout(r, wait)); wait = Math.min(wait * 2, 5000); }
  }
}
