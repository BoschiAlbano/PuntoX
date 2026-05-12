"use client";

import { createSimpleEntityForm } from "@/components/shared/SimpleEntityForm";
import { GenericFormProps } from "@/components/shared/GenericCrud";

export interface Marca {
  Id: number;
  Descripcion: string;
  EstaEliminado: boolean;
  /** Cantidad de productos asociados (solo lectura, viene del API) */
  CantidadProductos?: number;
}

const MarcaGenericForm = createSimpleEntityForm<Marca>({
  entityName: "Marca",
  entityArticle: "la marca",
  newLabel: "Nueva Marca",
  editLabel: "Editar Marca",
  descriptionPlaceholder: "Nombre de la marca",
  switchActiveLabel: "Marca Activa",
  switchInactiveLabel: "Marca Inactiva",
});

export default MarcaGenericForm;
export type MarcaFormProps = GenericFormProps<Marca>;
