// Catalogo de peliculas: Filtros y buscador
import { getMovies, getCategories } from '../api/movie.api.js';
import { renderNavbar } from '../components/navbar.js';
import { createMovieCard } from '../components/movieCard.js';

let searchTimer = null;
let activeCategory = 'All';
let allMovies = [];

export async function initMoviesPage() {
  renderNavbar('movies');

  await populateFilterButtons();
  applyURLParams();
  await fetchAndRenderMovies();
  bindSearch();
}

async function populateFilterButtons() {
  const container = document.getElementById('filter-categories');
  if (!container) return;

  container.innerHTML = '';

  const allBtn = document.createElement('button');
  allBtn.className = 'filter-bar__btn filter-bar__btn--active';
  allBtn.textContent = 'All';
  allBtn.dataset.category = 'All';
  allBtn.addEventListener('click', handleCategoryClick);
  container.appendChild(allBtn);

  try {
    const categories = await getCategories();
    if (Array.isArray(categories)) {
      categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-bar__btn';
        btn.textContent = cat.name;
        btn.dataset.category = cat.name;
        btn.addEventListener('click', handleCategoryClick);
        container.appendChild(btn);
      });
    }
  } catch (err) {
    console.warn('Error al cargar categorias:', err);
  }
}

function handleCategoryClick(e) {
  const clickedBtn = e.currentTarget;
  activeCategory = clickedBtn.dataset.category;

  const container = document.getElementById('filter-categories');
  container.querySelectorAll('.filter-bar__btn').forEach(btn => {
    btn.classList.toggle('filter-bar__btn--active', btn === clickedBtn);
  });

  renderMovieGrid();
}

async function fetchAndRenderMovies() {
  const grid = document.getElementById('movie-grid');
  if (grid) grid.innerHTML = '<div class="page-loading"><div class="spinner"></div></div>';

  try {
    const movies = await getMovies();
    allMovies = Array.isArray(movies) ? movies.filter(m => m.status === 'approved') : [];
    renderMovieGrid();
  } catch (err) {
    console.error('Error al cargar peliculas:', err);
    if (grid) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <p class="empty-state__icon">⚠️</p>
          <h3>Error de conexion con el Backend</h3>
          <p>No se pudieron obtener las peliculas (${err.message})</p>
        </div>
      `;
    }
  }
}

function renderMovieGrid() {
  const grid = document.getElementById('movie-grid');
  const emptyState = document.getElementById('empty-state');
  if (!grid) return;

  let filtered = [...allMovies];

  if (activeCategory !== 'All') {
    filtered = filtered.filter(m => m.category === activeCategory);
  }

  const searchInput = document.getElementById('filter-search');
  if (searchInput && searchInput.value.trim()) {
    const term = searchInput.value.trim().toLowerCase();
    filtered = filtered.filter(m => m.title && m.title.toLowerCase().includes(term));
  }

  grid.innerHTML = '';

  filtered.forEach(movie => {
    const card = createMovieCard(movie, { showFavorite: true, showInfo: true });
    grid.appendChild(card);
  });

  if (emptyState) {
    emptyState.style.display = filtered.length === 0 ? 'flex' : 'none';
  }
}

function bindSearch() {
  const searchInput = document.getElementById('filter-search');
  if (!searchInput) return;

  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      renderMovieGrid();
    }, 300);
  });
}

function applyURLParams() {
  const params = new URLSearchParams(window.location.search);
  const cat = params.get('category');
  const search = params.get('search');

  if (cat) {
    activeCategory = cat;
    const btns = document.querySelectorAll('.filter-bar__btn');
    btns.forEach(b => {
      b.classList.toggle('filter-bar__btn--active', b.dataset.category === cat);
    });
  }

  if (search) {
    const searchInput = document.getElementById('filter-search');
    if (searchInput) searchInput.value = search;
  }
}
