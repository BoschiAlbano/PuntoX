"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import Link from "next/link";
import { ArrowLeft, Building2, Store, UserPlus } from "lucide-react";
import { registerTenant } from "@/app/actions/register-tenant";

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
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-4 md:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Link
            href="/admin/tenants"
            className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 rounded-lg border border-slate-200 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver a tiendas
          </Link>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-[#67afc3] to-[#4b8a9e] rounded-xl shadow-lg shadow-[#67afc3]/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Nueva Tienda
              </h1>
              <p className="text-sm text-slate-500">
                Registrá un nuevo comercio y su administrador principal
              </p>
            </div>
          </div>
        </div>

        <Card className="border-none shadow-xl bg-white/90 backdrop-blur-md">
          <CardBody className="p-6 md:p-8 space-y-8">
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

            <form action={formAction} className="space-y-8">
              {/* Datos del Comercio */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-md">
                    <Store className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Datos del comercio
                  </h2>
                </div>
                <div className="grid gap-4">
                  <Input
                    name="tenantName"
                    label="Nombre del comercio"
                    placeholder="Ej: Kiosco San Martín"
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{ label: "font-medium" }}
                    isRequired
                  />
                  <Input
                    name="tenantEmail"
                    type="email"
                    label="Email de contacto (opcional)"
                    placeholder="kiosco@example.com"
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{ label: "font-medium" }}
                  />
                </div>
              </section>

              {/* Usuario Administrador */}
              <section className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                  <div className="p-1.5 bg-purple-50 text-purple-600 rounded-md">
                    <UserPlus className="w-4 h-4" />
                  </div>
                  <h2 className="text-base font-semibold text-slate-800">
                    Usuario administrador
                  </h2>
                </div>
                <div className="grid gap-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      name="adminNombre"
                      label="Nombre"
                      placeholder="Juan"
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ label: "font-medium" }}
                      isRequired
                    />
                    <Input
                      name="adminApellido"
                      label="Apellido"
                      placeholder="Pérez"
                      variant="bordered"
                      labelPlacement="outside"
                      classNames={{ label: "font-medium" }}
                      isRequired
                    />
                  </div>
                  <Input
                    name="adminUsername"
                    label="Nombre de usuario"
                    placeholder="jperez"
                    description="Si no se proporciona, se generará desde el email"
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{ label: "font-medium" }}
                    isRequired={false}
                  />
                  <Input
                    name="adminEmail"
                    type="email"
                    label="Email personal"
                    placeholder="juan.perez@example.com"
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{ label: "font-medium" }}
                    isRequired
                  />
                  <Input
                    name="adminPassword"
                    type="password"
                    label="Contraseña inicial"
                    placeholder="Mínimo 6 caracteres"
                    variant="bordered"
                    labelPlacement="outside"
                    classNames={{ label: "font-medium" }}
                    minLength={6}
                    isRequired
                  />
                </div>
              </section>

              <div className="pt-4">
                <Button
                  type="submit"
                  className="w-full font-medium bg-gradient-to-r from-[#67afc3] to-[#4b8a9e] text-white shadow-md"
                  size="lg"
                  isLoading={isPending}
                >
                  {isPending ? "Creando..." : "Crear comercio"}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
