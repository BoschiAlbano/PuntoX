"use client";

import { motion } from "framer-motion";
import { PageHeader } from "@/components/dashboard/PageHeader";
import ComprasScreen from "@/components/compras/ComprasScreen";

export default function ComprasPage() {
  return (
    <div className="   flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Gestión de"
        accentTitle="Compras"
        description="Registra compras a proveedores, actualiza el stock y los precios de tus productos."
      />

      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.08, ease: "easeOut" }}
        className="flex-1 relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col">
          <ComprasScreen />
        </div>
      </motion.div>
    </div>
  );
}
