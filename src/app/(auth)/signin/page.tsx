import CredentialsForm from "@/components/auth/CredentialsForm";
import { BrandLockup } from "@/components/auth/BrandLockup";
import { Info } from "lucide-react";

export default function SignIn() {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[#F6FAFC] lg:bg-white pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))] px-[max(1rem,env(safe-area-inset-left))] lg:p-0">
      {/* Panel Izquierdo: Branding Institucional (Solo Desktop) */}
      <aside className="hidden lg:flex lg:w-[45%] xl:w-[42%] bg-[#0B1F3B] flex-col justify-between p-12 xl:p-16 relative overflow-hidden shrink-0 select-none">
        {/* Halos ambientales suaves y refinados de la marca */}
        <div
          className="absolute -top-36 -left-36 w-[450px] h-[450px] bg-[#006AFC]/15 rounded-full blur-[100px] pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-36 -right-36 w-[450px] h-[450px] bg-[#00B9D8]/10 rounded-full blur-[100px] pointer-events-none"
          aria-hidden="true"
        />

        {/* Cabecera institucional: Brand Lockup oficial */}
        <div className="relative z-10">
          <BrandLockup variant="dark" size="lg" />
        </div>

        {/* Contenido principal: Propuesta de valor, tipografía y pills */}
        <div className="relative z-10 my-auto py-12 max-w-lg">
          <p className="text-xs font-semibold tracking-[0.25em] text-[#00B9D8] uppercase mb-4">
            TECNOLOGÍA COMERCIAL
          </p>

          <h2 className="text-3xl xl:text-4xl 2xl:text-[44px] font-bold text-white tracking-tight leading-[1.15]">
            Tu negocio,
            <br />
            más simple y <span className="text-[#00B9D8]">veloz.</span>
          </h2>

          <p className="text-slate-300 text-sm xl:text-base leading-relaxed mt-5 max-w-md">
            Punto de venta y control de inventario diseñado para el ritmo real del mostrador.
          </p>

          {/* Chips / Pills refinadas y sobrias */}
          <div className="mt-8 flex flex-wrap gap-2.5">
            {[
              "Operación rápida",
              "Control de stock",
              "Control de caja",
            ].map((benefit) => (
              <div
                key={benefit}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/10 text-xs font-medium text-slate-200 backdrop-blur-sm"
              >
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#FC6A01] shrink-0"
                  aria-hidden="true"
                />
                <span>{benefit}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer institucional */}
        <div className="relative z-10 pt-8 border-t border-white/10 text-xs text-slate-400">
          <p>© 2026 PuntoX. Todos los derechos reservados.</p>
        </div>
      </aside>

      {/* Panel Derecho: Contenedor con soporte PWA y Card en Mobile */}
      <main className="flex-1 flex items-center justify-center p-2 sm:p-6 md:p-8 lg:p-14 xl:p-16 relative">
        {/* Halo sutil de fondo en mobile */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-64 bg-[#006AFC]/5 rounded-full blur-3xl pointer-events-none lg:hidden"
          aria-hidden="true"
        />

        <div className="w-full max-w-[420px] mx-auto relative z-10 py-4 sm:py-6">
          {/* Logo oficial con mayor presencia en mobile/tablet */}
          <div className="lg:hidden mb-6 sm:mb-8 flex justify-center">
            <BrandLockup variant="light" size="xl" />
          </div>

          {/* Card blanca envolvente en mobile/PWA, transparente en desktop */}
          <div className="bg-white rounded-2xl border border-slate-200/70 shadow-sm p-6 sm:p-8 lg:p-0 lg:bg-transparent lg:border-0 lg:shadow-none transition-all">
            {/* Encabezado del login */}
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Bienvenido
              </h1>
              <p className="text-sm text-slate-500 mt-1.5">
                Iniciá sesión en tu cuenta de Punto X
              </p>
            </div>

            {/* Formulario con soporte para loading con delay ~250ms */}
            <CredentialsForm />
          </div>

          {/* Aviso de acceso por invitación */}
          <div className="mt-4 sm:mt-6 p-3.5 rounded-xl border border-slate-200/80 bg-white/90 lg:bg-slate-50/80 backdrop-blur-xs flex items-start gap-3 shadow-2xs lg:shadow-none">
            <Info
              className="h-4 w-4 text-[#006AFC] mt-0.5 shrink-0"
              aria-hidden="true"
            />
            <p className="text-xs text-slate-600 leading-relaxed">
              El acceso es solo por invitación. Contactá a un administrador para
              obtener acceso.
            </p>
          </div>

          {/* Términos y privacidad */}
          <div className="mt-5 text-center text-xs text-slate-400/90 leading-relaxed px-2">
            <p>
              Al continuar, aceptás nuestros términos de servicio y política de
              privacidad
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
