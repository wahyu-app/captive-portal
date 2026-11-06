import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, sep } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const cli = resolve(root, 'node_modules/@tailwindcss/cli/dist/index.mjs');
const cssArgs = [cli, '-i', './styles/input.css', '-o', './assets/styles.css'];
const build = spawnSync(process.execPath, cssArgs, { cwd: root, stdio: 'inherit' });
if (build.status !== 0) process.exit(build.status || 1);

const port = Number(process.env.PORT || 5173);
const contentTypes = {
  html: 'text/html; charset=utf-8',
  js: 'text/javascript; charset=utf-8',
  css: 'text/css; charset=utf-8',
  svg: 'image/svg+xml',
  png: 'image/png',
  jpg: 'image/jpeg',
  ttf: 'font/ttf',
  txt: 'text/plain; charset=utf-8',
};

const server = createServer(async (request, response) => {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' });
    response.end();
    return;
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('Bad request');
    return;
  }
  if (pathname === '/') pathname = '/index.html';
  const file = resolve(root, `.${pathname}`);
  const allowed = pathname === '/index.html' || pathname === '/main.js' || pathname.startsWith('/assets/');
  if (!allowed || !file.startsWith(root + (root.endsWith(sep) ? '' : sep))) {
    response.writeHead(404).end('Not found');
    return;
  }
  try {
    const body = await readFile(file);
    const extension = file.split('.').pop();
    response.writeHead(200, {
      'Content-Type': contentTypes[extension] || 'application/octet-stream',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    });
    response.end(request.method === 'HEAD' ? undefined : body);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

let watcher;
server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? `Port ${port} is already in use. Set PORT to use another port.` : error.message);
  watcher?.kill();
  process.exitCode = 1;
});
server.listen(port, '127.0.0.1', () => {
  console.log(`PERKOM Wi-Fi: http://localhost:${port}`);
  watcher = spawn(process.execPath, [...cssArgs, '--watch=always'], { cwd: root, stdio: 'inherit' });
});

function stop() {
  watcher?.kill();
  server.close(() => process.exit());
}
process.on('SIGINT', stop);
process.on('SIGTERM', stop);
