"use client";

import CredentialsForm from "@/components/auth/CredentialsForm";
import { Info } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header simple (solo credenciales, sin Google) */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-500 to-[#90c472] rounded-full flex items-center justify-center mb-4 shadow-md">
            <img
              src="/XPdark.ico"
              alt="Punto X"
              className="h-12 w-12 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
          <p className="text-sm text-gray-500">Inicia sesion en tu cuenta</p>
        </div>

        {/* Formulario de credenciales (único método de acceso) */}
        <div className="bg-white rounded-lg shadow-xl border border-gray-100 p-8">
          <CredentialsForm />
        </div>

        {/* Registro deshabilitado: alerta suave */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-blue-800">
            El acceso es solo por invitación. Contactá a un administrador para
            obtener acceso.
          </p>
        </div>

        {/* Additional Info */}
        <div className="text-center text-xs text-gray-500">
          <p>
            Al continuar, aceptas nuestros terminos de servicio y politica de
            privacidad
          </p>
        </div>
      </div>
    </div>
  );
}
