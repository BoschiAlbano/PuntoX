"use client";

/**
 * Campo de detalle con etiqueta y valor, para usar en renderRowPreview.
 * Reemplaza el patrón repetido:
 *   <div>
 *     <p className="text-slate-500 text-xs mb-0.5">Label</p>
 *     <p className="font-medium text-slate-800">Value</p>
 *   </div>
 *
 * @example
 * <DetailField label="Descripción">{item.Descripcion}</DetailField>
 * <DetailField label="Estado"><StatusBadge estaEliminado={item.EstaEliminado} /></DetailField>
 */

interface DetailFieldProps {
  label: string;
  children: React.ReactNode;
}

export default function DetailField({ label, children }: DetailFieldProps) {
  return (
    <div>
      <p className="text-slate-500 text-xs mb-0.5">{label}</p>
      <div className="font-medium text-slate-800">{children}</div>
    </div>
  );
}
