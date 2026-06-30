"use client";
import ProductoCRUD from "@/components/productos/ProductoCRUD";
import { motion } from "framer-motion";

export default function ProductosPage() {
  return (
    <div className="flex flex-col items-stretch min-h-full relative min-w-0 flex-1">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 relative flex flex-col min-w-0 min-h-0"
      >
        <div className="relative z-10 flex-1 flex flex-col min-w-0 min-h-0">
          <ProductoCRUD />
        </div>
      </motion.div>
    </div>
  );
}
