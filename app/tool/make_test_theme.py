"""Writes a deliberately plain test theme (SVG images, short WAV beeps) to check every theme slot.
It looks like nothing in particular: teal/magenta test blocks with visible end caps, so a stretched cap shows.
Usage: python3 tool/make_test_theme.py <out_dir>"""
import json, math, os, struct, sys, wave

out = sys.argv[1]
os.makedirs(out, exist_ok=True)

def svg(name, w, h, body):
    with open(os.path.join(out, name), 'w', encoding='utf-8') as f:
        f.write(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}">{body}</svg>')

def bar(name, fill, cap='#d946ef', w=600, h=100, e=40):
    # middle stretches; the two 40-px caps must keep their shape (triangle notch drawn in each cap)
    svg(name, w, h, f'<rect width="{w}" height="{h}" fill="{fill}"/>'
        f'<rect width="{e}" height="{h}" fill="{cap}"/><rect x="{w-e}" width="{e}" height="{h}" fill="{cap}"/>'
        f'<path d="M{e} {h/2} L{e*0.3} {h*0.2} L{e*0.3} {h*0.8}Z" fill="#fff"/>'
        f'<path d="M{w-e} {h/2} L{w-e*0.3} {h*0.2} L{w-e*0.3} {h*0.8}Z" fill="#fff"/>')

svg('logo.svg', 400, 120, '<rect width="400" height="120" rx="20" fill="#0f766e"/>'
    '<text x="200" y="76" font-size="44" font-family="sans-serif" font-weight="700" fill="#fff" text-anchor="middle">LOGO THỬ</text>')
svg('nen.svg', 1600, 900, '<defs><pattern id="g" width="80" height="80" patternUnits="userSpaceOnUse">'
    '<path d="M80 0H0V80" fill="none" stroke="#134e4a" stroke-width="2"/></pattern></defs>'
    '<rect width="1600" height="900" fill="#042f2e"/><rect width="1600" height="900" fill="url(#g)"/>')
bar('cau_hoi.svg', '#115e59', w=1000, h=200)
bar('dap_an.svg', '#134e4a')
bar('dap_an_chon.svg', '#c2410c')
bar('dap_an_dung.svg', '#15803d')
bar('dap_an_sai.svg', '#b91c1c')
bar('bac.svg', '#134e4a', w=300, h=60, e=20)
bar('bac_hien_tai.svg', '#c2410c', w=300, h=60, e=20)
for name, label in [('nut_5050.svg', '5050'), ('nut_tu_van.svg', 'TV')]:
    svg(name, 120, 120, f'<circle cx="60" cy="60" r="56" fill="#0f766e" stroke="#d946ef" stroke-width="6"/>'
        f'<text x="60" y="72" font-size="34" font-family="sans-serif" font-weight="700" fill="#fff" text-anchor="middle">{label}</text>')

def beep(name, freq, secs):
    rate = 22050
    with wave.open(os.path.join(out, name), 'wb') as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(rate)
        w.writeframes(b''.join(struct.pack('<h', int(8000 * math.sin(2 * math.pi * freq * i / rate))) for i in range(int(rate * secs))))

for name, f, s in [('bat_dau.wav', 523, .3), ('nhac_nen.wav', 220, 1.0), ('tich.wav', 880, .05), ('dung_lai.wav', 392, .2),
                   ('het_gio.wav', 110, .4), ('nam_muoi.wav', 660, .2), ('tu_van.wav', 494, .2), ('dap_an.wav', 784, .4), ('vinh_danh.wav', 1046, .6)]:
    beep(name, f, s)

edge = {'edge': 40, 'edgeWidth': 1.2}
json.dump({
    'images': {
        'logo': 'logo.svg', 'background': 'nen.svg',
        'question': {'file': 'cau_hoi.svg', **edge}, 'answer': {'file': 'dap_an.svg', **edge},
        'answerChosen': {'file': 'dap_an_chon.svg', **edge}, 'answerCorrect': {'file': 'dap_an_dung.svg', **edge},
        'answerWrong': {'file': 'dap_an_sai.svg', **edge},
        'ladder': {'file': 'bac.svg', 'edge': 20, 'edgeWidth': 1}, 'ladderNow': {'file': 'bac_hien_tai.svg', 'edge': 20, 'edgeWidth': 1},
        'fifty': 'nut_5050.svg', 'advisor': 'nut_tu_van.svg',
    },
    'sounds': {'start': 'bat_dau.wav', 'countdown': 'nhac_nen.wav', 'tick': 'tich.wav', 'pause': 'dung_lai.wav', 'timeUp': 'het_gio.wav',
               'fifty': 'nam_muoi.wav', 'advisor': 'tu_van.wav', 'correct': 'dap_an.wav', 'final': 'vinh_danh.wav'},
    'colors': {'accent': '#7cffcb', 'highlight': '#f0abfc'},
}, open(os.path.join(out, 'theme.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('test theme ->', out)
