"use client";

import ListaPrecioCRUD from "@/components/listas-precios/ListaPrecioCRUD";
import { motion } from "framer-motion";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ListasPreciosPage() {
  return (
    <div className="   flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      {/* Premium Header */}
      <PageHeader
        title="Gestión de"
        accentTitle="Listas de Precios"
        description="Configura y administra las diferentes listas de precios (ej: Mayorista, Minorista) para asignar a tus productos."
      />

      {/* Main App Container */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col">
          <ListaPrecioCRUD />
        </div>
      </motion.div>
    </div>
  );
}
