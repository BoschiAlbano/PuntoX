import { CobrosScreen } from "@/components/cobros/CobrosScreen";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function CobrosPage() {
  return (
    <div className="   flex flex-col items-stretch min-h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Cobros"
        accentTitle="Pendientes"
        description="Facturas registradas en modo diferido esperando cobro."
      />
      <CobrosScreen />
    </div>
  );
}
