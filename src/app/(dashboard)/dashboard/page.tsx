"use client";

import { useUserStore } from "@/store/useUserStore";
import { motion } from "framer-motion";
import { ShoppingCart, TrendingUp, Users, AlertTriangle } from "lucide-react";
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
    <div className="max-w-7xl mx-auto py-2 sm:py-8 px-2 sm:px-6 flex flex-col items-stretch h-full">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <h1 className="text-3xl md:text-4xl font-bold text-slate-800 mb-2">
          ¡Hola {user?.Nombre}!{" "}
          <span className="text-slate-500 font-normal text-xl">
            Bienvenido de nuevo.
          </span>
        </h1>
        {currentBranch && (
          <p className="text-slate-600 text-sm">
            Sucursal:{" "}
            <span className="font-semibold">{currentBranch.Nombre}</span>
          </p>
        )}
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 ">
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
  );
}
