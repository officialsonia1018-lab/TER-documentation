import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { handleApi, handleApiError, sendJson } from './api.js';
import { dbInfo, ensureStore, uploadsDir } from './store.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distDir = path.join(rootDir, 'dist');
const port = Number(process.env.PORT || 3001);

const UPLOAD_NAME = /^[a-f0-9-]+\.(jpg|png|webp)$/i;

// Comma-separated list of allowed frontend origins, e.g. the Vercel URL.
// Default "*" because the API uses Bearer tokens (no cookies).
const corsOrigins = (process.env.CORS_ORIGIN || '*')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

function applyCors(request, response) {
  const origin = request.headers.origin;
  if (corsOrigins.includes('*')) {
    response.setHeader('Access-Control-Allow-Origin', '*');
  } else if (origin && corsOrigins.includes(origin)) {
    response.setHeader('Access-Control-Allow-Origin', origin);
    response.setHeader('Vary', 'Origin');
  }
  response.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, PUT, PATCH, DELETE, OPTIONS');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.setHeader('Access-Control-Max-Age', '86400');
}

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.woff2': 'font/woff2',
};

function sendFile(response, filePath, cacheControl = 'no-cache') {
  const extension = path.extname(filePath).toLowerCase();
  const stats = fs.statSync(filePath);
  if (!stats.isFile()) {
    return false;
  }
  response.writeHead(200, {
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
    'Content-Length': stats.size,
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
  });
  fs.createReadStream(filePath).pipe(response);
  return true;
}

function handleRequest(request, response) {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);

  applyCors(request, response);
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  Promise.resolve()
    .then(async () => {
      if (url.pathname.startsWith('/api/')) {
        await handleApi(request, response, url);
        return;
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        sendJson(response, 405, { error: 'Method not allowed.' });
        return;
      }

      if (url.pathname.startsWith('/uploads/')) {
        const fileName = path.basename(decodeURIComponent(url.pathname));
        if (!UPLOAD_NAME.test(fileName)) {
          sendJson(response, 404, { error: 'Image not found.' });
          return;
        }
        const filePath = path.join(uploadsDir, fileName);
        if (!fs.existsSync(filePath)) {
          sendJson(response, 404, { error: 'Image not found.' });
          return;
        }
        sendFile(response, filePath, 'public, max-age=31536000, immutable');
        return;
      }

      const requested = decodeURIComponent(url.pathname);
      const filePath = path.join(distDir, requested);
      if (filePath.startsWith(distDir + path.sep) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        sendFile(response, filePath);
        return;
      }

      const indexPath = path.join(distDir, 'index.html');
      if (fs.existsSync(indexPath)) {
        sendFile(response, indexPath);
        return;
      }

      response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
      response.end(
        'TER Documentation Portal server is running.\n' +
          'Run "npm run build" to serve the built site, or use "npm run dev" for the Vite dev server.\n'
      );
    })
    .catch((error) => handleApiError(request, response, error));
}

try {
  await ensureStore();
} catch {
  // The failure was already reported with setup hints by the store.
  process.exit(1);
}

const server = http.createServer(handleRequest);
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `Port ${port} is already in use - another copy of the portal server is probably running.\n` +
        'Stop the other server (or close the terminal running it), or start this one on another port:\n' +
        `  PORT=3002 npm start`
    );
    process.exit(1);
  }
  throw error;
});
server.listen(port, () => {
  console.log(`TER portal server listening on http://localhost:${port}`);
  console.log(`Admin account: ${(process.env.ADMIN_EMAIL || 'admin@ternityforworder').trim().toLowerCase()} (set ADMIN_EMAIL / ADMIN_PASSWORD to change)`);
  console.log(
    `Database: ${dbInfo.database} on ${dbInfo.host}:${dbInfo.port} (MariaDB/MySQL user ${dbInfo.user})`
  );
  console.log(`Open it in phpMyAdmin: http://localhost/phpmyadmin/ -> database ${dbInfo.database}`);
  console.log('Section images are stored in the module_images table.');
});
