"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import CuentasCorrientesProveedorCRUD from "@/components/proveedores/CuentasCorrientesProveedorCRUD";

export default function CuentasCorrientesProveedorPage() {
  return (
    <div className="flex flex-col items-stretch min-h-full relative">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col">
          <Suspense fallback={<div />}>
            <CuentasCorrientesProveedorCRUD />
          </Suspense>
        </div>
      </motion.div>
    </div>
  );
}
