"""Builds bo_cau/cap_so_cong.json from the official markdown, keeping every character of the questions, options,
keys, explanations and the lead-in. Usage: python3 -E tool/make_bank.py ../docs/nguon/Ai_la_trieu_phu_5_cau_hoi_Cap_so_cong.md bo_cau/cap_so_cong.json"""
import json, re, sys
md = open(sys.argv[1], encoding='utf-8').read()
parts = re.split(r'^### Câu (\d+) – .*$', md, flags=re.M)
qs = []
for i in range(1, len(parts), 2):
    body = parts[i + 1].split('\n---')[0]
    m = re.search(r'\*\*Câu hỏi:\*\* (.*?)\n\n- \*\*A\.\*\*', body, re.S)
    text = m.group(1).strip()
    opts = re.findall(r'^- \*\*([ABCD])\.\*\* (.+)$', body, re.M)
    assert [o[0] for o in opts] == list('ABCD'), opts
    key = re.search(r'\*\*Đáp án đúng: ([ABCD])\.\*\*', body).group(1)
    exp = re.search(r'\*\*Giải thích sau khi công bố:\*\* (.+)$', body, re.M).group(1).strip()
    note = re.search(r'^\*([^*].*?)\*$', body, re.M)
    q = {'seconds': 30, 'text': text, 'options': [o[1].strip() for o in opts], 'answer': 'ABCD'.index(key), 'explain': exp}
    if note: q['note'] = note.group(1).strip()
    qs.append(q)
outro = {
    'sequence': '2\\quad\\longrightarrow\\quad4\\quad\\longrightarrow\\quad8',
    'question': re.search(r'\*\*Câu hỏi mở:\*\* “(.+?)”', md).group(1),
    'title': re.search(r'^# (BÀI MỚI: .+)$', md, re.M).group(1).strip(),
}
bank = {'title': 'Ai Là Triệu Phú Toán Học', 'topic': 'Ôn tập cấp số cộng', 'questions': qs, 'outro': outro}
json.dump(bank, open(sys.argv[2], 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
for n, q in enumerate(qs, 1):
    print(n, 'ABCD'[q['answer']], '|', q['text'][:70].replace('\n', ' '), '| note' if 'note' in q else '')
print('outro:', outro['question'], '|', outro['title'])
