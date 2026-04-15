"use client";

import { Store, Truck } from "lucide-react";
import { motion } from "framer-motion";

interface PriceListSelectorProps {
  listaPrecios: number;
  setListaPrecios: (lista: 1 | 2) => void;
}

export default function PriceListSelector({
  listaPrecios,
  setListaPrecios,
}: PriceListSelectorProps) {
  return (
    <div className="flex bg-slate-100/70 p-1 rounded-xl items-center relative w-full sm:w-auto sm:ml-auto">
      <button
        type="button"
        onClick={() => setListaPrecios(1)}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 relative px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 z-10 ${
          listaPrecios === 1
            ? "text-white"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Store size={14} />
        <span>Minorista</span>
        {listaPrecios === 1 && (
          <motion.div
            layoutId="priceListTab"
            className="absolute inset-0 bg-[#67afc3] rounded-lg -z-10 shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>

      <button
        type="button"
        onClick={() => setListaPrecios(2)}
        className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 relative px-3 py-1.5 rounded-lg text-[13px] font-semibold transition-all duration-200 z-10 ${
          listaPrecios === 2
            ? "text-white"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        <Truck size={14} />
        <span>Mayorista</span>
        {listaPrecios === 2 && (
          <motion.div
            layoutId="priceListTab"
            className="absolute inset-0 bg-[#67afc3] rounded-lg -z-10 shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </button>
    </div>
  );
}
