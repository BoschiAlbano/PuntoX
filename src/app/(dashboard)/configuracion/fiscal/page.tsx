"use client";

import { motion } from "framer-motion";
import { FiscalTab } from "@/components/configuracion/FiscalTab";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ConfiguracionFiscalPage() {
  return (
    <div className="  flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Facturación y"
        accentTitle="Región"
        description="Configura tus datos fiscales, monedas, certificados y retenciones."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 relative flex flex-col pt-2"
      >
        <FiscalTab />
      </motion.div>
    </div>
  );
}
