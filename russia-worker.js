var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.js
var VERSION = "82.35.0";
var CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "*"
};
var STREAMS = {
  perviy: "https://streaming.thestream.cyou/live/210.m3u8",
  rossiya1: "https://stream.smotrim.ru/hls2/russia_hd/playlist_2.m3u8",
  ntv: "https://streaming.thestream.cyou/live/213.m3u8",
  pyatyy: "https://cdn4.skygo.mn/live/disk1/Channel_5/HLSv3-FTA/Channel_5.m3u8",
  tvc: "https://tvc-hls.cdnvideo.ru/tvc-res/smil:vd9221.smil/playlist.m3u8",
  zvezda: "https://tvchannelstream1.tvzvezda.ru/cdn/tvzvezda/playlist_sdhigh.m3u8",
  mir: "https://tvcdn01.oktv.kz/tv/mir/tracks-v1a1/mono.m3u8",
  ch360: "https://live-vgtrksmotrim.cdnvideo.ru/vgtrksmotrim/smotrim-live-03-srt.smil/playlist.m3u8",
  moskva24: "https://stream.smotrim.ru/hls2/moscow_24/playlist_3.m3u8",
  kultura: "https://stream.smotrim.ru/hls2/russia_k/playlist_5.m3u8",
  soyuz: "https://hls-tvsoyuz.cdnvideo.ru/tvsoyuz/soyuz/playlist.m3u8",
  moymir: "https://moymir.ru/hls/onair.m3u8",
  prima: "https://tele2dvrnat01-02.cdnvideo.ru/stream/NAT_Prima/hls/index.m3u8",
  sportivnyy: "https://live-3.otcnet.ru/sportivny/index.m3u8",
  detektiv: "https://live-vgtrksmotrim.cdnvideo.ru/vgtrksmotrim/smotrim-live-01.smil/playlist.m3u8",
  spb: "https://stream.smotrim.ru/hls2/ext_spbtv/playlist_5.m3u8",
  karuselIntl: "https://fs.uplink.kz/karusel/mono.m3u8?token=onlinetv",
  muzsoyuz: "https://hls-tvsoyuz.cdnvideo.ru/tvsoyuz2/muzsoyuz.6fw0-58xp-acts-esy0/playlist.m3u8",
  rtdoc: "https://rt-doc.rttv.com/dvr/rtdru/playlist.m3u8",
  bigplanet: "https://fs.uplink.kz/big_planet/mono.m3u8?token=onlinetv",
  bober: "https://fs.uplink.kz/bober/mono.m3u8?token=onlinetv",
  stranafm: "https://live-stranafm.cdnvideo.ru/stranafm/smil:stranafm.smil/playlist.m3u8",
  vestifm: "https://stream.smotrim.ru/hls2/vesti_fm/playlist_4.m3u8",
  tnt: "https://fs.uplink.kz/tnt4/mono.m3u8?token=onlinetv",
  soloviev: "https://stream.smotrim.ru/hls/solovievlive/playlist_3.m3u8",
  domkino: "https://streaming.thestream.cyou/live/44-req_offset_28000000-req_window_0-1k_v5.m3u8",
  karusel: "https://stream.smotrim.ru/hls2/karusel/playlist_3.m3u8",
  floHockey: "https://amg02278-amg02278c2-flosports-worldwide-9916.playouts.now.amagi.tv/playlist.m3u8",
  floRacing: "https://amg02278-amg02278c1-flosports-worldwide-7592.playouts.now.amagi.tv/playlist.m3u8",
  redbull: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  unbeaten: "https://unbeaten-tcl.amagi.tv/playlist.m3u8",
  freesports: "https://mainstreammedia-worldoffreesportsintl-rakuten.amagi.tv/playlist.m3u8"
};
var SYNTH_MASTERS = {
  rossiya1: { dir: "hls2/russia_hd", ladder: [[1, 486], [2, 837], [3, 2501], [4, 4062], [6, 6990]] },
  rossiya24: { dir: "hls2/russia_24", ladder: [[1, 733], [2, 1365], [3, 2033]] },
  moskva24: { dir: "hls2/moscow_24", ladder: [[1, 764], [2, 1394], [3, 2045]] },
  kultura: { dir: "hls2/russia_k", ladder: [[1, 397], [2, 765], [3, 2273], [4, 3776], [5, 6907]] },
  spb: { dir: "hls2/ext_spbtv", ladder: [[1, 712], [2, 1302], [3, 1955], [4, 2847], [5, 8379]] },
  karusel: { dir: "hls2/karusel", ladder: [[1, 717], [2, 1304], [3, 1971]] },
  soloviev: { dir: "hls/solovievlive", ladder: [[1, 741], [2, 1372], [3, 2022], [4, 3067], [6, 8324]] }
};
var CINERAMA_MIRRORS = ["stream1", "stream3", "stream8"];
var CINERAMA_PATH = {
  t24: "1037/tracks-v1a1/mono.m3u8",
  istoriya: "1266/tracks-v1a1/mono.m3u8",
  kinohit: "1055/tracks-v1a1/mono.m3u8",
  retro: "1047/tracks-v1a1/mono.m3u8",
  kinopremiera: "1207/tracks-v1a1/mono.m3u8",
  viju: "1058/tracks-v1a1/mono.m3u8",
  kinokomediya: "1056/tracks-v2a1/mono.m3u8",
  kinodetektiv: "1059/tracks-v2a1/mono.m3u8",
  nasheKino: "1051/tracks-v1a1/mono.m3u8",
  rodnoeKino: "1052/tracks-v1a1/mono.m3u8",
  kinopokaz: "1057/tracks-v1a1/mono.m3u8",
  kinosvidanie: "1203/tracks-v1a1/mono.m3u8",
  indiyskoekino: "1060/tracks-v1a1/mono.m3u8",
  mult: "1246/tracks-v1a1/mono.m3u8",
  muztv: "1200/tracks-v1a1/mono.m3u8",
  muzykaPervogo: "1201/tracks-v1a1/mono.m3u8",
  rutv: "1202/tracks-v1a1/mono.m3u8",
  ohotarybalka: "1038/tracks-v1a1/mono.m3u8",
  zagorodnaya: "1044/tracks-v1a1/mono.m3u8",
  unikum: "1033/tracks-v1a1/mono.m3u8",
  vijuSport: "1229/tracks-v1a1/mono.m3u8",
  m1mma: "1226/mono.m3u8",
  domkino: "1054/tracks-v1a1/mono.m3u8",
  priklyucheniya: "1420/tracks-v1a1/mono.m3u8",
  ryzhiy: "1407/tracks-v1a1/mono.m3u8",
  tochka: "1031/tracks-v1a1/mono.m3u8",
  planeta: "1250/tracks-v1a1/mono.m3u8",
  zoopark: "1417/tracks-v1a1/mono.m3u8",
  drive: "1421/tracks-v1a1/mono.m3u8",
  zhivotnye: "1426/tracks-v1a1/mono.m3u8",
  zdorovoe: "1428/tracks-v1a1/mono.m3u8",
  fonmusic: "1272/tracks-v1a1/mono.m3u8",
  tracesport: "1274/tracks-v1a1/mono.m3u8",
  rossiya24: "1021/tracks-v1a1/mono.m3u8"
};
var STITCHED_MASTERS = {
  
};
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
var index_default = {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (path === "/stream") {
      const channel = url.searchParams.get("channel");
      if (SYNTH_MASTERS[channel]) {
        const sm = await fetchSynthMaster(channel, url.origin);
        if (sm) return sm;
      }
      if (CINERAMA_PATH[channel]) {
        return fetchCinerama(CINERAMA_PATH[channel], url.origin);
      }
      if (STITCHED_MASTERS[channel]) {
        return fetchStitchedMaster(STITCHED_MASTERS[channel], url.origin);
      }
      const streamUrl = STREAMS[channel];
      if (!streamUrl) {
        return new Response(JSON.stringify({ error: "Channel not found", channel }), {
          status: 404,
          headers: { ...CORS, "Content-Type": "application/json" }
        });
      }
      return fetchPlaylistOnly(streamUrl, url.origin);
    }
    if (path === "/playlist") {
      const target = url.searchParams.get("url");
      if (!target) return new Response("Missing url", { status: 400, headers: CORS });
      if (isSegment(target)) {
        return new Response("Segment proxying disabled (CF ToS)", { status: 403, headers: CORS });
      }
      return fetchPlaylistOnly(target, url.origin);
    }
    if (path === "/proxy") {
      return new Response("Proxy disabled — CF ToS compliance. Segments served directly.", {
        status: 410,
        headers: { ...CORS, "Content-Type": "text/plain" }
      });
    }
    if (path === "/version") {
      return new Response(JSON.stringify({ version: VERSION, channels: Object.keys(STREAMS).length + Object.keys(CINERAMA_PATH).length + Object.keys(STITCHED_MASTERS).length, mode: "cors-only" }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
    return new Response(`Russia TV Worker v${VERSION} — CORS-only mode`, { headers: CORS });
  }
};
function isSegment(url) {
  return /\.(ts|aac|mp4|m4s|fmp4)([?#]|$)/i.test(url);
}
__name(isSegment, "isSegment");
function resolveUrl(base, relative) {
  if (!relative) return base;
  if (relative.startsWith("http://") || relative.startsWith("https://")) return relative;
  try {
    let result = new URL(relative, base).href;
    result = result.replace(/\/([^\/]*[a-zA-Z][^\/]*)\/\1\//, "/$1/");
    return result;
  } catch {
    return relative;
  }
}
__name(resolveUrl, "resolveUrl");
function baseDir(url) {
  return url.substring(0, url.lastIndexOf("/") + 1);
}
__name(baseDir, "baseDir");
function isSelfLoopingMaster(content, sourceUrl) {
  const lines = content.split("\n").map((l) => l.trim()).filter(Boolean);
  const streamInfIdx = lines.findIndex((l) => l.startsWith("#EXT-X-STREAM-INF"));
  if (streamInfIdx === -1) return false;
  const variantLine = lines[streamInfIdx + 1];
  if (!variantLine || variantLine.startsWith("#")) return false;
  const base = baseDir(sourceUrl);
  const resolvedVariant = resolveUrl(base, variantLine);
  const norm = /* @__PURE__ */ __name((u) => u.split("?")[0].replace(/^https?:\/\//, ""), "norm");
  if (norm(resolvedVariant) !== norm(sourceUrl)) return false;
  return lines.filter((l) => !l.startsWith("#")).length === 1;
}
__name(isSelfLoopingMaster, "isSelfLoopingMaster");
function rewritePlaylist(content, sourceUrl, workerOrigin) {
  const base = baseDir(sourceUrl);
  const lines = content.split("\n");
  const out = [];
  for (const rawLine of lines) {
    const line = rawLine.trimEnd();
    if (line.startsWith("#EXT-X-MEDIA") && line.includes("TYPE=SUBTITLES")) continue;
    if (line === "" || line.startsWith("#")) {
      let fixed = line.replace(/URI="([^"]+)"/g, (_, uri) => {
        const abs = resolveUrl(base, uri);
        if (isSegment(abs)) return `URI="${abs}"`;
        return `URI="${workerOrigin}/playlist?url=${encodeURIComponent(abs)}"`;
      });
      if (fixed.startsWith("#EXT-X-STREAM-INF")) {
        fixed = fixed.replace(/,?SUBTITLES="[^"]*"/, "");
      }
      out.push(fixed);
    } else {
      const abs = resolveUrl(base, line);
      if (isSegment(abs)) {
        out.push(abs);
      } else {
        out.push(`${workerOrigin}/playlist?url=${encodeURIComponent(abs)}`);
      }
    }
  }
  return out.join("\n");
}
__name(rewritePlaylist, "rewritePlaylist");
async function fetchPlaylistOnly(streamUrl, workerOrigin) {
  let res;
  try {
    const referer = streamUrl.includes("cinerama.uz") ? "https://russian-tv.com/" : new URL(streamUrl).origin + "/";
    res = await fetch(streamUrl, {
      headers: { "User-Agent": UA, "Referer": referer },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 502,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
  if (!res.ok) {
    return new Response(`Source returned ${res.status}`, { status: res.status, headers: CORS });
  }
  const body = await res.text();
  if (isSelfLoopingMaster(body, streamUrl)) {
    return new Response(
      JSON.stringify({ error: "Source returned a self-referencing master playlist (likely datacenter-IP block)", streamUrl }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
  return buildPlaylistResponse(body, streamUrl, workerOrigin);
}
__name(fetchPlaylistOnly, "fetchPlaylistOnly");
function buildPlaylistResponse(body, streamUrl, workerOrigin) {
  const rewritten = rewritePlaylist(body, streamUrl, workerOrigin);
  return new Response(rewritten, {
    headers: {
      ...CORS,
      "Content-Type": "application/vnd.apple.mpegurl",
      "Cache-Control": "no-store"
    }
  });
}
__name(buildPlaylistResponse, "buildPlaylistResponse");
var STALE_THRESHOLD_MS = 120 * 1e3;
function latestProgramDateTimeMs(content) {
  const matches = content.match(/#EXT-X-PROGRAM-DATE-TIME:([^\r\n]+)/g);
  if (!matches || !matches.length) return null;
  let latest = null;
  for (const m of matches) {
    const iso = m.slice("#EXT-X-PROGRAM-DATE-TIME:".length).trim();
    const t = Date.parse(iso);
    if (!Number.isNaN(t) && (latest === null || t > latest)) latest = t;
  }
  return latest;
}
__name(latestProgramDateTimeMs, "latestProgramDateTimeMs");
async function segmentReachable(playlistBody, playlistUrl) {
  const lines = playlistBody.split("\n").map((l) => l.trim()).filter((l) => l && !l.startsWith("#"));
  const last = lines.length > 1 ? lines[lines.length - 2] : lines[0];
  if (!last || !isSegment(last)) return true;
  try {
    const r = await fetch(resolveUrl(baseDir(playlistUrl), last), {
      headers: { "User-Agent": UA, "Referer": "https://russian-tv.com/", "Range": "bytes=0-0" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    return r.status === 200 || r.status === 206;
  } catch {
    return false;
  }
}
__name(segmentReachable, "segmentReachable");
async function fetchSynthMaster(channel, workerOrigin) {
  const cfg = SYNTH_MASTERS[channel];
  if (!cfg) return null;
  const variants = cfg.ladder.map(([n, kbps]) => ({ url: `https://stream.smotrim.ru/${cfg.dir}/playlist_${n}.m3u8`, bw: kbps * 1e3 }));
  try {
    const probe = await fetch(variants[variants.length > 1 ? 1 : 0].url, {
      headers: { "User-Agent": UA, "Referer": "https://stream.smotrim.ru/" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
    if (!probe.ok) return null;
  } catch {
    return null;
  }
  let body = "#EXTM3U\n#EXT-X-VERSION:3\n";
  for (const v of variants) {
    body += `#EXT-X-STREAM-INF:BANDWIDTH=${v.bw},AVERAGE-BANDWIDTH=${v.bw}\n${workerOrigin}/playlist?url=${encodeURIComponent(v.url)}\n`;
  }
  return new Response(body, { headers: { ...CORS, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" } });
}
__name(fetchSynthMaster, "fetchSynthMaster");
async function fetchCinerama(path, workerOrigin) {
  let lastError = null;
  let staleFallback = null;
  let unprobedFallback = null;
  for (const host of CINERAMA_MIRRORS) {
    const streamUrl = `https://${host}.cinerama.uz/${path}`;
    let res;
    try {
      res = await fetch(streamUrl, {
        headers: { "User-Agent": UA, "Referer": "https://russian-tv.com/" },
        cf: { cacheTtl: 0, cacheEverything: false }
      });
    } catch (e) {
      lastError = { mirror: host, error: e.message };
      continue;
    }
    if (!res.ok) {
      lastError = { mirror: host, status: res.status };
      continue;
    }
    if (res.url && res.url.includes("/blocked/")) {
      lastError = { mirror: host, error: "redirected to cinerama.uz /blocked/ stub" };
      continue;
    }
    const body = await res.text();
    if (isSelfLoopingMaster(body, streamUrl)) {
      lastError = { mirror: host, error: "self-referencing master (datacenter-IP block)" };
      continue;
    }
    if (!await segmentReachable(body, streamUrl)) {
      lastError = { mirror: host, error: "recent segment not downloadable (mirror out of sync)" };
      if (!unprobedFallback) unprobedFallback = { body, streamUrl };
      continue;
    }
    const latestMs = latestProgramDateTimeMs(body);
    if (latestMs !== null && Date.now() - latestMs > STALE_THRESHOLD_MS) {
      const age = Date.now() - latestMs;
      lastError = { mirror: host, error: `stale playlist (last segment ${Math.round(age / 1e3)}s old)` };
      if (!staleFallback || age < staleFallback.age) staleFallback = { age, body, streamUrl };
      continue;
    }
    return buildPlaylistResponse(body, streamUrl, workerOrigin);
  }
  if (unprobedFallback) {
    return buildPlaylistResponse(unprobedFallback.body, unprobedFallback.streamUrl, workerOrigin);
  }
  if (staleFallback && staleFallback.age < 5 * 60 * 1e3) {
    return buildPlaylistResponse(staleFallback.body, staleFallback.streamUrl, workerOrigin);
  }
  return new Response(
    JSON.stringify({ error: "All cinerama.uz mirrors blocked, unavailable or stale", path, lastError }),
    { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
  );
}
__name(fetchCinerama, "fetchCinerama");
function firstVariantUri(masterBody) {
  const lines = masterBody.split("\n").map((l) => l.trim()).filter(Boolean);
  const idx = lines.findIndex((l) => l.startsWith("#EXT-X-STREAM-INF"));
  if (idx === -1) return null;
  const variantLine = lines[idx + 1];
  if (!variantLine || variantLine.startsWith("#")) return null;
  return variantLine;
}
__name(firstVariantUri, "firstVariantUri");
async function fetchStitchedMaster(masterUrl, workerOrigin) {
  let res;
  try {
    res = await fetch(masterUrl, {
      headers: { "User-Agent": UA, "Referer": new URL(masterUrl).origin + "/" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, masterUrl }), {
      status: 502,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
  if (!res.ok) {
    return new Response(`Source returned ${res.status}`, { status: res.status, headers: CORS });
  }
  const masterBody = await res.text();
  const variantUri = firstVariantUri(masterBody);
  if (!variantUri) {
    return new Response(
      JSON.stringify({ error: "No variant found in master playlist", masterUrl }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
  const variantUrl = resolveUrl(baseDir(masterUrl), variantUri);
  let vres;
  try {
    vres = await fetch(variantUrl, {
      headers: { "User-Agent": UA, "Referer": new URL(masterUrl).origin + "/" },
      cf: { cacheTtl: 0, cacheEverything: false }
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message, variantUrl }), {
      status: 502,
      headers: { ...CORS, "Content-Type": "application/json" }
    });
  }
  if (!vres.ok) {
    return new Response(`Variant source returned ${vres.status}`, { status: vres.status, headers: CORS });
  }
  const body = await vres.text();
  const latestMs = latestProgramDateTimeMs(body);
  if (latestMs !== null && Date.now() - latestMs > STALE_THRESHOLD_MS) {
    return new Response(
      JSON.stringify({ error: `Stale playlist (last segment ${Math.round((Date.now() - latestMs) / 1e3)}s old)`, variantUrl }),
      { status: 502, headers: { ...CORS, "Content-Type": "application/json" } }
    );
  }
  return buildPlaylistResponse(body, variantUrl, workerOrigin);
}
__name(fetchStitchedMaster, "fetchStitchedMaster");
export {
  index_default as default
};
