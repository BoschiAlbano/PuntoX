"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Button,
  Card,
  CardBody,
  Select,
  SelectItem,
  Chip,
  Tooltip,
} from "@heroui/react";
import {
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  XCircle,
  Clock,
  Eye,
  Plus,
} from "lucide-react";
import GenericCrud, { GenericFormProps } from "@/components/shared/GenericCrud";
import StatCard from "@/components/dashboard/StatCard";

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
  Base: "default",
  Growth: "secondary",
  Premium: "primary",
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
  const [totals, setTotals] = useState({
    active: 0,
    pending: 0,
    canceled: 0,
    total: 0,
  });

  // Fetch totals independientemente para las tarjetas
  useEffect(() => {
    fetch("/api/admin/tenants?limit=1")
      .then((res) => res.json())
      .then((data) => {
        if (data.totals) {
          setTotals(data.totals);
        }
      })
      .catch(console.error);
  }, []);

  const columns = [
    { uid: "name", name: "Comercio", sortable: true },
    { uid: "status", name: "Estado", sortable: true },
    { uid: "plan", name: "Plan", sortable: true },
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
      {/* Cards de métricas */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tiendas Activas"
          value={totals.active}
          subtitle={`${totals.total > 0 ? Math.round((totals.active / totals.total) * 100) : 0}% del total`}
          icon={Building2}
          colorScheme="green"
          delay={0}
        />
        <StatCard
          title="Pendientes"
          value={totals.pending}
          subtitle="Requieren atención"
          icon={Clock}
          colorScheme="orange"
          delay={0.05}
        />
        <StatCard
          title="Canceladas"
          value={totals.canceled}
          subtitle="Accesos suspendidos"
          icon={XCircle}
          colorScheme="red"
          delay={0.1}
        />
        <StatCard
          title="Total Tiendas"
          value={totals.total}
          subtitle="En el sistema"
          icon={Building2}
          colorScheme="blue"
          delay={0.15}
        />
      </section>

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
            className="font-medium bg-gradient-to-r from-[#67afc3] to-[#4b8a9e]"
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
