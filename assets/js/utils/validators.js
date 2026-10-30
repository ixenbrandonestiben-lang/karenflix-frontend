// Validadores de formularios
export function validateEmail(email) {
  if (!email || !email.trim()) {
    return { valid: false, message: 'El correo es obligatorio' };
  }
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!re.test(email.trim())) {
    return { valid: false, message: 'Ingresa un correo electronico valido' };
  }
  return { valid: true, message: '' };
}

export function validatePassword(password) {
  if (!password) {
    return { valid: false, message: 'La contrasena es obligatoria' };
  }
  if (password.length < 6) {
    return { valid: false, message: 'La contrasena debe tener al menos 6 caracteres' };
  }
  return { valid: true, message: '' };
}

export function validateRequired(value, fieldName) {
  if (!value || (typeof value === 'string' && !value.trim())) {
    return { valid: false, message: `${fieldName} es obligatorio` };
  }
  return { valid: true, message: '' };
}

export function validateRating(rating) {
  const num = Number(rating);
  if (isNaN(num) || num < 1 || num > 10) {
    return { valid: false, message: 'La calificacion debe ser entre 1 y 10' };
  }
  return { valid: true, message: '' };
}

export function showFieldError(inputEl, message) {
  clearFieldError(inputEl);
  inputEl.classList.add('input--error');
  const errorEl = document.createElement('span');
  errorEl.className = 'field-error';
  errorEl.textContent = message;
  inputEl.parentNode.insertBefore(errorEl, inputEl.nextSibling);
}

export function clearFieldError(inputEl) {
  inputEl.classList.remove('input--error');
  const existing = inputEl.parentNode.querySelector('.field-error');
  if (existing) existing.remove();
}
