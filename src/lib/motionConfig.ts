/**
 * Configuración de animaciones para modales.
 *
 * Usa translateY (GPU compositor-only) con curva iOS para una entrada
 * fluida de abajo hacia arriba. Compatible con el patrón bottom-sheet
 * responsive: en mobile los modales se abren desde abajo, en desktop
 * se centran.
 *
 * Patrón bottom-sheet (agregar al Modal):
 *   classNames={{
 *     wrapper: "items-end sm:items-center",
 *     base: "rounded-t-2xl rounded-b-none sm:rounded-2xl w-full sm:w-auto m-0 sm:m-auto",
 *   }}
 *
 * Uso:
 *   import { modalMotionProps } from "@/lib/motionConfig";
 *   <Modal motionProps={modalMotionProps} ...>
 *
 * NOTA: Se usan valores directos en lugar de variantes nombradas para evitar
 * conflictos con el sistema de variantes interno de HeroUI v2 ("enter"/"exit").
 * En framer-motion v12 + HeroUI v2 el contexto de variantes del padre puede
 * sobreescribir las variantes personalizadas si comparten el mismo nombre.
 */

import type { HTMLMotionProps } from "framer-motion";

export const modalMotionProps: HTMLMotionProps<"section"> = {
  initial: { y: 60, opacity: 0, scale: 0.98 },
  animate: {
    y: 0,
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3, ease: [0.32, 0.72, 0, 1] }, // Curva iOS spring-like
  },
  exit: {
    y: 40,
    opacity: 0,
    scale: 0.98,
    transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
  },
};
