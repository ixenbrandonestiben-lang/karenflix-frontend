// Ficha de detalle, reparto, favoritos y comentarios
import { getMovieById } from '../api/movie.api.js';
import { getMovieCast } from '../api/actor.api.js';
import {
  getReviews,
  createReview,
  updateReview,
  deleteReview,
  toggleReaction,
} from '../api/review.api.js';
import { getFavorites, addFavorite, removeFavorite } from '../api/favorite.api.js';
import { renderNavbar } from '../components/navbar.js';
import { createStarRatingDisplay, createInteractiveStarRating } from '../components/starRating.js';
import { getUser, isLoggedIn } from '../utils/authStorage.js';
import { showToast } from '../utils/notify.js';
import { getYouTubeEmbedUrl, normalizeYouTubeUrl } from '../utils/youtube.js';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function renderReviewCard(review, currentUser) {
  const initial = (review.user || 'U').charAt(0).toUpperCase();
  const isOwner = currentUser?.username === review.user;
  return `
    <article class="review-card" data-review-id="${review.id}">
      <header class="review-card__header">
        <div class="review-card__avatar" style="display:flex;align-items:center;justify-content:center;background:var(--color-bg-hover);color:var(--color-text-primary);font-weight:700;">
          ${escapeHTML(initial)}
        </div>
        <div class="review-card__user-info">
          <div class="review-card__username">${escapeHTML(review.user || 'Usuario')}</div>
          <time class="review-card__date">${escapeHTML(formatDate(review.createdAt || review.created_at))}</time>
        </div>
      </header>
      <div class="review-card__rating">${createStarRatingDisplay(review.rating)}</div>
      <h4 style="margin-bottom: var(--space-xs); font-weight: var(--font-weight-semibold);">${escapeHTML(review.title)}</h4>
      <p class="review-card__comment">${escapeHTML(review.comment)}</p>
      <footer class="review-card__footer">
        ${!isOwner ? `
          <button class="review-card__reaction-btn" data-review-id="${review.id}" data-reaction-type="like" aria-label="Me gusta">
            👍 <span class="review-card__reaction-count">${review.likesCount || review.likes_count || 0}</span>
          </button>
          <button class="review-card__reaction-btn" data-review-id="${review.id}" data-reaction-type="dislike" aria-label="No me gusta">
            👎 <span class="review-card__reaction-count">${review.dislikesCount || review.dislikes_count || 0}</span>
          </button>
        ` : ''}
        ${isOwner ? `
          <div class="review-card__owner-actions">
            <button type="button" class="review-card__owner-btn" data-review-action="edit">Editar</button>
            <button type="button" class="review-card__owner-btn" data-review-action="delete">Eliminar</button>
          </div>
        ` : ''}
      </footer>
    </article>`;
}

export async function initDetailPage() {
  renderNavbar('');

  const params = new URLSearchParams(window.location.search);
  const movieId = params.get('id');

  if (!movieId) {
    showToast('No se especifico el ID de la pelicula', 'error');
    return;
  }

  try {
    const movie = await getMovieById(movieId);
    if (!movie) {
      showToast('Pelicula no encontrada', 'error');
      return;
    }

    populateMovieHero(movie);
    setupFavoriteToggle(movie);
    await loadCast(movieId);
    await loadReviews(movieId);
  } catch (err) {
    console.error('Error al cargar detalle:', err);
    showToast(`Error: ${err.message}`, 'error');
  }
}

function populateMovieHero(movie) {
  const backdropEl = document.getElementById('detail-backdrop');
  if (backdropEl) {
    backdropEl.innerHTML = '';
    const img = document.createElement('img');
    img.src = movie.imageUrl || movie.image_url || '';
    img.alt = movie.title;
    img.onerror = () => { img.style.display = 'none'; };
    backdropEl.appendChild(img);
  }

  const posterEl = document.getElementById('detail-poster');
  if (posterEl) {
    posterEl.innerHTML = `
      <img src="${movie.imageUrl || movie.image_url || ''}" alt="${movie.title}"
           onerror="this.src='';this.style.background='var(--color-bg-hover)'">
    `;
  }

  const titleEl = document.getElementById('detail-title');
  if (titleEl) titleEl.textContent = movie.title;

  const metaEl = document.getElementById('detail-meta');
  if (metaEl) {
    const directorName = typeof movie.director === 'string'
      ? movie.director
      : movie.director?.name;
    const duration = movie.durationMinutes || movie.duration_minutes;
    metaEl.innerHTML = `
      <span class="badge badge--accent">${movie.category || 'General'}</span>
      <span>${movie.releaseYear || movie.release_year || ''}</span>
      ${duration ? `<span>${duration} min</span>` : ''}
      ${movie.ageRating || movie.age_rating ? `<span>${movie.ageRating || movie.age_rating}</span>` : ''}
      <span class="badge badge--${movie.status === 'approved' ? 'success' : 'warning'}">${movie.status || 'approved'}</span>
    `;
    if (directorName) {
      const director = document.createElement('span');
      director.className = 'detail-hero__director';
      director.textContent = `Dirigida por ${directorName}`;
      metaEl.append(director);
    }
  }

  const ratingEl = document.getElementById('detail-rating');
  if (ratingEl) {
    ratingEl.innerHTML = `
      <span class="detail-hero__rating-value">★ ${movie.averageRating || movie.average_rating || 'N/A'}</span>
      <span class="detail-hero__rating-label">/ 10</span>
    `;
  }

  const synopsisEl = document.getElementById('detail-synopsis');
  if (synopsisEl) synopsisEl.textContent = movie.description || '';

  const actionsEl = document.getElementById('detail-actions');
  if (actionsEl) {
    const trailerUrl = normalizeYouTubeUrl(movie.trailerUrl || movie.trailer_url);
    const embedUrl = getYouTubeEmbedUrl(trailerUrl);
    const trailerDialog = document.getElementById('trailer-dialog');
    const trailerFrame = document.getElementById('trailer-frame');
    const watchButton = document.createElement('button');
    watchButton.className = 'btn btn--primary btn--lg';
    watchButton.id = 'detail-watch-btn';
    watchButton.type = 'button';
    watchButton.setAttribute(
      'aria-label',
      embedUrl ? `Ver tráiler de ${movie.title}` : 'Tráiler no disponible'
    );

    watchButton.disabled = !embedUrl || !trailerDialog || !trailerFrame;

    const playIcon = document.createElement('span');
    playIcon.textContent = '▶';
    watchButton.append(playIcon, document.createTextNode(
      embedUrl ? ' Ver ahora' : ' Tráiler no disponible'
    ));

    if (embedUrl && trailerDialog && trailerFrame) {
      const closeButton = document.getElementById('trailer-close');
      watchButton.addEventListener('click', () => {
        trailerFrame.src = embedUrl;
        trailerFrame.title = `Tráiler de ${movie.title}`;
        trailerDialog.showModal();
      });
      closeButton?.addEventListener('click', () => trailerDialog.close());
      trailerDialog.addEventListener('click', event => {
        if (event.target === trailerDialog) trailerDialog.close();
      });
      trailerDialog.addEventListener('close', () => {
        trailerFrame.src = 'about:blank';
      });
    }

    const favoriteButton = document.createElement('button');
    favoriteButton.className = 'btn btn--secondary btn--lg';
    favoriteButton.id = 'detail-fav-btn';
    favoriteButton.type = 'button';
    favoriteButton.innerHTML = '<span>+</span> Mi Lista';

    actionsEl.replaceChildren(watchButton, favoriteButton);
  }
}

async function setupFavoriteToggle(movie) {
  const favBtn = document.getElementById('detail-fav-btn');
  if (!favBtn) return;

  let favoriteId = null;

  if (isLoggedIn()) {
    try {
      const favorites = await getFavorites();
      const existing = Array.isArray(favorites)
        ? favorites.find(f => f.movie_id == movie.id || (f.movie && f.movie.id == movie.id))
        : null;

      if (existing) {
        favoriteId = existing.id;
        favBtn.innerHTML = '<span>✓</span> En Mi Lista';
        favBtn.classList.replace('btn--secondary', 'btn--ghost');
      }
    } catch (err) {
      console.warn('Error al verificar favoritos:', err);
    }
  }

  favBtn.onclick = async () => {
    if (!isLoggedIn()) {
      showToast('Inicia sesion para guardar en tu lista', 'warning');
      return;
    }

    try {
      if (favoriteId) {
        await removeFavorite(favoriteId);
        favoriteId = null;
        favBtn.innerHTML = '<span>+</span> Mi Lista';
        favBtn.classList.replace('btn--ghost', 'btn--secondary');
        showToast('Eliminada de Mi Lista', 'info');
      } else {
        const res = await addFavorite(movie.id);
        favoriteId = res?.id || true;
        favBtn.innerHTML = '<span>✓</span> En Mi Lista';
        favBtn.classList.replace('btn--secondary', 'btn--ghost');
        showToast('Guardada en Mi Lista', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error al actualizar lista', 'error');
    }
  };
}

async function loadCast(movieId) {
  const castGrid = document.getElementById('cast-grid');
  if (!castGrid) return;

  try {
    const cast = await getMovieCast(movieId);
    if (Array.isArray(cast) && cast.length > 0) {
      castGrid.innerHTML = cast.map(item => `
        <div class="cast-card">
          <img class="cast-card__photo" src="${item.actor?.photoUrl || item.actor?.photo_url || ''}" alt="${item.actor?.name || 'Actor'}"
               onerror="this.src='';this.style.background='var(--color-bg-hover)';">
          <div class="cast-card__name">${item.actor?.name || 'Actor'}</div>
          <div class="cast-card__character">${item.character_name || ''}</div>
        </div>
      `).join('');
    } else {
      castGrid.innerHTML = '<p class="text-muted">No hay informacion del reparto disponible.</p>';
    }
  } catch (err) {
    castGrid.innerHTML = '<p class="text-muted">No se pudo cargar el reparto.</p>';
  }
}

async function loadReviews(movieId) {
  const reviewsList = document.getElementById('reviews-list');
  const reviewForm = document.getElementById('review-form');
  const reviewTitleInput = document.getElementById('review-title-input');
  const reviewCommentInput = document.getElementById('review-comment');
  const reviewSubmitButton = reviewForm?.querySelector('[type="submit"]');
  const cancelEditButton = document.getElementById('review-cancel-edit');
  const currentUser = getUser();

  let selectedRating = 0;
  let editingReviewId = null;
  const reviewStarsEl = document.getElementById('review-stars');
  const reviewRatingValue = document.getElementById('review-rating-value');

  const setRating = (rating) => {
    selectedRating = rating;
    if (reviewRatingValue) reviewRatingValue.value = rating;
    reviewStarsEl?.querySelectorAll('.star-rating__star').forEach(star => {
      const active = Number(star.dataset.value) <= rating;
      star.classList.toggle('star-rating__star--filled', active);
      star.classList.toggle('star-rating__star--active', active);
    });
  };

  const resetReviewForm = () => {
    reviewForm?.reset();
    editingReviewId = null;
    setRating(0);
    if (reviewSubmitButton) reviewSubmitButton.textContent = 'Publicar reseña';
    if (cancelEditButton) cancelEditButton.hidden = true;
  };

  if (reviewStarsEl) {
    createInteractiveStarRating(reviewStarsEl, 10, (rating) => {
      setRating(rating);
    });
  }

  try {
    const reviews = await getReviews(movieId);
    if (reviewsList) {
      if (Array.isArray(reviews) && reviews.length > 0) {
        reviewsList.innerHTML = reviews.map(review => renderReviewCard(review, currentUser)).join('');
        attachReviewHandlers(reviewsList, movieId, reviews, review => {
          editingReviewId = review.id;
          reviewTitleInput.value = review.title;
          reviewCommentInput.value = review.comment;
          setRating(Number(review.rating));
          if (reviewSubmitButton) reviewSubmitButton.textContent = 'Actualizar reseña';
          if (cancelEditButton) cancelEditButton.hidden = false;
          reviewForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, async (reviewId) => {
          if (!window.confirm('¿Eliminar esta reseña?')) return;
          try {
            await deleteReview(movieId, reviewId);
            if (String(editingReviewId) === String(reviewId)) resetReviewForm();
            showToast('Reseña eliminada correctamente', 'success');
            await loadReviews(movieId);
          } catch (err) {
            showToast(err.message || 'Error al eliminar la reseña', 'error');
          }
        });
      } else {
        reviewsList.innerHTML = '<p class="text-muted">Aun no hay resenas. Se el primero en opinar.</p>';
      }
    }
  } catch (err) {
    if (reviewsList) reviewsList.innerHTML = '<p class="text-muted">No se pudieron cargar las resenas.</p>';
  }

  if (cancelEditButton) {
    cancelEditButton.onclick = resetReviewForm;
  }

  if (reviewForm) {
    reviewForm.onsubmit = async (e) => {
      e.preventDefault();

      if (!isLoggedIn()) {
        showToast('Inicia sesion para publicar una resena', 'warning');
        return;
      }

      const title = reviewTitleInput?.value.trim() || '';
      const comment = reviewCommentInput?.value.trim() || '';

      if (title.length < 3 || comment.length < 10 || selectedRating < 1) {
        showToast('Completa titulo, comentario y selecciona estrellas (1-10)', 'error');
        return;
      }

      try {
        const reviewData = {
          title,
          comment,
          rating: selectedRating,
        };
        const isEditing = editingReviewId !== null;
        if (isEditing) {
          await updateReview(movieId, editingReviewId, reviewData);
        } else {
          await createReview(movieId, reviewData);
        }

        showToast(isEditing ? 'Reseña actualizada correctamente' : 'Reseña publicada correctamente', 'success');
        resetReviewForm();
        await loadReviews(movieId);
      } catch (err) {
        showToast(err.message || 'Error al enviar resena', 'error');
      }
    };
  }
}

function attachReviewHandlers(container, movieId, reviews, onEdit, onDelete) {
  container.querySelectorAll('.review-card__reaction-btn').forEach(btn => {
    btn.onclick = async () => {
      const reviewId = btn.getAttribute('data-review-id');
      const reactionType = btn.dataset.reactionType;
      if (!isLoggedIn()) {
        showToast('Inicia sesion para reaccionar', 'warning');
        return;
      }
      btn.disabled = true;
      try {
        const result = await toggleReaction(reviewId, reactionType);
        const card = btn.closest('.review-card');
        card.querySelectorAll('.review-card__reaction-btn').forEach(reactionBtn => {
          const type = reactionBtn.dataset.reactionType;
          const count = reactionBtn.querySelector('.review-card__reaction-count');
          if (count) count.textContent = result.counts[type === 'like' ? 'likes' : 'dislikes'];
          const isActive = result.reaction === type;
          reactionBtn.classList.toggle('review-card__reaction-btn--active', isActive);
          reactionBtn.classList.toggle('review-card__like-btn--active', isActive);
        });
      } catch (err) {
        showToast(err.message || 'Error al reaccionar', 'error');
      } finally {
        btn.disabled = false;
      }
    };
  });

  container.querySelectorAll('[data-review-action="edit"]').forEach(btn => {
    btn.onclick = () => {
      const reviewId = btn.closest('.review-card')?.dataset.reviewId;
      const review = reviews.find(item => String(item.id) === String(reviewId));
      if (review) onEdit(review);
    };
  });

  container.querySelectorAll('[data-review-action="delete"]').forEach(btn => {
    btn.onclick = () => {
      const reviewId = btn.closest('.review-card')?.dataset.reviewId;
      if (reviewId) onDelete(reviewId);
    };
  });
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
