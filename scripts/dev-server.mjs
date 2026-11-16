// Local preview with no installs: serves public/ and runs api/chat.js.
// Run with: npm run dev   then open http://localhost:3000
// Reads ANTHROPIC_API_KEY from .env.local if that file exists.

import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, dirname, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const envFile = join(root, '.env.local');
if (existsSync(envFile)) {
  for (const line of readFileSync(envFile, 'utf8').split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
  }
}

await import('./build-content.mjs');
const { default: chat } = await import('../api/chat.js');

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
};

const port = Number(process.env.PORT || 3000);
createServer(async (req, res) => {
  const path = new URL(req.url, 'http://localhost').pathname;

  if (path === '/api/chat') {
    let raw = '';
    for await (const chunk of req) raw += chunk;
    try {
      req.body = raw ? JSON.parse(raw) : {};
    } catch {
      req.body = {};
    }
    // Minimal stand-ins for the response helpers Vercel provides.
    res.status = (code) => ((res.statusCode = code), res);
    res.json = (data) => {
      res.setHeader('content-type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(data));
    };
    return chat(req, res);
  }

  const file = normalize(join(root, 'public', path === '/' ? 'index.html' : path));
  if (!file.startsWith(join(root, 'public')) || !existsSync(file)) {
    res.statusCode = 404;
    return res.end('Not found');
  }
  res.setHeader('content-type', types[extname(file)] || 'application/octet-stream');
  res.end(readFileSync(file));
}).listen(port, () => console.log(`Preview running at http://localhost:${port}`));
