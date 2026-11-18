// Eco Nojin — public home-page internationalisation (fa default, en ready).
// Pure data + DOM-free resolvers are exported so they can be unit-tested in Node.
// RTL/LTR is driven by the language: fa => rtl, en => ltr.

export const LANGS = ['fa', 'en'];
export const DEFAULT_LANG = 'fa';
export const DEFAULT_THEME = 'A';

export const messages = {
  fa: {
    'meta.title': 'اکو نوژین | اکوسیستم سرزمین‌های زنده',
    'meta.description': 'اکو نوژین — اکوسیستم دیجیتال برای مدیریت، توسعه و احیای سرزمین‌های زنده: پلتفرم سرزمین، موتور علمی هیدروما و بازارگاه محصولات و خدمات محلی.',
    'a11y.skip': 'پرش به محتوای اصلی',
    'a11y.theme': 'پوستهٔ رنگی',
    'a11y.lang': 'زبان',
    'a11y.menuOpen': 'باز کردن منو',
    'a11y.menuClose': 'بستن منو',
    'a11y.backToTop': 'بازگشت به بالا',
    'brand.name': 'اکو نوژین',

    'nav.home': 'خانه',
    'nav.ecosystem': 'اکوسیستم',
    'nav.hydroma': 'هیدروما',
    'nav.marketplace': 'بازارگاه',
    'nav.services': 'خدمات',
    'nav.process': 'فرایند',
    'nav.about': 'مشارکت',
    'nav.cta': 'ورود',

    'hero.badge': 'پیش‌نمایش محصول — در حال توسعه',
    'hero.eyebrow': 'اکوسیستم دیجیتال برای سرزمین‌های زنده',
    'hero.title': 'سرزمین را با دانش احیا کنیم و با بازار به آن جان دهیم',
    'hero.subtitle': 'اکو نوژین علم، فناوری و معیشت را به هم پیوند می‌دهد: مدیریت سرزمین و جوامع، موتور علمی هیدروما برای تحلیل و شبیه‌سازی، و بازارگاه محصولات و خدمات محلی.',
    'hero.ctaPrimary': 'کاوش در هیدروما',
    'hero.ctaSecondary': 'آشنایی با بازارگاه',
    'hero.note': 'این نسخه در حال توسعه است؛ هیچ قابلیت مالی، کیف پول، توکن یا API عملیاتی فعال نیست.',
    'hero.visual.title': 'هیدروما — موتور علمی',

    'hydro.state.validated': 'اعتبارسنجی‌شده',
    'hydro.state.validatedShort': 'معتبر',
    'hydro.state.calibrated': 'کالیبره‌شده',
    'hydro.state.calibratedShort': 'کالیبره',
    'hydro.state.uncalibrated': 'کالیبره‌نشده',
    'hydro.state.uncalibratedShort': 'برآورد',

    'eco.eyebrow': 'اکوسیستم',
    'eco.title': 'سه محصول، یک اکوسیستم',
    'eco.subtitle': 'هر محصول مسئولیت مستقل دارد و از هستهٔ مشترک هویت، داده و قراردادها استفاده می‌کند.',
    'eco.link': 'بیشتر',
    'eco.card1.tag': 'پلتفرم',
    'eco.card1.title': 'اکو نوژین',
    'eco.card1.desc': 'پلتفرم مدیریت و توسعهٔ سرزمین‌ها و جوامع؛ از ثبت زمین و سازمان تا پایش و گزارش.',
    'eco.card1.resp': 'مسئولیت: مدیریت سرزمین، جوامع و خدمات',
    'eco.card2.tag': 'موتور علمی',
    'eco.card2.title': 'هیدروما',
    'eco.card2.desc': 'موتور علمی تحلیل و شبیه‌سازی محیطی؛ تبدیل داده‌های آب، خاک، اقلیم و ماهواره به نتایج قابل ردیابی.',
    'eco.card2.resp': 'مسئولیت: تحلیل، مدل‌سازی و اعتبار علمی',
    'eco.card3.tag': 'بازارگاه',
    'eco.card3.title': 'بازارگاه نوژین',
    'eco.card3.desc': 'بازارگاه محصولات و خدمات محلی برای اتصال تولیدکنندگان جوامع روستایی و عشایری به بازار.',
    'eco.card3.resp': 'مسئولیت: عرضه، تقاضا و خدمات اقتصادی',

    'hydro.eyebrow': 'موتور علمی',
    'hydro.title': 'هیدروما، موتور علمی اکوسیستم',
    'hydro.subtitle': 'از داده‌های محیطی تا تحلیل، شبیه‌سازی و پایش قابل ردیابی — با شفافیت در عدم‌قطعیت و اعتبار.',
    'hydro.g1.title': 'آب و هیدرولوژی',
    'hydro.g1.t1': 'هیدرولوژی و منابع آب',
    'hydro.g1.t2': 'آب‌های سطحی و زیرزمینی',
    'hydro.g1.t3': 'رواناب، فرسایش و فرایندهای سرزمینی',
    'hydro.g1.t4': 'حوضه‌های آبریز و تحلیل مکانی',
    'hydro.g2.title': 'خاک، اقلیم و پوشش گیاهی',
    'hydro.g2.t1': 'خاک و ویژگی‌های فیزیکی و شیمیایی',
    'hydro.g2.t2': 'اقلیم و شاخص‌های هواشناسی',
    'hydro.g2.t3': 'پوشش گیاهی و شاخص‌های زیستی',
    'hydro.g3.title': 'داده و مدل‌سازی',
    'hydro.g3.t1': 'سنجش از دور و تصاویر ماهواره‌ای',
    'hydro.g3.t2': 'مدل‌سازی و شبیه‌سازی سناریوها',
    'hydro.g3.t3': 'ثبت منشأ داده و بازتولید نتایج',
    'hydro.g4.title': 'پایش و اعتبار علمی',
    'hydro.g4.t1': 'پایش و ارزیابی احیای سرزمین',
    'hydro.g4.t2': 'MRV و مدیریت شواهد',
    'hydro.g4.t3': 'عدم‌قطعیت، کالیبراسیون و اعتبارسنجی',
    'hydro.g4.t4': 'گزارش‌های علمی قابل استناد',
    'hydro.noteLabel': 'وضعیت توسعه:',
    'hydro.note': 'در حال حاضر نسخهٔ اولیهٔ موتور تراز آب پیاده‌سازی شده و اعتبارسنجی علمی آن انجام نشده است (NOT_VALIDATED)؛ سایر قابلیت‌ها در حال توسعه‌اند.',

    'restore.eyebrow': 'روایت',
    'restore.title': 'از تخریب تا احیا',
    'restore.subtitle': 'یک تصویرسازی مفهومی از تغییر تدریجی سرزمین — برای نشان‌دادن مسیر پایش و احیا، نه نتیجهٔ یک پروژهٔ واقعی.',
    'restore.before': 'پیش از احیا',
    'restore.after': 'پس از احیا',
    'restore.note': 'تصویرسازی مفهومی (Demo) — داده یا نتیجهٔ واقعی نیست.',

    'market.eyebrow': 'بازارگاه',
    'market.title': 'بازارگاه نوژین',
    'market.subtitle': 'بازارگاه محصولات و خدمات جوامع روستایی، عشایری و کشاورزی — در حال توسعه.',
    'market.cat1.title': 'محصولات روستایی',
    'market.cat1.desc': 'محصولات محلی با داستان و منشأ مشخص.',
    'market.cat2.title': 'محصولات عشایری',
    'market.cat2.desc': 'تولیدات جوامع عشایری و کوچ‌نشین.',
    'market.cat3.title': 'محصولات کشاورزی',
    'market.cat3.desc': 'محصولات کشاورزی و فرآوری‌شدهٔ محلی.',
    'market.cat4.title': 'صنایع‌دستی و تولیدات محلی',
    'market.cat4.desc': 'صنایع‌دستی و تولیدات خانگی و کارگاهی.',
    'market.cat5.title': 'خدمات گردشگری و اقامت',
    'market.cat5.desc': 'اقامت، تور و خدمات گردشگری محلی.',
    'market.cat6.title': 'تجربه‌های فرهنگی و بوم‌گردی',
    'market.cat6.desc': 'تجربه‌های فرهنگی و بوم‌گردی با راهنمای محلی.',
    'market.cat7.title': 'خدمات مرتبط با سرزمین',
    'market.cat7.desc': 'خدمات مبتنی بر سرزمین و منابع محلی.',
    'market.note': 'بازارگاه در حال توسعه است؛ خرید و فروش عملیاتی در این نسخه فعال نیست.',

    'services.eyebrow': 'خدمات',
    'services.title': 'خدمات اکوسیستم',
    'services.subtitle': 'قابلیت‌های مشترکی که سه محصول را به هم متصل می‌کنند.',
    'services.item1.title': 'مدیریت سرزمین و پارسل',
    'services.item1.desc': 'ثبت و مدیریت روستا، مرتع، مزرعه و حوضهٔ آبریز با موقعیت مکانی.',
    'services.item2.title': 'داده‌های مکانی و تحلیل',
    'services.item2.desc': 'نقشه، کاشی و تحلیل رستر/وکتور بر پایهٔ استانداردهای باز.',
    'services.item3.title': 'پایش و ارزیابی',
    'services.item3.desc': 'پایش و راستی‌آزمایی شاخص‌های احیا با شواهد مستند.',
    'services.item4.title': 'دانش و مشارکت جوامع',
    'services.item4.desc': 'دانش بومی، آموزش و مشارکت محلی در تصمیم‌سازی.',
    'services.item5.title': 'هوش مصنوعی و اتوماسیون کنترل‌شده',
    'services.item5.desc': 'دستیارهای محدود با ابزارهای کنترل‌شده و تأیید انسانی.',
    'services.item6.title': 'داشبوردها و گزارش‌های مدیریتی',
    'services.item6.desc': 'نمای شفاف و قابل استناد برای تصمیم‌گیری مدیریتی.',
    'services.item7.title': 'خدمات اقتصادی و بازارگاه',
    'services.item7.desc': 'اتصال محصولات و خدمات به بازار؛ در حد معرفی مفهومی.',

    'process.eyebrow': 'فرایند',
    'process.title': 'فرایند کار در اکوسیستم',
    'process.subtitle': 'از ثبت سرزمین تا اتصال به بازار، در شش گام.',
    'process.step1.title': 'ثبت سرزمین یا جامعه',
    'process.step1.desc': 'مزرعه، مرتع، حوضه یا جامعه را با موقعیت و مشخصات ثبت کنید.',
    'process.step2.title': 'گردآوری داده‌ها',
    'process.step2.desc': 'داده‌های محیطی، ماهواره‌ای و میدانی گردآوری می‌شود.',
    'process.step3.title': 'تحلیل و مدل‌سازی علمی',
    'process.step3.desc': 'هیدروما داده‌ها را پردازش و مدل می‌کند.',
    'process.step4.title': 'پایش و ارزیابی',
    'process.step4.desc': 'نتایج با شواهد و عدم‌قطعیت پایش می‌شود.',
    'process.step5.title': 'تصمیم‌سازی و اجرای برنامه',
    'process.step5.desc': 'برنامهٔ مدیریت و احیا تدوین و اجرا می‌شود.',
    'process.step6.title': 'اتصال به بازارگاه',
    'process.step6.desc': 'محصولات و خدمات به بازار متصل می‌شوند.',

    'invite.eyebrow': 'مشارکت',
    'invite.title': 'به احیای سرزمین بپیوندید',
    'invite.subtitle': 'اکو نوژین برای کاربران، تولیدکنندگان، جوامع محلی، پژوهشگران و سازمان‌ها ساخته می‌شود.',
    'invite.aud1': 'کاربران و مالکان سرزمین',
    'invite.aud2': 'تولیدکنندگان و کسب‌وکارهای محلی',
    'invite.aud3': 'جوامع روستایی و عشایری',
    'invite.aud4': 'پژوهشگران و متخصصان',
    'invite.aud5': 'سازمان‌ها و نهادها',
    'invite.ctaPrimary': 'آشنایی با هیدروما',
    'invite.ctaSecondary': 'دیدن مسیر کار',

    'footer.tagline': 'اکوسیستم دیجیتال برای مدیریت، توسعه و احیای سرزمین‌های زنده.',
    'footer.product': 'محصولات',
    'footer.services': 'خدمات',
    'footer.resources': 'منابع',
    'footer.company': 'ارتباط',
    'footer.link.product1': 'اکو نوژین',
    'footer.link.product2': 'هیدروما',
    'footer.link.product3': 'بازارگاه نوژین',
    'footer.link.svc1': 'مدیریت سرزمین',
    'footer.link.svc2': 'داده و تحلیل مکانی',
    'footer.link.svc3': 'پایش و ارزیابی',
    'footer.link.res1': 'معرفی اکوسیستم',
    'footer.link.res2': 'موتور علمی',
    'footer.link.res3': 'مسیر کار',
    'footer.link.about1': 'درباره',
    'footer.link.about2': 'تماس',
    'footer.link.about3': 'مشارکت',
    'footer.copyright': '© ۲۰۲۶ کشت و صنعت دشت امید نارون. تمامی حقوق محفوظ است.',
    'footer.status': 'وضعیت توسعه: پیش‌نمایش — بخش‌هایی در حال توسعه‌اند.',
    'footer.disclaimer': 'هیچ قابلیت مالی، کیف پول، توکن، پرداخت، احراز هویت یا API عملیاتی فعال نیست.',
    'footer.built': 'معاونت فناوری و تحول دیجیتال اکو نوژین',
  },

  en: {
    'meta.title': 'Eco Nojin | Ecosystem for living lands',
    'meta.description': 'Eco Nojin — a digital ecosystem for managing, developing and restoring living lands: a land platform, the HyDroMA scientific engine, and a marketplace for local products and services.',
    'a11y.skip': 'Skip to main content',
    'a11y.theme': 'Colour theme',
    'a11y.lang': 'Language',
    'a11y.menuOpen': 'Open menu',
    'a11y.menuClose': 'Close menu',
    'a11y.backToTop': 'Back to top',
    'brand.name': 'Eco Nojin',

    'nav.home': 'Home',
    'nav.ecosystem': 'Ecosystem',
    'nav.hydroma': 'HyDroMA',
    'nav.marketplace': 'Marketplace',
    'nav.services': 'Services',
    'nav.process': 'Process',
    'nav.about': 'Participate',
    'nav.cta': 'Sign in',

    'hero.badge': 'Product preview — in development',
    'hero.eyebrow': 'A digital ecosystem for living lands',
    'hero.title': 'Restore land with knowledge, and bring it to life with markets',
    'hero.subtitle': 'Eco Nojin connects science, technology and livelihoods: land and community management, the HyDroMA scientific engine for analysis and simulation, and a marketplace for local products and services.',
    'hero.ctaPrimary': 'Explore HyDroMA',
    'hero.ctaSecondary': 'Discover the marketplace',
    'hero.note': 'This version is in development; no financial feature, wallet, token or operational API is active.',
    'hero.visual.title': 'HyDroMA — scientific engine',

    'hydro.state.validated': 'Validated',
    'hydro.state.validatedShort': 'Valid',
    'hydro.state.calibrated': 'Calibrated',
    'hydro.state.calibratedShort': 'Calibrated',
    'hydro.state.uncalibrated': 'Uncalibrated',
    'hydro.state.uncalibratedShort': 'Estimate',

    'eco.eyebrow': 'Ecosystem',
    'eco.title': 'Three products, one ecosystem',
    'eco.subtitle': 'Each product has its own responsibility and shares a common core of identity, data and contracts.',
    'eco.link': 'More',
    'eco.card1.tag': 'Platform',
    'eco.card1.title': 'Eco Nojin',
    'eco.card1.desc': 'Platform to manage and develop lands and communities; from land and organisation registration to monitoring and reporting.',
    'eco.card1.resp': 'Responsibility: land, communities and services',
    'eco.card2.tag': 'Scientific engine',
    'eco.card2.title': 'HyDroMA',
    'eco.card2.desc': 'Scientific engine for environmental analysis and simulation; turns water, soil, climate and satellite data into traceable results.',
    'eco.card2.resp': 'Responsibility: analysis, modelling and scientific validity',
    'eco.card3.tag': 'Marketplace',
    'eco.card3.title': 'Nojin Marketplace',
    'eco.card3.desc': 'Marketplace for local products and services connecting rural and nomadic producers to the market.',
    'eco.card3.resp': 'Responsibility: supply, demand and economic services',

    'hydro.eyebrow': 'Scientific engine',
    'hydro.title': 'HyDroMA, the ecosystem’s scientific engine',
    'hydro.subtitle': 'From environmental data to traceable analysis, simulation and monitoring — with transparency about uncertainty and validity.',
    'hydro.g1.title': 'Water & hydrology',
    'hydro.g1.t1': 'Hydrology and water resources',
    'hydro.g1.t2': 'Surface and groundwater',
    'hydro.g1.t3': 'Runoff, erosion and landscape processes',
    'hydro.g1.t4': 'Catchments and spatial analysis',
    'hydro.g2.title': 'Soil, climate and vegetation',
    'hydro.g2.t1': 'Soil physical and chemical properties',
    'hydro.g2.t2': 'Climate and weather indices',
    'hydro.g2.t3': 'Vegetation and biological indicators',
    'hydro.g3.title': 'Data & modelling',
    'hydro.g3.t1': 'Remote sensing and satellite imagery',
    'hydro.g3.t2': 'Scenario modelling and simulation',
    'hydro.g3.t3': 'Data provenance and reproducibility',
    'hydro.g4.title': 'Monitoring & scientific validity',
    'hydro.g4.t1': 'Land restoration monitoring and evaluation',
    'hydro.g4.t2': 'MRV and evidence management',
    'hydro.g4.t3': 'Uncertainty, calibration and validation',
    'hydro.g4.t4': 'Citable scientific reports',
    'hydro.noteLabel': 'Development status:',
    'hydro.note': 'Currently only an initial water-balance engine is implemented and has not been scientifically validated (NOT_VALIDATED); other capabilities are in development.',

    'restore.eyebrow': 'Story',
    'restore.title': 'From degradation to restoration',
    'restore.subtitle': 'A conceptual illustration of gradual land change — to show the monitoring and restoration path, not the result of a real project.',
    'restore.before': 'Before restoration',
    'restore.after': 'After restoration',
    'restore.note': 'Conceptual illustration (Demo) — not real data or a real result.',

    'market.eyebrow': 'Marketplace',
    'market.title': 'Nojin Marketplace',
    'market.subtitle': 'Marketplace for products and services of rural, nomadic and agricultural communities — in development.',
    'market.cat1.title': 'Rural products',
    'market.cat1.desc': 'Local products with a clear story and origin.',
    'market.cat2.title': 'Nomadic products',
    'market.cat2.desc': 'Produce of nomadic and pastoral communities.',
    'market.cat3.title': 'Agricultural products',
    'market.cat3.desc': 'Agricultural and locally processed products.',
    'market.cat4.title': 'Handicrafts and local production',
    'market.cat4.desc': 'Handicrafts and home or workshop production.',
    'market.cat5.title': 'Tourism and accommodation services',
    'market.cat5.desc': 'Local stays, tours and tourism services.',
    'market.cat6.title': 'Cultural experiences and ecotourism',
    'market.cat6.desc': 'Cultural and ecotourism experiences with local guides.',
    'market.cat7.title': 'Land-related services',
    'market.cat7.desc': 'Services based on land and local resources.',
    'market.note': 'The marketplace is in development; no operational buying or selling is active in this version.',

    'services.eyebrow': 'Services',
    'services.title': 'Ecosystem services',
    'services.subtitle': 'Shared capabilities that connect the three products.',
    'services.item1.title': 'Land and parcel management',
    'services.item1.desc': 'Register and manage villages, rangelands, farms and catchments with location.',
    'services.item2.title': 'Geospatial data and analysis',
    'services.item2.desc': 'Maps, tiles and raster/vector analysis on open standards.',
    'services.item3.title': 'Monitoring and evaluation',
    'services.item3.desc': 'Monitor and verify restoration indicators with documented evidence.',
    'services.item4.title': 'Community knowledge and participation',
    'services.item4.desc': 'Indigenous knowledge, training and local participation in decisions.',
    'services.item5.title': 'AI and controlled automation',
    'services.item5.desc': 'Bounded assistants with controlled tools and human approval.',
    'services.item6.title': 'Management dashboards and reports',
    'services.item6.desc': 'A transparent, citable view for management decisions.',
    'services.item7.title': 'Economic services and marketplace',
    'services.item7.desc': 'Connecting products and services to the market; conceptual overview only.',

    'process.eyebrow': 'Process',
    'process.title': 'How the ecosystem works',
    'process.subtitle': 'From registering land to connecting to the market, in six steps.',
    'process.step1.title': 'Register land or community',
    'process.step1.desc': 'Register a farm, rangeland, catchment or community with location and details.',
    'process.step2.title': 'Collect data',
    'process.step2.desc': 'Environmental, satellite and field data are collected.',
    'process.step3.title': 'Scientific analysis and modelling',
    'process.step3.desc': 'HyDroMA processes the data and runs the models.',
    'process.step4.title': 'Monitoring and evaluation',
    'process.step4.desc': 'Results are monitored with evidence and uncertainty.',
    'process.step5.title': 'Decision-making and action',
    'process.step5.desc': 'A management and restoration plan is prepared and executed.',
    'process.step6.title': 'Connect to marketplace',
    'process.step6.desc': 'Products and services are connected to the market.',

    'invite.eyebrow': 'Participate',
    'invite.title': 'Join the effort to restore land',
    'invite.subtitle': 'Eco Nojin is built for users, producers, local communities, researchers and organisations.',
    'invite.aud1': 'Land users and owners',
    'invite.aud2': 'Local producers and businesses',
    'invite.aud3': 'Rural and nomadic communities',
    'invite.aud4': 'Researchers and specialists',
    'invite.aud5': 'Organisations and institutions',
    'invite.ctaPrimary': 'Discover HyDroMA',
    'invite.ctaSecondary': 'See how it works',

    'footer.tagline': 'A digital ecosystem for managing, developing and restoring living lands.',
    'footer.product': 'Products',
    'footer.services': 'Services',
    'footer.resources': 'Resources',
    'footer.company': 'Contact',
    'footer.link.product1': 'Eco Nojin',
    'footer.link.product2': 'HyDroMA',
    'footer.link.product3': 'Nojin Marketplace',
    'footer.link.svc1': 'Land management',
    'footer.link.svc2': 'Geospatial data & analysis',
    'footer.link.svc3': 'Monitoring & evaluation',
    'footer.link.res1': 'Ecosystem overview',
    'footer.link.res2': 'Scientific engine',
    'footer.link.res3': 'How it works',
    'footer.link.about1': 'About',
    'footer.link.about2': 'Contact',
    'footer.link.about3': 'Participate',
    'footer.copyright': '© 2026 Dast-e Omid Narun Agro-Industry. All rights reserved.',
    'footer.status': 'Development status: preview — some sections are under development.',
    'footer.disclaimer': 'No financial feature, wallet, token, payment, authentication or operational API is active.',
    'footer.built': 'Digital Technology & Transformation Office, Eco Nojin',
  },
};

export function resolve(dict, key) {
  if (Object.prototype.hasOwnProperty.call(dict, key)) return dict[key];
  return key.split('.').reduce((acc, part) => (acc == null ? acc : acc[part]), dict);
}

export function translate(lang, key) {
  const dict = messages[lang] || messages[DEFAULT_LANG];
  const value = resolve(dict, key);
  if (value == null) throw new Error(`Missing i18n key "${key}" for lang "${lang}"`);
  return value;
}

export function flatten(dict) {
  const out = {};
  const walk = (obj, prefix) => {
    for (const [k, v] of Object.entries(obj)) {
      const key = prefix ? `${prefix}.${k}` : k;
      if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, key);
      else out[key] = v;
    }
  };
  walk(dict, '');
  return out;
}

export function isRtl(lang) {
  return lang === 'fa';
}

function setMetaContent(doc, selector, value) {
  const el = doc.querySelector(selector);
  if (el && value != null) el.setAttribute('content', value);
}

// Apply a language to the document (DOM). Safe to import in Node; only touches
// the DOM when actually called with a root.
export function applyLanguage(lang, root) {
  const doc = root || (typeof document !== 'undefined' ? document : null);
  if (!doc) return;
  const dict = messages[lang] || messages[DEFAULT_LANG];
  const html = doc.documentElement;
  html.lang = lang;
  html.dir = isRtl(lang) ? 'rtl' : 'ltr';

  doc.querySelectorAll('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    const value = resolve(dict, key);
    if (value != null) el.textContent = value;
  });
  doc.querySelectorAll('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    const value = resolve(dict, key);
    if (value != null) el.setAttribute('aria-label', value);
  });

  const title = resolve(dict, 'meta.title');
  if (title) {
    doc.title = title;
    setMetaContent(doc, 'meta[property="og:title"]', title);
  }
  const desc = resolve(dict, 'meta.description');
  if (desc) {
    setMetaContent(doc, 'meta[name="description"]', desc);
    setMetaContent(doc, 'meta[property="og:description"]', desc);
  }

  doc.querySelectorAll('[data-lang-set]').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.getAttribute('data-lang-set') === lang));
  });
}