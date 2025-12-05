"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/loading/loading";

export default function layout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/ventas");
    }
  }, [status, router]);

  // Mostrar loading mientras se verifica la autenticación
  if (status === "loading") {
    return <Loading />;
  }

  // Si está autenticado, no mostrar nada (se redirigirá)
  if (status === "authenticated") {
    return null;
  }

  return <div>{children}</div>;
}
