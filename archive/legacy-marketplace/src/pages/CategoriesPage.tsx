import { Link } from "react-router-dom";
import { useI18n, type TranslationKey } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { CATEGORIES, PRODUCTS } from "../data/catalog";

const COPY = {
  title: { fa: "دسته‌بندی محصولات", en: "Product categories", ar: "فئات المنتجات" },
  subtitle: {
    fa: "چهار خانوادهٔ اصلی و زیرشاخه‌های آن‌ها؛ هر دسته به کاتالوگ فیلترشده وصل است.",
    en: "Four families and their leaves; every category links to a filtered catalogue.",
    ar: "أربع عائلات وفروعها؛ كل فئة مرتبطة بالكتالوج المفلتر.",
  },
  products: { fa: "محصول", en: "products", ar: "منتج" },
  browse: { fa: "دیدن محصولات", en: "Browse products", ar: "عرض المنتجات" },
  empty: { fa: "در این دسته محصولی نیست.", en: "No products in this category.", ar: "لا منتجات في هذه الفئة." },
} as const;

const pick = (locale: string, value: { fa: string; en: string; ar: string }): string =>
  locale === "fa" ? value.fa : locale === "ar" ? value.ar : value.en;

/**
 * Marketplace page #2 of the 120-page map.
 *
 * Categories are data (`CATEGORIES`), so the page cannot drift from the filter in
 * the catalogue: both read the same nodes and the same `categoryId` on products.
 */
export function CategoriesPage() {
  const { t, locale, format } = useI18n();

  const roots = CATEGORIES.filter((category) => category.parentId === null);
  const countOf = (categoryId: string): number =>
    PRODUCTS.filter((product) => product.categoryId === categoryId).length;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-fg">{pick(locale, COPY.title)}</h1>
        <p className="mt-1 max-w-2xl text-sm text-fg-muted">{pick(locale, COPY.subtitle)}</p>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        {roots.map((root) => {
          const children = CATEGORIES.filter((category) => category.parentId === root.id);
          return (
            <Card key={root.id}>
              <CardHeader
                title={t(root.labelKey as TranslationKey)}
                subtitle={`${format.number(children.reduce((sum, child) => sum + countOf(child.id), 0))} ${pick(locale, COPY.products)}`}
              />
              <CardBody>
                {children.length === 0 ? (
                  <p className="text-xs text-fg-muted">{pick(locale, COPY.empty)}</p>
                ) : (
                  <ul className="space-y-2">
                    {children.map((child) => {
                      const count = countOf(child.id);
                      return (
                        <li key={child.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0 last:pb-0">
                          <Link
                            to={`/catalog?category=${encodeURIComponent(child.id)}`}
                            className="text-xs font-medium text-fg hover:text-primary"
                          >
                            {t(child.labelKey as TranslationKey)}
                          </Link>
                          <Badge tone={count > 0 ? "success" : "neutral"}>
                            {format.number(count)} {pick(locale, COPY.products)}
                          </Badge>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <Link
                  to={`/catalog${children[0] ? `?category=${encodeURIComponent(children[0].id)}` : ""}`}
                  className="mt-3 inline-block text-2xs font-semibold text-primary hover:underline"
                >
                  {pick(locale, COPY.browse)} ←
                </Link>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
