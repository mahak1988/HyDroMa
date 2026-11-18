// Eco Nojin Design System — Theme Switcher
(function () {
  const STORAGE_KEY = 'en-theme';
  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelectorAll('.theme-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.theme === theme);
    });
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }
  function init() {
    let saved = 'A';
    try { saved = localStorage.getItem(STORAGE_KEY) || 'A'; } catch (e) {}
    applyTheme(saved);
    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => applyTheme(btn.dataset.theme));
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();