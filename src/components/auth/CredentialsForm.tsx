"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { Eye, EyeOff, Shield } from "lucide-react";
import { useAuthTransition } from "./AuthTransitionContext";

// Función para mapear errores de Supabase a mensajes específicos
const getErrorMessage = (error: unknown): string => {
  if (!error) return "Credenciales inválidas";

  // Manejar diferentes tipos de error
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "message" in error
  ) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    errorMessage = String(error);
  }

  // Errores específicos de Supabase Auth
  if (errorMessage.includes("Invalid login credentials")) {
    return "Nombre de usuario o contraseña incorrectos";
  }

  if (
    errorMessage.includes("cuenta bloqueada") ||
    errorMessage.includes("ACCOUNT_BLOCKED")
  ) {
    return "Tu cuenta ha sido bloqueada. Contactá al administrador para recuperar el acceso";
  }

  if (errorMessage.includes("Email not confirmed")) {
    return "Por favor confirma tu email antes de iniciar sesión";
  }

  if (errorMessage.includes("Too many requests")) {
    return "Demasiados intentos. Intenta de nuevo en unos minutos";
  }

  if (errorMessage.includes("User not found")) {
    return "Usuario no encontrado";
  }

  if (errorMessage.includes("Invalid email")) {
    return "El formato del email no es válido";
  }

  if (errorMessage.includes("Password")) {
    return "La contraseña es incorrecta";
  }

  if (errorMessage.includes("network") || errorMessage.includes("fetch")) {
    return "Error de conexión. Verifica tu internet e intenta de nuevo";
  }

  // Error genérico si no coincide con ninguno
  return errorMessage || "Credenciales inválidas";
};

export default function CredentialsForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recordarDispositivo, setRecordarDispositivo] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const searchParams = useSearchParams();
  const router = useRouter();

  const { startSigningIn, startVerifying, resetTransition } =
    useAuthTransition();

  const loadingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Limpiar timer al desmontar el componente
  useEffect(() => {
    return () => {
      if (loadingTimerRef.current) {
        clearTimeout(loadingTimerRef.current);
      }
    };
  }, []);

  // Helper para cancelar el timer de loading
  const clearLoadingTimer = () => {
    if (loadingTimerRef.current) {
      clearTimeout(loadingTimerRef.current);
      loadingTimerRef.current = null;
    }
  };

  // Helper para iniciar el timer de 250ms hacia la fase global "signing-in"
  const startDelayedLoadingTimer = () => {
    clearLoadingTimer();
    loadingTimerRef.current = setTimeout(() => {
      startSigningIn();
    }, 250);
  };

  // Obtener callbackUrl de los parámetros de búsqueda
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Validación de username en tiempo real
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setUsername(value);
    setError(""); // Limpiar error general al escribir
    setUsernameError(""); // Limpiar error de username

    // Validar que el username no esté vacío
    if (value && value.length < 2) {
      setUsernameError("El nombre de usuario debe tener al menos 2 caracteres");
    } else {
      setUsernameError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setUsernameError("");

    // Normalizar username: trim y lowercase
    const normalizedUsername = username.trim().toLowerCase();

    // Validar username antes de enviar
    if (!normalizedUsername || normalizedUsername.length < 2) {
      setUsernameError("El nombre de usuario debe tener al menos 2 caracteres");
      return;
    }

    if (!password || password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);
    startDelayedLoadingTimer();

    try {
      // Primero, obtener el email interno por username
      const emailResponse = await fetch("/api/auth/get-email-by-username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: normalizedUsername }),
      });

      if (!emailResponse.ok) {
        const errorData = await emailResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Usuario no encontrado");
      }

      const { email: internalEmail, isBlocked } = await emailResponse.json();

      if (!internalEmail) {
        throw new Error("No se pudo obtener el email del usuario");
      }

      // Si la cuenta ya está bloqueada, informar antes de intentar con Supabase
      if (isBlocked) {
        throw new Error("ACCOUNT_BLOCKED");
      }

      // Ahora hacer login con el email interno
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

      if (authError) {
        // Registrar intento fallido en el servidor para bloqueo automático
        try {
          const intentoRes = await fetch(
            "/api/auth/registrar-intento-fallido",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ username: normalizedUsername }),
            },
          );
          if (intentoRes.ok) {
            const intentoData = await intentoRes.json().catch(() => ({}));
            if (intentoData?.bloqueado) {
              throw new Error("ACCOUNT_BLOCKED");
            }
          }
        } catch (intentoErr: unknown) {
          if (
            intentoErr instanceof Error &&
            intentoErr.message === "ACCOUNT_BLOCKED"
          ) {
            throw intentoErr;
          }
        }

        throw authError;
      }

      // Login exitoso en Supabase
      setError("");

      // Verificar si requiere 2FA (MFA)
      const { data: mfaData, error: mfaError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaError) throw mfaError;

      if (mfaData.nextLevel === "aal2" && mfaData.currentLevel === "aal1") {
        // Necesita 2FA

        // 1. Verificar si el dispositivo está marcado como confiable en nuestra BD y tiene token válido
        try {
          const trustedRes = await fetch("/api/auth/trusted-device/verify");
          if (trustedRes.ok) {
            const trustedData = await trustedRes.json();
            if (trustedData?.isTrusted) {
              console.log(
                "Login: Dispositivo confiable detectado, saltando 2FA.",
              );
              clearLoadingTimer();
              startVerifying();
              await processSuccessfulLogin(authData, normalizedUsername);
              return;
            }
          }
        } catch (e) {
          console.error("Error verificando dispositivo confiable", e);
          // Si falla la verificación silenciosa, continuamos con el flujo normal de pedir el código
        }

        // 2. Si no es confiable, buscar factores TOTP y pedir el código
        const { data: factorsData, error: factorsError } =
          await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const totpFactor = factorsData.totp[0];
        if (!totpFactor) throw new Error("No se encontró factor TOTP activo");

        setFactorId(totpFactor.id);
        clearLoadingTimer();
        resetTransition();
        setShowMfa(true);
        setIsLoading(false);
        return; // Detenemos aquí, el usuario debe ingresar el código
      }

      // Si no requiere 2FA, pasar a fase "verifying" y procesar login exitoso
      clearLoadingTimer();
      startVerifying();
      await processSuccessfulLogin(authData, normalizedUsername);
    } catch (err) {
      console.error("Error al iniciar sesion:", err);
      clearLoadingTimer();
      resetTransition();
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      if (!showMfa) {
        setIsLoading(false);
      }
    }
  };

  const processSuccessfulLogin = async (
    authData: { user?: { id: string; email?: string } | null; session?: { access_token?: string } | null },
    normalizedUsername: string,
  ) => {
    // Login exitoso - registrar intento exitoso y sesión
    if (authData?.user) {
      // Obtener información del dispositivo
      let dispositivo = "Dispositivo desconocido";
      try {
        const nav = navigator as unknown as {
          userAgentData?: {
            platform?: string;
            brands?: Array<{ brand: string }>;
          };
        };
        if (nav.userAgentData) {
          dispositivo = `${nav.userAgentData.platform || "Unknown"} - ${
            nav.userAgentData.brands?.map((b) => b.brand).join(", ") ||
            "Unknown"
          }`;
        } else {
          dispositivo = `${
            navigator.platform || "Unknown"
          } - ${navigator.userAgent.substring(0, 50)}`;
        }
      } catch {
        dispositivo = navigator.userAgent.substring(0, 100);
      }

      // Intentar obtener ubicación aproximada (opcional, no bloqueante)
      let ubicacion = null;
      try {
        const geo = await fetch("https://ipapi.co/json/")
          .then((r) => r.json())
          .catch(() => null);
        if (geo && geo.city) {
          ubicacion = `${geo.city || ""}, ${geo.region || ""}, ${
            geo.country_name || ""
          }`.trim();
        }
      } catch {
        // Ignorar errores de geolocalización
      }

      // El dispositivo es confiable SOLO si el checkbox está marcado actualmente
      const esConfiable = recordarDispositivo;

      // Guardar flag de confiable usando AMBAS claves (email para sessionProvider, username para el onBlur)
      const userEmail = authData.user.email || "";
      if (recordarDispositivo) {
        localStorage.setItem(`device_trusted_${userEmail}`, "true");
        localStorage.setItem(`device_trusted_${normalizedUsername}`, "true");
      } else {
        localStorage.removeItem(`device_trusted_${userEmail}`);
        localStorage.removeItem(`device_trusted_${normalizedUsername}`);
      }

      // ── INHIBIR REGISTRO DUPLICADO EN sessionProvider ──────────────────────
      const SESSION_REGISTER_KEY = `session_registered_${authData.user.id}`;
      localStorage.setItem(SESSION_REGISTER_KEY, String(Date.now()));
      // ───────────────────────────────────────────────────────────────────────

      // Registrar sesión activa — única llamada al POST en todo el flujo de login
      try {
        const res = await fetch("/api/auth/registrar-sesion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: authData.session?.access_token || null,
            dispositivo,
            ubicacion,
            esConfiable,
          }),
        });
        const data = await res.json().catch(() => ({}));
        // Guardar sesionId para el logout correcto
        if (data?.sesionId) {
          localStorage.setItem(
            `session_id_${authData.user.id}`,
            String(data.sesionId),
          );
        }
      } catch (err) {
        console.warn("Error al registrar sesión:", err);
      }
    }

    // Redirigir mediante Next.js router SPA para mantener montado el layout y overlay continuo
    const safeCallbackUrl =
      callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/dashboard";

    router.replace(safeCallbackUrl);
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!mfaCode || mfaCode.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setIsLoading(true);
    startDelayedLoadingTimer();

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: verifyError } =
        await supabase.auth.mfa.challengeAndVerify({
          factorId,
          code: mfaCode,
        });

      if (verifyError) throw verifyError;

      // Después de challengeAndVerify, Supabase actualiza la sesión interna a AAL2.
      // getSession() devuelve la sesión actualizada con el access_token AAL2.
      const { data: sessionData } = await supabase.auth.getSession();
      const authData = {
        user: sessionData.session?.user ?? null,
        session: sessionData.session,
      };

      clearLoadingTimer();
      startVerifying();
      await processSuccessfulLogin(authData, username.trim().toLowerCase());
    } catch (err) {
      console.error("Error al verificar 2FA:", err);
      clearLoadingTimer();
      resetTransition();
      setError("Código incorrecto o expirado. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  if (showMfa) {
    return (
      <form onSubmit={handleMfaSubmit} className="space-y-5">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-full bg-[#006AFC]/10 text-[#006AFC] flex items-center justify-center mx-auto mb-3">
            <Shield className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Autenticación de dos pasos
          </h2>
          <p className="text-sm text-slate-500 mt-2 leading-relaxed">
            Ingresa el código de 6 dígitos generado por tu aplicación
            autenticadora (ej. Google Authenticator).
          </p>
          {recordarDispositivo && (
            <p className="text-xs text-[#006AFC] mt-2 font-medium">
              Este dispositivo será recordado al verificar
            </p>
          )}
        </div>

        <div>
          <label
            htmlFor="mfaCode"
            className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2 text-center"
          >
            Código de verificación
          </label>
          <input
            id="mfaCode"
            type="text"
            value={mfaCode}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, "").slice(0, 6);
              setMfaCode(val);
              setError("");
            }}
            required
            disabled={isLoading}
            autoComplete="one-time-code"
            className="w-full text-center text-2xl tracking-[0.4em] font-mono py-3.5 px-4 border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-lg bg-white text-slate-900 focus:outline-none focus:border-[#006AFC] focus:ring-4 focus:ring-[#006AFC]/10 transition-colors shadow-2xs"
            placeholder="000000"
          />
        </div>

        {error && (
          <div className="text-red-700 text-sm bg-red-50 p-3.5 rounded-xl sm:rounded-lg border border-red-200 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || mfaCode.length !== 6}
          className="w-full min-h-[48px] sm:min-h-[44px] bg-[#FC6A01] hover:bg-[#E65E00] active:bg-[#CC5300] text-white py-3 px-4 rounded-xl sm:rounded-lg font-semibold text-base sm:text-sm transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#FC6A01]/25 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? "Verificando..." : "Verificar código"}
        </button>

        <button
          type="button"
          onClick={async () => {
            const supabase = getSupabaseBrowserClient();
            await supabase.auth.signOut();
            clearLoadingTimer();
            resetTransition();
            setShowMfa(false);
            setUsername("");
            setPassword("");
            setMfaCode("");
            setError("");
          }}
          className="w-full text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors py-2 text-center"
        >
          Volver e iniciar sesión con otro usuario
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="username"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Nombre de usuario
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={handleUsernameChange}
          onBlur={() => {
            if (username && username.trim().length < 2) {
              setUsernameError(
                "El nombre de usuario debe tener al menos 2 caracteres",
              );
            } else if (username) {
              const trusted = localStorage.getItem(
                `device_trusted_${username.trim().toLowerCase()}`,
              );
              if (trusted === "true") {
                setRecordarDispositivo(true);
              }
            }
          }}
          required
          disabled={isLoading}
          className={`w-full px-4 py-3.5 sm:py-3 border rounded-xl sm:rounded-lg bg-white text-slate-900 text-base sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#006AFC] focus:ring-4 focus:ring-[#006AFC]/10 transition-colors shadow-2xs ${
            usernameError
              ? "border-red-400 bg-red-50/30"
              : "border-slate-200 hover:border-slate-300"
          } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          placeholder="juan"
          autoComplete="username"
        />
        {usernameError && (
          <p className="mt-1.5 text-xs text-red-600 font-medium">
            {usernameError}
          </p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-slate-700 mb-1.5"
        >
          Contraseña
        </label>
        <div className="relative">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
            disabled={isLoading}
            className={`w-full pl-4 pr-11 py-3.5 sm:py-3 border border-slate-200 hover:border-slate-300 rounded-xl sm:rounded-lg bg-white text-slate-900 text-base sm:text-sm placeholder:text-slate-400 focus:outline-none focus:border-[#006AFC] focus:ring-4 focus:ring-[#006AFC]/10 transition-colors shadow-2xs ${
              isLoading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            placeholder="••••••••"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-700 text-sm bg-red-50 p-3.5 rounded-xl sm:rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center pt-1 pb-1">
        <input
          id="recordar-dispositivo"
          type="checkbox"
          checked={recordarDispositivo}
          onChange={(e) => setRecordarDispositivo(e.target.checked)}
          className="w-4.5 h-4.5 rounded border-slate-300 text-[#006AFC] focus:ring-[#006AFC]/20 focus:ring-offset-0 cursor-pointer accent-[#006AFC]"
        />
        <label
          htmlFor="recordar-dispositivo"
          className="ml-2.5 text-sm text-slate-600 cursor-pointer select-none hover:text-slate-900 transition-colors"
        >
          Recordar este dispositivo
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading || !!usernameError}
        className={`w-full min-h-[48px] sm:min-h-[44px] bg-[#FC6A01] hover:bg-[#E65E00] active:bg-[#CC5300] text-white py-3 px-4 rounded-xl sm:rounded-lg font-semibold text-base sm:text-sm transition-all shadow-sm hover:shadow-md focus:outline-none focus:ring-4 focus:ring-[#FC6A01]/25 ${
          isLoading || usernameError
            ? "opacity-60 cursor-not-allowed"
            : "cursor-pointer"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Iniciando sesión...
          </span>
        ) : (
          "Iniciar sesión"
        )}
      </button>
    </form>
  );
}
