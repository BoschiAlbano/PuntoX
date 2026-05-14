/**
 * Paleta de colores pastel compartida.
 * Usar en notificaciones, badges de estado e iconos de acciones de tablas.
 *
 * Ejemplo en una tabla:
 *   import { actionColors } from "@/lib/ui/colors";
 *   <Pencil className={actionColors.edit} size={16} />
 *
 * Ejemplo en notificaciones:
 *   import { statusColors } from "@/lib/ui/colors";
 *   const c = statusColors[notif.Tipo] ?? statusColors.INFO;
 *   <div className={`rounded-full p-2 ${c.iconBg}`}>
 *     <SomeIcon className={c.iconText} size={16} />
 *   </div>
 */

// ---------------------------------------------------------------------------
// Estado / tipo de notificación
// ---------------------------------------------------------------------------
export const statusColors = {
  SUCCESS: {
    iconBg: "bg-green-100",
    iconText: "text-green-600",
    rowBg: "bg-green-50/60",
    border: "border-green-200",
    dot: "bg-green-500",
  },
  WARNING: {
    iconBg: "bg-amber-100",
    iconText: "text-amber-600",
    rowBg: "bg-amber-50/60",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  ERROR: {
    iconBg: "bg-rose-100",
    iconText: "text-rose-600",
    rowBg: "bg-rose-50/60",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
  INFO: {
    iconBg: "bg-sky-100",
    iconText: "text-sky-600",
    rowBg: "bg-sky-50/60",
    border: "border-sky-200",
    dot: "bg-sky-500",
  },
} as const;

export type StatusType = keyof typeof statusColors;

// ---------------------------------------------------------------------------
// Iconos de acciones en tablas (Más opciones / botones inline)
// ---------------------------------------------------------------------------
export const actionColors = {
  // CRUD principal
  edit: "text-sky-500 hover:text-sky-600",
  delete: "text-rose-500 hover:text-rose-600",
  view: "text-violet-500 hover:text-violet-600",
  add: "text-emerald-500 hover:text-emerald-600",

  // Estado / semáforo
  success: "text-green-500 hover:text-green-600",
  warning: "text-amber-500 hover:text-amber-600",
  danger: "text-rose-500 hover:text-rose-600",
  info: "text-sky-500 hover:text-sky-600",

  // Acciones extra
  export: "text-teal-500 hover:text-teal-600",
  import: "text-indigo-500 hover:text-indigo-600",
  print: "text-slate-500 hover:text-slate-600",
  send: "text-cyan-500 hover:text-cyan-600",
  lock: "text-orange-500 hover:text-orange-600",
  unlock: "text-emerald-500 hover:text-emerald-600",
} as const;

export type ActionColor = keyof typeof actionColors;
