// Manages JWT token and user data in localStorage
// Exports: getToken(), setSession(data), clearSession(), getUser(), isAdmin(), isLoggedIn()

export function getToken() { return localStorage.getItem('kf_token'); }

export function setSession({ user, jwt }) {
  localStorage.setItem('kf_token', jwt);
  localStorage.setItem('kf_user', JSON.stringify(user));
}

export function clearSession() {
  localStorage.removeItem('kf_token');
  localStorage.removeItem('kf_user');
}

export function getUser() {
  const raw = localStorage.getItem('kf_user');
  return raw ? JSON.parse(raw) : null;
}

export function isAdmin() {
  const user = getUser();
  return user?.role === 'admin';
}

export function isLoggedIn() {
  return !!getToken();
}
