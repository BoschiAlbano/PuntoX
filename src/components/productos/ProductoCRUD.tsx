"use client";

import { useState } from "react";
import { Button, useDisclosure, addToast } from "@heroui/react";
import { useProductos, ApiError } from "@/hooks/useProductos";
import { Producto } from "@/lib/validations/producto.schema";
import ProductoTable from "./ProductoTable";
import ProductoForm from "./ProductoForm";
import ProductoDeleteModal from "./ProductoDeleteModal";

export default function ProductoCRUD() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const {
    isOpen: isDeleteOpen,
    onOpen: onDeleteOpen,
    onClose: onDeleteClose,
  } = useDisclosure();

  const [productoSeleccionado, setProductoSeleccionado] =
    useState<Producto | null>(null);
  const [productoAEliminar, setProductoAEliminar] = useState<Producto | null>(
    null
  );

  const {
    productos,
    isLoadingProductos,
    isErrorProductos,
    marcas,
    rubros,
    unidades,
    ivas,
    saveMutation,
    deleteMutation,
  } = useProductos({ fetchAuxiliary: isOpen });

  const handleCrear = () => {
    setProductoSeleccionado(null);
    onOpen();
  };

  const handleEditar = (producto: Producto) => {
    setProductoSeleccionado(producto);
    onOpen();
  };

  const handleGuardar = (data: Producto) => {
    const isEdit = !!productoSeleccionado;
    saveMutation.mutate(
      { data, isEdit },
      {
        onSuccess: () => {
          addToast({
            title: "Éxito",
            description: `Producto ${
              isEdit ? "actualizado" : "creado"
            } correctamente`,
            color: "success",
          });
          onClose();
        },
        onError: (error: any) => {
          const apiError = error as ApiError;
          if (apiError.details && apiError.details.length > 0) {
            apiError.details.forEach((detail) => {
              addToast({
                title: "Error de validación",
                description: detail.message,
                color: "danger",
              });
            });
          } else {
            addToast({
              title: "Error",
              description: apiError.error || "Error al guardar el producto",
              color: "danger",
            });
          }
        },
      }
    );
  };

  const handleConfirmarEliminar = (producto: Producto) => {
    setProductoAEliminar(producto);
    onDeleteOpen();
  };

  const handleEliminar = () => {
    if (productoAEliminar) {
      deleteMutation.mutate(productoAEliminar.Id, {
        onSuccess: () => {
          addToast({
            title: "Éxito",
            description: "Producto eliminado correctamente",
            color: "success",
          });
          onDeleteClose();
          setProductoAEliminar(null);
        },
        onError: (error: any) => {
          const apiError = error as ApiError;
          addToast({
            title: "Error",
            description: apiError.error || "Error al eliminar el producto",
            color: "danger",
          });
        },
      });
    }
  };

  const isSaving = saveMutation.isPending || deleteMutation.isPending;

  return (
    <div className="w-full space-y-4">
      {/* Header con botón crear */}

      {/* <div className="absolute flex justify-end items-center w-full right-0 top-[-20px] z-20">
        <button
          onClick={handleCrear}
          className="font-semibold from-blue-500 to-[#90c472] bg-gradient-to-r hover:from-blue-600 hover:to-[#90c472] rounded-full w-[50px] h-[50px] aspect-square text-white"
          disabled={isLoadingProductos}
        >
          +
        </button>
      </div> */}

      {/* Tabla de productos */}
      <ProductoTable
        productos={productos}
        isLoading={isLoadingProductos}
        isError={isErrorProductos}
        onEdit={handleEditar}
        onDelete={handleConfirmarEliminar}
        onNew={handleCrear}
        isDisabled={isSaving}
      />

      {/* Modal para crear/editar */}
      <ProductoForm
        isOpen={isOpen}
        onClose={onClose}
        producto={productoSeleccionado}
        onSubmit={handleGuardar}
        isSaving={isSaving}
        marcas={marcas}
        rubros={rubros}
        unidades={unidades}
        ivas={ivas}
      />

      {/* Modal de confirmación de eliminación */}
      <ProductoDeleteModal
        isOpen={isDeleteOpen}
        onClose={onDeleteClose}
        producto={productoAEliminar}
        onConfirm={handleEliminar}
        isSaving={isSaving}
      />
    </div>
  );
}
