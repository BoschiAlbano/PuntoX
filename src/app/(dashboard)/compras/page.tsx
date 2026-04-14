"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function ComprasPage() {
  return (
    <div className="max-w-[1400px] mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Gestión de"
        accentTitle="Compras"
        description="Gestiona órdenes de compra y reposición de stock"
      />

      <div
        className="rounded-xl border border-slate-200/80 bg-white p-8 shadow-[0_1px_3px_rgba(15,23,42,0.06)]"
        style={{ minHeight: 300 }}
      >
        <div className="flex flex-col items-center justify-center gap-4 py-12 text-center">
          <div className="rounded-full p-4 bg-slate-100">
            <ShoppingCart
              size={32}
              className="text-slate-500"
              strokeWidth={1.5}
            />
          </div>
          <h2 className="text-lg font-semibold text-slate-800">
            Área de Compras
          </h2>
          <p className="text-slate-600 max-w-md">
            Desde aquí podrás gestionar las solicitudes de reposición y órdenes
            de compra. El módulo estará disponible próximamente.
          </p>
          <Link
            href="/productos"
            className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#67afc3] hover:bg-[#5a9db0] text-white font-medium text-sm transition-colors duration-150"
          >
            Volver a Productos
          </Link>
        </div>
      </div>
    </div>
  );
}
