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
import { ListaPrecio } from "@/lib/validations/lista-precio.schema";
import { GenericFormProps } from "@/components/shared/GenericCrud";

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
      setFormData({
        Nombre: "",
        PorDefecto: false,
        Activa: true,
        EstaEliminado: false,
      });
    }
  }, [initialData, isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      backdrop="opaque"
      scrollBehavior="inside"
      motionProps={modalMotionProps}
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        wrapper: "items-end sm:items-center",
        base: "font-sans bg-white rounded-t-[20px] rounded-b-none sm:rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-[#e5e7eb] w-full sm:w-auto m-0 sm:m-auto max-h-[92vh]",
        header: "border-t-[3px] border-t-[var(--crud-accent)] border-b border-[#e5e7eb] bg-[var(--crud-accent)]/5",
        body: "py-6",
        footer: "border-t border-[#e5e7eb] bg-[#f8fafc]",
        closeButton: "hover:bg-[var(--crud-accent)]/10 hover:text-[var(--crud-accent)] rounded-full p-1.5 transition-colors text-[#6b7280]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 py-4 px-6">
          <h3 className="text-xl font-bold text-[#0f172a]">
            {initialData ? "Editar Lista de Precio" : "Nueva Lista de Precio"}
          </h3>
          <p className="text-sm text-[#6b7280] font-normal">
            {initialData
              ? "Modifica los datos de la lista de precio"
              : "Ingresa los datos para la nueva lista de precio"}
          </p>
        </ModalHeader>
        <ModalBody className="px-6 space-y-6">
          <Input
            label="Nombre"
            placeholder="Ej: Mayorista, Lista VIP"
            value={formData.Nombre || ""}
            onChange={(e) =>
              setFormData({ ...formData, Nombre: e.target.value })
            }
            isRequired
            isDisabled={isSaving}
            classNames={{
              inputWrapper:
                "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
            }}
          />
          <div className="flex flex-col gap-4">
            <Switch
              isSelected={formData.Activa}
              onValueChange={(checked) =>
                setFormData({ ...formData, Activa: checked })
              }
              isDisabled={isSaving}
              color="success"
              size="sm"
            >
              <span className="text-sm text-gray-700">Lista activa</span>
            </Switch>
            <Switch
              isSelected={formData.PorDefecto}
              onValueChange={(checked) =>
                setFormData({ ...formData, PorDefecto: checked })
              }
              isDisabled={isSaving}
              color="primary"
              size="sm"
            >
              <span className="text-sm text-gray-700">Lista por defecto</span>
            </Switch>
          </div>
        </ModalBody>
        <ModalFooter className="px-6 py-4">
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
            className="text-[#6b7280] font-medium"
          >
            Cancelar
          </Button>
          <Button
            color="primary"
            onPress={() => onSubmit(formData)}
            isLoading={isSaving}
            className="bg-[#67afc3] text-white font-medium shadow-sm hover:bg-[#5a9ab0]"
          >
            {isSaving ? "Guardando..." : "Guardar"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
