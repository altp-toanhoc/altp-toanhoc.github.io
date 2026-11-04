// Short sound effects synthesized with Web Audio (no recorded music, nothing taken from any TV programme).
// Only the teacher screen plays sound; browsers allow it after the first click on the page.
let ctx = null;
let on = localStorage.getItem('lop3cau.sound') !== 'off';
let files = {}; // slot -> url, from the theme (theme.js SOUND_SLOTS)
let loop = null;

export function useSoundFiles(map) { files = map || {}; }

// Plays the theme's file for this slot if there is one; returns true when a file exists (even if muted),
// so the synthesized effect is skipped.
function file(slot) {
  if (!files[slot]) return false;
  if (on) new Audio(files[slot]).play().catch(() => {});
  return true;
}

// Music while the clock runs: the theme's looping file if there is one, otherwise a quiet synthesized
// bass ostinato that doubles its pace in the last 10 seconds.
let musicTimer = null;
let beat = 0;
let urgent = false;
const BASS = [110, 110, 130.81, 123.47];
function musicStep() {
  tone(BASS[beat % 4], 0.2, { type: 'triangle', vol: 0.11 });
  if (beat % 2) tone(2600, 0.025, { type: 'square', vol: 0.012 });
  beat++;
}
function startMusicTimer() { musicTimer = setInterval(musicStep, urgent ? 250 : 500); }
export function countdown(running) {
  const play = running && on;
  if (files.countdown) {
    if (play && !loop) { loop = new Audio(files.countdown); loop.loop = true; loop.play().catch(() => {}); }
    if (!play && loop) { loop.pause(); loop = null; }
    return;
  }
  if (play && !musicTimer) { beat = 0; startMusicTimer(); }
  if (!play && musicTimer) { clearInterval(musicTimer); musicTimer = null; }
}
export function setUrgent(u) {
  if (u === urgent) return;
  urgent = u;
  if (musicTimer) { clearInterval(musicTimer); startMusicTimer(); }
}

export const isOn = () => on;
export function toggle() {
  on = !on;
  localStorage.setItem('lop3cau.sound', on ? 'on' : 'off');
  if (!on) countdown(false);
  return on;
}

function audio() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, { type = 'sine', vol = 0.18, at = 0, to = null } = {}) {
  if (!on) return;
  const a = audio();
  const t = a.currentTime + at;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (to) o.frequency.exponentialRampToValueAtTime(to, t + dur);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + dur + 0.02);
}

export const sfx = {
  question() { tone(392, 0.25, { type: 'triangle' }); tone(587, 0.4, { type: 'triangle', at: 0.18 }); },
  start() { if (file('start')) return; tone(220, 0.5, { type: 'sawtooth', vol: 0.08, to: 440 }); },
  tick(last) { if (file('tick')) return; tone(last ? 1046 : 784, 0.07, { type: 'square', vol: last ? 0.09 : 0.05 }); },
  pause() { if (file('pause')) return; tone(523, 0.18, { type: 'triangle' }); tone(392, 0.3, { type: 'triangle', at: 0.15 }); },
  lock() { if (file('timeUp')) return; tone(110, 0.6, { type: 'sawtooth', vol: 0.12, to: 70 }); tone(220, 0.4, { type: 'triangle', vol: 0.1 }); },
  fifty() { if (file('fifty')) return; tone(1200, 0.35, { type: 'sine', vol: 0.1, to: 300 }); tone(900, 0.35, { type: 'sine', vol: 0.08, at: 0.12, to: 200 }); },
  advisor() { if (file('advisor')) return; [330, 415, 494].forEach((f, i) => tone(f, 0.3, { type: 'triangle', at: i * 0.12 })); },
  percent() { [262, 330, 392, 523].forEach((f, i) => tone(f, 0.18, { type: 'triangle', vol: 0.1, at: i * 0.07 })); },
  drumroll(secs = 1.6) {
    if (file('drumroll')) return;
    const n = Math.floor(secs / 0.045);
    for (let i = 0; i < n; i++) tone(70 + (i % 3) * 9, 0.06, { type: 'triangle', vol: 0.05 + 0.13 * (i / n), at: i * 0.045 });
  },
  correct() { if (file('correct')) return; [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.45, { type: 'triangle', at: i * 0.11 })); },
  wrong() { if (file('wrong')) return; [392, 330, 262].forEach((f, i) => tone(f, 0.35, { type: 'sawtooth', vol: 0.08, at: i * 0.18 })); },
  final() { if (file('final')) return;
    [392, 523, 659, 784, 659, 784, 1046].forEach((f, i) => tone(f, 0.5, { type: 'triangle', vol: 0.14, at: i * 0.16 }));
  },
};
