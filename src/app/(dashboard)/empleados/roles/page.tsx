"use client";

import { motion } from "framer-motion";
import RolesCRUD from "@/components/empleados/RolesCRUD";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function RolesPage() {
  return (
    <div className="max-w-350 mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Gestión de"
        accentTitle="Roles"
        description="Aquí puedes observar un panorama rápido del rendimiento actual."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-hidden relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
          <RolesCRUD />
        </div>
      </motion.div>
    </div>
  );
}
