"use client";

import { modalMotionProps } from "@/lib/motionConfig";
import { Modal, ModalContent, ModalHeader, ModalBody, Spinner } from "@heroui/react";
import Image from "next/image";

export interface FotoCandidato {
  code: string;
  productName: string | null;
  brands: string | null;
  imageUrl: string;
  fuente?: "PUNTO_X" | "OPEN_FOOD_FACTS";
}

interface SeleccionarFotoModalProps {
  isOpen: boolean;
  onClose: () => void;
  isLoading: boolean;
  candidatos: FotoCandidato[];
  onSelect: (candidato: FotoCandidato) => void;
}

export default function SeleccionarFotoModal({
  isOpen,
  onClose,
  isLoading,
  candidatos,
  onSelect,
}: SeleccionarFotoModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      backdrop="opaque"
      scrollBehavior="inside"
      motionProps={modalMotionProps}
      classNames={{ backdrop: "bg-slate-900/50", base: "bg-white" }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          Elegí una foto
          <p className="text-sm font-normal text-slate-500">
            No encontramos el producto por código de barra. Estos son resultados
            por nombre — elegí la imagen que corresponda.
          </p>
        </ModalHeader>
        <ModalBody className="pb-6">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner label="Buscando imágenes..." color="primary" />
            </div>
          ) : candidatos.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">
              No se encontraron imágenes para este producto.
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {candidatos.map((candidato) => (
                <button
                  key={candidato.code}
                  type="button"
                  onClick={() => onSelect(candidato)}
                  className="group flex flex-col items-center gap-2 p-3 rounded-xl border border-slate-200 hover:border-[#67afc3] hover:bg-[#67afc3]/5 transition-colors text-left"
                >
                  <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-50 border border-slate-100">
                    <Image
                      src={candidato.imageUrl}
                      alt={candidato.productName || "Producto"}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                    {candidato.fuente && (
                      <span
                        className={`absolute top-1 left-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                          candidato.fuente === "PUNTO_X"
                            ? "bg-[#67afc3] text-white"
                            : "bg-slate-600 text-white"
                        }`}
                      >
                        {candidato.fuente === "PUNTO_X"
                          ? "Comunidad PuntoX"
                          : "Open Food Facts"}
                      </span>
                    )}
                  </div>
                  <div className="w-full">
                    <p className="text-xs font-medium text-slate-700 truncate">
                      {candidato.productName || "Sin nombre"}
                    </p>
                    {candidato.brands && (
                      <p className="text-xs text-slate-400 truncate">
                        {candidato.brands}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
