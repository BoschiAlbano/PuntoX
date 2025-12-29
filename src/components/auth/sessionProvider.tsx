"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import type { TenantUser } from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type SupabaseAuthContextValue = {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  session: Session | null;
  user: TenantUser | null;
  status: AuthStatus;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(
  undefined
);

function resolveTenantId(metadata: Record<string, unknown> | undefined) {
  const hasKey = (key: string) =>
    metadata && Object.prototype.hasOwnProperty.call(metadata, key);
  const fromSnake = hasKey("tenant_id") ? metadata?.["tenant_id"] : undefined;
  const fromCamel = hasKey("tenantId") ? metadata?.["tenantId"] : undefined;

  const fallback =
    process.env.NEXT_PUBLIC_TENANT_ID || process.env.DEFAULT_TENANT_ID || null;
  return (
    (fromSnake as string | number | null | undefined) ??
    (fromCamel as string | number | null | undefined) ??
    fallback ??
    null
  );
}

const SessionProviderComponent = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setStatus(data.session ? "authenticated" : "unauthenticated");
      
      // Sincronizar permisos si hay sesión y no tiene permisos en JWT
      if (data.session?.user) {
        const metadata = data.session.user.app_metadata || {};
        const tienePermisos = Array.isArray(metadata.permissions) && metadata.permissions.length > 0;
        
        // Si no tiene permisos en JWT, sincronizar (solo una vez)
        if (!tienePermisos) {
          fetch("/api/auth/sync-permissions", { method: "POST" }).catch((err) => {
            console.warn("No se pudieron sincronizar permisos:", err);
          });
        }
      }
    };

    fetchSession();

    const { data } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setStatus(newSession ? "authenticated" : "unauthenticated");
      
      // Sincronizar permisos cuando hay un nuevo login
      if (event === "SIGNED_IN" && newSession?.user) {
        const metadata = newSession.user.app_metadata || {};
        const tienePermisos = Array.isArray(metadata.permissions) && metadata.permissions.length > 0;
        
        // Sincronizar permisos después del login
        if (!tienePermisos) {
          fetch("/api/auth/sync-permissions", { method: "POST" }).catch((err) => {
            console.warn("No se pudieron sincronizar permisos:", err);
          });
        }
      }
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(() => {
    const metadata = (session?.user?.app_metadata ?? {}) as Record<
      string,
      unknown
    >;
    const appMetadata = (session?.user?.app_metadata ?? {}) as Record<
      string,
      unknown
    >;
    const tenantId = resolveTenantId(metadata);
    const roleRaw = metadata?.["role"] ?? metadata?.["roll"];
    const role = typeof roleRaw === "string" ? roleRaw : null;
    const user: TenantUser | null = session?.user
      ? {
          id: session.user.id,
          email: session.user.email ?? undefined,
          tenantId,
          role: typeof role === "string" ? role : null,
          // app_metadata: metadata,
          app_metadata: appMetadata,
        }
      : null;

    return {
      supabase,
      session,
      user,
      status,
    };
  }, [session, supabase, status]);

  return (
    <SupabaseAuthContext.Provider value={value}>
      {children}
    </SupabaseAuthContext.Provider>
  );
};

export function useSupabaseAuthContext() {
  const ctx = useContext(SupabaseAuthContext);
  if (!ctx) {
    throw new Error(
      "useSupabaseAuthContext debe usarse dentro de SessionProviderComponent"
    );
  }
  return ctx;
}

export default SessionProviderComponent;
