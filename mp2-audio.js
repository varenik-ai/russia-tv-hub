/* mp2-audio.js — воспроизведение каналов со звуком MPEG Audio Layer II (mp2) на iPhone/iPad (20.11.2026).
   Проблема: потоки fs.uplink.kz (СТС, РЕН ТВ, Пятница!, Матч ТВ) имеют звук mp2. Встроенный плеер iPhone и MediaSource (hls.js) его не принимают:
   видео играет ~6 секунд (первый сегмент), затем «Media failed to decode». AAC и «без звука» играют (тест на iPhone 20.11.2026).
   Обход прямо в браузере, без сервера:
   1) загрузчик фрагментов hls.js (fLoader) берёт каждый сегмент MPEG-TS, вырезает из него звук mp2 (и служебные потоки: телетекст и т. д.),
      пересобирает PMT (таблицу программы) только с видео и отдаёт hls.js «видео-только» TS;
   2) звук mp2 декодируется на JS (mp2-decoder.js; decodeAudioData для «сырого» mp2 не работает ни в Chromium, ни, судя по всему, надёжно в Safari) и играет через WebAudio;
   3) синхронизация: время кадра видео (video.currentTime) связано с меткой PTS первого видеокадра; звук ставится по расписанию на ≤1,2 с вперёд,
      при паузе/буферизации/перемотке очередь сбрасывается и собирается заново.
   API: MP2Audio.loader(Hls) -> класс для config.fLoader; MP2Audio.attach(video) вызывать при старте (в обработчике касания), MP2Audio.detach() при остановке. */
(function (root) {
  'use strict';
  /* ---------- MPEG-TS ---------- */
  var CRC_T = null;
  function crc32mpeg(bytes) {
    if (!CRC_T) { CRC_T = new Uint32Array(256); for (var i = 0; i < 256; i++) { var c = i << 24; for (var k = 0; k < 8; k++) c = (c & 0x80000000) ? ((c << 1) ^ 0x04C11DB7) : (c << 1); CRC_T[i] = c >>> 0; } }
    var crc = 0xFFFFFFFF;
    for (var j = 0; j < bytes.length; j++) crc = ((crc << 8) ^ CRC_T[((crc >>> 24) ^ bytes[j]) & 0xFF]) >>> 0;
    return crc >>> 0;
  }
  function readPts(b, o) {   // 33-битная метка PTS из 5 байт (o — начало)
    return ((b[o] & 0x0E) * 536870912) + (b[o + 1] * 4194304) + ((b[o + 2] & 0xFE) * 16384) + (b[o + 3] * 128) + (b[o + 4] >> 1);
  }
  function buildPmt(origProg, origVer, pcrPid, vType, vPid, pmtPid, cc) {
    var sl = 18, sec = new Uint8Array(3 + sl - 4);   // без CRC
    sec[0] = 0x02; sec[1] = 0xB0 | ((sl >> 8) & 0x0F); sec[2] = sl & 0xFF;
    sec[3] = origProg >> 8; sec[4] = origProg & 0xFF; sec[5] = origVer; sec[6] = 0; sec[7] = 0;
    sec[8] = 0xE0 | ((pcrPid >> 8) & 0x1F); sec[9] = pcrPid & 0xFF; sec[10] = 0xF0; sec[11] = 0x00;
    sec[12] = vType; sec[13] = 0xE0 | ((vPid >> 8) & 0x1F); sec[14] = vPid & 0xFF; sec[15] = 0xF0; sec[16] = 0x00;
    var crc = crc32mpeg(sec.subarray(0, 17));
    var pkt = new Uint8Array(188); pkt.fill(0xFF);
    pkt[0] = 0x47; pkt[1] = 0x40 | ((pmtPid >> 8) & 0x1F); pkt[2] = pmtPid & 0xFF; pkt[3] = 0x10 | (cc & 0x0F); pkt[4] = 0x00;
    pkt.set(sec.subarray(0, 17), 5);
    pkt[22] = (crc >>> 24) & 0xFF; pkt[23] = (crc >>> 16) & 0xFF; pkt[24] = (crc >>> 8) & 0xFF; pkt[25] = crc & 0xFF;
    return pkt;
  }
  /* Возвращает {video: ArrayBuffer (TS без звука), es: Uint8Array (звук mp2), audioPts, videoPts} или null, если звука mp2 в сегменте нет */
  function processTs(buf) {
    var u = new Uint8Array(buf), n = u.length, start = -1, i;
    for (i = 0; i < 188 && i + 376 < n; i++) { if (u[i] === 0x47 && u[i + 188] === 0x47 && u[i + 376] === 0x47) { start = i; break; } }
    if (start < 0) return null;
    var pmtPid = -1, vPid = -1, aPid = -1, vType = 0, pcrPid = -1, prog = 1, ver = 0xC1, p, pid, pusi, afc, o, po, sl, q, end;
    for (p = start; p + 188 <= n; p += 188) {
      pid = ((u[p + 1] & 0x1F) << 8) | u[p + 2]; pusi = u[p + 1] & 0x40; afc = (u[p + 3] >> 4) & 3; o = p + 4;
      if (afc & 2) o += 1 + u[p + 4];
      if (!(afc & 1) || !pusi) continue;
      if (pid === 0 && pmtPid < 0) {
        po = o + 1 + u[o]; sl = ((u[po + 1] & 0x0F) << 8) | u[po + 2]; q = po + 8; end = po + 3 + sl - 4;
        while (q + 4 <= end) { var pn = (u[q] << 8) | u[q + 1], pp = ((u[q + 2] & 0x1F) << 8) | u[q + 3]; if (pn !== 0) { pmtPid = pp; break; } q += 4; }
      } else if (pid === pmtPid && vPid < 0) {
        po = o + 1 + u[o]; sl = ((u[po + 1] & 0x0F) << 8) | u[po + 2];
        prog = (u[po + 3] << 8) | u[po + 4]; ver = u[po + 5]; pcrPid = ((u[po + 8] & 0x1F) << 8) | u[po + 9];
        var pil = ((u[po + 10] & 0x0F) << 8) | u[po + 11]; q = po + 12 + pil; end = po + 3 + sl - 4;
        while (q + 5 <= end) {
          var st = u[q], es = ((u[q + 1] & 0x1F) << 8) | u[q + 2], il = ((u[q + 3] & 0x0F) << 8) | u[q + 4];
          if ((st === 0x1B || st === 0x24) && vPid < 0) { vPid = es; vType = st; }
          else if ((st === 0x03 || st === 0x04) && aPid < 0) aPid = es;
          q += 5 + il;
        }
        break;
      }
    }
    if (vPid < 0 || aPid < 0 || pmtPid < 0) return null;
    var out = new Uint8Array(n), on = 0, aParts = [], aCur = null, videoPts = -1;
    function flushAudio() { if (aCur) { aParts.push(aCur); aCur = null; } }
    for (p = start; p + 188 <= n; p += 188) {
      pid = ((u[p + 1] & 0x1F) << 8) | u[p + 2]; pusi = u[p + 1] & 0x40; afc = (u[p + 3] >> 4) & 3; o = p + 4;
      if (afc & 2) o += 1 + u[p + 4];
      if (pid === 0 || pid === vPid) {
        out.set(u.subarray(p, p + 188), on); on += 188;
        if (pid === vPid && pusi && videoPts < 0 && (afc & 1) && u[o] === 0 && u[o + 1] === 0 && u[o + 2] === 1 && (u[o + 7] & 0x80)) videoPts = readPts(u, o + 9);
      } else if (pid === pmtPid) {
        if (pusi) { out.set(buildPmt(prog, ver, vPid, vType, vPid, pmtPid, u[p + 3]), on); on += 188; }
      } else if (pid === aPid && (afc & 1)) {
        if (pusi) { flushAudio(); aCur = []; }
        if (aCur) aCur.push(u.subarray(o, p + 188));
      }
    }
    flushAudio();
    var chunks = [], total = 0, audioPts = -1;
    for (i = 0; i < aParts.length; i++) {
      var parts = aParts[i], len = 0, k, pb;
      for (k = 0; k < parts.length; k++) len += parts[k].length;
      pb = new Uint8Array(len); var w = 0; for (k = 0; k < parts.length; k++) { pb.set(parts[k], w); w += parts[k].length; }
      if (len < 14 || pb[0] !== 0 || pb[1] !== 0 || pb[2] !== 1) continue;
      var hl = pb[8], payload = pb.subarray(9 + hl);
      if ((pb[7] & 0x80) && audioPts < 0) audioPts = readPts(pb, 9);
      chunks.push(payload); total += payload.length;
    }
    if (!total || audioPts < 0) return null;
    var es2 = new Uint8Array(total), z = 0; for (i = 0; i < chunks.length; i++) { es2.set(chunks[i], z); z += chunks[i].length; }
    return { video: out.slice(0, on).buffer, es: es2, audioPts: audioPts, videoPts: videoPts };
  }

  /* ---------- звук ---------- */
  var ctx = null, gain = null, analyser = null, video = null, chunks = [], active = [], ptsRef = -1, tRef = null, timer = 0, gen = 0, pendingDecode = 0, st = { segs: 0, decoded: 0, failed: 0, err: '' };
  function getCtx() {
    if (ctx) return ctx;
    var AC = root.AudioContext || root.webkitAudioContext; if (!AC) return null;
    try { ctx = new AC({ latencyHint: 'playback' }); } catch (e) { try { ctx = new AC(); } catch (e2) { return null; } }
    gain = ctx.createGain(); gain.connect(ctx.destination);
    try { analyser = ctx.createAnalyser(); analyser.fftSize = 1024; gain.connect(analyser); } catch (e) { analyser = null; }   // для диагностики (level)
    try { if (root.navigator && navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) {}   // звук WebAudio не глушится переключателем «без звука» (iOS 16.4+)
    return ctx;
  }
  function stopAll() { active.forEach(function (s) { try { s.stop(); } catch (e) {} }); active = []; chunks.forEach(function (c) { c.sched = false; }); }
  function vol() { if (gain && video) gain.gain.value = video.muted ? 0 : (video.volume == null ? 1 : video.volume); }
  function tick() {
    if (!ctx || !video) return;
    if (tRef === null && video.buffered && video.buffered.length) tRef = video.buffered.start(0);
    if (tRef === null) return;
    if (video.paused || video.seeking || video.readyState < 3) { if (active.length) stopAll(); return; }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} return; }
    var now = video.currentTime, k, c, t0, end;
    for (k = chunks.length - 1; k >= 0; k--) { if (tRef + chunks[k].rel + chunks[k].buf.duration < now - 0.2) chunks.splice(k, 1); }
    for (k = 0; k < chunks.length; k++) {
      c = chunks[k]; t0 = tRef + c.rel; end = t0 + c.buf.duration;
      if (c.sched || end < now || t0 > now + 1.2) continue;
      var s = ctx.createBufferSource(); s.buffer = c.buf; s.connect(gain);
      var off = Math.max(0, now - t0), when = ctx.currentTime + Math.max(0, t0 - now);
      try { s.start(when, off); } catch (e) { continue; }
      c.sched = true; active.push(s); (function (src) { src.onended = function () { var ix = active.indexOf(src); if (ix >= 0) active.splice(ix, 1); }; })(s);
    }
  }
  /* декодирование mp2 на JS (mp2-decoder.js): звук нарезается на кадры по заголовку, один декодер на весь поток (память фильтра сохраняется между сегментами) */
  var BR = [0, 32, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320, 384], SR = [44100, 48000, 32000], dec = null;
  function decode(es, cb) {
    if (!root.MP2Decoder || !ctx) { st.failed++; st.err = 'нет mp2-decoder.js'; cb(null); return; }
    if (!dec) dec = new root.MP2Decoder({ streaming: false, audioBufferSize: 8192 });
    var L = [], R = [], n = 0, o = 0, rate = 48000;
    dec.destination = { play: function (sr, l, r) { L.push(new Float32Array(l)); R.push(new Float32Array(r)); n += l.length; rate = sr; } };
    function finish() {
      if (!n) { st.failed++; st.err = 'нет кадров'; cb(null); return; }
      try {
        var b = ctx.createBuffer(2, n, rate), cl = b.getChannelData(0), cr = b.getChannelData(1), w = 0;
        for (var i = 0; i < L.length; i++) { cl.set(L[i], w); cr.set(R[i], w); w += L[i].length; }
        cb(b);
      } catch (e) { st.failed++; st.err = String(e); cb(null); }
    }
    function step() {
      var cnt = 0;
      while (o + 4 <= es.length && cnt < 30) {
        if (es[o] !== 0xFF || (es[o + 1] & 0xFE) !== 0xFC) { o++; continue; }
        var br = BR[es[o + 2] >> 4], sr = SR[(es[o + 2] >> 2) & 3], pad = (es[o + 2] >> 1) & 1;
        if (!br || !sr) { o++; continue; }
        var len = Math.floor(144000 * br / sr) + pad;
        if (o + len > es.length) { o = es.length; break; }
        dec.bits.index = 0; dec.bits.byteLength = 0; dec.bits.write([es.subarray(o, o + len)]);
        if (!dec.decode()) { o++; continue; }
        o += len; cnt++;
      }
      if (o + 4 <= es.length) setTimeout(step, 0); else finish();
    }
    step();
  }
  function addSegment(r) {
    if (!ctx || !r) return;
    st.segs++;
    if (ptsRef < 0) ptsRef = r.videoPts >= 0 ? r.videoPts : r.audioPts;
    var t0pts = r.audioPts, myGen = gen;
    decode(r.es, function (buf) {
      if (!buf || myGen !== gen) return;
      st.decoded++;
      chunks.push({ rel: (t0pts - ptsRef) / 90000, buf: buf, sched: false });   // время относительно первого кадра; абсолютное = tRef + rel (tick)
    });
  }
  var API = {
    processTs: processTs, stats: st,
    info: function () { return { state: ctx ? ctx.state : 'нет', rate: ctx ? ctx.sampleRate : 0, chunks: chunks.length, active: active.length, tRef: tRef }; },
    level: function () { if (!analyser) return -1; var d = new Uint8Array(analyser.fftSize); analyser.getByteTimeDomainData(d); var m = 0; for (var i = 0; i < d.length; i++) { var x = Math.abs(d[i] - 128); if (x > m) m = x; } return m; },
    attach: function (v) {
      API.detach(); video = v; gen++; chunks = []; ptsRef = -1; tRef = null;
      var c = getCtx(); if (!c) return false;
      try { if (c.state === 'suspended') c.resume(); } catch (e) {}
      v.addEventListener('volumechange', vol); v.addEventListener('pause', stopAll); v.addEventListener('waiting', stopAll); v.addEventListener('seeking', stopAll);
      vol(); timer = setInterval(tick, 120);
      return true;
    },
    detach: function () {
      if (timer) { clearInterval(timer); timer = 0; }
      if (video) { video.removeEventListener('volumechange', vol); video.removeEventListener('pause', stopAll); video.removeEventListener('waiting', stopAll); video.removeEventListener('seeking', stopAll); }
      gen++; stopAll(); chunks = []; video = null;
    },
    loader: function (Hls) {
      var Base = Hls.DefaultConfig.loader;
      function L(config) { this.b = new Base(config); }
      Object.defineProperty(L.prototype, 'stats', { get: function () { return this.b.stats; } });
      Object.defineProperty(L.prototype, 'context', { get: function () { return this.b.context; } });
      L.prototype.load = function (context, config, cb) {
        var wrapped = {
          onSuccess: function (resp, stats, c, nd) {
            try {
              if (c && c.frag && resp && resp.data instanceof ArrayBuffer) {
                var r = processTs(resp.data);
                if (r) { resp.data = r.video; addSegment(r); }
              }
            } catch (e) { st.err = 'ts:' + e; }
            cb.onSuccess(resp, stats, c, nd);
          },
          onError: cb.onError, onTimeout: cb.onTimeout, onAbort: cb.onAbort, onProgress: cb.onProgress
        };
        this.b.load(context, config, wrapped);
      };
      L.prototype.abort = function () { this.b.abort(); };
      L.prototype.destroy = function () { this.b.destroy(); };
      L.prototype.getCacheAge = function () { return this.b.getCacheAge ? this.b.getCacheAge() : null; };
      L.prototype.getResponseHeader = function (n) { return this.b.getResponseHeader ? this.b.getResponseHeader(n) : null; };
      return L;
    }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  root.MP2Audio = API;
})(typeof window !== 'undefined' ? window : globalThis);
