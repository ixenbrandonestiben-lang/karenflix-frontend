// Ficha de detalle, reparto, favoritos y comentarios
import { getMovieById } from '../api/movie.api.js';
import { getMovieCast } from '../api/actor.api.js';
import { getReviews, createReview, toggleReaction } from '../api/review.api.js';
import { getFavorites, addFavorite, removeFavorite } from '../api/favorite.api.js';
import { renderNavbar } from '../components/navbar.js';
import { createStarRatingDisplay, createInteractiveStarRating } from '../components/starRating.js';
import { isLoggedIn } from '../utils/authStorage.js';
import { showToast } from '../utils/notify.js';

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  const months = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

function renderReviewCard(review) {
  const initial = (review.user || 'U').charAt(0).toUpperCase();
  return `
    <article class="review-card" data-review-id="${review.id}">
      <header class="review-card__header">
        <div class="review-card__avatar" style="display:flex;align-items:center;justify-content:center;background:var(--color-bg-hover);color:var(--color-text-primary);font-weight:700;">
          ${initial}
        </div>
        <div class="review-card__user-info">
          <div class="review-card__username">${review.user}</div>
          <time class="review-card__date">${formatDate(review.createdAt || review.created_at)}</time>
        </div>
      </header>
      <div class="review-card__rating">${createStarRatingDisplay(review.rating)}</div>
      <h4 style="margin-bottom: var(--space-xs); font-weight: var(--font-weight-semibold);">${review.title}</h4>
      <p class="review-card__comment">${review.comment}</p>
      <footer class="review-card__footer">
        <button class="review-card__like-btn" data-review-id="${review.id}">
          👍 <span class="review-card__like-count">${review.likesCount || review.likes_count || 0}</span>
        </button>
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
    actionsEl.innerHTML = `
      <button class="btn btn--primary btn--lg" id="detail-watch-btn">
        <span>▶</span> Ver Ahora
      </button>
      <button class="btn btn--secondary btn--lg" id="detail-fav-btn">
        <span>+</span> Mi Lista
      </button>
    `;

    const watchBtn = document.getElementById('detail-watch-btn');
    if (watchBtn) {
      watchBtn.onclick = () => showToast(`Reproduciendo "${movie.title}"...`, 'info');
    }
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

  let selectedRating = 0;
  const reviewStarsEl = document.getElementById('review-stars');
  const reviewRatingValue = document.getElementById('review-rating-value');

  if (reviewStarsEl) {
    createInteractiveStarRating(reviewStarsEl, 10, (rating) => {
      selectedRating = rating;
      if (reviewRatingValue) reviewRatingValue.value = rating;
    });
  }

  try {
    const reviews = await getReviews(movieId);
    if (reviewsList) {
      if (Array.isArray(reviews) && reviews.length > 0) {
        reviewsList.innerHTML = reviews.map(renderReviewCard).join('');
        attachLikeHandlers(reviewsList);
      } else {
        reviewsList.innerHTML = '<p class="text-muted">Aun no hay resenas. Se el primero en opinar.</p>';
      }
    }
  } catch (err) {
    if (reviewsList) reviewsList.innerHTML = '<p class="text-muted">No se pudieron cargar las resenas.</p>';
  }

  if (reviewForm) {
    reviewForm.onsubmit = async (e) => {
      e.preventDefault();

      if (!isLoggedIn()) {
        showToast('Inicia sesion para publicar una resena', 'warning');
        return;
      }

      const titleInput = document.getElementById('review-title-input');
      const commentInput = document.getElementById('review-comment');
      const title = titleInput ? titleInput.value.trim() : '';
      const comment = commentInput ? commentInput.value.trim() : '';

      if (!title || !comment || selectedRating < 1) {
        showToast('Completa titulo, comentario y selecciona estrellas (1-10)', 'error');
        return;
      }

      try {
        await createReview(movieId, {
          title,
          comment,
          rating: selectedRating,
        });

        showToast('Resena publicada correctamente', 'success');
        reviewForm.reset();
        selectedRating = 0;
        await loadReviews(movieId);
      } catch (err) {
        showToast(err.message || 'Error al enviar resena', 'error');
      }
    };
  }
}

function attachLikeHandlers(container) {
  const likeBtns = container.querySelectorAll('.review-card__like-btn');
  likeBtns.forEach(btn => {
    btn.onclick = async () => {
      const reviewId = btn.getAttribute('data-review-id');
      if (!isLoggedIn()) {
        showToast('Inicia sesion para reaccionar', 'warning');
        return;
      }
      try {
        await toggleReaction(reviewId);
        const countEl = btn.querySelector('.review-card__like-count');
        const isActive = btn.classList.toggle('review-card__like-btn--active');
        if (countEl) {
          let count = parseInt(countEl.textContent, 10) || 0;
          count += isActive ? 1 : -1;
          countEl.textContent = Math.max(0, count);
        }
      } catch (err) {
        showToast(err.message || 'Error al reaccionar', 'error');
      }
    };
  });
}
