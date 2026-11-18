// Eco Nojin — front-end controller.
// Wires theme + language switching, accessible mobile navigation, scroll state,
// active-section highlighting, reveal-on-scroll and back-to-top.
// No network calls, no dependencies.

import { applyLanguage, translate, LANGS, DEFAULT_LANG, isRtl } from './i18n.js';
import { initTheme, applyTheme, storeTheme, THEMES, DEFAULT_THEME } from './theme.js';
import { initHomeVisuals } from './visuals.js';

// Mark JS as active so `.reveal` elements can be hidden until observed.
// Without JS this class is never added and all content stays visible.
document.documentElement.classList.add('js');

const LANG_KEY = 'eco-nojin-lang';

function readStoredLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return LANGS.includes(v) ? v : DEFAULT_LANG;
  } catch {
    return DEFAULT_LANG;
  }
}
function storeLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, LANGS.includes(lang) ? lang : DEFAULT_LANG);
  } catch {
    /* ignore */
  }
}

const state = {
  lang: readStoredLang(),
  theme: DEFAULT_THEME,
};

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function initThemeAndLang() {
  state.theme = initTheme();
  applyLanguage(state.lang);
  document.documentElement.lang = state.lang;
  document.documentElement.dir = isRtl(state.lang) ? 'rtl' : 'ltr';
}

function setLang(lang) {
  if (!LANGS.includes(lang)) return;
  state.lang = lang;
  storeLang(lang);
  applyLanguage(lang);
  // keep the menu button label in sync with the new language + open state
  updateMenuLabel();
}

function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  state.theme = theme;
  applyTheme(theme);
  storeTheme(theme);
}

function wireTheme() {
  $$('[data-theme-set]').forEach((btn) => {
    btn.addEventListener('click', () => setTheme(btn.getAttribute('data-theme-set')));
  });
}

function wireLang() {
  $$('[data-lang-set]').forEach((btn) => {
    btn.addEventListener('click', () => setLang(btn.getAttribute('data-lang-set')));
  });
}

// ---- Mobile navigation ----
function initMenu() {
  const toggle = $('.menu-toggle');
  const nav = $('#primary-nav');
  if (!toggle || !nav) return;

  const setOpen = (open) => {
    toggle.setAttribute('aria-expanded', String(open));
    nav.classList.toggle('open', open);
    document.body.classList.toggle('nav-open', open);
    updateMenuLabel();
  };

  toggle.addEventListener('click', () => {
    setOpen(toggle.getAttribute('aria-expanded') !== 'true');
  });

  nav.addEventListener('click', (e) => {
    if (e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    }
  });
}

function updateMenuLabel() {
  const toggle = $('.menu-toggle');
  if (!toggle) return;
  const open = toggle.getAttribute('aria-expanded') === 'true';
  const key = open ? 'a11y.menuClose' : 'a11y.menuOpen';
  toggle.setAttribute('aria-label', translate(state.lang, key));
}

// ---- Header scroll state ----
function initHeaderScroll() {
  const header = $('#site-header');
  if (!header) return;
  const onScroll = () => header.classList.toggle('is-scrolled', window.scrollY > 8);
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
}

// ---- Reveal on scroll ----
function initReveal() {
  const items = $$('.reveal');
  if (!items.length) return;
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.08 },
  );
  items.forEach((el) => io.observe(el));
}

// ---- Active nav link ----
function initActiveNav() {
  const links = $$('#primary-nav a[href^="#"]');
  if (!links.length || !('IntersectionObserver' in window)) return;
  const map = new Map();
  links.forEach((a) => {
    const id = a.getAttribute('href').slice(1);
    const section = document.getElementById(id);
    if (section) map.set(section, a);
  });
  const io = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          links.forEach((l) => l.classList.remove('active'));
          const link = map.get(entry.target);
          if (link) link.classList.add('active');
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
  );
  map.forEach((_, section) => io.observe(section));
}

// ---- Back to top ----
function initBackToTop() {
  const btn = $('.back-to-top');
  if (!btn) return;
  const onScroll = () => {
    const show = window.scrollY > 600;
    btn.hidden = !show;
    btn.classList.toggle('show', show);
  };
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  btn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

function init() {
  initThemeAndLang();
  wireTheme();
  wireLang();
  initMenu();
  initHeaderScroll();
  initReveal();
  initActiveNav();
  initBackToTop();
  initHomeVisuals();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

export { setLang, setTheme };