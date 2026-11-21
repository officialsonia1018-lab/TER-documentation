// Thin client for the shared portal server (see server/index.js).
// The admin token is kept in sessionStorage so a reload keeps the session.

const TOKEN_KEY = 'ter-portal-api-token';

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export function getApiToken() {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setApiToken(token) {
  try {
    if (token) {
      window.sessionStorage.setItem(TOKEN_KEY, token);
    } else {
      window.sessionStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Session storage can be unavailable in private mode; the token then only lives in memory.
  }
}

async function request(pathname, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }
  const token = getApiToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(pathname, { ...options, headers });
  } catch {
    throw new ApiError('Cannot reach the portal server.', 0);
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new ApiError(data.error || `Request failed (${response.status}).`, response.status);
  }
  return data;
}

export async function fetchModules() {
  const data = await request('/api/modules');
  return data.modules;
}

export async function saveModules(modules) {
  const data = await request('/api/modules', {
    method: 'PUT',
    body: JSON.stringify({ modules }),
  });
  return data.modules;
}

export async function apiLogin(email, password) {
  const data = await request('/api/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  setApiToken(data.token);
  return data.user;
}

export async function apiLogout() {
  try {
    await request('/api/logout', { method: 'POST' });
  } catch {
    // Logging out locally is enough if the server cannot be reached.
  }
  setApiToken('');
}

// Admin database tools (phpMyAdmin-style page behind /database).
export async function fetchDatabaseOverview() {
  return request('/api/db/overview');
}

export async function fetchTableRows(table, { limit = 25, offset = 0 } = {}) {
  return request(
    `/api/db/tables/${encodeURIComponent(table)}?limit=${limit}&offset=${offset}`
  );
}

export async function saveTableRow(table, rowId, changes) {
  return request(
    `/api/db/tables/${encodeURIComponent(table)}/${encodeURIComponent(rowId)}`,
    { method: 'PATCH', body: JSON.stringify({ changes }) }
  );
}

export async function runSqlQuery(sql) {
  return request('/api/db/query', { method: 'POST', body: JSON.stringify({ sql }) });
}
