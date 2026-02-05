/**
 * Helper para renderizar componentes con todos los providers necesarios
 * para tests de UI
 * 
 * IMPORTANTE: Importar este archivo automáticamente carga el setup de UI
 */

// Cargar setup de UI automáticamente
import "../setup-ui";

import React from "react";
import { render, RenderOptions } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HeroUIProvider } from "@heroui/react";
import { I18nProvider } from "@react-aria/i18n";
import { useUserStore } from "@/store/useUserStore";

// Crear un QueryClient por defecto para tests
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

interface RenderWithProvidersOptions extends Omit<RenderOptions, "wrapper"> {
  // Opciones para mockear el store de usuario
  userStoreState?: {
    user?: any;
    branches?: any[];
    currentBranch?: any;
    permissions?: string[];
    roles?: any[];
  };
  // QueryClient personalizado (opcional)
  queryClient?: QueryClient;
}

/**
 * Renderiza un componente con todos los providers necesarios
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    userStoreState = {},
    queryClient = createTestQueryClient(),
    ...renderOptions
  }: RenderWithProvidersOptions = {}
) {
  // Mockear el store de usuario si se proporciona estado
  if (Object.keys(userStoreState).length > 0) {
    const store = useUserStore.getState();
    useUserStore.setState({
      ...store,
      ...userStoreState,
      isInitialized: true,
      isLoading: false,
    });
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <HeroUIProvider disableAnimation={true}>
        <QueryClientProvider client={queryClient}>
          <I18nProvider locale="es-AR">{children}</I18nProvider>
        </QueryClientProvider>
      </HeroUIProvider>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

// Re-exportar todo de @testing-library/react
export * from "@testing-library/react";
