"use client";

import { useUserStore } from "@/store/useUserStore";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function DashboardPage() {
  const { user, currentBranch } = useUserStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center p-8 select-none">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5, type: "spring", stiffness: 200 }}
        className="mb-8 relative"
      >
        <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full" />
        <div className="relative w-32 h-32 md:w-40 md:h-40 drop-shadow-2xl">
          <Image
            src="/XP.ico"
            alt="Punto X Logo"
            fill
            className="object-contain"
            priority
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="space-y-4"
      >
        <h1 className="text-4xl md:text-6xl font-black bg-clip-text text-transparent bg-linear-to-r from-slate-800 via-blue-900 to-slate-800 tracking-tight">
          Punto X SaaS
        </h1>

        <p className="text-xl md:text-2xl text-slate-500 font-medium">
          Sistema de Gestión Integral
        </p>

        {user && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="pt-8"
          >
            <p className="text-lg text-slate-600 mb-4">
              Hola de nuevo,{" "}
              <span className="font-bold text-blue-600">{user.Nombre}</span>
            </p>

            {currentBranch && (
              <div className="inline-flex items-center gap-2 px-6 py-2.5 bg-white/50 backdrop-blur-md rounded-full border border-slate-200/60 shadow-lg text-slate-600 hover:scale-105 transition-transform duration-300">
                <svg
                  className="w-5 h-5 text-blue-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                  />
                </svg>
                <span className="font-medium">
                  Sucursal: {currentBranch.Nombre}
                </span>
              </div>
            )}
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
