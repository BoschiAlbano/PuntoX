"use client";

import { useState } from "react";
import { Button, Card, CardBody } from "@heroui/react";
import { PerfilTab } from "@/components/configuracion/PerfilTab";
import { FiscalTab } from "@/components/configuracion/FiscalTab";
import { VentasTab } from "@/components/configuracion/VentasTab";
import { SeguridadTab } from "@/components/configuracion/SeguridadTab";
import { NotificacionesTab } from "@/components/configuracion/NotificacionesTab";
import { Building2, Receipt, Settings, Bell, ShieldCheck, CheckCircle2, ChevronRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const steps = [
  { id: "perfil", title: "Perfil de Negocio", icon: Building2, component: PerfilTab },
  { id: "fiscal", title: "Facturación (AFIP)", icon: Receipt, component: FiscalTab },
  { id: "ventas", title: "Preferencias", icon: Settings, component: VentasTab },
  { id: "seguridad", title: "Seguridad", icon: ShieldCheck, component: SeguridadTab },
  { id: "notificaciones", title: "Notificaciones", icon: Bell, component: NotificacionesTab },
];

export default function OnboardingPage() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const router = useRouter();
  const refreshUserData = useUserStore((s) => s.refreshUserData);

  const completeMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
      });
      if (!res.ok) throw new Error("Failed to complete onboarding");
      return res.json();
    },
    onSuccess: async () => {
      await refreshUserData();
      router.push("/dashboard");
    },
  });

  const isLast = currentIndex === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      completeMutation.mutate();
    } else {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const CurrentComponent = steps[currentIndex].component;

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto px-4 py-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#67afc3]/10 to-[#2dd4bf]/10 border border-[#67afc3]/20 p-5 rounded-2xl flex flex-col sm:flex-row gap-4 items-center justify-between shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-800">¡Bienvenido a Punto X!</h1>
          <p className="text-slate-500 text-sm mt-1">
            Por favor, completa esta configuración inicial. <b>Haz clic en "Guardar cambios" en cada paso</b> antes de avanzar.
          </p>
        </div>
      </div>

      <Card className="shadow-xl shadow-slate-200/40 border border-slate-200 rounded-2xl overflow-hidden bg-white">
        {/* Stepper Header */}
        <div className="bg-slate-50 border-b border-slate-100 p-6">
          <div className="flex items-center justify-between relative">
            {/* Background Line */}
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 rounded-full z-0 hidden sm:block"></div>
            <div 
              className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-gradient-to-r from-[#67afc3] to-[#2dd4bf] rounded-full z-0 hidden sm:block transition-all duration-500"
              style={{ width: `${(currentIndex / (steps.length - 1)) * 100}%` }}
            ></div>

            {/* Steps */}
            {steps.map((step, idx) => {
              const isActive = idx === currentIndex;
              const isPast = idx < currentIndex;
              
              return (
                <div key={step.id} className="relative z-10 flex flex-col items-center gap-2">
                  <div 
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                      isActive 
                        ? "bg-white border-[#67afc3] text-[#67afc3] shadow-md shadow-[#67afc3]/20 scale-110" 
                        : isPast 
                          ? "bg-[#67afc3] border-[#67afc3] text-white" 
                          : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    {isPast ? <CheckCircle2 size={18} /> : <step.icon size={18} />}
                  </div>
                  <span className={`hidden sm:block text-xs font-bold ${isActive ? "text-[#67afc3]" : isPast ? "text-slate-600" : "text-slate-400"}`}>
                    {step.title}
                  </span>
                </div>
              );
            })}
          </div>
          
          {/* Mobile Step Title */}
          <div className="sm:hidden mt-4 text-center">
            <span className="text-sm font-bold text-[#67afc3]">
              Paso {currentIndex + 1} de {steps.length}: {steps[currentIndex].title}
            </span>
          </div>
        </div>

        <CardBody className="p-0">
          <div className="p-4 sm:p-8 min-h-[400px] overflow-hidden relative bg-slate-50/30">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <CurrentComponent />
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="p-4 sm:p-6 border-t border-slate-100 flex items-center justify-between bg-white">
            <Button
              variant="flat"
              className="font-medium bg-slate-100 text-slate-600"
              onPress={handleBack}
              isDisabled={currentIndex === 0}
              startContent={<ChevronLeft size={16} />}
            >
              Anterior
            </Button>
            
            <Button
              color="primary"
              onPress={handleNext}
              isLoading={completeMutation.isPending}
              className={`font-bold px-8 shadow-md ${isLast ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/20" : "bg-gradient-to-r from-[#67afc3] to-[#2dd4bf] text-white shadow-[#67afc3]/20"}`}
              endContent={isLast ? (!completeMutation.isPending && <CheckCircle2 size={18} />) : <ChevronRight size={16} />}
            >
              {isLast ? "Finalizar Configuración" : "Siguiente Paso"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
