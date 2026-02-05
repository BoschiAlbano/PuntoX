"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { defaultQueryOptions } from "@/lib/react-query/queryDefaults";

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
            // Configuración por defecto optimizada (puede ser sobrescrita por queries individuales)
            staleTime: 30 * 1000, // 30 segundos por defecto (datos dinámicos)
            gcTime: 5 * 60 * 1000, // 5 minutos
            ...defaultQueryOptions, // Aplicar optimizaciones por defecto
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
