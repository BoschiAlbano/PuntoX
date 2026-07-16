import GastoDetalleScreen from "@/components/gastos/GastoDetalleScreen";

export default async function GastoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const gastoId = parseInt(id, 10);

  if (isNaN(gastoId)) {
    return <div>ID de gasto inválido</div>;
  }

  return <GastoDetalleScreen id={gastoId} />;
}
