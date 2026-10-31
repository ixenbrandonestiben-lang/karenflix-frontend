import { api } from './client.js';

export function getMovies(params = {}) {
  return getMovieList('/movies', params);
}

export function getPendingMovies(params = {}) {
  return getMovieList('/movies/pending', params);
}

function getMovieList(endpoint, params) {
  const query = new URLSearchParams();
  if (params.category) query.set('category', params.category);
  if (params.title) query.set('title', params.title);
  if (params.page) query.set('page', params.page);
  if (params.limit) query.set('limit', params.limit);
  const qs = query.toString();
  return api.get(`${endpoint}${qs ? '?' + qs : ''}`);
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

export function updateCategory(id, data) {
  return api.put(`/categories/${id}`, data);
}

export function deleteCategory(id) {
  return api.delete(`/categories/${id}`);
}
