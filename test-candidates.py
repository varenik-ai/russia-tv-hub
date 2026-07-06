#!/usr/bin/env python3
"""Тест кандидатов на замену/добавление каналов — сегментная проверка"""
import urllib.request, urllib.parse, urllib.error, json, time, re

WORKER = "https://russia-worker.dyaltd.workers.dev"

# Кандидаты: name → url
CANDIDATES = {
    # --- Замены для гео-блоков ---
    'pyatnitsa_tuva':   'https://vod.tuva.ru/friday/index.m3u8',

    # --- Новые каналы (cinerama.uz — подтверждённо без гео) ---
    'euronews':         'https://stream8.cinerama.uz/1024/tracks-v1a1/mono.m3u8',
    'istoriya':         'https://stream8.cinerama.uz/1266/tracks-v1a1/mono.m3u8',
    'domkino':          'https://stream8.cinerama.uz/1054/tracks-v1a1/mono.m3u8',

    # --- Новые каналы (другие CDN — надо проверить) ---
    'perviy_hd':        'http://dmi3y-tv.online/hls/DVB-T2/CH_1TV.m3u8',
    'tnt_rutube':       'https://bl.rutube.ru/livestream/546602986e6a424d74d594876ddb3f04/index.m3u8?s=K-z3nz49R1oGQ-5yPSd8pg&e=2082157024&scheme=https',
    'ntv_hit':          'http://cdn.ntv.ru/th_hit/tracks-v1a1/mono.m3u8',
    'ntv_hd':           'http://cdn.ntv.ru/ntv-msk_hd/tracks-v1a1/mono.m3u8',
    'rbc':              'http://online.video.rbc.ru/online/rbctv_1080p/index.m3u8',
    'rt_news':          'http://rt-glb.rttv.com/dvr/rtnews/playlist.m3u8',
}

def fetch_raw(url, timeout=12):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.headers.get('Content-Type', ''), r.read()
    except urllib.error.HTTPError as e:
        return e.code, '', b''
    except Exception as e:
        return 0, '', str(e).encode()

def debug_url(url):
    enc = urllib.parse.quote(url, safe='')
    req_url = f"{WORKER}/debug?url={enc}&t={int(time.time())}"
    req = urllib.request.Request(req_url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e)}

def first_url(m3u8_text):
    for line in m3u8_text.splitlines():
        line = line.strip()
        if line and not line.startswith('#'):
            return line
    return None

def cdn_url(proxy_url):
    m = re.search(r'[?&]url=([^&]+)', proxy_url)
    return urllib.parse.unquote(m.group(1)) if m else proxy_url

def proxy(url):
    enc = urllib.parse.quote(url, safe='')
    return f"{WORKER}/proxy?url={enc}"

print("=== Тест кандидатов (мастер + первый сегмент) ===\n")

for name, url in CANDIDATES.items():
    print(f"{'─'*60}")
    print(f"📺  {name}")
    print(f"    {url[:80]}")

    # 1. Мастер через /debug
    d = debug_url(url)
    s = d.get('status', 0)
    body = d.get('body', d.get('error', ''))
    is_m3u8 = '#EXTM3U' in body
    is_master = '#EXT-X-STREAM-INF' in body
    is_media = '#EXT-X-TARGETDURATION' in body

    if s != 200 or not is_m3u8:
        print(f"    ❌ master: {s}  {body[:80]}")
        print()
        time.sleep(0.4)
        continue

    kind = 'MASTER' if is_master else ('MEDIA' if is_media else 'M3U8')
    print(f"    ✅ master: {s}, {kind}")

    # 2. Взять первый sub-url
    sub_url = first_url(body)
    if not sub_url:
        print(f"    ⚠️  нет URL в мастере")
        print()
        time.sleep(0.4)
        continue

    # Если это MEDIA playlist — sub_url уже сегменты, иначе нужно ещё один уровень
    if is_media:
        # Прокси первого сегмента прямо из мастера
        seg_proxy = proxy(sub_url if sub_url.startswith('http') else url.rsplit('/', 1)[0] + '/' + sub_url)
        print(f"    seg CDN: {sub_url[:70]}")
        time.sleep(0.2)
        ss, sct, sbody = fetch_raw(seg_proxy)
        ssize = len(sbody)
        if ss == 200 and ssize > 5000:
            print(f"    ✅ segment: {ss} {sct[:25]} {ssize//1024}KB")
        else:
            try: err = sbody.decode(errors='replace')[:60]
            except: err = ''
            print(f"    ❌ segment: {ss} {sct[:20]} {ssize}B | {err}")
        print()
        time.sleep(0.3)
        continue

    # MASTER → нужен вариант
    # Получить variant через /proxy
    variant_proxy = proxy(sub_url if sub_url.startswith('http') else url.rsplit('/', 1)[0] + '/' + sub_url)
    time.sleep(0.2)
    vs, vct, vraw = fetch_raw(variant_proxy)
    try: vbody = vraw.decode(errors='replace')
    except: vbody = ''
    is_ts = (vs == 200 and len(vraw) > 5000 and ('video' in vct or 'octet' in vct or 'mpeg' in vct.lower()))
    is_v_media = '#EXT-X-TARGETDURATION' in vbody

    if is_ts:
        print(f"    ✅ variant→seg: {vs} {vct[:25]} {len(vraw)//1024}KB (прямой)")
        print()
        time.sleep(0.3)
        continue

    if vs != 200 or not vbody.strip():
        print(f"    ❌ variant: {vs} {vct[:30]}")
        print()
        time.sleep(0.3)
        continue

    if not is_v_media:
        print(f"    ⚠️  variant: {vs}, не MEDIA: {vbody[:80]}")
        print()
        time.sleep(0.3)
        continue

    print(f"    ✅ variant: {vs}, MEDIA")

    # 3. Первый сегмент из variant
    seg_url = first_url(vbody)
    if not seg_url:
        print(f"    ❌ нет сегментов в variant")
        print()
        time.sleep(0.3)
        continue

    print(f"    seg CDN: {cdn_url(seg_url)[:70]}")
    time.sleep(0.2)
    ss2, sct2, sbody2 = fetch_raw(seg_url)
    ssize2 = len(sbody2)
    if ss2 == 200 and ssize2 > 5000:
        print(f"    ✅ segment: {ss2} {sct2[:25]} {ssize2//1024}KB")
    else:
        try: err2 = sbody2.decode(errors='replace')[:60]
        except: err2 = ''
        print(f"    ❌ segment: {ss2} {sct2[:20]} {ssize2}B | {err2}")

    print()
    time.sleep(0.4)

print("=== Готово ===")
