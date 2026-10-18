import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { resolve, extname, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { onRequestPost, onRequestOptions } from '../functions/api/chat.js';

const root = fileURLToPath(new URL('../', import.meta.url));
const env = { ...process.env };
for (const name of ['.env.local', '.dev.vars']) {
  try {
    const source = await readFile(resolve(root, name), 'utf8');
    for (const line of source.split(/\r?\n/)) {
      const entry = line.match(/^\s*(?:export\s+)?([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!entry) continue;
      let value = entry[2];
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      )
        value = value.slice(1, -1);
      if (!env[entry[1]]) env[entry[1]] = value;
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
}
async function loadSecurityHeaders() {
  try {
    const source = await readFile(resolve(root, '_headers'), 'utf8');
    const block = source.split(/\r?\n\r?\n/).find((part) => part.startsWith('/*'));
    const lines = (block || '').split(/\r?\n/).slice(1);
    const entries = lines.map((line) => line.trim().split(/:\s(.+)/));
    return Object.fromEntries(entries.filter(([name, value]) => name && value));
  } catch {
    return {};
  }
}

const securityHeaders = await loadSecurityHeaders();

const port = Number(env.PORT || 4173);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.geojson': 'application/geo+json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.woff2': 'font/woff2',
};
const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://127.0.0.1:${port}`);
    if (url.pathname === '/api/chat') {
      if (req.method !== 'POST' && req.method !== 'OPTIONS') {
        res.writeHead(405, { 'Content-Type': 'application/json', Allow: 'POST, OPTIONS' });
        res.end(JSON.stringify({ message: 'Usa POST para conversar con JAI.' }));
        return;
      }
      let size = 0;
      const chunks = [];
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 65536) {
          res.writeHead(413, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ message: 'El mensaje es demasiado largo.' }));
          return;
        }
        chunks.push(chunk);
      }
      const request = new Request(url, {
        method: req.method,
        headers: { 'Content-Type': 'application/json' },
        ...(req.method === 'POST' ? { body: Buffer.concat(chunks) } : {}),
      });
      const response =
        req.method === 'OPTIONS' ? await onRequestOptions() : await onRequestPost({ request, env });
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(await response.text());
      return;
    }
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405);
      res.end();
      return;
    }
    const path = resolve(
      root,
      '.' + decodeURIComponent(url.pathname === '/' ? '/index.html' : url.pathname)
    );
    const rel = relative(root, path);
    const segments = rel.split(sep);
    if (
      rel.startsWith('..') ||
      segments.some(
        (p) => p.startsWith('.') || ['node_modules', 'functions', 'scripts'].includes(p)
      )
    ) {
      res.writeHead(403);
      res.end('No disponible');
      return;
    }
    if (!(await stat(path)).isFile()) {
      res.writeHead(404);
      res.end('No encontrado');
      return;
    }
    const data = await readFile(path);
    res.writeHead(200, {
      ...securityHeaders,
      'Content-Type': mime[extname(path)] || 'application/octet-stream',
      'Cache-Control': 'no-store',
    });
    res.end(req.method === 'HEAD' ? undefined : data);
  } catch (error) {
    res.writeHead(error.code === 'ENOENT' ? 404 : 500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'No se pudo completar la solicitud local.' }));
  }
});
server.on('error', (error) => {
  console.error(
    error.code === 'EADDRINUSE'
      ? `El puerto ${port} está ocupado. Cierra el servidor anterior o usa otro PORT.`
      : 'No se pudo iniciar el servidor local.'
  );
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () =>
  console.log(
    `Portafolio: http://127.0.0.1:${port}\nChat: ${env.GEMINI_API_KEY ? 'Gemini configurado' : 'modo portafolio; agrega GEMINI_API_KEY en .dev.vars para activar IA'}`
  )
);
