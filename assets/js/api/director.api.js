import { api } from './client.js';

export function getDirectors() {
  return api.get('/directors');
}

export function getDirectorById(id, { includeMovies = false } = {}) {
  const query = includeMovies ? '?includeMovies=true' : '';
  return api.get(`/directors/${id}${query}`);
}

export function createDirector(data) {
  return api.post('/directors', data);
}

export function updateDirector(id, data) {
  return api.put(`/directors/${id}`, data);
}

export function deleteDirector(id) {
  return api.delete(`/directors/${id}`);
}