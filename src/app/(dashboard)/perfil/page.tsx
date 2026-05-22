"use client";

import { motion } from "framer-motion";
import { MfaSetup } from "@/components/auth/MfaSetup";
import { FotoPerfilSection } from "@/components/perfil/FotoPerfilSection";

export default function PerfilPersonalPage() {
  return (
    <div className="flex flex-col items-stretch min-h-full relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 relative flex flex-col pt-2"
      >
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center h-full overflow-y-auto pb-10">
          <div className="max-w-2xl w-full mx-auto space-y-6">
            <FotoPerfilSection />
            <MfaSetup />
          </div>
        </div>
      </motion.div>
    </div>
  );
}
