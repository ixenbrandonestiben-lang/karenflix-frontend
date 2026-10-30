import { api } from './client.js';

export function getMovies(params = {}) {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.title) query.set('title', params.title);
  const qs = query.toString();
  return api.get(`/movies${qs ? '?' + qs : ''}`);
}

export function getMovieById(id) {
  return api.get(`/movies/${id}`);
}

export function createMovie(data) {
  return api.post('/movies', data);
}

export function updateMovie(id, data) {
  return api.put(`/movies/${id}`, data);
}

export function approveMovie(id) {
  return api.patch(`/movies/${id}/approve`);
}

export function deleteMovie(id) {
  return api.delete(`/movies/${id}`);
}

export function getCategories() {
  return api.get('/categories');
}

export function getCategoryById(id) {
  return api.get(`/categories/${id}`);
}

export function createCategory(data) {
  return api.post('/categories', data);
}
