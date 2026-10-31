import { api } from './client.js';

export function getUsers() {
  return api.get('/users');
}

export function updateUser(id, data) {
  return api.put(`/users/${id}`, data);
}

export function updateUserRole(id, data) {
  return api.patch(`/users/${id}/role`, data);
}

export function deleteUser(id) {
  return api.delete(`/users/${id}`);
}
