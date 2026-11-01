// HTTP client wrapper with JWT injection
const BASE_URL = 'http://localhost:4000/api/v1';

import { getToken } from '../utils/authStorage.js';

async function request(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers.Authorization = 'Bearer ' + token;
  }

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const responseBody = await res.json().catch(() => null);
    const payload = responseBody && typeof responseBody === 'object' ? responseBody : {};
    const details = payload.errors ?? payload.errores;
    const detailMessages = Array.isArray(details)
      ? [...new Set(details.map(detail => detail?.msg).filter(Boolean))]
      : [];
    const message = payload.message || payload.mensaje || `HTTP ${res.status}`;
    const error = new Error(
      detailMessages.length > 0
        ? `${message} ${detailMessages.join(' ')}`
        : message
    );
    error.statusCode = res.status;
    error.details = details || null;
    throw error;
  }

  // Handle 204 No Content
  if (res.status === 204) return null;
  const payload = await res.json();
  return payload && typeof payload === 'object' && 'data' in payload
    ? payload.data
    : payload;
}

export const api = {
  get: (endpoint) => request(endpoint),
  post: (endpoint, body) => request(endpoint, { method: 'POST', body: JSON.stringify(body) }),
  put: (endpoint, body) => request(endpoint, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (endpoint, body) => request(endpoint, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  delete: (endpoint) => request(endpoint, { method: 'DELETE' }),
};
