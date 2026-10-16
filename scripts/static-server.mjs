import http from 'node:http';
import path from 'node:path';
import { createReadStream } from 'node:fs';
import { realpath, stat } from 'node:fs/promises';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.ttf': 'font/ttf',
};

export function createStaticServer({ root }) {
  const projectRoot = path.resolve(root);
  return http.createServer(async (request, response) => {
    response.setHeader('X-Content-Type-Options', 'nosniff');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('Referrer-Policy', 'no-referrer');
    response.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; object-src 'none'; base-uri 'none'; connect-src 'self'; frame-src 'self' blob:; worker-src 'self' blob:");
    const fail = (code, message) => {
      response.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(request.method === 'HEAD' ? undefined : message);
    };
    if (!['GET', 'HEAD'].includes(request.method)) {
      response.setHeader('Allow', 'GET, HEAD');
      return fail(405, 'Method not allowed');
    }
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname); }
    catch { return fail(400, 'Invalid URL'); }
    const parts = pathname.split(/[\\/]+/).filter(Boolean);
    if (parts.some(part => part.startsWith('.') || part === 'node_modules') || pathname.includes('\0')) {
      return fail(403, 'Forbidden');
    }
    const selected = path.resolve(projectRoot, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (selected !== projectRoot && !selected.startsWith(projectRoot + path.sep)) return fail(403, 'Forbidden');
    try {
      const resolved = await realpath(selected);
      if (resolved !== projectRoot && !resolved.startsWith(projectRoot + path.sep)) return fail(403, 'Forbidden');
      const info = await stat(resolved);
      if (!info.isFile()) return fail(404, 'Not found');
      response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(resolved)] ?? 'application/octet-stream', 'Content-Length': info.size });
      if (request.method === 'HEAD') return response.end();
      createReadStream(resolved).on('error', () => response.destroy()).pipe(response);
    } catch (error) {
      return fail(error.code === 'ENOENT' ? 404 : 500, error.code === 'ENOENT' ? 'Not found' : 'Server error');
    }
  });
}
