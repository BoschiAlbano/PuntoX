"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, MessageCircle, X } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";
import {
  DIAS_PRIMER_AVISO,
  describirVencimiento,
  diasHastaVencimiento,
  fechaArgentina,
  urlRenovacionWhatsapp,
} from "@/lib/suscripcion/vencimiento";

/**
 * Aviso de vencimiento de la suscripción para administradores del comercio.
 * Se muestra desde DIAS_PRIMER_AVISO días antes y después de vencida.
 * Solo informa: el sistema no se bloquea al vencer.
 */
export default function SuscripcionBanner() {
  const { tenant, isAdministrador } = useUserStore();
  const [oculto, setOculto] = useState(true);

  const vencimiento = tenant?.FechaVencimiento
    ? new Date(tenant.FechaVencimiento)
    : null;
  const ahora = new Date();
  const dias = vencimiento ? diasHastaVencimiento(vencimiento, ahora) : null;
  const visible =
    isAdministrador && dias !== null && dias <= DIAS_PRIMER_AVISO;

  // Ocultable hasta el día siguiente (por comercio).
  const claveOculto = `banner_suscripcion_${tenant?.Id}_${fechaArgentina(ahora)}`;
  useEffect(() => {
    setOculto(localStorage.getItem(claveOculto) === "1");
  }, [claveOculto]);

  if (!visible || oculto || !vencimiento) return null;

  const vencido = dias! < 0;
  const urlWhatsapp = urlRenovacionWhatsapp(tenant?.Nombre ?? "");
  const estilos = vencido
    ? "border-red-200 bg-red-50 text-red-900"
    : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <div
      role="status"
      className={`mx-3 mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border px-4 py-2.5 text-sm sm:mx-4 print:hidden ${estilos}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2.5">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
        <p className="min-w-0">
          <span className="font-semibold">
            Tu suscripción {describirVencimiento(vencimiento, ahora)}.
          </span>{" "}
          {vencido
            ? "Renovala para mantener el servicio."
            : "Renovala para seguir usando PuntoX sin interrupciones."}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {urlWhatsapp && (
          <a
            href={urlWhatsapp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0050cb] px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#0043ab] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0050cb]/40"
          >
            <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
            Renovar por WhatsApp
          </a>
        )}
        <button
          type="button"
          onClick={() => {
            localStorage.setItem(claveOculto, "1");
            setOculto(true);
          }}
          className="rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-current"
          aria-label="Ocultar aviso hasta mañana"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
