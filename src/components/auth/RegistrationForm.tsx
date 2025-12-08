"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";

interface RegistrationData {
  apellido: string;
  nombre: string;
  dni: string;
  direccion: string;
  telefono: string;
  mail: string;
  localidadId: string;
  nombreUsuario: string;
  password: string;
  confirmPassword: string;
  tenantId: string;
}

interface Localidad {
  Id: number;
  Descripcion: string;
}

export default function RegistrationForm() {
  const defaultTenantId = process.env.NEXT_PUBLIC_TENANT_ID || "";
  const [formData, setFormData] = useState<RegistrationData>({
    apellido: "",
    nombre: "",
    dni: "",
    direccion: "",
    telefono: "",
    mail: "",
    localidadId: "",
    nombreUsuario: "",
    password: "",
    confirmPassword: "",
    tenantId: defaultTenantId,
  });

  const [localidades, setLocalidades] = useState<Localidad[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const router = useRouter();
  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    const fetchLocalidades = async () => {
      try {
        const response = await fetch("/api/localidades");
        if (response.ok) {
          const data = await response.json();
          setLocalidades(data);
        }
      } catch (err) {
        console.error("Error al cargar localidades:", err);
      }
    };

    fetchLocalidades();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = (): boolean => {
    if (
      !formData.apellido ||
      !formData.nombre ||
      !formData.direccion ||
      !formData.mail ||
      !formData.localidadId ||
      !formData.nombreUsuario ||
      !formData.password ||
      !formData.confirmPassword ||
      !formData.tenantId
    ) {
      setError("Todos los campos obligatorios deben estar completos");
      return false;
    }

    if (!formData.tenantId) {
      setError(
        "No se ha configurado el TenantId. Contacta a un administrador o define NEXT_PUBLIC_TENANT_ID."
      );
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }

    if (!formData.mail.includes("@")) {
      setError("El email no es válido");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const normalizedMail = formData.mail.trim().toLowerCase();
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          mail: normalizedMail,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error en el registro");
      }

      setSuccess("Usuario registrado exitosamente");

      setTimeout(async () => {
        try {
          const { error: authError } = await supabase.auth.signInWithPassword({
            email: normalizedMail,
            password: formData.password,
          });
          if (authError) {
            throw authError;
          }
          router.push("/ventas");
        } catch (err) {
          console.error("Error en auto-login:", err);
          router.push("/signin");
        }
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error en el registro");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Información Personal */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          Información Personal
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="apellido"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Apellido *
            </label>
            <input
              id="apellido"
              name="apellido"
              type="text"
              value={formData.apellido}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Apellido"
            />
          </div>

          <div>
            <label
              htmlFor="nombre"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Nombre *
            </label>
            <input
              id="nombre"
              name="nombre"
              type="text"
              value={formData.nombre}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="dni"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              DNI
            </label>
            <input
              id="dni"
              name="dni"
              type="text"
              value={formData.dni}
              onChange={handleInputChange}
              maxLength={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="12345678"
            />
          </div>

          <div>
            <label
              htmlFor="telefono"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Teléfono
            </label>
            <input
              id="telefono"
              name="telefono"
              type="tel"
              value={formData.telefono}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="+54 11 1234-5678"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="direccion"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Dirección *
          </label>
          <input
            id="direccion"
            name="direccion"
            type="text"
            value={formData.direccion}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Calle, número, piso, depto"
          />
        </div>

        <div>
          <label
            htmlFor="mail"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Correo Electrónico *
          </label>
          <input
            id="mail"
            name="mail"
            type="email"
            value={formData.mail}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="tu@email.com"
          />
        </div>

        <div>
          <label
            htmlFor="localidadId"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Localidad *
          </label>
          <select
            id="localidadId"
            name="localidadId"
            value={formData.localidadId}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecciona una localidad</option>
            {localidades.map((localidad) => (
              <option key={localidad.Id} value={localidad.Id}>
                {localidad.Descripcion}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Información de Usuario */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
          Información de Usuario
        </h3>

        <div>
          <label
            htmlFor="nombreUsuario"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Nombre de Usuario *
          </label>
          <input
            id="nombreUsuario"
            name="nombreUsuario"
            type="text"
            value={formData.nombreUsuario}
            onChange={handleInputChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="usuario123"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="********"
            />
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Confirmar Contraseña *
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="********"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
          {error}
        </div>
      )}

      {success && (
        <div className="text-green-600 text-sm bg-green-50 p-3 rounded-lg">
          {success}
        </div>
      )}

      <button
        type="submit"
        disabled={isLoading}
        className="w-full bg-gradient-to-r from-blue-500 to-[#90c472] text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 font-medium"
      >
        {isLoading ? "Registrando..." : "Crear Cuenta"}
      </button>
    </form>
  );
}
