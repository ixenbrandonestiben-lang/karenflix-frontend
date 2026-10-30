// Componente de tarjeta de pelicula
import { showToast } from '../utils/notify.js';

export function createMovieCard(movie, options = {}) {
  const {
    showFavorite = false,
    favoriteActive = false,
    showInfo = true,
    linkToDetail = true,
  } = options;

  let ratingBadge = '';
  if (movie.averageRating != null || movie.average_rating != null) {
    const ratingValue = Number(movie.averageRating || movie.average_rating);
    let ratingModifier = 'movie-card__rating--low';
    if (ratingValue >= 7.5) {
      ratingModifier = 'movie-card__rating--high';
    } else if (ratingValue >= 5) {
      ratingModifier = 'movie-card__rating--mid';
    }
    ratingBadge = `<span class="movie-card__rating ${ratingModifier}">★ ${ratingValue}</span>`;
  }

  let favoriteButton = '';
  if (showFavorite) {
    const activeClass = favoriteActive ? ' movie-card__favorite--active' : '';
    favoriteButton = `<button class="movie-card__favorite${activeClass}" data-movie-id="${movie.id}" aria-label="Toggle favorite">♥</button>`;
  }

  let cardInfo = '';
  if (showInfo) {
    cardInfo = `
      <div class="movie-card__info">
        <h3 class="movie-card__title">${escapeHTML(movie.title)}</h3>
        <span class="movie-card__year">${movie.releaseYear || movie.release_year || ''}</span>
      </div>`;
  }

  const html = `
    <article class="movie-card" data-movie-id="${movie.id}" style="${linkToDetail ? 'cursor:pointer;' : ''}">
      <div class="movie-card__poster-wrapper">
        <img class="movie-card__poster"
             src="${escapeAttr(movie.imageUrl || movie.image_url || '')}"
             alt="${escapeAttr(movie.title)}"
             loading="lazy"
             onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
        <div class="movie-card__poster-placeholder" style="display:none">🎬</div>
        ${ratingBadge}
        ${favoriteButton}
        <div class="movie-card__overlay">
          <span class="movie-card__overlay-title">${escapeHTML(movie.title)}</span>
          <div class="movie-card__overlay-meta">
            <span>${movie.releaseYear || movie.release_year || ''}</span>
            <span>·</span>
            <span>${escapeHTML(movie.category || '')}</span>
          </div>
        </div>
      </div>
      ${cardInfo}
    </article>
  `.trim();

  const template = document.createElement('template');
  template.innerHTML = html;
  const card = template.content.firstElementChild;

  if (linkToDetail) {
    card.addEventListener('click', () => {
      window.location.href = `detail.html?id=${movie.id}`;
    });
  }

  const favBtn = card.querySelector('.movie-card__favorite');
  if (favBtn) {
    favBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const isActive = favBtn.classList.toggle('movie-card__favorite--active');
      showToast(isActive ? `Agregada a Mi Lista` : `Eliminada de Mi Lista`, 'info');
    });
  }

  card.toString = () => card.outerHTML;
  return card;
}

function escapeHTML(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(str) {
  return escapeHTML(str);
}
