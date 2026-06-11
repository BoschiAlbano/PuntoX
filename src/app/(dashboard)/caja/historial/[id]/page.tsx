import CajaHistorialDetalleScreen from "@/components/caja/CajaHistorialDetalleScreen";

export default async function CajaHistorialDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const cajaId = parseInt(id, 10);

  if (isNaN(cajaId)) {
    return <div>ID de caja inválido</div>;
  }

  return <CajaHistorialDetalleScreen id={cajaId} />;
}
