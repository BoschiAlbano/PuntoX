"use client";

/**
 * Formulario genérico para entidades simples con Descripcion + EstaEliminado.
 * Reemplaza MarcaForm, RubroForm, UnidadMedidaForm (son character-for-character idénticos).
 *
 * Uso directo:
 *   <SimpleEntityForm entityName="Marca" descriptionPlaceholder="Nombre de la marca" {...props} />
 *
 * Uso vía factory (para pasarlo como FormComponent a GenericCrud):
 *   const MarcaForm = createSimpleEntityForm<Marca>({ entityName: "Marca", ... });
 */

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
import { modalMotionProps } from "@/lib/motionConfig";
import { GenericFormProps } from "@/components/shared/GenericCrud";

/** Forma mínima que debe tener la entidad para usar este formulario */
export interface SimpleEntity {
  Id: number | string;
  Descripcion: string;
  EstaEliminado: boolean;
}

export interface SimpleEntityFormConfig {
  /** Nombre de la entidad, e.g. "Marca", "Rubro", "Unidad de Medida" */
  entityName: string;
  /**
   * Texto de artículo para subtítulo: "la marca", "el rubro", "la unidad de medida".
   * Si se omite, se genera como `"la ${entityName.toLowerCase()}"`.
   */
  entityArticle?: string;
  /** Etiqueta del título al crear. Default: `"Nueva ${entityName}"` */
  newLabel?: string;
  /** Etiqueta del título al editar. Default: `"Editar ${entityName}"` */
  editLabel?: string;
  /** Placeholder del input de descripción. Default: `"Nombre de ${entityArticle}"` */
  descriptionPlaceholder?: string;
  /** Texto del switch cuando está activo. Default: `"${entityName} Activo"` */
  switchActiveLabel?: string;
  /** Texto del switch cuando está inactivo. Default: `"${entityName} Inactivo"` */
  switchInactiveLabel?: string;
}

export type SimpleEntityFormProps<T extends SimpleEntity> =
  GenericFormProps<T> & SimpleEntityFormConfig;

const inputClassNames = {
  inputWrapper:
    "bg-white border border-[#e5e7eb] shadow-none hover:border-[#e0e0e0] " +
    "focus-within:!border-[var(--crud-accent)] focus-within:ring-1 focus-within:ring-[var(--crud-accent)]/20",
};

const modalClassNames = {
  backdrop: "bg-black/50 backdrop-blur-sm",
  wrapper: "items-end sm:items-center",
  base: "font-sans bg-white rounded-t-[20px] rounded-b-none sm:rounded-2xl shadow-[0_8px_30px_rgba(15,23,42,0.08)] border border-[#e5e7eb] max-w-full sm:max-w-[500px] max-h-[92vh] overflow-hidden w-full sm:w-auto m-0 sm:m-auto",
  header:
    "border-t-[3px] border-t-[var(--crud-accent)] border-b border-[#e5e7eb] bg-[var(--crud-accent)]/5",
  body: "py-0 overflow-y-auto overflow-x-hidden",
  footer: "border-t border-[#e5e7eb] bg-[#f8fafc]",
  closeButton:
    "hover:bg-[var(--crud-accent)]/10 hover:text-[var(--crud-accent)] rounded-full p-1.5 transition-colors text-[#6b7280]",
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
      size="md"
      backdrop="opaque"
      isDismissable={!isSaving}
      scrollBehavior="inside"
      motionProps={modalMotionProps}
      classNames={modalClassNames}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 py-6 px-6">
          <h3 className="text-[28px] font-bold text-[#0f172a] leading-tight">
            {isEdit ? updateLabel : createLabel}
          </h3>
          {!isEdit && (
            <p className="text-sm text-[#6b7280] mt-1">
              Completa la información de {article}
            </p>
          )}
        </ModalHeader>

        <ModalBody className="p-0">
          <div className="px-6 py-6 space-y-4">
            <Input
              label="Descripción"
              placeholder={placeholder}
              autoFocus
              value={formData.Descripcion ?? ""}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  Descripcion: e.target.value,
                }))
              }
              isRequired
              isDisabled={isSaving}
              maxLength={250}
              description={`${formData.Descripcion?.length ?? 0}/250 caracteres`}
              classNames={inputClassNames}
            />
            <div className="flex items-center gap-2">
              <Switch
                isSelected={!formData.EstaEliminado}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, EstaEliminado: !value }))
                }
                color={formData.EstaEliminado ? "danger" : "success"}
                isDisabled={isSaving}
              >
                {formData.EstaEliminado
                  ? inactiveLabel
                  : activeLabel}
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
            onPress={() => onSubmit(formData as Partial<T>)}
            isLoading={isSaving}
            className="bg-[var(--crud-accent)] hover:bg-[var(--crud-accent-hover)] text-white font-semibold h-11 px-6 rounded-[10px] shadow-sm hover:shadow transition-shadow focus-visible:ring-2 focus-visible:ring-[var(--crud-accent)]/40"
          >
            {isEdit ? "Actualizar" : "Crear"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

/**
 * Factory: devuelve un componente pre-configurado para usar como `FormComponent` en GenericCrud.
 *
 * @example
 * const MarcaForm = createSimpleEntityForm<Marca>({
 *   entityName: "Marca",
 *   entityArticle: "la marca",
 *   descriptionPlaceholder: "Nombre de la marca",
 * });
 */
export function createSimpleEntityForm<T extends SimpleEntity>(
  config: SimpleEntityFormConfig,
) {
  function ConfiguredSimpleEntityForm(props: GenericFormProps<T>) {
    return <SimpleEntityForm<T> {...props} {...config} />;
  }
  ConfiguredSimpleEntityForm.displayName = `SimpleEntityForm(${config.entityName})`;
  return ConfiguredSimpleEntityForm;
}
