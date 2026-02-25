"use client";

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
import { GenericFormProps } from "@/components/shared/GenericCrud";

export interface UnidadMedida {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
}

export default function UnidadMedidaGenericForm({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
}: GenericFormProps<UnidadMedida>) {
  const [formData, setFormData] = useState<Partial<UnidadMedida>>({
    Descripcion: "",
    EstaEliminado: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
    } else {
      setFormData({
        Descripcion: "",
        EstaEliminado: false,
      });
    }
  }, [initialData, isOpen]);

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const isEdit = !!initialData;

  const inputClassNames = {
    inputWrapper:
      "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      placement="center"
      backdrop="opaque"
      isDismissable={!isSaving}
      scrollBehavior="inside"
      classNames={{
        backdrop: "bg-black/50 backdrop-blur-sm",
        base: "font-sans bg-white rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-[#e5e7eb] max-w-[500px] max-h-[90vh] overflow-hidden",
        header:
          "border-t-[3px] border-t-[#67afc3] border-b border-[#e5e7eb] bg-[#67afc3]/5 rounded-t-2xl",
        body: "py-0 overflow-y-auto overflow-x-hidden",
        footer: "border-t border-[#e5e7eb] bg-[#f8fafc] rounded-b-2xl",
        closeButton:
          "hover:bg-[#67afc3]/10 hover:text-[#67afc3] rounded-full p-1.5 transition-colors text-[#6b7280]",
      }}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 py-6 px-6">
          <h3 className="text-[28px] font-bold text-[#0f172a] leading-tight">
            {isEdit ? "Editar Unidad de Medida" : "Nueva Unidad de Medida"}
          </h3>
          {!isEdit && (
            <p className="text-sm text-[#6b7280] mt-1">
              Completa la información de la unidad de medida
            </p>
          )}
        </ModalHeader>
        <ModalBody className="p-0">
          <div className="px-6 py-6 space-y-4">
            <Input
              label="Descripción"
              placeholder="Nombre de la unidad de medida"
              value={formData.Descripcion || ""}
              onChange={(e) =>
                setFormData({ ...formData, Descripcion: e.target.value })
              }
              isRequired
              isDisabled={isSaving}
              maxLength={250}
              description={`${
                formData.Descripcion?.length || 0
              }/250 caracteres`}
              classNames={inputClassNames}
            />
            <div className="flex items-center gap-2">
              <Switch
                isSelected={!formData.EstaEliminado}
                onValueChange={(value) =>
                  setFormData({ ...formData, EstaEliminado: !value })
                }
                color={formData.EstaEliminado ? "danger" : "success"}
                isDisabled={isSaving}
              >
                {formData.EstaEliminado
                  ? "Unidad de Medida Inactiva"
                  : "Unidad de Medida Activa"}
              </Switch>
            </div>
          </div>
        </ModalBody>
        <ModalFooter className="py-5 px-6 gap-3">
          <Button
            variant="light"
            onPress={onClose}
            isDisabled={isSaving}
            className="font-medium text-[#6b7280] hover:bg-[#f1f5f9] h-11 px-5 rounded-[10px]"
          >
            Cancelar
          </Button>
          <Button
            onPress={handleSubmit}
            isLoading={isSaving}
            className="bg-[#67afc3] hover:bg-[#4a8d9e] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow focus-visible:ring-2 focus-visible:ring-[#67afc3]/40"
          >
            {isEdit ? "Actualizar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
