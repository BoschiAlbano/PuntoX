"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import VentasScreen from "@/components/ventas/VentasScreen";
import { motion } from "framer-motion";

export default function VentasPage() {
  return (
    <div className="flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Gestión de"
        accentTitle="Ventas"
        description="Atiende a tus clientes y completa el pago en una interfaz optimizada."
      />

      {/* ── Main App ── */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
        className="flex-1 relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col">
          <VentasScreen />
        </div>
      </motion.div>
    </div>
  );
}
