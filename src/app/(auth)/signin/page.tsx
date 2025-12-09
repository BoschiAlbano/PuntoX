"use client";

import CredentialsForm from "@/components/auth/CredentialsForm";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header simple (solo credenciales, sin Google) */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-500 to-[#90c472] rounded-full flex items-center justify-center mb-4">
            <img
              src="/XPdark.ico"
              alt="Punto X"
              className="h-10 w-10 object-contain"
            />
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Bienvenido</h2>
          <p className="text-gray-600">Inicia sesion en tu cuenta</p>
        </div>

        {/* Formulario de credenciales (único método de acceso) */}
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-8">
          <CredentialsForm />
        </div>

        {/* Registro deshabilitado: indicar vía copy */}
        <div className="text-center text-sm text-gray-600">
          <p>
            El registro de usuarios está deshabilitado. Solicita acceso a un
            administrador.
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
