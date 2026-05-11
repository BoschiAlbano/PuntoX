"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import UnidadMedidaCRUD from "@/components/unidad-medida/UnidadMedidaCRUD";
import { motion } from "framer-motion";

export default function UnidadesPage() {
  return (
    <div className="   flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Unidades de"
        accentTitle="Medida"
        description="Define y administra las diferentes formas en las que se miden tus productos."
      />

      {/* Main App Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-hidden relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-hidden">
          <UnidadMedidaCRUD />
        </div>
      </motion.div>
    </div>
  );
}
