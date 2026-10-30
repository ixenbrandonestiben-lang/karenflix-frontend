import { api } from './client.js';

export function login({ email, username, password }) {
  const identifier = username ? { username } : { email };
  return api.post('/auth/login', { ...identifier, password });
}

export function register({ username, email, password }) {
  return api.post('/auth/register', { username, email, password });
}

export function getProfile() {
  return api.get('/auth/profile');
}

export function logout() {
  return api.post('/auth/logout');
}
