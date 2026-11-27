"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Chip, Tooltip } from "@heroui/react";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  Plus,
} from "lucide-react";
import GenericCrud, { GenericFormProps } from "@/components/shared/GenericCrud";

type TenantSummary = {
  Id: number;
  id: number;
  name: string;
  email: string;
  razonSocial: string;
  dominio: string;
  plan: string;
  status: "activo" | "pendiente" | "cancelado";
  stores: number;
  admins: number;
  totalUsers: number;
  onboardingCompleto: boolean;
  fechaVencimiento: string | null;
  suscripcion: "activa" | "por_vencer" | "en_gracia" | "vencida" | "desactivada";
  ultimoDiaDeGracia: string | null;
};

const statusConfig: Record<
  string,
  { text: string; color: "success" | "warning" | "danger" | "default" }
> = {
  activo: { text: "Activo", color: "success" },
  pendiente: { text: "Pendiente", color: "warning" },
  cancelado: { text: "Cancelado", color: "danger" },
};

const planColors: Record<string, "primary" | "secondary" | "default"> = {
  "Plan Básico": "default",
  "Plan Intermedio": "secondary",
  "Plan Pro": "primary",
};

// Dummy form, no se usa para crear o editar desde aquí por ahora (se usa la vista de detalles / nueva tienda).
// Pero GenericCrud lo requiere.
function TenantForm(props: GenericFormProps<TenantSummary>) {
  return (
    <div className="p-4 text-center">
      <p>La edición de tenants se realiza desde su vista detallada.</p>
    </div>
  );
}

function AdminTenantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const columns = [
    { uid: "name", name: "Comercio", sortable: true },
    { uid: "status", name: "Estado", sortable: true },
    { uid: "plan", name: "Plan", sortable: true },
    { uid: "suscripcion", name: "Suscripción", sortable: true },
    { uid: "usuarios", name: "Usuarios", sortable: true },
    { uid: "onboarding", name: "Onboarding", sortable: true },
    { uid: "ver", name: "Acciones", sortable: false, align: "center" as const },
  ];

  const renderCell = (tenant: TenantSummary, columnKey: React.Key) => {
    switch (columnKey) {
      case "name":
        return (
          <div>
            <p className="font-semibold text-slate-900">{tenant.name}</p>
            {tenant.email && (
              <p className="text-xs text-slate-500">{tenant.email}</p>
            )}
            {tenant.razonSocial && (
              <p className="text-xs text-slate-400 mt-1">
                {tenant.razonSocial}
              </p>
            )}
          </div>
        );
      case "status":
        return (
          <Chip
            color={statusConfig[tenant.status]?.color || "default"}
            variant="flat"
            size="sm"
          >
            {statusConfig[tenant.status]?.text || tenant.status}
          </Chip>
        );
      case "plan":
        return (
          <Chip
            color={planColors[tenant.plan] || "default"}
            variant="flat"
            size="sm"
          >
            {tenant.plan}
          </Chip>
        );
      case "suscripcion": {
        const fecha = (iso: string | null) =>
          iso ? new Date(iso).toLocaleDateString("es-AR") : "";
        const vence = fecha(tenant.fechaVencimiento);

        if (tenant.suscripcion === "desactivada") {
          return (
            <Chip color="default" variant="flat" size="sm">
              Desactivado
            </Chip>
          );
        }
        if (!tenant.fechaVencimiento) {
          return (
            <Chip color="primary" variant="flat" size="sm">
              Sin vencimiento
            </Chip>
          );
        }

        const chip = {
          activa: { color: "success", texto: `Al día · ${vence}`, tip: `Vence el ${vence}` },
          por_vencer: { color: "warning", texto: `Vence ${vence}`, tip: "Vence en 7 días o menos" },
          en_gracia: {
            color: "warning",
            texto: `En gracia hasta ${fecha(tenant.ultimoDiaDeGracia)}`,
            tip: `Venció el ${vence}; se bloquea después del ${fecha(tenant.ultimoDiaDeGracia)}`,
          },
          vencida: { color: "danger", texto: `Bloqueado · venció ${vence}`, tip: "Sin acceso hasta renovar" },
        }[tenant.suscripcion] as {
          color: "success" | "warning" | "danger";
          texto: string;
          tip: string;
        };

        return (
          <Tooltip content={chip.tip}>
            <Chip
              color={chip.color}
              variant="flat"
              size="sm"
              startContent={
                chip.color === "success" ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <AlertTriangle className="w-3.5 h-3.5" />
                )
              }
            >
              {chip.texto}
            </Chip>
          </Tooltip>
        );
      }
      case "usuarios":
        return (
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-900">
              {tenant.totalUsers}
            </span>
            <span className="text-xs text-slate-500">
              ({tenant.admins} admin)
            </span>
          </div>
        );
      case "onboarding":
        return tenant.onboardingCompleto ? (
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="w-4 h-4" />
            <span className="text-sm font-medium">Completo</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Pendiente</span>
          </div>
        );
      case "ver":
        return (
          <Tooltip content="Ver detalles">
            <Button
              isIconOnly
              variant="light"
              color="primary"
              size="sm"
              onPress={() => router.push(`/admin/tenants/${tenant.id}`)}
            >
              <Eye className="w-4 h-4" />
            </Button>
          </Tooltip>
        );
      default:
        return null;
    }
  };

  const handleTenantAction = async (tenantId: number, action: string) => {
    try {
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, action }),
      });
      if (!res.ok) throw new Error("Error al ejecutar acción");
      // Trigger reload on GenericCrud automatically?
      // window.location.reload();
      // To properly trigger reload on genericCrud, we need a ref or just refresh page.
      // Easiest is generic page reload since this is a heavy action
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error al ejecutar acción");
    }
  };

  const handleDeleteTenant = async (tenantId: number, tenantName: string) => {
    if (
      !confirm(
        `¿Estás seguro de que deseas eliminar permanentemente la tienda "${tenantName}"?\n\nEsta acción eliminará TODOS los datos: usuarios, productos, comprobantes, y todo lo relacionado.\n\nEsta acción NO se puede deshacer.`,
      )
    ) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/tenants?id=${tenantId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Error al eliminar");
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert("Error al eliminar la tienda");
    }
  };

  return (
    <main className="min-h-screen sm:p-6 space-y-8">

      {/* CRUD Genérico */}
      <section className="bg-white rounded-xl shadow-lg p-4 md:p-6 overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Listado de Tiendas
            </h2>
            <p className="text-sm text-slate-500">
              Gestioná los comercios de la plataforma
            </p>
          </div>
          <Button
            color="primary"
            onPress={() => router.push("/admin/tenants/new")}
            startContent={<Plus className="w-4 h-4" />}
            className="font-medium bg-[#0066ff] hover:bg-[#0050cb]"
          >
            Nueva Tienda
          </Button>
        </div>

        {/* Note: we hide GenericCrud's default create button using global CSS or just hide it by wrapping */}
        <div className="[&_button[aria-label='Nuevo']]:hidden">
          <GenericCrud<TenantSummary>
            apiPath="/api/admin/tenants"
            queryKey="admin-tenants"
            columns={columns}
            renderCell={renderCell}
            FormComponent={TenantForm}
            searchPlaceholder="Buscar tienda..."
            showEditInPreview={false}
            transformer={(data) => data.map((t: any) => ({ ...t, Id: t.id }))}
            onRowClick={(item) => router.push(`/admin/tenants/${item.id}`)}
            bulkActionsDropdown={[
              {
                key: "activate",
                label: "Activar seleccionados",
                onAction: async ({ ids, clearSelection }) => {
                  for (const id of ids)
                    await handleTenantAction(Number(id), "activate");
                  clearSelection();
                },
              },
              {
                key: "deactivate",
                label: "Desactivar seleccionados",
                onAction: async ({ ids, clearSelection }) => {
                  for (const id of ids)
                    await handleTenantAction(Number(id), "deactivate");
                  clearSelection();
                },
              },
            ]}
          />
        </div>
      </section>
    </main>
  );
}

export default function AdminTenantsPage() {
  return (
    <Suspense fallback={<div>Cargando...</div>}>
      <AdminTenantsContent />
    </Suspense>
  );
}
