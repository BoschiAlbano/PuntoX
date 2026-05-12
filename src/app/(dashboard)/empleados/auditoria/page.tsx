"use client";

import { motion } from "framer-motion";
import AuditoriasCRUD from "@/components/empleados/AuditoriasCRUD";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function AuditoriaPage() {
  return (
    <div className="  flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Gestión de"
        accentTitle="Auditoría"
        description="Aquí puedes observar un panorama rápido de acciones realizadas sobre empleados y roles."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col">
          <AuditoriasCRUD />
        </div>
      </motion.div>
    </div>
  );
}
