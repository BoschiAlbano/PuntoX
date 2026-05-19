"use client";

import { motion } from "framer-motion";
import CajaActual from "@/components/caja/CajaActual";

export default function CajaPage() {
  return (
    <div className="flex flex-col items-stretch min-h-full relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 p-2 sm:p-4 relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col h-full">
          <CajaActual />
        </div>
      </motion.div>
    </div>
  );
}
