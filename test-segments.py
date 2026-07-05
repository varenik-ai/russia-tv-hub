#!/usr/bin/env python3
"""Полный тест цепочки потока: master → variant → segment"""
import urllib.request, urllib.parse, urllib.error, json, time, re

WORKER = "https://russia-worker.dyaltd.workers.dev"

def fetch_raw(url, timeout=12):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.headers.get('Content-Type',''), r.read()
    except urllib.error.HTTPError as e:
        return e.code, '', b''
    except Exception as e:
        return 0, '', str(e).encode()

def fetch_text(url, timeout=12):
    s, ct, body = fetch_raw(url, timeout)
    try:
        return s, ct, body.decode(errors='replace')
    except:
        return s, ct, ''

def get_stream(channel):
    s, ct, body = fetch_text(f"{WORKER}/stream?channel={channel}&t={int(time.time())}")
    return s, body

def first_url(m3u8_body):
    """Первый не-# URL из m3u8"""
    for line in m3u8_body.splitlines():
        line = line.strip()
        if line and not line.startswith('#'):
            return line
    return None

def cdn_url(proxy_url):
    """Извлечь исходный CDN URL из proxy URL"""
    m = re.search(r'[?&]url=([^&]+)', proxy_url)
    return urllib.parse.unquote(m.group(1)) if m else proxy_url

CHANNELS = ['rossiya24','rentv','mir','zvezda','sts','pyatnitsa','tnt4','soloviev','nick']

print("=== Тест цепочки потоков ===\n")

for ch in CHANNELS:
    print(f"{'─'*55}")
    print(f"📺 {ch}")

    # 1. Master m3u8 via /stream
    s1, master = get_stream(ch)
    if s1 != 200 or not master:
        print(f"  ❌ /stream: {s1}")
        print()
        continue

    lines_m = [l.strip() for l in master.splitlines() if l.strip() and not l.startswith('#')]
    is_master_m3u8 = '#EXT-X-STREAM-INF' in master
    is_media_m3u8  = '#EXT-X-TARGETDURATION' in master
    print(f"  ✅ stream: {s1}, {'MASTER' if is_master_m3u8 else 'MEDIA' if is_media_m3u8 else '?'}, {len(lines_m)} urls")

    variant_proxy = first_url(master)
    if not variant_proxy:
        print(f"  ❌ нет URL в плейлисте")
        print()
        continue

    cdn1 = cdn_url(variant_proxy)
    print(f"  url1 CDN: {cdn1[:80]}")

    time.sleep(0.2)

    # 2. Первый URL (variant или сегмент)
    s2, ct2, raw2 = fetch_raw(variant_proxy)
    size2 = len(raw2)

    # Определить тип ответа
    is_ts2 = (cdn1.endswith('.ts') or 'video' in ct2 or 'octet' in ct2 or 'mpeg' in ct2.lower()) and size2 > 5000
    try:
        body2 = raw2.decode(errors='replace')
    except:
        body2 = ''

    is_m3u8_2   = '#EXTM3U' in body2
    is_media2   = '#EXT-X-TARGETDURATION' in body2
    is_master2  = '#EXT-X-STREAM-INF' in body2

    if is_ts2 and s2 == 200:
        print(f"  ✅ seg1: {s2}, {ct2[:25]}, {size2//1024}KB (прямой сегмент)")
        print()
        continue
    elif s2 != 200:
        print(f"  ❌ url1: {s2} {ct2[:30]}")
        print()
        continue
    elif not is_m3u8_2:
        print(f"  ⚠️  url1: {s2}, {size2}B, не m3u8 и не TS")
        print()
        continue

    lines_v = [l.strip() for l in body2.splitlines() if l.strip() and not l.startswith('#')]
    print(f"  {'✅' if is_media2 else '⚠️ '} variant: {s2}, {'MASTER' if is_master2 else 'MEDIA' if is_media2 else '?'}, {len(lines_v)} urls")

    if is_master2 and not is_media2:
        # Ещё один уровень
        var2_proxy = first_url(body2)
        if var2_proxy:
            cdn2 = cdn_url(var2_proxy)
            print(f"  var2 CDN: {cdn2[:80]}")
            time.sleep(0.2)
            s3, ct3, raw3 = fetch_raw(var2_proxy)
            size3 = len(raw3)
            is_ts3 = (cdn2.endswith('.ts') or 'video' in ct3 or 'octet' in ct3) and size3 > 5000
            try:
                body3 = raw3.decode(errors='replace')
            except:
                body3 = ''
            is_media3 = '#EXT-X-TARGETDURATION' in body3
            if is_ts3 and s3 == 200:
                print(f"  ✅ seg2: {s3} {ct3[:20]} {size3//1024}KB")
                print()
                continue
            elif s3 != 200:
                print(f"  ❌ var2: {s3}")
                print()
                continue
            lines_v2 = [l.strip() for l in body3.splitlines() if l.strip() and not l.startswith('#')]
            print(f"  {'✅' if is_media3 else '❌'} var2: {s3}, {'MEDIA' if is_media3 else '?'}, {len(lines_v2)} urls")
            body2 = body3
            lines_v = lines_v2
        else:
            print()
            continue

    # 3. Первый сегмент из media playlist
    seg_proxy = first_url(body2)
    if not seg_proxy:
        print(f"  ❌ нет сегментов")
        print()
        continue

    seg_cdn = cdn_url(seg_proxy)
    print(f"  seg CDN: {seg_cdn[:80]}")

    time.sleep(0.2)
    s4, ct4, raw4 = fetch_raw(seg_proxy)
    size4 = len(raw4)

    if s4 == 200 and size4 > 5000:
        print(f"  ✅ segment: {s4} {ct4[:25]} {size4//1024}KB")
    elif s4 == 200:
        print(f"  ⚠️  segment: {s4} {ct4[:25]} {size4}B (мало данных)")
    else:
        try:
            err = raw4.decode(errors='replace')[:60]
        except:
            err = ''
        print(f"  ❌ segment: {s4} {ct4[:20]} | {err}")

    print()
    time.sleep(0.2)

print("=== Готово ===")
