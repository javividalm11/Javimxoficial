const PREFERENCES_KEY = 'javi.preferences.v1';
const WELCOME_KEY = 'javi.welcome.v1';
const root = document.documentElement;

try {
  const preferences = JSON.parse(localStorage.getItem(PREFERENCES_KEY) || '{}');
  root.dataset.theme = preferences.theme === 'light' ? 'light' : 'dark';
  if (!sessionStorage.getItem(WELCOME_KEY)) root.classList.add('welcome-pending');
} catch {
  root.classList.add('welcome-pending');
}
