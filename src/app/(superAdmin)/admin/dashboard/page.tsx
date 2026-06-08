"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  CardHeader,
  Chip,
  Divider,
  Spinner,
} from "@heroui/react";
import {
  Building2,
  Users,
  Store,
  Package,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";

type DashboardData = {
  metricas: {
    totalTenants: number;
    activeTenants: number;
    inactiveTenants: number;
    pendingOnboarding: number;
    totalUsuarios: number;
    totalSucursales: number;
    totalArticulos: number;
  };
  recentTenants: Array<{
    id: number;
    nombre: string;
    estaActivo: boolean;
    onboardingCompleto: boolean;
    plan: string;
    usuarios: number;
    sucursales: number;
  }>;
  planDistribution: Array<{
    id: number;
    nombre: string;
    tenants: number;
  }>;
  alertas: Array<{
    tipo: string;
    mensaje: string;
    cantidad: number;
  }>;
};

export default function AdminDashboardPage() {
  const router = useRouter();

  const { data, isLoading } = useQuery<DashboardData>({
    queryKey: ["admin-dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/admin/dashboard");
      if (!res.ok) throw new Error("Error al cargar dashboard");
      return res.json();
    },
    refetchInterval: 30000,
  });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  const { metricas, recentTenants, planDistribution, alertas } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <header className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg shadow-amber-500/20">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Panel de Control
            </h1>
            <p className="text-sm text-slate-500">
              Vista general de la plataforma Punto X
            </p>
          </div>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tiendas Activas"
          value={metricas.activeTenants}
          subtitle={`de ${metricas.totalTenants} totales`}
          icon={Building2}
          colorScheme="green"
          delay={0}
        />
        <StatCard
          title="Usuarios Totales"
          value={metricas.totalUsuarios}
          subtitle="en toda la plataforma"
          icon={Users}
          colorScheme="blue"
          delay={0.05}
        />
        <StatCard
          title="Sucursales"
          value={metricas.totalSucursales}
          subtitle="operativas"
          icon={Store}
          colorScheme="purple"
          delay={0.1}
        />
        <StatCard
          title="Artículos"
          value={metricas.totalArticulos.toLocaleString("es-AR")}
          subtitle="productos registrados"
          icon={Package}
          colorScheme="orange"
          delay={0.15}
        />
      </section>

      {/* Alerts */}
      {alertas.length > 0 && (
        <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {alertas.map((alerta, idx) => (
            <Card
              key={idx}
              className={`border-l-4 ${
                alerta.tipo === "danger"
                  ? "border-l-rose-500 bg-rose-50"
                  : "border-l-amber-500 bg-amber-50"
              }`}
            >
              <CardBody className="flex flex-row items-center gap-3 py-3">
                <AlertTriangle
                  className={`w-5 h-5 shrink-0 ${
                    alerta.tipo === "danger"
                      ? "text-rose-500"
                      : "text-amber-500"
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800">
                    {alerta.mensaje}
                  </p>
                </div>
                <Chip
                  size="sm"
                  variant="flat"
                  color={alerta.tipo === "danger" ? "danger" : "warning"}
                >
                  {alerta.cantidad}
                </Chip>
              </CardBody>
            </Card>
          ))}
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Tenants */}
        <Card className="lg:col-span-2 shadow-sm">
          <CardHeader className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Tiendas Recientes
              </h3>
              <p className="text-sm text-slate-500">
                Últimas tiendas registradas
              </p>
            </div>
            <button
              onClick={() => router.push("/admin/tenants")}
              className="flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors cursor-pointer"
            >
              Ver todas <ArrowRight className="w-4 h-4" />
            </button>
          </CardHeader>
          <Divider />
          <CardBody className="p-0">
            <div className="divide-y divide-slate-100">
              {recentTenants.map((tenant) => (
                <button
                  key={tenant.id}
                  onClick={() => router.push(`/admin/tenants/${tenant.id}`)}
                  className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition-colors text-left cursor-pointer"
                >
                  <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg shrink-0">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-slate-900 text-sm truncate">
                      {tenant.nombre}
                    </p>
                    <p className="text-xs text-slate-500">
                      {tenant.usuarios} usuarios · {tenant.sucursales}{" "}
                      sucursales
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Chip
                      size="sm"
                      variant="flat"
                      color={tenant.estaActivo ? "success" : "danger"}
                    >
                      {tenant.estaActivo ? "Activo" : "Inactivo"}
                    </Chip>
                    {!tenant.onboardingCompleto && (
                      <Clock className="w-4 h-4 text-amber-500" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </CardBody>
        </Card>

        {/* Plan Distribution */}
        <Card className="shadow-sm">
          <CardHeader>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Distribución de Planes
              </h3>
              <p className="text-sm text-slate-500">
                Tiendas por plan
              </p>
            </div>
          </CardHeader>
          <Divider />
          <CardBody className="space-y-3">
            {planDistribution.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-4">
                No hay planes configurados
              </p>
            ) : (
              planDistribution.map((plan) => {
                const percentage =
                  metricas.totalTenants > 0
                    ? Math.round((plan.tenants / metricas.totalTenants) * 100)
                    : 0;
                return (
                  <div key={plan.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-700">
                          {plan.nombre}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900">
                        {plan.tenants}
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}

            <Divider className="my-2" />

            {/* Quick stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                  <span className="text-xs font-semibold text-green-700">
                    Activas
                  </span>
                </div>
                <p className="text-xl font-bold text-green-900">
                  {metricas.activeTenants}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                <div className="flex items-center gap-1.5 mb-1">
                  <XCircle className="w-3.5 h-3.5 text-rose-600" />
                  <span className="text-xs font-semibold text-rose-700">
                    Inactivas
                  </span>
                </div>
                <p className="text-xl font-bold text-rose-900">
                  {metricas.inactiveTenants}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
