"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Loading from "@/components/loading/loading";

export default function Layout({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/ventas");
    }
  }, [status, router]);

  // Mostrar loading mientras se verifica la autenticacion
  if (status === "loading") {
    return <Loading />;
  }

  // Si esta autenticado, no mostrar nada (se redirigira)
  if (status === "authenticated") {
    return null;
  }

  return <div>{children}</div>;
}
