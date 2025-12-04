import React from "react";
import { motion } from "framer-motion";

export default function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="relative w-20 h-20 mx-auto mb-6">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 border-r-[#90c472]"
          />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-blue-500 to-[#90c472] flex items-center justify-center">
            {/* <span className="text-white font-bold text-2xl">P</span> */}
            <img src="/XP.ico" alt="" className="w-12" />
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 font-medium"
        >
          Verificando autenticación...
        </motion.p>
      </motion.div>
    </div>
  );
}
