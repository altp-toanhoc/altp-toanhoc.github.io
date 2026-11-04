// Optional theme: image, sound and font files the teacher puts in public/theme/ and lists in theme/theme.json.
// Every slot is optional; a slot left out keeps the built-in look. Both screens load the same theme.
// parseTheme is pure (tested in Node); applyTheme touches the page.

export const IMAGE_SLOTS = {
  logo: 'Logo: thay logo Ai Là Triệu Phú Toán Học ở thanh trên cùng, phòng chờ, điện thoại',
  background: 'Nền sân khấu (phủ kín màn hình)',
  question: 'Khung câu hỏi',
  answer: 'Khung đáp án, trạng thái thường',
  answerChosen: 'Khung đáp án, học sinh đang chọn (điện thoại)',
  answerCorrect: 'Khung đáp án đúng',
  answerWrong: 'Khung đáp án học sinh chọn sai (điện thoại)',
  ladder: 'Một bậc của thang câu, trạng thái thường',
  ladderNow: 'Một bậc của thang câu, bậc đang chơi',
  fifty: 'Nút 50:50',
  advisor: 'Nút tổ tư vấn',
};

export const SOUND_SLOTS = {
  start: 'Câu mới hiện, đồng hồ bắt đầu',
  countdown: 'Nhạc nền lặp lại trong lúc đồng hồ chạy',
  drumroll: 'Trống dồn lúc hết giờ, trước khi lộ đáp án',
  tick: 'Mỗi giây trong 5 giây cuối',
  pause: 'Tạm dừng',
  timeUp: 'Hết giờ',
  fifty: '50:50',
  advisor: 'Tổ tư vấn',
  correct: 'Lộ đáp án, chốt đúng',
  wrong: 'Lộ đáp án, chốt sai',
  final: 'Màn vinh danh',
};

// theme.json key -> CSS variable used by style.css
export const COLOR_SLOTS = {
  text: '--text',
  muted: '--muted',
  accent: '--gold',
  highlight: '--amber',
  correct: '--green',
  wrong: '--red',
  line: '--line',
};

// File names only (no folders, no quotes or brackets), so a value can never break out of a CSS url("…").
const IMAGE_FILE = /^[\w.-]+\.(png|jpe?g|webp|gif|svg|avif)$/i;
const SOUND_FILE = /^[\w.-]+\.(mp3|ogg|wav|m4a|aac|webm)$/i;
const FONT_FILE = /^[\w.-]+\.(ttf|otf|woff2?)$/i;
const COLOR = /^(#[0-9a-f]{3,8}|(rgb|rgba|hsl|hsla)\([\d\s.,%/-]+\))$/i;

export function parseTheme(raw, base = 'theme/') {
  const out = { images: {}, sounds: {}, colors: {}, font: null, errors: [] };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    out.errors.push('theme.json phải là một đối tượng JSON.');
    return out;
  }
  for (const [k, v] of Object.entries(raw.images || {})) {
    if (!(k in IMAGE_SLOTS)) { out.errors.push(`images.${k}: không có ô này.`); continue; }
    const spec = typeof v === 'string' ? { file: v } : (v || {});
    if (!IMAGE_FILE.test(spec.file || '')) { out.errors.push(`images.${k}: tên file "${spec.file ?? ''}" không hợp lệ.`); continue; }
    const img = { url: base + spec.file };
    if (spec.edge != null) {
      const edge = Number(spec.edge);
      const width = spec.edgeWidth == null ? 2 : Number(spec.edgeWidth);
      if (!(edge > 0 && edge < 5000) || !(width > 0 && width < 20)) { out.errors.push(`images.${k}: edge/edgeWidth không hợp lệ.`); continue; }
      img.edge = edge; // px of the source image at each end that must not stretch
      img.edgeWidth = width; // how wide each end is drawn, in em
    }
    out.images[k] = img;
  }
  for (const [k, v] of Object.entries(raw.sounds || {})) {
    if (!(k in SOUND_SLOTS)) { out.errors.push(`sounds.${k}: không có ô này.`); continue; }
    if (!SOUND_FILE.test(v || '')) { out.errors.push(`sounds.${k}: tên file "${v ?? ''}" không hợp lệ.`); continue; }
    out.sounds[k] = base + v;
  }
  for (const [k, v] of Object.entries(raw.colors || {})) {
    if (!(k in COLOR_SLOTS)) { out.errors.push(`colors.${k}: không có ô này.`); continue; }
    if (!COLOR.test(String(v).trim())) { out.errors.push(`colors.${k}: màu "${v}" không hợp lệ.`); continue; }
    out.colors[COLOR_SLOTS[k]] = String(v).trim();
  }
  if (raw.font != null) {
    const f = typeof raw.font === 'string' ? raw.font : raw.font.file;
    if (FONT_FILE.test(f || '')) out.font = base + f;
    else out.errors.push(`font: tên file "${f ?? ''}" không hợp lệ.`);
  }
  return out;
}

// A frame image either stretches to the box, or (with "edge") keeps both ends unstretched (CSS border-image).
function frameRule(sel, img) {
  if (img.edge) {
    const w = `${img.edgeWidth}em`;
    return `${sel}{background:none!important;box-shadow:none!important;-webkit-clip-path:none!important;clip-path:none!important;border-style:solid!important;border-color:transparent!important;`
      + `border-width:0 ${w}!important;border-image:url("${img.url}") 0 ${img.edge} fill / 0 ${w} stretch!important;}${sel}::before{display:none!important;}`;
  }
  return `${sel}{background:url("${img.url}") center/100% 100% no-repeat!important;border-color:transparent!important;box-shadow:none!important;-webkit-clip-path:none!important;clip-path:none!important;}`
    + `${sel}::before{display:none!important;}`;
}

function iconRule(sel, img) {
  return `${sel}{background:url("${img.url}") center/contain no-repeat!important;border:none!important;box-shadow:none!important;color:transparent!important;}`
    + `${sel} > *{visibility:hidden;}`;
}

export function themeCss(t) {
  const i = t.images;
  const css = [];
  if (t.font) css.push(`@font-face{font-family:'ThemeFont';src:url("${t.font}");}body{font-family:'ThemeFont','Be Vietnam Pro',system-ui,sans-serif;}`);
  if (i.background) css.push(`body{background:#000 url("${i.background.url}") center/cover no-repeat fixed!important;}.stage-bg{display:none!important;}`);
  if (i.question) css.push(frameRule('.question', i.question));
  if (i.answer) css.push(frameRule('.ans', i.answer));
  if (i.answerChosen) css.push(frameRule('.ans.chosen', i.answerChosen));
  if (i.answerCorrect) css.push(frameRule('.ans.correct', i.answerCorrect));
  if (i.answerWrong) css.push(frameRule('.ans.wrong-mine', i.answerWrong));
  if (i.ladder) css.push(frameRule('.ladder li', i.ladder));
  if (i.ladderNow) css.push(frameRule('.ladder li.now', i.ladderNow));
  if (i.fifty) css.push(iconRule('#ll50', i.fifty));
  if (i.advisor) css.push(iconRule('#llTv', i.advisor));
  if (i.logo) css.push('.brand.site > .badge-wrap,.lobby-badge{display:none!important;}');
  return css.join('\n');
}

// Loads theme/theme.json if there is one; returns the parsed theme (empty when there is none).
export async function applyTheme() {
  let raw = null;
  try {
    const r = await fetch('theme/theme.json', { cache: 'no-store' });
    if (!r.ok) return parseTheme({});
    raw = await r.json();
  } catch {
    const t = parseTheme({});
    t.errors.push('theme.json không đọc được (cần JSON hợp lệ).');
    return t;
  }
  const t = parseTheme(raw);
  for (const [v, c] of Object.entries(t.colors)) document.documentElement.style.setProperty(v, c);
  const style = document.createElement('style');
  style.id = 'theme-css';
  style.textContent = themeCss(t);
  document.head.append(style);
  if (t.images.logo) {
    document.querySelectorAll('.brand.site').forEach((b) => {
      const img = document.createElement('img');
      img.className = 'logo';
      img.alt = 'Logo';
      img.src = t.images.logo.url;
      b.prepend(img);
    });
    document.querySelectorAll('img.theme-logo').forEach((img) => { img.src = t.images.logo.url; img.hidden = false; });
  }
  return t;
}

export function describeTheme(t) {
  const imgs = Object.keys(t.images).length;
  const snd = Object.keys(t.sounds).length;
  const col = Object.keys(t.colors).length;
  if (!imgs && !snd && !col && !t.font) return 'Giao diện: mặc định.';
  return `Giao diện riêng: ${imgs} ảnh, ${snd} âm thanh, ${col} màu${t.font ? ', 1 font' : ''}.`;
}
