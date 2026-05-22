import { modalMotionProps } from "@/lib/motionConfig";
import { useState, useEffect } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Switch,
} from "@heroui/react";
import { DollarSign, X } from "lucide-react";
import { ListaPrecio } from "@/lib/validations/lista-precio.schema";
import { GenericFormProps } from "@/components/shared/GenericCrud";

const inputClassNames = {
  inputWrapper:
    "bg-white border border-slate-200 shadow-none hover:border-slate-300 " +
    "focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
};

export default function ListaPrecioForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<ListaPrecio>) {
  const [formData, setFormData] = useState<Partial<ListaPrecio>>({
    Nombre: "",
    PorDefecto: false,
    Activa: true,
    EstaEliminado: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({ Nombre: "", PorDefecto: false, Activa: true, EstaEliminado: false });
    }
  }, [initialData, isOpen]);

  const isEdit = !!initialData;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      hideCloseButton
      isDismissable={!isSaving}
      motionProps={modalMotionProps}
      classNames={{
        backdrop: "bg-slate-900/60 backdrop-blur-sm",
        wrapper: "items-end sm:items-center",
        base: "font-sans bg-white shadow-2xl border-0 sm:border border-slate-200 rounded-none sm:rounded-2xl w-full sm:max-w-[460px] m-0 sm:m-auto",
      }}
    >
      <ModalContent>
        {/* ── Header ── */}
        <ModalHeader className="flex items-center gap-3 py-4 px-5 border-b border-slate-100">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#67afc3" }}
          >
            <DollarSign size={17} className="text-white" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-base font-bold text-slate-800 leading-tight">
              {isEdit ? "Editar Lista de Precio" : "Nueva Lista de Precio"}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              {isEdit
                ? "Modificá los datos de la lista"
                : "Completá los datos de la nueva lista"}
            </span>
          </div>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
            className="text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl shrink-0"
          >
            <X size={16} />
          </Button>
        </ModalHeader>

        {/* ── Body ── */}
        <ModalBody className="px-5 py-5 space-y-4">
          <Input
            label="Nombre"
            placeholder="Ej: Mayorista, Lista VIP"
            autoFocus
            value={formData.Nombre || ""}
            onChange={(e) => setFormData({ ...formData, Nombre: e.target.value })}
            isRequired
            isDisabled={isSaving}
            classNames={inputClassNames}
          />
          <div className="flex flex-col gap-3 px-1">
            <Switch
              isSelected={formData.Activa}
              onValueChange={(checked) => setFormData({ ...formData, Activa: checked })}
              isDisabled={isSaving}
              color="success"
              size="sm"
            >
              <span
                className={`text-sm font-medium ${formData.Activa ? "text-emerald-600" : "text-rose-600"}`}
              >
                {formData.Activa ? "Lista Activa" : "Lista Inactiva"}
              </span>
            </Switch>
            <Switch
              isSelected={formData.PorDefecto}
              onValueChange={(checked) => setFormData({ ...formData, PorDefecto: checked })}
              isDisabled={isSaving}
              size="sm"
              classNames={{ thumb: "bg-white", wrapper: "bg-[#67afc3]/30 group-data-[selected=true]:bg-[#67afc3]" }}
            >
              <span className="text-sm font-medium text-slate-700">
                Lista por defecto
              </span>
            </Switch>
          </div>
        </ModalBody>

        {/* ── Footer ── */}
        <ModalFooter className="flex items-center justify-between py-3.5 px-5 border-t border-slate-100 bg-white gap-3">
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
            className="font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl h-10 px-5"
          >
            Cancelar
          </Button>
          <Button
            onPress={() => onSubmit(formData)}
            isLoading={isSaving}
            className="bg-[#67afc3] hover:bg-[#4899b0] text-white font-bold rounded-xl shadow-md shadow-[#67afc3]/30 h-10 px-6"
          >
            {isEdit ? "Guardar Cambios" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
