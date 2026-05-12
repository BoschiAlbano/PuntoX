"use client";

import { createSimpleEntityForm } from "@/components/shared/SimpleEntityForm";
import { GenericFormProps } from "@/components/shared/GenericCrud";

export interface Rubro {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
}

const RubroGenericForm = createSimpleEntityForm<Rubro>({
  entityName: "Rubro",
  entityArticle: "el rubro",
  newLabel: "Nuevo Rubro",
  editLabel: "Editar Rubro",
  descriptionPlaceholder: "Nombre del rubro",
  switchActiveLabel: "Rubro Activo",
  switchInactiveLabel: "Rubro Inactivo",
});

export default RubroGenericForm;
export type RubroFormProps = GenericFormProps<Rubro>;
