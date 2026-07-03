export function getUser() {
  try { return JSON.parse(localStorage.getItem('nexa_user') || 'null'); } catch (e) { return null; }
}

export function requireAuth() {
  const user = getUser();
  if (!user?.token) {
    window.location.href = '/auth/';
    return null;
  }
  return user;
}

export function logout() {
  localStorage.removeItem('nexa_user');
  window.location.href = '/auth/';
}