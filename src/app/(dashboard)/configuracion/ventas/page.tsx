"use client";

import { motion } from "framer-motion";
import { VentasTab } from "@/components/configuracion/VentasTab";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ConfiguracionVentasPage() {
  return (
    <div className="max-w-[1400px] mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Preferencias de"
        accentTitle="Venta"
        description="Configura tus preferencias de venta y experiencia de facturación."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-hidden relative flex flex-col pt-2"
      >
        <VentasTab />
      </motion.div>
    </div>
  );
}
