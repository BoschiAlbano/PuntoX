import ComprobanteDetalleScreen from "@/components/comprobantes/ComprobanteDetalleScreen";

export default async function ComprobantePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const comprobanteId = parseInt(id, 10);

  if (isNaN(comprobanteId)) {
    return <div>ID de comprobante inválido</div>;
  }

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <ComprobanteDetalleScreen id={comprobanteId} />
    </div>
  );
}
