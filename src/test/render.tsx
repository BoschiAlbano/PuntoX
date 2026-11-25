/**
 * Helpers de render para tests de componentes.
 */
import type { ReactElement } from "react";
import { render } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Renderiza dentro de un QueryClientProvider nuevo (sin reintentos), para
 * componentes que usan hooks de React Query directa o indirectamente
 * (useGenericApi, useConfiguracion, useQuery, useQueryClient...).
 */
export function renderWithQueryClient(ui: ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
    ),
  };
}
