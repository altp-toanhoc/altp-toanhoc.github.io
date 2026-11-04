// Rules of the game that everyone sees directly: the vote % on screen, 50:50, the clock.
import test from 'node:test';
import assert from 'node:assert/strict';
import { countAnswers, percentages, pickFifty, remainingMs, validateBank, PHASE } from '../public/js/logic.js';

test('shown percentages always add up to 100, even for thirds', () => {
  assert.deepEqual(percentages([1, 1, 1, 0]), [34, 33, 33, 0]);
  for (const c of [[7, 3, 0, 1], [13, 9, 6, 5], [1, 0, 0, 0], [2, 2, 2, 1]]) {
    assert.equal(percentages(c).reduce((s, x) => s + x, 0), 100, String(c));
  }
});

test('an option nobody chose never gets a rounding point', () => {
  assert.equal(percentages([1, 1, 1, 0])[3], 0);
  assert.equal(percentages([2, 1, 0, 0])[2], 0);
});

test('no answers shows 0% everywhere instead of dividing by zero', () => {
  assert.deepEqual(percentages([0, 0, 0, 0]), [0, 0, 0, 0]);
});

test('answers on options removed by 50:50 are not counted (the student must choose again)', () => {
  const answers = { a: { choice: 0 }, b: { choice: 1 }, c: { choice: 2 }, d: { choice: 1 } };
  assert.deepEqual(countAnswers(answers, { 0: true, 2: true }), [0, 2, 0, 0]);
  assert.deepEqual(countAnswers(answers), [1, 2, 1, 0]);
});

test('50:50 removes exactly two options and never the key', () => {
  for (let key = 0; key < 4; key++) {
    for (let s = 0; s < 50; s++) {
      let x = s / 50;
      const rng = () => (x = (x * 9301 + 0.49297) % 1);
      const removed = pickFifty(key, rng);
      assert.equal(removed.length, 2);
      assert.ok(!removed.includes(key));
      assert.notEqual(removed[0], removed[1]);
    }
  }
});

test('the clock freezes while paused, and shows nothing left once the vote has ended', () => {
  assert.equal(remainingMs({ phase: PHASE.OPEN, endsAt: 10_000 }, 4_000), 6_000);
  assert.equal(remainingMs({ phase: PHASE.OPEN, endsAt: 10_000 }, 12_000), 0);
  assert.equal(remainingMs({ phase: PHASE.PAUSED, remainingMs: 7_500 }, 99_999), 7_500);
  assert.equal(remainingMs({ phase: PHASE.SHOW, durationMs: 20_000 }, 99_999), 20_000);
  assert.equal(remainingMs({ phase: PHASE.CLOSED }, 0), 0);
  assert.equal(remainingMs({ phase: PHASE.DECIDE }, 0), 0);
});

test('the official question set is valid, has 5 questions in order with keys C, B, D, A, C and an explanation each', async () => {
  const { readFile } = await import('node:fs/promises');
  const bank = JSON.parse(await readFile(new URL('../bo_cau/cap_so_cong.json', import.meta.url), 'utf8'));
  assert.deepEqual(validateBank(bank), []);
  assert.deepEqual(bank.questions.map((q) => 'ABCD'[q.answer]).join(''), 'CBDAC');
  assert.ok(bank.questions.every((q) => q.explain && q.options.length === 4 && q.seconds === 20));
  assert.equal(bank.questions[0].options[2], '\\(8;\\ 5;\\ 2;\\ -1;\\ -4\\)');
  assert.equal(bank.outro.title, 'BÀI MỚI: CẤP SỐ NHÂN');
});


