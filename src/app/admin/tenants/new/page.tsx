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
import { ArrowLeft } from "lucide-react";
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
    <main className="max-w-xl mx-auto py-8 px-4">
      <div className="mb-4">
        <Link
          href="/admin/tenants"
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a administración de tiendas
        </Link>
      </div>
      <Card shadow="lg">
        <CardHeader className="flex flex-col items-start gap-2">
          <h1 className="text-2xl font-semibold">Nuevo comercio (Tenant)</h1>
          <p className="text-sm text-gray-500">
            Solo visible para SuperAdmin. Crea un nuevo comercio y su usuario
            administrador.
          </p>
        </CardHeader>
        <Divider />
        <CardBody className="space-y-6">
          {state.error && (
            <Card className="border border-danger-200 bg-danger-50">
              <CardBody className="text-sm text-danger-700">
                {state.error}
              </CardBody>
            </Card>
          )}

          {state.message && state.ok && (
            <Card className="border border-success-200 bg-success-50">
              <CardBody className="text-sm text-success-700">
                {state.message}
              </CardBody>
            </Card>
          )}

          <form action={formAction} className="space-y-6">
            <section className="space-y-3">
              <h2 className="font-medium text-gray-800">Datos del comercio</h2>
              <Input
                name="tenantName"
                label="Nombre del comercio"
                placeholder="Ej: Kiosco San Martín"
                isRequired
              />
              <Input
                name="tenantEmail"
                type="email"
                label="Email de contacto (opcional)"
                placeholder="kiosco@example.com"
              />
            </section>

            <Divider />

            <section className="space-y-3">
              <h2 className="font-medium text-gray-800">
                Usuario administrador
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input name="adminNombre" label="Nombre" isRequired />
                <Input name="adminApellido" label="Apellido" isRequired />
              </div>
              <Input name="adminEmail" type="email" label="Email" isRequired />
              <Input
                name="adminPassword"
                type="password"
                label="Contraseña inicial"
                minLength={6}
                isRequired
              />
            </section>

            <Divider />

            <div className="pt-2">
              <Button type="submit" color="primary" fullWidth isLoading={isPending}>
                Crear comercio
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
