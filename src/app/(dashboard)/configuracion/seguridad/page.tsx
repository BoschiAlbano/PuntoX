"use client";

import { motion } from "framer-motion";
import { SeguridadTab } from "@/components/configuracion/SeguridadTab";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ConfiguracionSeguridadPage() {
  return (
    <div className="  flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Seguridad y"
        accentTitle="Acceso"
        description="Configura tus preferencias de seguridad, contraseñas y doble factor (2FA)."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 relative flex flex-col pt-2"
      >
        <SeguridadTab />
      </motion.div>
    </div>
  );
}
