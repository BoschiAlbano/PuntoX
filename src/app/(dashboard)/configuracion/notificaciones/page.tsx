"use client";

import { motion } from "framer-motion";
import { NotificacionesTab } from "@/components/configuracion/NotificacionesTab";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function ConfiguracionNotificacionesPage() {
  return (
    <div className="max-w-[1400px] mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Notificaciones del"
        accentTitle="Sistema"
        description="Personaliza cómo y cuándo recibes las alertas y notificaciones."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-hidden relative flex flex-col pt-2"
      >
        <NotificacionesTab />
      </motion.div>
    </div>
  );
}
