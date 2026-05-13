import { CobrosScreen } from "@/components/cobros/CobrosScreen";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function CobrosPage() {
  return (
    <div className="flex flex-col min-h-full relative gap-4 sm:gap-6">
      <PageHeader
        title="Cobros"
        accentTitle="Pendientes"
        description="Facturas registradas en modo diferido esperando cobro."
      />
      <CobrosScreen />
    </div>
  );
}
