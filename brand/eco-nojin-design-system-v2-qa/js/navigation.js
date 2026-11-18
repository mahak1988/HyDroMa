// Eco Nojin Design System — Navigation
(function () {
  function init() {
    // Tab switching within sections
    document.querySelectorAll('[data-tab-target]').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tabTarget;
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        document.querySelectorAll('[data-tab-target]').forEach(b => b.classList.remove('active'));
        const panel = document.getElementById(target);
        if (panel) panel.classList.add('active');
        btn.classList.add('active');
      });
    });
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(a => {
      a.addEventListener('click', (e) => {
        const id = a.getAttribute('href').slice(1);
        const el = document.getElementById(id);
        if (el) { e.preventDefault(); el.scrollIntoView({ behavior: 'smooth' }); }
      });
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();