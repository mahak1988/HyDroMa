export { AppProviders, createQueryClient } from "./providers";
export { ErrorBoundary, type ErrorBoundaryLabels } from "./error-boundary";

/**
 * Server-state primitives, re-exported so an application declares one
 * dependency (`@eco-nojin/frontend-core`) instead of pinning TanStack Query
 * itself. Version drift is therefore impossible.
 */
export {
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type UseInfiniteQueryResult,
  type UseMutationResult,
  type UseQueryResult,
} from "@tanstack/react-query";
export { PermissionGate, useRouteAccess } from "./guard";
export { useFormState, type FormErrors, type FormResult, type FormState, type FormValidator } from "./form";
export { Can, PermissionProvider, usePermissions, type PermissionInput, type PermissionMap, type PermissionValue } from "./permission";
export { infiniteKey, invalidationKeys, queryKeysFactory, withScope, type QueryKey, type QueryKeys } from "./query-keys";
export { Registry, type RegistryItem, type RegistryOptions } from "@eco-nojin/domain-types";
export {
  ThemeProvider,
  useTheme,
  THEME_STORAGE_KEY,
  themeBootstrapScript,
  type ResolvedTheme,
  type ThemeMode,
} from "./theme";