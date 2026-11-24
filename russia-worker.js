// Копия боевого кода воркера (Cloudflare: russia-worker / birch-creek / oak-valley — код одинаковый). Версия 82.36.0.
// Файл собран esbuild (отсюда __name). Синхронизируется вручную: источник правды — Cloudflare, эту копию не деплоить вслепую.
var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// index.js
var VERSION = "82.49.0";
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
  tnt: "https://streaming.thestream.cyou/live/38.m3u8",   // 23.11.2026: ТНТ (основной, не ТНТ4) — тот же источник, что у Первого и НТВ; прежний fs.uplink.kz/tnt4 отвечает 403
  sts: "https://streaming.thestream.cyou/live/296.m3u8",   // 24.11.2026: СТС на thestream (кадр проверен, логотип СТС; 640x360, звук AAC — на iPhone без mp2-обхода); fs.uplink.kz с 23.11 отвечает 403 — оставлен запасным (ALT_CHAINS)   // 19.11.2026: СТС, РЕН ТВ, Матч ТВ, Пятница! — международные версии на том же CDN, что ТНТ4 и Карусель
  rentv: "https://fs.uplink.kz/ren/mono.m3u8?token=onlinetv",
  matchtv: "https://fs.uplink.kz/match/mono.m3u8?token=onlinetv",
  pyatnica: "https://fs.uplink.kz/bolshaya_pyatnica/mono.m3u8?token=onlinetv",
  soloviev: "https://stream.smotrim.ru/hls/solovievlive/playlist_3.m3u8",
  domkino: "https://streaming.thestream.cyou/live/44-req_offset_28000000-req_window_0-1k_v5.m3u8",
  kinokomediya: "https://cityeden.catcast.tv/content/41331/index.m3u8",
  kinodetektiv: "https://cityeden.catcast.tv/content/38398/index.m3u8",
  kinoekshn: "https://cityeden.catcast.tv/content/45268/index.m3u8",
  karusel: "https://stream.smotrim.ru/hls2/karusel/playlist_3.m3u8",
  news360: "https://live-vgtrksmotrim.cdnvideo.ru/vgtrksmotrim/smotrim-live-04-srt.smil/playlist.m3u8",
  floHockey: "https://amg02278-amg02278c2-flosports-worldwide-9916.playouts.now.amagi.tv/playlist.m3u8",
  floRacing: "https://amg02278-amg02278c1-flosports-worldwide-7592.playouts.now.amagi.tv/playlist.m3u8",
  redbull: "https://rbmn-live.akamaized.net/hls/live/590964/BoRB-AT/master.m3u8",
  unbeaten: "https://unbeaten-tcl.amagi.tv/playlist.m3u8",
  freesports: "https://mainstreammedia-worldoffreesportsintl-rakuten.amagi.tv/playlist.m3u8",
  // 15.11.2026: международные версии канала «Россия» (РТР-Планета) для Европы и США, официальный поток ВГТРК; подпись sign постоянная, дочерние плейлисты её не требуют
  rtrEuro: "https://stream.smotrim.ru/hls/planeta_rtr_euro/playlist.m3u8?entity=channel&id=510&sign=5c0ac65d75140fac2fd938d77c92138d",
  rtrUsa: "https://stream.smotrim.ru/hls/planeta_rtr_usa/playlist.m3u8?entity=channel&id=513&sign=3ac5d8e2db71ef7fc3d4becbff7512d8"
};
var SYNTH_MASTERS = {
  doverie: { dir: "hls2/doverie", ladder: [[1, 733], [2, 1332], [3, 1888]] },
  rossiya1: { dir: "hls2/russia_hd", ladder: [[1, 486], [2, 837], [3, 2501], [4, 4062], [6, 6990]] },
  rossiya24: { dir: "hls2/russia_24", ladder: [[1, 733], [2, 1365], [3, 2033]] },
  moskva24: { dir: "hls2/moscow_24", ladder: [[1, 764], [2, 1394], [3, 2045]] },
  kultura: { dir: "hls2/russia_k", ladder: [[1, 397], [2, 765], [3, 2273], [4, 3776], [5, 6907]] },
  spb: { dir: "hls2/ext_spbtv", ladder: [[1, 712], [2, 1302], [3, 1955], [4, 2847], [5, 8379]] },
  karusel: { dir: "hls2/karusel", ladder: [[1, 717], [2, 1304], [3, 1971]] },
  soloviev: { dir: "hls/solovievlive", ladder: [[1, 741], [2, 1372], [3, 2022], [4, 3067], [6, 8324]] }
};
var CINERAMA_MIRRORS = ["stream8", "stream1", "stream3"];   // 23.11.2026: порядок предпочтения для зрителя (см. fetchCinerama)
var CINERAMA_PATH = {
  t24: "1037/tracks-v1a1/mono.m3u8",
  istoriya: "1266/tracks-v1a1/mono.m3u8",
  kinohit: "1055/tracks-v1a1/mono.m3u8",
  retro: "1047/tracks-v1a1/mono.m3u8",
  kinopremiera: "1207/tracks-v1a1/mono.m3u8",
  viju: "1058/tracks-v1a1/mono.m3u8", kinokomediya: "1056/tracks-v2a1/mono.m3u8", kinodetektiv: "1059/tracks-v2a1/mono.m3u8",
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
  rossiya24: "1021/tracks-v1a1/mono.m3u8",
  // 19.11.2026: основной источник ТВЦ (tvc-hls.cdnvideo.ru) отдаёт 503 на плейлисты ступеней и из дата-центров, и с домашнего адреса (мониторинг: 48% неудач, 109 из 225 запусков) — основной теперь cinerama
  tvc: "1025/tracks-v1a1/mono.m3u8"
};
// 13.11.2026: в Болгарии (cf.country = BG) не открывается stream.smotrim.ru (проверено из браузера зрителя на /diag/), поэтому для этих каналов там отдаём
// запасной источник cinerama (один поток без ступеней). Только Болгария: из Нидерландов cinerama отдаёт 64-134 КБ/с при нужных ~340 КБ/с, а smotrim быстрый (0,6 с на сегмент).
// Принудительно: ?eu=1 (для проверки и для /stream-q). Если у cinerama нет ответа, выдаётся обычный источник.
var EU_ALT = {
  ntv: "1023/tracks-v1a1/mono.m3u8",
  rossiya1: "1020/tracks-v1a1/mono.m3u8",
  rossiya24: "1021/tracks-v1a1/mono.m3u8",
  tvc: "1025/tracks-v1a1/mono.m3u8",
  kultura: "1048/tracks-v1a1/mono.m3u8"
};
var EU_MIRRORS = ["stream8", "stream1", "stream3"];
// 15.11.2026: для Болгарии сначала thestream.cyou (тот же источник, что у Первого и НТВ, у мамы в Варне открывается), потом cinerama.
// Россия 1 (id 211) у них идёт как международная версия «Россия РТР»; Россия 24 (30), Карусель (232).
var EU_ALT_STREAM = {
  rossiya24: "https://streaming.thestream.cyou/live/30.m3u8",
  karusel: "https://streaming.thestream.cyou/live/232.m3u8"
};
function isEuRequest(request, url) {
  return url.searchParams.get("eu") === "1" || !!(request.cf && request.cf.country === "BG");
}
// 16.11.2026: запасные источники для автоматического переключения у зрителя (?alt=N, N = 1…длина цепочки; 0 или нет параметра — обычный источник).
// Мониторинг (rtv-monitor) показал, что у части зрителей из Германии, Греции, Эстонии, Болгарии и Македонии основной источник не открывается;
// monitor.js на странице при сбое сам просит следующий источник. ["ts", id] — streaming.thestream.cyou/live/<id>.m3u8, ["cin", путь] — cinerama.uz.
var ALT_CHAINS = {
  perviy: [["url", "https://fs.uplink.kz/perviy_kanal_sng/mono.m3u8?token=onlinetv"]],   // 19.11.2026: «Первый канал СНГ» (fs.uplink.kz, тот же CDN, что у Карусели и ТНТ4); основной источник thestream у зрителей из Швейцарии, США, Японии даёт ~2% неудач
  spb: [["dir", "#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=5690000,AVERAGE-BANDWIDTH=4550000,RESOLUTION=1280x720,CODECS=\"avc1.4d402a,mp4a.40.2\"\nhttps://live-topspb-geo.cdnvideo.ru/topspb-m4f/m4f-stream/tracks-v2a1/mono.ts.m3u8?hls_proxy_host=e4d0b9ee2560c8d72aceda831ebde9ea\n#EXT-X-STREAM-INF:BANDWIDTH=2970000,AVERAGE-BANDWIDTH=2370000,RESOLUTION=640x360,CODECS=\"avc1.4d401f,mp4a.40.2\"\nhttps://live-topspb-geo.cdnvideo.ru/topspb-m4f/m4f-stream/tracks-v3a1/mono.ts.m3u8?hls_proxy_host=e4d0b9ee2560c8d72aceda831ebde9ea\n"]],   // 19.11.2026: официальный поток телеканала (плеер на tvspb.ru/live, cdnvideo); воркер отдаёт готовый мастер с прямыми ссылками: из дата-центров Cloudflare cdnvideo отвечает 403, зритель берёт плейлисты и сегменты напрямую (CORS открыт, хеш hls_proxy_host постоянный)
  muzykaPervogo: [["url", "https://fs.uplink.kz/muzyka_pervogo/mono.m3u8?token=onlinetv"]],   // 19.11.2026: запасной источник (тот же CDN, что у Карусели и ТНТ4)
  rossiya1: [["cin", "1020/tracks-v1a1/mono.m3u8"]],
  sts: [["url", "https://fs.uplink.kz/sts/mono.m3u8?token=onlinetv"]],   // 24.11.2026: прежний основной (международная версия, 720x576), если оживёт   // 23.11.2026: убран thestream 211 — это международная «Россия РТР» (другой эфир и логотип), а не «Россия 1»; cinerama 1020 — тот же эфир «Россия 1»
  rossiya24: [["ts", 30], ["cin", "1021/tracks-v1a1/mono.m3u8"]],
  ntv: [["cin", "1023/tracks-v1a1/mono.m3u8"]],
  tvc: [["cin", "1025/tracks-v1a1/mono.m3u8", ["stream1", "stream3", "stream8"]]],   // 23.11.2026: cdnvideo (tvc-hls.cdnvideo.ru) всю неделю 17-23.11 отдаёт 503 на плейлисты ступеней — запасным теперь та же cinerama, но с другим порядком зеркал (основной берёт stream1 первым)
  rtrEuro: [["ts", 211]],   // 19.11.2026: 22% неудач (smotrim не открывается у части провайдеров Эстонии и др.); 211 — международная версия «Россия РТР» на thestream
  rtrUsa: [["ts", 211]],
  kultura: [["cin", "1048/tracks-v1a1/mono.m3u8"]],
  karusel: [["ts", 232]],
  domkino: [["ts", 44]],
  zvezda: [["ts", 748]],
  muztv: [["ts", 618]]
};
// 23.11.2026: в этих странах stream.smotrim.ru у большинства зрителей не открывается (мониторинг 17-23.11, каналы smotrim: основной источник / запасной):
// Эстония 14% / 93% успешных запусков, Франция 58% / 98%, Украина 79% / 93%. Там сразу отдаём первый запасной источник из ALT_CHAINS (как при ?alt=1),
// чтобы зритель не ждал провала основного. В остальных странах (Германия 96% / 86%, Литва 98% / 95%, Молдова 94% / 97%) порядок прежний.
var GEO_ALT_FIRST_CC = ["EE", "FR", "UA"];
var GEO_ALT_FIRST_CH = { rossiya1: 1, rossiya24: 1, rtrEuro: 1, rtrUsa: 1, kultura: 1, karusel: 1 };
var STITCHED_MASTERS = {  };
var UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";
// <receiver-html>
var RECEIVER_HTML = "<!doctype html>\n<html lang=\"ru\"><head><meta charset=\"utf-8\">\n<meta name=\"viewport\" content=\"width=device-width,initial-scale=1\">\n<title>Русское ТВ — приёмник</title>\n<style>\nhtml,body{margin:0;height:100%;background:#000;overflow:hidden;font-family:Arial,Helvetica,sans-serif}\n#stage{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;background:#000}\nvideo{background:#000}\n#msg{position:fixed;left:0;right:0;bottom:7%;text-align:center;color:#d8d8e8;font-size:3.2vh;text-shadow:0 0 8px #000;padding:0 6%}\n#msg b{display:block;font-size:4.4vh;margin-bottom:.6vh}\n</style></head><body>\n<div id=\"stage\"><video id=\"v\" autoplay playsinline></video></div>\n<div id=\"msg\"><b>Русское ТВ</b>Выберите канал на телефоне</div>\n<script src=\"//www.gstatic.com/cast/sdk/libs/caf_receiver/v3/cast_receiver_framework.js\"></script>\n<script src=\"https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js\"></script>\n<script>\n/* Приёмник Google Cast для russian-tv.com (19.11.2026). Зачем: стандартный приёмник Chromecast игнорирует метку формата пикселя (SAR) в видео,\n   и каналы 720x576 с «широким» кадром (СТС, РЕН ТВ, Пятница!) показываются как 4:3. Здесь поток играет hls.js, а кадр вписывается в рамку\n   с нужным соотношением сторон (object-fit: fill), поэтому картинка 16:9 остаётся 16:9 независимо от того, учёл декодер SAR или нет.\n   Телефон шлёт сообщение {cmd:'play', url, name} в пространство имён NS (sendMessage в cast.js и player-ui.js), стоп — завершение сеанса.\n   Проверка без телевизора: /receiver?url=<плейлист>&dar=1.7778 */\n(function () {\n  var NS = 'urn:x-cast:com.russian-tv.cast';\n  var v = document.getElementById('v'), msg = document.getElementById('msg'), hls = null, dar = 0, cur = '';\n  /* соотношение сторон кадра по каналу (идентификатор берётся из адреса /stream?channel=ID); нет в списке — как в потоке */\n  var DAR = { sts: 16 / 9, rentv: 16 / 9, pyatnica: 16 / 9 };\n  function say(t, sub) { msg.style.display = t ? 'block' : 'none'; msg.innerHTML = t ? ('<b></b>') : ''; if (t) { msg.firstChild.textContent = t; if (sub) msg.appendChild(document.createTextNode(sub)); } }\n  function layout() {\n    var W = window.innerWidth, H = window.innerHeight;\n    if (!dar) { v.style.width = '100%'; v.style.height = '100%'; v.style.objectFit = 'contain'; return; }\n    var bw = W, bh = W / dar; if (bh > H) { bh = H; bw = H * dar; }\n    v.style.width = bw + 'px'; v.style.height = bh + 'px'; v.style.objectFit = 'fill';\n  }\n  window.addEventListener('resize', layout);\n  function channelOf(u) { try { return new URL(u, location.href).searchParams.get('channel') || ''; } catch (e) { return ''; } }\n  function stop() { if (hls) { try { hls.destroy(); } catch (e) {} hls = null; } try { v.removeAttribute('src'); v.load(); } catch (e) {} }\n  function play(url, name, forceDar) {\n    if (!url) return;\n    stop(); cur = url; dar = forceDar || DAR[channelOf(url)] || 0; layout();\n    say(name || 'Русское ТВ', 'Загрузка…');\n    v.onplaying = function () { say(''); };\n    if (window.Hls && Hls.isSupported()) {\n      hls = new Hls({ lowLatencyMode: false, maxBufferLength: 20, manifestLoadingMaxRetry: 3, levelLoadingMaxRetry: 3, fragLoadingMaxRetry: 4 });\n      hls.loadSource(url); hls.attachMedia(v);\n      hls.on(Hls.Events.MANIFEST_PARSED, function () { var p = v.play(); if (p && p.catch) p.catch(function () {}); });\n      hls.on(Hls.Events.ERROR, function (e, d) {\n        if (!d.fatal) return;\n        if (d.type === Hls.ErrorTypes.NETWORK_ERROR) { say(name || 'Русское ТВ', 'Нет связи с потоком, пробую снова…'); setTimeout(function () { if (hls) hls.startLoad(); }, 2000); }\n        else if (d.type === Hls.ErrorTypes.MEDIA_ERROR) { hls.recoverMediaError(); }\n        else { say(name || 'Русское ТВ', 'Не удалось запустить канал'); }\n      });\n    } else {\n      v.src = url; var p = v.play(); if (p && p.catch) p.catch(function () {});\n    }\n  }\n  /* проверка в обычном браузере */\n  var q = new URLSearchParams(location.search);\n  if (q.get('url')) { play(q.get('url'), q.get('name') || '', parseFloat(q.get('dar') || '0') || 0); }\n  /* Cast */\n  try {\n    if (window.cast && cast.framework) {\n      var ctx = cast.framework.CastReceiverContext.getInstance();\n      var opts = new cast.framework.CastReceiverOptions();\n      opts.customNamespaces = {}; opts.customNamespaces[NS] = cast.framework.system.MessageType.JSON;\n      opts.disableIdleTimeout = true;\n      ctx.addCustomMessageListener(NS, function (ev) {\n        var d = ev && ev.data; if (!d) return;\n        if (d.cmd === 'play') { if (d.url === cur && hls) return; play(d.url, d.name, d.dar ? parseFloat(d.dar) : 0); }\n        else if (d.cmd === 'stop') { stop(); say('Русское ТВ', 'Выберите канал на телефоне'); }\n      });\n      ctx.start(opts);\n    }\n  } catch (e) {}\n})();\n</script></body></html>\n";
// </receiver-html>
var index_default = {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (path === "/receiver") {   // 19.11.2026: приёмник Google Cast (receiver.html)
      return new Response(RECEIVER_HTML, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-cache", "Access-Control-Allow-Origin": "*" } });
    }
    if (path === "/eu-debug") {
      // 13.11.2026: диагностика для /diag/: страна и дата-центр глазами воркера, состояние зеркал cinerama и время ответа каждого
      const dch = url.searchParams.get("channel") || "";
      const out = { version: VERSION, country: (request.cf && request.cf.country) || null, colo: (request.cf && request.cf.colo) || null, euRule: isEuRequest(request, url), channel: dch, alt: EU_ALT[dch] || null, mirrors: [] };
      if (EU_ALT[dch]) {
        const t0 = Date.now();
        const rs = await Promise.all(EU_MIRRORS.map(async (h) => { const t1 = Date.now(); const r = await probeCineramaMirror(h, EU_ALT[dch]); return { host: h, state: r.state, ms: Date.now() - t1, err: r.err || null }; }));
        out.mirrors = rs; out.totalMs = Date.now() - t0;
      }
      return new Response(JSON.stringify(out), { headers: { ...CORS, "Content-Type": "application/json", "Cache-Control": "no-store" } });
    }
    if (path === "/stream-q") {
      const qChannel = url.searchParams.get("channel") || "";
      const want = (parseInt(url.searchParams.get("q") || "0", 10) || 0) * 1e3;
      const qNative = url.searchParams.get("native") === "1" ? "&native=1" : "";
      const qEu = (isEuRequest(request, url) ? "&eu=1" : "") + (url.searchParams.get("alt") ? "&alt=" + encodeURIComponent(url.searchParams.get("alt")) : "");
      const inner = await index_default.fetch(new Request(url.origin + "/stream?channel=" + encodeURIComponent(qChannel) + qNative + qEu));
      if (!inner.ok) return inner;
      const text = await inner.text();
      const rows = text.split("\n");
      const pairs = [];
      const head = [];
      for (let i = 0; i < rows.length; i++) {
        if (rows[i].startsWith("#EXT-X-STREAM-INF")) { pairs.push([rows[i], rows[i + 1] || ""]); i++; }
        else if (!pairs.length && rows[i].trim()) head.push(rows[i]);
      }
      if (!want || !pairs.length) return new Response(text, { headers: { ...CORS, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" } });
      let best = pairs[0], bestD = Infinity;
      for (const p of pairs) {
        const m = p[0].match(/BANDWIDTH=(\d+)/);
        const d = Math.abs((m ? +m[1] : 0) - want);
        if (d < bestD) { bestD = d; best = p; }
      }
      return new Response(head.join("\n") + "\n" + best[0] + "\n" + best[1] + "\n", { headers: { ...CORS, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" } });
    }
    if (path === "/stream") {
      const channel = url.searchParams.get("channel");
      if (url.searchParams.get("vonly") === "1") {   // 20.11.2026: тест для iPhone — мастер-плейлист, где заявлено только видео (CODECS без звука); потоки со звуком mp2 (fs.uplink.kz) iPhone не декодирует
        return new Response("#EXTM3U\n#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1024x576,CODECS=\"avc1.64001e\"\n" + url.origin + "/stream?channel=" + encodeURIComponent(channel || "") + "\n", { headers: { ...CORS, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" } });
      }
      let altN = parseInt(url.searchParams.get("alt") || "0", 10);
      let geoMain = false;   // 23.11.2026 (82.47.0): в EE/FR/UA alt=0 — первый запасной, alt=1 — основной источник (раньше alt=1 давал тот же запасной и переключения не было)
      if (GEO_ALT_FIRST_CH[channel] && request.cf && GEO_ALT_FIRST_CC.includes(request.cf.country)) { if (altN === 0) altN = 1; else if (altN === 1) { altN = 0; geoMain = true; } }
      if (altN > 0 && ALT_CHAINS[channel] && ALT_CHAINS[channel][altN - 1]) {
        const [at, av] = ALT_CHAINS[channel][altN - 1];
        const ar = at === "dir" ? new Response(av, { headers: { ...CORS, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" } }) : at === "ts" ? await fetchPlaylistOnly(`https://streaming.thestream.cyou/live/${av}.m3u8`, url.origin) : at === "url" ? await fetchPlaylistOnly(av, url.origin) : await fetchCinerama(av, url.origin, ALT_CHAINS[channel][altN - 1][2] || EU_MIRRORS);
        if (ar.ok) return ar;
      }
      if (EU_ALT_STREAM[channel] && isEuRequest(request, url)) {
        const as = await fetchPlaylistOnly(EU_ALT_STREAM[channel], url.origin);
        if (as.ok) return as;
      }
      if (EU_ALT[channel] && isEuRequest(request, url)) {
        const alt = await fetchCinerama(EU_ALT[channel], url.origin, EU_MIRRORS); // Болгария (дата-центр SOF, 13.11.2026): stream1 и stream8 отвечают за 0,2-0,6 с; stream3 4+ с и «segment not downloadable»
        if (alt.ok) return alt;
      }
      if (channel === "ntv" && url.searchParams.get("native") === "1") {
        const nr = await fetchPlaylistOnly("https://cdn.ntv.ru/ntv0/playlist.m3u8", url.origin);
        if (nr.ok) return nr;
      }
      if (SYNTH_MASTERS[channel]) {
        const sm = await fetchSynthMaster(channel, url.origin);
        if (sm) return sm;
      }
      if (CINERAMA_PATH[channel]) {
        return fetchCinerama(CINERAMA_PATH[channel], url.origin);
      }
      if (STITCHED_MASTERS[channel]) { return fetchStitchedMaster(STITCHED_MASTERS[channel], url.origin); } const streamUrl = STREAMS[channel];
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
      return new Response("Proxy disabled \u2014 CF ToS compliance. Segments served directly.", {
        status: 410,
        headers: { ...CORS, "Content-Type": "text/plain" }
      });
    }
    if (path === "/version") {
      return new Response(JSON.stringify({ version: VERSION, channels: Object.keys(STREAMS).length + Object.keys(CINERAMA_PATH).length, mode: "cors-only" }), {
        headers: { ...CORS, "Content-Type": "application/json" }
      });
    }
    return new Response(`Russia TV Worker v${VERSION} \u2014 CORS-only mode`, { headers: CORS });
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
    // 20.11.2026: fs.uplink.kz иногда не отвечает больше 12 с (3 из 40 запросов к «Пятнице», у СТС и Матча тоже): таймаут 2,5 с и до четырёх попыток (ошибка сети, 5xx или 404)
    const tries = streamUrl.includes("fs.uplink.kz") ? 4 : 1;
    let lastErr = null;
    for (let a = 0; a < tries; a++) {
      try {
        const init = { headers: { "User-Agent": UA, "Referer": referer }, cf: { cacheTtl: 0, cacheEverything: false } };
        if (tries > 1) init.signal = AbortSignal.timeout(2500);
        const r = await fetch(streamUrl, init);
        if (r.ok || a === tries - 1 || (r.status !== 404 && r.status < 500)) { res = r; lastErr = null; break; }
        res = r;
      } catch (e2) { lastErr = e2; }
    }
    if (!res && lastErr) throw lastErr;
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
      cf: { cacheTtl: 0, cacheEverything: false },
      signal: AbortSignal.timeout(4000)
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
// 13.11.2026 (82.37.5): зеркала проверяются параллельно и с таймаутом 4 с. Раньше они шли по очереди без таймаута: если первое зеркало
// «зависало» из дата-центра Cloudflare (Болгария), ответ воркера занимал больше 10 с, и hls.js давал levelLoadTimeOut.
async function probeCineramaMirror(host, path) {
  const streamUrl = `https://${host}.cinerama.uz/${path}`;
  try {
    const res = await fetch(streamUrl, {
      headers: { "User-Agent": UA, "Referer": "https://russian-tv.com/" },
      cf: { cacheTtl: 0, cacheEverything: false },
      signal: AbortSignal.timeout(4000)
    });
    if (!res.ok) return { host, state: "bad", err: { mirror: host, status: res.status } };
    if (res.url && res.url.includes("/blocked/")) return { host, state: "bad", err: { mirror: host, error: "redirected to cinerama.uz /blocked/ stub" } };
    const body = await res.text();
    if (isSelfLoopingMaster(body, streamUrl)) return { host, state: "bad", err: { mirror: host, error: "self-referencing master (datacenter-IP block)" } };
    if (!await segmentReachable(body, streamUrl)) return { host, state: "unprobed", body, streamUrl, err: { mirror: host, error: "recent segment not downloadable (mirror out of sync)" } };
    const latestMs = latestProgramDateTimeMs(body);
    if (latestMs !== null && Date.now() - latestMs > STALE_THRESHOLD_MS) {
      const age = Date.now() - latestMs;
      return { host, state: "stale", age, body, streamUrl, err: { mirror: host, error: `stale playlist (last segment ${Math.round(age / 1e3)}s old)` } };
    }
    return { host, state: "good", body, streamUrl };
  } catch (e) {
    return { host, state: "bad", err: { mirror: host, error: e.message } };
  }
}
__name(probeCineramaMirror, "probeCineramaMirror");
async function fetchCinerama(path, workerOrigin, mirrors) {
  // 23.11.2026 (82.47.0): зритель получает мастер-плейлист со ссылкой ПРЯМО на плейлист зеркала (у cinerama есть CORS), а не копию от воркера.
  // Причина: 23.11 stream1 отвечает 502, stream8 для адресов дата-центров Cloudflare отдаёт заглушку /blocked/, и воркер выдавал медленный stream3
  // (6-секундный сегмент грузится 6-11 с — постоянные остановки), хотя с домашних адресов stream8 быстрый (сегмент за ~1 с).
  // Порядок предпочтения: stream8 (если воркер видит только заглушку для дата-центров — считаем рабочим для зрителя), stream1, stream3.
  // Зеркала с ошибкой HTTP/сети отбрасываются. Второе зеркало добавлено как резервный вариант (hls.js и Safari переключаются на него при ошибке).
  const pref = mirrors || CINERAMA_MIRRORS;
  const results = await Promise.all(pref.map((h) => probeCineramaMirror(h, path)));
  const usable = (r) => r.state === "good" || r.state === "unprobed" || (r.state === "stale" && r.age < 5 * 60 * 1e3) || (r.err && /blocked/.test(r.err.error || ""));
  const ok = results.filter(usable).map((r) => r.host);
  if (!ok.length) {
    const lastError = results.map((r) => r.err).filter(Boolean).pop() || null;
    return new Response(JSON.stringify({ error: "All cinerama.uz mirrors blocked, unavailable or stale", path, lastError }), { status: 502, headers: { ...CORS, "Content-Type": "application/json" } });
  }
  const lines = ["#EXTM3U"];
  ok.slice(0, 2).forEach((h, k) => { lines.push(`#EXT-X-STREAM-INF:BANDWIDTH=1500000`, `https://${h}.cinerama.uz/${path}`); });
  return new Response(lines.join("\n") + "\n", { headers: { ...CORS, "Content-Type": "application/vnd.apple.mpegurl", "Cache-Control": "no-store" } });
}
__name(fetchCinerama, "fetchCinerama");
function firstVariantUri(b) { var l = b.split("\n").map(function (x) { return x.trim(); }).filter(Boolean); var i = l.findIndex(function (x) { return x.startsWith("#EXT-X-STREAM-INF"); }); if (i === -1) return null; var v = l[i + 1]; if (!v || v.startsWith("#")) return null; return v; } async function fetchStitchedMaster(masterUrl, workerOrigin) { const H = { headers: { "User-Agent": UA, "Referer": new URL(masterUrl).origin + "/" }, cf: { cacheTtl: 0, cacheEverything: false } }; const J = { ...CORS, "Content-Type": "application/json" }; let res; try { res = await fetch(masterUrl, H); } catch (e) { return new Response(JSON.stringify({ error: e.message, masterUrl }), { status: 502, headers: J }); } if (!res.ok) return new Response("Source returned " + res.status, { status: res.status, headers: CORS }); const variantUri = firstVariantUri(await res.text()); if (!variantUri) return new Response(JSON.stringify({ error: "No variant found in master playlist", masterUrl }), { status: 502, headers: J }); const variantUrl = resolveUrl(baseDir(masterUrl), variantUri); let vres; try { vres = await fetch(variantUrl, H); } catch (e) { return new Response(JSON.stringify({ error: e.message, variantUrl }), { status: 502, headers: J }); } if (!vres.ok) return new Response("Variant source returned " + vres.status, { status: vres.status, headers: CORS }); const body = await vres.text(); const latestMs = latestProgramDateTimeMs(body); if (latestMs !== null && Date.now() - latestMs > STALE_THRESHOLD_MS) return new Response(JSON.stringify({ error: "Stale playlist", variantUrl }), { status: 502, headers: J }); return buildPlaylistResponse(body, variantUrl, workerOrigin); } export {
  index_default as default
};
