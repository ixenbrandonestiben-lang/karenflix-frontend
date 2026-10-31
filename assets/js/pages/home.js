// Pagina de inicio: Hero Banner y carruseles
import { getMovies } from '../api/movie.api.js';
import { addFavorite, getFavorites, removeFavorite } from '../api/favorite.api.js';
import { renderNavbar } from '../components/navbar.js';
import { createMovieCard } from '../components/movieCard.js';
import { showToast } from '../utils/notify.js';
import { isLoggedIn } from '../utils/authStorage.js';
import { getPageUrl } from '../utils/pageRoutes.js';

export async function initHomePage() {
  renderNavbar('home');

  const carouselsContainer = document.getElementById('carousels');
  if (carouselsContainer) {
    carouselsContainer.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';
  }

  try {
    const [movies, favorites] = await Promise.all([
      getMovies(),
      isLoggedIn()
        ? getFavorites().catch(error => {
          console.warn('Error al cargar favoritos:', error);
          return [];
        })
        : Promise.resolve([]),
    ]);
    const favoritesByMovieId = new Map(
      (Array.isArray(favorites) ? favorites : [])
        .map(favorite => [String(favorite.movie_id ?? favorite.movie?.id), favorite])
    );
    const approvedMovies = Array.isArray(movies)
      ? movies.filter(m => m.status === 'approved')
      : [];

    if (carouselsContainer) carouselsContainer.innerHTML = '';

    if (approvedMovies.length > 0) {
      renderHeroBanner(approvedMovies, favoritesByMovieId);
      renderCarousels(approvedMovies, favoritesByMovieId);
    } else {
      if (carouselsContainer) {
        carouselsContainer.innerHTML = `
          <div class="empty-state">
            <p class="empty-state__icon">🎬</p>
            <h3>No hay peliculas disponibles</h3>
            <p>Conecta tu backend o registra peliculas en el Panel de Administracion.</p>
          </div>
        `;
      }
    }

    setupScrollButtons();
  } catch (error) {
    console.error('Error al obtener peliculas:', error);
    if (carouselsContainer) {
      carouselsContainer.innerHTML = `
        <div class="empty-state">
          <p class="empty-state__icon">⚠️</p>
          <h3>Backend Desconectado</h3>
          <p>Asegurate de que el backend este corriendo en http://localhost:4000/api/v1</p>
        </div>
      `;
    }
  }
}

function renderHeroBanner(approvedMovies, favoritesByMovieId) {
  if (approvedMovies.length === 0) return;

  const hero = approvedMovies.reduce((best, movie) =>
    (movie.averageRating || 0) > (best.averageRating || 0) ? movie : best,
    approvedMovies[0]
  );

  const backdropEl = document.getElementById('hero-backdrop');
  if (backdropEl) {
    backdropEl.innerHTML = '';
    const img = document.createElement('img');
    img.className = 'hero__backdrop-img';
    img.src = hero.imageUrl || hero.image_url || '';
    img.alt = hero.title;
    img.onerror = () => { img.style.display = 'none'; };
    backdropEl.appendChild(img);
  }

  const titleEl = document.getElementById('hero-title');
  if (titleEl) titleEl.textContent = hero.title;

  const synopsisEl = document.getElementById('hero-synopsis');
  if (synopsisEl) synopsisEl.textContent = hero.description;

  const metaEl = document.getElementById('hero-meta');
  if (metaEl) {
    metaEl.innerHTML = `
      <span class="hero__meta-item hero__meta-rating">★ ${hero.averageRating || 'N/A'}</span>
      <span class="hero__meta-item">${hero.releaseYear || hero.release_year || ''}</span>
      <span class="hero__meta-item">${hero.category || ''}</span>
    `;
  }

  const watchBtn = document.getElementById('hero-watch');
  if (watchBtn) {
    watchBtn.onclick = () => {
      window.location.href = `${getPageUrl('detail.html')}?id=${hero.id}`;
    };
  }

  const addListBtn = document.getElementById('hero-add-list');
  if (addListBtn) {
    let favoriteId = favoritesByMovieId.get(String(hero.id))?.id ?? null;
    if (favoriteId) {
      addListBtn.innerHTML = '<span>✓</span> En Mi Lista';
      addListBtn.classList.replace('btn--secondary', 'btn--ghost');
    }

    addListBtn.onclick = async () => {
      if (!isLoggedIn()) {
        showToast('Inicia sesion para guardar en tu lista', 'warning');
        return;
      }
      try {
        if (favoriteId) {
          await removeFavorite(favoriteId);
          favoriteId = null;
          addListBtn.innerHTML = '<span>+</span> Mi Lista';
          addListBtn.classList.replace('btn--ghost', 'btn--secondary');
          showToast('Eliminada de Mi Lista', 'info');
        } else {
          const favorite = await addFavorite(hero.id);
          favoriteId = favorite?.id ?? null;
          addListBtn.innerHTML = '<span>✓</span> En Mi Lista';
          addListBtn.classList.replace('btn--secondary', 'btn--ghost');
          showToast(`"${hero.title}" agregada a Mi Lista`, 'success');
        }
      } catch (err) {
        showToast(err.message || 'Error al actualizar Mi Lista', 'error');
      }
    };
  }
}

function buildCarouselSection(categoryName, movies, linkHref, favoritesByMovieId) {
  const section = document.createElement('section');
  section.className = 'content-row';

  const header = document.createElement('header');
  header.className = 'content-row__header';
  header.innerHTML = `
    <h2 class="content-row__title">${categoryName}</h2>
    <a href="${linkHref}" class="content-row__see-all">Ver todas →</a>
  `;

  const trackWrapper = document.createElement('div');
  trackWrapper.className = 'content-row__track-wrapper';

  const leftBtn = document.createElement('button');
  leftBtn.className = 'content-row__scroll-btn content-row__scroll-btn--left';
  leftBtn.textContent = '‹';
  leftBtn.setAttribute('aria-label', `Desplazar ${categoryName} a la izquierda`);

  const track = document.createElement('div');
  track.className = 'content-row__track';

  movies.forEach(movie => {
    const favoriteId = favoritesByMovieId.get(String(movie.id))?.id ?? null;
    const card = createMovieCard(movie, {
      showFavorite: true,
      favoriteActive: Boolean(favoriteId),
      favoriteId,
    });
    track.appendChild(card);
  });

  const rightBtn = document.createElement('button');
  rightBtn.className = 'content-row__scroll-btn content-row__scroll-btn--right';
  rightBtn.textContent = '›';
  rightBtn.setAttribute('aria-label', `Desplazar ${categoryName} a la derecha`);

  trackWrapper.appendChild(leftBtn);
  trackWrapper.appendChild(track);
  trackWrapper.appendChild(rightBtn);

  section.appendChild(header);
  section.appendChild(trackWrapper);

  return section;
}

function renderCarousels(approvedMovies, favoritesByMovieId) {
  const container = document.getElementById('carousels');
  if (!container) return;

  const trending = [...approvedMovies]
    .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
    .slice(0, 8);

  container.appendChild(
    buildCarouselSection('Tendencias', trending, getPageUrl('movies.html'), favoritesByMovieId)
  );

  const categoriesMap = new Map();
  approvedMovies.forEach(m => {
    const cat = m.category || 'General';
    if (!categoriesMap.has(cat)) categoriesMap.set(cat, []);
    categoriesMap.get(cat).push(m);
  });

  categoriesMap.forEach((categoryMovies, categoryName) => {
    const section = buildCarouselSection(
      categoryName,
      categoryMovies,
      `${getPageUrl('movies.html')}?category=${encodeURIComponent(categoryName)}`,
      favoritesByMovieId
    );
    container.appendChild(section);
  });
}

// Botones de desplazamiento horizontal
function setupScrollButtons() {
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.content-row__scroll-btn');
    if (!btn) return;

    const track = btn.parentElement.querySelector('.content-row__track');
    if (!track) return;

    const scrollAmount = btn.classList.contains('content-row__scroll-btn--left')
      ? -600
      : 600;

    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });
}
