import { deleteProfile, getProfile, updateProfile } from '../api/auth.api.js';
import { renderNavbar } from '../components/navbar.js';
import { clearSession, getToken, isLoggedIn, setSession } from '../utils/authStorage.js';
import { showToast } from '../utils/notify.js';
import { getHomeUrl, getPageUrl } from '../utils/pageRoutes.js';

export async function initProfilePage() {
  renderNavbar('profile');
  if (!isLoggedIn()) {
    window.location.href = getPageUrl('login.html');
    return;
  }

  const form = document.getElementById('profile-form');
  const deleteButton = document.getElementById('delete-account-btn');
  try {
    const profile = await getProfile();
    document.getElementById('profile-username').value = profile.username || '';
    document.getElementById('profile-email').value = profile.email || '';
    document.getElementById('profile-role').textContent = `Account type: ${profile.role || 'user'}`;
  } catch (error) {
    showToast(error.message || 'Could not load your profile', 'error');
    return;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    const data = {
      username: document.getElementById('profile-username').value.trim(),
      email: document.getElementById('profile-email').value.trim(),
    };
    const password = document.getElementById('profile-password').value;
    if (password) data.password = password;

    try {
      const updatedProfile = await updateProfile(data);
      setSession({
        user: { ...updatedProfile, role: updatedProfile.role || 'user' },
        jwt: getToken(),
      });
      form.reset();
      document.getElementById('profile-username').value = updatedProfile.username || data.username;
      document.getElementById('profile-email').value = updatedProfile.email || data.email;
      showToast('Profile updated', 'success');
    } catch (error) {
      showToast(error.message || 'Could not update your profile', 'error');
    }
  });

  deleteButton.addEventListener('click', async () => {
    if (!confirm('Delete your account permanently? This action cannot be undone.')) return;
    deleteButton.disabled = true;
    try {
      await deleteProfile();
      clearSession();
      showToast('Account deleted', 'success');
      setTimeout(() => { window.location.href = getHomeUrl(); }, 600);
    } catch (error) {
      showToast(error.message || 'Could not delete your account', 'error');
      deleteButton.disabled = false;
    }
  });
}
