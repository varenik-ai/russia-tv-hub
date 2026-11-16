// rtv-monitor — сбор результатов запуска каналов (сайт и мини-апп) и страница статистики /stats?k=<ключ>.
// Хранятся только счётчики по (день, канал, страна, провайдер ASN, устройство, браузер, результат, код ошибки): ни IP, ни cookie, ни идентификатора посетителя.
const ALLOW = ["https://russian-tv.com", "https://www.russian-tv.com", "https://varenik-ai.github.io"];
const KEEP_DAYS = 90;
const cors = (origin) => ({ "Access-Control-Allow-Origin": ALLOW.includes(origin) ? origin : ALLOW[0], "Access-Control-Allow-Methods": "POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type", "Vary": "Origin" });
const s = (v, n) => String(v == null ? "" : v).replace(/[^\w.\-:]/g, "").slice(0, n);
const DEV = ["ios", "android", "desktop", "tv"], BR = ["safari", "chrome", "firefox", "edge", "tg", "other"], SRC = ["site", "app"];

async function record(request, env) {
  const origin = request.headers.get("Origin") || "";
  if (origin && !ALLOW.includes(origin)) return new Response("forbidden", { status: 403 });
  let p; try { p = JSON.parse(await request.text()); } catch { return new Response("bad", { status: 400, headers: cors(origin) }); }
  const ch = s(p.c, 40); if (!ch || !/^[A-Za-z0-9_-]+$/.test(ch)) return new Response("bad", { status: 400, headers: cors(origin) });
  const cf = request.cf || {};
  const ok = p.o ? 1 : 0, kind = p.k === "d" ? "d" : "s";
  const row = {
    day: new Date().toISOString().slice(0, 10), ch, src: SRC.includes(p.s) ? p.s : "site", cc: s(cf.country, 2) || "XX", asn: Number(cf.asn) || 0,
    dev: DEV.includes(p.d) ? p.d : "desktop", br: BR.includes(p.b) ? p.b : "other", kind, ok, code: ok ? "" : (s(p.e, 40) || "unknown"),
    http: ok ? 0 : Math.min(Math.max(parseInt(p.h, 10) || 0, 0), 999), host: ok ? "" : s(p.x, 60), wk: s(p.w, 60), ttf: ok && kind === "s" ? Math.min(Math.max(parseInt(p.t, 10) || 0, 0), 120000) : 0,
  };
  await env.DB.batch([
    env.DB.prepare("INSERT INTO ev (day,ch,src,cc,asn,dev,br,kind,ok,code,http,host,wk,n,ttf) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,1,?) ON CONFLICT(day,ch,src,cc,asn,dev,br,kind,ok,code,http,host,wk) DO UPDATE SET n=n+1, ttf=ttf+excluded.ttf")
      .bind(row.day, row.ch, row.src, row.cc, row.asn, row.dev, row.br, row.kind, row.ok, row.code, row.http, row.host, row.wk, row.ttf),
    env.DB.prepare("INSERT OR IGNORE INTO asn_org (asn, org) VALUES (?, ?)").bind(row.asn, String(cf.asOrganization || "").slice(0, 80)),
  ]);
  return new Response(null, { status: 204, headers: cors(origin) });
}

function sinceDay(days) { return new Date(Date.now() - (days - 1) * 864e5).toISOString().slice(0, 10); }
async function api(url, env) {
  const days = Math.min(Math.max(parseInt(url.searchParams.get("days"), 10) || 7, 1), 90);
  const src = url.searchParams.get("src"), ch = url.searchParams.get("ch");
  const where = ["day >= ?"], bind = [sinceDay(days)];
  if (SRC.includes(src)) { where.push("src = ?"); bind.push(src); }
  if (ch && /^[A-Za-z0-9_-]+$/.test(ch)) { where.push("ch = ?"); bind.push(ch); }
  const W = where.join(" AND ");
  const q = (sql, extra = []) => env.DB.prepare(sql).bind(...bind, ...extra).all().then(r => r.results);
  const F = "SUM(CASE WHEN ok=0 THEN n ELSE 0 END)";
  const [daily, channels, problems, geo, errors, drops, ttf] = await Promise.all([
    q(`SELECT day, SUM(n) n, ${F} fail FROM ev WHERE ${W} AND kind='s' GROUP BY day ORDER BY day`),
    q(`SELECT ch, SUM(n) n, ${F} fail FROM ev WHERE ${W} AND kind='s' GROUP BY ch ORDER BY ${F} DESC, SUM(n) DESC LIMIT 200`),
    q(`SELECT ev.ch, cc, ev.asn, COALESCE(o.org,'') org, SUM(n) n, ${F} fail FROM ev LEFT JOIN asn_org o ON o.asn = ev.asn WHERE ${W} AND kind='s' GROUP BY ev.ch, cc, ev.asn HAVING SUM(n) >= 3 AND ${F} * 2 >= SUM(n) ORDER BY SUM(n) DESC LIMIT 150`),
    q(`SELECT cc, ev.asn, COALESCE(o.org,'') org, SUM(n) n, ${F} fail FROM ev LEFT JOIN asn_org o ON o.asn = ev.asn WHERE ${W} AND kind='s' GROUP BY cc, ev.asn ORDER BY SUM(n) DESC LIMIT 120`),
    q(`SELECT ch, code, http, host, wk, SUM(n) n FROM ev WHERE ${W} AND kind='s' AND ok=0 GROUP BY ch, code, http, host, wk ORDER BY SUM(n) DESC LIMIT 100`),
    q(`SELECT ch, SUM(n) n FROM ev WHERE ${W} AND kind='d' GROUP BY ch ORDER BY SUM(n) DESC LIMIT 50`),
    q(`SELECT ch, SUM(ttf) t, SUM(n) n FROM ev WHERE ${W} AND kind='s' AND ok=1 GROUP BY ch`),
  ]);
  return { days, src: src || "", ch: ch || "", daily, channels, problems, geo, errors, drops, ttf, now: new Date().toISOString() };
}

// ---- ежедневный отчёт администратору в Telegram (через /notify бота) ----
const esc = (t) => String(t).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
const pc = (f, n) => (n ? Math.round((f * 1000) / n) / 10 : 0);
async function buildReport(env) {
  const d = await api(new URL("https://x/api?days=7"), env);
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  const yd = d.daily.find((x) => x.day === y) || { n: 0, fail: 0 };
  const week = d.daily.reduce((a, x) => ({ n: a.n + x.n, fail: a.fail + x.fail }), { n: 0, fail: 0 });
  const errs = (await env.DB.prepare("SELECT code, host, SUM(n) n FROM ev WHERE day = ? AND kind = 's' AND ok = 0 GROUP BY code, host ORDER BY SUM(n) DESC LIMIT 5").bind(y).all()).results;
  let t = `📊 <b>Мониторинг каналов</b>\nЗа ${y}: попыток запуска <b>${yd.n}</b>, не пошло <b>${yd.fail}</b> (${pc(yd.fail, yd.n)}%)\nЗа 7 дней: ${week.n} попыток, не пошло ${week.fail} (${pc(week.fail, week.n)}%)\n`;
  if (!week.n) return t + "\nДанных за неделю нет (посетители не запускали каналы или скрипт не отправляет отчёты).";
  if (d.problems.length) {
    t += "\n⚠️ <b>Где не работает</b> (за 7 дней, неудач от 50%, от 3 попыток):\n";
    t += d.problems.slice(0, 10).map((x) => `• ${esc(x.ch)} — ${esc(x.cc)}, ${esc((x.org || "AS" + x.asn).slice(0, 28))}: не пошло ${x.fail} из ${x.n}`).join("\n") + "\n";
  } else t += "\n✅ Проблемных сочетаний канал × страна × провайдер нет.\n";
  const bad = d.channels.filter((x) => x.n >= 10 && x.fail * 100 >= x.n * 30).slice(0, 8);
  if (bad.length) t += "\n📉 <b>Каналы с долей неудач от 30%</b> (от 10 попыток):\n" + bad.map((x) => `• ${esc(x.ch)}: ${pc(x.fail, x.n)}% (${x.fail} из ${x.n})`).join("\n") + "\n";
  if (errs.length) t += "\n🔧 <b>Ошибки вчера:</b>\n" + errs.map((x) => `• ${esc(x.code)}${x.host ? " @ " + esc(x.host) : ""} — ${x.n}`).join("\n") + "\n";
  return t + `\n<a href="https://rtv-monitor.dyaltd.workers.dev/stats?k=${env.STATS_KEY}">Открыть статистику</a>`;
}
async function sendReport(env) {
  const text = await buildReport(env);
  const r = await env.BOT.fetch("https://bot.internal/notify", {   // сервисная привязка: воркер на workers.dev не может вызвать другой воркер по публичному адресу (ошибка 1042)
     method: "POST", headers: { "content-type": "application/json", "x-notify-key": env.NOTIFY_KEY }, body: JSON.stringify({ text }) });
  return { status: r.status, text };
}

const PAGE = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Мониторинг каналов</title>
<style>:root{color-scheme:dark}body{margin:0;background:#0b0b14;color:#e8e8f2;font:14px/1.4 -apple-system,Segoe UI,Roboto,sans-serif}header{position:sticky;top:0;background:#12121f;border-bottom:1px solid #26263a;padding:10px 14px;display:flex;gap:10px;flex-wrap:wrap;align-items:center;z-index:5}
h1{font-size:16px;margin:0 8px 0 0}select,button{background:#1b1b30;color:#e8e8f2;border:1px solid #33334d;border-radius:8px;padding:6px 10px;font:inherit}main{padding:14px;max-width:1200px;margin:auto}
.cards{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px}.card{background:#14141f;border:1px solid #26263a;border-radius:10px;padding:10px 14px;min-width:150px}.card b{display:block;font-size:22px}.card span{color:#8d8da3;font-size:12px}
h2{font-size:15px;margin:22px 0 8px}table{width:100%;border-collapse:collapse;background:#14141f;border:1px solid #26263a;border-radius:10px;overflow:hidden}th,td{padding:6px 10px;text-align:left;border-bottom:1px solid #1f1f31;white-space:nowrap}th{background:#181828;color:#9a9ab2;font-weight:600;font-size:12px}td.num,th.num{text-align:right}
.bad{color:#ff7b7b;font-weight:700}.warn{color:#ffc857}.ok{color:#5fd38a}tr.cl{cursor:pointer}tr.cl:hover{background:#1a1a2c}.scroll{overflow-x:auto}.bars{display:flex;gap:3px;align-items:flex-end;height:90px;background:#14141f;border:1px solid #26263a;border-radius:10px;padding:8px}
.bar{flex:1;min-width:6px;background:#2a5fd0;position:relative;border-radius:3px 3px 0 0}.bar i{position:absolute;left:0;right:0;bottom:0;background:#e0443a;border-radius:3px 3px 0 0}.note{color:#8d8da3;font-size:12px;margin-top:8px}</style></head><body>
<header><h1>Мониторинг каналов</h1><label>Период <select id="days"><option value="1">24 часа</option><option value="7" selected>7 дней</option><option value="30">30 дней</option><option value="90">90 дней</option></select></label>
<label>Источник <select id="src"><option value="">сайт и мини-апп</option><option value="site">сайт</option><option value="app">мини-апп</option></select></label><span id="chf"></span><button id="rl">Обновить</button></header>
<main><div class="cards" id="cards"></div><h2>По дням (попытки запуска, красным — не пошли)</h2><div class="bars" id="bars"></div>
<h2>Где не работает: канал × страна × провайдер (не пошёл в 50% и больше попыток, от 3 попыток)</h2><div class="scroll"><table id="prob"></table></div>
<h2>Каналы</h2><div class="scroll"><table id="chs"></table></div><h2>Ошибки</h2><div class="scroll"><table id="errs"></table></div>
<h2>Страны и провайдеры</h2><div class="scroll"><table id="geo"></table></div><h2>Обрывы после начала просмотра</h2><div class="scroll"><table id="drops"></table></div>
<p class="note">Считаются попытки запуска: «пошёл» — hls.js или встроенный плеер получил первый кадр за 40 секунд. Данные без IP и идентификаторов; страна и провайдер определяются сетью Cloudflare. Хранение 90 дней.</p></main>
<script>
var K=new URLSearchParams(location.search).get('k')||'',CH='',$=function(i){return document.getElementById(i)};
function esc(s){return String(s).replace(/[&<>"]/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
function pct(f,n){return n?Math.round(f*1000/n)/10:0}function cl(p){return p>=50?'bad':p>=15?'warn':'ok'}
function tbl(id,head,rows){$(id).innerHTML='<tr>'+head.map(function(h){return'<th'+(h[1]?' class="num"':'')+'>'+h[0]+'</th>'}).join('')+'</tr>'+(rows.length?rows.join(''):'<tr><td colspan="'+head.length+'">Нет данных за период</td></tr>')}
function load(){fetch('/api?k='+encodeURIComponent(K)+'&days='+$('days').value+'&src='+$('src').value+'&ch='+CH).then(function(r){if(!r.ok)throw 0;return r.json()}).then(show).catch(function(){$('cards').innerHTML='<div class="card"><b class="bad">Нет доступа или ошибка</b><span>Проверьте ключ в адресе (?k=…)</span></div>'})}
function show(d){
 var n=0,f=0;d.daily.forEach(function(x){n+=x.n;f+=x.fail});
 $('cards').innerHTML='<div class="card"><b>'+n+'</b><span>попыток запуска</span></div><div class="card"><b class="'+cl(pct(f,n))+'">'+pct(f,n)+'%</b><span>не пошло ('+f+')</span></div><div class="card"><b>'+d.problems.length+'</b><span>проблемных сочетаний канал×страна×провайдер</span></div><div class="card"><b>'+d.channels.length+'</b><span>каналов с данными</span></div>';
 $('chf').innerHTML=d.ch?'Канал: <b>'+esc(d.ch)+'</b> <button onclick="CH=\\'\\';load()">показать все</button>':'';
 var mx=Math.max.apply(null,d.daily.map(function(x){return x.n}).concat([1]));
 $('bars').innerHTML=d.daily.map(function(x){return'<div class="bar" title="'+x.day+': '+x.n+' попыток, не пошло '+x.fail+' ('+pct(x.fail,x.n)+'%)" style="height:'+Math.max(4,x.n*100/mx)+'%"><i style="height:'+(x.n?x.fail*100/x.n:0)+'%"></i></div>'}).join('')||'<span class="note">Нет данных</span>';
 tbl('prob',[['Канал'],['Страна'],['Провайдер (ASN)'],['Попыток',1],['Не пошло',1],['%',1]],d.problems.map(function(x){var p=pct(x.fail,x.n);return'<tr class="cl" onclick="CH=\\''+esc(x.ch)+'\\';load()"><td>'+esc(x.ch)+'</td><td>'+esc(x.cc)+'</td><td>'+esc(x.org)+' (AS'+x.asn+')</td><td class="num">'+x.n+'</td><td class="num">'+x.fail+'</td><td class="num '+cl(p)+'">'+p+'%</td></tr>'}));
 var tt={};d.ttf.forEach(function(x){tt[x.ch]=x.n?Math.round(x.t/x.n/100)/10:0});
 tbl('chs',[['Канал'],['Попыток',1],['Не пошло',1],['%',1],['Первый кадр, с',1]],d.channels.map(function(x){var p=pct(x.fail,x.n);return'<tr class="cl" onclick="CH=\\''+esc(x.ch)+'\\';load()"><td>'+esc(x.ch)+'</td><td class="num">'+x.n+'</td><td class="num">'+x.fail+'</td><td class="num '+cl(p)+'">'+p+'%</td><td class="num">'+(tt[x.ch]||'')+'</td></tr>'}));
 tbl('errs',[['Канал'],['Код'],['HTTP',1],['Хост'],['Воркер'],['Раз',1]],d.errors.map(function(x){return'<tr><td>'+esc(x.ch)+'</td><td>'+esc(x.code)+'</td><td class="num">'+(x.http||'')+'</td><td>'+esc(x.host)+'</td><td>'+esc(x.wk)+'</td><td class="num">'+x.n+'</td></tr>'}));
 tbl('geo',[['Страна'],['Провайдер (ASN)'],['Попыток',1],['Не пошло',1],['%',1]],d.geo.map(function(x){var p=pct(x.fail,x.n);return'<tr><td>'+esc(x.cc)+'</td><td>'+esc(x.org)+' (AS'+x.asn+')</td><td class="num">'+x.n+'</td><td class="num">'+x.fail+'</td><td class="num '+cl(p)+'">'+p+'%</td></tr>'}));
 tbl('drops',[['Канал'],['Обрывов',1]],d.drops.map(function(x){return'<tr><td>'+esc(x.ch)+'</td><td class="num">'+x.n+'</td></tr>'}));
}
['days','src'].forEach(function(i){$(i).onchange=load});$('rl').onclick=load;load();
</script></body></html>`;

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(request.headers.get("Origin") || "") });
    if (url.pathname === "/r" && request.method === "POST") return record(request, env);
    const okKey = env.STATS_KEY && url.searchParams.get("k") === env.STATS_KEY;
    if (url.pathname === "/stats") return okKey ? new Response(PAGE, { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } }) : new Response("Not found", { status: 404 });
    if (url.pathname === "/report") return okKey ? new Response(JSON.stringify(await sendReport(env)), { headers: { "Content-Type": "application/json" } }) : new Response("Not found", { status: 404 });
    if (url.pathname === "/api") return okKey ? new Response(JSON.stringify(await api(url, env)), { headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } }) : new Response("Not found", { status: 404 });
    return new Response("rtv-monitor", { status: 200 });
  },
  async scheduled(event, env) {
    if (event.cron === "0 6 * * *") { await sendReport(env); return; }
    await env.DB.prepare("DELETE FROM ev WHERE day < ?").bind(new Date(Date.now() - KEEP_DAYS * 864e5).toISOString().slice(0, 10)).run();
  },
};
