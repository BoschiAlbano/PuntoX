"use client";

import { useUserStore } from "@/store/useUserStore";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import {
  ShoppingCart,
  TrendingUp,
  Users,
  Package,
  ArrowUpRight,
  AlertTriangle,
  BarChart3,
  Plus,
  FileText,
} from "lucide-react";
import Link from "next/link";

// Datos de ejemplo (en producción estos vendrían de una API)
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

export default function DashboardPage() {
  const { user, currentBranch } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const maxRevenue = Math.max(...MOCK_DATA.monthlySales.map((m) => m.revenue));
  const maxTransactions = Math.max(
    ...MOCK_DATA.monthlySales.map((m) => m.transactions),
  );

  return (
    <div className="p-6 md:p-8 min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100">
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
        {/* Ventas de Hoy */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-linear-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-blue-100 text-sm font-medium mb-1">
                Ventas de Hoy
              </p>
              <h3 className="text-3xl font-bold">
                ${MOCK_DATA.todaySales.amount.toLocaleString()}
              </h3>
              <p className="text-blue-100 text-xs mt-1">
                {MOCK_DATA.todaySales.transactions} Transacciones
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <ShoppingCart className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ delay: 0.5, duration: 1 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Stock Bajo */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-orange-400 to-orange-500 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-orange-100 text-sm font-medium mb-1">
                Stock Bajo
              </p>
              <h3 className="text-3xl font-bold">{MOCK_DATA.lowStock.count}</h3>
              <p className="text-orange-100 text-xs mt-1">Productos</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <AlertTriangle className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "35%" }}
                transition={{ delay: 0.6, duration: 1 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Ingresos del Mes */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-emerald-100 text-sm font-medium mb-1">
                Ingresos del Mes
              </p>
              <h3 className="text-3xl font-bold">
                ${MOCK_DATA.monthRevenue.amount.toLocaleString()}
              </h3>
              <p className="text-emerald-100 text-xs mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />+
                {MOCK_DATA.monthRevenue.percentage}%
              </p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "90%" }}
                transition={{ delay: 0.7, duration: 1 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* Clientes Nuevos */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 cursor-pointer"
        >
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-purple-100 text-sm font-medium mb-1">
                Clientes Nuevos
              </p>
              <h3 className="text-3xl font-bold">
                {MOCK_DATA.newClients.count}
              </h3>
              <p className="text-purple-100 text-xs mt-1">Este Mes</p>
            </div>
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "60%" }}
                transition={{ delay: 0.8, duration: 1 }}
                className="h-full bg-white rounded-full"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas Recientes */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-800">
              Ventas Recientes
            </h2>
            <Link
              href="/ventas"
              className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1 hover:gap-2 transition-all"
            >
              Ver Todas <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Fecha
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Cliente
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-slate-600">
                    Estado
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-slate-600">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {MOCK_DATA.recentSales.map((sale, index) => (
                  <motion.tr
                    key={sale.id}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-4 text-sm text-slate-600">
                      {sale.date}
                    </td>
                    <td className="py-4 px-4 text-sm font-medium text-slate-800">
                      {sale.client}
                    </td>
                    <td className="py-4 px-4">
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                          sale.status === "Pagado"
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-orange-100 text-orange-700"
                        }`}
                      >
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-sm font-bold text-slate-800 text-right">
                      ${sale.total.toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Atajos Rápidos */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Atajos Rápidos
          </h2>
          <div className="space-y-3">
            <Link
              href="/ventas"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 hover:from-blue-100 hover:to-blue-200/50 rounded-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="p-3 bg-blue-600 rounded-xl group-hover:bg-blue-700 transition-colors">
                <ShoppingCart className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Nueva Venta</span>
            </Link>

            <Link
              href="/productos"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-purple-100/50 hover:from-purple-100 hover:to-purple-200/50 rounded-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="p-3 bg-purple-600 rounded-xl group-hover:bg-purple-700 transition-colors">
                <Package className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800">
                Agregar Producto
              </span>
            </Link>

            <Link
              href="/clientes"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-emerald-50 to-emerald-100/50 hover:from-emerald-100 hover:to-emerald-200/50 rounded-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="p-3 bg-emerald-600 rounded-xl group-hover:bg-emerald-700 transition-colors">
                <Users className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800">
                Nuevo Cliente
              </span>
            </Link>

            <Link
              href="/analiticas"
              className="flex items-center gap-4 p-4 bg-gradient-to-r from-indigo-50 to-indigo-100/50 hover:from-indigo-100 hover:to-indigo-200/50 rounded-xl transition-all duration-300 hover:scale-105 group"
            >
              <div className="p-3 bg-indigo-600 rounded-xl group-hover:bg-indigo-700 transition-colors">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="font-semibold text-slate-800">Ver Reportes</span>
            </Link>
          </div>
        </motion.div>

        {/* Ventas del Mes (Gráfico) */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg border border-slate-200"
        >
          <h2 className="text-xl font-bold text-slate-800 mb-6">
            Ventas del Mes
          </h2>
          <div className="h-64 flex items-end justify-around gap-2">
            {MOCK_DATA.monthlySales.map((data, index) => {
              const revenueHeight = (data.revenue / maxRevenue) * 100;
              const transactionsHeight =
                (data.transactions / maxTransactions) * 100;

              return (
                <div
                  key={data.month}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div className="w-full flex items-end justify-center gap-1 h-48">
                    {/* Ingresos */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${revenueHeight}%` }}
                      transition={{ delay: 0.8 + index * 0.1, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-blue-500 to-blue-400 rounded-t-lg hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer relative group"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        ${data.revenue.toLocaleString()}
                      </div>
                    </motion.div>
                    {/* Transacciones */}
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${transactionsHeight}%` }}
                      transition={{ delay: 0.9 + index * 0.1, duration: 0.5 }}
                      className="flex-1 bg-gradient-to-t from-purple-500 to-purple-400 rounded-t-lg hover:from-purple-600 hover:to-purple-500 transition-all cursor-pointer relative group"
                    >
                      <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                        {data.transactions} ventas
                      </div>
                    </motion.div>
                  </div>
                  <span className="text-xs font-medium text-slate-600">
                    {data.month}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
              <span className="text-sm text-slate-600">Ingresos</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full" />
              <span className="text-sm text-slate-600">Transacciones</span>
            </div>
          </div>
        </motion.div>

        {/* Productos Bajos en Stock + Top Productos */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="space-y-6"
        >
          {/* Productos Bajos en Stock */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <h2 className="text-xl font-bold text-slate-800 mb-4">
              Productos Bajos en Stock
            </h2>
            <div className="space-y-3">
              {MOCK_DATA.lowStockProducts.map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-orange-50 rounded-xl hover:bg-orange-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{product.icon}</span>
                    <span className="font-medium text-slate-800">
                      {product.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-orange-600">
                    {product.stock} Unidades
                  </span>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl font-semibold flex items-center justify-center gap-2 transition-all hover:scale-105">
              <Plus className="w-4 h-4" />
              Gestionar Stock
            </button>
          </div>

          {/* Top Productos Vendidos */}
          <div className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                Top Productos Vendidos
              </h2>
              <Link
                href="/productos"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
              >
                Ver Más <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-3">
              {MOCK_DATA.topProducts.map((product, index) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{product.icon}</span>
                    <span className="font-medium text-slate-800">
                      {product.name}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-600">
                    {product.sold} Vendidos
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
