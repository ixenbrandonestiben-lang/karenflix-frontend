// Panel de administracion: Aprobacion y registro de contenido
import {
  getMovies, getPendingMovies, approveMovie, deleteMovie, createMovie, getCategories,
  getCategoryById, updateMovie, createCategory, updateCategory, deleteCategory,
} from '../api/movie.api.js';
import {
  getActors, getActorById, createActor, updateActor, deleteActor, assignActor,
  getMovieCast, getMovieActors, getActorMovies, getMovieActorById,
  updateActorAssignment, removeActor,
} from '../api/actor.api.js';
import {
  getDirectors, getDirectorById, createDirector, updateDirector, deleteDirector,
} from '../api/director.api.js';
import { getUsers, updateUser, updateUserRole, deleteUser } from '../api/user.api.js';
import { renderNavbar } from '../components/navbar.js';
import { getToken, getUser, isAdmin, isLoggedIn, setSession } from '../utils/authStorage.js';
import { showToast } from '../utils/notify.js';
import { getPageUrl } from '../utils/pageRoutes.js';
import { normalizeYouTubeUrl } from '../utils/youtube.js';

let allMovies = [];
let categoriesList = [];
let actorsList = [];
let directorsList = [];
let usersList = [];

export async function initAdminPage() {
  renderNavbar('admin');

  if (!isLoggedIn() || !isAdmin()) {
    showToast('Acceso restringido a administradores', 'error');
    setTimeout(() => {
      window.location.href = getPageUrl('login.html');
    }, 1200);
    return;
  }

  initTabs();
  await loadAdminData();
  setupAddMovieForm();
  setupAssignActorForm();
  setupActorForm();
  setupDirectorForm();
  setupCategoryForm();
  setupUserForm();
  setupRoleDialog();
}

async function loadAdminData() {
  const tbody = document.getElementById('pending-tbody');
  if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:var(--space-xl);"><div class="spinner spinner--sm" style="margin:auto;"></div></td></tr>';

  try {
    const [movies, pendingMovies, categories, actors, directors, users] = await Promise.all([
      getMovies({ limit: 100 }),
      getPendingMovies({ limit: 100 }),
      getCategories(),
      getActors(),
      getDirectors(),
      getUsers(),
    ]);

    allMovies = [
      ...(Array.isArray(movies) ? movies : []),
      ...(Array.isArray(pendingMovies) ? pendingMovies : []),
    ];
    categoriesList = Array.isArray(categories) ? categories : [];
    actorsList = Array.isArray(actors) ? actors : [];
    directorsList = Array.isArray(directors) ? directors : [];
    usersList = Array.isArray(users) ? users : [];

    renderStats();
    renderPendingTable();
    renderMovies();
    populateCategorySelect();
    populateDirectorSelect();
    populateMovieAndActorSelects();
    renderActors();
    renderDirectors();
    renderCategories();
    renderUsers();
  } catch (err) {
    showToast(`Error al cargar datos del panel: ${err.message}`, 'error');
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
    'manage-movies': document.getElementById('tab-manage-movies'),
    'assign-actors': document.getElementById('tab-assign-actors'),
    'manage-actors': document.getElementById('tab-manage-actors'),
    'manage-directors': document.getElementById('tab-manage-directors'),
    'manage-categories': document.getElementById('tab-manage-categories'),
    'manage-users': document.getElementById('tab-manage-users'),
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
      if (targetTab === 'assign-actors') loadCastForSelectedMovie();
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

  const selected = categorySelect.value;
  categorySelect.innerHTML = '<option value="">Selecciona categoria...</option>' +
    categoriesList.map(c => `<option value="${c.id}">${escapeHTML(c.name)}</option>`).join('');
  if (selected) categorySelect.value = selected;
}

function populateDirectorSelect() {
  const directorSelect = document.getElementById('movie-director');
  if (!directorSelect) return;

  const selected = directorSelect.value;
  directorSelect.innerHTML = '<option value="">Selecciona director...</option>' +
    directorsList.map(director => `<option value="${director.id}">${escapeHTML(director.name)}</option>`).join('');
  if (selected) directorSelect.value = selected;
}

function populateMovieAndActorSelects() {
  const movieSelect = document.getElementById('assign-movie');
  if (movieSelect) {
    const selected = movieSelect.value;
    movieSelect.innerHTML = '<option value="">Selecciona pelicula...</option>' +
      allMovies.map(m => `<option value="${m.id}">${escapeHTML(m.title)}</option>`).join('');
    if (selected) movieSelect.value = selected;
  }

  const actorSelect = document.getElementById('assign-actor');
  if (actorSelect) {
    const selected = actorSelect.value;
    actorSelect.innerHTML = '<option value="">Selecciona actor...</option>' +
      actorsList.map(a => `<option value="${a.id}">${escapeHTML(a.name)}</option>`).join('');
    if (selected) actorSelect.value = selected;
  }
}

function setupAddMovieForm() {
  const form = document.getElementById('add-movie-form');
  if (!form) return;
  document.getElementById('movie-year').max = String(new Date().getFullYear() + 5);
  document.getElementById('movie-cancel').addEventListener('click', resetMovieForm);

  form.onsubmit = async (e) => {
    e.preventDefault();

    const movieId = document.getElementById('movie-id').value;
    const title = document.getElementById('movie-title').value.trim();
    const description = document.getElementById('movie-description').value.trim();
    const categoryId = document.getElementById('movie-category').value;
    const directorId = document.getElementById('movie-director').value;
    const releaseYear = parseInt(document.getElementById('movie-year').value, 10);
    const durationMinutes = parseInt(document.getElementById('movie-duration').value, 10);
    const imageUrl = document.getElementById('movie-image').value.trim();
    const trailerUrl = document.getElementById('movie-trailer').value.trim();

    if (!title || !description || !categoryId || !directorId || !releaseYear || !durationMinutes) {
      showToast('Completa todos los campos obligatorios', 'error');
      return;
    }

    if (trailerUrl && !normalizeYouTubeUrl(trailerUrl)) {
      showToast('Ingresa una URL válida de YouTube para el tráiler', 'error');
      return;
    }

    try {
      const movieData = {
        title,
        description,
        director_id: Number(directorId),
        category_id: Number(categoryId),
        release_year: releaseYear,
        duration_minutes: durationMinutes,
        image_url: imageUrl || null,
        trailer_url: trailerUrl || null,
      };
      if (movieId) {
        await updateMovie(movieId, movieData);
        showToast(`Pelicula "${title}" actualizada`, 'success');
      } else {
        await createMovie(movieData);
        showToast(`Pelicula "${title}" registrada con exito`, 'success');
      }
      resetMovieForm();
      await loadAdminData();
    } catch (err) {
      showToast(err.message || 'Error al registrar pelicula', 'error');
    }
  };
}

function renderMovies() {
  const tbody = document.getElementById('movies-tbody');
  if (!tbody) return;
  if (!allMovies.length) {
    tbody.innerHTML = '<tr><td colspan="6">No hay peliculas registradas.</td></tr>';
    return;
  }
  tbody.innerHTML = allMovies.map(movie => `
    <tr>
      <td>${escapeHTML(movie.title)}</td>
      <td>${escapeHTML(movie.director?.name || movie.director || '—')}</td>
      <td>${escapeHTML(movie.category || '—')}</td>
      <td>${escapeHTML(movie.releaseYear || movie.release_year || '—')}</td>
      <td>${escapeHTML(movie.status || '—')}</td>
      <td><div class="admin-table__actions">
        <button class="btn btn--sm btn--ghost" data-movie-edit="${movie.id}">Edit</button>
        <button class="btn btn--sm btn--danger" data-movie-delete="${movie.id}">Delete</button>
      </div></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-movie-edit]').forEach(button => {
    button.addEventListener('click', () => {
      const movie = allMovies.find(item => String(item.id) === button.dataset.movieEdit);
      if (!movie) return;
      const category = categoriesList.find(item => item.name === movie.category);
      document.getElementById('movie-id').value = movie.id;
      document.getElementById('movie-title').value = movie.title || '';
      document.getElementById('movie-description').value = movie.description || '';
      document.getElementById('movie-category').value = category?.id || '';
      document.getElementById('movie-director').value = movie.director?.id || '';
      document.getElementById('movie-year').value = movie.releaseYear || movie.release_year || '';
      document.getElementById('movie-duration').value = movie.durationMinutes || movie.duration_minutes || '';
      document.getElementById('movie-image').value = movie.imageUrl || movie.image_url || '';
      document.getElementById('movie-trailer').value = movie.trailerUrl || movie.trailer_url || '';
      document.getElementById('movie-form-title').textContent = 'Edit Movie';
      document.getElementById('movie-submit').textContent = 'Save Movie';
      document.getElementById('movie-cancel').style.display = '';
      document.querySelector('[data-tab="add-movie"]').click();
      document.getElementById('add-movie-form').scrollIntoView({ behavior: 'smooth' });
    });
  });
  tbody.querySelectorAll('[data-movie-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this movie? This cannot be undone.')) return;
      try {
        await deleteMovie(button.dataset.movieDelete);
        showToast('Pelicula eliminada', 'success');
        await loadAdminData();
      } catch (error) {
        showToast(error.message || 'No se pudo eliminar la pelicula', 'error');
      }
    });
  });
}

function resetMovieForm() {
  document.getElementById('add-movie-form').reset();
  document.getElementById('movie-id').value = '';
  document.getElementById('movie-form-title').textContent = 'Register New Movie';
  document.getElementById('movie-submit').textContent = 'Add Movie';
  document.getElementById('movie-cancel').style.display = 'none';
}

function setupAssignActorForm() {
  const form = document.getElementById('assign-actor-form');
  if (!form) return;

  const movieSelect = document.getElementById('assign-movie');
  const cancelButton = document.getElementById('assign-actor-cancel');
  if (movieSelect) movieSelect.addEventListener('change', loadCastForSelectedMovie);
  if (cancelButton) cancelButton.addEventListener('click', resetAssignmentForm);

  form.onsubmit = async (e) => {
    e.preventDefault();

    const assignmentId = document.getElementById('assign-actor-id').value;
    const movieId = document.getElementById('assign-movie').value;
    const actorId = document.getElementById('assign-actor').value;
    const characterName = document.getElementById('assign-character').value.trim();

    if (!movieId || !actorId) {
      showToast('Selecciona pelicula y actor', 'error');
      return;
    }

    try {
      const data = {
        movie_id: Number(movieId),
        actor_id: Number(actorId),
        character_name: characterName || null,
      };
      if (assignmentId) {
        await updateActorAssignment(assignmentId, data);
        showToast('Asignacion actualizada', 'success');
      } else {
        await assignActor(data);
        showToast('Actor asignado con exito', 'success');
      }
      resetAssignmentForm();
      await loadCastForSelectedMovie();
    } catch (err) {
      showToast(err.message || 'Error al guardar la asignacion', 'error');
    }
  };
}

async function loadCastForSelectedMovie() {
  const movieId = document.getElementById('assign-movie')?.value;
  const tbody = document.getElementById('cast-tbody');
  if (!tbody) return;
  if (!movieId) {
    tbody.innerHTML = '<tr><td colspan="4">Cargando asignaciones de reparto...</td></tr>';
  }

  try {
    const cast = movieId ? await getMovieCast(movieId) : await getMovieActors();
    renderCast(Array.isArray(cast) ? cast : []);
  } catch (error) {
    tbody.innerHTML = `<tr><td colspan="4">${escapeHTML(error.message)}</td></tr>`;
  }
}

function renderCast(cast) {
  const tbody = document.getElementById('cast-tbody');
  if (!tbody) return;
  if (!cast.length) {
    tbody.innerHTML = '<tr><td colspan="4">No hay asignaciones de reparto.</td></tr>';
    return;
  }

  tbody.innerHTML = cast.map(item => `
    <tr>
      <td>${escapeHTML(item.actor?.name || `Actor ${item.actor_id}`)}</td>
      <td>${escapeHTML(item.character_name || '—')}</td>
      <td>${escapeHTML(item.movie?.title || selectedMovieTitle(item.movie_id))}</td>
      <td><div class="admin-table__actions">
        <button class="btn btn--sm btn--ghost" data-cast-edit="${item.id}">Edit</button>
        <button class="btn btn--sm btn--danger" data-cast-delete="${item.id}">Delete</button>
      </div></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-cast-edit]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const item = await getMovieActorById(button.dataset.castEdit);
        document.getElementById('assign-actor-id').value = item.id;
        document.getElementById('assign-movie').value = item.movie_id;
        document.getElementById('assign-actor').value = item.actor_id;
        document.getElementById('assign-character').value = item.character_name || '';
        document.getElementById('assign-actor-title').textContent = 'Edit Cast Assignment';
        document.getElementById('assign-actor-submit').textContent = 'Save Assignment';
        document.getElementById('assign-actor-cancel').style.display = '';
      } catch (error) {
        showToast(error.message || 'No se pudo cargar la asignacion', 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-cast-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Remove this actor from the movie cast?')) return;
      try {
        await removeActor(button.dataset.castDelete);
        showToast('Asignacion eliminada', 'success');
        await loadCastForSelectedMovie();
      } catch (error) {
        showToast(error.message || 'No se pudo eliminar la asignacion', 'error');
      }
    });
  });
}

function selectedMovieTitle(id) {
  return allMovies.find(movie => String(movie.id) === String(id))?.title || '';
}

function resetAssignmentForm() {
  const form = document.getElementById('assign-actor-form');
  const selectedMovie = document.getElementById('assign-movie').value;
  if (form) form.reset();
  document.getElementById('assign-movie').value = selectedMovie;
  document.getElementById('assign-actor-id').value = '';
  document.getElementById('assign-actor-title').textContent = 'Assign Actor to Movie';
  document.getElementById('assign-actor-submit').textContent = 'Assign Actor';
  document.getElementById('assign-actor-cancel').style.display = 'none';
}

function setupActorForm() {
  const form = document.getElementById('actor-form');
  if (!form) return;
  document.getElementById('actor-birth-date').max = new Date().toISOString().slice(0, 10);
  document.getElementById('actor-cancel').addEventListener('click', resetActorForm);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('actor-id').value;
    const data = {
      name: document.getElementById('actor-name').value.trim(),
      biography: document.getElementById('actor-biography').value.trim(),
      birth_date: document.getElementById('actor-birth-date').value || null,
      photo_url: document.getElementById('actor-photo-url').value.trim() || null,
    };

    try {
      if (id) {
        await updateActor(id, data);
        showToast('Actor actualizado', 'success');
      } else {
        await createActor(data);
        showToast('Actor creado', 'success');
      }
      resetActorForm();
      await loadAdminData();
    } catch (error) {
      showToast(error.message || 'No se pudo guardar el actor', 'error');
    }
  });
}

function renderActors() {
  const tbody = document.getElementById('actors-tbody');
  if (!tbody) return;
  if (!actorsList.length) {
    tbody.innerHTML = '<tr><td colspan="4">No hay actores registrados.</td></tr>';
    return;
  }
  tbody.innerHTML = actorsList.map(actor => `
    <tr>
      <td>${escapeHTML(actor.name)}</td>
      <td>${escapeHTML(actor.biography)}</td>
      <td>${escapeHTML(actor.birth_date ? toDateInputValue(actor.birth_date) : '—')}</td>
      <td><div class="admin-table__actions">
        <button class="btn btn--sm btn--ghost" data-actor-movies="${actor.id}">Movies</button>
        <button class="btn btn--sm btn--ghost" data-actor-edit="${actor.id}">Edit</button>
        <button class="btn btn--sm btn--danger" data-actor-delete="${actor.id}">Delete</button>
      </div></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-actor-movies]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const movies = await getActorMovies(button.dataset.actorMovies);
        const actor = actorsList.find(item => String(item.id) === button.dataset.actorMovies);
        document.getElementById('actor-filmography-title').textContent =
          `${actor?.name || 'Actor'} filmography`;
        const list = document.getElementById('actor-filmography-list');
        list.innerHTML = movies.length
          ? movies.map(item => `<li>${escapeHTML(item.movie?.title || 'Untitled movie')} — ${escapeHTML(item.character_name || 'Role not specified')}</li>`).join('')
          : '<li>No movie assignments found.</li>';
        document.getElementById('actor-filmography').hidden = false;
        document.getElementById('actor-filmography').scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        showToast(error.message || 'No se pudo cargar la filmografia', 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-actor-edit]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const actor = await getActorById(button.dataset.actorEdit);
        document.getElementById('actor-id').value = actor.id;
        document.getElementById('actor-name').value = actor.name || '';
        document.getElementById('actor-biography').value = actor.biography || '';
        document.getElementById('actor-birth-date').value = toDateInputValue(actor.birth_date);
        document.getElementById('actor-photo-url').value = actor.photo_url || '';
        document.getElementById('actor-form-title').textContent = 'Edit Actor';
        document.getElementById('actor-submit').textContent = 'Save Actor';
        document.getElementById('actor-cancel').style.display = '';
        document.getElementById('actor-form').scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        showToast(error.message || 'No se pudo cargar el actor', 'error');
      }
    });
  });
  tbody.querySelectorAll('[data-actor-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this actor?')) return;
      try {
        await deleteActor(button.dataset.actorDelete);
        showToast('Actor eliminado', 'success');
        await loadAdminData();
      } catch (error) {
        showToast(error.message || 'No se pudo eliminar el actor', 'error');
      }
    });
  });
}

function resetActorForm() {
  document.getElementById('actor-form').reset();
  document.getElementById('actor-id').value = '';
  document.getElementById('actor-form-title').textContent = 'Create Actor';
  document.getElementById('actor-submit').textContent = 'Create Actor';
  document.getElementById('actor-cancel').style.display = 'none';
}

function setupDirectorForm() {
  const form = document.getElementById('director-form');
  if (!form) return;
  document.getElementById('director-cancel').addEventListener('click', resetDirectorForm);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('director-id').value;
    const data = {
      name: document.getElementById('director-name').value.trim(),
    };

    try {
      if (id) {
        await updateDirector(id, data);
        showToast('Director actualizado', 'success');
      } else {
        await createDirector(data);
        showToast('Director creado', 'success');
      }
      resetDirectorForm();
      await loadAdminData();
    } catch (error) {
      showToast(error.message || 'No se pudo guardar el director', 'error');
    }
  });
}

function renderDirectors() {
  const tbody = document.getElementById('directors-tbody');
  if (!tbody) return;
  if (!directorsList.length) {
    tbody.innerHTML = '<tr><td colspan="2">No hay directores registrados.</td></tr>';
    return;
  }

  tbody.innerHTML = directorsList.map(director => `
    <tr>
      <td>${escapeHTML(director.name)}</td>
      <td><div class="admin-table__actions">
        <button class="btn btn--sm btn--ghost" data-director-movies="${director.id}">Movies</button>
        <button class="btn btn--sm btn--ghost" data-director-edit="${director.id}">Edit</button>
        <button class="btn btn--sm btn--danger" data-director-delete="${director.id}">Delete</button>
      </div></td>
    </tr>
  `).join('');

  tbody.querySelectorAll('[data-director-movies]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const director = await getDirectorById(button.dataset.directorMovies, { includeMovies: true });
        document.getElementById('director-filmography-title').textContent =
          `${director.name} filmography`;
        const list = document.getElementById('director-filmography-list');
        list.innerHTML = director.movies?.length
          ? director.movies.map(movie => `<li>${escapeHTML(movie.title)} (${escapeHTML(movie.release_year)}) · ${escapeHTML(movie.status)}</li>`).join('')
          : '<li>No movie assignments found.</li>';
        document.getElementById('director-filmography').hidden = false;
        document.getElementById('director-filmography').scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        showToast(error.message || 'No se pudo cargar la filmografia', 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-director-edit]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const director = await getDirectorById(button.dataset.directorEdit);
        document.getElementById('director-id').value = director.id;
        document.getElementById('director-name').value = director.name || '';
        document.getElementById('director-form-title').textContent = 'Edit Director';
        document.getElementById('director-submit').textContent = 'Save Director';
        document.getElementById('director-cancel').style.display = '';
        document.getElementById('director-form').scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        showToast(error.message || 'No se pudo cargar el director', 'error');
      }
    });
  });

  tbody.querySelectorAll('[data-director-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this director? Directors with assigned movies cannot be deleted.')) return;
      try {
        await deleteDirector(button.dataset.directorDelete);
        showToast('Director eliminado', 'success');
        await loadAdminData();
      } catch (error) {
        showToast(error.message || 'No se pudo eliminar el director', 'error');
      }
    });
  });
}

function resetDirectorForm() {
  document.getElementById('director-form').reset();
  document.getElementById('director-id').value = '';
  document.getElementById('director-form-title').textContent = 'Create Director';
  document.getElementById('director-submit').textContent = 'Create Director';
  document.getElementById('director-cancel').style.display = 'none';
}

function setupCategoryForm() {
  const form = document.getElementById('category-form');
  if (!form) return;
  document.getElementById('category-cancel').addEventListener('click', resetCategoryForm);

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('category-id').value;
    const data = {
      name: document.getElementById('category-name').value.trim(),
      description: document.getElementById('category-description').value.trim(),
    };
    try {
      if (id) {
        await updateCategory(id, data);
        showToast('Categoria actualizada', 'success');
      } else {
        await createCategory(data);
        showToast('Categoria creada', 'success');
      }
      resetCategoryForm();
      await loadAdminData();
    } catch (error) {
      showToast(error.message || 'No se pudo guardar la categoria', 'error');
    }
  });
}

function renderCategories() {
  const tbody = document.getElementById('categories-tbody');
  if (!tbody) return;
  if (!categoriesList.length) {
    tbody.innerHTML = '<tr><td colspan="3">No hay categorias registradas.</td></tr>';
    return;
  }
  tbody.innerHTML = categoriesList.map(category => `
    <tr>
      <td>${escapeHTML(category.name)}</td>
      <td>${escapeHTML(category.description)}</td>
      <td><div class="admin-table__actions">
        <button class="btn btn--sm btn--ghost" data-category-edit="${category.id}">Edit</button>
        <button class="btn btn--sm btn--danger" data-category-delete="${category.id}">Delete</button>
      </div></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-category-edit]').forEach(button => {
    button.addEventListener('click', async () => {
      try {
        const category = await getCategoryById(button.dataset.categoryEdit);
        document.getElementById('category-id').value = category.id;
        document.getElementById('category-name').value = category.name || '';
        document.getElementById('category-description').value = category.description || '';
        document.getElementById('category-form-title').textContent = 'Edit Category';
        document.getElementById('category-submit').textContent = 'Save Category';
        document.getElementById('category-cancel').style.display = '';
        document.getElementById('category-form').scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        showToast(error.message || 'No se pudo cargar la categoria', 'error');
      }
    });
  });
  tbody.querySelectorAll('[data-category-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this category?')) return;
      try {
        await deleteCategory(button.dataset.categoryDelete);
        showToast('Categoria eliminada', 'success');
        await loadAdminData();
      } catch (error) {
        showToast(error.message || 'No se pudo eliminar la categoria', 'error');
      }
    });
  });
}

function resetCategoryForm() {
  document.getElementById('category-form').reset();
  document.getElementById('category-id').value = '';
  document.getElementById('category-form-title').textContent = 'Create Category';
  document.getElementById('category-submit').textContent = 'Create Category';
  document.getElementById('category-cancel').style.display = 'none';
}

function setupUserForm() {
  const form = document.getElementById('user-form');
  if (!form) return;
  document.getElementById('user-cancel').addEventListener('click', resetUserForm);
  form.addEventListener('submit', async event => {
    event.preventDefault();
    const id = document.getElementById('user-id').value;
    const data = {
      username: document.getElementById('user-username').value.trim(),
      email: document.getElementById('user-email').value.trim(),
    };
    const password = document.getElementById('user-password').value;
    if (password) data.password = password;
    try {
      const updatedUser = await updateUser(id, data);
      const currentUser = getUser();
      if (currentUser && String(currentUser.id) === String(id)) {
        setSession({ user: updatedUser, jwt: getToken() });
      }
      showToast('Usuario actualizado', 'success');
      resetUserForm();
      await loadAdminData();
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar el usuario', 'error');
    }
  });
}

function setupRoleDialog() {
  const dialog = document.getElementById('role-confirm-dialog');
  const form = document.getElementById('role-confirm-form');
  if (!dialog || !form) return;

  document.getElementById('role-confirm-cancel').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    form.reset();
    document.getElementById('role-user-id').value = '';
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const userId = document.getElementById('role-user-id').value;
    const submitButton = document.getElementById('role-confirm-submit');
    submitButton.disabled = true;

    try {
      await updateUserRole(userId, {
        role: document.getElementById('role-select').value,
        admin_password: document.getElementById('role-admin-password').value,
      });
      dialog.close();
      showToast('Rol actualizado', 'success');
      await loadAdminData();
    } catch (error) {
      showToast(error.message || 'No se pudo actualizar el rol', 'error');
    } finally {
      document.getElementById('role-admin-password').value = '';
      submitButton.disabled = false;
    }
  });
}

function renderUsers() {
  const tbody = document.getElementById('users-tbody');
  if (!tbody) return;
  if (!usersList.length) {
    tbody.innerHTML = '<tr><td colspan="4">No hay usuarios registrados.</td></tr>';
    return;
  }
  tbody.innerHTML = usersList.map(user => `
    <tr>
      <td>${escapeHTML(user.username)}</td>
      <td>${escapeHTML(user.email)}</td>
      <td>${escapeHTML(user.role)}</td>
      <td><div class="admin-table__actions">
        <button class="btn btn--sm btn--ghost" data-user-edit="${user.id}">Edit</button>
        ${String(getUser()?.id) === String(user.id) ? '' : `<button class="btn btn--sm btn--ghost" data-user-role="${user.id}">Change role</button><button class="btn btn--sm btn--danger" data-user-delete="${user.id}">Delete</button>`}
      </div></td>
    </tr>
  `).join('');
  tbody.querySelectorAll('[data-user-edit]').forEach(button => {
    button.addEventListener('click', () => {
      const user = usersList.find(item => String(item.id) === button.dataset.userEdit);
      if (!user) return;
      document.getElementById('user-id').value = user.id;
      document.getElementById('user-username').value = user.username || '';
      document.getElementById('user-email').value = user.email || '';
      document.getElementById('user-password').value = '';
      document.getElementById('user-form-title').textContent = `Edit ${user.username}`;
      document.getElementById('user-form').scrollIntoView({ behavior: 'smooth' });
    });
  });
  tbody.querySelectorAll('[data-user-role]').forEach(button => {
    button.addEventListener('click', () => {
      const user = usersList.find(item => String(item.id) === button.dataset.userRole);
      if (!user) return;
      document.getElementById('role-user-id').value = user.id;
      document.getElementById('role-confirm-user').textContent = user.username;
      document.getElementById('role-select').value = user.role;
      document.getElementById('role-admin-password').value = '';
      document.getElementById('role-confirm-dialog').showModal();
    });
  });
  tbody.querySelectorAll('[data-user-delete]').forEach(button => {
    button.addEventListener('click', async () => {
      if (!confirm('Delete this user account? This cannot be undone.')) return;
      try {
        await deleteUser(button.dataset.userDelete);
        showToast('Usuario eliminado', 'success');
        await loadAdminData();
      } catch (error) {
        showToast(error.message || 'No se pudo eliminar el usuario', 'error');
      }
    });
  });
}

function resetUserForm() {
  document.getElementById('user-form').reset();
  document.getElementById('user-id').value = '';
  document.getElementById('user-form-title').textContent = 'Update User';
}

function escapeHTML(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toDateInputValue(value) {
  if (!value) return '';
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    const year = value.getFullYear();
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(value).slice(0, 10);
}
