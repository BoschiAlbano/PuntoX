"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

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
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        throw authError;
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
          className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            emailError
              ? "border-red-300 bg-red-50"
              : "border-gray-300 bg-white"
          } ${isLoading ? "opacity-60 cursor-not-allowed" : ""}`}
          placeholder="tu@email.com"
        />
        {emailError && (
          <p className="mt-1 text-sm text-red-600">{emailError}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Contrasena
        </label>
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
          className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
            isLoading ? "opacity-60 cursor-not-allowed" : ""
          }`}
          placeholder="********"
        />
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg border border-red-200">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading || !!emailError}
        className={`w-full bg-gradient-to-r from-blue-500 to-[#90c472] text-white py-2 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 font-medium ${
          isLoading || emailError
            ? "opacity-60 cursor-not-allowed"
            : "hover:from-blue-600 hover:to-[#90c472]"
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
