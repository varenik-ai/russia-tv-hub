import json,re
d=json.load(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'channels.json'),encoding='utf8'))
D=[{"i":c["i"],"n":c["n"],"c":c["c"],"s":c["s"],"d":c["d"],"g":c["g"],"k":c["k"],"b":c["b"],"a":c["a"]} for c in d["D"]]
CATS=d["CATS"]
PRE=['t24','istoriya','kinohit','retro','kinopremiera','viju','nasheKino','rodnoeKino','kinopokaz','kinosvidanie','indiyskoekino','mult','muztv','muzykaPervogo','rutv','ohotarybalka','zagorodnaya','unikum','vijuSport','m1mma','domkino','priklyucheniya','ryzhiy','tochka','planeta','zoopark','drive','zhivotnye','zdorovoe','tracesport']
html=r'''<!doctype html>
<html lang="ru"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover,user-scalable=no">
<meta name="robots" content="noindex,nofollow">
<title>Русское ТВ — прямой эфир</title>
<link rel="icon" href="https://russian-tv.com/favicon.svg" type="image/svg+xml">
<script src="https://telegram.org/js/telegram-web-app.js"></script>
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.15/dist/hls.min.js"></script>
<script src="player-ui.js?v=4"></script>
<script src="mp2-decoder.js?v=1"></script>
<script src="mp2-audio.js?v=2"></script>
<script src="monitor.js?v=12"></script>
<script>
/* Меньше запросов к воркерам: hls.js обновляет плейлист прямо у источника, а не через воркер (/playlist?url=...).
   Только для источников с открытым CORS. v3: при ошибке или зависании источник отключается на 2 минуты, потом снова пробуем;
   пока он отключён, запросы идут через воркер с меткой &fb=1. */
(function () {
  if (!window.Hls || !Hls.DefaultConfig) return;
  var HOSTS = /^https:\/\/(stream\.smotrim\.ru|streaming\.thestream\.cyou|tvc-hls\.cdnvideo\.ru|live-vgtrksmotrim\.cdnvideo\.ru)\//;
  var TIMEOUT_MS = 8000, RETRY_MS = 120000, KEY = 'rtv_direct_off', off = {};
  try { off = JSON.parse(sessionStorage.getItem(KEY) || '{}') || {}; } catch (e) {}
  function blocked(host) { var t = off[host]; return t > 1 && Date.now() - t < RETRY_MS; }
  function disable(host) { off[host] = Date.now(); try { sessionStorage.setItem(KEY, JSON.stringify(off)); } catch (e) {} }
  Hls.DefaultConfig.xhrSetup = function (xhr, url) {
    var m = /\/playlist\?url=([^&]+)$/.exec(url);
    if (!m) return;
    var target = decodeURIComponent(m[1]), hit = HOSTS.exec(target);
    if (!hit) return;
    if (blocked(hit[1])) { xhr.open('GET', url + '&fb=1', true); return; }
    xhr.open('GET', target, true);
    var timer = setTimeout(function () { disable(hit[1]); }, TIMEOUT_MS);
    xhr.addEventListener('loadend', function () { clearTimeout(timer); });
    xhr.addEventListener('error', function () { disable(hit[1]); });
    xhr.addEventListener('load', function () { if (xhr.status < 200 || xhr.status >= 300) disable(hit[1]); });
  };
})();
</script>
<style>
:root{--bg:var(--tg-theme-bg-color,#0b0b14);--tx:var(--tg-theme-text-color,#f1f1f7);--mu:var(--tg-theme-hint-color,#8d8da3);--bt:var(--tg-theme-button-color,#d52b1e);--bx:var(--tg-theme-button-text-color,#fff);--sb:var(--tg-theme-secondary-bg-color,#15152a);--red:#d52b1e;--plh:0px}
*{box-sizing:border-box;margin:0;padding:0;-webkit-tap-highlight-color:transparent}
html,body{background:var(--bg);color:var(--tx);font:15px/1.4 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;min-height:100%}
body{padding-bottom:env(safe-area-inset-bottom)}
#pl{position:sticky;top:0;z-index:20;background:var(--bg);display:none}
.box{position:relative;width:100%;aspect-ratio:16/9;background:#000;overflow:hidden}
.box video,.box iframe{position:absolute;inset:0;width:100%;height:100%;border:0;background:#000}
.ov{position:absolute;inset:0;z-index:30;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;color:#fff;text-align:center;padding:16px;font-size:14px;background:rgba(0,0,0,.6)}
.ov button{border:0;border-radius:18px;padding:9px 18px;background:var(--red);color:#fff;font:inherit;font-weight:700}
.sp{width:30px;height:30px;border:3px solid rgba(255,255,255,.25);border-top-color:var(--red);border-radius:50%;animation:s .9s linear infinite}@keyframes s{to{transform:rotate(360deg)}}
.bar{display:flex;align-items:center;gap:8px;padding:8px 12px 0}
.bar .t{flex:1;min-width:0}.bar h1{font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.bar p{color:var(--mu);font-size:12px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.x{flex:none;width:34px;height:34px;border:0;border-radius:50%;background:var(--sb);color:var(--tx);font-size:16px}
.acts{display:flex;gap:8px;overflow-x:auto;padding:8px 12px 10px;scrollbar-width:none}.acts::-webkit-scrollbar{display:none}
.btn{flex:none;border:0;border-radius:12px;padding:9px 13px;background:var(--sb);color:var(--tx);font:inherit;font-size:13px;font-weight:600;text-decoration:none;display:inline-flex;align-items:center;gap:6px}
.btn.p{background:var(--bt);color:var(--bx)}
.btn.star{background:#1f1d12;color:#ffd54a;border:1px solid #3a3a2a}
.top{padding:10px 12px 0}.cw{position:sticky;top:var(--plh);z-index:10;background:var(--bg);padding:0 12px 6px}
.brand{display:flex;align-items:center;gap:8px;font-weight:800;font-size:17px;margin-bottom:8px}
.brand i{width:9px;height:9px;border-radius:50%;background:var(--red);animation:p 1.2s infinite}@keyframes p{50%{opacity:.25}}
.brand span{color:var(--red)}
.brand .thank{margin-left:auto;border:1px solid #3a3a2a;background:#1f1d12;color:#ffd54a;border-radius:14px;padding:6px 12px;font:inherit;font-size:13px;font-weight:700}
.q{width:100%;border:0;border-radius:12px;background:var(--sb);color:var(--tx);padding:11px 14px;font:inherit;outline:0}
.chips{display:flex;gap:8px;overflow-x:auto;padding:10px 0 4px;scrollbar-width:none}.chips::-webkit-scrollbar{display:none}
.chip{flex:none;border:0;border-radius:18px;padding:7px 13px;background:var(--sb);color:var(--tx);font:inherit;font-size:14px}.chip.on{background:var(--red);color:#fff}
.list{padding:4px 12px 16px}
.row{display:flex;align-items:center;gap:12px;padding:9px 8px;border-radius:12px;cursor:pointer}.row:active{background:var(--sb)}
.row.on{background:linear-gradient(135deg,rgba(213,43,30,.25),rgba(213,43,30,.08));box-shadow:inset 0 0 0 1px rgba(213,43,30,.5)}
.lg{flex:none;width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;overflow:hidden;font-weight:800;font-size:13px}
.lg img{width:100%;height:100%;object-fit:contain;padding:4px}
.rn{flex:1;min-width:0}.rn b{display:block;font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rn small{color:var(--mu);font-size:12px}
.live{flex:none;font-size:10px;font-weight:800;color:#fff;background:var(--red);border-radius:6px;padding:2px 6px;letter-spacing:.5px}
.none{padding:30px;text-align:center;color:var(--mu)}
.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:50;max-width:88%;background:rgba(20,20,35,.95);color:#fff;border-radius:12px;padding:10px 14px;font-size:13px;text-align:center}
#tv-modal{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.7);display:none;align-items:flex-end;justify-content:center}
#tv-modal .sheet{width:100%;max-width:560px;background:#14141f;border-radius:18px 18px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom,0px));text-align:center}
#tv-modal h3{font-size:17px;margin-bottom:10px}#tv-modal p{font-size:13px;line-height:1.45;color:#a8a8c0;margin-bottom:12px}#tv-modal b{color:#fff}
#tv-code{width:100%;padding:14px;border-radius:12px;border:1px solid #33334a;background:#0d0d18;color:#fff;font-size:24px;letter-spacing:6px;text-align:center}
#tv-go{width:100%;margin-top:10px;padding:14px;border:none;border-radius:12px;background:#2a5fd0;color:#fff;font-size:15px;font-weight:700;cursor:pointer}
#tv-err{min-height:18px;margin-top:8px;font-size:13px;color:#ff6b6b}
#tv-chrome{margin-top:6px;background:none;border:none;color:#7db4ff;font-size:13px;cursor:pointer}
#tv-modal .close{margin-top:10px;background:none;border:none;color:#666;font-size:14px;cursor:pointer;display:block;width:100%}
.btn.air-next{background:var(--red);color:#fff}
#donate-modal{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.7);display:none;align-items:flex-end;justify-content:center}
#donate-modal .sheet{width:100%;max-width:560px;background:#14141f;border-radius:18px 18px 0 0;padding:20px 16px calc(20px + env(safe-area-inset-bottom,0px));text-align:center}
#donate-modal h3{font-size:17px;margin-bottom:14px}
#donate-modal .amounts{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}
#donate-modal .amounts button{padding:14px 0;border-radius:12px;border:1px solid #3a3a2a;background:#1f1d12;color:#ffd54a;font-size:15px;font-weight:800;cursor:pointer}
#donate-modal .close{margin-top:12px;background:none;border:none;color:#666;font-size:14px;cursor:pointer}
body.fs{overflow:hidden}body.fs #pl{position:fixed;inset:0;z-index:9999;display:block!important;background:#000}body.fs .box{position:absolute;inset:0;width:100%;height:100%;aspect-ratio:auto}body.fs .bar,body.fs .acts{display:none}
.box:fullscreen,.box:-webkit-full-screen{aspect-ratio:auto;width:100%;height:100%}
#fsx{display:none;position:fixed;top:max(10px,env(safe-area-inset-top));right:10px;z-index:10000;width:42px;height:42px;border:0;border-radius:50%;background:rgba(0,0,0,.55);color:#fff;font-size:20px}body.fs #fsx{display:block}
</style></head><body><button id="fsx" type="button" aria-label="Выйти из полного экрана">✕</button>
<div id="pl"><div class="box player" id="box"></div><div class="bar"><div class="t"><h1 id="vn"></h1><p id="vd"></p></div><button class="x" id="x" type="button" aria-label="Закрыть">✕</button></div><div class="acts" id="acts"></div></div>
<div class="top" id="top"><div class="brand"><i></i>Русское <span>ТВ</span><button class="thank" id="thank-btn" type="button"></button></div><input class="q" id="q" type="search" placeholder="" autocomplete="off"></div>
<div class="cw"><div class="chips" id="chips"></div></div>
<div class="list" id="list"></div>
<div id="tv-modal"><div class="sheet"><h3 id="tv-title"></h3><p id="tv-hint"></p><input id="tv-code" inputmode="numeric" maxlength="6" autocomplete="off"><button id="tv-go" type="button"></button><div id="tv-err"></div><button id="tv-chrome" type="button"></button><button class="close" id="tv-close" type="button">✕</button></div></div>
<div id="donate-modal"><div class="sheet"><h3 id="donate-title"></h3><div class="amounts" id="donate-amounts"></div><button class="close" id="donate-close" type="button">✕</button></div></div>
<script>
/* самообновление (19.11.2026): Telegram и браузеры могут держать старую копию страницы; при запуске сверяем версию с version.json и один раз перезагружаемся на новую */
var APPV='@@VER@@';
(function(){try{if(sessionStorage.getItem('rtv_upd'))return;fetch('version.json?_='+Date.now(),{cache:'no-store'}).then(function(r){return r.json()}).then(function(j){if(j&&j.v&&j.v!==APPV){try{sessionStorage.setItem('rtv_upd','1')}catch(e){}location.replace(location.pathname+'?v='+encodeURIComponent(j.v)+(location.hash||''))}}).catch(function(){})}catch(e){}})();
var D=@@D@@, CATS=@@CATS@@, SITE='https://russian-tv.com', BOT_API='https://russia-bot-worker.dyaltd.workers.dev';
var PROXIES=['https://stream.russian-tv.com','https://birch-creek.dyaltd.workers.dev','https://oak-valley.dyaltd.workers.dev'];
var PREEMPTIVE=@@PRE@@; /* каналы cinerama.uz: источник обрывает сессию через 10-12 минут, поэтому поток перезапускается раз в 6 минут */
var tg=window.Telegram&&Telegram.WebApp; if(tg){tg.ready();tg.expand();try{tg.setHeaderColor('secondary_bg_color')}catch(e){}}
var lc=((tg&&tg.initDataUnsafe&&tg.initDataUnsafe.user&&tg.initDataUnsafe.user.language_code)||navigator.language||'ru').slice(0,2).toLowerCase();
var EN=lc==='en';
var T=EN?{s:'Search channels…',all:'All',err:'The stream could not be loaded. It may be off air or temporarily unavailable.',retry:'Try again',site:'Website',share:'Share',none:'No channels found',load:'Loading…',pip:'PiP',tv:'To TV',full:'Fullscreen',pipno:'Picture-in-picture is not available here. Opening the website, where the player has its own PiP button.',tvhint:'Opening in your browser: tap the Cast icon there to send it to your TV.',live:'LIVE',close:'Close',air2:'Tap again to choose your TV',tvTitle:'To TV',tvHint:'On your TV open <b>russian-tv.com/tv</b>, tap “Подключить телефон” and enter the code.',tvGo:'Connect',tvBad:'Wrong code. Check the digits on the TV screen.',tvOffline:'The TV is offline. Open russian-tv.com/tv on it or enter a new code.',tvNet:'Cannot reach the server, try again.',tvOn:'Playing on TV',tvPhone:'Watch on phone',tvChrome:'Open the site in a browser (Google Cast)'}:{s:'Поиск каналов…',all:'Все',err:'Не удалось загрузить поток. Канал может быть не в эфире или временно недоступен.',retry:'Повторить',site:'Сайт',share:'Поделиться',none:'Каналы не найдены',load:'Загрузка…',pip:'PiP',tv:'На ТВ',full:'Во весь экран',pipno:'Картинка в картинке здесь недоступна. Открываем сайт, там у плеера есть своя кнопка.',tvhint:'Открываем в браузере: нажмите значок Cast, чтобы отправить на телевизор.',live:'LIVE',close:'Закрыть',air2:'Нажмите ещё раз, чтобы выбрать ТВ',tvTitle:'На телевизор',tvHint:'Откройте на телевизоре <b>russian-tv.com/tv</b>, нажмите «Подключить телефон» и введите код.',tvGo:'Подключить',tvBad:'Неверный код. Проверьте цифры на экране телевизора.',tvOffline:'Телевизор не на связи. Откройте на нём russian-tv.com/tv или введите новый код.',tvNet:'Нет связи с сервером, попробуйте ещё раз.',tvOn:'Идёт на телевизоре',tvPhone:'Смотреть на телефоне',tvChrome:'Открыть сайт в браузере (Google Cast)'};
document.documentElement.lang=EN?'en':'ru';
var THANK={ru:'⭐ Поблагодарить',en:'⭐ Say thanks',bg:'⭐ Благодаря',uk:'⭐ Подякувати',de:'⭐ Danke sagen',fr:'⭐ Remercier',es:'⭐ Agradecer',tr:'⭐ Teşekkür et'};
var thankText=THANK[lc]||THANK.ru;
var $=function(i){return document.getElementById(i)},cat='',hls=null,cur=null,vidEl=null,pxi=0,pxFail={},preT=0,NAT=false,TVON=false;
$('q').placeholder=T.s;
var IOS=/iPhone|iPad|iPod/.test(navigator.userAgent);
/* 20.11.2026: у СТС, РЕН ТВ, Пятницы!, Матч ТВ (fs.uplink.kz) звук MPEG Audio Layer II (mp2), а не AAC. iPhone/iPad (и встроенный плеер, и MediaSource) его не декодируют:
   видео идёт ~6 с, затем «Media failed to decode» (тест на iPhone, ios-test.html). Поэтому на iOS эти каналы идут через hls.js без звуковой дорожки,
   а звук mp2 декодируется на JS и играет через WebAudio (mp2-audio.js, mp2-decoder.js). */
var MP2=['rentv','pyatnica','matchtv'],IOSX=IOS||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function ext(u){if(tg&&tg.openLink){try{tg.openLink(u);return}catch(e){}}window.open(u,'_blank')}
function toast(t){var d=document.createElement('div');d.className='toast';d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},4500)}
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function lg(c){var t='<span class="lg" style="background:'+c.b+';color:'+c.k+'">'+esc(c.a)+'</span>';return c.g?'<span class="lg" style="background:'+c.b+'"><img src="'+c.g+'" alt="" loading="lazy" onerror="this.parentNode.style.background=\''+c.b+'\';this.parentNode.style.color=\''+c.k+'\';this.parentNode.textContent=\''+esc(c.a)+'\'"></span>':t}
function row(c){return '<div class="row'+(cur&&cur.i===c.i?' on':'')+'" data-id="'+c.i+'">'+lg(c)+'<div class="rn"><b>'+esc(c.n)+'</b><small>'+esc(c.d)+'</small></div><span class="live">'+T.live+'</span></div>'}
function chips(){var h='<button class="chip on" data-c="">'+T.all+'</button>';CATS.forEach(function(k){h+='<button class="chip" data-c="'+k.k+'">'+k.e+' '+k.ru+'</button>'});$('chips').innerHTML=h}
function render(){var s=$('q').value.trim().toLowerCase(),l=D.filter(function(c){return(!cat||c.c===cat)&&(!s||c.n.toLowerCase().indexOf(s)>=0)});$('list').innerHTML=l.length?l.map(row).join(''):'<div class="none">'+T.none+'</div>'}
function plh(){document.documentElement.style.setProperty('--plh',($('pl').style.display==='block'?$('pl').offsetHeight:0)+'px')}
chips();render();
$('q').addEventListener('input',render);
$('chips').addEventListener('click',function(e){var b=e.target.closest('.chip');if(!b)return;cat=b.dataset.c;[].forEach.call(document.querySelectorAll('.chip'),function(x){x.classList.toggle('on',x===b)});render()});
$('list').addEventListener('click',function(e){var r=e.target.closest('.row');if(r)open(r.dataset.id)});
function loadJs(src){return new Promise(function(ok,no){if(document.querySelector('script[src="'+src+'"]'))return ok();var s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
function stop(){clearTimeout(preT);if(window.MP2Audio)MP2Audio.detach();if(hls){try{hls.destroy()}catch(e){}hls=null}vidEl=null;$('box').innerHTML=''}
function streamUrl(c){return PROXIES[pxi%PROXIES.length]+'/stream?channel='+c.i}
function nextProxy(){pxFail[pxi%PROXIES.length]=Date.now();for(var i=1;i<=PROXIES.length;i++){var j=(pxi+i)%PROXIES.length;if(!pxFail[j]||Date.now()-pxFail[j]>90000){pxi+=i;return}}pxi++}
function err(box){var o=document.createElement('div');o.className='ov';o.innerHTML='<div style="font-size:30px">⚠</div><div></div><button type="button"></button>';o.children[1].textContent=T.err;o.children[2].textContent=T.retry;o.children[2].onclick=function(){start(cur)};box.appendChild(o)}
function start(c,tries){
  stop();tries=tries||0;var box=$('box');box.setAttribute('data-name',c.n);
  var url=streamUrl(c);
  var ld=document.createElement('div');ld.className='ov';ld.style.pointerEvents='none';ld.innerHTML='<div class="sp"></div><div>'+T.load+'</div>';
  var v=document.createElement('video');v.controls=true;v.autoplay=true;v.setAttribute('playsinline','');v.setAttribute('webkit-playsinline','');v.setAttribute('x-webkit-airplay','allow');vidEl=v;box.appendChild(v);box.appendChild(ld);
  var done=false,fails=0,t=setTimeout(function(){bad(true)},30000);
  function ok(){if(done)return;done=true;clearTimeout(t);ld.remove();if(PREEMPTIVE.indexOf(c.i)>=0){preT=setTimeout(function(){if(cur===c&&vidEl===v&&v.readyState>=3)start(c)},6*60*1000)}}
  function bad(retry){if(done)return;if(retry&&tries<PROXIES.length-1&&cur===c){clearTimeout(t);nextProxy();return start(c,tries+1)}done=true;clearTimeout(t);ld.remove();try{v.pause()}catch(e){}if(hls){try{hls.destroy()}catch(e){}hls=null}err(box)}
  v.addEventListener('playing',ok);v.addEventListener('error',function(){bad(true)});
  var M2=IOSX&&MP2.indexOf(c.i)>=0&&window.MP2Audio&&window.MP2Decoder;
  if(!NAT&&window.Hls&&Hls.isSupported()){
    var hcfg={lowLatencyMode:false,maxBufferLength:20,capLevelToPlayerSize:true,startLevel:0,manifestLoadingTimeOut:8000,manifestLoadingMaxRetry:1,levelLoadingTimeOut:8000,levelLoadingMaxRetry:2};
    if(M2){hcfg.fLoader=MP2Audio.loader(Hls);MP2Audio.attach(v)}
    hls=new Hls(hcfg);
    hls.loadSource(url);hls.attachMedia(v);
    hls.on(Hls.Events.MANIFEST_PARSED,function(){v.play().catch(function(){})});
    hls.on(Hls.Events.ERROR,function(e,d){if(!d.fatal)return;if(d.type===Hls.ErrorTypes.NETWORK_ERROR){if(!done&&++fails>1)bad(true);else if(!done)hls.startLoad();else hls.startLoad()}else if(d.type===Hls.ErrorTypes.MEDIA_ERROR){if(++fails>3)bad(false);else hls.recoverMediaError()}else bad(true)});
    if(window.tvPlayerUI)tvPlayerUI.attach(box,v,hls,url);
  }else{
    var nurl=url+((NAT||c.i==='ntv')?'&native=1':'');
    v.src=nurl;v.play().catch(function(){});if(window.tvPlayerUI)tvPlayerUI.attachNative(box,v,nurl)
  }
}
/* Полный экран (25.11.2026): на Android в Telegram requestFullscreen на <video> молча не срабатывал, запасного пути не было. Теперь: на контейнер плеера (панель качества остаётся),
   если браузер не вошёл в полный экран за 0,7 с или метода нет — «псевдо-полный экран» (класс body.fs: плеер на весь экран поверх страницы, кнопка ✕, системная «Назад» сначала выходит из него);
   в Telegram дополнительно tg.requestFullscreen() (убирает шапку), на Android блокировка альбомной ориентации. iPhone с нативным плеером — по-прежнему webkitEnterFullscreen. */
function fsOn(){return document.body.classList.contains('fs')||document.fullscreenElement||document.webkitFullscreenElement}
function fsOff(){
  if(document.fullscreenElement||document.webkitFullscreenElement){try{(document.exitFullscreen||document.webkitExitFullscreen).call(document)}catch(e){}}
  document.body.classList.remove('fs');
  try{if(tg&&tg.exitFullscreen&&tg.isFullscreen)tg.exitFullscreen()}catch(e){}
  try{screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock()}catch(e){}
  setTimeout(plh,50)
}
function fsLandscape(){try{if(screen.orientation&&screen.orientation.lock)screen.orientation.lock('landscape').catch(function(){})}catch(e){}}
function fsCss(){
  document.body.classList.add('fs');
  try{if(tg&&tg.requestFullscreen&&!tg.isFullscreen)tg.requestFullscreen()}catch(e){}
  fsLandscape()
}
function fsToggle(){
  var x=vidEl;if(!x)return;
  if(fsOn()){fsOff();return}
  if(x.webkitEnterFullscreen&&!x.requestFullscreen){try{x.webkitEnterFullscreen()}catch(e){}return}
  var box=$('box'),rq=box.requestFullscreen||box.webkitRequestFullscreen;
  if(!rq){fsCss();return}
  var done=false;
  function chk(){if(done)return;done=true;if(!(document.fullscreenElement||document.webkitFullscreenElement))fsCss()}
  try{var p=rq.call(box);if(p&&p.then)p.then(function(){done=true;fsLandscape()},chk)}catch(e){chk();return}
  setTimeout(chk,700)
}
function acts(c){
  var a=$('acts');a.innerHTML='';
  function add(label,cls,fn){var b=document.createElement('button');b.type='button';b.className='btn'+(cls?' '+cls:'');b.textContent=label;b.onclick=fn;a.appendChild(b)}
  var link=c.s?SITE+'/'+c.s+'/':'';
  var v=document.createElement('video');
  if((document.pictureInPictureEnabled)||(v.webkitSupportsPresentationMode&&v.webkitSupportsPresentationMode('picture-in-picture')))
    add('⧉ '+T.pip,'',function(){
      var x=vidEl;if(!x)return;
      function fb(){toast(T.pipno);if(link)setTimeout(function(){ext(link)},2500)}
      try{
        if(document.pictureInPictureElement){document.exitPictureInPicture();return}
        if(x.webkitSetPresentationMode&&x.webkitSupportsPresentationMode&&x.webkitSupportsPresentationMode('picture-in-picture')){
          if(x.webkitPresentationMode==='picture-in-picture'){x.webkitSetPresentationMode('inline');return}
          if(x.paused)x.play().catch(function(){});
          x.webkitSetPresentationMode('picture-in-picture');
          setTimeout(function(){if(x.webkitPresentationMode!=='picture-in-picture')fb()},1000);return}
        if(x.requestPictureInPicture){x.requestPictureInPicture().catch(fb);return}
      }catch(e){fb();return}
      fb()});
  add('⛶ '+T.full,'',fsToggle);
  add('📺 '+T.tv,'p',function(){tvAction(c,link,this)});
  if(link)add('🌐 '+T.site,'',function(){ext(link)});
  add('↗ '+T.share,'',function(){var u='https://t.me/share/url?url='+encodeURIComponent(link||'https://t.me/RussiaTVHub_bot/russiatv?startapp='+c.i)+'&text='+encodeURIComponent(c.n+' — '+T.live);if(tg&&tg.openTelegramLink)tg.openTelegramLink(u);else ext(u)});
  add(thankText,'star',openDonate);
}
/* «На ТВ»: iPhone — AirPlay (сначала нативный HLS, потом выбор ТВ), Android в Telegram — по коду с экрана ТВ (russian-tv.com/tv), остальные — Cast/Remote Playback или сайт в браузере */
var PAIR_API='https://pair.russian-tv.com',ANDROID=/Android/i.test(navigator.userAgent)||(tg&&tg.platform==='android');
function tvId(){try{return localStorage.getItem('rtv_paired_tv')}catch(e){return null}}
function tvSetId(v){try{localStorage.setItem('rtv_paired_tv',v)}catch(e){}}
function pairPost(path,body){return fetch(PAIR_API+path,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)})}
function tvAsk(msg){$('tv-err').textContent=msg||'';$('tv-code').value='';$('tv-modal').style.display='flex';try{$('tv-code').focus()}catch(e){}}
function tvShowOn(c){stop();var box=$('box');var o=document.createElement('div');o.className='ov';o.innerHTML='<div style="font-size:30px">📺</div><div></div><button type="button"></button>';o.children[1].textContent=T.tvOn;o.children[2].textContent=T.tvPhone;o.children[2].onclick=function(){TVON=false;start(c)};box.appendChild(o)}
function tvSend(c,btn){
  var tv=tvId();if(!tv){tvAsk();return}
  pairPost('/play',{tv:tv,channel:c.i,name:c.n}).then(function(r){return r.json()}).then(function(d){
    if(d.delivered){TVON=true;tvShowOn(c)}else{TVON=false;tvAsk(T.tvOffline)}
  }).catch(function(){TVON=false;tvAsk(T.tvNet)})}
function tvAction(c,link,btn){
  var x=vidEl;
  if(IOS){
    if(!x)return;
    try{x.muted=false;x.volume=1}catch(e){}   // заглушённое видео iOS на ТВ не передаёт
    var hasAir=!!window.WebKitPlaybackTargetAvailabilityEvent&&typeof x.webkitShowPlaybackTargetPicker==='function';
    if(!hasAir){if(link)ext(link);else toast(T.tvhint);return}    // WebView без AirPlay API: открываем страницу канала в Safari
    if(!x.currentSrc||/^blob:/.test(x.currentSrc)){NAT=true;btn.textContent='📲 '+T.air2;btn.classList.add('air-next');start(c);return}   // шаг 1: с hls.js на нативный HLS
    btn.textContent='📺 '+T.tv;btn.classList.remove('air-next');
    try{x.webkitShowPlaybackTargetPicker()}catch(e){}return}
  if(ANDROID){if(TVON){TVON=false;start(c)}else tvSend(c,btn);return}
  if(x&&x.webkitShowPlaybackTargetPicker){x.webkitShowPlaybackTargetPicker();return}
  if(x&&x.remote&&x.remote.prompt){x.remote.prompt().catch(function(){toast(T.tvhint);if(link)ext(link)});return}
  toast(T.tvhint);if(link)setTimeout(function(){ext(link)},900)}
$('tv-title').textContent=T.tvTitle;$('tv-hint').innerHTML=T.tvHint;$('tv-go').textContent=T.tvGo;$('tv-chrome').textContent=T.tvChrome;
$('tv-close').onclick=function(){$('tv-modal').style.display='none'};
$('tv-chrome').onclick=function(){var u=SITE+'/'+(cur&&cur.s?cur.s+'/':'');ext(u)};
$('tv-go').onclick=function(){
  var code=$('tv-code').value.trim();if(!/^[0-9]{6}$/.test(code)){$('tv-err').textContent=T.tvBad;return}
  pairPost('/pair',{code:code}).then(function(r){return r.json()}).then(function(d){
    if(!d.tv){$('tv-err').textContent=T.tvBad;return}
    tvSetId(d.tv);$('tv-modal').style.display='none';if(cur)tvSend(cur)
  }).catch(function(){$('tv-err').textContent=T.tvNet})};
function open(id){
  var c=D.filter(function(x){return x.i===id})[0];if(!c)return;cur=c;
  $('pl').style.display='block';
  $('vn').textContent=c.n;$('vd').textContent=c.d;
  NAT=false;TVON=false;acts(c);start(c);plh();
  [].forEach.call($('list').querySelectorAll('.row'),function(r){r.classList.toggle('on',r.dataset.id===id)});
  if(tg&&tg.BackButton)tg.BackButton.show();
  try{history.replaceState(null,'','#'+id)}catch(e){}
}
function closePl(){fsOff();stop();cur=null;$('pl').style.display='none';plh();[].forEach.call($('list').querySelectorAll('.row.on'),function(r){r.classList.remove('on')});if(tg&&tg.BackButton)tg.BackButton.hide();try{history.replaceState(null,'',location.pathname)}catch(e){}}
$('x').onclick=closePl;
if(tg&&tg.BackButton)tg.BackButton.onClick(function(){if(document.body.classList.contains('fs')){fsOff();return}closePl()});
$('fsx').onclick=fsOff;
document.addEventListener('fullscreenchange',function(){if(!document.fullscreenElement){try{screen.orientation&&screen.orientation.unlock&&screen.orientation.unlock()}catch(e){}}});
window.addEventListener('resize',plh);
/* Благодарность через Telegram Stars: окно выбора суммы, оплата tg.openInvoice (счёт создаёт russia-bot-worker, /invoice?amount=N) */
var donateModal=$('donate-modal');
function openDonate(){
  $('donate-title').textContent=thankText;
  var box=$('donate-amounts');box.innerHTML='';
  [25,50,100,250].forEach(function(n){var b=document.createElement('button');b.textContent='⭐ '+n;b.onclick=function(){payStars(n)};box.appendChild(b)});
  donateModal.style.display='flex';
}
async function payStars(amount){
  try{
    var r=await fetch(BOT_API+'/invoice?amount='+amount),d=await r.json();
    if(!d.url||!(tg&&tg.openInvoice))return;
    donateModal.style.display='none';tg.openInvoice(d.url);
  }catch(e){}
}
$('donate-close').onclick=function(){donateModal.style.display='none'};
donateModal.addEventListener('click',function(e){if(e.target===donateModal)donateModal.style.display='none'});
$('thank-btn').textContent=thankText;$('thank-btn').onclick=openDonate;
/* t.me/RussiaTVHub_bot/russiatv?startapp=<id канала> открывает канал сразу, startapp=donate — окно ⭐ */
try{
  var hp=new URLSearchParams((location.hash||'').replace('#','')),hashId=(location.hash||'').indexOf('=')<0?(location.hash||'').replace('#',''):'';
  var sp=(tg&&tg.initDataUnsafe&&tg.initDataUnsafe.start_param)||hp.get('tgWebAppStartParam')||hashId||'';
  sp=String(sp).replace(/[^\w-]/g,'');
  if(sp==='donate')openDonate();else if(sp)open(sp);
}catch(e){}
</script></body></html>
'''
import time
VER=time.strftime('%Y%m%d%H%M%S',time.gmtime())
html=html.replace('@@D@@',json.dumps(D,ensure_ascii=False,separators=(',',':'))).replace('@@CATS@@',json.dumps(CATS,ensure_ascii=False,separators=(',',':'))).replace('@@PRE@@',json.dumps(PRE)).replace('@@VER@@',VER)
open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','index.html'),'w',encoding='utf8').write(html)
print(len(html))
open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'..','version.json'),'w').write(json.dumps({'v':VER}))
