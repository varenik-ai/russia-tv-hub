#!/usr/bin/env python3
"""Диагностика потоков через CF Worker — v1.4.0"""
import urllib.request, urllib.parse, urllib.error, json, time

WORKER = "https://russia-worker.dyaltd.workers.dev"

# ── Шаг 1: проверить все каналы через /stream ─────────────────────────────────
def test_channel(channel):
    url = f"{WORKER}/stream?channel={channel}&t={int(time.time())}"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            body = r.read().decode(errors='replace')
            return r.status, r.headers.get('Content-Type', ''), body
    except Exception as e:
        return 0, '', str(e)

# ── Шаг 2: debug произвольного URL ───────────────────────────────────────────
def debug_url(url):
    enc = urllib.parse.quote(url, safe='')
    req_url = f"{WORKER}/debug?url={enc}&t={int(time.time())}"
    req = urllib.request.Request(req_url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            return json.loads(r.read().decode())
    except Exception as e:
        return {"error": str(e)}

# ── Шаг 3: версия воркера ─────────────────────────────────────────────────────
def check_version():
    req = urllib.request.Request(f"{WORKER}/version", headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=8) as r:
            return json.loads(r.read().decode())
    except:
        return {}

print("=== Диагностика Russia TV Worker ===\n")
ver = check_version()
print(f"Worker version: {ver.get('version', '?')}, channels: {ver.get('channels', '?')}\n")

CHANNELS = [
    'rossiya1','ntv','rossiya24','pyatyy','rentv','tvc',
    'zvezda','mir','sts','pyatnitsa','tnt4','kultura',
    'soloviev','karusel','mult','nick','muztv','rutv',
]

print("=== Тест /stream (все каналы) ===")
ok = 0
bad = []
for ch in CHANNELS:
    status, ct, body = test_channel(ch)
    if status == 200 and 'mpegurl' in ct.lower():
        # Подсчитать сегменты в плейлисте
        segs = [l for l in body.splitlines() if l.strip() and not l.strip().startswith('#')]
        print(f"  ✅ {ch:15} | {status} | {len(segs)} variant/seg lines")
        ok += 1
    else:
        short = body[:80].replace('\n', ' ')
        print(f"  ❌ {ch:15} | {status} | {short}")
        bad.append(ch)
    time.sleep(0.2)

print(f"\n  Итого: {ok}/{len(CHANNELS)} ✅, {len(bad)} ❌")

# ── Дополнительная диагностика МИР (смена на mir24) ──────────────────────────
print("\n=== МИР — сравнение вариантов ===")
mir_urls = [
    ("МИР (старый mirtv_2500)",  "http://hls.mirtv.cdnvideo.ru/mirtv-parampublish/mirtv_2500/playlist.m3u8"),
    ("МИР 24 (mir24_2500)",      "http://hls.mirtv.cdnvideo.ru/mirtv-parampublish/mir24_2500/playlist.m3u8"),
    ("МИР +7 (mirtv7_2500)",     "http://hls.mirtv.cdnvideo.ru/mirtv-parampublish/mirtv7_2500/playlist.m3u8"),
]
for name, url in mir_urls:
    d = debug_url(url)
    s = d.get('status', '?')
    body = d.get('body', d.get('error', ''))
    lines = [l.strip() for l in body.splitlines() if l.strip()]
    variants = [l for l in lines if not l.startswith('#')]
    has_stream_inf = any('#EXT-X-STREAM-INF' in l for l in lines)
    has_targetdur  = any('#EXT-X-TARGETDURATION' in l for l in lines)
    kind = "MASTER" if has_stream_inf else ("MEDIA" if has_targetdur else "?")
    print(f"  [{s}] {name} → {kind}")
    for l in lines[:5]:
        print(f"       {l[:100]}")
    if variants:
        print(f"       VARIANTS: {variants[0][:100]}")
    print()
    time.sleep(0.4)

# ── Диагностика суб-плейлистов оставшихся каналов ────────────────────────────
if bad:
    print(f"\n=== Суб-плейлисты проблемных каналов: {bad} ===")

SUB_TESTS = {
    'rossiya24': "https://vgtrkregion-reg.cdnvideo.ru/vgtrk/0/russia24-sd/1399200_576p.m3u8",
    'rentv':     "https://cdn4.skygo.mn/live/disk1/RenTV/HLSv3-FTA/RenTV-avc1_2000000=4-mp4a_256000=281.m3u8",
    'sts':       "https://cdn4.skygo.mn/live/disk1/STS/HLSv3-FTA/STS-avc1_2000000=47-mp4a_256000_rus=13.m3u8",
    'tnt4':      "https://cdn4.skygo.mn/live/disk1/TNT4/HLSv3-FTA/TNT4-avc1_1000000=1298-mp4a_294400_rus=1297.m3u8",
    'pyatnitsa': "https://vod.tuva.ru/friday/tracks-v1a1/mono.ts.m3u8",
    'nick':      "http://s70378.cdn.ngenix.net/nickelodeon/2/index.m3u8",
}

for ch in bad:
    if ch not in SUB_TESTS:
        continue
    d = debug_url(SUB_TESTS[ch])
    s = d.get('status', '?')
    body = d.get('body', d.get('error', ''))
    lines = [l.strip() for l in body.splitlines() if l.strip()]
    segs = [l for l in lines if not l.startswith('#')]
    has_targetdur = any('#EXT-X-TARGETDURATION' in l for l in lines)
    print(f"  {ch}: [{s}] {'MEDIA PLAYLIST' if has_targetdur else 'MASTER/ERROR'} | {len(segs)} segs")
    for seg in segs[:2]:
        print(f"    seg: {seg[:100]}")
    time.sleep(0.3)
