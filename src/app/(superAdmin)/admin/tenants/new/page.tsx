"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, CardBody, CardHeader, Input } from "@heroui/react";
import { addToast } from "@heroui/react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Store,
  UserPlus,
  CreditCard,
} from "lucide-react";
import { registerTenant } from "@/app/actions/register-tenant";
import { useQuery } from "@tanstack/react-query";
import { Select, SelectItem } from "@heroui/react";

type RegisterState = {
  ok: boolean;
  message?: string;
  error?: string;
  tenantId?: bigint;
};

const initialState: RegisterState = {
  ok: false,
  message: "",
  error: "",
};

export default function NewTenantPage() {
  const router = useRouter();
  const [state, formAction, isPending] = useActionState(
    async (
      _prev: RegisterState,
      formData: FormData,
    ): Promise<RegisterState> => {
      const result = await registerTenant(formData);
      return {
        ok: result.ok,
        message: result.message ?? "",
        error: result.error ?? "",
        tenantId: result.tenantId,
      };
    },
    initialState,
  );

  const { data: planes, isLoading: loadingPlanes } = useQuery({
    queryKey: ["admin-planes"],
    queryFn: async () => {
      const res = await fetch("/api/admin/planes");
      const json = await res.json();
      return json.data || [];
    },
  });

  useEffect(() => {
    if (!state.message && !state.error) return;
    if (state.ok) {
      addToast({
        title: "Éxito",
        description: state.message || "La tienda fue creada con éxito.",
        color: "success",
      });
      // Redirigir a la página de administración después de un breve delay
      setTimeout(() => {
        router.push("/admin/tenants");
      }, 1000);
    } else {
      addToast({
        title: "Error",
        description: state.error || "Error al crear la tienda",
        color: "danger",
      });
    }
  }, [state, router]);

  return (
    <main className="space-y-6 pb-8">
      <Button
        variant="light"
        startContent={<ArrowLeft className="w-4 h-4" />}
        onPress={() => router.push("/admin/tenants")}
        className="text-slate-600 px-0 hover:bg-transparent hover:text-slate-900"
      >
        Volver a tiendas
      </Button>
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header / Nav */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#67afc3] to-[#4b8a9e] rounded-xl shadow-lg shadow-[#67afc3]/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">
                Nueva Tienda
              </h1>
              <p className="text-sm text-slate-500 hidden sm:block">
                Registrá un nuevo comercio y su administrador principal
              </p>
            </div>
          </div>
        </div>

        {state.error && (
          <Card className="border border-danger-200 bg-danger-50 shadow-none">
            <CardBody className="text-sm text-danger-700 py-3">
              {state.error}
            </CardBody>
          </Card>
        )}

        {state.message && state.ok && (
          <Card className="border border-success-200 bg-success-50 shadow-none">
            <CardBody className="text-sm text-success-700 py-3">
              {state.message}
            </CardBody>
          </Card>
        )}

        <form action={formAction} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna 1: Datos del Comercio */}
            <Card className="border-none shadow-xl bg-white/90 backdrop-blur-md h-full">
              <CardBody className="p-6 md:p-8">
                <section className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                      <Store className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Datos del comercio
                      </h2>
                      <p className="text-xs text-slate-500">
                        Configuración principal
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <Select
                      name="planId"
                      label="Plan asignado"
                      placeholder="Seleccione un plan"
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ label: "font-medium text-slate-700" }}
                      isRequired
                      isLoading={loadingPlanes}
                    >
                      {(planes || []).map((plan: any) => (
                        <SelectItem
                          key={plan.id?.toString() || plan.Id?.toString()}
                        >
                          {plan.nombre || plan.Nombre}
                        </SelectItem>
                      ))}
                    </Select>

                    <Input
                      name="tenantName"
                      label="Nombre del comercio"
                      placeholder="Ej: Kiosco San Martín"
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ label: "font-medium text-slate-700" }}
                      isRequired
                    />

                    <Input
                      name="tenantEmail"
                      type="email"
                      label="Email de contacto (opcional)"
                      placeholder="kiosco@example.com"
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ label: "font-medium text-slate-700" }}
                    />
                  </div>
                </section>
              </CardBody>
            </Card>

            {/* Columna 2: Usuario Administrador */}
            <Card className="border-none shadow-xl bg-white/90 backdrop-blur-md h-full">
              <CardBody className="p-6 md:p-8">
                <section className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-800">
                        Usuario administrador
                      </h2>
                      <p className="text-xs text-slate-500">
                        Credenciales de acceso
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <Input
                        name="adminNombre"
                        label="Nombre"
                        placeholder="Juan"
                        variant="bordered"
                        labelPlacement="outside"
                        classNames={{ label: "font-medium text-slate-700" }}
                        isRequired
                      />
                      <Input
                        name="adminApellido"
                        label="Apellido"
                        placeholder="Pérez"
                        variant="bordered"
                        labelPlacement="outside"
                        classNames={{ label: "font-medium text-slate-700" }}
                        isRequired
                      />
                    </div>

                    <Input
                      name="adminEmail"
                      type="email"
                      label="Email personal"
                      placeholder="juan.perez@example.com"
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ label: "font-medium text-slate-700" }}
                      isRequired
                    />

                    <Input
                      name="adminUsername"
                      label="Nombre de usuario"
                      placeholder="jperez"
                      description="Se genera desde el email si se omite"
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ label: "font-medium text-slate-700" }}
                      isRequired={false}
                    />

                    <Input
                      name="adminPassword"
                      type="password"
                      label="Contraseña inicial"
                      placeholder="Mínimo 6 caracteres"
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ label: "font-medium text-slate-700" }}
                      minLength={6}
                      isRequired
                    />
                  </div>
                </section>
              </CardBody>
            </Card>
          </div>

          {/* Footer Action */}
          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              className="w-full lg:w-auto px-10 font-medium bg-gradient-to-r from-[#67afc3] to-[#4b8a9e] text-white shadow-lg shadow-[#67afc3]/30"
              size="lg"
              isLoading={isPending}
            >
              {isPending ? "Creando comercio..." : "Crear comercio"}
            </Button>
          </div>
        </form>
      </div>
    </main>
  );
}
