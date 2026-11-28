import type { ReactNode } from "react";
import { useI18n } from "@eco-nojin/i18n";
import { Button, Card, CardBody, CardHeader, EmptyState, Skeleton } from "@eco-nojin/ui";
import { ApiError } from "@eco-nojin/api-client";
import { t as tl } from "../content/ui";

type Loc = { fa: string; en: string; ar: string };

function useLoc() {
  const { locale } = useI18n();
  return (value: Loc) => tl(value, locale);
}

const L = {
  loading: { fa: "در حال بارگذاری…", en: "Loading…", ar: "جارٍ التحميل…" },
  retry: { fa: "تلاش مجدد", en: "Try again", ar: "إعادة المحاولة" },
  errorTitle: { fa: "اتصال ناموفق", en: "Connection failed", ar: "فشل الاتصال" },
  network: {
    fa: "سرویس پاسخ نداد. اتصال یا دسترسی را بررسی کنید.",
    en: "The service did not respond. Check your connection or access.",
    ar: "لم تستجب الخدمة. تحقق من الاتصال أو الوصول.",
  },
  forbidden: {
    fa: "برای دیدن این داده به نقش بالاتر نیاز دارید.",
    en: "You need a higher role to view this data.",
    ar: "تحتاج إلى دور أعلى لعرض هذه البيانات.",
  },
  unauthenticated: {
    fa: "برای ادامه باید وارد شوید.",
    en: "Sign in to continue.",
    ar: "سجّل الدخول للمتابعة.",
  },
  notFound: { fa: "مورد یافت نشد.", en: "Record not found.", ar: "لم يُعثر على السجل." },
  empty: { fa: "هنوز داده‌ای ثبت نشده است.", en: "No data recorded yet.", ar: "لا توجد بيانات مسجلة بعد." },
  emptyHint: {
    fa: "این فهرست از API واقعی می‌آید؛ تا زمانی که سازمانی داده ثبت نکند خالی است.",
    en: "This list comes from the real API; it is empty until your organization records data.",
    ar: "تأتي هذه القائمة من الـ API الحقيقي؛ وهي فارغة حتى تسجل مؤسستك بيانات.",
  },
};

/** Loading placeholder for an API-backed region. */
export function ApiLoading({ label }: { label?: string }) {
  const l = useLoc();
  return (
    <div role="status" aria-live="polite" className="pl-stack">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-24 w-full" />
      <span className="sr-only">{label ?? l(L.loading)}</span>
    </div>
  );
}

/** Map an API error to an honest, localised message. */
function errorMessage(error: unknown, l: (v: Loc) => string): string {
  if (error instanceof ApiError) {
    if (error.status === 401 || error.code === "unauthenticated") return l(L.unauthenticated);
    if (error.status === 403 || error.code === "forbidden") return l(L.forbidden);
    if (error.status === 404 || error.code === "not_found") return l(L.notFound);
    if (error.code === "network" || error.code === "timeout" || error.code === "unavailable") return l(L.network);
  }
  return l(L.network);
}

/** Error region with a retry action; never silently swallows the failure. */
export function ApiErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const l = useLoc();
  return (
    <Card>
      <CardHeader title={l(L.errorTitle)} />
      <CardBody>
        <p className="pl-body">{errorMessage(error, l)}</p>
        {onRetry ? (
          <div className="mt-3">
            <Button variant="secondary" size="sm" onClick={onRetry}>
              {l(L.retry)}
            </Button>
          </div>
        ) : null}
      </CardBody>
    </Card>
  );
}

/** Empty region that makes clear the list is real but has no rows yet. */
export function ApiEmpty() {
  const l = useLoc();
  return <EmptyState title={l(L.empty)} body={l(L.emptyHint)} />;
}

/** Convenience wrapper: renders the right state for a query result. */
export function ApiBoundary({
  state,
  children,
}: {
  state: { isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown };
  children: ReactNode;
}) {
  if (state.isLoading) return <ApiLoading />;
  if (state.isError) return <ApiErrorState error={state.error} onRetry={() => void state.refetch()} />;
  return <>{children}</>;
}