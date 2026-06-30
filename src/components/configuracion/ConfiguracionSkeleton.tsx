export function FormSectionSkeleton() {
  return (
    <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm animate-pulse">
      <div className="px-6 py-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
        <div className="p-2 rounded-xl bg-slate-200 w-8 h-8"></div>
        <div className="h-4 bg-slate-200 rounded w-32"></div>
      </div>
      <div className="px-6 py-5 space-y-4">
        <div className="h-11 bg-slate-100 rounded-xl w-full"></div>
        <div className="h-11 bg-slate-100 rounded-xl w-full"></div>
        <div className="h-11 bg-slate-100 rounded-xl w-3/4"></div>
      </div>
    </div>
  );
}

export function PerfilTabSkeleton() {
  return (
    <div className="pt-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {/* Identidad de marca - full width */}
          <div className="lg:col-span-2">
            <FormSectionSkeleton />
          </div>

          {/* Datos de contacto */}
          <FormSectionSkeleton />

          {/* Ubicación */}
          <FormSectionSkeleton />

          {/* Observación - full width */}
          <div className="lg:col-span-2">
            <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm animate-pulse">
              <div className="px-6 py-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-200 w-8 h-8"></div>
                <div className="h-4 bg-slate-200 rounded w-48"></div>
              </div>
              <div className="px-6 py-5">
                <div className="h-11 bg-slate-100 rounded-xl w-full"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="flex justify-end pt-6 pb-6">
          <div className="h-11 bg-slate-200 rounded-xl w-48 animate-pulse"></div>
        </div>
      </div>
    </div>
  );
}

export function VentasTabSkeleton() {
  return (
    <div className="pt-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="space-y-5 pb-6">
          <FormSectionSkeleton />
          <FormSectionSkeleton />
          <FormSectionSkeleton />
          <FormSectionSkeleton />
        </div>
      </div>
    </div>
  );
}

export function NotificacionesTabSkeleton() {
  return (
    <div className="pt-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="space-y-5 pb-6">
          <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm animate-pulse">
            <div className="px-6 py-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-200 w-8 h-8"></div>
              <div className="h-4 bg-slate-200 rounded w-40"></div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="h-16 bg-slate-100 rounded-xl w-full"></div>
              <div className="h-16 bg-slate-100 rounded-xl w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SeguridadTabSkeleton() {
  return (
    <div className="pt-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="space-y-5 pb-6">
          {/* Acceso y autenticación */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm animate-pulse">
            <div className="px-6 py-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-200 w-8 h-8"></div>
              <div className="h-4 bg-slate-200 rounded w-44"></div>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="h-16 bg-slate-100 rounded-xl w-full"></div>
              <div className="h-16 bg-slate-100 rounded-xl w-full"></div>
              <div className="h-16 bg-slate-100 rounded-xl w-full"></div>
            </div>
          </div>

          {/* Estado de seguridad */}
          <div className="bg-white/90 backdrop-blur-xl border border-slate-100 rounded-[20px] shadow-sm animate-pulse">
            <div className="px-6 py-4 border-b border-slate-100/60 bg-slate-50/50 flex items-center gap-3">
              <div className="p-2 rounded-xl bg-slate-200 w-8 h-8"></div>
              <div className="h-4 bg-slate-200 rounded w-40"></div>
            </div>
            <div className="px-6 py-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="h-24 bg-slate-100 rounded-2xl"></div>
                <div className="h-24 bg-slate-100 rounded-2xl"></div>
                <div className="h-24 bg-slate-100 rounded-2xl"></div>
                <div className="h-24 bg-slate-100 rounded-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function FiscalTabSkeleton() {
  return (
    <div className="pt-4">
      <div className="max-w-screen-2xl mx-auto">
        <div className="space-y-5 pb-6">
          <FormSectionSkeleton />
          <FormSectionSkeleton />
          <FormSectionSkeleton />
        </div>
      </div>
    </div>
  );
}
