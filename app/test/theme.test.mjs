// The theme file comes from whoever sets up the classroom screen; a bad entry must be reported and skipped,
// never injected into the page's CSS, and an empty theme must leave the built-in look untouched.
import test from 'node:test';
import assert from 'node:assert/strict';
import { parseTheme, themeCss } from '../public/js/theme.js';

test('no theme file means no changes at all', () => {
  const t = parseTheme({});
  assert.deepEqual([t.images, t.sounds, t.colors, t.font, t.errors], [{}, {}, {}, null, []]);
  assert.equal(themeCss(t), '');
});

test('valid slots map to files inside theme/', () => {
  const t = parseTheme({
    images: { logo: 'logo.png', answer: { file: 'o_dap_an.svg', edge: 60, edgeWidth: 1.5 } },
    sounds: { countdown: 'nhac_nen.mp3' },
    colors: { accent: '#ffcc00', text: 'rgb(255, 255, 255)' },
    font: 'chu.woff2',
  });
  assert.deepEqual(t.errors, []);
  assert.equal(t.images.logo.url, 'theme/logo.png');
  assert.deepEqual(t.images.answer, { url: 'theme/o_dap_an.svg', edge: 60, edgeWidth: 1.5 });
  assert.equal(t.sounds.countdown, 'theme/nhac_nen.mp3');
  assert.deepEqual(t.colors, { '--gold': '#ffcc00', '--text': 'rgb(255, 255, 255)' });
  assert.equal(t.font, 'theme/chu.woff2');
  const css = themeCss(t);
  assert.match(css, /\.ans\{[^}]*border-image:url\("theme\/o_dap_an\.svg"\) 0 60 fill \/ 0 1\.5em stretch/);
  assert.match(css, /\.brand\.site > \.badge-wrap,\.lobby-badge\{display:none!important;\}/);
  assert.match(css, /\.ans::before\{display:none!important;\}/, 'the built-in panel is fully replaced');
});

test('file names that could escape the theme folder or the CSS are refused', () => {
  const bad = ['../secret.png', 'a/b.png', 'x.png") ; body{display:none', 'https://evil.example/x.png', 'logo.exe', ''];
  for (const f of bad) {
    const t = parseTheme({ images: { logo: f } });
    assert.equal(t.images.logo, undefined, f);
    assert.equal(t.errors.length, 1, f);
  }
  assert.equal(parseTheme({ sounds: { tick: '../x.mp3' } }).sounds.tick, undefined);
  assert.equal(parseTheme({ font: 'x.ttf;}' }).font, null);
});

test('unknown slots and bad colours are reported, not applied', () => {
  const t = parseTheme({ images: { mascot: 'a.png' }, sounds: { boom: 'a.mp3' }, colors: { accent: 'red;}body{x:y', nope: '#fff' } });
  assert.deepEqual([t.images, t.sounds, t.colors], [{}, {}, {}]);
  assert.equal(t.errors.length, 4);
});

test('a broken theme file is reported', () => {
  assert.equal(parseTheme(null).errors.length, 1);
  assert.equal(parseTheme([1, 2]).errors.length, 1);
});
