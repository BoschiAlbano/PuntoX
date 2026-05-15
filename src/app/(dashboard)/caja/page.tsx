"use client";

import { useState } from "react";
import CajaActual from "@/components/caja/CajaActual";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button, useDisclosure } from "@heroui/react";
import { Lock, Unlock } from "lucide-react";
import { motion } from "framer-motion";

export default function CajaPage() {
  const [isCajaAbierta, setIsCajaAbierta] = useState<boolean>(false);

  const {
    isOpen: isCerrarOpen,
    onOpen: onCerrarOpen,
    onOpenChange: onCerrarChange,
  } = useDisclosure();

  const {
    isOpen: isAbrirOpen,
    onOpen: onAbrirOpen,
    onOpenChange: onAbrirChange,
  } = useDisclosure();

  return (
    <div className="flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Caja"
        accentTitle="Actual"
        description="Gestioná los movimientos, gastos y el cierre del turno activo."
        actions={
          isCajaAbierta ? (
            <Button
              onPress={onCerrarOpen}
              className="bg-[#0F2233] text-white font-semibold px-4 h-9 rounded-xl gap-2 hover:bg-[#0F2233]/80 transition-all shadow-sm text-sm"
              startContent={<Lock size={14} strokeWidth={2.5} />}
            >
              Cerrar Caja
            </Button>
          ) : (
            <Button
              onPress={onAbrirOpen}
              className="bg-[#0F2233] text-white font-semibold px-4 h-9 rounded-xl gap-2 hover:bg-[#0F2233]/80 transition-all shadow-sm text-sm"
              startContent={<Unlock size={14} strokeWidth={2.5} />}
            >
              Abrir Caja
            </Button>
          )
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
        className="flex-1 p-2 sm:p-4 relative flex flex-col"
      >
        <div className="relative z-10 flex-1 flex flex-col h-full">
          <CajaActual
            isCerrarOpen={isCerrarOpen}
            onCerrarChange={onCerrarChange}
            isAbrirOpen={isAbrirOpen}
            onAbrirChange={onAbrirChange}
            onCajaStatusChange={setIsCajaAbierta}
          />
        </div>
      </motion.div>
    </div>
  );
}
