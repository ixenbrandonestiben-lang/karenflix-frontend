// Inicio de sesion y registro con JWT
import { login, register } from '../api/auth.api.js';
import { setSession } from '../utils/authStorage.js';
import { showToast } from '../utils/notify.js';
import { validateEmail, validatePassword, validateRequired } from '../utils/validators.js';
import { getHomeUrl, getPageUrl } from '../utils/pageRoutes.js';
import { initTheme } from '../utils/theme.js';

function setFieldError(inputEl, errorEl, message) {
  if (inputEl) inputEl.classList.add('form__input--error');
  if (errorEl) errorEl.textContent = message;
}

function clearFieldErrors(form) {
  const inputs = form.querySelectorAll('.form__input');
  inputs.forEach(i => i.classList.remove('form__input--error'));
  const errors = form.querySelectorAll('.form__error');
  errors.forEach(e => { e.textContent = ''; });
}

function saveAuthenticatedSession(response) {
  const payload = response?.data ?? response;
  const user = payload?.user ?? (typeof payload?.username === 'string' ? payload : null);
  const jwt = payload?.jwt ?? payload?.token ?? response?.jwt ?? response?.token;

  if (!user || typeof jwt !== 'string' || !jwt) {
    throw new Error('El servidor devolvió una respuesta de inicio de sesión inválida.');
  }

  setSession({ user, jwt });
  return user;
}

export function initLoginPage() {
  initTheme();
  const form = document.getElementById('login-form');
  if (!form) return;

  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const emailError = document.getElementById('login-email-error');
  const passwordError = document.getElementById('login-password-error');

  [emailInput, passwordInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      input.classList.remove('form__input--error');
      const err = document.getElementById(`${input.id}-error`);
      if (err) err.textContent = '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const emailOrUser = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    let isValid = true;

    const emailReq = validateRequired(emailOrUser, 'Email o Usuario');
    if (!emailReq.valid) {
      setFieldError(emailInput, emailError, emailReq.message);
      isValid = false;
    }

    const passReq = validatePassword(password);
    if (!passReq.valid) {
      setFieldError(passwordInput, passwordError, passReq.message);
      isValid = false;
    }

    if (!isValid) return;

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.classList.add('btn--loading');

      const emailValidation = validateEmail(emailOrUser);
      const credentials = emailValidation.valid
        ? { email: emailOrUser }
        : { username: emailOrUser };
      const response = await login({
        ...credentials,
        password: password,
      });

      const user = saveAuthenticatedSession(response);

      showToast(`Bienvenido de nuevo, ${user.username || user.email || emailOrUser}!`, 'success');

      setTimeout(() => {
        window.location.href = user.role === 'admin' ? getPageUrl('admin.html') : getHomeUrl();
      }, 500);
    } catch (err) {
      showToast(err.message || 'Error al iniciar sesion. Verifica tus datos.', 'error');
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.classList.remove('btn--loading');
    }
  });
}

export function initRegisterPage() {
  initTheme();
  const form = document.getElementById('register-form');
  if (!form) return;

  const usernameInput = document.getElementById('reg-username');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const confirmInput = document.getElementById('reg-confirm');

  const usernameError = document.getElementById('reg-username-error');
  const emailError = document.getElementById('reg-email-error');
  const passwordError = document.getElementById('reg-password-error');
  const confirmError = document.getElementById('reg-confirm-error');

  [usernameInput, emailInput, passwordInput, confirmInput].forEach(input => {
    if (!input) return;
    input.addEventListener('input', () => {
      input.classList.remove('form__input--error');
      const err = document.getElementById(`${input.id}-error`);
      if (err) err.textContent = '';
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearFieldErrors(form);

    const username = usernameInput ? usernameInput.value.trim() : '';
    const email = emailInput ? emailInput.value.trim() : '';
    const password = passwordInput ? passwordInput.value : '';
    const confirm = confirmInput ? confirmInput.value : '';
    let isValid = true;

    const userReq = validateRequired(username, 'Usuario');
    if (!userReq.valid) {
      setFieldError(usernameInput, usernameError, userReq.message);
      isValid = false;
    }

    const emailVal = validateEmail(email);
    if (!emailVal.valid) {
      setFieldError(emailInput, emailError, emailVal.message);
      isValid = false;
    }

    const passVal = validatePassword(password);
    if (!passVal.valid) {
      setFieldError(passwordInput, passwordError, passVal.message);
      isValid = false;
    }

    if (password !== confirm) {
      setFieldError(confirmInput, confirmError, 'Las contrasenas no coinciden');
      isValid = false;
    }

    if (!isValid) return;

    try {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.classList.add('btn--loading');

      await register({
        username,
        email,
        password,
      });

      const loginResponse = await login({ email, password });
      saveAuthenticatedSession(loginResponse);

      showToast('Cuenta creada con exito!', 'success');

      setTimeout(() => {
        window.location.href = getHomeUrl();
      }, 500);
    } catch (err) {
      showToast(err.message || 'Error al registrar cuenta.', 'error');
    } finally {
      const submitBtn = form.querySelector('button[type="submit"]');
      if (submitBtn) submitBtn.classList.remove('btn--loading');
    }
  });
}
