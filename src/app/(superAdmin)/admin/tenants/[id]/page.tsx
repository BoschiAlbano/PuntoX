"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Spinner,
  Button,
  Tabs,
  Tab,
  addToast,
  Tooltip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import {
  Building2,
  Users,
  Store,
  Settings,
  Shield,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  Lock,
  Unlock,
  MoreVertical,
  Mail,
  KeyRound,
  LogOut,
  Globe,
  Phone,
  MapPin,
  CreditCard,
  Package,
  Tag,
  FolderOpen,
  Truck,
} from "lucide-react";

type TenantDetail = {
  id: number;
  nombre: string;
  dominio: string | null;
  estaActivo: boolean;
  onboardingCompleto: boolean;
  estaEliminado: boolean;
  fechaVencimiento: string | null;
  plan: { id: number; nombre: string; costoMensual: number } | null;
  configuracion: {
    razonSocial: string;
    nombreFantasia: string | null;
    cuit: string;
    telefono: string | null;
    celular: string | null;
    direccion: string;
    email: string | null;
    moneda: string | null;
    zonaHoraria: string | null;
    forzar2FA: boolean;
    afipHabilitado: boolean;
  } | null;
  conteos: {
    usuarios: number;
    sucursales: number;
    articulos: number;
    marcas: number;
    rubros: number;
    proveedores: number;
  };
};

type TenantUser = {
  id: number;
  usuario: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  estaBloqueado: boolean;
  intentosFallidos: number;
  roles: { descripcion: string; tipo: string }[];
  sucursales: { id: number; nombre: string }[];
  ultimaActividad: string | null;
  dispositivo: string | null;
};

export default function TenantDetailPage() {
  const router = useRouter();
  const params = useParams();
  const queryClient = useQueryClient();
  const tenantId = params.id as string;
  const [selectedTab, setSelectedTab] = useState("general");

  // Tenant detail query
  const { data: tenant, isLoading } = useQuery<TenantDetail>({
    queryKey: ["admin-tenant", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tenants/${tenantId}`);
      if (!res.ok) throw new Error("Error al cargar tenant");
      return res.json();
    },
  });

  // Users query
  const { data: usersData, isLoading: isLoadingUsers } = useQuery<{
    usuarios: TenantUser[];
  }>({
    queryKey: ["admin-tenant-users", tenantId],
    queryFn: async () => {
      const res = await fetch(`/api/admin/tenants/${tenantId}/usuarios`);
      if (!res.ok) throw new Error("Error al cargar usuarios");
      return res.json();
    },
    enabled: selectedTab === "usuarios",
  });

  // User action mutation
  const userActionMutation = useMutation({
    mutationFn: async ({
      usuarioId,
      action,
    }: {
      usuarioId: number;
      action: string;
    }) => {
      const res = await fetch(`/api/admin/tenants/${tenantId}/usuarios`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ usuarioId, action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error");
      }
      return res.json();
    },
    onSuccess: (data) => {
      addToast({
        title: "Éxito",
        description: data.message,
        color: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-tenant-users", tenantId],
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    },
  });

  // Tenant action mutation
  const tenantActionMutation = useMutation({
    mutationFn: async (action: string) => {
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: Number(tenantId), action }),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error");
      }
      return res.json();
    },
    onSuccess: () => {
      addToast({
        title: "Éxito",
        description: "Acción ejecutada correctamente",
        color: "success",
      });
      queryClient.invalidateQueries({
        queryKey: ["admin-tenant", tenantId],
      });
    },
    onError: (error: Error) => {
      addToast({
        title: "Error",
        description: error.message,
        color: "danger",
      });
    },
  });

  if (isLoading || !tenant) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="space-y-4">
        <Button
          variant="light"
          startContent={<ArrowLeft className="w-4 h-4" />}
          onPress={() => router.push("/admin/tenants")}
          className="text-slate-600"
        >
          Volver a tiendas
        </Button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Building2 className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {tenant.nombre}
              </h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <Chip
                  size="sm"
                  variant="flat"
                  color={tenant.estaActivo ? "success" : "danger"}
                  startContent={
                    tenant.estaActivo ? (
                      <CheckCircle2 className="w-3 h-3" />
                    ) : (
                      <XCircle className="w-3 h-3" />
                    )
                  }
                >
                  {tenant.estaActivo ? "Activo" : "Inactivo"}
                </Chip>
                {tenant.plan && (
                  <Chip size="sm" variant="flat" color="primary">
                    {tenant.plan.nombre}
                  </Chip>
                )}
                {!tenant.onboardingCompleto && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color="warning"
                    startContent={<Clock className="w-3 h-3" />}
                  >
                    Onboarding pendiente
                  </Chip>
                )}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            {tenant.estaActivo ? (
              <Button
                color="danger"
                variant="flat"
                size="sm"
                startContent={<Lock className="w-4 h-4" />}
                onPress={() => tenantActionMutation.mutate("deactivate")}
                isLoading={tenantActionMutation.isPending}
              >
                Desactivar
              </Button>
            ) : (
              <Button
                color="success"
                variant="flat"
                size="sm"
                startContent={<Unlock className="w-4 h-4" />}
                onPress={() => tenantActionMutation.mutate("activate")}
                isLoading={tenantActionMutation.isPending}
              >
                Activar
              </Button>
            )}
            {!tenant.onboardingCompleto && (
              <Button
                color="primary"
                variant="flat"
                size="sm"
                startContent={<CheckCircle2 className="w-4 h-4" />}
                onPress={() =>
                  tenantActionMutation.mutate("completeOnboarding")
                }
                isLoading={tenantActionMutation.isPending}
              >
                Completar Onboarding
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            label: "Usuarios",
            value: tenant.conteos.usuarios,
            icon: Users,
            color: "text-blue-600",
            bg: "bg-blue-50",
          },
          {
            label: "Sucursales",
            value: tenant.conteos.sucursales,
            icon: Store,
            color: "text-emerald-600",
            bg: "bg-emerald-50",
          },
          {
            label: "Artículos",
            value: tenant.conteos.articulos,
            icon: Package,
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
          {
            label: "Marcas",
            value: tenant.conteos.marcas,
            icon: Tag,
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Rubros",
            value: tenant.conteos.rubros,
            icon: FolderOpen,
            color: "text-rose-600",
            bg: "bg-rose-50",
          },
          {
            label: "Proveedores",
            value: tenant.conteos.proveedores,
            icon: Truck,
            color: "text-cyan-600",
            bg: "bg-cyan-50",
          },
        ].map((stat) => (
          <Card key={stat.label} className="shadow-sm">
            <CardBody className="flex flex-row items-center gap-3 py-3 px-4">
              <div className={`p-2 rounded-lg ${stat.bg}`}>
                <stat.icon className={`w-4 h-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-900">{stat.value}</p>
                <p className="text-[11px] text-slate-500 uppercase tracking-wider font-medium">
                  {stat.label}
                </p>
              </div>
            </CardBody>
          </Card>
        ))}
      </section>

      {/* Tabs */}
      <Tabs
        selectedKey={selectedTab}
        onSelectionChange={(key) => setSelectedTab(key as string)}
        variant="underlined"
        classNames={{
          tabList: "gap-4",
          tab: "h-10",
        }}
      >
        {/* General Tab */}
        <Tab
          key="general"
          title={
            <div className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              <span>General</span>
            </div>
          }
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
            {/* Business Info */}
            <Card className="shadow-sm">
              <CardHeader>
                <h3 className="text-base font-semibold">Datos del Negocio</h3>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-3">
                {tenant.configuracion ? (
                  <>
                    <InfoRow
                      label="Razón Social"
                      value={tenant.configuracion.razonSocial}
                    />
                    <InfoRow
                      label="Nombre Fantasía"
                      value={tenant.configuracion.nombreFantasia || "—"}
                    />
                    <InfoRow label="CUIT" value={tenant.configuracion.cuit} />
                    <InfoRow
                      label="Dirección"
                      value={tenant.configuracion.direccion}
                      icon={<MapPin className="w-3.5 h-3.5" />}
                    />
                    <InfoRow
                      label="Email"
                      value={tenant.configuracion.email || "—"}
                      icon={<Mail className="w-3.5 h-3.5" />}
                    />
                    <InfoRow
                      label="Teléfono"
                      value={tenant.configuracion.telefono || "—"}
                      icon={<Phone className="w-3.5 h-3.5" />}
                    />
                    <InfoRow
                      label="Dominio"
                      value={tenant.dominio || "—"}
                      icon={<Globe className="w-3.5 h-3.5" />}
                    />
                  </>
                ) : (
                  <p className="text-sm text-slate-500 py-4 text-center">
                    Sin configuración
                  </p>
                )}
              </CardBody>
            </Card>

            {/* Plan & Settings */}
            <Card className="shadow-sm">
              <CardHeader>
                <h3 className="text-base font-semibold">Plan y Ajustes</h3>
              </CardHeader>
              <Divider />
              <CardBody className="space-y-3">
                <InfoRow
                  label="Plan"
                  value={tenant.plan?.nombre || "Sin plan"}
                  icon={<CreditCard className="w-3.5 h-3.5" />}
                />
                {tenant.plan && (
                  <InfoRow
                    label="Costo Mensual"
                    value={`$${tenant.plan.costoMensual.toLocaleString("es-AR")}`}
                  />
                )}
                <InfoRow
                  label="Vencimiento"
                  value={tenant.fechaVencimiento ? new Date(tenant.fechaVencimiento).toLocaleDateString("es-AR") : "Sin vencimiento"}
                  icon={<Clock className="w-3.5 h-3.5" />}
                />
                <Button
                  color="primary"
                  variant="flat"
                  size="sm"
                  className="w-full mt-2"
                  onPress={() => tenantActionMutation.mutate("renovar")}
                  isLoading={tenantActionMutation.isPending}
                >
                  Renovar Suscripción (+30 días)
                </Button>
                <Divider className="my-2" />
                <InfoRow
                  label="Moneda"
                  value={tenant.configuracion?.moneda || "ARS"}
                />
                <InfoRow
                  label="Zona Horaria"
                  value={
                    tenant.configuracion?.zonaHoraria || "America/Argentina/Buenos_Aires"
                  }
                />
                <Divider />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">2FA Obligatorio</span>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={
                      tenant.configuracion?.forzar2FA ? "success" : "default"
                    }
                  >
                    {tenant.configuracion?.forzar2FA
                      ? "Activado"
                      : "Desactivado"}
                  </Chip>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">
                    Facturación Electrónica
                  </span>
                  <Chip
                    size="sm"
                    variant="flat"
                    color={
                      tenant.configuracion?.afipHabilitado
                        ? "success"
                        : "default"
                    }
                  >
                    {tenant.configuracion?.afipHabilitado
                      ? "Habilitado"
                      : "Deshabilitado"}
                  </Chip>
                </div>
              </CardBody>
            </Card>
          </div>
        </Tab>

        {/* Users Tab */}
        <Tab
          key="usuarios"
          title={
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span>Usuarios ({tenant.conteos.usuarios})</span>
            </div>
          }
        >
          <div className="mt-4">
            {isLoadingUsers ? (
              <div className="flex justify-center py-12">
                <Spinner size="lg" />
              </div>
            ) : (
              <Card className="shadow-sm">
                <CardBody className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                            Usuario
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                            Roles
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                            Estado
                          </th>
                          <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                            Última actividad
                          </th>
                          <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                            Acciones
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {usersData?.usuarios.map((user) => (
                          <tr
                            key={user.id}
                            className="hover:bg-slate-50 transition-colors"
                          >
                            <td className="px-5 py-3">
                              <div>
                                <p className="font-semibold text-sm text-slate-900">
                                  {user.nombre} {user.apellido}
                                </p>
                                <p className="text-xs text-slate-500">
                                  @{user.usuario}
                                  {user.email && ` · ${user.email}`}
                                </p>
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex flex-wrap gap-1">
                                {user.roles.map((role, idx) => (
                                  <Chip
                                    key={idx}
                                    size="sm"
                                    variant="flat"
                                    color={
                                      role.tipo === "ADMINISTRADOR"
                                        ? "primary"
                                        : role.tipo === "SUPERADMIN"
                                          ? "warning"
                                          : "default"
                                    }
                                  >
                                    {role.descripcion}
                                  </Chip>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-3">
                              {user.estaBloqueado ? (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color="danger"
                                  startContent={<Lock className="w-3 h-3" />}
                                >
                                  Bloqueado
                                </Chip>
                              ) : (
                                <Chip
                                  size="sm"
                                  variant="flat"
                                  color="success"
                                >
                                  Activo
                                </Chip>
                              )}
                            </td>
                            <td className="px-5 py-3 text-sm text-slate-600">
                              {user.ultimaActividad
                                ? new Date(
                                    user.ultimaActividad,
                                  ).toLocaleString("es-AR", {
                                    day: "2-digit",
                                    month: "short",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "Sin actividad"}
                            </td>
                            <td className="px-5 py-3">
                              <div className="flex justify-end">
                                <Dropdown>
                                  <DropdownTrigger>
                                    <Button
                                      isIconOnly
                                      variant="light"
                                      size="sm"
                                    >
                                      <MoreVertical className="w-4 h-4" />
                                    </Button>
                                  </DropdownTrigger>
                                  <DropdownMenu
                                    aria-label="Acciones del usuario"
                                    onAction={(key) => {
                                      userActionMutation.mutate({
                                        usuarioId: user.id,
                                        action: key as string,
                                      });
                                    }}
                                  >
                                    {user.estaBloqueado ? (
                                      <DropdownItem
                                        key="unblock"
                                        startContent={
                                          <Unlock className="w-4 h-4" />
                                        }
                                      >
                                        Desbloquear
                                      </DropdownItem>
                                    ) : (
                                      <DropdownItem
                                        key="block"
                                        startContent={
                                          <Lock className="w-4 h-4" />
                                        }
                                        className="text-danger"
                                        color="danger"
                                      >
                                        Bloquear
                                      </DropdownItem>
                                    )}
                                    <DropdownItem
                                      key="resetPassword"
                                      startContent={
                                        <KeyRound className="w-4 h-4" />
                                      }
                                    >
                                      Resetear contraseña
                                    </DropdownItem>
                                    <DropdownItem
                                      key="closeSessions"
                                      startContent={
                                        <LogOut className="w-4 h-4" />
                                      }
                                      className="text-danger"
                                      color="danger"
                                    >
                                      Cerrar sesiones
                                    </DropdownItem>
                                  </DropdownMenu>
                                </Dropdown>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {(!usersData?.usuarios || usersData.usuarios.length === 0) && (
                    <div className="text-center py-12 text-slate-500">
                      <Users className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                      <p>No hay usuarios en esta tienda</p>
                    </div>
                  )}
                </CardBody>
              </Card>
            )}
          </div>
        </Tab>
      </Tabs>
    </div>
  );
}

// Helper component
function InfoRow({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <span className="text-sm text-slate-500 shrink-0">{label}</span>
      <div className="flex items-center gap-1.5 text-right">
        {icon && <span className="text-slate-400">{icon}</span>}
        <span className="text-sm font-medium text-slate-800">{value}</span>
      </div>
    </div>
  );
}
