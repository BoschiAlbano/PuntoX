"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useConfiguracion } from "@/hooks/useConfiguracion";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

export default function ProtectRoute({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { canAccessRoute, isLoading, isInitialized } = useUserStore();
  const { seguridad, isLoadingSeguridad } = useConfiguracion({ enableSeguridad: true });
  const [authorized, setAuthorized] = useState(false);
  const [checkingMfa, setCheckingMfa] = useState(true);

  useEffect(() => {
    const verifyMfaEnforcement = async () => {
      if (!isInitialized || isLoadingSeguridad) {
        console.log("ProtectRoute: Waiting for init...", { isInitialized, isLoadingSeguridad });
        return;
      }

      console.log("ProtectRoute: Running verifyMfaEnforcement...");
      try {
        // Si se fuerza 2FA globalmente en el tenant
        if (seguridad?.dobleFactor) {
          const supabase = getSupabaseBrowserClient();
          const { data, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
          if (error) throw error;
          
          // Si el usuario no tiene 2FA configurado (solo nivel 1)
          if (data?.currentLevel === "aal1") {
            const { data: factors, error: factorsError } = await supabase.auth.mfa.listFactors();
            if (factorsError) throw factorsError;
            
            const hasTotp = factors?.totp?.some((f) => f.status === "verified");

            // Si no tiene 2FA y no está ya en la página de perfil
            if (!hasTotp && pathname !== "/perfil") {
              console.warn("MFA Forzado: Redirigiendo a configurar 2FA");
              router.push("/perfil");
              return;
            }
          }
        }
      } catch (err) {
        console.error("Error verificando MFA enforcement:", err);
      } finally {
        // Solo seteamos checkingMfa false si NO estamos redirigiendo
        // (el return de arriba saltea el finally, pero en React 18 a veces no. 
        // Para asegurar, lo verificamos. O mejor, si hubo redirect, no importa que pase a false 
        // porque se va a desmontar. Lo dejamos en finally.)
        setCheckingMfa(false);
        console.log("ProtectRoute: MFA check completed, checkingMfa set to false");
      }
    };

    verifyMfaEnforcement();
  }, [isInitialized, isLoadingSeguridad, seguridad, pathname, router]);

  useEffect(() => {
    console.log("ProtectRoute Auth Effect: ", { isInitialized, checkingMfa, pathname });
    if (!isInitialized || checkingMfa) return;

    // Public or implicitly allowed routes (basic fallback, but store handles this too)
    if (pathname === "/dashboard" || pathname === "/" || pathname?.startsWith("/perfil")) {
      setAuthorized(true);
      return;
    }

    const isAllowed = canAccessRoute(pathname);

    if (!isAllowed) {
      console.warn(`Access denied to ${pathname}`);
      router.push("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [pathname, isInitialized, canAccessRoute, router, checkingMfa]);

  if (isLoading || !isInitialized || checkingMfa) {
    console.log("ProtectRoute: rendering null due to loading state", { isLoading, isInitialized, checkingMfa });
    return null;
  }

  // Prevent flash of unauthorized content
  if (!authorized) {
    console.log("ProtectRoute: rendering null because not authorized yet");
    return null;
  }

  return <>{children}</>;
}
