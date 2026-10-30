
import { api } from './client.js';

export function getActors() {
  return api.get('/actors');
}

export function getActorById(id) {
  return api.get(`/actors/${id}`);
}

export function getMovieCast(movieId) {
  return api.get(`/movie-actors/movie/${movieId}`);
}

export function assignActor(data) {
  return api.post('/movie-actors', {
    movie_id: data.movie_id,
    actor_id: data.actor_id,
    character_name: data.character_name,
  });
}

export function removeActor(id) {
  return api.delete(`/movie-actors/${id}`);
}
