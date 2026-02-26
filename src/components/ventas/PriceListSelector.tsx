"use client";

import { Button } from "@heroui/react";
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
    <div className="flex px-2 rounded-xl h-10 items-center relative">
      <Button
        onPress={() => setListaPrecios(1)}
        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-transparent z-10 ${
          listaPrecios === 1
            ? "text-white"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Minorista
        {listaPrecios === 1 && (
          <motion.div
            layoutId="priceListTab"
            className="absolute inset-0 bg-[#67afc3] rounded-lg -z-10 shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </Button>
      <Button
        onPress={() => setListaPrecios(2)}
        className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 bg-transparent z-10 ${
          listaPrecios === 2
            ? "text-white"
            : "text-slate-500 hover:text-slate-700"
        }`}
      >
        Mayorista
        {listaPrecios === 2 && (
          <motion.div
            layoutId="priceListTab"
            className="absolute inset-0 bg-[#67afc3] rounded-lg -z-10 shadow-sm"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
      </Button>
    </div>
  );
}
