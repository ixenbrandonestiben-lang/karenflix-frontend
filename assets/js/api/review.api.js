import { api } from './client.js';

export function getReviews(movieId) {
  return api.get(`/movies/${movieId}/reviews`);
}

export function createReview(movieId, { title, comment, rating }) {
  return api.post(`/movies/${movieId}/reviews`, { title, comment, rating });
}

export function updateReview(movieId, reviewId, { title, comment, rating }) {
  return api.put(`/movies/${movieId}/reviews/${reviewId}`, { title, comment, rating });
}

export function deleteReview(movieId, reviewId) {
  return api.delete(`/movies/${movieId}/reviews/${reviewId}`);
}

export function toggleReaction(reviewId, reactionType) {
  return api.post(`/reviews/${reviewId}/reactions`, { reaction_type: reactionType });
}
