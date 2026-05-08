import { CobrosScreen } from "@/components/cobros/CobrosScreen";
import { PageHeader } from "@/components/dashboard/PageHeader";

export default function CobrosPage() {
  return (
    <div className="max-w-[1400px] mx-auto py-4 sm:py-6 px-3 sm:px-6 flex flex-col items-stretch h-full relative space-y-4 sm:space-y-6">
      <PageHeader
        title="Cobros"
        accentTitle="Pendientes"
        description="Facturas registradas en modo diferido esperando cobro."
      />
      <CobrosScreen />
    </div>
  );
}
