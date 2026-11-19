#!/usr/bin/env python3
"""19.11.2026: вставляет receiver.html (приёмник Google Cast) в russia-worker.js как строку RECEIVER_HTML и маршрут /receiver.
Запуск из корня репозитория после правок receiver.html: python3 tools/embed_receiver.py  (затем деплой воркеров). Идемпотентен."""
import json, os, re
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
html = open(os.path.join(root, 'receiver.html'), encoding='utf-8').read()
p = os.path.join(root, 'russia-worker.js'); s = open(p, encoding='utf-8').read()
block = '// <receiver-html>\nvar RECEIVER_HTML = ' + json.dumps(html, ensure_ascii=False) + ';\n// </receiver-html>\n'
if '// <receiver-html>' in s:
    s = re.sub(r'// <receiver-html>\n.*?// </receiver-html>\n', lambda m: block, s, flags=re.S)
else:
    a = 'var index_default = {'
    assert a in s
    s = s.replace(a, block + a, 1)
route = '    if (path === "/receiver") {   // 19.11.2026: приёмник Google Cast (receiver.html)\n      return new Response(RECEIVER_HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache", "Access-Control-Allow-Origin": "*" } });\n    }\n'
if 'path === "/receiver"' not in s:
    a = '    if (path === "/eu-debug") {'
    assert a in s
    s = s.replace(a, route + a, 1)
open(p, 'w', encoding='utf-8').write(s)
print('ok', len(html))
