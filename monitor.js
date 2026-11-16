/* Мониторинг запуска каналов: после каждой попытки запуска шлёт на rtv-monitor результат (пошёл / не пошёл), код ошибки, хост,
   тип устройства и браузер. Без cookie, без идентификатора посетителя, без IP (страну и провайдера определяет Cloudflare на своей стороне).
   Уважает «Не отслеживать» (DNT). Работает с hls.js (патч loadSource) и со встроенным плеером Apple (события video).
   Один файл для сайта (assets/monitor.js) и мини-аппа (monitor.js в репозитории russia-tv-hub): держите копии одинаковыми. */
(function () {
  'use strict';
  if (window.__rtvMon) return; window.__rtvMon = 1;
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
  var ENDPOINT = 'https://rtv-monitor.dyaltd.workers.dev/r', TIMEOUT_MS = 40000, MAX_REPORTS = 8, sent = 0;
  var UA = navigator.userAgent || '';
  var SRC = /github\.io$/.test(location.hostname) ? 'app' : 'site';
  var DEV = /SmartTV|SMART-TV|Tizen|Web0S|WebOS|HbbTV|NetCast|AppleTV|BRAVIA/i.test(UA) ? 'tv' : /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) ? 'ios' : /Android/.test(UA) ? 'android' : 'desktop';
  var tg = window.Telegram && Telegram.WebApp && Telegram.WebApp.platform && Telegram.WebApp.platform !== 'unknown';
  var BR = tg ? 'tg' : /Edg\//.test(UA) ? 'edge' : /Firefox|FxiOS/.test(UA) ? 'firefox' : /Chrome|CriOS/.test(UA) ? 'chrome' : /Safari/.test(UA) ? 'safari' : 'other';
  function send(p) {
    if (sent >= MAX_REPORTS) return; sent++;
    p.s = SRC; p.d = DEV; p.b = BR;
    var body = JSON.stringify(p);
    try { if (navigator.sendBeacon && navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'text/plain' }))) return; } catch (e) {}
    try { fetch(ENDPOINT, { method: 'POST', body: body, mode: 'no-cors', keepalive: true }); } catch (e) {}
  }
  function hostOf(u) { try { return new URL(u, location.href).hostname; } catch (e) { return ''; } }
  function chOf(u) { var m = /[?&]channel=([\w-]+)/.exec(u || ''); return m ? m[1] : ''; }
  var cur = null;
  function begin(ch, url) {
    if (!ch) return;
    if (cur && !cur.done && cur.ch === ch) return;          // перезапуск hls.js того же канала: попытка продолжается
    if (cur && cur.timer) clearTimeout(cur.timer);
    var a = cur = { ch: ch, w: hostOf(url), t0: Date.now(), done: false, played: false, dropped: false };
    a.timer = setTimeout(function () { fail(a, 'timeout', 0, ''); }, TIMEOUT_MS);
  }
  function ok(a) {
    if (!a || a.done) return; a.done = true; a.played = true; clearTimeout(a.timer);
    send({ c: a.ch, o: 1, k: 's', w: a.w, t: Date.now() - a.t0 });
  }
  function fail(a, code, http, host) {
    if (!a) return;
    if (a.done) { if (a.played && !a.dropped) { a.dropped = true; send({ c: a.ch, o: 0, k: 'd', e: code, h: http, x: host, w: a.w }); } return; }
    a.done = true; clearTimeout(a.timer);
    send({ c: a.ch, o: 0, k: 's', e: code, h: http, x: host, w: a.w });
  }
  // первый кадр (loadeddata) или playing любого video на странице
  ['loadeddata', 'playing'].forEach(function (ev) { document.addEventListener(ev, function (e) { if (e.target && e.target.tagName === 'VIDEO') ok(cur); }, true); });
  // встроенный плеер Apple: источник — прямой адрес воркера (не blob:)
  document.addEventListener('loadstart', function (e) {
    var v = e.target; if (!v || v.tagName !== 'VIDEO') return;
    var src = v.currentSrc || v.src || ''; if (!src || src.indexOf('blob:') === 0) return;
    begin(chOf(src), src);
  }, true);
  document.addEventListener('error', function (e) {
    var v = e.target; if (!v || v.tagName !== 'VIDEO' || !cur) return;
    var src = v.currentSrc || v.src || ''; if (src.indexOf('blob:') === 0) return;
    fail(cur, 'native' + (v.error ? v.error.code : 0), 0, hostOf(src));
  }, true);
  // hls.js: loadSource начинает попытку, фатальная ошибка завершает
  function patch() {
    var H = window.Hls; if (!H || !H.prototype) return false; if (H.prototype.__rtvPatched) return true;
    var orig = H.prototype.loadSource;
    H.prototype.loadSource = function (url) {
      try {
        begin(chOf(url), url);
        if (!this.__rtvOn) {
          this.__rtvOn = 1;
          this.on(H.Events.ERROR, function (e, d) {
            if (!d || !d.fatal) return;
            var u = d.url || (d.context && d.context.url) || (d.frag && d.frag.url) || (d.response && d.response.url) || '';
            fail(cur, d.details || d.type || 'fatal', (d.response && d.response.code) || 0, hostOf(u));
          });
        }
      } catch (e) {}
      return orig.apply(this, arguments);
    };
    H.prototype.__rtvPatched = 1; return true;
  }
  if (!patch()) { var tries = 0, iv = setInterval(function () { if (patch() || ++tries > 100) clearInterval(iv); }, 100); }
})();
