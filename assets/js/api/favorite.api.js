import { api } from './client.js';

export function getFavorites() {
  return api.get('/favorites');
}

export function addFavorite(movieId) {
  return api.post('/favorites', { movie_id: movieId });
}

export function removeFavorite(id) {
  return api.delete(`/favorites/${id}`);
}
