// Eco Nojin Design System — Locale / Direction Preview
(function () {
  const locales = [
    { code: 'fa', dir: 'rtl', label: 'فارسی' },
    { code: 'en', dir: 'ltr', label: 'English' },
    { code: 'ar', dir: 'rtl', label: 'العربية' },
  ];
  function setLocale(code) {
    const loc = locales.find(l => l.code === code) || locales[0];
    document.documentElement.setAttribute('dir', loc.dir);
    document.documentElement.setAttribute('lang', loc.code);
    document.querySelectorAll('.locale-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.locale === code);
    });
  }
  function init() {
    document.querySelectorAll('.locale-btn').forEach(btn => {
      btn.addEventListener('click', () => setLocale(btn.dataset.locale));
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();