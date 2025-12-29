"use client";

import { usePagePermission } from "@/lib/permissions/usePagePermission";
import Loading from "@/components/loading/loading";

interface ProtectedPageProps {
  children: React.ReactNode;
}

/**
 * Componente wrapper que verifica permisos antes de mostrar el contenido
 * Redirige automáticamente si el usuario no tiene permiso para la página actual
 */
export default function ProtectedPage({ children }: ProtectedPageProps) {
  const { tieneAcceso, isLoading } = usePagePermission();

  if (isLoading) {
    return <Loading />;
  }

  if (!tieneAcceso) {
    return null; // El hook ya redirige, solo mostramos nada mientras redirige
  }

  return <>{children}</>;
}





