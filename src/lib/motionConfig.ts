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
 */

import type { HTMLMotionProps } from "framer-motion";

export const modalMotionProps: HTMLMotionProps<"section"> = {
  variants: {
    enter: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0.32, 0.72, 0, 1], // Curva iOS spring-like
      },
    },
    exit: {
      y: 50,
      opacity: 0,
      transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
    },
  },
  initial: "exit",
  animate: "enter",
  exit: "exit",
};
