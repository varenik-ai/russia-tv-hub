// russia-tv-pair: связь «телефон и телевизор» для russian-tv.com/tv. Видео через воркер не идёт, только код и номер канала.
// POST /code {tv}            → {code}  телевизор получает код на 10 минут
// POST /pair {code}          → {tv}    телефон обменивает код на постоянный id телевизора
// POST /play {tv,channel,name} → {delivered} телефон запускает канал на телевизоре
// GET  /ws?tv=<id>           WebSocket телевизора (ping/pong без пробуждения объекта)
const CODE_TTL = 10 * 60 * 1000, RATE_WINDOW = 10 * 60 * 1000, PAIR_TRIES = 10, CODE_TRIES = 20, MAX_SOCKETS = 3;
const TV_RE = /^[0-9a-f]{32}$/, CODE_RE = /^[0-9]{6}$/, CH_RE = /^[A-Za-z0-9_-]{1,40}$/;
const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400' };
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS } });

export class PairDO {
  constructor(state) {
    this.state = state;
    state.setWebSocketAutoResponse(new WebSocketRequestResponsePair('ping', 'pong'));
  }
  async fetch(req) {
    const path = new URL(req.url).pathname;
    if (path === '/ws') {
      const old = this.state.getWebSockets();
      old.slice(0, Math.max(0, old.length - MAX_SOCKETS + 1)).forEach(w => { try { w.close(1000, 'replaced'); } catch (e) {} });
      const pair = new WebSocketPair();
      this.state.acceptWebSocket(pair[1]);
      return new Response(null, { status: 101, webSocket: pair[0] });
    }
    const body = await req.json();
    if (path === '/send') {
      let delivered = 0;
      this.state.getWebSockets().forEach(w => { try { w.send(JSON.stringify(body)); delivered++; } catch (e) {} });
      return json({ delivered });
    }
    if (path === '/code-set') {
      const until = await this.state.storage.get('until');
      if (until && until > Date.now()) return json({ ok: false });
      await this.state.storage.put({ tv: body.tv, until: Date.now() + CODE_TTL });
      await this.state.storage.setAlarm(Date.now() + CODE_TTL);
      return json({ ok: true });
    }
    if (path === '/code-take') {
      const tv = await this.state.storage.get('tv'), until = await this.state.storage.get('until');
      await this.state.storage.deleteAll();
      return json({ tv: tv && until > Date.now() ? tv : null });
    }
    if (path === '/rate') {
      let n = await this.state.storage.get('n') || 0;
      if (n >= body.max) return json({ ok: false });
      await this.state.storage.put('n', n + 1);
      if (!n) await this.state.storage.setAlarm(Date.now() + RATE_WINDOW);
      return json({ ok: true });
    }
    return json({ error: 'not found' }, 404);
  }
  async alarm() { await this.state.storage.deleteAll(); }
  webSocketMessage() {}
  webSocketClose(ws) { try { ws.close(); } catch (e) {} }
  webSocketError() {}
}

const call = async (env, name, path, body) => {
  const stub = env.PAIR.get(env.PAIR.idFromName(name));
  const r = await stub.fetch('https://do' + path, { method: 'POST', body: JSON.stringify(body) });
  return r.json();
};
const limited = async (env, req, kind, max) => !(await call(env, 'rate:' + kind + ':' + (req.headers.get('CF-Connecting-IP') || ''), '/rate', { max })).ok;

export default {
  async fetch(req, env) {
    const url = new URL(req.url), path = url.pathname;
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (path === '/ws') {
      const tv = url.searchParams.get('tv') || '';
      if (req.headers.get('Upgrade') !== 'websocket' || !TV_RE.test(tv)) return json({ error: 'bad request' }, 400);
      return env.PAIR.get(env.PAIR.idFromName('tv:' + tv)).fetch(new Request('https://do/ws', req));
    }
    if (req.method !== 'POST') return json({ error: 'not found' }, 404);
    let b; try { b = await req.json(); } catch (e) { return json({ error: 'bad request' }, 400); }
    if (path === '/code') {
      if (!TV_RE.test(b.tv || '')) return json({ error: 'bad request' }, 400);
      if (await limited(env, req, 'code', CODE_TRIES)) return json({ error: 'too many requests' }, 429);
      for (let i = 0; i < 5; i++) {
        const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
        if ((await call(env, 'code:' + code, '/code-set', { tv: b.tv })).ok) return json({ code, ttl: CODE_TTL / 1000 });
      }
      return json({ error: 'try again' }, 503);
    }
    if (path === '/pair') {
      if (!CODE_RE.test(b.code || '')) return json({ error: 'bad code' }, 400);
      if (await limited(env, req, 'pair', PAIR_TRIES)) return json({ error: 'too many requests' }, 429);
      const { tv } = await call(env, 'code:' + b.code, '/code-take', {});
      if (!tv) return json({ error: 'bad code' }, 404);
      await call(env, 'tv:' + tv, '/send', { t: 'paired' });
      return json({ tv });
    }
    if (path === '/play') {
      if (!TV_RE.test(b.tv || '') || !CH_RE.test(b.channel || '')) return json({ error: 'bad request' }, 400);
      return json(await call(env, 'tv:' + b.tv, '/send', { t: 'play', channel: b.channel, name: String(b.name || '').slice(0, 60) }));
    }
    return json({ error: 'not found' }, 404);
  }
};
