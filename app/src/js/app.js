// Eco Nojin — application shell controller.
// Hash router + accessible sidebar + topbar (breadcrumb, theme, language,
// notifications, profile). No network, no auth, no storage of personal data.

import { NAV, resolveRoute, normalizeRoute, stats, icon } from './navigation.js';
import { messages, translate, isRtl, formatNumber } from './app-i18n.js';
import { initTheme, applyTheme, storeTheme, THEMES } from './theme.js';
import { computeWaterBalance, WATER_BALANCE_MODEL } from './engines/water-balance.js';
import { setupDropdown, closeAllDropdowns, wireSegmented } from './interactions.js';

const LANG_KEY = 'eco-nojin-lang';
const state = { lang: 'fa', openGroups: new Set(['hydroma', 'marketplace']), notifUnread: true };

const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function readLang() {
  try {
    const v = localStorage.getItem(LANG_KEY);
    return v === 'en' || v === 'fa' ? v : 'fa';
  } catch {
    return 'fa';
  }
}
function storeLang(lang) {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch {
    /* ignore */
  }
}
const t = (key, vars) => translate(state.lang, key, vars);

// ---------- static labels ----------
function applyStaticI18n() {
  document.documentElement.lang = state.lang;
  document.documentElement.dir = isRtl(state.lang) ? 'rtl' : 'ltr';
  $$('[data-app-i18n]').forEach((el) => {
    el.textContent = t(el.getAttribute('data-app-i18n'));
  });
  $$('[data-app-i18n-aria]').forEach((el) => {
    el.setAttribute('aria-label', t(el.getAttribute('data-app-i18n-aria')));
  });
  $$('[data-lang-set]').forEach((b) => b.setAttribute('aria-pressed', String(b.getAttribute('data-lang-set') === state.lang)));
  const menuBtn = $('#menu-btn');
  if (menuBtn) menuBtn.setAttribute('aria-expanded', String($('#sidebar').classList.contains('open')));
}

// ---------- sidebar ----------
function navItemHtml(item, { child = false } = {}) {
  const active = normalizeRoute(location.hash) === item.route;
  const soon = item.status === 'planned';
  return `<a class="nav-item${child ? ' nav-item--child' : ''}${active ? ' active' : ''}" href="${item.route}" ${active ? 'aria-current="page"' : ''}>
    <span class="nav-item-icon">${icon(item.icon)}</span>
    <span class="nav-item-label">${t(item.labelKey)}</span>
    ${soon ? '<span class="nav-dot" title="in development" aria-hidden="true"></span>' : ''}
  </a>`;
}

function navGroupHtml(group) {
  const open = state.openGroups.has(group.id);
  const hasActiveChild = group.children.some((c) => normalizeRoute(location.hash) === c.route);
  return `<div class="nav-group${hasActiveChild ? ' has-active' : ''}">
    <button class="nav-group-head" type="button" data-group="${group.id}" aria-expanded="${open}">
      <span class="nav-item-icon">${icon(group.icon)}</span>
      <span class="nav-item-label">${t(group.labelKey)}</span>
      <span class="nav-chevron">${icon('chevron')}</span>
    </button>
    <div class="nav-group-children" data-children="${group.id}" ${open ? '' : 'hidden'}>
      ${group.children.map((c) => navItemHtml(c, { child: true })).join('')}
    </div>
  </div>`;
}

function renderSidebar() {
  const nav = $('#side-nav');
  nav.innerHTML = NAV.map((n) => (n.type === 'group' ? navGroupHtml(n) : navItemHtml(n))).join('');
  $$('[data-group]', nav).forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-group');
      const open = !state.openGroups.has(id);
      if (open) state.openGroups.add(id);
      else state.openGroups.delete(id);
      btn.setAttribute('aria-expanded', String(open));
      const panel = $(`[data-children="${id}"]`, nav);
      if (panel) panel.hidden = !open;
      const group = btn.closest('.nav-group');
      if (group) group.classList.toggle('open', open);
    });
  });
}

// ---------- breadcrumbs ----------
function renderCrumbs(item, group) {
  const home = `<a href="#/dashboard">${t('common.home')}</a>`;
  if (!group) {
    $('#crumbs').innerHTML = `${home}<span class="crumb-sep">/</span><span class="crumb-current">${t(item.labelKey)}</span>`;
    return;
  }
  $('#crumbs').innerHTML = `${home}
    <span class="crumb-sep">/</span>
    <span class="crumb-group">${t(group.labelKey)}</span>
    <span class="crumb-sep">/</span>
    <span class="crumb-current">${t(item.labelKey)}</span>`;
}

// ---------- pages ----------
function kpiCard(value, labelKey) {
  return `<div class="kpi">
    <div class="kpi-value">${formatNumber(value, state.lang)}</div>
    <div class="kpi-label">${t(labelKey)}</div>
  </div>`;
}

function areaCard({ iconName, tone, titleKey, descKey, href, ctaKey }) {
  return `<article class="area-card area-card--${tone}">
    <div class="area-icon">${icon(iconName)}</div>
    <h3 class="area-title">${t(titleKey)}</h3>
    <p class="area-desc">${t(descKey)}</p>
    <a class="btn btn-secondary btn-sm" href="${href}">${t(ctaKey || 'dash.enter')}<span class="btn-arrow">${icon('arrowLeft')}</span></a>
  </article>`;
}

function renderDashboard() {
  const s = stats();
  const cards = [
    { iconName: 'flask', tone: 'hydro', titleKey: 'dash.area.hydroma.title', descKey: 'dash.area.hydroma.desc', href: '#/hydroma/water' },
    { iconName: 'store', tone: 'market', titleKey: 'dash.area.market.title', descKey: 'dash.area.market.desc', href: '#/marketplace' },
    { iconName: 'grid', tone: 'eco', titleKey: 'dash.area.eco.title', descKey: 'dash.area.eco.desc', href: '#/settings' },
  ];

  return `
  <div class="dash">
    <section class="area-grid">
      ${cards.map(areaCard).join('')}
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">${t('dash.kpi.title')}</h2>
        <span class="badge badge-neutral">${t('common.demo')}</span>
      </div>
      <div class="kpi-grid">
        ${kpiCard(24, 'dash.kpi.projects')}
        ${kpiCard(s.active + 6, 'dash.kpi.models')}
        ${kpiCard(128, 'dash.kpi.products')}
        <div class="kpi kpi--accent">
          <div class="kpi-value">${formatNumber(s.active, state.lang)}<span class="kpi-den">/ ${formatNumber(s.active + s.planned, state.lang)}</span></div>
          <div class="kpi-label">${t('dash.progress.active')}</div>
        </div>
      </div>
      <p class="panel-note">${t('dash.kpi.note')}</p>
    </section>

    <section class="dash-cols">
      <div class="panel">
        <div class="panel-head"><h2 class="panel-title">${t('dash.progress.title')}</h2></div>
        <ul class="stat-list">
          <li><span class="stat-dot stat-dot--ok"></span><span class="stat-label">${t('dash.progress.active')}</span><span class="stat-value">${formatNumber(s.active, state.lang)}</span></li>
          <li><span class="stat-dot stat-dot--soon"></span><span class="stat-label">${t('dash.progress.soon')}</span><span class="stat-value">${formatNumber(s.planned, state.lang)}</span></li>
        </ul>
        <p class="panel-note">${t('dash.progress.note')}</p>
      </div>

      <div class="panel">
        <div class="panel-head"><h2 class="panel-title">${t('dash.quick.title')}</h2></div>
        <div class="quick-grid">
          <a class="quick" href="#/hydroma/water">${icon('flask')}<span>${t('dash.quick.hydroma')}</span></a>
          <a class="quick" href="#/marketplace">${icon('store')}<span>${t('dash.quick.market')}</span></a>
          <a class="quick" href="#/settings">${icon('settings')}<span>${t('dash.quick.settings')}</span></a>
        </div>
      </div>
    </section>
  </div>`;
}

function renderPlaceholder(item, group) {
  return `
  <div class="placeholder">
    <div class="placeholder-card">
      <div class="placeholder-icon">${icon(item.icon)}</div>
      <h2 class="placeholder-title">${t('placeholder.title')}</h2>
      <p class="placeholder-desc">${t('placeholder.desc', { name: t(item.labelKey) })}</p>
      <span class="badge badge-neutral">${t('common.soon')}</span>
      <p class="placeholder-note">${t('placeholder.note')}</p>
      <a class="btn btn-primary" href="#/dashboard">${icon('arrowRight')}<span>${t('placeholder.back')}</span></a>
    </div>
  </div>`;
}

// ---------- number formatting ----------
const nf = (n, dp = 2) => {
  if (n === null || n === undefined) return '—';
  try {
    return new Intl.NumberFormat(state.lang === 'fa' ? 'fa-IR' : 'en-US', { maximumFractionDigits: dp }).format(n);
  } catch {
    return String(n);
  }
};

// ---------- HyDroMA overview ----------
const HYDROMA_SECTIONS = [
  { labelKey: 'nav.water', icon: 'water', href: '#/hydroma/water', status: 'ready' },
  { labelKey: 'nav.soil', icon: 'layers', href: '#/hydroma/soil', status: 'planned' },
  { labelKey: 'nav.agriculture', icon: 'leaf', href: '#/hydroma/agriculture', status: 'planned' },
  { labelKey: 'nav.climate', icon: 'cloud', href: '#/hydroma/climate', status: 'planned' },
  { labelKey: 'nav.remoteSensing', icon: 'satellite', href: '#/hydroma/remote-sensing', status: 'planned' },
  { labelKey: 'nav.modeling', icon: 'cpu', href: '#/hydroma/modeling', status: 'planned' },
  { labelKey: 'nav.monitoring', icon: 'activity', href: '#/hydroma/monitoring', status: 'planned' },
];

function renderHydromaOverview() {
  const cards = HYDROMA_SECTIONS.map((s) => `
    <a class="hydro-card${s.status === 'ready' ? ' hydro-card--ready' : ''}" href="${s.href}"${s.status === 'ready' ? '' : ' aria-disabled="false"'}>
      <span class="hydro-card-icon">${icon(s.icon)}</span>
      <span class="hydro-card-title">${t(s.labelKey)}</span>
      <span class="badge ${s.status === 'ready' ? 'badge-success' : 'badge-neutral'}">${s.status === 'ready' ? t('hydroma.ready') : t('common.soon')}</span>
    </a>`).join('');

  return `
  <div class="hydro">
    <section class="panel hydro-banner">
      <div class="hydro-banner-main">
        <p class="hydro-kicker">HyDroMA</p>
        <h2 class="panel-title">${t('hydroma.engine.title')}</h2>
        <p class="panel-note">${t('hydroma.engine.desc')}</p>
      </div>
      <span class="badge badge-warning">${t('wb.state')}</span>
    </section>

    <section class="panel">
      <div class="panel-head">
        <h2 class="panel-title">${t('hydroma.landstate.title')}</h2>
        <span class="badge badge-neutral">${t('common.demo')}</span>
      </div>
      <p class="panel-note">${t('hydroma.landstate.desc')} ${t('hydroma.landstate.note')}</p>
    </section>

    <section class="panel">
      <div class="panel-head"><h2 class="panel-title">${t('hydroma.sections.title')}</h2></div>
      <div class="hydro-grid">${cards}</div>
    </section>
  </div>`;
}

// ---------- water balance tool ----------
const WB_FIELDS = [
  { name: 'periodDays', labelKey: 'wb.field.period', unitKey: 'wb.unit.day', step: '1', min: '1' },
  { name: 'areaHa', labelKey: 'wb.field.area', unitKey: 'wb.unit.ha', step: '0.1', min: '0', optional: true },
  { name: 'precipitation', labelKey: 'wb.field.precipitation', unitKey: 'wb.unit.mm', step: '0.1', min: '0' },
  { name: 'irrigation', labelKey: 'wb.field.irrigation', unitKey: 'wb.unit.mm', step: '0.1', min: '0' },
  { name: 'runoff', labelKey: 'wb.field.runoff', unitKey: 'wb.unit.mm', step: '0.1', min: '0' },
  { name: 'evapotranspiration', labelKey: 'wb.field.et', unitKey: 'wb.unit.mm', step: '0.1', min: '0' },
  { name: 'deepPercolation', labelKey: 'wb.field.dp', unitKey: 'wb.unit.mm', step: '0.1', min: '0', optional: true },
  { name: 'capillaryRise', labelKey: 'wb.field.cr', unitKey: 'wb.unit.mm', step: '0.1', min: '0', optional: true },
  { name: 'initialStorage', labelKey: 'wb.field.initialStorage', unitKey: 'wb.unit.mm', step: '0.1', min: '0', optional: true },
  { name: 'measuredStorageChange', labelKey: 'wb.field.measured', unitKey: 'wb.unit.mm', step: '0.1', optional: true },
];

const WB_DEMO = {
  periodDays: '30', areaHa: '10', precipitation: '120', irrigation: '80', runoff: '15',
  evapotranspiration: '140', deepPercolation: '10', capillaryRise: '0', initialStorage: '150', measuredStorageChange: '',
};

const WB_FIELD_LABEL = Object.fromEntries(WB_FIELDS.map((f) => [f.name, f.labelKey]));
const wbFieldLabel = (name) => (WB_FIELD_LABEL[name] ? t(WB_FIELD_LABEL[name]) : name);

function provenanceInputs(res) {
  const i = res.inputs;
  const parts = [
    `P=${nf(i.precipitation, 1)}mm`, `I=${nf(i.irrigation, 1)}mm`, `R=${nf(i.runoff, 1)}mm`,
    `ET=${nf(i.evapotranspiration, 1)}mm`, `DP=${nf(i.deepPercolation, 1)}mm`, `CR=${nf(i.capillaryRise, 1)}mm`,
    `Δt=${nf(i.periodDays)}d`,
  ];
  if (i.areaHa != null) parts.push(`A=${nf(i.areaHa, 2)}ha`);
  return parts.join(' · ');
}

function renderWaterBalance() {
  const fields = WB_FIELDS.map((f) => `
    <div class="wb-field">
      <label class="wb-label" for="wb-${f.name}">
        <span>${t(f.labelKey)}</span>
        <span class="wb-unit">${t(f.unitKey)}${f.optional ? ` · ${t('wb.optional')}` : ''}</span>
      </label>
      <input class="input wb-input" id="wb-${f.name}" name="${f.name}" type="number" inputmode="decimal" step="${f.step}"${f.min !== undefined ? ` min="${f.min}"` : ''} />
      <p class="wb-error" data-err="${f.name}" hidden></p>
    </div>`).join('');

  return `
  <div class="wb">
    <div class="wb-banner">
      <span class="badge badge-warning">${t('wb.state')}</span>
      <p class="wb-banner-note">${t('wb.demoInputs')}</p>
    </div>
    <div class="wb-layout">
      <form class="wb-form panel" id="wb-form" novalidate>
        <div class="panel-head"><h2 class="panel-title">${t('wb.form.title')}</h2></div>
        <div class="wb-fields">${fields}</div>
        <div class="wb-actions">
          <button class="btn btn-primary" type="submit">${t('wb.calc')}</button>
          <button class="btn btn-tertiary" type="button" id="wb-demo">${t('wb.resetDemo')}</button>
          <button class="btn btn-quiet" type="button" id="wb-clear">${t('wb.clear')}</button>
        </div>
      </form>
      <div class="wb-output"><div class="wb-results" id="wb-results" aria-live="polite"></div></div>
    </div>
  </div>`;
}

function renderWBResult(res) {
  if (!res.ok) {
    const items = res.errors
      .map((e) => `<li><span class="wb-err-msg">${t('wb.err.' + e.code)}</span> <span class="wb-err-field">${wbFieldLabel(e.field)}</span></li>`)
      .join('');
    return `<div class="panel wb-errorbox"><div class="panel-head"><h2 class="panel-title">${t('wb.err.title')}</h2></div><ul class="wb-err-list">${items}</ul></div>`;
  }
  const r = res.result;
  const statusClass = { surplus: 'badge-success', deficit: 'badge-warning', balanced: 'badge-info' }[r.status];
  const rows = [
    ['wb.field.precipitation', '+', res.components.P],
    ['wb.field.irrigation', '+', res.components.I],
    ['wb.field.cr', '+', res.components.CR],
    ['wb.field.et', '−', res.components.ET],
    ['wb.field.runoff', '−', res.components.R],
    ['wb.field.dp', '−', res.components.DP],
  ]
    .map(([k, sign, val]) => `<tr><td>${t(k)}</td><td class="wb-sign">${sign}</td><td class="wb-num">${nf(val, 2)} <span class="wb-unit-inline">${t('wb.unit.mm')}</span></td></tr>`)
    .join('');

  const derived = [];
  if (r.runoffCoefficient != null) derived.push(`<li><span>${t('wb.derived.runoffCoeff')}</span><span class="wb-num">${nf(r.runoffCoefficient, 3)}</span></li>`);
  if (r.residualMm != null) {
    derived.push(`<li><span>${t('wb.derived.residual')}</span><span class="wb-num">${nf(r.residualMm, 2)} ${t('wb.unit.mm')}</span></li>`);
    derived.push(`<li><span>${t('wb.derived.closure')}</span><span class="badge ${r.balanceCloses ? 'badge-success' : 'badge-warning'}">${t(r.balanceCloses ? 'wb.closure.closes' : 'wb.closure.mismatch')}</span></li>`);
  }
  if (r.finalStorageMm != null) derived.push(`<li><span>${t('wb.derived.finalStorage')}</span><span class="wb-num">${nf(r.finalStorageMm, 2)} ${t('wb.unit.mm')}</span></li>`);

  const warnings = res.warnings.length
    ? `<div class="wb-block"><h3 class="wb-block-title">${t('wb.warn.title')}</h3><ul class="wb-warn-list">${res.warnings
        .map((w) => `<li class="wb-warn">${t('wb.warn.' + w.code)}${w.value != null ? ` <span class="wb-num">(${nf(w.value, 2)} ${t('wb.unit.mm')})</span>` : ''}</li>`)
        .join('')}</ul></div>`
    : '';

  return `
  <div class="panel wb-result-card">
    <div class="wb-headline">
      <div>
        <p class="wb-kicker">${t('wb.result.storageChange')}</p>
        <p class="wb-big"><span class="wb-num">${nf(r.storageChangeMm, 2)}</span><span class="wb-big-unit">${t('wb.unit.mm')}</span></p>
        ${r.storageChangeM3 != null ? `<p class="wb-big-sub">${t('wb.result.volume')}: <span class="wb-num">${nf(r.storageChangeM3, 1)}</span> ${t('wb.unit.m3')}</p>` : ''}
      </div>
      <span class="badge ${statusClass}">${t('wb.status.' + r.status)}</span>
    </div>

    <div class="wb-block">
      <h3 class="wb-block-title">${t('wb.equation.title')}</h3>
      <code class="wb-formula">${res.equation.formulaDisplay}</code>
      <code class="wb-sub">${res.equation.substitution}</code>
      <p class="wb-sign-note"><strong>${t('wb.sign.title')}:</strong> ${t('wb.sign.text')}</p>
    </div>

    <div class="wb-block">
      <h3 class="wb-block-title">${t('wb.components.title')}</h3>
      <table class="wb-table"><tbody>${rows}</tbody><tfoot>
        <tr><td>${t('wb.comp.inflow')}</td><td></td><td class="wb-num">${nf(res.components.inflow, 2)} ${t('wb.unit.mm')}</td></tr>
        <tr><td>${t('wb.comp.outflow')}</td><td></td><td class="wb-num">${nf(res.components.outflow, 2)} ${t('wb.unit.mm')}</td></tr>
      </tfoot></table>
    </div>

    ${derived.length ? `<div class="wb-block"><h3 class="wb-block-title">${t('wb.derived.title')}</h3><ul class="wb-kv">${derived.join('')}</ul></div>` : ''}
    ${warnings}

    <details class="wb-details"><summary>${t('wb.assume.title')}</summary><ul class="wb-list">${res.assumptions.map((id) => `<li>${t('wb.assume.' + id)}</li>`).join('')}</ul></details>
    <details class="wb-details"><summary>${t('wb.limit.title')}</summary><ul class="wb-list">${res.limitations.map((id) => `<li>${t('wb.limit.' + id)}</li>`).join('')}</ul></details>
    <details class="wb-details"><summary>${t('wb.refs.title')}</summary><ul class="wb-list wb-refs">${res.references.map((x) => `<li>${x}</li>`).join('')}</ul></details>

    <div class="wb-prov">
      <p class="wb-prov-title">${t('wb.provenance.title')}</p>
      <ul class="wb-kv">
        <li><span>${t('wb.prov.model')}</span><span class="wb-mono">${res.model.id}</span></li>
        <li><span>${t('wb.prov.version')}</span><span class="wb-mono">${res.model.version}</span></li>
        <li><span>${t('wb.prov.state')}</span><span class="badge badge-warning">${res.model.state}</span></li>
        <li><span>${t('wb.prov.inputs')}</span><span class="wb-mono">${provenanceInputs(res)}</span></li>
      </ul>
      <p class="wb-disclaimer">${t('wb.disclaimer')}</p>
    </div>
  </div>`;
}

function clearWbErrors(form) {
  form.querySelectorAll('.wb-error').forEach((e) => { e.hidden = true; e.textContent = ''; });
  form.querySelectorAll('.input-error').forEach((e) => e.classList.remove('input-error'));
}

function fillWbDemo(form) {
  for (const f of WB_FIELDS) {
    const el = form.elements[f.name];
    if (el) el.value = WB_DEMO[f.name] ?? '';
  }
}

function wireWaterBalance() {
  const form = $('#wb-form');
  const results = $('#wb-results');
  if (!form || !results) return;

  const run = () => {
    clearWbErrors(form);
    const input = {};
    for (const f of WB_FIELDS) input[f.name] = form.elements[f.name].value;
    const res = computeWaterBalance(input);
    if (!res.ok) {
      for (const e of res.errors) {
        const p = form.querySelector(`[data-err="${e.field}"]`);
        if (p) { p.hidden = false; p.textContent = t('wb.err.' + e.code); }
        const inp = form.elements[e.field];
        if (inp) inp.classList.add('input-error');
      }
    }
    results.innerHTML = renderWBResult(res);
  };

  form.addEventListener('submit', (e) => { e.preventDefault(); run(); });
  let timer;
  form.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(run, 220); });
  const demoBtn = $('#wb-demo');
  if (demoBtn) demoBtn.addEventListener('click', () => { fillWbDemo(form); run(); });
  const clearBtn = $('#wb-clear');
  if (clearBtn) clearBtn.addEventListener('click', () => {
    for (const f of WB_FIELDS) { const el = form.elements[f.name]; if (el) el.value = ''; }
    for (const n of ['deepPercolation', 'capillaryRise']) { const el = form.elements[n]; if (el) el.value = '0'; }
    run();
  });

  fillWbDemo(form);
  run();
}

// ---------- page head ----------
const PAGE_SUB = { dashboard: 'dash.subtitle', overview: 'hydroma.engine.desc', water: 'wb.intro' };

function renderPageHead(item) {
  const subKey = PAGE_SUB[item.id];
  $('#page-title').textContent = t(item.labelKey);
  $('#page-sub').textContent = subKey ? t(subKey) : '';
  $('#page-sub').hidden = !subKey;
  const actions = $('#page-actions');
  actions.innerHTML = `<span class="badge badge-aqua">${t('common.demo')}</span>`;
}

// ---------- view ----------
function renderView(item, group) {
  const view = $('#view');
  view.classList.remove('view-enter');
  if (item.status === 'ready' && item.id === 'dashboard') {
    view.innerHTML = renderDashboard();
  } else if (item.status === 'ready' && item.id === 'overview') {
    view.innerHTML = renderHydromaOverview();
  } else if (item.status === 'ready' && item.id === 'water') {
    view.innerHTML = renderWaterBalance();
    wireWaterBalance();
  } else {
    view.innerHTML = renderPlaceholder(item, group);
  }
  // force reflow to replay the fade
  void view.offsetWidth;
  view.classList.add('view-enter');
}

// ---------- router ----------
function route() {
  const { item, group } = resolveRoute(location.hash);
  if (group && !state.openGroups.has(group.id)) {
    state.openGroups.add(group.id);
  }
  renderSidebar();
  renderCrumbs(item, group);
  renderPageHead(item);
  renderView(item, group);
  document.title = `${t(item.labelKey)} — ${t('brand.name')}`;
  closeSidebar();
}

// ---------- dropdowns (helpers live in interactions.js) ----------

function renderNotifPanel() {
  const panel = $('#notif-panel');
  if (!panel) return;
  const items = [
    ['notif.n1.title', 'notif.n1.text'],
    ['notif.n2.title', 'notif.n2.text'],
    ['notif.n3.title', 'notif.n3.text'],
  ];
  panel.innerHTML = `
    <div class="dd-head">
      <strong>${t('notif.title')}</strong>
      <button class="dd-link" type="button" id="notif-mark">${t('notif.markAll')}</button>
    </div>
    <ul class="dd-list">
      ${items
        .map(
          ([tk, tx], i) => `<li class="dd-item${state.notifUnread && i === 0 ? ' unread' : ''}">
            <span class="dd-dot"></span>
            <div><p class="dd-item-title">${t(tk)}</p><p class="dd-item-text">${t(tx)}</p></div>
          </li>`,
        )
        .join('')}
    </ul>
    <div class="dd-foot"><span class="badge badge-neutral">${t('common.demo')}</span></div>`;
  const mark = $('#notif-mark');
  if (mark) {
    mark.addEventListener('click', () => {
      state.notifUnread = false;
      updateNotifDot();
      $$('.dd-item.unread', panel).forEach((el) => el.classList.remove('unread'));
      mark.textContent = t('notif.title');
    });
  }
}

function updateNotifDot() {
  const dot = $('#notif-dot');
  if (dot) dot.hidden = !state.notifUnread;
}

function renderProfilePanel() {
  const panel = $('#profile-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="dd-profile">
      <span class="avatar avatar--lg">EN</span>
      <div>
        <p class="dd-profile-name">${t('topbar.demoUser')}</p>
        <p class="dd-profile-role">${t('topbar.demoRole')}</p>
      </div>
    </div>
    <div class="dd-sep"></div>
    <a class="dd-item-link" href="#/settings">${icon('user')}<span>${t('profile.menu')}</span></a>
    <a class="dd-item-link" href="#/settings">${icon('settings')}<span>${t('profile.settings')}</span></a>
    <div class="dd-sep"></div>
    <button class="dd-item-link dd-disabled" type="button" disabled aria-disabled="true">${icon('close')}<span>${t('profile.logout')}</span></button>
    <p class="dd-note">${t('profile.logoutNote')}</p>`;
}

function closeSidebar() {
  const sb = $('#sidebar');
  const scrim = $('#scrim');
  const btn = $('#menu-btn');
  if (sb) sb.classList.remove('open');
  if (scrim) scrim.classList.remove('show');
  if (btn) btn.setAttribute('aria-expanded', 'false');
}
function openSidebar() {
  const sb = $('#sidebar');
  const scrim = $('#scrim');
  const btn = $('#menu-btn');
  if (sb) sb.classList.add('open');
  if (scrim) scrim.classList.add('show');
  if (btn) btn.setAttribute('aria-expanded', 'true');
}

// ---------- language / theme ----------
function setLang(lang) {
  if (lang !== 'fa' && lang !== 'en') return;
  state.lang = lang;
  storeLang(lang);
  applyStaticI18n();
  renderNotifPanel();
  renderProfilePanel();
  route();
}
function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  applyTheme(theme);
  storeTheme(theme);
}

// ---------- wiring ----------
function wire() {
  wireSegmented(document, 'data-lang-set', setLang);
  wireSegmented(document, 'data-theme-set', setTheme);

  const menuBtn = $('#menu-btn');
  if (menuBtn) menuBtn.addEventListener('click', () => {
    const open = !$('#sidebar').classList.contains('open');
    if (open) openSidebar();
    else closeSidebar();
  });
  const scrim = $('#scrim');
  if (scrim) scrim.addEventListener('click', closeSidebar);

  $('#side-nav')?.addEventListener('click', (e) => {
    if (e.target.closest('a')) closeSidebar();
  });

  document.addEventListener('click', () => closeAllDropdowns());
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeAllDropdowns();
      closeSidebar();
    }
  });

  setupDropdown($('#notif-btn'), $('#notif-panel'));
  setupDropdown($('#profile-btn'), $('#profile-panel'));

  window.addEventListener('hashchange', route);
}

function init() {
  state.lang = readLang();
  initTheme();
  applyStaticI18n();
  renderNotifPanel();
  renderProfilePanel();
  updateNotifDot();
  wire();
  if (!location.hash) location.hash = '#/dashboard';
  route();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
else init();