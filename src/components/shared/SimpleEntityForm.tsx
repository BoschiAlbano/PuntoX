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
import { Tag, X } from "lucide-react";
import { modalMotionProps } from "@/lib/motionConfig";
import { GenericFormProps } from "@/components/shared/GenericCrud";

export interface SimpleEntity {
  Id: number | string;
  Descripcion: string;
  EstaEliminado: boolean;
}

export interface SimpleEntityFormConfig {
  entityName: string;
  entityArticle?: string;
  newLabel?: string;
  editLabel?: string;
  descriptionPlaceholder?: string;
  switchActiveLabel?: string;
  switchInactiveLabel?: string;
  icon?: React.ComponentType<{ size?: number; className?: string }>;
}

export type SimpleEntityFormProps<T extends SimpleEntity> =
  GenericFormProps<T> & SimpleEntityFormConfig;

const inputClassNames = {
  inputWrapper:
    "bg-white border border-slate-200 shadow-none hover:border-slate-300 " +
    "focus-within:!border-[#67afc3] focus-within:ring-1 focus-within:ring-[#67afc3]/20",
};

export function SimpleEntityForm<T extends SimpleEntity>({
  isOpen,
  onClose,
  initialData,
  onSubmit,
  isSaving,
  entityName,
  entityArticle,
  newLabel,
  editLabel,
  descriptionPlaceholder,
  switchActiveLabel,
  switchInactiveLabel,
  icon: Icon = Tag,
}: SimpleEntityFormProps<T>) {
  const [formData, setFormData] = useState<Partial<SimpleEntity>>({
    Descripcion: "",
    EstaEliminado: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        Id: initialData.Id,
        Descripcion: initialData.Descripcion,
        EstaEliminado: initialData.EstaEliminado,
      });
    } else {
      setFormData({ Descripcion: "", EstaEliminado: false });
    }
  }, [initialData, isOpen]);

  const isEdit = !!initialData;
  const article = entityArticle ?? `la ${entityName.toLowerCase()}`;
  const createLabel = newLabel ?? `Nueva ${entityName}`;
  const updateLabel = editLabel ?? `Editar ${entityName}`;
  const placeholder = descriptionPlaceholder ?? `Nombre de ${article}`;
  const activeLabel = switchActiveLabel ?? `${entityName} Activo`;
  const inactiveLabel = switchInactiveLabel ?? `${entityName} Inactivo`;

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
            <Icon size={17} className="text-white" />
          </div>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-base font-bold text-slate-800 leading-tight">
              {isEdit ? updateLabel : createLabel}
            </span>
            <span className="text-xs text-slate-400 font-normal">
              {isEdit
                ? `Modificá los datos de ${article}`
                : `Completá la información de ${article}`}
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
            label="Descripción"
            placeholder={placeholder}
            autoFocus
            value={formData.Descripcion ?? ""}
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, Descripcion: e.target.value }))
            }
            isRequired
            isDisabled={isSaving}
            maxLength={250}
            description={`${formData.Descripcion?.length ?? 0}/250`}
            classNames={inputClassNames}
          />
          <div className="flex items-center gap-2 px-1">
            <Switch
              isSelected={!formData.EstaEliminado}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, EstaEliminado: !value }))
              }
              color={formData.EstaEliminado ? "danger" : "success"}
              isDisabled={isSaving}
              size="sm"
            >
              <span
                className={`text-sm font-medium ${
                  formData.EstaEliminado ? "text-rose-600" : "text-emerald-600"
                }`}
              >
                {formData.EstaEliminado ? inactiveLabel : activeLabel}
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
            onPress={() => onSubmit(formData as Partial<T>)}
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

export function createSimpleEntityForm<T extends SimpleEntity>(
  config: SimpleEntityFormConfig,
) {
  function ConfiguredSimpleEntityForm(props: GenericFormProps<T>) {
    return <SimpleEntityForm<T> {...props} {...config} />;
  }
  ConfiguredSimpleEntityForm.displayName = `SimpleEntityForm(${config.entityName})`;
  return ConfiguredSimpleEntityForm;
}
