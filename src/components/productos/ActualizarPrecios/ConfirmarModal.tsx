import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Chip,
} from "@heroui/react";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { ReglaActualizacion } from "@/hooks/useActualizarPrecios";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  regla: ReglaActualizacion;
  count: number;
  isApplying: boolean;
}

export function ConfirmarModal({
  isOpen,
  onClose,
  onConfirm,
  regla,
  count,
  isApplying,
}: Props) {
  const getTipoLabel = () => {
    switch (regla.tipo) {
      case "incremento_porcentaje":
        return "incremento en porcentaje";
      case "decremento_porcentaje":
        return "descuento en porcentaje";
      case "incremento_fijo":
        return "incremento fijo";
      case "decremento_fijo":
        return "descuento fijo";
      default:
        return "";
    }
  };

  const isPorcentaje = regla.tipo.includes("porcentaje");

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      placement="center"
      backdrop="opaque"
      classNames={{
        base: "border border-[#E2E8F0] shadow-2xl",
        header: "border-b border-[#E2E8F0]",
        body: "py-0",
        footer: "border-t border-[#E2E8F0] bg-[#F8FAFC]",
        backdrop: "bg-[#0F172A]/40 backdrop-blur-sm",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex gap-2.5 items-center py-4">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}
          >
            <AlertCircle className="text-[#D97706] w-4 h-4" />
          </div>
          <span
            className="font-bold text-[#0F2233]"
            style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
          >
            Confirmar Actualización
          </span>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="flex flex-col gap-4">
            <p className="text-[#475569] text-sm" style={{ fontFamily: "Inter, sans-serif" }}>
              Estás por actualizar los precios de{" "}
              <strong className="text-[#0F2233] font-semibold">{count} artículos</strong> en
              todas sus listas de precio activas.
            </p>

            <div
              className="p-4 rounded-xl flex flex-col gap-2.5"
              style={{
                background: "#FFFFFF",
                border: "1px solid #E2E8F0",
                boxShadow: "0 0 0 1px #E2E8F0",
              }}
            >
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64748B]">Tipo de ajuste:</span>
                <span className="font-semibold text-[#0F2233] capitalize">
                  {getTipoLabel()}
                </span>
              </div>
              <div className="w-full h-px bg-[#F1F5F9]" />
              <div className="flex justify-between items-center text-sm">
                <span className="text-[#64748B]">Valor:</span>
                <strong
                  className="text-lg font-bold"
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    color: "#0F2233",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {isPorcentaje ? `${regla.valor}%` : `$${regla.valor}`}
                </strong>
              </div>
              {regla.redondear && (
                <>
                  <div className="w-full h-px bg-[#F1F5F9]" />
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-[#64748B]">Redondeo:</span>
                    <Chip
                      size="sm"
                      variant="flat"
                      className="font-bold text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A]"
                    >
                      {regla.redondeoTipo === "ceil_99"
                        ? "★ Ceil $99"
                        : regla.redondeoTipo}
                    </Chip>
                  </div>
                </>
              )}
            </div>

            <p className="text-[11px] text-[#94A3B8] italic" style={{ fontFamily: "Inter, sans-serif" }}>
              Esta operación no se puede deshacer de forma automática. Se
              recomienda haber verificado los cambios en la vista previa.
            </p>
          </div>
        </ModalBody>
        <ModalFooter>
          <Button variant="light" onPress={onClose} isDisabled={isApplying}
            className="text-[#64748B]"
          >
            Cancelar
          </Button>
          <Button
            onPress={onConfirm}
            isLoading={isApplying}
            startContent={!isApplying && <CheckCircle2 className="w-4 h-4" />}
            className="font-bold text-white"
            style={{
              background: "#FF6100",
              boxShadow: "0 4px 14px 0 rgba(255,97,0,0.35)",
            }}
          >
            Confirmar y Aplicar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
