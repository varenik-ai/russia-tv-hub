/* Русское ТВ (мини-апп) — панель плеера (взята из tv-indonesia.com и доработана: русский язык, уровни без высоты — по битрейту) для HLS-каналов: выбор качества (авто + ручной) и трансляция на ТВ.
   Подключается из app.js вместе с hls.js. Для YouTube-каналов не нужен: у YouTube свой плеер.
   - Качество: «Auto» = адаптивный выбор hls.js (с учётом размера плеера), либо фиксированная высота.
     Выбор хранится в localStorage (rtv_quality). Если у потока один уровень, кнопки нет.
   - Chromium (Chrome, Edge, Opera; ПК и Android): Google Cast. Телевизор сам берёт поток по ссылке владельца,
     устройство остаётся свободным. Скрипт Google подгружается лениво.
   - iPhone/iPad (нативный HLS): AirPlay. */
(function () {
  'use strict';
  var EN = (document.documentElement.lang || '').toLowerCase().indexOf('en') === 0;
  var T = EN
    ? { q: 'Quality', auto: 'Auto', rec: 'recommended', cast: 'Cast to TV', air: 'AirPlay', on: 'Casting to', tv: 'TV', stop: 'Stop casting', fail: 'Could not send this channel to the TV. Try again.', slow: 'Video stuttering?', lower: 'Lower quality', mbps: 'Mbit/s' }
    : { q: 'Качество', auto: 'Авто', rec: 'рекомендуется', cast: 'Показать на ТВ', air: 'AirPlay', on: 'Идёт на', tv: 'ТВ', stop: 'Остановить', fail: 'Не удалось отправить канал на ТВ. Попробуйте ещё раз.', slow: 'Видео тормозит?', lower: 'Снизить качество', mbps: 'Мбит/с' };
  var KEY = 'rtv_quality';
  function get() { try { return localStorage.getItem(KEY) || 'auto'; } catch (e) { return 'auto'; } }
  function set(v) { try { localStorage.setItem(KEY, v); } catch (e) {} }
  var UA = navigator.userAgent || '';
  var isIOS = /iPhone|iPad|iPod/.test(UA) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var chromium = !!window.chrome && !isIOS && !/Firefox|FxiOS/.test(UA);
  var ICON_CAST = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M1 18v3h3c0-1.66-1.34-3-3-3zm0-4v2c2.76 0 5 2.24 5 5h2c0-3.87-3.13-7-7-7zm0-4v2c4.97 0 9 4.03 9 9h2c0-6.08-4.93-11-11-11zm20-7H3c-1.1 0-2 .9-2 2v3h2V5h18v14h-7v2h7c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>';
  var ICON_AIR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 22h12l-6-6-6 6zM21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h4v-2H3V5h18v12h-4v2h4c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/></svg>';

  var css = document.createElement('style');
  css.textContent =
    '.pui{position:absolute;top:10px;right:10px;z-index:51;display:flex;gap:6px;align-items:flex-start;transition:opacity .2s}' +
    '.player .pui{opacity:0}.player:hover .pui,.player .pui:focus-within,.player.pui-open .pui,.player.casting .pui{opacity:1}' +
    '@media (hover:none){.player .pui{opacity:1}}' +
    '.pui-btn{background:rgba(0,0,0,.68);color:#fff;border:1px solid rgba(255,255,255,.14);border-radius:8px;height:34px;padding:0 11px;font:600 12px/32px Inter,system-ui,sans-serif;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap}' +
    '.pui-btn:hover{background:rgba(0,0,0,.92)}.pui-btn:focus-visible{outline:2px solid #6ea8ff}.pui-btn svg{width:18px;height:18px;fill:currentColor}.pui-btn.on{background:#e11d2e;border-color:#e11d2e}' +
    '.pui-menu{position:absolute;top:40px;right:0;background:#12121f;border:1px solid #2a2a40;border-radius:10px;padding:6px;min-width:190px;box-shadow:0 8px 28px rgba(0,0,0,.55);font:13px/1.3 Inter,system-ui,sans-serif;color:#e8e8f0}' +
    '.pui-menu h4{margin:4px 8px 6px;font-size:11px;font-weight:700;letter-spacing:.5px;text-transform:uppercase;color:#8b8ba0}' +
    '.pui-item{display:flex;justify-content:space-between;gap:12px;width:100%;background:none;border:0;color:inherit;text-align:left;padding:8px 10px;border-radius:7px;cursor:pointer;font:inherit}' +
    '.pui-item:hover{background:#1c1c32}.pui-item[aria-checked=true]{background:#7f1d1d;font-weight:700}.pui-item small{color:#a8a8c4;font-weight:400}' +
    '.pui-toast{position:absolute;left:50%;bottom:64px;transform:translateX(-50%);z-index:52;background:rgba(0,0,0,.82);color:#fff;border-radius:10px;padding:8px 12px;font:600 13px/1.2 Inter,system-ui,sans-serif;display:flex;gap:10px;align-items:center}' +
    '.pui-toast button{background:#e11d2e;color:#fff;border:0;border-radius:7px;padding:6px 10px;font:700 12px/1 inherit;cursor:pointer}' +
    '.pui-cast{position:absolute;inset:0;z-index:50;display:none;flex-direction:column;align-items:center;justify-content:center;gap:12px;padding:20px;text-align:center;background:#0b0b14;color:#fff;font-family:Inter,system-ui,sans-serif}' +
    '.player.casting .pui-cast{display:flex}.pui-cast svg{width:44px;height:44px;fill:#7db4ff}.pui-cast b{font-size:17px}.pui-cast span{font-size:13px;color:#a8a8c4}' +
    '.pui-cast button{border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#fff;border-radius:18px;padding:9px 18px;font:700 13px/1 inherit;cursor:pointer}';
  document.head.appendChild(css);

  function el(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function levelLabel(l) {
    var mb = l.bitrate ? l.bitrate / 1e6 : 0;
    return { main: l.height ? l.height + 'p' : (mb ? mb.toFixed(1) + ' ' + T.mbps : '?'), sub: l.height && mb ? mb.toFixed(1) + ' ' + T.mbps : '' };
  }

  /* ---------- Google Cast ---------- */
  var cast = { ready: false, loading: false, ctx: null, subs: [] };
  var cur = null; // { box, video, hls, url, name }
  function loadCast() {
    if (!chromium || cast.loading) return;
    cast.loading = true;
    window.__onGCastApiAvailable = function (ok) {
      if (!ok) return;
      try {
        var ctx = cast.ctx = window.cast.framework.CastContext.getInstance();
        ctx.setOptions({ receiverApplicationId: window.chrome.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID, autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED });
        ctx.addEventListener(window.cast.framework.CastContextEventType.CAST_STATE_CHANGED, function () { cast.subs.forEach(function (f) { f(); }); });
        ctx.addEventListener(window.cast.framework.CastContextEventType.SESSION_STATE_CHANGED, function (e) {
          var S = window.cast.framework.SessionState;
          if (e.sessionState === S.SESSION_STARTED || e.sessionState === S.SESSION_RESUMED) sendMedia();
          else if (e.sessionState === S.SESSION_ENDED) endCast();
          cast.subs.forEach(function (f) { f(); });
        });
        cast.ready = true; cast.subs.forEach(function (f) { f(); });
        if (ctx.getCurrentSession()) sendMedia();
      } catch (e) {}
    };
    var s = document.createElement('script'); s.async = true; s.src = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1'; document.head.appendChild(s);
  }
  function deviceName() { try { return cast.ctx.getCurrentSession().getCastDevice().friendlyName; } catch (e) { return null; } }
  function showCastOverlay(err) {
    if (!cur) return;
    var o = cur.box.querySelector('.pui-cast'); if (!o) { o = el('div', 'pui-cast'); cur.box.appendChild(o); }
    o.innerHTML = ICON_CAST + '<b></b><span></span>';
    o.querySelector('b').textContent = T.on + ' ' + (deviceName() || T.tv);
    o.querySelector('span').textContent = err ? T.fail : cur.name;
    var b = el('button'); b.type = 'button'; b.textContent = T.stop;
    b.addEventListener('click', function () { try { cast.ctx.endCurrentSession(true); } catch (e) {} });
    o.appendChild(b);
    cur.box.classList.add('casting');
  }
  function sendMedia() {
    if (!cur || !cast.ctx) return;
    var s = cast.ctx.getCurrentSession(); if (!s) return;
    try { cur.video.pause(); } catch (e) {}
    var url = new URL(cur.url, location.href).href;
    var mi = new window.chrome.cast.media.MediaInfo(url, 'application/x-mpegURL');
    mi.streamType = window.chrome.cast.media.StreamType.LIVE;
    var md = new window.chrome.cast.media.GenericMediaMetadata(); md.title = cur.name; md.images = [new window.chrome.cast.Image('https://russian-tv.com/og-image.jpg')]; mi.metadata = md;
    var req = new window.chrome.cast.media.LoadRequest(mi); req.autoplay = true;
    showCastOverlay(false);
    s.loadMedia(req).catch(function () { showCastOverlay(true); });
  }
  function endCast() {
    if (!cur) return;
    cur.box.classList.remove('casting');
    try { var p = cur.video.play(); if (p && p.catch) p.catch(function () {}); } catch (e) {}
  }

  /* ---------- панель ---------- */
  function clean(box) {
    Array.prototype.forEach.call(box.querySelectorAll('.pui,.pui-toast,.pui-cast'), function (n) { n.parentNode.removeChild(n); });
    box.classList.remove('casting', 'pui-open');
  }
  function mountBar(box) { clean(box); var bar = el('div', 'pui'); box.appendChild(bar); return bar; }

  function addCastButtons(bar, video) {
    if (chromium) {
      var b = el('button', 'pui-btn', ICON_CAST); b.type = 'button'; b.title = b.setAttribute('aria-label', T.cast) || T.cast; b.style.display = 'none';
      bar.appendChild(b);
      var vis = function () {
        var st = cast.ctx && cast.ctx.getCastState(); var connected = st === 'CONNECTED';
        b.style.display = cast.ready && st && st !== 'NO_DEVICES_AVAILABLE' ? 'inline-flex' : 'none'; b.classList.toggle('on', connected);
      };
      cast.subs.push(vis); vis(); loadCast();
      b.addEventListener('click', function (e) { e.stopPropagation(); try { cast.ctx.requestSession().catch(function () {}); } catch (x) {} });
    } else if (video.webkitShowPlaybackTargetPicker) {
      var a = el('button', 'pui-btn', ICON_AIR); a.type = 'button'; a.title = T.air; a.setAttribute('aria-label', T.air); a.style.display = 'none';
      bar.appendChild(a);
      video.addEventListener('webkitplaybacktargetavailabilitychanged', function (ev) { a.style.display = ev.availability === 'available' ? 'inline-flex' : 'none'; });
      a.addEventListener('click', function (e) { e.stopPropagation(); video.webkitShowPlaybackTargetPicker(); });
    }
  }

  /* hls.js: качество + трансляция */
  function attach(box, video, hls, url) {
    var bar = mountBar(box), qbtn = null, menu = null, stalls = [], toast = null;
    cur = { box: box, video: video, hls: hls, url: url, name: box.getAttribute('data-name') || '' };
    function close() { if (menu) { menu.parentNode.removeChild(menu); menu = null; } box.classList.remove('pui-open'); }
    function applyPref() {
      var pref = get(), lv = hls.levels || [];
      if (pref === 'auto' || !lv.length) { hls.currentLevel = -1; return; }
      var want = parseInt(pref.replace(/^b/, ''), 10), best = -1, bh = -1, byBr = pref.charAt(0) === 'b';
      lv.forEach(function (l, i) { var h = byBr ? (l.bitrate || 0) / 1000 : (l.height || 0); if (h <= want && h > bh) { bh = h; best = i; } });
      hls.currentLevel = best >= 0 ? best : -1;
    }
    function label() {
      var pref = get(), c = hls.levels && hls.levels[hls.currentLevel >= 0 ? hls.currentLevel : hls.loadLevel];
      var hh = (c && c.height) || video.videoHeight || 0;
      var lbl = c ? levelLabel(c).main : '';
      return T.q + ': ' + (pref === 'auto' ? T.auto + (lbl ? ' (' + lbl + ')' : '') : (lbl || pref));
    }
    function refresh() { if (qbtn) qbtn.textContent = '⚙ ' + label(); }
    function build() {
      var lv = hls.levels || []; if (lv.length < 2) return;
      qbtn = el('button', 'pui-btn'); qbtn.type = 'button'; qbtn.setAttribute('aria-haspopup', 'true'); qbtn.setAttribute('aria-label', T.q);
      bar.insertBefore(qbtn, bar.firstChild); applyPref(); refresh();
      qbtn.addEventListener('click', function (e) {
        e.stopPropagation(); if (menu) return close();
        menu = el('div', 'pui-menu'); menu.setAttribute('role', 'menu'); menu.appendChild(el('h4', '', T.q));
        var pref = get();
        function item(main, sub, val) {
          var b = el('button', 'pui-item', '<span></span><small></small>'); b.type = 'button'; b.setAttribute('role', 'menuitemradio'); b.setAttribute('aria-checked', pref === val ? 'true' : 'false');
          b.firstChild.textContent = main; b.lastChild.textContent = sub || '';
          b.addEventListener('click', function (ev) { ev.stopPropagation(); set(val); applyPref(); refresh(); close(); });
          menu.appendChild(b);
        }
        item(T.auto, T.rec, 'auto');
        var seen = {};
        lv.slice().sort(function (a, b) { return (b.height || 0) - (a.height || 0) || (b.bitrate || 0) - (a.bitrate || 0); }).forEach(function (l) {
          var key = l.height ? String(l.height) : (l.bitrate ? 'b' + Math.round(l.bitrate / 1000) : ''); if (!key || seen[key]) return; seen[key] = 1; var t = levelLabel(l); item(t.main, t.sub, key);
        });
        qbtn.parentNode.appendChild(menu); box.classList.add('pui-open');
      });
    }
    document.addEventListener('click', function (e) { if (menu && !menu.contains(e.target) && e.target !== qbtn) close(); });
    addCastButtons(bar, video);
    if (hls.levels && hls.levels.length) build(); else hls.once(Hls.Events.MANIFEST_PARSED, build);
    hls.on(Hls.Events.LEVEL_SWITCHED, refresh);
    video.addEventListener('resize', refresh); video.addEventListener('loadedmetadata', refresh);

    /* тормозит при ручном выборе — предлагаем снизить качество */
    hls.on(Hls.Events.ERROR, function (e, d) {
      if (d.details !== Hls.ErrorDetails.BUFFER_STALLED_ERROR || get() === 'auto') return;
      var now = Date.now(); stalls = stalls.filter(function (t) { return now - t < 30000; }); stalls.push(now);
      if (stalls.length < 2 || toast) return;
      var lv = hls.levels || [], c = lv[hls.currentLevel]; if (!c) return;
      var lower = lv.filter(function (l) { return (l.height || 0) < (c.height || 0); }).sort(function (a, b) { return b.height - a.height; })[0]; if (!lower) return;
      toast = el('div', 'pui-toast', '<span></span><button type="button"></button>'); toast.firstChild.textContent = T.slow; toast.lastChild.textContent = T.lower + ' (' + lower.height + 'p)';
      toast.lastChild.addEventListener('click', function () { set(String(lower.height)); applyPref(); refresh(); toast.parentNode.removeChild(toast); toast = null; });
      box.appendChild(toast); setTimeout(function () { if (toast && toast.parentNode) toast.parentNode.removeChild(toast); toast = null; }, 9000);
    });
    if (cast.ctx && cast.ctx.getCurrentSession()) sendMedia(); // уже идёт трансляция: новый канал уходит на ТВ
  }

  /* нативный HLS (iPhone/iPad): только AirPlay, качество выбирает система */
  function attachNative(box, video, url) {
    var bar = mountBar(box); cur = { box: box, video: video, hls: null, url: url, name: box.getAttribute('data-name') || '' };
    addCastButtons(bar, video);
  }

  window.tvPlayerUI = { attach: attach, attachNative: attachNative };
})();
