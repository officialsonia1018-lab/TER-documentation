import crypto from 'node:crypto';
import {
  createAdminSession,
  deleteAdminSession,
  getDatabaseOverview,
  getImage,
  getTableRows,
  isAdminSessionValid,
  listModules,
  replaceModules,
  runReadOnlyQuery,
  updateTableRow,
} from './store.js';

const adminEmail = (process.env.ADMIN_EMAIL || 'admin@ternityforworder').trim().toLowerCase();
const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

const MAX_BODY_BYTES = 8 * 1024 * 1024;
const IMAGE_ID = /^[a-f0-9-]{10,64}$/i;

export function sendJson(response, statusCode, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(body);
}

function readJsonBody(request) {
  // Serverless platforms (Vercel) may hand over an already parsed body.
  if (request.body !== undefined) {
    if (request.body === null) {
      return Promise.resolve({});
    }
    if (typeof request.body === 'object' && !Buffer.isBuffer(request.body)) {
      return Promise.resolve(request.body);
    }
    const text = Buffer.isBuffer(request.body)
      ? request.body.toString('utf8')
      : String(request.body);
    if (!text) {
      return Promise.resolve({});
    }
    try {
      return Promise.resolve(JSON.parse(text));
    } catch {
      const error = new Error('Request body must be valid JSON.');
      error.statusCode = 400;
      return Promise.reject(error);
    }
  }

  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > MAX_BODY_BYTES) {
        const error = new Error('Request body is too large.');
        error.statusCode = 413;
        reject(error);
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => {
      if (chunks.length === 0) {
        resolve({});
        return;
      }
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        const error = new Error('Request body must be valid JSON.');
        error.statusCode = 400;
        reject(error);
      }
    });
    request.on('error', reject);
  });
}

function safeEquals(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  if (left.length !== right.length) {
    return false;
  }
  return crypto.timingSafeEqual(left, right);
}

function readBearerToken(request) {
  const header = request.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
}

async function requireAdmin(request, response) {
  if (!(await isAdminSessionValid(readBearerToken(request)))) {
    sendJson(response, 401, { error: 'Admin login is required to open the database tools.' });
    return false;
  }
  return true;
}

async function sendImage(response, url) {
  const id = decodeURIComponent(url.pathname.slice('/api/images/'.length));
  const image = IMAGE_ID.test(id) ? await getImage(id) : null;
  if (!image) {
    sendJson(response, 404, { error: 'Image not found.' });
    return;
  }
  response.writeHead(200, {
    'Content-Type': image.mime,
    'Content-Length': image.bytes,
    'Cache-Control': 'public, max-age=31536000, immutable',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(image.data);
}

export async function handleApi(request, response, url) {
  if (url.pathname.startsWith('/api/images/')) {
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      sendJson(response, 405, { error: 'Method not allowed.' });
      return;
    }
    await sendImage(response, url);
    return;
  }

  if (url.pathname === '/api/login' && request.method === 'POST') {
    const body = await readJsonBody(request);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!safeEquals(email, adminEmail) || !safeEquals(password, adminPassword)) {
      sendJson(response, 401, { error: 'Invalid email or password.' });
      return;
    }
    const token = await createAdminSession();
    sendJson(response, 200, {
      token,
      user: { email: adminEmail, name: 'Administrator', role: 'admin' },
    });
    return;
  }

  if (url.pathname === '/api/logout' && request.method === 'POST') {
    await deleteAdminSession(readBearerToken(request));
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/modules' && request.method === 'GET') {
    sendJson(response, 200, { modules: await listModules() });
    return;
  }

  if (url.pathname === '/api/modules' && request.method === 'PUT') {
    if (!(await isAdminSessionValid(readBearerToken(request)))) {
      sendJson(response, 401, { error: 'Admin login is required to change documentation.' });
      return;
    }
    const body = await readJsonBody(request);
    const modules = await replaceModules(body.modules);
    sendJson(response, 200, { modules });
    return;
  }

  if (url.pathname === '/api/db/overview' && request.method === 'GET') {
    if (!(await requireAdmin(request, response))) {
      return;
    }
    sendJson(response, 200, await getDatabaseOverview());
    return;
  }

  if (url.pathname.startsWith('/api/db/tables/')) {
    if (!(await requireAdmin(request, response))) {
      return;
    }
    const parts = url.pathname
      .slice('/api/db/tables/'.length)
      .split('/')
      .filter(Boolean)
      .map((part) => decodeURIComponent(part));

    if (parts.length === 1 && request.method === 'GET') {
      const limit = url.searchParams.get('limit') || '25';
      const offset = url.searchParams.get('offset') || '0';
      sendJson(response, 200, await getTableRows(parts[0], Number(limit), Number(offset)));
      return;
    }

    if (parts.length === 2 && request.method === 'PATCH') {
      const body = await readJsonBody(request);
      sendJson(response, 200, await updateTableRow(parts[0], parts[1], body.changes));
      return;
    }

    sendJson(response, 404, { error: 'Database route not found.' });
    return;
  }

  if (url.pathname === '/api/db/query' && request.method === 'POST') {
    if (!(await requireAdmin(request, response))) {
      return;
    }
    const body = await readJsonBody(request);
    sendJson(response, 200, await runReadOnlyQuery(body.sql));
    return;
  }

  if (url.pathname === '/api/health' && request.method === 'GET') {
    sendJson(response, 200, { ok: true });
    return;
  }

  sendJson(response, 404, { error: 'API route not found.' });
}

export function handleApiError(request, response, error) {
  if (response.headersSent) {
    return;
  }
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    console.error(error);
  }
  sendJson(response, statusCode, { error: error.message || 'Unexpected server error.' });
}
