// Local stand-in for GitHub Pages: serves public/ as static files on ONE port, and forwards the
// Firebase traffic on that same port to the emulators, so the browser needs a single forwarded port.
//   /.ws, /.lp                         -> Realtime Database emulator (127.0.0.1:9000)
//   /identitytoolkit..., /securetoken...  -> Auth emulator (127.0.0.1:9099); its /emulator/* admin routes are not proxied
//   /theme/...                         -> public/theme, or THEME_DIR when set
// Listens on 127.0.0.1 only. Usage: node tool/serve.mjs  (env PORT, HOST default 127.0.0.1)
import http from 'node:http';
import net from 'node:net';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT) || 8790;
const DB = { host: '127.0.0.1', port: 9000 };
const AUTH = { host: '127.0.0.1', port: 9099 };
const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '../public');
const THEME_DIR = process.env.THEME_DIR ? path.resolve(process.env.THEME_DIR) : null; // default: public/theme

const MIME = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ttf': 'font/ttf', '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.gif': 'image/gif', '.avif': 'image/avif', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
  '.aac': 'audio/aac', '.webm': 'audio/webm', '.otf': 'font/otf',
};

function upstream(url) {
  if (url.startsWith('/.ws') || url.startsWith('/.lp')) return DB;
  if (/^\/(identitytoolkit\.googleapis\.com|securetoken\.googleapis\.com)\//.test(url)) return AUTH;
  return null;
}

function sendFile(res, file) {
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('Không tìm thấy');
    }
    res.writeHead(200, {
      'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store', // the browser must never show an old build
    });
    const stream = fs.createReadStream(file);
    stream.on('error', () => res.destroy());
    res.on('close', () => stream.destroy());
    stream.pipe(res);
  });
}

function fail(res, code) {
  if (!res.headersSent) res.writeHead(code);
  res.end();
}

const server = http.createServer((req, res) => {
  try { handle(req, res); } catch { fail(res, 400); } // one bad request must never stop the server for the class
});

function handle(req, res) {
  const up = upstream(req.url);
  if (up) {
    const p = http.request({ ...up, method: req.method, path: req.url, headers: req.headers }, (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    });
    p.on('error', () => fail(res, 502));
    return req.pipe(p);
  }
  let urlPath;
  try { urlPath = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { return fail(res, 400); }
  if (urlPath.includes('\0')) return fail(res, 400);
  if (THEME_DIR && urlPath.startsWith('/theme/')) {
    const f = path.resolve(THEME_DIR, '.' + urlPath.slice('/theme'.length));
    if (!f.startsWith(THEME_DIR + path.sep)) return fail(res, 403);
    return sendFile(res, f);
  }
  const file = path.resolve(ROOT, '.' + (urlPath.endsWith('/') ? urlPath + 'index.html' : urlPath));
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) return fail(res, 403);
  sendFile(res, file);
}

// WebSocket upgrade for the Realtime Database: pipe the raw connection to the emulator.
server.on('upgrade', (req, socket, head) => {
  const up = upstream(req.url);
  if (!up) return socket.destroy();
  const conn = net.connect(up.port, up.host, () => {
    let headers = `${req.method} ${req.url} HTTP/${req.httpVersion}\r\n`;
    for (let i = 0; i < req.rawHeaders.length; i += 2) headers += `${req.rawHeaders[i]}: ${req.rawHeaders[i + 1]}\r\n`;
    conn.write(headers + '\r\n');
    if (head && head.length) conn.write(head);
    conn.pipe(socket);
    socket.pipe(conn);
  });
  conn.on('error', () => socket.destroy());
  conn.on('close', () => socket.destroy());
  socket.on('error', () => conn.destroy());
  socket.on('close', () => conn.destroy());
});

server.on('clientError', (_e, socket) => socket.destroy());
server.listen(PORT, HOST, () => console.log(`serve: http://${HOST}:${PORT}/  (public/ + Firebase emulator proxy)`));
