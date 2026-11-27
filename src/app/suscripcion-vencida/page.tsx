"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2, LogOut, MessageCircle } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { clearAllClientState, getStoredSesionId } from "@/lib/auth/clearClientState";
import { formatearFecha, urlRenovacionWhatsapp } from "@/lib/suscripcion/vencimiento";

type Estado = {
  comercio: string;
  estado: "activa" | "por_vencer" | "en_gracia" | "vencida" | "desactivada";
  bloqueada: boolean;
  fechaVencimiento: string | null;
};

/**
 * Pantalla para comercios con la suscripción vencida (pasada la semana de
 * gracia) o desactivados. Todo el resto de la API responde 403 hasta que el
 * superadmin renueva; el usuario llega acá desde el dashboard o el heartbeat.
 */
export default function SuscripcionVencidaPage() {
  const [datos, setDatos] = useState<Estado | null>(null);
  const [error, setError] = useState(false);
  const [saliendo, setSaliendo] = useState(false);

  useEffect(() => {
    fetch("/api/suscripcion/estado", { cache: "no-store" })
      .then(async (res) => {
        if (!res.ok) throw new Error(String(res.status));
        setDatos(await res.json());
      })
      .catch(() => setError(true));
  }, []);

  const cerrarSesion = async () => {
    setSaliendo(true);
    const sesionId = getStoredSesionId();
    await fetch(
      sesionId ? `/api/auth/registrar-sesion?sesionId=${sesionId}` : "/api/auth/registrar-sesion",
      { method: "DELETE", credentials: "include" },
    ).catch(() => {});
    clearAllClientState();
    await getSupabaseBrowserClient().auth.signOut({ scope: "local" });
    window.location.replace("/signin");
  };

  const urlWhatsapp = datos ? urlRenovacionWhatsapp(datos.comercio) : null;
  const vencio = datos?.fechaVencimiento ? formatearFecha(new Date(datos.fechaVencimiento)) : null;

  let titulo = "";
  let mensaje = "";
  if (datos?.estado === "desactivada") {
    titulo = "Comercio desactivado";
    mensaje = `"${datos.comercio}" está desactivado. Contactá a PuntoX para reactivarlo.`;
  } else if (datos?.bloqueada) {
    titulo = "Suscripción vencida";
    mensaje = `La suscripción de "${datos.comercio}"${vencio ? ` venció el ${vencio}` : " está vencida"}. Tus datos están guardados: renovala para volver a usar PuntoX.`;
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4">
      <section className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Image
          src="/brand/puntox-isotipo.png"
          alt="PuntoX"
          width={56}
          height={56}
          className="mx-auto mb-5 h-14 w-14 object-contain"
        />

        {!datos && !error && (
          <Loader2 className="mx-auto h-6 w-6 animate-spin text-slate-400" aria-label="Cargando" />
        )}

        {error && (
          <>
            <h1 className="text-xl font-bold text-slate-900">No pudimos verificar tu suscripción</h1>
            <p className="mt-2 text-sm text-slate-600">Volvé a iniciar sesión para continuar.</p>
            <Link
              href="/signin"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0052cc]"
            >
              Ir a iniciar sesión
            </Link>
          </>
        )}

        {datos && !datos.bloqueada && (
          <>
            <h1 className="text-xl font-bold text-slate-900">Tu suscripción está activa</h1>
            <p className="mt-2 text-sm text-slate-600">Ya podés volver a usar PuntoX.</p>
            <a
              href="/dashboard"
              className="mt-6 inline-flex w-full items-center justify-center rounded-lg bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0052cc]"
            >
              Ir al sistema
            </a>
          </>
        )}

        {datos?.bloqueada && (
          <>
            <h1 className="text-xl font-bold text-slate-900">{titulo}</h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">{mensaje}</p>
            <div className="mt-6 space-y-2">
              {urlWhatsapp && (
                <a
                  href={urlWhatsapp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#0066FF] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0052cc]"
                >
                  <MessageCircle className="h-4 w-4" aria-hidden="true" />
                  {datos.estado === "desactivada" ? "Contactar por WhatsApp" : "Renovar por WhatsApp"}
                </a>
              )}
              <button
                type="button"
                onClick={cerrarSesion}
                disabled={saliendo}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Cerrar sesión
              </button>
            </div>
            <p className="mt-5 text-xs text-slate-500">
              Cuando se registre el pago, el acceso vuelve en menos de un minuto.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
