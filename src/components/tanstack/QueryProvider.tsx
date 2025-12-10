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
            // Tiempo que los datos se consideran frescos (no se re-fetch)
            // staleTime: 5 * 60 * 1000, // 5 minutos de caché global
            staleTime: Infinity,
            // Reintentar 1 vez si falla
            retry: 1,
            // No re-fetch al cambiar de ventana por defecto (opcional)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
