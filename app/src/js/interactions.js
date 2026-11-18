// Eco Nojin — reusable UI interaction helpers.
// Keeps DOM wiring out of the shell controller (app.js) so the same behaviours
// (dropdown menus, segmented switches) can be reused by future modules.

const dropdowns = new Set();

// Wire a button that toggles a panel. Only one dropdown stays open at a time.
export function setupDropdown(btn, panel) {
  if (!btn || !panel) return null;
  const api = {
    open: false,
    setOpen(open) {
      api.open = open;
      panel.hidden = !open;
      btn.setAttribute('aria-expanded', String(open));
    },
  };
  dropdowns.add(api);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const willOpen = panel.hidden;
    closeAllDropdowns();
    api.setOpen(willOpen);
  });
  panel.addEventListener('click', (e) => e.stopPropagation());
  return api;
}

export function closeAllDropdowns() {
  for (const d of dropdowns) d.setOpen(false);
}

// Wire a group of segmented buttons (e.g. theme A/B, language fa/en).
export function wireSegmented(root, attr, onPick) {
  root.querySelectorAll(`[${attr}]`).forEach((btn) => {
    btn.addEventListener('click', () => onPick(btn.getAttribute(attr)));
  });
}