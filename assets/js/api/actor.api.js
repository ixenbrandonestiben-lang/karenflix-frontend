
import { api } from './client.js';

export function getActors() {
  return api.get('/actors');
}

export function getActorById(id) {
  return api.get(`/actors/${id}`);
}

export function createActor(data) {
  return api.post('/actors', data);
}

export function updateActor(id, data) {
  return api.put(`/actors/${id}`, data);
}

export function deleteActor(id) {
  return api.delete(`/actors/${id}`);
}

export function getMovieCast(movieId) {
  return api.get(`/movie-actors/movie/${movieId}`);
}

export function getActorMovies(actorId) {
  return api.get(`/movie-actors/actor/${actorId}`);
}

export function getMovieActorById(id) {
  return api.get(`/movie-actors/${id}`);
}

export function getMovieActors(filters = {}) {
  const query = new URLSearchParams();
  if (filters.movie_id) query.set('movie_id', filters.movie_id);
  if (filters.actor_id) query.set('actor_id', filters.actor_id);
  const qs = query.toString();
  return api.get(`/movie-actors${qs ? '?' + qs : ''}`);
}

export function assignActor(data) {
  return api.post('/movie-actors', {
    movie_id: data.movie_id,
    actor_id: data.actor_id,
    character_name: data.character_name,
  });
}

export function updateActorAssignment(id, data) {
  return api.put(`/movie-actors/${id}`, data);
}

export function removeActor(id) {
  return api.delete(`/movie-actors/${id}`);
}
