"use client";

import React from "react";
import { motion } from "framer-motion";
import Image from "next/image";

function LoadingSpinner({ message }: { message?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="text-center flex flex-col items-center"
    >
      <div className="relative w-24 h-24 mb-6 flex items-center justify-center">
        {/* Glow de fondo */}
        <div className="absolute inset-0  rounded-full blur-xl animate-pulse" />

        {/* Anillo giratorio principal */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#67afc3] border-r-[#2dd4bf]"
        />

        {/* Anillo giratorio secundario (inverso) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
          className="absolute inset-2 rounded-full border-[3px] border-transparent border-b-[#67afc3]/50 border-l-[#2dd4bf]/50"
        />

        {/* Contenedor central Glassmorphism */}
        <div className="absolute inset-4 rounded-full border border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.08)] flex items-center justify-center overflow-hidden">
          <Image
            src="/icon.ico"
            alt="Punto X"
            width={32}
            height={32}
            className="object-contain drop-shadow-sm"
          />
        </div>
      </div>

      {message && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center gap-3"
        >
          <p className="text-slate-600 font-medium tracking-wide">{message}</p>
          {/* Puntos de carga animados */}
          <div className="flex gap-1.5">
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
              className="w-1.5 h-1.5 rounded-full bg-[#67afc3]"
            />
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
              className="w-1.5 h-1.5 rounded-full bg-[#67afc3]"
            />
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
              className="w-1.5 h-1.5 rounded-full bg-[#2dd4bf]"
            />
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

export function LoadingPage({
  message = "Verificando autenticación...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-screen bg-slate-50/50 flex items-center justify-center relative overflow-hidden">
      {/* Fondo sutil tipo cuadrícula */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f8fafc_2px,transparent_1px),linear-gradient(to_bottom,#f8fafc_2px,transparent_1px)] bg-size-[4rem_4rem] z-0 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-3xl pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] bg-[#67afc3]/15 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#2dd4bf]/10 rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col items-center justify-center">
        <LoadingSpinner message={message} />
      </div>
    </div>
  );
}

export function LoadingComponent({
  message = "Cargando...",
}: {
  message?: string;
}) {
  return (
    <div className="min-h-[300px] h-full w-full bg-transparent flex items-center justify-center">
      <LoadingSpinner message={message} />
    </div>
  );
}
