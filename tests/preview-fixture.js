// Isolated UI fixture: no provider imports, external calls or real bot messages.
// Run manually with `node tests/preview-fixture.js`, then open 127.0.0.1:4174.
import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const PORT = Number(process.env.PORT || 4174);
const publicDir = fileURLToPath(new URL('../public/', import.meta.url));
const events = [];
let open = false;
const json = (res, status, payload) => {
  res.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
};
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  if (url.pathname === '/__fixture/events') return json(res, 200, events);
  if (url.pathname === '/api/status') {
    return json(res, 200, { ok: true, provider: 'grok-bot', session: open ? 'open' : 'closed', detail: 'LOCAL TEST FIXTURE', providers: [] });
  }
  if (url.pathname === '/api/bots') {
    events.push({ type: 'list' }); open = true;
    return json(res, 200, { ok: true, bots: [
      { id: 'qa-research', name: 'QA Research Agent' },
      { id: 'qa-writing', name: 'QA Writing Agent' },
      { id: 'qa-error', name: 'QA Connection Check' },
    ], logs: ['LOCAL TEST FIXTURE: no real agents connected.'] });
  }
  if (url.pathname === '/api/chat' && req.method === 'POST') {
    let raw = ''; for await (const chunk of req) raw += chunk;
    const body = JSON.parse(raw); events.push({ type: 'chat', ...body });
    await new Promise(resolve => setTimeout(resolve, 4000));
    return body.botId === 'qa-error'
      ? json(res, 409, { ok: false, error: 'LOCAL TEST: sign-in is required. No message was sent.', logs: ['Fixture rejected this request.'] })
      : json(res, 200, { ok: true, reply: `LOCAL TEST REPLY from ${body.botId}: ${body.text}`, logs: ['Fixture reply captured.'] });
  }
  if (url.pathname === '/api/release' && req.method === 'POST') {
    events.push({ type: 'release' }); open = false;
    return json(res, 200, {
      ok: true,
      logs: ['LOCAL TEST FIXTURE: closed the hidden Grok Bot and handed it back.'],
    });
  }
  if (url.pathname.startsWith('/api/')) return json(res, 404, { ok: false, error: 'No provider exists in this fixture.' });
  const filename = path.join(publicDir, url.pathname === '/' ? 'index.html' : url.pathname);
  if (path.relative(publicDir, filename).startsWith('..')) { res.writeHead(403); res.end(); return; }
  try {
    const data = await fs.readFile(filename);
    res.writeHead(200, { 'Content-Type': ({ '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.json': 'application/json', '.woff2': 'font/woff2' })[path.extname(filename)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  } catch { res.writeHead(404); res.end(); }
});
server.listen(PORT, '127.0.0.1', () => console.log(`LOCAL TEST FIXTURE: http://127.0.0.1:${PORT} — no real agents.`));
