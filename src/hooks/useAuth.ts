"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (
    provider: "google" | "credentials",
    credentials?: { email: string; password: string }
  ) => {
    try {
      if (provider === "google") {
        await signIn("google", { callbackUrl: "/ventas" });
      } else if (provider === "credentials" && credentials) {
        const result = await signIn("credentials", {
          email: credentials.email,
          password: credentials.password,
          redirect: false,
        });

        console.log("Resultado del login:", result);

        if (result?.error) {
          // Manejar errores específicos de NextAuth
          if (result.error === "Configuration") {
            throw new Error(
              "Error de configuración del servidor. Verifica las variables de entorno."
            );
          } else if (result.error === "CredentialsSignin") {
            throw new Error(
              "Credenciales inválidas. Verifica tu email y contraseña."
            );
          } else if (result.error === "AccessDenied") {
            throw new Error(
              "Acceso denegado. Tu cuenta puede estar bloqueada."
            );
          } else {
            throw new Error(`Error de autenticación: ${result.error}`);
          }
        }

        // Si no hay error, redirigir
        if (result?.ok) {
          router.push("/ventas");
        }
      }
    } catch (error) {
      console.error("Error en login:", error);
      throw error;
    }
  };

  const logout = async () => {
    await signOut({ callbackUrl: "/signin" });
  };

  const isAuthenticated = status === "authenticated";
  const isLoading = status === "loading";

  return {
    session,
    status,
    isAuthenticated,
    isLoading,
    login,
    logout,
  };
}
