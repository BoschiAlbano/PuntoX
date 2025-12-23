"use client";

import { useActionState, useEffect } from "react";
import { registerTenant } from "@/app/actions/register-tenant";
import { addToast } from "@heroui/react";
import { motion } from "framer-motion";

type RegisterState = {
  ok: boolean;
  error?: string;
  message?: string;
  tenantId?: bigint;
};

const initialState: RegisterState = {
  ok: false,
  message: "",
  error: "",
};

export default function NewTenantPage() {
  const [state, formAction, isPending] = useActionState(
    async (
      _prev: RegisterState,
      formData: FormData
    ): Promise<RegisterState> => {
      const result = await registerTenant(formData);
      return {
        ok: result.ok,
        message: result.message ?? "",
        error: result.error ?? "",
        tenantId: result.tenantId,
      };
    },
    initialState
  );

  useEffect(() => {
    if (!state.message && !state.error) return;
    if (state.ok) {
      addToast({
        title: "Éxito",
        description: state.message || "La tienda fue creada con exito.",
        color: "success",
      });
      // Optional: Redirect or clear form
    } else {
      addToast({
        title: "Error",
        description: state.error || state.message || "Error al crear la tienda",
        color: "danger",
      });
    }
  }, [state]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center p-4 sm:p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-4xl bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row"
      >
        {/* Left Side: Decorative & Info */}
        <div className="w-full md:w-1/3 bg-slate-900 p-8 text-white flex flex-col justify-between">
          <div>
            <div className="h-12 w-12 bg-gradient-to-tr from-pink-500 to-indigo-500 rounded-lg mb-6 flex items-center justify-center text-xl font-bold">
              PX
            </div>
            <h2 className="text-3xl font-bold mb-4">Nueva Tienda</h2>
            <p className="text-slate-300 mb-6 leading-relaxed">
              Registra una nueva instancia de Punto X SaaS. Esta acción
              configurará automáticamente una nueva base de datos lógica para el
              cliente (Tenant), creará su primer usuario administrador y
              establecerá los parámetros iniciales.
            </p>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Creación de Tenant
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Configuración de Admin
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                Aislamiento de Datos
              </li>
            </ul>
          </div>
          <div className="mt-8 text-xs text-slate-500">
            © 2024 Punto X - Panel de Administración
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-2/3 p-8 sm:p-12 overflow-y-auto max-h-[90vh]">
          <h3 className="text-2xl font-bold text-gray-800 mb-6">
            Formulario de Alta
          </h3>

          <form action={formAction} className="space-y-6">
            {/* Section: Seguridad */}
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded-r mb-6">
              <h4 className="text-sm font-semibold text-orange-800 uppercase tracking-wide mb-2">
                Seguridad
              </h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clave de Registro (Server Route Key)
                </label>
                <input
                  type="password"
                  name="adminKey"
                  required
                  placeholder="Ingrese la clave secreta del servidor"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Esta acción está protegida y requiere autorización.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Section: Datos de la Tienda */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Datos de la Tienda
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre del Comercio
                    </label>
                    <input
                      type="text"
                      name="storeName"
                      required
                      placeholder="Ej. Supermercado Central"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email del Comercio
                    </label>
                    <input
                      type="email"
                      name="storeEmail"
                      placeholder="contacto@comercio.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Section: Usuario Administrador */}
              <div className="md:col-span-2 space-y-4">
                <h4 className="text-lg font-semibold text-gray-700 border-b pb-2">
                  Usuario Administrador
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nombre
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      required
                      placeholder="Juan"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Apellido
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      required
                      placeholder="Perez"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Usuario (Username)
                    </label>
                    <input
                      type="text"
                      name="username"
                      required
                      placeholder="admin_tienda"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contraseña
                    </label>
                    <input
                      type="password"
                      name="password"
                      required
                      placeholder="••••••••"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Personal
                    </label>
                    <input
                      type="email"
                      name="email"
                      required
                      placeholder="juan.perez@email.com"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all outline-none"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={isPending}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
              >
                {isPending ? (
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                ) : (
                  "Registrar Nueva Tienda"
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
