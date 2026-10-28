// Serve only the committed static publication, with no Vite transforms.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
const root = new URL('../', import.meta.url);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.woff': 'font/woff', '.woff2': 'font/woff2', '.txt': 'text/plain' };
createServer(async (request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname;
  if (!pathname.startsWith('/rabota-t2/')) {
    response.writeHead(404).end(); return;
  }
  const name = pathname.slice('/rabota-t2/'.length) || 'index.html';
  if (!['index.html', 'favicon.svg', 'inter-OFL.txt'].includes(name) && !/^assets\/[\w.-]+$/.test(name)) {
    response.writeHead(404).end(); return;
  }
  try {
    const body = await readFile(new URL(name, root));
    const extension = name.slice(name.lastIndexOf('.'));
    response.writeHead(200, { 'Content-Type': types[extension] || 'application/octet-stream' }).end(body);
  } catch {
    response.writeHead(404).end();
  }
}).listen(4180, '127.0.0.1', () => console.log('Static Pages check: http://127.0.0.1:4180/rabota-t2/'));
