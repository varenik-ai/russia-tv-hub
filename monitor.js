/* Мониторинг запуска каналов + автоматическое переключение источника.
   1) После каждой попытки запуска шлёт на rtv-monitor результат (пошёл / не пошёл), код ошибки, хост, тип устройства и браузер.
      Без cookie, без идентификатора посетителя, без IP (страну и провайдера определяет Cloudflare). Уважает «Не отслеживать» (DNT); на сайте отправляет данные только после «Согласен» (assets/consent.js).
   2) Если канал не пошёл (фатальная ошибка hls.js, ошибка встроенного плеера или 40 секунд без кадра) или оборвался, просит у воркера следующий запасной
      источник (?alt=N, цепочки ALT_CHAINS в russia-worker.js) и запоминает рабочий (после удачного запуска) в localStorage (rtv_alt) на 6 часов. Не больше 4 переключений на страницу.
   Работает с hls.js (патч Hls.prototype.loadSource) и со встроенным плеером Apple (события video).
   Один файл для сайта (assets/monitor.js) и мини-аппа (monitor.js в репозитории russia-tv-hub): держите копии одинаковыми. */
(function () {
  'use strict';
  if (window.__rtvMon) return; window.__rtvMon = 1;
  var DNT = navigator.doNotTrack === '1' || window.doNotTrack === '1';
  var ENDPOINT = 'https://rtv-monitor.dyaltd.workers.dev/r', TIMEOUT_MS = 40000, ALT_TIMEOUT_MS = 25000, MAX_REPORTS = 8, sent = 0;
  var ALTS = { perviy: 1, spb: 1, muzykaPervogo: 1, rossiya1: 1, rossiya24: 2, ntv: 1, tvc: 1, kultura: 1, karusel: 1, domkino: 1, zvezda: 1, muztv: 1, rtrEuro: 1, rtrUsa: 1 };   // число запасных источников (как в ALT_CHAINS воркера)
  var KEYA = 'rtv_alt', TTL = 6 * 3600e3, MAX_SW = 4, sw = 0;
  var UA = navigator.userAgent || '';
  var SRC = /github\.io$/.test(location.hostname) ? 'app' : 'site';
  var DEV = /SmartTV|SMART-TV|Tizen|Web0S|WebOS|HbbTV|NetCast|AppleTV|BRAVIA/i.test(UA) ? 'tv' : /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(UA) ? 'android' : 'desktop';
  var tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.platform && Telegram.WebApp.platform !== 'unknown';
  var BR = tg ? 'tg' : /Edg\//.test(UA) ? 'edge' : /Firefox|FxiOS/.test(UA) ? 'firefox' : /Chrome|CriOS/.test(UA) ? 'chrome' : /Safari/.test(UA) ? 'safari' : 'other';
  function consented() { if (SRC === 'app') return true; if (window.rtvConsentGranted) return !!window.rtvConsentGranted(); try { return localStorage.getItem('rtv_consent') === '1'; } catch (e) { return false; } }   // на сайте — только после «Согласен» (с 18.11.2026); в мини-аппе окна согласия нет
  function send(p) {
    if (DNT || sent >= MAX_REPORTS || !consented()) return; sent++;
    p.s = SRC; p.d = DEV; p.b = BR;
    var body = JSON.stringify(p);
    try { if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch(ENDPOINT, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }); } catch (e) {}
  }
  function hostOf(u) { try { return new URL(u, location.href).hostname; } catch (e) { return ''; } }
  function chOf(u) { var m = /[?&]channel=([\w-]+)/.exec(u || ''); return m ? m[1] : ''; }
  function altOf(u) { var m = /[?&]alt=(\d+)/.exec(u || ''); return m ? +m[1] : 0; }
  function withAlt(u, a) { u = u.replace(/([?&])alt=\d+&?/, '$1').replace(/[?&]$/, ''); return a ? u + (u.indexOf('?') < 0 ? '?' : '&') + 'alt=' + a : u; }
  function altGet(ch) { try { var e = (JSON.parse(localStorage.getItem(KEYA) || '{}') || {})[ch]; if (e && Date.now() - e.t < TTL) return e.a | 0; } catch (x) {} return 0; }
  function altSet(ch, a) { try { var o = JSON.parse(localStorage.getItem(KEYA) || '{}') || {}; if (a) o[ch] = { a: a, t: Date.now() }; else delete o[ch]; localStorage.setItem(KEYA, JSON.stringify(o)); } catch (x) {} }
  var pend = {};   // источник, выбранный при переключении на этой странице (в память; в localStorage попадает только после удачного запуска)
  function altEff(ch) { return pend[ch] != null ? pend[ch] : altGet(ch); }
  var cur = null;
  function begin(ch, url, hls, video) {
    if (!ch) return;
    if (cur && !cur.done && cur.ch === ch) return;          // перезапуск hls.js того же канала: попытка продолжается
    if (cur && cur.timer) clearTimeout(cur.timer);
    var alt = altOf(url);
    var a = cur = { ch: ch, url: url, alt: alt, w: hostOf(url) + (alt ? ':a' + alt : ''), hls: hls || null, video: video || null, t0: Date.now(), done: false, played: false, dropped: false, fh: '' };
    a.timer = setTimeout(function () { fail(a, 'timeout', 0, ''); }, ALTS[ch] ? ALT_TIMEOUT_MS : TIMEOUT_MS);   // 23.11.2026: где есть запасной источник, ждём 25 с, а не 40: средний первый кадр 4-9 с, а за 40 с зритель уходит
  }
  function ok(a) {
    if (!a || a.done) return; a.done = true; a.played = true; clearTimeout(a.timer);
    delete pend[a.ch]; if (ALTS[a.ch]) altSet(a.ch, a.alt);   // запоминаем источник, с которым пошло (0 — сбрасываем)
    send({ c: a.ch, o: 1, k: 's', w: a.w, x: a.fh, t: Date.now() - a.t0 });
  }
  function switchAlt(a) {
    var n = ALTS[a.ch]; if (!n || sw >= MAX_SW) return; sw++;
    var next = a.alt + 1 > n ? 0 : a.alt + 1; pend[a.ch] = next;
    var nu = withAlt(a.url, next);
    setTimeout(function () {
      try {
        if (a.hls) { a.hls.stopLoad(); a.hls.loadSource(nu); }
        else if (a.video) { a.video.src = nu; a.video.load(); var p = a.video.play(); if (p && p.catch) p.catch(function () {}); }
      } catch (e) {}
    }, 300);
  }
  function fail(a, code, http, host) {
    if (!a) return;
    if (a.done) { if (a.played && !a.dropped) { a.dropped = true; send({ c: a.ch, o: 0, k: 'd', e: code, h: http, x: host, w: a.w }); if (cur === a) switchAlt(a); } return; }
    a.done = true; clearTimeout(a.timer);
    send({ c: a.ch, o: 0, k: 's', e: code, h: http, x: host, w: a.w });
    if (cur === a) switchAlt(a);
  }
  // 23.11.2026: «зависание» без ошибки — видео идёт (не на паузе), но кадр не двигается STALL_S секунд (бесконечная буферизация).
  // Раньше переключение было только при фатальной ошибке hls.js; теперь: есть запасной источник — переключаемся, нет — перезапуск загрузки с живой точки.
  var STALL_S = 14, stLast = -1, stSec = 0;
  setInterval(function () {
    var a = cur; if (!a || !a.played || a.dropped) { stLast = -1; stSec = 0; return; }
    var v = a.video || (a.hls && a.hls.media) || document.querySelector('video');
    if (!v || v.paused || v.ended || document.hidden) { stLast = -1; stSec = 0; return; }
    if (v.currentTime !== stLast) { stLast = v.currentTime; stSec = 0; return; }
    stSec += 2; if (stSec < STALL_S) return;
    stSec = 0; stLast = -1;
    if (ALTS[a.ch]) { fail(a, 'stall', 0, a.fh || ''); return; }   // отчёт об обрыве + следующий источник
    a.dropped = true; send({ c: a.ch, o: 0, k: 'd', e: 'stall', h: 0, x: a.fh || '', w: a.w });
    try { if (a.hls) { a.hls.stopLoad(); a.hls.startLoad(-1); } else { v.load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); } } catch (e) {}
    setTimeout(function () { if (cur === a) a.dropped = false; }, 30000);   // следующий перезапуск — не раньше чем через 30 с
  }, 2000);
  // первый кадр (loadeddata) или playing любого video на странице
  ['loadeddata', 'playing'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (e.target && e.target.tagName === 'VIDEO') ok(cur); }, true); });
  // встроенный плеер Apple: источник — прямой адрес воркера (не blob:)
  document.addEventListener('loadstart', function (e) {
    var v = e.target; if (!v || v.tagName !== 'VIDEO') return;
    var src = v.currentSrc || v.src || ''; if (!src || src.indexOf('blob:') === 0) return;
    var ch = chOf(src);
    if (ch && ALTS[ch] && !altOf(src) && altEff(ch) > 0) { v.src = withAlt(src, altEff(ch)); return; }   // запомненный рабочий источник
    begin(ch, src, null, v);
  }, true);
  document.addEventListener('error', function (e) {
    var v = e.target; if (!v || v.tagName !== 'VIDEO' || !cur) return;
    var src = v.currentSrc || v.src || ''; if (src.indexOf('blob:') === 0) return;
    fail(cur, 'native' + (v.error ? v.error.code : 0), 0, hostOf(src));
  }, true);
  // hls.js: loadSource начинает попытку (и подставляет запомненный источник), фатальная ошибка завершает
  function patch() {
    var H = window.Hls; if (!H || !H.prototype) return false; if (H.prototype.__rtvPatched) return true;
    var orig = H.prototype.loadSource;
    H.prototype.loadSource = function (url) {
      try {
        var ch = chOf(url);
        if (ch && ALTS[ch] && !altOf(url) && altEff(ch) > 0) url = withAlt(url, altEff(ch));
        begin(ch, url, this);
        if (!this.__rtvOn) {
          this.__rtvOn = 1;
          this.on(H.Events.FRAG_LOADED, function (e, d) { if (cur && !cur.fh && d && d.frag && d.frag.url) cur.fh = hostOf(d.frag.url); });
          this.on(H.Events.ERROR, function (e, d) {
            if (!d || !d.fatal) return;
            var u = d.url || (d.context && d.context.url) || (d.frag && d.frag.url) || (d.response && d.response.url) || '';
            fail(cur, d.details || d.type || 'fatal', (d.response && d.response.code) || 0, hostOf(u));
          });
        }
      } catch (e) {}
      return orig.call(this, url);
    };
    H.prototype.__rtvPatched = 1; return true;
  }
  if (!patch()) { var tries = 0, iv = setInterval(function () { if (patch() || ++tries > 100) clearInterval(iv); }, 100); }
})();
