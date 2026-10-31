// Barra de navegacion principal
import { isLoggedIn, getUser, isAdmin, clearSession } from '../utils/authStorage.js';
import { logout } from '../api/auth.api.js';
import { showToast } from '../utils/notify.js';
import { initTheme, getTheme, toggleTheme } from '../utils/theme.js';
import { getHomeUrl, getPageUrl } from '../utils/pageRoutes.js';

export function renderNavbar(activePage) {
  initTheme();

  const container = document.getElementById('navbar');
  if (!container) return;

  const loggedIn = isLoggedIn();
  const user = loggedIn ? getUser() : null;
  const admin = isAdmin();
  const currentTheme = getTheme();
  const themeIcon = currentTheme === 'light' ? '☀️' : '🌙';

  const linkClass = (page) =>
    `navbar__link${activePage === page ? ' navbar__link--active' : ''}`;

  const mobileLinkClass = (page) =>
    `navbar__mobile-link${activePage === page ? ' navbar__mobile-link--active' : ''}`;

  let actionsHTML = '';
  if (loggedIn && user) {
    const initial = (user.username || user.email || '?').charAt(0).toUpperCase();
    actionsHTML = `
      <div class="navbar__avatar-wrapper dropdown">
        <div class="dropdown__trigger" id="avatar-trigger">
          <div class="navbar__avatar" style="background:var(--color-accent-gradient);display:flex;align-items:center;justify-content:center;color:#ffffff;font-weight:800;font-size:14px;box-shadow:0 0 10px rgba(229,9,20,0.4);">
            ${initial}
          </div>
        </div>
        <div class="dropdown__menu" id="user-dropdown">
          <div class="dropdown__header">
            <div class="dropdown__header-name">${user.username || 'User'}</div>
            <div class="dropdown__header-email">${user.email || ''}</div>
          </div>
          <div class="dropdown__divider"></div>
          <a class="dropdown__item" href="${getPageUrl('profile.html')}">My Profile</a>
          <button class="dropdown__item dropdown__item--danger" id="logout-btn">
            <span class="dropdown__item-icon">🚪</span> Sign Out
          </button>
        </div>
      </div>`;
  } else {
    actionsHTML = `<a href="${getPageUrl('login.html')}" class="btn btn--sm btn--primary">Sign In</a>`;
  }

  const adminLinkDesktop = admin
    ? `<a href="${getPageUrl('admin.html')}" class="${linkClass('admin')}">Admin</a>`
    : '';
  const adminLinkMobile = admin
    ? `<a href="${getPageUrl('admin.html')}" class="${mobileLinkClass('admin')}">Admin</a>`
    : '';

  container.innerHTML = `
    <nav class="navbar" id="main-navbar">
      <div class="navbar__inner">
        <a href="${getHomeUrl()}" class="navbar__logo">KARENFLIX</a>
        <div class="navbar__nav">
          <a href="${getHomeUrl()}" class="${linkClass('home')}">Home</a>
          <a href="${getPageUrl('movies.html')}" class="${linkClass('movies')}">Movies</a>
          <a href="${getPageUrl('mylist.html')}" class="${linkClass('mylist')}">My List</a>
          ${adminLinkDesktop}
        </div>
        <div class="navbar__search" id="navbar-search">
          <button class="navbar__search-btn" id="search-toggle" aria-label="Search">🔍</button>
          <input type="text" class="navbar__search-input" id="navbar-search-input" placeholder="Search titles...">
        </div>
        <div class="navbar__actions">
          <button class="theme-toggle" id="theme-toggle" title="Cambiar tema" aria-label="Toggle theme">
            ${themeIcon}
          </button>
          ${actionsHTML}
        </div>
        <button class="navbar__hamburger" id="hamburger-btn" aria-label="Toggle mobile menu">
          <span class="navbar__hamburger-line"></span>
          <span class="navbar__hamburger-line"></span>
          <span class="navbar__hamburger-line"></span>
        </button>
      </div>
    </nav>
    <div class="navbar__mobile-menu" id="mobile-menu">
      <a href="${getHomeUrl()}" class="${mobileLinkClass('home')}">Home</a>
      <a href="${getPageUrl('movies.html')}" class="${mobileLinkClass('movies')}">Movies</a>
      <a href="${getPageUrl('mylist.html')}" class="${mobileLinkClass('mylist')}">My List</a>
      ${loggedIn ? `<a href="${getPageUrl('profile.html')}" class="${mobileLinkClass('profile')}">My Profile</a>` : ''}
      ${adminLinkMobile}
      <button class="navbar__mobile-link" id="mobile-theme-toggle">
        Cambiar Tema: ${themeIcon}
      </button>
      ${loggedIn
        ? `<button class="navbar__mobile-link navbar__mobile-link--danger" id="mobile-logout-btn">Sign Out</button>`
        : `<a href="${getPageUrl('login.html')}" class="navbar__mobile-link">Sign In</a>`
      }
    </div>`;

  setupScrollListener();
  setupSearchToggle();
  setupDropdown();
  setupLogout();
  setupHamburger();
  setupSearchSubmit();
  setupThemeToggle();
}

// Fondo opaco al hacer scroll
function setupScrollListener() {
  const navbar = document.getElementById('main-navbar');
  if (!navbar) return;

  const onScroll = () => {
    if (window.scrollY > 50) {
      navbar.classList.add('navbar--scrolled');
    } else {
      navbar.classList.remove('navbar--scrolled');
    }
  };

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// Desplegar buscador
function setupSearchToggle() {
  const toggleBtn = document.getElementById('search-toggle');
  const searchWrapper = document.getElementById('navbar-search');
  if (!toggleBtn || !searchWrapper) return;

  toggleBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    searchWrapper.classList.toggle('navbar__search--open');
    if (searchWrapper.classList.contains('navbar__search--open')) {
      const input = document.getElementById('navbar-search-input');
      if (input) input.focus();
    }
  });
}

// Buscar al presionar Enter
function setupSearchSubmit() {
  const input = document.getElementById('navbar-search-input');
  if (!input) return;

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      const query = input.value.trim();
      if (query) {
        window.location.href = `${getPageUrl('movies.html')}?search=${encodeURIComponent(query)}`;
      }
    }
  });
}

// Dropdown de perfil
function setupDropdown() {
  const trigger = document.getElementById('avatar-trigger');
  const menu = document.getElementById('user-dropdown');
  if (!trigger || !menu) return;

  trigger.addEventListener('click', (e) => {
    e.stopPropagation();
    menu.classList.toggle('dropdown__menu--open');
  });

  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target) && !trigger.contains(e.target)) {
      menu.classList.remove('dropdown__menu--open');
    }
  });
}

// Cerrar sesion
function setupLogout() {
  const logoutBtn = document.getElementById('logout-btn');
  const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

  const handleLogout = async () => {
    let logoutError = null;
    try {
      await logout();
    } catch (error) {
      logoutError = error;
    }

    clearSession();
    if (logoutError) {
      showToast(`Sesion cerrada localmente; no se pudo notificar al servidor: ${logoutError.message}`, 'warning');
    } else {
      showToast('Sesion cerrada correctamente', 'success');
    }
    setTimeout(() => {
      window.location.href = getHomeUrl();
    }, 600);
  };

  if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
  if (mobileLogoutBtn) mobileLogoutBtn.addEventListener('click', handleLogout);
}

// Menu hamburguesa movil
function setupHamburger() {
  const hamburger = document.getElementById('hamburger-btn');
  const mobileMenu = document.getElementById('mobile-menu');
  if (!hamburger || !mobileMenu) return;

  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('navbar__hamburger--active');
    mobileMenu.classList.toggle('navbar__mobile-menu--open');
  });
}

// Alternar entre modo dia y noche
function setupThemeToggle() {
  const toggleBtn = document.getElementById('theme-toggle');
  const mobileToggleBtn = document.getElementById('mobile-theme-toggle');

  const handleToggle = () => {
    const newTheme = toggleTheme();
    const isLight = newTheme === 'light';
    const icon = isLight ? '☀️' : '🌙';

    if (toggleBtn) toggleBtn.textContent = icon;
    if (mobileToggleBtn) mobileToggleBtn.textContent = `Cambiar Tema: ${icon}`;

    showToast(isLight ? 'Modo Dia activado ☀️' : 'Modo Noche activado 🌙', 'info', 1800);
  };

  if (toggleBtn) toggleBtn.addEventListener('click', handleToggle);
  if (mobileToggleBtn) mobileToggleBtn.addEventListener('click', handleToggle);
}
