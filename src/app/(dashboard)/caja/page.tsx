"use client";

import CajaActual from "@/components/caja/CajaActual";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { motion } from "framer-motion";

export default function CajaPage() {
  return (
    <div className=" flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Caja"
        accentTitle="Actual"
        description="Gestioná los movimientos, gastos y el cierre del turno activo."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 p-2 sm:p-4 relative flex flex-col"
      >
        {/* Content */}
        <div className="relative z-10 flex-1 flex flex-col h-full">
          <CajaActual />
        </div>
      </motion.div>
    </div>
  );
}
