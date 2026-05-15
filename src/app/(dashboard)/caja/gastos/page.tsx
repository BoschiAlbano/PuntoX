import { PageHeader } from "@/components/dashboard/PageHeader";
import GastosView from "@/components/gastos/GastosView";

export default function GastosPage() {
  return (
    <div className="flex flex-col min-h-full relative gap-4 sm:gap-6">
      <PageHeader
        title="Gastos de"
        accentTitle="Caja"
        description="Registrá y gestioná los gastos asociados a la caja abierta."
      />
      <GastosView />
    </div>
  );
}
