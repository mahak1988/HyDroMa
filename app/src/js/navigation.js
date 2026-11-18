// Eco Nojin — application shell navigation model.
// Single source of truth for the shell menu and routes. HyDroMA and Marketplace
// are groups so each product can grow its own children without touching the shell.
//
// status:
//   'ready'  -> implemented page (has a real renderer)
//   'planned'-> not implemented yet (renders an explicit placeholder, no fake UI)
// labelKey -> key in app-i18n.js

export const NAV = [
  { type: 'item', id: 'dashboard', labelKey: 'nav.dashboard', icon: 'grid', route: '#/dashboard', status: 'ready' },
  {
    type: 'group',
    id: 'hydroma',
    labelKey: 'nav.hydroma',
    icon: 'flask',
    children: [
      { id: 'overview', labelKey: 'nav.hydromaOverview', icon: 'grid', route: '#/hydroma', status: 'ready' },
      { id: 'water', labelKey: 'nav.water', icon: 'water', route: '#/hydroma/water', status: 'ready' },
      { id: 'soil', labelKey: 'nav.soil', icon: 'layers', route: '#/hydroma/soil', status: 'planned' },
      { id: 'agriculture', labelKey: 'nav.agriculture', icon: 'leaf', route: '#/hydroma/agriculture', status: 'planned' },
      { id: 'climate', labelKey: 'nav.climate', icon: 'cloud', route: '#/hydroma/climate', status: 'planned' },
      { id: 'remoteSensing', labelKey: 'nav.remoteSensing', icon: 'satellite', route: '#/hydroma/remote-sensing', status: 'planned' },
      { id: 'modeling', labelKey: 'nav.modeling', icon: 'cpu', route: '#/hydroma/modeling', status: 'planned' },
      { id: 'monitoring', labelKey: 'nav.monitoring', icon: 'activity', route: '#/hydroma/monitoring', status: 'planned' },
    ],
  },
  {
    type: 'group',
    id: 'marketplace',
    labelKey: 'nav.marketplace',
    icon: 'store',
    children: [
      { id: 'market', labelKey: 'nav.market', icon: 'store', route: '#/marketplace', status: 'planned' },
      { id: 'tourism', labelKey: 'nav.tourism', icon: 'compass', route: '#/marketplace/tourism', status: 'planned' },
    ],
  },
  { type: 'item', id: 'settings', labelKey: 'nav.settings', icon: 'settings', route: '#/settings', status: 'planned' },
];

export const DEFAULT_ROUTE = '#/dashboard';

// flat lookup: route -> { item, group }
const ROUTE_MAP = new Map();
for (const node of NAV) {
  if (node.type === 'item') {
    ROUTE_MAP.set(node.route, { item: node, group: null });
  } else {
    for (const child of node.children) {
      ROUTE_MAP.set(child.route, { item: child, group: node });
    }
    // group id resolves to its first child for deep links like #/hydroma
    if (!ROUTE_MAP.has(`#/${node.id}`)) {
      ROUTE_MAP.set(`#/${node.id}`, { item: node.children[0], group: node, groupLanding: node });
    }
  }
}

export function normalizeRoute(hash) {
  if (!hash || hash === '#' || hash === '#/') return DEFAULT_ROUTE;
  return hash.startsWith('#/') ? hash : `#/${hash.replace(/^#/, '')}`;
}

export function resolveRoute(hash) {
  const route = normalizeRoute(hash);
  if (ROUTE_MAP.has(route)) return { route, ...ROUTE_MAP.get(route) };
  return { route: DEFAULT_ROUTE, ...ROUTE_MAP.get(DEFAULT_ROUTE) };
}

export function stats() {
  let active = 0;
  let planned = 0;
  const walk = (nodes) => {
    for (const n of nodes) {
      if (n.children) {
        walk(n.children);
      } else if (n.status === 'ready') {
        active += 1;
      } else if (n.status === 'planned') {
        planned += 1;
      }
    }
  };
  walk(NAV);
  return { active, planned };
}

export const ICONS = {
  grid: '<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>',
  flask: '<path d="M9 3h6M10 3v5l-5 9a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 17l-5-9V3"/><path d="M7.5 14h9"/>',
  water: '<path d="M12 3c3.5 4 6 7 6 10a6 6 0 0 1-12 0c0-3 2.5-6 6-10Z"/>',
  layers: '<path d="M12 3 3 8l9 5 9-5-9-5Z"/><path d="M3 12l9 5 9-5"/><path d="M3 16l9 5 9-5"/>',
  leaf: '<path d="M4 20c0-8 6-14 16-14 0 10-6 14-14 14H4Z"/><path d="M4 20c4-4 7-6 12-8"/>',
  cloud: '<path d="M7 18a4 4 0 0 1 0-8 5 5 0 0 1 9.6-1.3A3.5 3.5 0 0 1 18 18H7Z"/>',
  satellite: '<path d="M4 12a8 8 0 0 1 8 8"/><path d="M4 8a12 12 0 0 1 12 12"/><circle cx="5" cy="19" r="1.6"/><path d="M13 5l6 6-3 3-6-6 3-3Z"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2"/>',
  activity: '<path d="M3 12h4l2-6 4 12 2-6h6"/>',
  store: '<path d="M4 9l1.5-5h13L20 9"/><path d="M5 9v11h14V9"/><path d="M9 20v-6h6v6"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5 5-2Z"/>',
  settings: '<circle cx="12" cy="12" r="3.2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M19.1 4.9L17 7M7 17l-2.1 2.1"/>',
  bell: '<path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z"/><path d="M10 20a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  close: '<path d="M6 6l12 12M18 6L6 18"/>',
  chevron: '<path d="M9 6l6 6-6 6"/>',
  arrowLeft: '<path d="M15 6l-6 6 6 6"/>',
  arrowRight: '<path d="M9 6l6 6-6 6"/>',
};

export function icon(name) {
  const body = ICONS[name] || ICONS.grid;
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}