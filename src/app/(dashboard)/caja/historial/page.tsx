"use client";

import Cajas from "@/components/caja/Cajas";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { motion } from "framer-motion";

export default function HistorialCajasPage() {
  return (
    <div className="flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Historial de"
        accentTitle="Cajas"
        description="Consultá el registro histórico de aperturas y cierres de caja."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 bg-[#F5F8FD] p-2 sm:p-4 relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col">
          <Cajas />
        </div>
      </motion.div>
    </div>
  );
}
