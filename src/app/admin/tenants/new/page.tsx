import {
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
} from "@heroui/react";
import { redirect } from "next/navigation";
import { registerTenant } from "@/app/actions/register-tenant";
import { requireSuperAdmin } from "@/lib/requireSuperAdmin";

export const dynamic = "force-dynamic";

export default async function NewTenantPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; success?: string }>;
}) {
  await requireSuperAdmin();

  const params = await searchParams;
  const errorMessage = params?.error && decodeURIComponent(params.error);
  const successMessage = params?.success && decodeURIComponent(params.success);

  async function action(formData: FormData) {
    "use server";

    const result = await registerTenant(formData);

    if (!result.ok) {
      const msg = result.error ?? "Error al crear el comercio";
      redirect(`/admin/tenants/new?error=${encodeURIComponent(msg)}`);
    }

    const msg = result.message ?? "La tienda fue creada con éxito.";
    redirect(`/admin/tenants/new?success=${encodeURIComponent(msg)}`);
  }

  return (
    <main className="max-w-xl mx-auto py-8 px-4">
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
          {errorMessage ? (
            <Card className="border border-danger-200 bg-danger-50">
              <CardBody className="text-sm text-danger-700">
                {errorMessage}
              </CardBody>
            </Card>
          ) : null}

          {successMessage ? (
            <Card className="border border-success-200 bg-success-50">
              <CardBody className="text-sm text-success-700">
                {successMessage}
              </CardBody>
            </Card>
          ) : null}

          <form action={action} className="space-y-6">
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
              <Button type="submit" color="primary" fullWidth>
                Crear comercio
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
