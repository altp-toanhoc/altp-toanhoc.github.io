// Access rules, checked against the running emulators (start them with `npm start`).
// Each test is something a student could try from the browser console to cheat or to break the game.
import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import { initializeApp, deleteApp } from 'firebase/app';
import { initializeAuth, inMemoryPersistence, connectAuthEmulator, signInAnonymously } from 'firebase/auth';
import { getDatabase, connectDatabaseEmulator, ref, set, update, get, serverTimestamp, goOffline } from 'firebase/database';
import { newRoomCode } from '../public/js/logic.js';

const CONFIG = {
  apiKey: 'demo-key', projectId: 'demo-trangrua',
  databaseURL: 'https://demo-trangrua-default-rtdb.firebaseio.com',
};
const apps = [];
let n = 0;
async function client() {
  const app = initializeApp(CONFIG, `t${Date.now()}-${n++}`);
  const auth = initializeAuth(app, { persistence: inMemoryPersistence });
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  const db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  await signInAnonymously(auth);
  apps.push({ app, db });
  return { db, uid: auth.currentUser.uid };
}
after(async () => {
  for (const { app, db } of apps) { goOffline(db); await deleteApp(app); }
  // Auth keeps a token-refresh timer alive after deleteApp; exit once the results are reported.
  setTimeout(() => process.exit(), 200).unref();
});

async function denied(p, what) {
  await assert.rejects(p, (e) => /permission/i.test(String(e?.message || e)), what);
}

async function newRoom() {
  const host = await client();
  for (;;) {
    const code = newRoomCode();
    try {
      await set(ref(host.db, `rooms/${code}`), { host: host.uid, createdAt: serverTimestamp(), meta: { title: 't', total: 3 }, state: { phase: 'lobby' } });
      return { host, code };
    } catch { /* code taken, try another */ }
  }
}
async function joined(code, name = 'An') {
  const s = await client();
  await set(ref(s.db, `rooms/${code}/players/${s.uid}`), { name });
  return s;
}
const answer = (s, code, q, choice) => set(ref(s.db, `rooms/${code}/answers/${q}/${s.uid}`), { choice, at: serverTimestamp() });

test('nobody can take over an existing room or invent a non 4-digit code', async () => {
  const { code } = await newRoom();
  const other = await client();
  await denied(set(ref(other.db, `rooms/${code}`), { host: other.uid, state: { phase: 'lobby' } }), 'overwrite room');
  await denied(set(ref(other.db, `rooms/abc`), { host: other.uid }), 'bad code');
  await denied(set(ref(other.db, `rooms/9999x`), { host: other.uid }), 'bad code 2');
});

test('only the teacher can drive the game (state, questions, keys, results)', async () => {
  const { host, code } = await newRoom();
  const s = await joined(code);
  for (const p of ['state/phase', 'questions/0', 'keys/0', 'results/0', 'lifelines/fifty', 'final']) {
    await denied(set(ref(s.db, `rooms/${code}/${p}`), 'x'), p);
  }
  await set(ref(host.db, `rooms/${code}/state/phase`), 'show');
});

test('a student cannot see the class list or other students\' answers', async () => {
  const { host, code } = await newRoom();
  const a = await joined(code, 'An');
  const b = await joined(code, 'Bình');
  await update(ref(host.db, `rooms/${code}`), { state: { phase: 'open', q: 0, endsAt: Date.now() + 60_000 } });
  await answer(a, code, 0, 1);
  await denied(get(ref(b.db, `rooms/${code}/players`)), 'players list');
  await denied(get(ref(b.db, `rooms/${code}/answers/0`)), 'answers of q0');
  await denied(get(ref(b.db, `rooms/${code}/answers/0/${a.uid}`)), 'answer of A');
  await denied(set(ref(b.db, `rooms/${code}/answers/0/${a.uid}`), { choice: 2, at: serverTimestamp() }), 'write A\'s answer');
  assert.equal((await get(ref(host.db, `rooms/${code}/answers/0/${a.uid}/choice`))).val(), 1);
  assert.equal(Object.keys((await get(ref(host.db, `rooms/${code}/players`))).val()).length, 2);
});

test('answers are accepted only while the clock runs or is paused, for the current question', async () => {
  const { host, code } = await newRoom();
  const s = await joined(code);
  const st = (v) => set(ref(host.db, `rooms/${code}/state`), v);
  await denied(answer(s, code, 0, 1), 'lobby');
  await st({ phase: 'show', q: 0, durationMs: 20_000 });
  await denied(answer(s, code, 0, 1), 'question shown, clock not started');
  await st({ phase: 'open', q: 0, endsAt: Date.now() + 20_000 });
  const pause = () => new Promise((r) => setTimeout(r, 300)); // rewrites are limited to one per 250 ms
  await answer(s, code, 0, 1);
  await pause();
  await answer(s, code, 0, 2); // changing your mind is allowed until time is up
  await denied(answer(s, code, 1, 1), 'another question');
  await st({ phase: 'paused', q: 0, remainingMs: 9_000 });
  await pause();
  await answer(s, code, 0, 3); // still allowed while Tổ tư vấn talks
  await st({ phase: 'open', q: 0, endsAt: Date.now() - 2_000 });
  await denied(answer(s, code, 0, 1), 'after the clock ran out');
  await st({ phase: 'closed', q: 0 });
  await denied(answer(s, code, 0, 1), 'locked');
});

test('options removed by 50:50 cannot be chosen', async () => {
  const { host, code } = await newRoom();
  const s = await joined(code);
  await set(ref(host.db, `rooms/${code}/state`), { phase: 'open', q: 0, endsAt: Date.now() + 20_000, removed: { 0: true, 2: true } });
  await denied(answer(s, code, 0, 0), 'removed A');
  await denied(answer(s, code, 0, 2), 'removed C');
  await answer(s, code, 0, 1);
});

test('answers must be a whole option number with the server time, and joining needs a short name', async () => {
  const { host, code } = await newRoom();
  const s = await joined(code);
  await set(ref(host.db, `rooms/${code}/state`), { phase: 'open', q: 0, endsAt: Date.now() + 20_000 });
  await denied(set(ref(s.db, `rooms/${code}/answers/0/${s.uid}`), { choice: 1, at: 1 }), 'fake time');
  await denied(answer(s, code, 0, 7), 'option 7');
  await denied(answer(s, code, 0, 1.5), 'option 1.5');
  const t = await client();
  await denied(set(ref(t.db, `rooms/${code}/players/${t.uid}`), { name: '' }), 'empty name');
  await denied(set(ref(t.db, `rooms/${code}/players/${t.uid}`), { name: 'x'.repeat(25) }), 'long name');
  await denied(answer(t, code, 0, 1), 'answer without joining');
});

test('the key is not on the server until the teacher reveals it', async () => {
  const { host, code } = await newRoom();
  const s = await joined(code);
  assert.equal((await get(ref(s.db, `rooms/${code}/keys/0`))).val(), null);
  await set(ref(host.db, `rooms/${code}/keys/0`), 1);
  assert.equal((await get(ref(s.db, `rooms/${code}/keys/0`))).val(), 1);
});

test('signed-out visitors read nothing', async () => {
  const { code } = await newRoom();
  const app = initializeApp(CONFIG, `anon-${Date.now()}`);
  const db = getDatabase(app);
  connectDatabaseEmulator(db, '127.0.0.1', 9000);
  apps.push({ app, db });
  await denied(get(ref(db, `rooms/${code}/state`)), 'state without auth');
  await denied(get(ref(db, 'rooms')), 'room list');
});

test('a student cannot pad a write with extra data or flood the teacher with rewrites', async () => {
  const { host, code } = await newRoom();
  const s = await joined(code);
  await denied(set(ref(s.db, `rooms/${code}/players/${s.uid}`), { name: 'An', junk: 'x'.repeat(1000) }), 'extra field on player');
  await set(ref(host.db, `rooms/${code}/state`), { phase: 'open', q: 0, endsAt: Date.now() + 20_000 });
  await denied(set(ref(s.db, `rooms/${code}/answers/0/${s.uid}`), { choice: 1, at: serverTimestamp(), junk: 1 }), 'extra field on answer');
  await answer(s, code, 0, 1);
  await denied(answer(s, code, 0, 2), 'second write within 250 ms');
  await new Promise((r) => setTimeout(r, 300));
  await answer(s, code, 0, 2);
  await set(ref(s.db, `rooms/${code}/players/${s.uid}/online`), true);
  await denied(set(ref(s.db, `rooms/${code}/players/${s.uid}/online`), 'yes'), 'online must be true/false');
});

test('a room younger than a day cannot be taken over, and createdAt must be the server time', async () => {
  const { code } = await newRoom();
  const other = await client();
  await denied(set(ref(other.db, `rooms/${code}`), { host: other.uid, createdAt: serverTimestamp(), state: { phase: 'lobby' } }), 'fresh room');
  const me = await client();
  await denied(set(ref(me.db, 'rooms/0001'), { host: me.uid, createdAt: 5, state: { phase: 'lobby' } }), 'fake createdAt');
});
