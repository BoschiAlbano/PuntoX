import CredentialsForm from "@/components/auth/CredentialsForm";
import { Info } from "lucide-react";
import { PuntoXLogo } from "@/components/ui/PuntoXLogo";

export default function SignIn() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Efectos de fondo decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradiente radial principal */}
        <div className="absolute top-[-20%] left-[-10%] w-150 h-150 bg-[#67afc3]/15 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-125 h-125 bg-[#0284c7]/10 rounded-full blur-[120px]" />
        {/* Líneas decorativas sutiles */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-32 bg-linear-to-b from-transparent via-[#67afc3]/20 to-transparent" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px h-32 bg-linear-to-t from-transparent via-[#67afc3]/20 to-transparent" />
      </div>

      <div className="relative z-10 max-w-105 w-full space-y-6">
        {/* Header con logo */}
        <div className="text-center flex flex-col items-center">
          <div className="mb-6 relative">
            {/* Glow detrás del logo */}
            <div className="absolute inset-0 bg-[#67afc3]/20 rounded-2xl blur-xl scale-125" />
            <PuntoXLogo className="relative w-20 h-20 border border-slate-200/60 rounded-2xl p-2.5 bg-white/80 backdrop-blur-sm shadow-lg shadow-slate-300/50" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-1.5 tracking-tight">
            Bienvenido
          </h1>
          <p className="text-sm text-slate-500">
            Iniciá sesión en tu cuenta de Punto X
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-white/80 backdrop-blur-xl rounded-2xl border border-slate-200/60 p-8 shadow-xl shadow-slate-200/50">
          <CredentialsForm />
        </div>

        {/* Alerta de invitación */}
        <div className="bg-white/60 backdrop-blur-sm border border-slate-200 rounded-xl p-4 flex items-start gap-3">
          <Info className="h-4 w-4 text-[#67afc3] mt-0.5 shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            El acceso es solo por invitación. Contactá a un administrador para
            obtener acceso.
          </p>
        </div>

        {/* Footer */}
        <div className="text-center text-[11px] text-slate-400">
          <p>
            Al continuar, aceptás nuestros términos de servicio y política de
            privacidad
          </p>
        </div>
      </div>
    </div>
  );
}
