"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { Mail, Lock } from "lucide-react";

// Validación de email con regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Función para validar email
const validateEmail = (email: string): boolean => {
  return emailRegex.test(email);
};

// Función para mapear errores de Supabase a mensajes específicos
const getErrorMessage = (error: unknown): string => {
  if (!error) return "Credenciales inválidas";

  // Manejar diferentes tipos de error
  let errorMessage: string;
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "object" && error !== null && "message" in error) {
    errorMessage = String((error as { message: unknown }).message);
  } else {
    errorMessage = String(error);
  }

  // Errores específicos de Supabase Auth
  if (errorMessage.includes("Invalid login credentials")) {
    return "Email o contraseña incorrectos";
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
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recordarDispositivo, setRecordarDispositivo] = useState(false);
  const router = useRouter();

  // Validación de email en tiempo real
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    setError(""); // Limpiar error general al escribir

    // Validar solo si hay contenido
    if (value && !validateEmail(value)) {
      setEmailError("El formato del email no es válido");
    } else {
      setEmailError("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailError("");

    // Validar email antes de enviar
    if (!validateEmail(email)) {
      setEmailError("El formato del email no es válido");
      return;
    }

    if (!password) {
      setError("Por favor ingresa tu contraseña");
      return;
    }

    setIsLoading(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        // Registrar intento fallido
        try {
          await fetch("/api/auth/registrar-intento-login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email,
              exitoso: false,
              motivoFallo: getErrorMessage(authError),
            }),
          });
        } catch (regError) {
          console.warn("Error al registrar intento fallido:", regError);
        }
        throw authError;
      }

      // Login exitoso - registrar intento exitoso y sesión
      if (authData?.user) {
        const userMetadata = authData.user.app_metadata || {};
        const tenantId = userMetadata.tenantId;

        // Obtener información del dispositivo
        let dispositivo = "Dispositivo desconocido";
        try {
          const nav = navigator as any;
          if (nav.userAgentData) {
            dispositivo = `${nav.userAgentData.platform || "Unknown"} - ${nav.userAgentData.brands?.map((b: any) => b.brand).join(", ") || "Unknown"}`;
          } else {
            dispositivo = `${navigator.platform || "Unknown"} - ${navigator.userAgent.substring(0, 50)}`;
          }
        } catch {
          dispositivo = navigator.userAgent.substring(0, 100);
        }
        
        // Intentar obtener ubicación aproximada (opcional, no bloqueante)
        let ubicacion = null;
        try {
          // Esto es opcional y puede fallar, no bloqueamos si falla
          const geo = await fetch("https://ipapi.co/json/").then(r => r.json()).catch(() => null);
          if (geo && geo.city) {
            ubicacion = `${geo.city || ""}, ${geo.region || ""}, ${geo.country_name || ""}`.trim();
          }
        } catch {
          // Ignorar errores de geolocalización
        }

        // Verificar si el dispositivo es confiable o si el usuario quiere recordarlo
        const esConfiable = recordarDispositivo || localStorage.getItem(`device_trusted_${email}`) === "true";
        
        // Guardar en localStorage si el usuario marcó "Recordar dispositivo"
        if (recordarDispositivo) {
          localStorage.setItem(`device_trusted_${email}`, "true");
        }

        // Registrar intento exitoso (en background, no bloqueamos)
        fetch("/api/auth/registrar-intento-login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            exitoso: true,
            tenantId: tenantId || null,
          }),
        }).catch((err) => console.warn("Error al registrar intento exitoso:", err));

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

      // Redirigir después de login exitoso
      router.push("/ventas");
    } catch (err) {
      console.error("Error al iniciar sesion:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Correo electronico
        </label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="email"
            type="email"
            value={email}
            onChange={handleEmailChange}
            onBlur={() => {
              // Validar al perder el foco también
              if (email && !validateEmail(email)) {
                setEmailError("El formato del email no es válido");
              }
            }}
            required
            disabled={isLoading}
            className={`w-full pl-10 pr-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              emailError
                ? "border-red-300 bg-red-50"
                : "border-gray-300 bg-white"
            } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
            placeholder="tu@email.com"
          />
        </div>
        {emailError && (
          <p className="mt-1 text-sm text-red-600">{emailError}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Contraseña
        </label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(""); // Limpiar error al escribir
            }}
            required
            disabled={isLoading}
            className={`w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
              isLoading ? "opacity-60 cursor-not-allowed" : ""
            }`}
            placeholder="********"
          />
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <div className="flex items-center">
        <input
          id="recordar-dispositivo"
          type="checkbox"
          checked={recordarDispositivo}
          onChange={(e) => setRecordarDispositivo(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <label
          htmlFor="recordar-dispositivo"
          className="ml-2 text-sm text-gray-700 cursor-pointer"
        >
          Recordar este dispositivo
        </label>
      </div>

      <button
        type="submit"
        disabled={isLoading || !!emailError}
        className={`w-full bg-gradient-to-r from-blue-500 to-[#90c472] text-white py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium shadow-sm ${
          isLoading || emailError
            ? "opacity-60 cursor-not-allowed"
            : "hover:from-blue-600 hover:to-[#7fb362] hover:shadow-md active:shadow-lg"
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
          "Iniciar sesion"
        )}
      </button>
    </form>
  );
}
