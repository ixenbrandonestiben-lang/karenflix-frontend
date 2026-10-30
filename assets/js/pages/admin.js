// Panel de administracion: Aprobacion y registro de contenido
import { getMovies, approveMovie, deleteMovie, createMovie, getCategories } from '../api/movie.api.js';
import { getActors, assignActor } from '../api/actor.api.js';
import { renderNavbar } from '../components/navbar.js';
import { isAdmin, isLoggedIn } from '../utils/authStorage.js';
import { showToast } from '../utils/notify.js';

let allMovies = [];
let categoriesList = [];
let actorsList = [];

export async function initAdminPage() {
  renderNavbar('admin');

  if (!isLoggedIn() || !isAdmin()) {
    showToast('Acceso restringido a administradores', 'error');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return;
  }

  initTabs();
  await loadAdminData();
  setupAddMovieForm();
  setupAssignActorForm();
}

async function loadAdminData() {
  const tbody = document.getElementById('pending-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--space-xl);"><div class="spinner spinner--sm" style="margin:auto;"></div></td></tr>';

  try {
    const [movies, categories, actors] = await Promise.all([
      getMovies().catch(() => []),
      getCategories().catch(() => []),
      getActors().catch(() => []),
    ]);

    allMovies = Array.isArray(movies) ? movies : [];
    categoriesList = Array.isArray(categories) ? categories : [];
    actorsList = Array.isArray(actors) ? actors : [];

    renderStats();
    renderPendingTable();
    populateCategorySelect();
    populateMovieAndActorSelects();
  } catch (err) {
    showToast(`Error al cargar datos: ${err.message}`, 'error');
  }
}

function renderStats() {
  const statsContainer = document.getElementById('admin-stats');
  if (!statsContainer) return;

  const total = allMovies.length;
  const pending = allMovies.filter(m => m.status === 'pending').length;
  const approved = allMovies.filter(m => m.status === 'approved').length;

  statsContainer.innerHTML = `
    <article class="admin-stat-card">
      <div class="admin-stat-card__value">${total}</div>
      <div class="admin-stat-card__label">Total Peliculas</div>
    </article>
    <article class="admin-stat-card">
      <div class="admin-stat-card__value" style="color:var(--color-warning);">${pending}</div>
      <div class="admin-stat-card__label">Pendientes</div>
    </article>
    <article class="admin-stat-card">
      <div class="admin-stat-card__value" style="color:var(--color-success);">${approved}</div>
      <div class="admin-stat-card__label">Aprobadas</div>
    </article>
  `;
}

function initTabs() {
  const tabButtons = document.querySelectorAll('.admin-tabs__btn');
  const tabContents = {
    'pending': document.getElementById('tab-pending'),
    'add-movie': document.getElementById('tab-add-movie'),
    'assign-actors': document.getElementById('tab-assign-actors'),
  };

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTab = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('admin-tabs__btn--active'));
      btn.classList.add('admin-tabs__btn--active');

      Object.keys(tabContents).forEach(key => {
        if (tabContents[key]) {
          tabContents[key].style.display = (key === targetTab) ? 'block' : 'none';
        }
      });
    });
  });
}

function renderPendingTable() {
  const tbody = document.getElementById('pending-tbody');
  if (!tbody) return;

  const pendingMovies = allMovies.filter(m => m.status === 'pending');

  if (pendingMovies.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" style="text-align:center;padding:var(--space-xl);color:var(--color-text-muted);">
          No hay peliculas pendientes de aprobacion.
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = pendingMovies.map(movie => `
    <tr data-movie-id="${movie.id}">
      <td data-label="Image">
        <img class="admin-table__img" src="${movie.imageUrl || movie.image_url || ''}" alt="${movie.title}"
             onerror="this.src='';this.style.background='var(--color-bg-hover)';">
      </td>
      <td data-label="Title" style="font-weight:600;color:var(--color-text-primary);">${movie.title}</td>
      <td data-label="Category">${movie.category || 'N/A'}</td>
      <td data-label="Year">${movie.releaseYear || movie.release_year || 'N/A'}</td>
      <td data-label="Submitted By">${movie.createBy || 'Comunidad'}</td>
      <td data-label="Status">
        <span class="badge badge--warning">pending</span>
      </td>
      <td data-label="Actions">
        <div class="admin-table__actions">
          <button class="btn btn--sm btn--primary btn-approve" data-id="${movie.id}">
            ✓ Aprobar
          </button>
          <button class="btn btn--sm btn--danger btn-reject" data-id="${movie.id}">
            ✕ Eliminar
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  tbody.querySelectorAll('.btn-approve').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      try {
        await approveMovie(id);
        showToast('Pelicula aprobada', 'success');
        await loadAdminData();
      } catch (err) {
        showToast(err.message || 'Error al aprobar', 'error');
      }
    };
  });

  tbody.querySelectorAll('.btn-reject').forEach(btn => {
    btn.onclick = async () => {
      const id = btn.getAttribute('data-id');
      if (!confirm('Deseas eliminar esta pelicula?')) return;
      try {
        await deleteMovie(id);
        showToast('Pelicula eliminada', 'info');
        await loadAdminData();
      } catch (err) {
        showToast(err.message || 'Error al eliminar', 'error');
      }
    };
  });
}

function populateCategorySelect() {
  const categorySelect = document.getElementById('movie-category');
  if (!categorySelect) return;

  categorySelect.innerHTML = '<option value="">Selecciona categoria...</option>' +
    categoriesList.map(c => `<option value="${c.id}">${c.name}</option>`).join('');
}

function populateMovieAndActorSelects() {
  const movieSelect = document.getElementById('assign-movie');
  if (movieSelect) {
    movieSelect.innerHTML = '<option value="">Selecciona pelicula...</option>' +
      allMovies.map(m => `<option value="${m.id}">${m.title}</option>`).join('');
  }

  const actorSelect = document.getElementById('assign-actor');
  if (actorSelect) {
    actorSelect.innerHTML = '<option value="">Selecciona actor...</option>' +
      actorsList.map(a => `<option value="${a.id}">${a.name}</option>`).join('');
  }
}

function setupAddMovieForm() {
  const form = document.getElementById('add-movie-form');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();

    const title = document.getElementById('movie-title').value.trim();
    const description = document.getElementById('movie-description').value.trim();
    const categoryId = document.getElementById('movie-category').value;
    const releaseYear = parseInt(document.getElementById('movie-year').value, 10);
    const imageUrl = document.getElementById('movie-image').value.trim();

    if (!title || !description || !categoryId || !releaseYear) {
      showToast('Completa todos los campos obligatorios', 'error');
      return;
    }

    try {
      await createMovie({
        title,
        description,
        category_id: parseInt(categoryId, 10),
        release_year: releaseYear,
        image_url: imageUrl,
      });

      showToast(`Pelicula "${title}" registrada con exito`, 'success');
      form.reset();
      await loadAdminData();
    } catch (err) {
      showToast(err.message || 'Error al registrar pelicula', 'error');
    }
  };
}

function setupAssignActorForm() {
  const form = document.getElementById('assign-actor-form');
  if (!form) return;

  form.onsubmit = async (e) => {
    e.preventDefault();

    const movieId = document.getElementById('assign-movie').value;
    const actorId = document.getElementById('assign-actor').value;
    const characterName = document.getElementById('assign-character').value.trim();

    if (!movieId || !actorId || !characterName) {
      showToast('Selecciona pelicula, actor y nombre de personaje', 'error');
      return;
    }

    try {
      await assignActor({
        movie_id: parseInt(movieId, 10),
        actor_id: parseInt(actorId, 10),
        character_name: characterName,
      });

      showToast('Actor asignado con exito', 'success');
      form.reset();
    } catch (err) {
      showToast(err.message || 'Error al asignar actor', 'error');
    }
  };
}
