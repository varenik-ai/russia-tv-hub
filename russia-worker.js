// russia-worker.js — CF Worker для Russia TV Hub
// Деплой: cd ~/russia-worker && cp ~/russia-tv-hub/russia-worker.js src/index.js && npx wrangler deploy
// Или через Cloudflare Dashboard → Workers → Edit code

const VERSION = '1.7.0';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
  'Access-Control-Allow-Headers': '*',
};

// Подтверждённые рабочие потоки без гео-ограничений (проверены через CF Worker debug)
const STREAMS = {
  // ── Новости ───────────────────────────────────────────────
  rossiya1:     'https://vgtrkregion-reg.cdnvideo.ru/vgtrk/0/russia1-hd/index.m3u8',
  ntv:          'https://stream8.cinerama.uz/1023/tracks-v1a1/mono.m3u8',
  ntv_hit:      'http://cdn.ntv.ru/th_hit/tracks-v1a1/mono.m3u8',
  rossiya24:    'https://stream8.cinerama.uz/1021/tracks-v1a1/mono.m3u8',
  pyatyy:       'https://cdn4.skygo.mn/live/disk1/Channel_5/HLSv3-FTA/Channel_5.m3u8',
  tvc:          'https://tvc-hls.cdnvideo.ru/tvc-res/smil:vd9221.smil/playlist.m3u8',
  zvezda:       'https://tvchannelstream1.tvzvezda.ru/cdn/tvzvezda/playlist.m3u8',
  mir:          'http://hls.mirtv.cdnvideo.ru/mirtv-parampublish/mir24_2500/playlist.m3u8',
  rt:           'http://rt-glb.rttv.com/live/rtnews/playlist.m3u8',   // /live/ — не /dvr/
  tass:         'https://tass-hls.servicecdn.ru/httpstreamer/tass-loop-main.stream/playlist.m3u8',
  // ── Развлечения ──────────────────────────────────────────
  tnt:          'https://bl.rutube.ru/livestream/546602986e6a424d74d594876ddb3f04/index.m3u8?s=K-z3nz49R1oGQ-5yPSd8pg&e=2082157024&scheme=https',
  kultura:      'https://vgtrkregion-reg.cdnvideo.ru/vgtrk/0/kultura-hd/index.m3u8',
  soloviev:     'https://stream.smotrim.ru/hls/solovievlive/playlist_6.m3u8',
  istoriya:     'https://stream8.cinerama.uz/1266/tracks-v1a1/mono.m3u8',
  domkino:      'https://stream8.cinerama.uz/1054/tracks-v1a1/mono.m3u8',
  // ── Кино ─────────────────────────────────────────────────
  kinohit:      'https://stream8.cinerama.uz/1055/tracks-v1a1/mono.m3u8',
  retro:        'https://stream8.cinerama.uz/1047/tracks-v1a1/mono.m3u8',
  kinokomediya: 'https://stream8.cinerama.uz/1232/tracks-v1a1/mono.m3u8',
  kinopremiera: 'https://stream8.cinerama.uz/1207/tracks-v1a1/mono.m3u8',
  viju:         'https://stream8.cinerama.uz/1058/tracks-v1a1/mono.m3u8',
  // ── Детские ──────────────────────────────────────────────
  karusel:      'https://streaming102.interskytech.com/live/232.m3u8',
  mult:         'https://stream8.cinerama.uz/1246/tracks-v1a1/mono.m3u8',
  nick:         'http://s70378.cdn.ngenix.net/nickelodeon/2/index.m3u8',
  // ── Музыка ───────────────────────────────────────────────
  muztv:        'https://stream8.cinerama.uz/1200/tracks-v1a1/mono.m3u8',
  rutv:         'https://stream8.cinerama.uz/1202/tracks-v1a1/mono.m3u8',
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS });
  }

  // /stream?channel=NAME — получить прокси-поток для канала
  if (path === '/stream') {
    const channel = url.searchParams.get('channel');
    const streamUrl = STREAMS[channel];
    if (!streamUrl) {
      return new Response(JSON.stringify({ error: 'Channel not found', channel }), {
        status: 404,
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    return fetchM3u8(streamUrl, url.origin);
  }

  // /proxy?url=ENCODED_URL — прокси для плейлистов и сегментов
  if (path === '/proxy') {
    const target = url.searchParams.get('url');
    if (!target) {
      return new Response('Missing url param', { status: 400, headers: CORS });
    }
    return proxyTarget(target, url.origin);
  }

  // /debug?url=ENCODED_URL — проверка доступности URL с CF Worker
  if (path === '/debug') {
    const target = url.searchParams.get('url');
    if (!target) {
      return new Response(JSON.stringify({ channels: Object.keys(STREAMS), version: VERSION }), {
        headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
    try {
      const res = await fetch(target, { headers: { 'User-Agent': UA }, cf: { cacheEverything: false, cacheTtl: -1 } });
      const body = await res.text();
      return new Response(JSON.stringify({
        status: res.status,
        contentType: res.headers.get('Content-Type'),
        body: body.slice(0, 500),
      }), { headers: { ...CORS, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500, headers: { ...CORS, 'Content-Type': 'application/json' },
      });
    }
  }

  // /version
  if (path === '/version') {
    return new Response(JSON.stringify({ version: VERSION, channels: Object.keys(STREAMS).length }), {
      headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  return new Response(`Russia TV Worker v${VERSION}`, { headers: CORS });
}

// ── User-Agent для запросов к CDN ────────────────────────────────────────────
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

// ── Разрешить относительный URL относительно базового ───────────────────────
function resolveUrl(base, relative) {
  if (!relative) return base;
  if (relative.startsWith('http://') || relative.startsWith('https://')) return relative;
  try {
    return new URL(relative, base).href;
  } catch {
    return relative;
  }
}

// ── Определить базовый URL для m3u8-плейлиста (директория файла) ─────────────
function baseDir(url) {
  return url.substring(0, url.lastIndexOf('/') + 1);
}

// ── Перезаписать m3u8: все URL → /proxy?url=... ──────────────────────────────
function rewriteM3u8(content, sourceUrl, workerOrigin) {
  const base = baseDir(sourceUrl);
  const lines = content.split('\n');
  const out = [];

  for (const rawLine of lines) {
    const line = rawLine.trimEnd();

    // Пропустить треки субтитров — вызывают ошибки hls.js (напр. Россия 24 rus_subs.m3u8)
    if (line.startsWith('#EXT-X-MEDIA') && line.includes('TYPE=SUBTITLES')) continue;

    if (line === '' || line.startsWith('#')) {
      // Перезаписать URI= внутри тегов (EXT-X-KEY, EXT-X-MEDIA, EXT-X-MAP и др.)
      let fixed = line.replace(/URI="([^"]+)"/g, (_, uri) => {
        const abs = resolveUrl(base, uri);
        return `URI="${workerOrigin}/proxy?url=${encodeURIComponent(abs)}"`;
      });
      // Убрать атрибут SUBTITLES="..." из EXT-X-STREAM-INF
      if (fixed.startsWith('#EXT-X-STREAM-INF')) {
        fixed = fixed.replace(/,?SUBTITLES="[^"]*"/, '');
      }
      out.push(fixed);
    } else {
      // Строка-URL (сегмент TS или суб-плейлист)
      const abs = resolveUrl(base, line);
      out.push(`${workerOrigin}/proxy?url=${encodeURIComponent(abs)}`);
    }
  }

  return out.join('\n');
}

// ── Получить мастер-плейлист и переписать для прокси ─────────────────────────
async function fetchM3u8(streamUrl, workerOrigin) {
  let res;
  try {
    res = await fetch(streamUrl, {
      headers: {
        'User-Agent': UA,
        'Referer': new URL(streamUrl).origin + '/',
        'Origin':  new URL(streamUrl).origin,
      },
      cf: { cacheEverything: false, cacheTtl: -1 },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, url: streamUrl }), {
      status: 502, headers: { ...CORS, 'Content-Type': 'application/json' },
    });
  }

  if (!res.ok) {
    return new Response(`Source returned ${res.status} for ${streamUrl}`, {
      status: res.status, headers: CORS,
    });
  }

  const body = await res.text();
  const rewritten = rewriteM3u8(body, streamUrl, workerOrigin);

  return new Response(rewritten, {
    headers: {
      ...CORS,
      'Content-Type': 'application/vnd.apple.mpegurl',
      'Cache-Control': 'no-cache, no-store',
    },
  });
}

// ── Прокси для произвольного URL (суб-плейлист или сегмент) ──────────────────
async function proxyTarget(targetUrl, workerOrigin) {
  let res;
  try {
    res = await fetch(targetUrl, {
      headers: {
        'User-Agent': UA,
        'Referer':    new URL(targetUrl).origin + '/',
        'Origin':     new URL(targetUrl).origin,
      },
      cf: { cacheEverything: false, cacheTtl: -1 },
    });
  } catch (e) {
    return new Response(`Fetch error: ${e.message}`, { status: 502, headers: CORS });
  }

  if (!res.ok) {
    return new Response(`Upstream ${res.status}`, { status: res.status, headers: CORS });
  }

  const ct = (res.headers.get('Content-Type') || '').toLowerCase();
  // TS-сегмент имеет приоритет — иначе "playlist_X.ts" ошибочно детектируется как m3u8
  const isTs = /\.ts([?#]|$)/.test(targetUrl) || ct.includes('video/') || ct.includes('audio/') || ct.includes('octet-stream');
  const isM3u8 = !isTs && (ct.includes('mpegurl') || ct.includes('m3u') ||
                 targetUrl.includes('.m3u8') || targetUrl.includes('playlist') ||
                 targetUrl.includes('chunklist') || targetUrl.includes('variant'));

  if (isM3u8) {
    const body = await res.text();
    const rewritten = rewriteM3u8(body, targetUrl, workerOrigin);
    return new Response(rewritten, {
      headers: {
        ...CORS,
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Cache-Control': 'no-cache, no-store',
      },
    });
  }

  // Бинарный сегмент — стримим напрямую
  return new Response(res.body, {
    status: res.status,
    headers: {
      ...CORS,
      'Content-Type': ct || 'video/MP2T',
    },
  });
}
