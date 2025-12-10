"use client";
import React, { useEffect } from "react";
import { useSupabaseAuthContext } from "@/components/auth/sessionProvider";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

export default function Page() {
  const supabase = getSupabaseBrowserClient();
  const { user, session } = useSupabaseAuthContext();
  const roleFromMetadata =
    typeof user?.user_metadata?.role === "string"
      ? user.user_metadata.role
      : null;
  const tenantFromMetadata = user?.user_metadata?.tenant_id as
    | string
    | number
    | null
    | undefined;

  // En tu componente React/Next.js o similar
  useEffect(() => {
    async function getArticulos() {
      // Aquí asumo que 'supabase' es tu cliente ya inicializado y autenticado
      let { data: Articulo, error } = await supabase
        .from("Articulo")
        .select("*");

      if (error) {
        console.error("Error al obtener artículos:", error);
      } else {
        console.log("Artículos recibidos:", Articulo);
      }
    }

    getArticulos();
  }, []);

  return (
    <div>
      <h1>Session user id: {session?.user?.id}</h1>
      <h1>Email: {user?.email}</h1>
      <h1>Role: {user?.role || roleFromMetadata}</h1>
      <h1>TenantId: {user?.tenantId ?? tenantFromMetadata}</h1>

      {/* user y session */}
      <pre>{JSON.stringify(user, null, 2)}</pre>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
