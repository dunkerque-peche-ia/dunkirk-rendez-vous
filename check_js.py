import re

with open('index.html', 'r', encoding='utf-8') as f:
    html = f.read()

m = re.search(r'<script type="module">(.*?)</script>', html, re.DOTALL)
if m:
    with open('extracted_script.mjs', 'w', encoding='utf-8') as out:
        out.write(m.group(1))
    print('Extracted successfully, size:', len(m.group(1)))
else:
    print('Script not found!')
