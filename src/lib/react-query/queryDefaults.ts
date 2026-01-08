import { UseQueryOptions } from "@tanstack/react-query";

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
  
  // Mantener datos anteriores visibles mientras cargan nuevos (mejor UX)
  placeholderData: (previousData: any) => previousData,
  
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
 * Configuración para queries de datos dinámicos (listas, búsquedas)
 */
export const dynamicDataQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 30 * 1000, // 30 segundos
  gcTime: 5 * 60 * 1000, // 5 minutos
} satisfies Partial<UseQueryOptions<any, any, any, any>>;

/**
 * Configuración para queries de analíticas/reportes
 */
export const analyticsQueryOptions = {
  ...defaultQueryOptions,
  staleTime: 60 * 1000, // 1 minuto
  gcTime: 5 * 60 * 1000, // 5 minutos
} satisfies Partial<UseQueryOptions<any, any, any, any>>;



