import {
  UseQueryOptions,
  keepPreviousData,
} from "@tanstack/react-query";

/**
 * Configuración por defecto optimizada para queries
 * Aplica las mejores prácticas para evitar queries canceladas y mejorar UX
 */
export const defaultQueryOptions = {
  // No refetch innecesarios
  refetchOnMount: false,
  refetchOnWindowFocus: false,

  // Retry optimizado
  retry: 1,
  retryOnMount: false,

  // Mantener datos anteriores visibles al cambiar página/filtros (evita parpadeo)
  placeholderData: keepPreviousData,

  // Network mode
  networkMode: "online" as const,
} satisfies Partial<UseQueryOptions<any, any, any, any>>;

/**
 * Configuración para queries de datos estáticos (marcas, rubros, etc.)
 */
export const staticDataQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 10 * 60 * 1000, // 10 minutos
  gcTime: 30 * 60 * 1000, // 30 minutos
} satisfies Partial<UseQueryOptions<any, any, any, any>>;

/**
 * Configuración para queries de datos dinámicos (listados, búsquedas, paginación)
 * staleTime: 0 + refetchOnMount: true = stale-while-revalidate genérico.
 * Cualquier página muestra el cache inmediatamente y refresca en background al montar,
 * sin necesidad de mapear dependencias entre entidades.
 */
export const dynamicDataQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 0, // siempre stale → refetchea en background al montar
  gcTime: 5 * 60 * 1000, // 5 minutos
  refetchOnMount: true, // override: refresca al navegar a cualquier página
  refetchOnWindowFocus: true, // override: refresca al volver al foco de la ventana
} satisfies Partial<UseQueryOptions<any, any, any, any>>;

/**
 * Configuración para queries de analíticas/reportes
 */
export const analyticsQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 60 * 1000, // 1 minuto
  gcTime: 5 * 60 * 1000, // 5 minutos
} satisfies Partial<UseQueryOptions<any, any, any, any>>;



