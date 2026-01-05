"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function QueryProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Configuración por defecto (puede ser sobrescrita por queries individuales)
            staleTime: 30 * 1000, // 30 segundos por defecto (datos dinámicos)
            // Tiempo que los datos permanecen en caché antes de ser eliminados
            gcTime: 5 * 60 * 1000, // 5 minutos (anteriormente cacheTime)
            // Reintentar 1 vez si falla
            retry: 1,
            // No re-fetch al cambiar de ventana por defecto
            refetchOnWindowFocus: false,
            // Re-fetch al montar solo si los datos están stale
            refetchOnMount: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
