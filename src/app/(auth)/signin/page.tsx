"use client";

import { useState } from "react";
import Link from "next/link";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";
import CredentialsForm from "@/components/auth/CredentialsForm";
import Divider from "@/components/auth/Divider";

export default function SignIn() {
  const [authMethod, setAuthMethod] = useState<"credentials" | "google">(
    "credentials"
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-[#90c472] rounded-full flex items-center justify-center mb-4">
            <img src="/XPDark.ico" alt="" className="h-6" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
          <p className="text-gray-600">Inicia sesión en tu cuenta</p>
        </div>

        {/* Auth Method Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
          <div className="flex">
            <button
              onClick={() => setAuthMethod("credentials")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                authMethod === "credentials"
                  ? "bg-gradient-to-r from-blue-500 to-[#90c472] hover:from-blue-600 hover:to-[#90c472] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Credenciales
            </button>
            <button
              onClick={() => setAuthMethod("google")}
              className={`flex-1 py-2 px-4 text-sm font-medium rounded-md transition-colors duration-200 ${
                authMethod === "google"
                  ? "bg-gradient-to-r from-blue-500 to-[#90c472] hover:from-blue-600 hover:to-[#90c472] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Google
            </button>
          </div>
        </div>

        {/* Auth Content */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          {authMethod === "credentials" ? (
            <CredentialsForm />
          ) : (
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-gray-600 mb-6">
                  Inicia sesión rápidamente con tu cuenta de Google
                </p>
                <GoogleSignInButton />
              </div>

              <Divider text="O continúa con credenciales" />

              <button
                onClick={() => setAuthMethod("credentials")}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200 font-medium"
              >
                Usar email y contraseña
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-gray-600">
            ¿No tienes una cuenta?{" "}
            <Link
              href="/signup"
              className="font-medium text-blue-500 hover:text-blue-600 transition-colors duration-200"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>

        {/* Additional Info */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Al continuar, aceptas nuestros términos de servicio y política de
            privacidad
          </p>
        </div>
      </div>
    </div>
  );
}
