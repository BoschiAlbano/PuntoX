import { 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Button,
  Chip
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

export function ConfirmarModal({ isOpen, onClose, onConfirm, regla, count, isApplying }: Props) {
  
  const getTipoLabel = () => {
    switch (regla.tipo) {
      case "porcentaje_sobre_costo": return "incremento sobre el costo";
      case "porcentaje_incremento": return "incremento sobre el precio actual";
      case "porcentaje_descuento": return "descuento sobre el precio actual";
      case "precio_costo_mas_fijo": return "monto fijo sobre el costo";
      default: return "";
    }
  };

  const isPorcentaje = regla.tipo.includes("porcentaje");

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      placement="center"
      backdrop="blur"
      classNames={{
        base: "border border-slate-200 shadow-2xl",
        header: "border-b border-slate-100 bg-slate-50/50",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex gap-2 items-center">
          <AlertCircle className="text-warning w-5 h-5" />
          <span>Confirmar Actualización</span>
        </ModalHeader>
        <ModalBody className="py-6">
          <div className="flex flex-col gap-4 text-slate-600">
            <p>
              Estás por actualizar los precios de <strong className="text-slate-900">{count} artículos</strong> en todas sus listas de precio activas.
            </p>
            
            <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span>Tipo de ajuste:</span>
                <span className="font-semibold text-slate-900 capitalize">{getTipoLabel()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span>Valor:</span>
                <strong className="text-lg text-[#67afc3]">
                  {isPorcentaje ? `${regla.valor}%` : `$${regla.valor}`}
                </strong>
              </div>
              {regla.redondear && (
                <div className="flex justify-between items-center text-sm">
                  <span>Redondeo:</span>
                  <Chip size="sm" color="primary" variant="flat" className="font-bold">
                    {regla.redondeoTipo === 'ceil_99' ? '★ Ceil $99' : regla.redondeoTipo}
                  </Chip>
                </div>
              )}
            </div>

            <p className="text-xs text-slate-400 italic">
              Esta operación no se puede deshacer de forma automática. Se recomienda haber verificado los cambios en la vista previa.
            </p>
          </div>
        </ModalBody>
        <ModalFooter className="bg-slate-50/50">
          <Button variant="light" onPress={onClose} isDisabled={isApplying}>
            Cancelar
          </Button>
          <Button 
            color="primary" 
            onPress={onConfirm} 
            isLoading={isApplying}
            startContent={!isApplying && <CheckCircle2 className="w-4 h-4" />}
            className="font-bold"
          >
            Confirmar y Aplicar
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
