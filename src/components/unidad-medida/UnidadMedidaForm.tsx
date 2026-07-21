"use client";

import { createSimpleEntityForm } from "@/components/shared/SimpleEntityForm";
import { GenericFormProps } from "@/components/shared/GenericCrud";

export interface UnidadMedida {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
  CantidadProductos?: number;
}

const UnidadMedidaGenericForm = createSimpleEntityForm<UnidadMedida>({
  entityName: "Unidad de Medida",
  entityArticle: "la unidad de medida",
  newLabel: "Nueva Unidad de Medida",
  editLabel: "Editar Unidad de Medida",
  descriptionPlaceholder: "Nombre de la unidad de medida",
  switchActiveLabel: "Unidad de Medida Activa",
  switchInactiveLabel: "Unidad de Medida Inactiva",
});

export default UnidadMedidaGenericForm;
export type UnidadMedidaFormProps = GenericFormProps<UnidadMedida>;
