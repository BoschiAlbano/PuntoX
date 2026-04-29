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
import { useUserStore } from "@/store/useUserStore";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type SupabaseAuthContextValue = {
  supabase: ReturnType<typeof getSupabaseBrowserClient>;
  session: Session | null;
  user: TenantUser | null;
  status: AuthStatus;
};

const SupabaseAuthContext = createContext<SupabaseAuthContextValue | undefined>(
  undefined,
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

  // Interceptor global para detectar sesiones cerradas
  useEffect(() => {
    // Solo interceptar si estamos en una página protegida (no en signin/signup)
    if (typeof window === "undefined") return;

    // Guardar el fetch original
    const originalFetch = window.fetch;
    let isHandlingLogout = false;

    // Interceptar todas las llamadas fetch
    window.fetch = async (...args) => {
      const url =
        typeof args[0] === "string"
          ? args[0]
          : args[0] instanceof URL
            ? args[0].href
            : args[0]?.url || "";

      // No interceptar llamadas a rutas públicas
      const publicPaths = ["/signin", "/signup", "/new-tenant", "/api/auth"];
      const isPublicPath = publicPaths.some((path) => url.includes(path));

      // Si es una ruta pública, no interceptar
      if (isPublicPath) {
        return originalFetch(...args);
      }

      // Importar dinámicamente o usar getState para evitar conflictos de inicialización
      // import { useUserStore } from "@/store/useUserStore"; <-- Asumimos import arriba

      const currentBranch = useUserStore.getState().currentBranch;
      const sucursalId = currentBranch?.Id;

      // Si tenemos sucursalId, agregarlo a los headers
      let headers: HeadersInit = args[1]?.headers || {};

      if (sucursalId) {
        if (headers instanceof Headers) {
          headers.set("x-sucursal-id", sucursalId);
        } else if (Array.isArray(headers)) {
          headers.push(["x-sucursal-id", sucursalId]);
        } else {
          headers = { ...headers, "x-sucursal-id": sucursalId };
        }
      }

      const response = await originalFetch(args[0], {
        ...args[1],
        headers,
      });

      // Si la respuesta es 401 y no estamos manejando un logout, verificar si es por sesión cerrada
      // No procesar 401s durante logout manual (evita loops y toasts innecesarios)
      if (response.status === 401 && !isHandlingLogout) {
        try {
          const currentPath = window.location.pathname;
          const publicPagePaths = ["/signin", "/signup", "/new-tenant"];
          const isOnPublicPage = publicPagePaths.some((path) =>
            currentPath.startsWith(path),
          );

          // Si ya estamos en una página pública, no hacer nada
          if (isOnPublicPage) {
            return response;
          }

          const clonedResponse = response.clone();
          const data = await clonedResponse.json().catch(() => ({}));

          // Si el error indica que la sesión fue cerrada, hacer logout automáticamente
          if (
            data.sesionCerrada === true ||
            data.details?.includes("sesión ha sido cerrada")
          ) {
            // Prevenir loops infinitos
            if (isHandlingLogout) return response;
            isHandlingLogout = true;

            console.warn(
              "[SessionProvider] Sesión cerrada detectada, haciendo logout automático",
            );

            // Actualizar estado primero
            setSession(null);
            setStatus("unauthenticated");

            // Cerrar sesión en Supabase (no bloqueante)
            supabase.auth.signOut().catch((error) => {
              console.warn("[SessionProvider] Error al cerrar sesión:", error);
            });

            // Redirigir al login usando replace para evitar problemas de navegación
            setTimeout(() => {
              window.location.replace("/signin?reason=session_closed");
            }, 100);
          }
        } catch (error) {
          // Si no se puede parsear la respuesta, continuar normalmente
          console.warn(
            "[SessionProvider] Error al verificar respuesta 401:",
            error,
          );
        }
      }

      return response;
    };

    // Cleanup: restaurar fetch original al desmontar
    return () => {
      window.fetch = originalFetch;
    };
  }, [supabase]);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        // Obtener sesión de forma optimizada (getSession es síncrono si hay cache)
        const { data, error } = await supabase.auth.getSession();

        // Si hay error o no hay sesión, establecer estado inmediatamente
        if (error || !data.session) {
          setSession(null);
          setStatus("unauthenticated");
          return;
        }

        // Establecer sesión y estado inmediatamente (no bloquear renderizado)
        setSession(data.session);
        setStatus("authenticated");

        // Sincronizar permisos en background (no bloqueante)
        if (data.session?.user) {
          const metadata = data.session.user.app_metadata || {};
          const tienePermisos =
            Array.isArray(metadata.permissions) &&
            metadata.permissions.length > 0;

          // Si no tiene permisos en JWT, sincronizar en background (no bloquea)
          if (!tienePermisos) {
            setTimeout(() => {
              fetch("/api/auth/sync-permissions", { method: "POST" })
                .then((res) => {
                  // Forzar refresh del JWT para que el nuevo token incluya los permisos
                  if (res.ok) supabase.auth.refreshSession().catch(() => {});
                })
                .catch((err) => {
                  console.warn("No se pudieron sincronizar permisos:", err);
                });
            }, 0);
          }
        }
      } catch (error: any) {
        // Ignorar errores de refresh token no encontrado (común cuando las cookies están inválidas)
        if (error?.code === "refresh_token_not_found") {
          setSession(null);
          setStatus("unauthenticated");
          return;
        }
        console.error("Error al obtener sesión:", error);
        setSession(null);
        setStatus("unauthenticated");
      }
    };

    // Cargar sesión inmediatamente
    fetchSession();

    const { data } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        // Ignorar errores de refresh token durante cambios de estado
        try {
          setSession(newSession);
          setStatus(newSession ? "authenticated" : "unauthenticated");
        } catch (error: any) {
          if (error?.code === "refresh_token_not_found") {
            setSession(null);
            setStatus("unauthenticated");
            return;
          }
          throw error;
        }

        // Sincronizar permisos y registrar sesión cuando hay un nuevo login
        if (event === "SIGNED_IN" && newSession?.user) {
          const metadata = newSession.user.app_metadata || {};
          const tienePermisos =
            Array.isArray(metadata.permissions) &&
            metadata.permissions.length > 0;

          // Sincronizar permisos después del login - forzar refresh del JWT para que el nuevo token incluya los permisos
          if (!tienePermisos) {
            fetch("/api/auth/sync-permissions", { method: "POST" })
              .then((res) => {
                if (res.ok) supabase.auth.refreshSession().catch(() => {});
              })
              .catch((err) => {
                console.warn("No se pudieron sincronizar permisos:", err);
              });
          }

          // Registrar sesión activa con cooldown: evita writes en cada token auto-refresh
          // Supabase emite SIGNED_IN también cuando refresca el token automáticamente
          const SESSION_REGISTER_KEY = `session_registered_${newSession.user.id}`;
          const SESSION_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutos
          const lastRegistered = parseInt(
            typeof localStorage !== "undefined"
              ? (localStorage.getItem(SESSION_REGISTER_KEY) || "0")
              : "0"
          );

          if (Date.now() - lastRegistered > SESSION_COOLDOWN_MS) {
            if (typeof localStorage !== "undefined") {
              localStorage.setItem(SESSION_REGISTER_KEY, String(Date.now()));
            }

            const userAgent =
              typeof navigator !== "undefined" ? navigator.userAgent : null;
            let dispositivo = "Dispositivo desconocido";
            if (userAgent) {
              try {
                const nav = navigator as any;
                if (nav.userAgentData) {
                  dispositivo = `${nav.userAgentData.platform || "Unknown"} - ${
                    nav.userAgentData.brands
                      ?.map((b: any) => b.brand)
                      .join(", ") || "Unknown"
                  }`;
                } else {
                  dispositivo = `${
                    navigator.platform || "Unknown"
                  } - ${userAgent.substring(0, 50)}`;
                }
              } catch {
                dispositivo = userAgent.substring(0, 100);
              }
            }

            const email = newSession.user.email || "";
            const esConfiable =
              typeof localStorage !== "undefined"
                ? localStorage.getItem(`device_trusted_${email}`) === "true"
                : false;

            fetch("/api/auth/registrar-sesion", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                token: newSession.access_token || null,
                dispositivo,
                ubicacion: null,
                esConfiable,
              }),
            }).catch((err) =>
              console.warn(
                "Error al registrar sesión desde sessionProvider:",
                err,
              ),
            );
          }
        }

        // Cerrar sesiones cuando hay un logout
        if (event === "SIGNED_OUT") {
          fetch("/api/auth/registrar-sesion", {
            method: "DELETE",
            credentials: "include",
          }).catch((err) =>
            console.warn("Error al cerrar sesión desde sessionProvider:", err),
          );
        }
      },
    );

    return () => {
      data.subscription.unsubscribe();
    };
  }, [supabase]);

  // Heartbeat: verifica periódicamente si la sesión sigue activa en nuestra DB.
  // Detecta cierres remotos: cuando un admin cierra la sesión desde otro dispositivo,
  // la DB marca EstaActiva=false y el próximo heartbeat dispara el logout.
  useEffect(() => {
    if (status !== "authenticated") return;

    const HEARTBEAT_INTERVAL = 30 * 1000; // 30 segundos

    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/session-status", {
          method: "GET",
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) return; // Error de red → ignorar, no desloguear

        const data = await res.json();

        if (data.sesionCerrada === true) {
          console.warn(
            "[SessionProvider] Heartbeat: sesión cerrada remotamente, haciendo logout",
          );
          setSession(null);
          setStatus("unauthenticated");
          supabase.auth.signOut().catch(() => {});
          setTimeout(() => {
            window.location.replace("/signin?reason=session_closed");
          }, 100);
        }
      } catch {
        // Error de red → ignorar silenciosamente
      }
    };

    // Primera verificación inmediata al autenticarse, luego periódica
    checkSession();
    const interval = setInterval(checkSession, HEARTBEAT_INTERVAL);

    return () => clearInterval(interval);
  }, [status, supabase]);

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
      "useSupabaseAuthContext debe usarse dentro de SessionProviderComponent",
    );
  }
  return ctx;
}

export default SessionProviderComponent;
