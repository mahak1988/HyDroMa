import type { CategoryNode, Product, Seller } from "@eco-nojin/domain-types";

/** Roots + leaves; the catalog filter treats leaves as selectable categories. */
export const CATEGORIES: CategoryNode[] = [
  { id: "products", labelKey: "market.roots.products", parentId: null },
  { id: "supplies", labelKey: "market.roots.supplies", parentId: null },
  { id: "services", labelKey: "market.roots.services", parentId: null },
  { id: "tourism", labelKey: "market.roots.tourism", parentId: null },
  { id: "partnership", labelKey: "market.roots.partnership", parentId: null },

  { id: "produce", labelKey: "market.categories.cat1", parentId: "products" },
  { id: "livestock", labelKey: "market.categories.cat2", parentId: "products" },
  { id: "processed", labelKey: "market.categories.cat3", parentId: "products" },
  { id: "local-food", labelKey: "market.categories.cat4", parentId: "products" },
  { id: "handicrafts", labelKey: "market.categories.cat5", parentId: "products" },
  { id: "cultural", labelKey: "market.categories.cat6", parentId: "products" },

  { id: "inputs", labelKey: "market.categories.cat7", parentId: "supplies" },
  { id: "machinery", labelKey: "market.categories.cat8", parentId: "supplies" },

  { id: "technical", labelKey: "market.categories.cat9", parentId: "services" },
  { id: "environmental", labelKey: "market.categories.cat10", parentId: "services" },
  { id: "restoration", labelKey: "market.categories.cat11", parentId: "services" },
  { id: "logistics", labelKey: "market.categories.cat14", parentId: "services" },

  { id: "tourism-rural", labelKey: "market.categories.cat12", parentId: "tourism" },
  { id: "stays", labelKey: "market.categories.cat13", parentId: "tourism" },

  { id: "partnership-offers", labelKey: "market.categories.cat15", parentId: "partnership" },
];

/** Leaf categories only (what the filter lists). */
export const LEAF_CATEGORIES = CATEGORIES.filter((item) => item.parentId !== null);

const BASE_SELLERS: Seller[] = [
  {
    id: "sel-kondor",
    slug: "kondor-village",
    name: "Kondor Village Producers",
    kind: "rural-producer",
    country: "IR",
    region: "Alborz",
    summary: "A village collective selling seasonal produce, dairy and preserved foods.",
    locale: "fa",
    verification: "verified",
    landscapeRef: "land-kondor",
  },
  {
    id: "sel-taleghan",
    slug: "taleghan-nomads",
    name: "Taleghan Nomadic Cooperative",
    kind: "nomadic-community",
    country: "IR",
    region: "Taleghan",
    summary: "Nomadic families offering dairy, wool crafts and seasonal stays.",
    locale: "fa",
    verification: "pending",
    landscapeRef: "land-taleghan",
  },
  {
    id: "sel-karaj",
    slug: "karaj-watershed-coop",
    name: "Karaj Watershed Cooperative",
    kind: "cooperative",
    country: "IR",
    region: "Karaj",
    summary: "A watershed cooperative aggregating smallholder production.",
    locale: "fa",
    verification: "verified",
    landscapeRef: "land-karaj",
  },
  {
    id: "sel-zagros-farm",
    slug: "zagros-field-farm",
    name: "Zagros Field Farm",
    kind: "farm",
    country: "IR",
    region: "Zagros",
    summary: "Rain-fed orchards and dryland cereals with field-level records.",
    locale: "fa",
    verification: "verified",
    landscapeRef: null,
  },
  {
    id: "sel-kondor-workshop",
    slug: "kondor-weaving-workshop",
    name: "Kondor Weaving Workshop",
    kind: "workshop",
    country: "IR",
    region: "Alborz",
    summary: "Handwoven textiles and natural dye work.",
    locale: "fa",
    verification: "pending",
    landscapeRef: "land-kondor",
  },
  {
    id: "sel-karaj-services",
    slug: "karaj-land-services",
    name: "Karaj Land Services",
    kind: "service-provider",
    country: "IR",
    region: "Karaj",
    summary: "Soil testing, irrigation design and restoration supervision.",
    locale: "fa",
    verification: "verified",
    landscapeRef: "land-karaj",
  },
  {
    id: "sel-taleghan-tourism",
    slug: "taleghan-eco-stays",
    name: "Taleghan Eco Stays",
    kind: "tourism-operator",
    country: "IR",
    region: "Taleghan",
    summary: "Community-run stays and guided rangeland walks.",
    locale: "fa",
    verification: "pending",
    landscapeRef: "land-taleghan",
  },
  {
    id: "sel-kondor-supply",
    slug: "kondor-farm-supply",
    name: "Kondor Farm Supply",
    kind: "equipment-supplier",
    country: "IR",
    region: "Alborz",
    summary: "Drip irrigation kits, tools and seed for smallholders.",
    locale: "fa",
    verification: "unverified",
    landscapeRef: null,
  },
];

const claims = (items: Array<[string, "verified" | "pending" | "unverified"]>) =>
  items.map(([label, status]) => ({ label, status }));
/** Persian and Arabic seller summaries (the English text stays the fallback). */
const SUMMARY_I18N: Record<string, { fa: string; ar: string }> = {
  "sel-kondor": {
    fa: "مجموعهٔ روستایی با تولید فصلی، لبنیات و غذاهای نگه‌داری‌شده.",
    ar: "مجموعة قروية تبيع المنتجات الموسمية والألبان والأطعمة المحفوظة.",
  },
  "sel-taleghan": {
    fa: "خانواده‌های عشایری با لبنیات، صنایع پشمی و اقامت فصلی.",
    ar: "أسر رعوية تقدم الألبان والحرف الصوفية والإقامة الموسمية.",
  },
  "sel-karaj": {
    fa: "تعاونی آبخیز که تولید خرده‌بهره‌برداران را تجمیع می‌کند.",
    ar: "تعاونية حوض تجمع إنتاج صغار المزارعين.",
  },
  "sel-zagros-farm": {
    fa: "باغ‌های دیم و غلات با سوابق ثبت‌شده در سطح مزرعه.",
    ar: "بساتين بعلية وحبوب مع سجلات على مستوى الحقل.",
  },
  "sel-kondor-workshop": {
    fa: "منسوجات دست‌باف و رنگ‌زایی طبیعی.",
    ar: "منسوجات يدوية وصباغة طبيعية.",
  },
  "sel-karaj-services": {
    fa: "آزمون خاک، طراحی آبیاری و نظارت بر احیا.",
    ar: "اختبار التربة وتصميم الري والإشراف على الاستعادة.",
  },
  "sel-taleghan-tourism": {
    fa: "اقامت‌های جامعه‌محور و پیاده‌روی راهنمادار در مرتع.",
    ar: "إقامات مجتمعية وجولات مرشدة في المراعي.",
  },
  "sel-kondor-supply": {
    fa: "کیت آبیاری قطره‌ای، ابزار و بذر برای خرده‌بهره‌برداران.",
    ar: "أطقم ري بالتنقيط وأدوات وبذور لصغار المزارعين.",
  },
};

export const SELLERS: Seller[] = BASE_SELLERS.map((seller) => ({
  ...seller,
  summaryI18n: SUMMARY_I18N[seller.id],
}));

export const PRODUCTS: Product[] = [
  {
    id: "p-01", slug: "saffron-kondor", sellerId: "sel-kondor", categoryId: "produce",
    name: "Kondor saffron", summary: "Hand-picked saffron from irrigated terraces.",
    description: "Saffron grown on family terraces in Kondor, dried and packed by the village collective. Harvest date and grade are recorded per batch.",
    price: { amountMinor: 12500000, currency: "IRR" }, unit: "box", minOrder: 1, stock: 42,
    season: "autumn", origin: "IR · Alborz · Kondor", shipping: "courier",
    claims: claims([["Hand-picked", "verified"], ["No synthetic dye", "pending"]]), artworkSeed: 11,
  },
  {
    id: "p-02", slug: "walnuts-kondor", sellerId: "sel-kondor", categoryId: "produce",
    name: "Kondor walnuts", summary: "Sun-dried walnut kernels, 1 kg lots.",
    description: "Walnuts from village orchards, cracked and sorted by hand. Storage guidance is included with each batch.",
    price: { amountMinor: 4800000, currency: "IRR" }, unit: "kg", minOrder: 2, stock: 120,
    season: "autumn", origin: "IR · Alborz · Kondor", shipping: "courier",
    claims: claims([["Sun-dried", "verified"]]), artworkSeed: 12,
  },
  {
    id: "p-03", slug: "nomad-dairy", sellerId: "sel-taleghan", categoryId: "livestock",
    name: "Nomadic dairy pack", summary: "Yogurt, curd and butter from seasonal herds.",
    description: "Dairy produced during the summer migration. Products are collected at camps and delivered chilled on fixed routes.",
    price: { amountMinor: 2100000, currency: "IRR" }, unit: "box", minOrder: 1, stock: 18,
    season: "summer", origin: "IR · Taleghan", shipping: "cold chain",
    claims: claims([["Seasonal herds", "verified"], ["Organic (not certified)", "unverified"]]), artworkSeed: 13,
  },
  {
    id: "p-04", slug: "nomad-wool", sellerId: "sel-taleghan", categoryId: "handicrafts",
    name: "Nomadic wool yarn", summary: "Hand-spun wool, undyed.",
    description: "Wool from migratory flocks, spun by hand. Natural colour varies by season and feed.",
    price: { amountMinor: 3200000, currency: "IRR" }, unit: "kg", minOrder: 1, stock: 35,
    season: null, origin: "IR · Taleghan", shipping: "courier",
    claims: claims([["Hand-spun", "verified"]]), artworkSeed: 14,
  },
  {
    id: "p-05", slug: "karaj-honey", sellerId: "sel-karaj", categoryId: "local-food",
    name: "Karaj watershed honey", summary: "Mountain honey from cooperative apiaries.",
    description: "Honey harvested by member beekeepers in the watershed. Each jar carries the apiary code and harvest month.",
    price: { amountMinor: 1450000, currency: "IRR" }, unit: "box", minOrder: 1, stock: 64,
    season: "summer", origin: "IR · Karaj", shipping: "courier",
    claims: claims([["Single-origin apiary", "verified"]]), artworkSeed: 15,
  },
  {
    id: "p-06", slug: "karaj-dried-fruit", sellerId: "sel-karaj", categoryId: "processed",
    name: "Dried fruit mix", summary: "Apricot, fig and raisin mix, 500 g.",
    description: "Fruit dried in solar tunnels by cooperative members; no sulphur treatment.",
    price: { amountMinor: 1850000, currency: "IRR" }, unit: "kg", minOrder: 2, stock: 88,
    season: "autumn", origin: "IR · Karaj", shipping: "courier",
    claims: claims([["No sulphur", "verified"], ["Organic (not certified)", "unverified"]]), artworkSeed: 16,
  },
  {
    id: "p-07", slug: "zagros-wheat", sellerId: "sel-zagros-farm", categoryId: "produce",
    name: "Zagros dryland wheat", summary: "Rain-fed wheat, cleaned, 25 kg sacks.",
    description: "Dryland wheat from the 2026 season. Protein content is recorded per field; the batch sheet is shared on request.",
    price: { amountMinor: 39000000, currency: "IRR" }, unit: "box", minOrder: 1, stock: 26,
    season: "summer", origin: "IR · Zagros", shipping: "freight",
    claims: claims([["Rain-fed", "verified"]]), artworkSeed: 17,
  },
  {
    id: "p-08", slug: "zagros-apples", sellerId: "sel-zagros-farm", categoryId: "produce",
    name: "Zagros orchard apples", summary: "Mixed varieties, 10 kg crates.",
    description: "Apples from rain-fed orchards, sorted by size and grade. Cold storage available for two weeks.",
    price: { amountMinor: 26000000, currency: "IRR" }, unit: "box", minOrder: 1, stock: 14,
    season: "autumn", origin: "IR · Zagros", shipping: "cold chain",
    claims: claims([["Rain-fed orchards", "verified"]]), artworkSeed: 18,
  },
  {
    id: "p-09", slug: "woven-runner", sellerId: "sel-kondor-workshop", categoryId: "handicrafts",
    name: "Handwoven table runner", summary: "Natural-dye cotton runner, 2 m.",
    description: "Woven on traditional looms; dyes from walnut husk and madder root.",
    price: { amountMinor: 5600000, currency: "IRR" }, unit: "piece", minOrder: 1, stock: 9,
    season: null, origin: "IR · Alborz · Kondor", shipping: "courier",
    claims: claims([["Natural dyes", "verified"], ["Fair-wage workshop", "pending"]]), artworkSeed: 19,
  },
  {
    id: "p-10", slug: "felt-slippers", sellerId: "sel-kondor-workshop", categoryId: "handicrafts",
    name: "Felt slippers", summary: "Warm felt slippers, sizes 36–45.",
    description: "Hand-felted wool slippers with leather soles. Size exchange is handled by the workshop.",
    price: { amountMinor: 2400000, currency: "IRR" }, unit: "piece", minOrder: 1, stock: 3,
    season: "winter", origin: "IR · Alborz · Kondor", shipping: "courier",
    claims: claims([["Handmade", "verified"]]), artworkSeed: 20,
  },
  {
    id: "p-11", slug: "drip-irrigation-kit", sellerId: "sel-kondor-supply", categoryId: "inputs",
    name: "Drip irrigation kit (0.5 ha)", summary: "Drip lines, filters and fittings for half a hectare.",
    description: "A starter drip kit for smallholdings, with a design sheet and replacement parts list.",
    price: { amountMinor: 78000000, currency: "IRR" }, unit: "piece", minOrder: 1, stock: 7,
    season: null, origin: "IR · Alborz", shipping: "freight",
    claims: claims([["Two-year warranty claim", "unverified"]]), artworkSeed: 21,
  },
  {
    id: "p-12", slug: "soil-test-package", sellerId: "sel-karaj-services", categoryId: "technical",
    name: "Soil test package", summary: "Texture, pH, EC, organic carbon and nutrients.",
    description: "Composite sampling guidance, laboratory analysis and an interpretation sheet with units.",
    price: { amountMinor: 9500000, currency: "IRR" }, unit: "service", minOrder: 1, stock: 100,
    season: null, origin: "IR · Karaj", shipping: "service",
    claims: claims([["Accredited lab partner", "pending"]]), artworkSeed: 22,
  },
  {
    id: "p-13", slug: "restoration-supervision", sellerId: "sel-karaj-services", categoryId: "restoration",
    name: "Restoration supervision (per ha)", summary: "Field supervision for rangeland restoration.",
    description: "Monthly field visits, survival surveys and a monitoring report aligned with the landscape record.",
    price: { amountMinor: 18000000, currency: "IRR" }, unit: "hectare", minOrder: 5, stock: 200,
    season: null, origin: "IR · Karaj", shipping: "service",
    claims: claims([["Certified agronomist", "verified"]]), artworkSeed: 23,
  },
  {
    id: "p-14", slug: "watershed-monitoring", sellerId: "sel-karaj-services", categoryId: "environmental",
    name: "Watershed monitoring plan", summary: "Indicator set, sampling schedule and reporting.",
    description: "Design of a monitoring plan for water, soil and vegetation indicators, with units and quality flags.",
    price: { amountMinor: 42000000, currency: "IRR" }, unit: "service", minOrder: 1, stock: 20,
    season: null, origin: "IR · Karaj", shipping: "service",
    claims: claims([["Aligned with HyDroMA contract", "verified"]]), artworkSeed: 24,
  },
  {
    id: "p-15", slug: "eco-stay-night", sellerId: "sel-taleghan-tourism", categoryId: "stays",
    name: "Community eco-stay (per night)", summary: "Family-run stay with breakfast.",
    description: "One night in a community guesthouse, including a morning walk with a local guide.",
    price: { amountMinor: 4200000, currency: "IRR" }, unit: "night", minOrder: 1, stock: 6,
    season: "spring", origin: "IR · Taleghan", shipping: "service",
    claims: claims([["Community-owned", "verified"]]), artworkSeed: 25,
  },
  {
    id: "p-16", slug: "rangeland-walk", sellerId: "sel-taleghan-tourism", categoryId: "tourism-rural",
    name: "Guided rangeland walk", summary: "Half-day walk with a nomadic guide.",
    description: "A half-day route across summer rangeland, led by a community guide, capped at eight visitors.",
    price: { amountMinor: 1900000, currency: "IRR" }, unit: "service", minOrder: 1, stock: 12,
    season: "summer", origin: "IR · Taleghan", shipping: "service",
    claims: claims([["Community guide", "verified"]]), artworkSeed: 26,
  },
  {
    id: "p-17", slug: "cold-logistics", sellerId: "sel-karaj", categoryId: "logistics",
    name: "Cold-chain delivery (regional)", summary: "Chilled delivery for dairy and produce.",
    description: "Regional cold-chain route; delivery windows are confirmed by the cooperative office.",
    price: { amountMinor: 6500000, currency: "IRR" }, unit: "service", minOrder: 1, stock: 40,
    season: null, origin: "IR · Karaj", shipping: "service",
    claims: claims([["Temperature-logged vehicle", "pending"]]), artworkSeed: 27,
  },
  {
    id: "p-18", slug: "date-box-export", sellerId: "sel-karaj", categoryId: "processed",
    name: "Export date box", summary: "Sorted dates, 5 kg export carton.",
    description: "Export-grade dates packed for European buyers; phytosanitary documents are handled per shipment.",
    price: { amountMinor: 1850, currency: "EUR" }, unit: "box", minOrder: 4, stock: 55,
    season: "autumn", origin: "IR · Karaj", shipping: "freight",
    claims: claims([["Export grade", "pending"], ["Organic (not certified)", "unverified"]]), artworkSeed: 28,
  },
  {
    id: "p-19", slug: "pistachio-export", sellerId: "sel-zagros-farm", categoryId: "produce",
    name: "Pistachio kernels (export)", summary: "Vacuum-packed kernels, 2 kg.",
    description: "Sorted pistachio kernels for export, with batch moisture and grade records.",
    price: { amountMinor: 4200, currency: "EUR" }, unit: "kg", minOrder: 2, stock: 22,
    season: "autumn", origin: "IR · Zagros", shipping: "freight",
    claims: claims([["Batch-tested", "pending"]]), artworkSeed: 29,
  },
  {
    id: "p-20", slug: "supply-contract", sellerId: "sel-karaj", categoryId: "partnership-offers",
    name: "Seasonal supply contract", summary: "Forward contract for cooperative produce.",
    description: "A framework for buyers to contract seasonal volumes with the cooperative, with quality and delivery terms.",
    price: { amountMinor: 0, currency: "IRR" }, unit: "service", minOrder: 1, stock: 1,
    season: null, origin: "IR · Karaj", shipping: "service",
    claims: claims([["Cooperative guarantee", "pending"]]), artworkSeed: 30,
  },
];

export const productBySlug = (slug: string): Product | undefined => PRODUCTS.find((item) => item.slug === slug);
export const sellerBySlug = (slug: string): Seller | undefined => SELLERS.find((item) => item.slug === slug);
export const sellerById = (id: string): Seller | undefined => SELLERS.find((item) => item.id === id);
export const categoryById = (id: string): CategoryNode | undefined => CATEGORIES.find((item) => item.id === id);
export const productsBySeller = (sellerId: string): Product[] => PRODUCTS.filter((item) => item.sellerId === sellerId);
export const featuredProducts = PRODUCTS.slice(0, 6);
export const featuredSellers = SELLERS.slice(0, 4);
export const COUNTRIES = [...new Set(SELLERS.map((item) => item.country))];