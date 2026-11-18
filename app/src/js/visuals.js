// Eco Nojin — public home-page motion & interaction module.
// Zero dependencies. GPU-friendly, and fully disabled under prefers-reduced-motion.

export function initHomeVisuals() {
  const reduce = typeof window !== 'undefined' && window.matchMedia
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;

  // ---- Hero parallax + cursor spotlight ----
  const hero = document.querySelector('.hero');
  if (hero && !reduce) {
    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = hero.getBoundingClientRect();
      const progress = Math.min(Math.max(-rect.top, 0), Math.max(rect.height, 1));
      hero.style.setProperty('--py', `${progress.toFixed(1)}px`);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();

    const fine = window.matchMedia && window.matchMedia('(pointer: fine)').matches;
    const wide = window.innerWidth > 900;
    if (fine && wide) {
      hero.addEventListener(
        'pointermove',
        (e) => {
          const rect = hero.getBoundingClientRect();
          hero.style.setProperty('--mxp', `${(e.clientX - rect.left).toFixed(0)}px`);
          hero.style.setProperty('--myp', `${(e.clientY - rect.top).toFixed(0)}px`);
        },
        { passive: true },
      );
    }
  }

  // ---- Restoration before/after (illustrative) ----
  const scene = document.querySelector('[data-restoration]');
  if (scene) {
    const buttons = Array.from(scene.querySelectorAll('[data-restore]'));
    const setState = (state) => {
      scene.classList.toggle('is-restored', state === 'after');
      buttons.forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.getAttribute('data-restore') === state));
      });
    };
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => setState(btn.getAttribute('data-restore')));
    });
    setState('before');
  }
}