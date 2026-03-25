"use client";

import { useUserStore } from "@/store/useUserStore";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  TrendingUp,
  Users,
  AlertTriangle,
  LayoutDashboard,
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import TopProductosChart from "@/components/analiticas/TopProductosChart";

// Datos mock ampliados
const MOCK_DATA = {
  todaySales: { amount: 25300, transactions: 125 },
  lowStock: { count: 8 },
  monthRevenue: { amount: 320800, percentage: 12 },
  newClients: { count: 34 },
  recentSales: [
    {
      id: 1,
      date: "25/04/2024",
      client: "Juan Pérez",
      status: "Pagado",
      total: 7500,
    },
    {
      id: 2,
      date: "25/04/2024",
      client: "María López",
      status: "Pendiente",
      total: 3200,
    },
    {
      id: 3,
      date: "24/04/2024",
      client: "Carlos Nuñez",
      status: "Pagado",
      total: 5800,
    },
    {
      id: 4,
      date: "24/04/2024",
      client: "Ana Torres",
      status: "Pagado",
      total: 4100,
    },
  ],
  lowStockProducts: [
    { id: 1, name: "Café en Grano", stock: 5, icon: "☕" },
    { id: 2, name: "Botella de Agua", stock: 3, icon: "💧" },
  ],
  topProducts: [
    { id: 1, name: "Auriculares Pro", sold: 120, icon: "🎧" },
    { id: 2, name: "Camisa Negra", sold: 95, icon: "👔" },
    { id: 3, name: "Reloj Digital", sold: 80, icon: "⌚" },
  ],
  monthlySales: [
    { month: "Ene", revenue: 280000, transactions: 450 },
    { month: "Feb", revenue: 310000, transactions: 480 },
    { month: "Mar", revenue: 290000, transactions: 460 },
    { month: "Abr", revenue: 350000, transactions: 520 },
    { month: "May", revenue: 330000, transactions: 500 },
    { month: "Jun", revenue: 370000, transactions: 550 },
  ],
};

// Data mock para Grafico Productos mas vendidos del dia
const MOCK_TOP_PRODUCTS = [
  { id: 1, nombre: "Coca Cola 1.5L", cantidad: 45 },
  { id: 2, nombre: "Pan Francés", cantidad: 38 },
  { id: 3, nombre: "Leche Entera 1L", cantidad: 32 },
  { id: 4, nombre: "Arroz 1kg", cantidad: 28 },
  { id: 5, nombre: "Aceite Girasol", cantidad: 250 },
];

// Data mock para Grafico Formas de pago mas usadas del dia
const MOCK_TOP_FORMAS_PAGO = [
  { id: 1, nombre: "EFECTIVO", cantidad: 45 },
  { id: 2, nombre: "TARJETA", cantidad: 38 },
  { id: 3, nombre: "CHEQUE", cantidad: 32 },
  { id: 4, nombre: "CUENTA_CORRIENTE", cantidad: 28 },
  { id: 5, nombre: "TRANSFERENCIA", cantidad: 25 },
];
export default function DashboardPage() {
  const { user, currentBranch } = useUserStore();

  return (
    <div className="max-w-[1400px] mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      {/* Premium Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="flex flex-col gap-2 px-1 sm:px-0"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100/50 border border-slate-200/50 backdrop-blur-md text-[#67afc3] text-xs font-semibold w-fit shadow-sm">
          <LayoutDashboard className="w-3.5 h-3.5" />
          Panel de Control
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          ¡Hola,{" "}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] to-[#2dd4bf]">
            {user?.Nombre || "Usuario"}
          </span>
          !
        </h1>
        <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
          Bienvenido a tu resumen diario. Aquí puedes observar un panorama
          rápido del rendimiento actual
          {currentBranch ? (
            <>
              {" "}
              en la sucursal{" "}
              <span className="font-semibold text-slate-700">
                {currentBranch.Nombre}
              </span>
              .
            </>
          ) : (
            "."
          )}
        </p>
      </motion.div>

      {/* Main App Container with Glassmorphism */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 bg-white/40 backdrop-blur-2xl rounded-3xl border border-white/60 shadow-[0_8px_40px_rgba(0,0,0,0.03)] p-3 sm:p-5 relative flex flex-col gap-6"
      >
        {/* Subtle Inner Glows for Depth */}
        <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-[#67afc3]/10 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-blue-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col gap-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
            <StatCard
              title="Ventas de Hoy"
              value={`$${MOCK_DATA.todaySales.amount.toLocaleString()}`}
              subtitle={`${MOCK_DATA.todaySales.transactions} Transacciones`}
              icon={ShoppingCart}
              iconColor="#7dbbcc"
              colorScheme="white"
              delay={0.1}
              progressPercent={100}
            />

            <StatCard
              title="Stock Bajo"
              value={MOCK_DATA.lowStock.count}
              subtitle="Productos"
              icon={AlertTriangle}
              iconColor="#ffd3b6"
              colorScheme="white"
              delay={0.2}
              progressPercent={100}
              progressDelay={0.6}
            />

            <StatCard
              title="Ingresos del Mes"
              value={`$${MOCK_DATA.monthRevenue.amount.toLocaleString()}`}
              subtitle={
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />+
                  {MOCK_DATA.monthRevenue.percentage}%
                </span>
              }
              icon={TrendingUp}
              iconColor="#7dbbcc"
              colorScheme="white"
              delay={0.3}
              progressPercent={100}
              progressDelay={0.7}
            />

            <StatCard
              title="Clientes Nuevos"
              value={MOCK_DATA.newClients.count}
              subtitle="Este Mes"
              icon={Users}
              iconColor="#ffd3b6"
              colorScheme="white"
              delay={0.4}
              progressPercent={100}
              progressDelay={0.8}
            />
          </div>

          {/* Graficos */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
            {/* Productos mas vendidos del dia */}
            <TopProductosChart
              datos={MOCK_TOP_PRODUCTS}
              title="Top 10 Productos Más Vendidos del Día"
              subtitle={`Total de unidades vendidas: ${MOCK_TOP_PRODUCTS.reduce(
                (acc, p) => acc + p.cantidad,
                0,
              )}`}
            />

            <TopProductosChart
              datos={MOCK_TOP_FORMAS_PAGO}
              title="Top 10 Formas de Pago Más Usadas del Día"
              subtitle={`Total de transacciones: ${MOCK_TOP_FORMAS_PAGO.reduce(
                (acc, p) => acc + p.cantidad,
                0,
              )}`}
            />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
