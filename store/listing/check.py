"""Проверяет лимиты полей: заголовок «## Поле (N)» — текст под ним не длиннее N знаков."""
import pathlib
import re
import sys

bad = 0
for path in sorted(pathlib.Path(__file__).parent.glob('*.md')):
    if path.name == 'README.md':
        continue
    text = path.read_text()
    for match in re.finditer(r'^## (.+?) \((\d+)\)\n(.*?)(?=^## |\Z)', text, re.S | re.M):
        field, limit, body = match.group(1), int(match.group(2)), match.group(3).strip()
        mark = 'OK ' if len(body) <= limit else 'ДЛИННО'
        if len(body) > limit:
            bad += 1
        if len(body) > limit or '-v' in sys.argv:
            print(f'{mark} {path.stem:3} {field:32} {len(body):5} / {limit}')
        if field.startswith('Keywords') and ', ' in body:
            print(f'ПРОБЕЛ {path.stem} {field}: ключевые слова через запятую без пробела')
            bad += 1
print('всё в лимитах' if not bad else f'нарушений: {bad}')
sys.exit(1 if bad else 0)
