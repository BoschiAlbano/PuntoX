"use client";

import React from "react";
import { motion } from "framer-motion";

interface PageHeaderProps {
  /** Texto principal del título */
  title: string;
  /** Texto con degradado acentuado */
  accentTitle?: string;
  /** Descripción secundaria */
  description?: string;
  /** Contenido a renderizar a la derecha del header */
  actions?: React.ReactNode;
}

export function PageHeader({
  title,
  accentTitle,
  description,
  actions,
}: PageHeaderProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex items-center justify-between gap-x-3 gap-y-2 flex-wrap px-4 sm:px-6 pt-3 sm:pt-4 shrink-0"
    >
      <div className="flex flex-col">
        <h1 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight">
          {title}{" "}
          {accentTitle && (
            <span className="text-transparent bg-clip-text bg-linear-to-r from-[#67afc3] to-[#2dd4bf]">
              {accentTitle}
            </span>
          )}
        </h1>
        {description && (
          <p className="text-slate-400 text-[11px] sm:text-xs leading-tight ">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
}
