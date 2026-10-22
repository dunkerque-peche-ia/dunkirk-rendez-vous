import sys
sys.stdout.reconfigure(encoding='utf-8')
with open('js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

opens = content.count('{')
closes = content.count('}')
print(f'app.js - Open braces: {opens}, Close braces: {closes}, Diff: {opens - closes}')

import re
funcs = re.findall(r'(?:async )?function (\w+)\s*\(', content)
from collections import Counter
dupes = {k: v for k, v in Counter(funcs).items() if v > 1}
if dupes:
    print(f'Duplicate function definitions: {dupes}')
else:
    print('No duplicate function definitions found in app.js')
    
# Also check the export const app block at the end
idx = content.find('export const app')
if idx >= 0:
    print(f'\nexport const app found at char {idx}')
    print(content[idx:idx+200])
