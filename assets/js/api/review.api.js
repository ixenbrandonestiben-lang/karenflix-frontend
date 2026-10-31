import { api } from './client.js';

export function getReviews(movieId) {
  return api.get(`/movies/${movieId}/reviews`);
}

export function createReview(movieId, { title, comment, rating }) {
  return api.post(`/movies/${movieId}/reviews`, { title, comment, rating });
}

export function toggleReaction(reviewId) {
  return api.post(`/reviews/${reviewId}/reactions`, { reaction_type: 'like' });
}
