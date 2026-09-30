import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { config, spin } from './engine.mjs';
import {
  loadSessions,
  saveSessions,
} from "./session-store.mjs";
// Demo sessions are server-authoritative, survive refresh, and expire after 24h.
// A server restart resets them. Replace this store with a database for persistence.
const sessions = loadSessions();
const clients = new Map();
function emit(id, event) { for (const client of clients.get(id) ?? []) client.write(`data: ${JSON.stringify(event)}\n\n`); }
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (!url.pathname.startsWith('/api/')) { res.writeHead(404).end(); return; }
  let id = /(?:^|;\s*)slot_session=([a-f0-9-]+)/.exec(req.headers.cookie ?? '')?.[1];
  if (!sessions.has(id)) {
    id = randomUUID();
    sessions.set(id, { credits: config.startCredits, lastSpin: null, requests: new Map(), lastRequest: 0, touched: Date.now() });
    res.setHeader('Set-Cookie', `slot_session=${id}; HttpOnly; SameSite=Strict; Path=/; Max-Age=86400`);
  }
  const session = sessions.get(id);
  session.touched = Date.now();
  const json = (status, data) => { res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); };
  const snapshot = () => ({ credits: session.credits, lastSpin: session.lastSpin });
  if (req.method === 'GET' && url.pathname === '/api/session') { json(200, snapshot()); return; }
  if (req.method === 'GET' && url.pathname === '/api/events') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    if (!clients.has(id)) clients.set(id, new Set());
    clients.get(id).add(res);
    res.write(`data: ${JSON.stringify({ type: 'session', session: snapshot() })}\n\n`);
    const heartbeat = setInterval(() => res.write(': heartbeat\n\n'), 15000);
    req.on('close', () => { clearInterval(heartbeat); clients.get(id)?.delete(res); if (!clients.get(id)?.size) clients.delete(id); });
    return;
  }
  if (req.method === 'POST' && url.pathname === '/api/spin') {
    // Same-origin requests only; Vite proxy forwards browser Origin.
    if (req.headers.origin && req.headers.origin !== `http://${req.headers.host}` && req.headers.origin !== `https://${req.headers.host}`) { json(403, { message: 'Invalid origin' }); return; }
    try {
      let body = '';
      for await (const chunk of req) { body += chunk; if (body.length > 4096) throw new Error('Request too large'); }
      const { bet, requestId } = JSON.parse(body);
      if (typeof requestId !== 'string' || !/^[a-f0-9-]{36}$/.test(requestId)) throw new Error('Invalid request ID');
      const previous = session.requests.get(requestId);
      if (previous) {
        if (previous.bet !== bet) throw new Error('Request ID already used for another bet');
        json(200, previous); return;
      }
      if (Date.now() - session.lastRequest < 250) throw new Error('Please wait before the next spin');
      const previousState = {
        credits: session.credits,
        lastSpin: session.lastSpin,
        lastRequest: session.lastRequest,
        requests: new Map(session.requests),
      };

      let result;

      try {
        result = spin(session, bet);

        session.lastRequest = Date.now();
        session.requests.set(requestId, result);

        if (session.requests.size > 1000) {
          const oldestId = session.requests.keys().next().value;
          session.requests.delete(oldestId);
        }

        // Запазваме резултата преди да го изпратим.
        saveSessions(sessions);
      } catch (error) {
        // При неуспешен запис връщаме предишния баланс.
        Object.assign(session, previousState);
        throw error;
      }

      emit(id, {
        type: "spin:result",
        result,
      });

      json(200, result);
    } catch (error) { emit(id, { type: 'spin:error', message: error.message }); json(400, { message: error.message }); }
    return;
  }
  json(404, { message: 'Not found' });
});
setInterval(() => { for (const [id, session] of sessions) if (Date.now() - session.touched > 86400000 && !clients.has(id)) sessions.delete(id); }, 60000).unref();
server.listen(Number(process.env.PORT ?? 3001), '127.0.0.1', () => console.log('Slot API: http://127.0.0.1:3001'));
