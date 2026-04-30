"use client";

import { motion } from "framer-motion";
import { MfaSetup } from "@/components/auth/MfaSetup";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function PerfilPersonalPage() {
  return (
    <div className="max-w-[1400px] mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Mi"
        accentTitle="Perfil"
        description="Gestioná tu seguridad personal y métodos de inicio de sesión."
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 overflow-hidden relative flex flex-col pt-2"
      >
        <div className="relative z-10 flex-1 flex flex-col h-full overflow-y-auto pb-10">
          <div className="max-w-2xl w-full mx-auto space-y-6">
            {/* Aquí a futuro se pueden poner más opciones como "Cambiar contraseña" */}
            <MfaSetup />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
