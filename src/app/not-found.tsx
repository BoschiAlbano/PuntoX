"use client";
import React from "react";
import Image from "next/image";

export default function page() {
  return (
    <section className="flex flex-col items-center justify-center h-screen gap-4">
      <Image
        src="/favicon-light.ico"
        alt="Punto X"
        className="w-24 h-24 object-contain"
      />

      <div className="flex flex-col items-center gap-2">
        <h1 className="text-2xl font-bold">Pagina no encontrada</h1>
        <p className="text-slate-500">
          La pagina que buscas no existe o ha sido movida
        </p>
      </div>
      <button
        onClick={() => window.history.back()}
        className="bg-slate-700 text-white px-4 py-2 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
      >
        Regresar
      </button>
    </section>
  );
}
