import { useI18n } from "@eco-nojin/i18n";
import { ErrorBoundary } from "@eco-nojin/frontend-core";

/**
 * Applies translated labels to the shared boundary. It sits inside the
 * providers, so a render failure anywhere below it still gets localized copy.
 */
export function ShellErrorBoundary({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();
  return (
    <ErrorBoundary
      labels={{
        title: t("common.errorTitle"),
        body: t("common.errorBody"),
        retry: t("common.retry"),
        reload: t("common.backHome"),
      }}
    >
      {children}
    </ErrorBoundary>
  );
}