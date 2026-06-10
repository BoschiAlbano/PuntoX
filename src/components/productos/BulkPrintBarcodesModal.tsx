"use client";

import React, { useRef } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
} from "@heroui/react";
import { Producto } from "@/lib/validations/producto.schema";
import Barcode from "react-barcode";
import { useReactToPrint } from "react-to-print";
import { Printer } from "lucide-react";

interface BulkPrintBarcodesModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Producto[];
  onSuccess?: () => void;
}

export function BulkPrintBarcodesModal({
  isOpen,
  onClose,
  items,
  onSuccess,
}: BulkPrintBarcodesModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: "Codigos_de_Barras",
    onAfterPrint: () => {
      onSuccess?.();
      onClose();
    },
  });

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      classNames={{
        base: "bg-white",
        header: "border-b border-slate-100",
        footer: "border-t border-slate-100",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-xl font-bold text-slate-800">
            Imprimir Códigos de Barras
          </h2>
          <p className="text-sm text-slate-500 font-normal">
            Se generarán etiquetas para {items.length} producto
            {items.length !== 1 ? "s" : ""}.
          </p>
        </ModalHeader>
        <ModalBody className="p-6 bg-slate-50/50">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 overflow-auto max-h-[500px]">
            {/* Contenedor invisible pero imprimible */}
            <div ref={printRef} className="print-container">
              <style type="text/css" media="print">
                {`
                  @page { size: A4; margin: 10mm; }
                  @media print {
                    .print-container {
                      width: 100%;
                    }
                    .print-grid {
                      display: grid;
                      grid-template-columns: repeat(3, 1fr);
                      gap: 15mm;
                      align-items: center;
                      justify-items: center;
                    }
                    .print-item {
                      text-align: center;
                      page-break-inside: avoid;
                      padding: 10px;
                    }
                  }
                `}
              </style>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-8 print-grid">
                {items.map((item) => (
                  <div
                    key={item.Id.toString()}
                    className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 rounded-lg print-item bg-white"
                  >
                    <p className="text-xs font-bold text-slate-800 text-center mb-1 line-clamp-2 w-full max-w-[150px]">
                      {item.Descripcion}
                    </p>
                    {item.CodigoBarra ? (
                      <Barcode
                        value={item.CodigoBarra}
                        width={1.5}
                        height={50}
                        fontSize={14}
                        margin={0}
                        background="#ffffff"
                        lineColor="#000000"
                        displayValue={true}
                      />
                    ) : (
                      <div className="h-[50px] flex items-center justify-center text-xs text-red-500">
                        Sin código
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} className="font-medium">
            Cancelar
          </Button>
          <Button
            className="bg-[#67afc3] text-white font-bold shadow-md"
            onPress={() => handlePrint()}
            startContent={<Printer size={18} />}
          >
            Imprimir Etiquetas
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
