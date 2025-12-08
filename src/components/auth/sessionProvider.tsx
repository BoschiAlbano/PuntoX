"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
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

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(undefined);

function resolveTenantId(metadata: Record<string, unknown> | undefined) {
  const hasKey = (key: string) =>
    metadata && Object.prototype.hasOwnProperty.call(metadata, key);
  const fromSnake = hasKey("tenant_id") ? metadata?.["tenant_id"] : undefined;
  const fromCamel = hasKey("tenantId") ? metadata?.["tenantId"] : undefined;

  const fallback =
    process.env.NEXT_PUBLIC_TENANT_ID || process.env.DEFAULT_TENANT_ID || null;
  return (fromSnake as string | number | null | undefined) ??
    (fromCamel as string | number | null | undefined) ??
    fallback ??
    null;
}

const SessionProviderComponent = ({ children }: { children: React.ReactNode }) => {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const fetchSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSession(data.session ?? null);
      setStatus(data.session ? "authenticated" : "unauthenticated");
    };

    fetchSession();

    const { data } = supabase.auth.onAuthStateChange((_, newSession) => {
      setSession(newSession);
      setStatus(newSession ? "authenticated" : "unauthenticated");
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo(() => {
    const metadata = (session?.user?.user_metadata ??
      {}) as Record<string, unknown>;
    const appMetadata = (session?.user?.app_metadata ??
      {}) as Record<string, unknown>;
    const tenantId = resolveTenantId(metadata);
    const roleRaw = metadata?.["role"] ?? metadata?.["roll"];
    const role = typeof roleRaw === "string" ? roleRaw : null;
    const user: TenantUser | null = session?.user
      ? {
          id: session.user.id,
          email: session.user.email ?? undefined,
          tenantId,
          role: typeof role === "string" ? role : null,
          user_metadata: metadata,
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
