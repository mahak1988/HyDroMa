/* ==========================================================================
   Owner Visual Decision Studio — app logic
   - Populates logo gallery (9 options, real-context mockups, original vs outlined)
   - Typography lab (6 families)
   - Real UI preview (shared content, theme switch)
   - Decision register (localStorage only)
   No external deps. No network.
   ========================================================================== */
(function () {
  'use strict';

  // ---- logo data (from QA audit) ----
  const BRANDS = [
    {
      key: 'eco', name: 'Eco Nojin', label: 'برند مادر',
      files: ['eco-nojin-option-01', 'eco-nojin-option-02', 'eco-nojin-option-03'],
      fonts: ['Fraunces 600/500 + Manrope 600', 'Manrope 800/600', 'Fraunces 600/500 + Manrope 600'],
      opts: ['Fraunces Editorial', 'Manrope Modern', 'Fraunces Stacked']
    },
    {
      key: 'hydroma', name: 'HyDroMA', label: 'موتور علمی',
      files: ['hydroma-option-01', 'hydroma-option-02', 'hydroma-option-03'],
      fonts: ['Manrope 750 + IBM Plex Mono 600', 'DM Sans 700 + IBM Plex Mono 500', 'Manrope 800/400 + IBM Plex Mono 600'],
      opts: ['Manrope Tight', 'DM Sans Clean', 'Manrope Weight Contrast']
    },
    {
      key: 'market', name: 'Nojin Marketplace', label: 'بازارگاه',
      files: ['marketplace-option-01', 'marketplace-option-02', 'marketplace-option-03'],
      fonts: ['DM Sans 750/500', 'Manrope 800/600', 'Fraunces 600 + DM Sans 500 + Manrope 600'],
      opts: ['DM Sans Mixed', 'Manrope Friendly', 'Fraunces Mixed']
    }
  ];

  const img = f => './assets/images/' + f + '.svg';
  const outlined = f => './assets/outlined/' + f + '.outlined.svg';
  const compare = f => './assets/compare/' + f + '.compare.png';

  // ---- build logo gallery ----
  function buildLogos() {
    const mount = document.getElementById('logo-mount');
    mount.innerHTML = BRANDS.map(b => `
      <div class="brand-block">
        <h3>${b.name} <span class="pill" style="margin-inline-start:8px">${b.label}</span></h3>
        <div class="b-sub">۳ گزینه تایپوگرافیک — هر گزینه در ۸ کاربرد واقعی</div>
        <div class="logo-grid">
          ${b.files.map((f, i) => logoCard(b, f, i)).join('')}
        </div>
      </div>
    `).join('');
    // wire up original/outlined toggles
    mount.querySelectorAll('.logo-card').forEach(card => {
      const file = card.dataset.file;
      card.querySelectorAll('.logo-tabs button').forEach(btn => {
        btn.addEventListener('click', () => {
          card.querySelectorAll('.logo-tabs button').forEach(x => x.classList.remove('active'));
          btn.classList.add('active');
          const v = btn.dataset.view;
          card.querySelectorAll('.js-original').forEach(el => el.style.display = v === 'original' ? '' : 'none');
          card.querySelectorAll('.js-outlined').forEach(el => el.style.display = v === 'outlined' ? '' : 'none');
          card.querySelectorAll('.stage-img').forEach(im => { im.src = v === 'original' ? img(file) : outlined(file); });
        });
      });
    });
  }

  function logoCard(b, f, i) {
    return `
    <div class="logo-card" data-file="${f}">
      <div class="logo-opt-head">
        <span class="opt-id">Option 0${i + 1} — ${b.opts[i]}</span>
        <span class="pill font" title="وابستگی به فونت">FONT-DEPENDENT</span>
      </div>
      <div class="logo-stage"><img class="stage-img" src="${img(f)}" alt="${b.name} option ${i + 1}"></div>
      <div class="logo-tabs">
        <button class="active" data-view="original" type="button">Original SVG</button>
        <button data-view="outlined" type="button">Outlined (Paths)</button>
      </div>
      <div class="logo-meta">
        <dl>
          <dt>فایل اصلی</dt><dd>${f}.svg</dd>
          <dt>برند</dt><dd>${b.name}</dd>
          <dt>فونت</dt><dd>${b.fonts[i]}</dd>
          <dt>وابستگی به فونت</dt><dd>بله (متن SVG)</dd>
          <dt>SVG اصلی</dt><dd><span class="pill path"> موجود</span></dd>
          <dt>Outlined</dt><dd><span class="pill outline"> موجود (آزمایشی)</span></dd>
          <dt>تغییر پس از Path</dt><dd>±1px (معادل)</dd>
        </dl>
      </div>
      <div class="logo-preview">
        <div class="pv-label">کاربرد واقعی</div>
        ${realContext(f, b.name)}
        <div class="pv-label" style="margin-top:10px">مقایسه Original / Outlined</div>
        <div class="compare-split">
          <div class="cs"><div class="cs-h">Original (متن)</div><img src="${img(f)}" alt="original"></div>
          <div class="cs"><div class="cs-h">Outlined (برداری)</div><img src="${outlined(f)}" alt="outlined"></div>
        </div>
      </div>
    </div>`;
  }

  function realContext(f, name) {
    return `
      <div class="preview-row">
        <span class="chip mini">دسکتاپ</span>
        <div class="mock" style="flex:1;min-width:200px">
          <div class="mock-hd"><img class="m-logo" src="${img(f)}" alt=""><div class="m-nav"><span class="on">خانه</span><span>علمی</span><span>بازارگاه</span></div></div>
        </div>
      </div>
      <div class="preview-row">
        <span class="chip mini">موبایل</span>
        <div class="mock" style="flex:1;min-width:120px;max-width:180px">
          <div class="mock-hd" style="flex-direction:column;align-items:flex-start;gap:6px"><img class="m-logo" src="${img(f)}" alt="" style="height:20px"><div class="m-nav"><span class="on">☰</span></div></div>
        </div>
      </div>
      <div class="preview-row">
        <span class="chip mini">فوتر</span>
        <div class="mock" style="flex:1"><div class="mock-ft"><img src="${img(f)}" alt=""><span class="m-copy">© 2026 ${name} · تمام حقوق محفوظ است.</span></div></div>
      </div>
      <div class="preview-row">
        <span class="chip mini">کارت برند</span>
        <div class="mock-card" style="flex:1"><img class="mc-logo" src="${img(f)}" alt=""><div class="mc-title">${name}</div><div class="mc-body">معرفی برند — نمونه(context).</div></div>
      </div>
      <div class="preview-row">
        <span class="chip mini">روشن</span><span class="chip" style="background:#fff;min-height:40px;flex:1"><img src="${img(f)}" alt="" style="height:30px"></span>
      </div>
      <div class="preview-row">
        <span class="chip mini dark">تیره</span><span class="chip dark" style="flex:1;min-height:40px"><img src="${img(f)}" alt="" style="height:30px;background:#fff;padding:2px;border-radius:4px"></span>
      </div>
      <div class="preview-row">
        <span class="chip mini">بزرگ</span><span class="chip" style="flex:1;min-height:70px"><img src="${img(f)}" alt="" style="height:54px"></span>
      </div>
      <div class="preview-row">
        <span class="chip mini">کوچک</span><span class="chip" style="flex:1"><img src="${img(f)}" alt="" style="height:18px"></span>
      </div>`;
  }

  // ---- typography lab ----
  const FONTS = [
    { fam: 'Vazirmatn', css: "'Vazirmatn','Segoe UI',Tahoma,sans-serif", weights: '300–800 (متغیر)', files: 3, load: 'ok', lic: 'OFL (URL داخلی)', best: 'تیتر و متن فارسی' },
    { fam: 'Estedad', css: "'Estedad','Vazirmatn',Tahoma,sans-serif", weights: '300–800 (متغیر)', files: 4, load: 'ok', lic: 'OFL (URL داخلی)', best: 'تیتر فارسی (جایگزین)' },
    { fam: 'Fraunces', css: "'Fraunces',Georgia,serif", weights: '400–700 (opsz,wght)', files: 3, load: 'ok', lic: 'OFL (URL داخلی)', best: 'تیتر نمایشی / سریف' },
    { fam: 'Manrope', css: "'Manrope','DM Sans',Arial,sans-serif", weights: '200–800 (متغیر)', files: 6, load: 'ok', lic: 'OFL (URL داخلی)', best: 'تیتر و UI لاتین' },
    { fam: 'DM Sans', css: "'DM Sans','Segoe UI',Arial,sans-serif", weights: '100–1000 (متغیر)', files: 2, load: 'ok', lic: 'OFL (URL داخلی)', best: 'متن و UI لاتین' },
    { fam: 'IBM Plex Mono', css: "'IBM Plex Mono','Consolas',monospace", weights: '400/500/600 (ثابت)', files: 18, load: 'ok', lic: 'OFL (URL داخلی)', best: 'داده و کد' }
  ];

  function buildType() {
    const mount = document.getElementById('type-mount');
    mount.innerHTML = '<div class="type-grid">' + FONTS.map(f => `
      <div class="type-card">
        <div class="tc-head">
          <span class="tc-name" style="font-family:${f.css}">${f.fam}</span>
          <span class="load-badge ok">LOADED</span>
          <div class="tc-tags">
            <span class="pill font">${f.weights}</span>
            <span class="pill">${f.files} فایل</span>
          </div>
        </div>
        <div class="tc-body" style="font-family:${f.css}">
          <div class="type-row"><div class="tr-label">تیتر بزرگ فارسی</div><div class="type-sample fa tt" style="font-size:1.6rem">یک پلتفرم، از علم تا معیشت</div></div>
          <div class="type-row"><div class="tr-label">تیتر بزرگ انگلیسی</div><div class="type-sample en tt" style="font-size:1.5rem">One Platform, From Science to Livelihoods</div></div>
          <div class="type-row"><div class="tr-label">متن بدنه فارسی</div><div class="type-sample fa ts">مدیریت هوشمند آب، خاک و سرزمین — راهکاری یکپارچه برای سرزمین‌های زنده.</div></div>
          <div class="type-row"><div class="tr-label">متن بدنه انگلیسی</div><div class="type-sample en ts">Intelligent Water, Soil and Landscape Management — a unified approach for living territories.</div></div>
          <div class="type-row"><div class="tr-label">اعداد</div><div class="type-sample td" style="font-size:1.1rem">0123456789 · ۱۲۳۴۵۶۷۸۹۰</div></div>
          <div class="type-row"><div class="tr-label">داده علمی</div><div class="type-sample td">ET₀ = Kc × ETo &nbsp;·&nbsp; Soil Moisture: 24.8%</div></div>
          <div class="type-row"><div class="tr-label">نام برند</div><div class="type-sample tt" style="font-size:1.3rem">Eco Nojin · HyDroMA · Marketplace</div></div>
          <div class="type-row"><div class="tr-label">متن دکمه</div><div class="type-sample"><span style="display:inline-block;background:#0B5563;color:#fff;font-weight:800;padding:6px 14px;border-radius:8px;font-family:${f.css}">Button Label</span></div></div>
          <div class="type-row" style="border-bottom:none">
            <div class="tr-label">fallback / مجوز</div>
            <div style="font-family:var(--font-fa);font-size:.8rem;color:var(--ink-2)">fallback: ${f.css.split(',').slice(1).join(',')} · مجوز: ${f.lic}</div>
          </div>
        </div>
      </div>`).join('') + '</div>';
  }

  // ---- real UI preview (shared content, theme switch) ----
  function kitHTML() {
    return `
    <div class="kit" id="kit-root">
      <div class="k-hd">
        <span class="k-brand">Eco Nojin</span>
        <span class="k-nav"><a class="on" href="#">Overview</a><a href="#">Brands</a><a href="#">Science</a><a href="#">Market</a></span>
      </div>
      <div class="k-hero">
        <h1>From Science to Livelihoods</h1>
        <p>یک پلتفرم، از علم تا معیشت — مدیریت هوشمند آب، خاک و سرزمین</p>
        <div class="k-row">
          <button class="k-btn primary" type="button">Primary Action</button>
          <button class="k-btn secondary" type="button">Secondary</button>
          <span class="k-badge ok">VALIDATED</span>
          <span class="k-badge warn">CALIBRATED</span>
        </div>
      </div>
      <div class="k-kpis">
        <div class="k-kpi"><div class="v">1.24</div><div class="l">Water m³/s</div></div>
        <div class="k-kpi"><div class="v">2.8</div><div class="l">Soil % SOC</div></div>
        <div class="k-kpi"><div class="v">32</div><div class="l">Climate mm</div></div>
      </div>
      <div class="k-sci">
        <div class="lab">Scientific Metric</div>
        <div class="val">1.24 <span class="unit">m³/s</span></div>
        <div class="meta">ایستگاه A · ±۰٫۳ · <span class="k-badge ok">VALIDATED</span></div>
      </div>
      <div class="k-row" style="justify-content:space-between">
        <strong style="font-size:.85rem">Data Table</strong>
      </div>
      <table class="k-table">
        <thead><tr><th>ماژول</th><th>وضعیت</th><th>لایه</th><th>منبع</th></tr></thead>
        <tbody>
          <tr><td>HyDroMA Engine</td><td><span class="k-badge ok">VALIDATED</span></td><td>L5</td><td class="mono">wflow 1.0.4</td></tr>
          <tr><td>Accounting</td><td><span class="k-badge warn">CALIBRATED</span></td><td>L9</td><td class="mono">custom</td></tr>
          <tr><td>Marketplace</td><td><span class="k-badge info">COMMERCE</span></td><td>L8</td><td class="mono">spree 6.0.5</td></tr>
        </tbody>
      </table>
      <div class="k-form">
        <div class="k-field"><label>نام</label><input placeholder="ورودی نمونه"></div>
        <div class="k-field"><label>ایمیل</label><input type="email" placeholder="name@example.com"></div>
        <div class="k-field"><label>وضعیت</label><select><option>فعال</option><option>غیرفعال</option></select></div>
        <div class="k-field"><label>منطقه</label><input placeholder="محدوده مطالعاتی"></div>
      </div>
      <div class="k-prod">
        <div class="k-product"><div class="ph"></div><div class="pb"><div class="pn">عسل کوهی (DEMO)</div><div class="pm">محصول روستایی</div><div class="pp">۲۴۵,۰۰۰ <span style="font-size:.8rem">تومان</span></div></div></div>
        <div class="k-product"><div class="ph"></div><div class="pb"><div class="pn">زعفران ممتاز (DEMO)</div><div class="pm">محصول محلی</div><div class="pp">۱,۸۰۰,۰۰۰ <span style="font-size:.8rem">تومان</span></div></div></div>
        <div class="k-product"><div class="ph"></div><div class="pb"><div class="pn">خدمات مشاوره (DEMO)</div><div class="pm">خدمت محلی</div><div class="pp">توافقی</div></div></div>
      </div>
      <div class="k-alerts">
        <div class="k-alert info">اطلاع‌رسانی — این یک پیام نمونه است.</div>
        <div class="k-alert success">موفقیت — عملیات با موفقیت انجام شد.</div>
        <div class="k-alert warning">هشدار — توجه لازم است.</div>
        <div class="k-alert error">خطا — عملیات شکست خورد.</div>
      </div>
      <div class="k-ft"><span>Eco Nojin · HyDroMA · Marketplace</span><span class="mono">DRAFT — NOT APPROVED</span></div>
    </div>`;
  }

  function buildPreview() {
    document.getElementById('kit-mount').innerHTML = kitHTML();
    document.querySelectorAll('[data-kit-theme]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-kit-theme]').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        const t = btn.dataset.kitTheme;
        document.getElementById('kit-root').classList.toggle('theme-B', t === 'B');
        document.getElementById('kit-theme-note').textContent = 'نمایش: مسیر ' + t;
      });
    });
  }

  // ---- decision register ----
  const DECISIONS = [
    { id: 'D-01', topic: 'انتخاب لوگوتایپ Eco Nojin', opts: ['Option 01 — Fraunces', 'Option 02 — Manrope', 'Option 03 — Fraunces Stacked'] },
    { id: 'D-02', topic: 'انتخاب لوگوتایپ HyDroMA', opts: ['Option 01 — Manrope Tight', 'Option 02 — DM Sans Clean', 'Option 03 — Manrope Contrast'] },
    { id: 'D-03', topic: 'انتخاب لوگوتایپ Nojin Marketplace', opts: ['Option 01 — DM Sans Mixed', 'Option 02 — Manrope Friendly', 'Option 03 — Fraunces Mixed'] },
    { id: 'D-04', topic: 'انتخاب مسیر رنگی A یا B', opts: ['A — Territory Teal', 'B — Warm / Royal Deep Blue'] },
    { id: 'D-05', topic: 'انتخاب فونت فارسی', opts: ['Vazirmatn', 'Estedad'] },
    { id: 'D-06', topic: 'انتخاب فونت لاتین', opts: ['Manrope', 'DM Sans', 'Inter (نیازمند افزودن)'] },
    { id: 'D-07', topic: 'انتخاب فونت داده و کد', opts: ['IBM Plex Mono', 'JetBrains Mono (نیازمند افزودن)'] },
    { id: 'D-08', topic: 'تأیید ساختار خانواده برند', opts: ['تأیید ساختار فعلی', 'نیازمند بازبینی'] }
  ];
  const STORE = 'eco-owner-decisions-v1';

  function loadDecisions() {
    try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
  }

  function buildDecisions() {
    const saved = loadDecisions();
    const body = document.getElementById('decision-body');
    body.innerHTML = DECISIONS.map(d => {
      const sel = saved[d.id] || '';
      return `
      <tr data-decision="${d.id}">
        <td><span class="d-id">${d.id}</span></td>
        <td>${d.topic}</td>
        <td>${sel ? '<span class="status-saved">THESAVED</span>'.replace('THESAVED','ثبت‌شده (محلی)') : '<span class="status-open">OPEN</span>'}</td>
        <td>
          <div class="choice-row">
            ${d.opts.map(o => `<button class="choice-btn ${o === sel ? 'sel' : ''}" data-opt="${o}" type="button">${o}</button>`).join('')}
          </div>
        </td>
      </tr>`;
    }).join('');
    body.querySelectorAll('.choice-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const tr = btn.closest('tr');
        tr.querySelectorAll('.choice-btn').forEach(x => x.classList.remove('sel'));
        btn.classList.add('sel');
        const td = tr.cells[2];
        td.innerHTML = '<span class="status-saved">انتخاب شد (محلی)</span>';
      });
    });
  }

  function saveDecisions() {
    const out = {};
    document.querySelectorAll('#decision-body tr').forEach(tr => {
      const id = tr.dataset.decision;
      const sel = tr.querySelector('.choice-btn.sel');
      if (sel) out[id] = sel.dataset.opt;
    });
    try {
      localStorage.setItem(STORE, JSON.stringify(out));
      document.getElementById('decision-msg').textContent = 'ذخیره شد — ' + Object.keys(out).length + ' انتخاب محلی. (هنوز نهایی نیست؛ در وضعیت OPEN/ثبت‌شده محلی.)';
    } catch (e) {
      document.getElementById('decision-msg').textContent = 'ذخیره‌سازی محلی در دسترس نیست.';
    }
  }

  function clearDecisions() {
    try { localStorage.removeItem(STORE); } catch (e) {}
    buildDecisions();
    document.getElementById('decision-msg').textContent = 'تمام انتخاب‌های محلی پاک شد. همه موارد OPEN هستند.';
  }

  // ---- direction toggle ----
  function initDir() {
    document.querySelectorAll('.dir-toggle button').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.dir-toggle button').forEach(x => x.classList.remove('active'));
        btn.classList.add('active');
        const dir = btn.dataset.dir;
        document.documentElement.setAttribute('dir', dir);
        document.documentElement.setAttribute('lang', dir === 'rtl' ? 'fa' : 'en');
      });
    });
  }

  // ---- top nav scroll spy ----
  function initNav() {
    const links = [...document.querySelectorAll('.topnav a')];
    const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const onScroll = () => {
      let cur = secs[0];
      for (const s of secs) { if (s.getBoundingClientRect().top <= 120) cur = s; }
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + cur.id));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ---- boot ----
  buildLogos();
  buildType();
  buildPreview();
  buildDecisions();
  initDir();
  initNav();
  document.getElementById('save-decisions').addEventListener('click', saveDecisions);
  document.getElementById('clear-decisions').addEventListener('click', clearDecisions);
})();