import { useMemo } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { Badge, Card, CardBody, CardHeader } from "@eco-nojin/ui";
import { ApiBoundary, ApiEmpty } from "../../components/ApiState";
import { useCategories, useProducts, useSellers } from "../../services/hooks";
import { t as tl } from "../../content/ui";

type Loc = { fa: string; en: string; ar: string };

const L = {
  eyebrow: { fa: "دادهٔ واقعی از API", en: "Live data from the API", ar: "بيانات حية من الـ API" },
  title: { fa: "بازارگاه", en: "Marketplace", ar: "السوق" },
  products: { fa: "محصولات", en: "Products", ar: "المنتجات" },
  sellers: { fa: "فروشندگان", en: "Sellers", ar: "البائعون" },
  categories: { fa: "دسته‌بندی‌ها", en: "Categories", ar: "الفئات" },
  price: { fa: "قیمت", en: "Price", ar: "السعر" },
  stock: { fa: "موجودی", en: "Stock", ar: "المخزون" },
  unit: { fa: "واحد", en: "Unit", ar: "الوحدة" },
  verification: { fa: "وضعیت تأیید", en: "Verification", ar: "التحقق" },
  boundary: {
    fa: "این صفحه کاتالوگ واقعی را نشان می‌دهد. سفارش، پرداخت و تسویه هنوز سرویس ندارند و نمایش داده نمی‌شوند.",
    en: "This page shows the real catalog. Orders, payments and settlement have no service yet and are not shown.",
    ar: "تعرض هذه الصفحة الكتالوج الحقيقي. لا توجد بعد خدمة للطلبات أو الدفع أو التسوية ولا تُعرض.",
  },
};

function formatMinor(amountMinor: number, currency: string, locale: string): string {
  const major = amountMinor / 100;
  try {
    return new Intl.NumberFormat(locale === "fa" ? "fa-IR" : locale === "ar" ? "ar" : "en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(major);
  } catch {
    return `${major} ${currency}`;
  }
}

/** Real marketplace catalog: products, sellers and categories from the API. */
export function MarketplacePage() {
  const { locale } = useI18n();
  const l = (value: Loc) => tl(value, locale);
  const products = useProducts();
  const sellers = useSellers();
  const categories = useCategories();

  const sellerName = useMemo(() => {
    const map = new Map<string, string>();
    for (const seller of sellers.data?.items ?? []) map.set(seller.id, seller.name);
    return map;
  }, [sellers.data]);

  return (
    <div className="pl-stack">
      <header className="pl-pageHead">
        <div>
          <p className="pl-eyebrow">{l(L.eyebrow)}</p>
          <h1>{l(L.title)}</h1>
        </div>
      </header>

      <Card>
        <CardHeader title={l(L.products)} subtitle={products.data ? `${products.data.total}` : undefined} />
        <CardBody className="!p-0">
          <ApiBoundary state={products}>
            {(products.data?.items.length ?? 0) === 0 ? (
              <div className="p-4">
                <ApiEmpty />
              </div>
            ) : (
              <div className="pl-tableWrap">
                <table className="pl-table">
                  <thead>
                    <tr>
                      <th>{l(L.products)}</th>
                      <th>{l(L.price)}</th>
                      <th>{l(L.stock)}</th>
                      <th>{l(L.unit)}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.data!.items.map((product) => (
                      <tr key={product.id}>
                        <td>
                          <span className="pl-rowTitle">{product.name}</span>
                          {product.sellerId && sellerName.get(product.sellerId) ? (
                            <span className="pl-rowSub">{sellerName.get(product.sellerId)}</span>
                          ) : null}
                        </td>
                        <td>{formatMinor(product.price.amountMinor, product.price.currency, locale)}</td>
                        <td>{product.stock}</td>
                        <td>{product.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </ApiBoundary>
        </CardBody>
      </Card>

      <div className="pl-twoCol">
        <Card>
          <CardHeader title={l(L.sellers)} subtitle={sellers.data ? `${sellers.data.total}` : undefined} />
          <CardBody>
            <ApiBoundary state={sellers}>
              {(sellers.data?.items.length ?? 0) === 0 ? (
                <p className="pl-muted">—</p>
              ) : (
                <ul className="pl-list">
                  {sellers.data!.items.map((seller) => (
                    <li key={seller.id}>
                      <span className="pl-listTitle">{seller.name}</span>
                      <span className="pl-listMeta">{seller.kind}</span>
                      <Badge tone={seller.verification === "verified" ? "success" : "neutral"}>{seller.verification}</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </ApiBoundary>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={l(L.categories)} subtitle={categories.data ? `${categories.data.total}` : undefined} />
          <CardBody>
            <ApiBoundary state={categories}>
              {(categories.data?.items.length ?? 0) === 0 ? (
                <p className="pl-muted">—</p>
              ) : (
                <ul className="pl-chips">
                  {categories.data!.items.map((category) => (
                    <li key={category.id} className="pl-chip">
                      {category.labelKey}
                    </li>
                  ))}
                </ul>
              )}
            </ApiBoundary>
          </CardBody>
        </Card>
      </div>

      <p className="pl-note">{l(L.boundary)}</p>
    </div>
  );
}