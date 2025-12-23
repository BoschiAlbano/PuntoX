"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  Divider,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Spinner,
  Tooltip,
  Chip,
  Dropdown,
  DropdownTrigger,
  DropdownMenu,
  DropdownItem,
} from "@heroui/react";
import { addToast } from "@heroui/react";
import {
  Plus,
  Search,
  Filter,
  Download,
  AlertCircle,
  Building2,
  Users,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Eye,
  Settings,
  Lock,
  Unlock,
  RefreshCw,
  MoreVertical,
  ExternalLink,
  UserCheck,
  Mail,
  Phone,
  Globe,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
} from "lucide-react";

type TenantSummary = {
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
  lastLogin: string | null;
};

type Totals = {
  active: number;
  pending: number;
  canceled: number;
  total: number;
};

const statusConfig: Record<string, { text: string; color: "success" | "warning" | "danger" | "default" }> = {
  activo: { text: "Activo", color: "success" },
  pendiente: { text: "Pendiente", color: "warning" },
  cancelado: { text: "Cancelado", color: "danger" },
};

const planColors: Record<string, "primary" | "secondary" | "default"> = {
  Base: "default",
  Growth: "secondary",
  Premium: "primary",
};

function AdminTenantsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("todos");
  const [planFilter, setPlanFilter] = useState<string>("todos");
  const [tenants, setTenants] = useState<TenantSummary[]>([]);
  const [totals, setTotals] = useState<Totals>({ active: 0, pending: 0, canceled: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTenant, setSelectedTenant] = useState<TenantSummary | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  // Mostrar mensaje de éxito si viene de la creación
  useEffect(() => {
    const successMessage = searchParams.get("success");
    if (successMessage) {
      addToast({
        title: "Éxito",
        description: decodeURIComponent(successMessage),
        color: "success",
      });
      // Limpiar el parámetro de la URL
      router.replace("/admin/tenants");
    }
  }, [searchParams, router]);

  // Cargar datos
  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setIsLoading(true);
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (statusFilter !== "todos") params.append("status", statusFilter);
      if (planFilter !== "todos") params.append("plan", planFilter);

      const res = await fetch(`/api/admin/tenants?${params.toString()}`, {
        cache: "no-store",
      });

      if (!res.ok) {
        throw new Error("Error al cargar tenants");
      }

      const data = await res.json();
      setTenants(data.tenants || []);
      setTotals(data.totals || { active: 0, pending: 0, canceled: 0, total: 0 });
    } catch (error) {
      console.error("Error cargando tenants:", error);
      addToast({
        title: "Error",
        description: "No se pudieron cargar los tenants",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Recargar cuando cambian los filtros
  useEffect(() => {
    if (!isLoading) {
      loadTenants();
    }
  }, [search, statusFilter, planFilter]);

  const handleTenantAction = async (tenantId: number, action: string) => {
    try {
      setIsActionLoading(true);
      const res = await fetch("/api/admin/tenants", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId, action }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || "Error al ejecutar acción");
      }

      addToast({
        title: "Éxito",
        description: "Acción ejecutada correctamente",
        color: "success",
      });

      await loadTenants();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error ejecutando acción:", error);
      addToast({
        title: "Error",
        description: error instanceof Error ? error.message : "Error al ejecutar acción",
        color: "danger",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeleteTenant = async (tenantId: number, tenantName: string) => {
    if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente la tienda "${tenantName}"?\n\nEsta acción eliminará TODOS los datos: usuarios, productos, comprobantes, y todo lo relacionado.\n\nEsta acción NO se puede deshacer.`)) {
      return;
    }

    try {
      setIsActionLoading(true);
      const res = await fetch(`/api/admin/tenants?id=${tenantId}`, {
        method: "DELETE",
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMessage = typeof data === "object" && data !== null && "error" in data
          ? String(data.error)
          : typeof data === "string"
          ? data
          : "Error al eliminar tenant";
        throw new Error(errorMessage);
      }

      addToast({
        title: "Eliminado",
        description: data.message || "Tienda eliminada permanentemente",
        color: "success",
      });

      await loadTenants();
      setIsModalOpen(false);
    } catch (error) {
      console.error("Error eliminando tenant:", error);
      let errorMessage = "Error al eliminar tenant";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "object" && error !== null) {
        errorMessage = JSON.stringify(error);
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      addToast({
        title: "Error",
        description: errorMessage,
        color: "danger",
      });
    } finally {
      setIsActionLoading(false);
    }
  };

  const filteredTenants = useMemo(() => {
    return tenants.filter((tenant) => {
      const matchesSearch =
        !search ||
        tenant.name.toLowerCase().includes(search.toLowerCase()) ||
        tenant.email.toLowerCase().includes(search.toLowerCase()) ||
        tenant.razonSocial.toLowerCase().includes(search.toLowerCase());

      const matchesStatus = statusFilter === "todos" || tenant.status === statusFilter;
      const matchesPlan = planFilter === "todos" || tenant.plan === planFilter;
      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [tenants, search, statusFilter, planFilter]);

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("todos");
    setPlanFilter("todos");
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 p-6 space-y-8">
      {/* Header mejorado */}
      <header className="space-y-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                  Panel de Administración
                </p>
                <h1 className="text-4xl font-bold text-slate-900 mt-1">
                  Gestión de Tiendas
                </h1>
              </div>
            </div>
            <p className="text-slate-600 max-w-2xl">
              Administrá todas las tiendas desde un solo lugar. Controlá accesos, revisá estadísticas
              y gestioná el ecosistema completo de Punto X.
            </p>
          </div>
        </div>

        {/* Botones de acción rápida */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            color="primary"
            startContent={<Plus className="w-4 h-4" />}
            onPress={() => router.push("/admin/tenants/new")}
          >
            Nueva Tienda
          </Button>
          <Button
            variant="flat"
            color="secondary"
            startContent={<Download className="w-4 h-4" />}
          >
            Exportar Datos
          </Button>
          <Button
            variant="light"
            color="danger"
            startContent={<AlertCircle className="w-4 h-4" />}
          >
            Alertas <Badge color="danger" size="sm">3</Badge>
          </Button>
          <Button
            variant="light"
            color="default"
            startContent={<RefreshCw className="w-4 h-4" />}
            onPress={loadTenants}
            isLoading={isLoading}
          >
            Actualizar
          </Button>
        </div>
      </header>

      {/* Cards de métricas mejoradas */}
      <section className="grid gap-4 md:grid-cols-4">
        <Card className="border-l-4 border-l-green-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardBody className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              </div>
              <TrendingUp className="w-4 h-4 text-green-500" />
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Tiendas Activas</p>
            <h2 className="text-3xl font-bold text-slate-900">{totals.active}</h2>
            <p className="text-sm text-slate-500">
              {totals.total > 0 ? Math.round((totals.active / totals.total) * 100) : 0}% del total
            </p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-amber-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardBody className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <TrendingDown className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Pendientes</p>
            <h2 className="text-3xl font-bold text-amber-600">{totals.pending}</h2>
            <p className="text-sm text-slate-500">Requieren atención</p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-rose-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardBody className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-rose-100 rounded-lg">
                <XCircle className="w-5 h-5 text-rose-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Canceladas</p>
            <h2 className="text-3xl font-bold text-rose-600">{totals.canceled}</h2>
            <p className="text-sm text-slate-500">Accesos suspendidos</p>
          </CardBody>
        </Card>

        <Card className="border-l-4 border-l-blue-500 shadow-lg hover:shadow-xl transition-shadow">
          <CardBody className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="p-2 bg-blue-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <p className="text-xs uppercase tracking-wider text-slate-500">Total Tiendas</p>
            <h2 className="text-3xl font-bold text-slate-900">{totals.total}</h2>
            <p className="text-sm text-slate-500">En el sistema</p>
          </CardBody>
        </Card>
      </section>

      {/* Filtros mejorados */}
      <section className="space-y-4">
        <Card shadow="lg">
          <CardBody>
            <div className="flex flex-wrap items-end gap-3">
              <Input
                value={search}
                onValueChange={setSearch}
                label="Buscar tienda"
                placeholder="Nombre, email, razón social..."
                startContent={<Search className="w-4 h-4 text-slate-400" />}
                className="flex-1 min-w-[250px]"
                classNames={{
                  input: "text-sm",
                }}
              />
              <Select
                label="Estado"
                selectedKeys={statusFilter === "todos" ? [] : [statusFilter]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setStatusFilter(selected || "todos");
                }}
                className="min-w-[150px]"
                startContent={<Filter className="w-4 h-4" />}
              >
                <SelectItem key="todos">Todos</SelectItem>
                <SelectItem key="activo">Activo</SelectItem>
                <SelectItem key="pendiente">Pendiente</SelectItem>
                <SelectItem key="cancelado">Cancelado</SelectItem>
              </Select>
              <Select
                label="Plan"
                selectedKeys={planFilter === "todos" ? [] : [planFilter]}
                onSelectionChange={(keys) => {
                  const selected = Array.from(keys)[0] as string;
                  setPlanFilter(selected || "todos");
                }}
                className="min-w-[150px]"
              >
                <SelectItem key="todos">Todos</SelectItem>
                <SelectItem key="Base">Base</SelectItem>
                <SelectItem key="Growth">Growth</SelectItem>
                <SelectItem key="Premium">Premium</SelectItem>
              </Select>
              <Button
                variant="flat"
                color="default"
                onPress={clearFilters}
                isDisabled={search === "" && statusFilter === "todos" && planFilter === "todos"}
              >
                Limpiar
              </Button>
            </div>
          </CardBody>
        </Card>

        {/* Tabla de tenants mejorada */}
        <Card shadow="lg">
          <CardHeader className="flex flex-col gap-2">
            <div className="flex items-center justify-between w-full">
              <div>
                <h3 className="text-xl font-bold text-slate-900">Listado de Tiendas</h3>
                <p className="text-sm text-slate-500 mt-1">
                  {filteredTenants.length} de {totals.total} tiendas
                </p>
              </div>
              <Badge color="primary" variant="flat">
                Actualizado ahora
              </Badge>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center py-12">
                <Spinner size="lg" />
              </div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-slate-300" />
                <p>No se encontraron tiendas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Comercio
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Estado
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Plan
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Usuarios
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Onboarding
                      </th>
                      <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-slate-600">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredTenants.map((tenant) => (
                      <tr
                        key={tenant.id}
                        className="hover:bg-slate-50 transition-colors cursor-pointer"
                        onClick={() => {
                          setSelectedTenant(tenant);
                          setIsModalOpen(true);
                        }}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                              <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900">{tenant.name}</p>
                              <div className="flex items-center gap-2 mt-1">
                                {tenant.email && (
                                  <div className="flex items-center gap-1 text-xs text-slate-500">
                                    <Mail className="w-3 h-3" />
                                    {tenant.email}
                                  </div>
                                )}
                              </div>
                              {tenant.razonSocial && (
                                <p className="text-xs text-slate-400 mt-1">{tenant.razonSocial}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Chip
                            color={statusConfig[tenant.status]?.color || "default"}
                            variant="flat"
                            size="sm"
                          >
                            {statusConfig[tenant.status]?.text || tenant.status}
                          </Chip>
                        </td>
                        <td className="px-6 py-4">
                          <Chip
                            color={planColors[tenant.plan] || "default"}
                            variant="flat"
                            size="sm"
                          >
                            {tenant.plan}
                          </Chip>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-900">
                              {tenant.totalUsers}
                            </span>
                            <span className="text-xs text-slate-500">
                              ({tenant.admins} admin)
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {tenant.onboardingCompleto ? (
                            <div className="flex items-center gap-2 text-green-600">
                              <CheckCircle2 className="w-4 h-4" />
                              <span className="text-sm font-medium">Completo</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-amber-600">
                              <Clock className="w-4 h-4" />
                              <span className="text-sm font-medium">Pendiente</span>
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Tooltip content="Ver detalles">
                              <Button
                                isIconOnly
                                variant="light"
                                size="sm"
                                onPress={() => {
                                  setSelectedTenant(tenant);
                                  setIsModalOpen(true);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Tooltip>
                            <Dropdown>
                              <DropdownTrigger>
                                <Button isIconOnly variant="light" size="sm">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownTrigger>
                              <DropdownMenu
                                aria-label="Acciones del tenant"
                                onAction={(key) => {
                                  if (key === "activate") {
                                    handleTenantAction(tenant.id, "activate");
                                  } else if (key === "deactivate") {
                                    handleTenantAction(tenant.id, "deactivate");
                                  } else if (key === "completeOnboarding") {
                                    handleTenantAction(tenant.id, "completeOnboarding");
                                  } else if (key === "delete") {
                                    handleDeleteTenant(tenant.id, tenant.name);
                                  }
                                }}
                              >
                                <DropdownItem
                                  key="activate"
                                  startContent={<Unlock className="w-4 h-4" />}
                                >
                                  Activar
                                </DropdownItem>
                                <DropdownItem
                                  key="deactivate"
                                  startContent={<Lock className="w-4 h-4" />}
                                  className="text-danger"
                                  color="danger"
                                >
                                  Desactivar
                                </DropdownItem>
                                <DropdownItem
                                  key="completeOnboarding"
                                  startContent={<CheckCircle2 className="w-4 h-4" />}
                                >
                                  Completar Onboarding
                                </DropdownItem>
                                <DropdownItem
                                  key="view"
                                  startContent={<ExternalLink className="w-4 h-4" />}
                                >
                                  Ver en sistema
                                </DropdownItem>
                                <DropdownItem
                                  key="delete"
                                  startContent={<Trash2 className="w-4 h-4" />}
                                  className="text-danger"
                                  color="danger"
                                >
                                  Eliminar permanentemente
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
            )}
          </CardBody>
        </Card>
      </section>

      {/* Modal de detalles */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="2xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                <h2 className="text-2xl font-bold">Detalles de Tienda</h2>
                {selectedTenant && (
                  <p className="text-sm text-slate-500">{selectedTenant.name}</p>
                )}
              </ModalHeader>
              <ModalBody>
                {selectedTenant && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Nombre
                        </p>
                        <p className="font-semibold text-slate-900">{selectedTenant.name}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Estado
                        </p>
                        <Chip
                          color={statusConfig[selectedTenant.status]?.color || "default"}
                          variant="flat"
                          size="sm"
                        >
                          {statusConfig[selectedTenant.status]?.text || selectedTenant.status}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Email
                        </p>
                        <p className="text-sm text-slate-700">{selectedTenant.email || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Plan
                        </p>
                        <Chip
                          color={planColors[selectedTenant.plan] || "default"}
                          variant="flat"
                          size="sm"
                        >
                          {selectedTenant.plan}
                        </Chip>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Razón Social
                        </p>
                        <p className="text-sm text-slate-700">
                          {selectedTenant.razonSocial || "N/A"}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wider text-slate-500 mb-1">
                          Usuarios
                        </p>
                        <p className="text-sm font-semibold text-slate-900">
                          {selectedTenant.totalUsers} total ({selectedTenant.admins} admin)
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button variant="light" onPress={onClose}>
                  Cerrar
                </Button>
                {selectedTenant && (
                  <>
                    {selectedTenant.status === "activo" ? (
                      <Button
                        color="danger"
                        onPress={() => {
                          handleTenantAction(selectedTenant.id, "deactivate");
                        }}
                        isLoading={isActionLoading}
                        startContent={<Lock className="w-4 h-4" />}
                      >
                        Desactivar
                      </Button>
                    ) : (
                      <Button
                        color="success"
                        onPress={() => {
                          handleTenantAction(selectedTenant.id, "activate");
                        }}
                        isLoading={isActionLoading}
                        startContent={<Unlock className="w-4 h-4" />}
                      >
                        Activar
                      </Button>
                    )}
                    {!selectedTenant.onboardingCompleto && (
                      <Button
                        color="primary"
                        onPress={() => {
                          handleTenantAction(selectedTenant.id, "completeOnboarding");
                        }}
                        isLoading={isActionLoading}
                        startContent={<CheckCircle2 className="w-4 h-4" />}
                      >
                        Completar Onboarding
                      </Button>
                    )}
                    <Button
                      color="danger"
                      variant="solid"
                      onPress={() => {
                        handleDeleteTenant(selectedTenant.id, selectedTenant.name);
                      }}
                      isLoading={isActionLoading}
                      startContent={<Trash2 className="w-4 h-4" />}
                    >
                      Eliminar permanentemente
                    </Button>
                  </>
                )}
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
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
