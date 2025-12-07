import MarcaCRUD from "@/components/marcas/MarcaCRUD";
import ProductoCRUD from "@/components/productos/ProductoCRUD";
import RubroCRUD from "@/components/rubros/RubroCRUD";
import UnidadMedidaCRUD from "@/components/unidad-medida/UnidadMedidaCRUD";

export default function ProductosPage() {
  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 flex flex-col gap-10 ">
      <ProductoCRUD />

      <MarcaCRUD />

      <RubroCRUD />

      <UnidadMedidaCRUD />
    </div>
  );
}
