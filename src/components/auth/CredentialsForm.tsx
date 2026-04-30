"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { User, Lock, Eye, EyeOff, Shield } from "lucide-react";

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
  const [attemptCount, setAttemptCount] = useState(0);
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showMfa, setShowMfa] = useState(false);
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const searchParams = useSearchParams();

  // Obtener callbackUrl de los parámetros de búsqueda
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Rate limiting básico: resetear después de 5 minutos
  useEffect(() => {
    const storedAttempts = localStorage.getItem("login_attempts");
    const storedTime = localStorage.getItem("login_attempt_time");

    if (storedAttempts && storedTime) {
      const timeDiff = Date.now() - parseInt(storedTime, 10);
      const fiveMinutes = 5 * 60 * 1000;

      if (timeDiff < fiveMinutes) {
        const attempts = parseInt(storedAttempts, 10);
        setAttemptCount(attempts);
        if (attempts >= 5) {
          setIsRateLimited(true);
          const remainingTime = Math.ceil((fiveMinutes - timeDiff) / 1000 / 60);
          setError(
            `Demasiados intentos fallidos. Intenta de nuevo en ${remainingTime} minutos.`,
          );
        }
      } else {
        // Resetear contador después de 5 minutos
        localStorage.removeItem("login_attempts");
        localStorage.removeItem("login_attempt_time");
        setAttemptCount(0);
        setIsRateLimited(false);
      }
    }
  }, []);

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

    // Verificar rate limiting
    if (isRateLimited) {
      setError(
        "Demasiados intentos fallidos. Por favor espera unos minutos antes de intentar de nuevo.",
      );
      return;
    }

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

      const { email: internalEmail } = await emailResponse.json();

      if (!internalEmail) {
        throw new Error("No se pudo obtener el email del usuario");
      }

      // Ahora hacer login con el email interno
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({
          email: internalEmail,
          password,
        });

      if (authError) {
        // Incrementar contador de intentos fallidos
        const newAttemptCount = attemptCount + 1;
        setAttemptCount(newAttemptCount);
        localStorage.setItem("login_attempts", newAttemptCount.toString());
        localStorage.setItem("login_attempt_time", Date.now().toString());

        // Activar rate limiting después de 5 intentos
        if (newAttemptCount >= 5) {
          setIsRateLimited(true);
        }

        throw authError;
      }

      // Login exitoso: resetear contador de intentos
      localStorage.removeItem("login_attempts");
      localStorage.removeItem("login_attempt_time");
      setAttemptCount(0);
      setIsRateLimited(false);

      // Verificar si requiere 2FA (MFA)
      const { data: mfaData, error: mfaError } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (mfaError) throw mfaError;

      if (mfaData.nextLevel === "aal2" && mfaData.currentLevel === "aal1") {
        // Necesita 2FA
        const { data: factorsData, error: factorsError } = await supabase.auth.mfa.listFactors();
        if (factorsError) throw factorsError;

        const totpFactor = factorsData.totp[0];
        if (!totpFactor) throw new Error("No se encontró factor TOTP activo");

        setFactorId(totpFactor.id);
        setShowMfa(true);
        setIsLoading(false);
        return; // Detenemos aquí, el usuario debe ingresar el código
      }

      // Si no requiere 2FA, procesar como login exitoso normal
      await processSuccessfulLogin(authData, normalizedUsername);
    } catch (err) {
      console.error("Error al iniciar sesion:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      if (!showMfa) setIsLoading(false);
    }
  };

  const processSuccessfulLogin = async (authData: any, normalizedUsername: string) => {

      // Login exitoso - registrar intento exitoso y sesión
      if (authData?.user) {
        const userMetadata = authData.user.app_metadata || {};
        const tenantId = userMetadata.tenantId;

        // Obtener información del dispositivo
        let dispositivo = "Dispositivo desconocido";
        try {
          const nav = navigator as any;
          if (nav.userAgentData) {
            dispositivo = `${nav.userAgentData.platform || "Unknown"} - ${
              nav.userAgentData.brands?.map((b: any) => b.brand).join(", ") ||
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
          // Esto es opcional y puede fallar, no bloqueamos si falla
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

        // Verificar si el dispositivo es confiable o si el usuario quiere recordarlo
        const esConfiable =
          recordarDispositivo ||
          localStorage.getItem(`device_trusted_${normalizedUsername}`) ===
            "true";

        // Guardar en localStorage si el usuario marcó "Recordar dispositivo"
        if (recordarDispositivo) {
          localStorage.setItem(`device_trusted_${normalizedUsername}`, "true");
        }

        // Registrar sesión activa (en background, no bloqueamos)
        fetch("/api/auth/registrar-sesion", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: authData.session?.access_token || null,
            dispositivo,
            ubicacion,
            esConfiable,
          }),
        }).catch((err) => console.warn("Error al registrar sesión:", err));
      }

      // Redirigir después de login exitoso (usar callbackUrl si existe, sino /ventas)
      const safeCallbackUrl =
        callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
          ? callbackUrl
          : "/dashboard";

      window.location.href = safeCallbackUrl;
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!mfaCode || mfaCode.length !== 6) {
      setError("El código debe tener 6 dígitos");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: verifyData, error: verifyError } = await supabase.auth.mfa.challengeAndVerify({
        factorId,
        code: mfaCode,
      });

      if (verifyError) throw verifyError;

      // El 2FA fue exitoso, procesar como login normal
      const { data: authData } = await supabase.auth.getSession();
      await processSuccessfulLogin(authData, username.trim().toLowerCase());
    } catch (err) {
      console.error("Error al verificar 2FA:", err);
      setError("Código incorrecto o expirado. Intenta de nuevo.");
      setIsLoading(false);
    }
  };

  if (showMfa) {
    return (
      <form onSubmit={handleMfaSubmit} className="space-y-5">
        <div className="text-center mb-6">
          <Shield className="mx-auto h-12 w-12 text-[#67afc3] mb-3" />
          <h3 className="text-xl font-bold text-slate-800">Autenticación de dos pasos</h3>
          <p className="text-sm text-slate-500 mt-2">
            Ingresa el código de 6 dígitos generado por tu aplicación autenticadora (ej. Google Authenticator).
          </p>
        </div>

        <div>
          <label htmlFor="mfaCode" className="block text-sm font-medium text-slate-700 mb-1.5 text-center">
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
            className="w-full text-center text-2xl tracking-[0.5em] font-mono py-4 border rounded-xl bg-slate-50/60 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#67afc3]/50 focus:border-[#67afc3]/50 transition-all"
            placeholder="000000"
          />
        </div>

        {error && (
          <div className="text-red-700 text-sm bg-red-50 p-3 rounded-xl border border-red-200 text-center">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading || mfaCode.length !== 6}
          className={`w-full bg-linear-to-r from-[#0284c7] to-[#2dd4bf] text-white py-3 px-4 rounded-xl focus:outline-none transition-all duration-200 font-semibold shadow-lg shadow-[#0284c7]/20 ${
            isLoading || mfaCode.length !== 6
              ? "opacity-60 cursor-not-allowed"
              : "hover:shadow-xl hover:shadow-[#0284c7]/30 hover:brightness-110 active:scale-[0.98]"
          }`}
        >
          {isLoading ? "Verificando..." : "Verificar código"}
        </button>

        <button
          type="button"
          onClick={() => {
            setShowMfa(false);
            const supabase = getSupabaseBrowserClient();
            supabase.auth.signOut();
          }}
          className="w-full text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors py-2"
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
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
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
              }
            }}
            required
            disabled={isLoading}
            className={`w-full pl-10 pr-3 py-3 border rounded-xl bg-slate-50/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#67afc3]/50 focus:border-[#67afc3]/50 transition-all ${
              usernameError
                ? "border-red-300 bg-red-50/50"
                : "border-slate-200"
            } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            placeholder="juan"
            autoComplete="username"
          />
        </div>
        {usernameError && (
          <p className="mt-1.5 text-sm text-red-400">{usernameError}</p>
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
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
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
            className={`w-full pl-10 pr-10 py-3 border border-slate-200 rounded-xl bg-slate-50/60 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#67afc3]/50 focus:border-[#67afc3]/50 transition-all ${
              isLoading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none transition-colors"
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="text-red-700 text-sm bg-red-50 p-3 rounded-xl border border-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center">
        <input
          id="recordar-dispositivo"
          type="checkbox"
          checked={recordarDispositivo}
          onChange={(e) => setRecordarDispositivo(e.target.checked)}
          className="w-4 h-4 bg-white border-slate-300 rounded text-[#67afc3] focus:ring-[#67afc3]/50 focus:ring-offset-0"
        />
        <label
          htmlFor="recordar-dispositivo"
          className="ml-2 text-sm text-slate-500 cursor-pointer hover:text-slate-700 transition-colors"
        >
          Recordar este dispositivo
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading || !!usernameError}
        className={`w-full bg-linear-to-r from-[#0284c7] to-[#2dd4bf] text-white py-3 px-4 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#67afc3]/50 focus:ring-offset-2 focus:ring-offset-white transition-all duration-200 font-semibold shadow-lg shadow-[#0284c7]/20 ${
          isLoading || usernameError
            ? "opacity-60 cursor-not-allowed"
            : "hover:shadow-xl hover:shadow-[#0284c7]/30 hover:brightness-110 active:scale-[0.98]"
        }`}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg
              className="animate-spin h-5 w-5 text-white"
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
