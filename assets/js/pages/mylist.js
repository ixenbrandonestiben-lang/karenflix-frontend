// Lista de favoritos del usuario
import { getFavorites } from '../api/favorite.api.js';
import { renderNavbar } from '../components/navbar.js';
import { createMovieCard } from '../components/movieCard.js';
import { isLoggedIn } from '../utils/authStorage.js';

export async function initMyListPage() {
  renderNavbar('mylist');

  const grid = document.getElementById('mylist-grid');
  const loginPrompt = document.getElementById('mylist-login');
  const emptyState = document.getElementById('mylist-empty');

  if (!isLoggedIn()) {
    if (grid) grid.style.display = 'none';
    if (loginPrompt) loginPrompt.style.display = 'flex';
    if (emptyState) emptyState.style.display = 'none';
    return;
  }

  if (loginPrompt) loginPrompt.style.display = 'none';
  if (grid) grid.innerHTML = '<div class="page-loading" style="grid-column: 1 / -1;"><div class="spinner"></div></div>';

  try {
    const favorites = await getFavorites();
    const items = Array.isArray(favorites) ? favorites : [];

    if (items.length === 0) {
      if (grid) grid.style.display = 'none';
      if (emptyState) emptyState.style.display = 'flex';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (grid) {
      grid.style.display = '';
      grid.innerHTML = '';

      items.forEach(fav => {
        const movieObj = fav.movie ? { ...fav.movie, id: fav.movie_id } : fav;
        const card = createMovieCard(movieObj, {
          showFavorite: true,
          favoriteActive: true,
        });
        grid.appendChild(card);
      });
    }
  } catch (err) {
    console.error('Error al cargar favoritos:', err);
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p class="empty-state__icon">⚠️</p>
          <h3>No se pudieron cargar los favoritos</h3>
          <p>${err.message}</p>
        </div>
      `;
    }
  }
}
