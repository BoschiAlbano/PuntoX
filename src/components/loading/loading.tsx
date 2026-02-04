"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

export function LoadingPage({
  message = "Verificando autenticación...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen bg-linear-to-br bg-transparent flex items-center justify-center">
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
          <div className="absolute inset-2 rounded-full bg-linear-to-br from-blue-500 to-[#90c472] flex items-center justify-center">
            <Image
              src="/XP.ico"
              alt="Punto X"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 font-medium"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}

export function LoadingComponent({
  message = "Verificando autenticación...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-auto bg-linear-to-br bg-transparent flex items-center justify-center">
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
          <div className="absolute inset-2 rounded-full bg-linear-to-br from-blue-500 to-[#90c472] flex items-center justify-center">
            <Image
              src="/XP.ico"
              alt="Punto X"
              width={40}
              height={40}
              className="object-contain"
            />
          </div>
        </div>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-slate-600 font-medium"
        >
          {message}
        </motion.p>
      </motion.div>
    </div>
  );
}
