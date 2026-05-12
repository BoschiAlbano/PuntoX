"use client";

/**
 * Panel de detalle para modales renderRowPreview.
 * Envuelve múltiples <DetailField> con el espaciado estándar.
 *
 * @example
 * renderRowPreview={(item) => (
 *   <DetailPanel>
 *     <DetailField label="Descripción">{item.Descripcion}</DetailField>
 *     <DetailField label="Estado"><StatusBadge estaEliminado={item.EstaEliminado} /></DetailField>
 *   </DetailPanel>
 * )}
 */

interface DetailPanelProps {
  children: React.ReactNode;
  className?: string;
}

export default function DetailPanel({ children, className }: DetailPanelProps) {
  return (
    <div className={`space-y-4 text-sm${className ? ` ${className}` : ""}`}>
      {children}
    </div>
  );
}
