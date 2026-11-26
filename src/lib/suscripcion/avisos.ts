/**
 * Avisos de vencimiento de la suscripción (email + notificación in-app) a los
 * administradores de cada comercio. Lo ejecuta el cron /api/cron/suscripciones.
 *
 * - Una etapa por tenant y por fecha de vencimiento: si se renueva, la fecha
 *   cambia y arranca un ciclo nuevo de avisos.
 * - La notificación in-app hace de registro: si ya existe para la etapa, no se
 *   vuelve a avisar (aunque esté leída).
 */
import prisma from "@/DB/prisma";
import { sendEmail } from "@/lib/email/send";
import { destinatariosAdministradores } from "@/lib/email/destinatarios";
import { escapeHtml, renderEmailLayout } from "@/lib/email/layout";
import {
  DIAS_MAX_AVISO_VENCIDO,
  DIAS_PRIMER_AVISO,
  type EtapaAviso,
  diasHastaVencimiento,
  etapaAviso,
  fechaArgentina,
  formatearFecha,
  urlRenovacionWhatsapp,
} from "./vencimiento";

export const ENTIDAD_TIPO_AVISO = "SUSCRIPCION_VENCIMIENTO";
const MS_POR_DIA = 24 * 60 * 60 * 1000;

export interface ResultadoAviso {
  tenantId: string;
  etapa: EtapaAviso;
  destinatarios: number;
  email: "enviado" | "omitido" | "error";
}

export interface ResumenAvisos {
  revisados: number;
  avisos: ResultadoAviso[];
}

interface TenantAviso {
  Id: bigint;
  Nombre: string;
  FechaVencimiento: Date;
  Plan: { Nombre: string } | null;
}

/** Asunto, título y textos del aviso según la etapa. */
export function contenidoAviso(
  etapa: EtapaAviso,
  tenant: Pick<TenantAviso, "Nombre" | "FechaVencimiento" | "Plan">,
  dias: number,
) {
  const fecha = formatearFecha(tenant.FechaVencimiento);
  const comercio = tenant.Nombre;
  const plan = tenant.Plan?.Nombre;
  const delPlan = plan ? ` (${plan})` : "";

  switch (etapa) {
    case "7d":
      return {
        asunto: `Tu suscripción a PuntoX vence el ${fecha}`,
        titulo: `Tu suscripción vence en ${dias} días`,
        mensaje: `La suscripción de "${comercio}"${delPlan} vence el ${fecha}. Renovala antes para seguir usando PuntoX sin interrupciones.`,
      };
    case "1d":
      return {
        asunto: "Tu suscripción a PuntoX vence mañana",
        titulo: "Tu suscripción vence mañana",
        mensaje: `La suscripción de "${comercio}"${delPlan} vence mañana, ${fecha}. Renovala hoy para seguir usando PuntoX sin interrupciones.`,
      };
    case "vencido":
      return {
        asunto: "Tu suscripción a PuntoX venció",
        titulo: "Tu suscripción venció",
        mensaje: `La suscripción de "${comercio}"${delPlan} venció el ${fecha}. Renovala para mantener el servicio de PuntoX.`,
      };
  }
}

function renderEmailAviso(
  contenido: ReturnType<typeof contenidoAviso>,
  urlWhatsapp: string | null,
) {
  const html = renderEmailLayout({
    preheader: contenido.mensaje,
    titulo: contenido.titulo,
    parrafosHtml: [escapeHtml(contenido.mensaje)],
    cta: urlWhatsapp
      ? { label: "Renovar por WhatsApp", url: urlWhatsapp }
      : undefined,
    notas: urlWhatsapp
      ? ["Te respondemos por WhatsApp para coordinar la renovación."]
      : ["Contactá a PuntoX para coordinar la renovación."],
  });
  const text = [
    contenido.titulo,
    "",
    contenido.mensaje,
    "",
    urlWhatsapp
      ? `Renovar por WhatsApp: ${urlWhatsapp}`
      : "Contactá a PuntoX para coordinar la renovación.",
  ].join("\n");
  return { html, text };
}

export async function procesarAvisosVencimiento(
  ahora: Date = new Date(),
): Promise<ResumenAvisos> {
  // Ventana amplia (+/- 1 día de margen por zona horaria); la etapa exacta
  // se calcula por fecha calendario argentina.
  const desde = new Date(ahora.getTime() - (DIAS_MAX_AVISO_VENCIDO + 1) * MS_POR_DIA);
  const hasta = new Date(ahora.getTime() + (DIAS_PRIMER_AVISO + 1) * MS_POR_DIA);

  const tenants = (await prisma.tenant.findMany({
    where: {
      EstaActivo: true,
      EstaEliminado: false,
      FechaVencimiento: { gte: desde, lte: hasta },
    },
    select: {
      Id: true,
      Nombre: true,
      FechaVencimiento: true,
      Plan: { select: { Nombre: true } },
    },
  })) as TenantAviso[];

  const avisos: ResultadoAviso[] = [];

  for (const tenant of tenants) {
    const dias = diasHastaVencimiento(tenant.FechaVencimiento, ahora);
    const etapa = etapaAviso(dias);
    if (!etapa) continue;

    const entidadId = `${tenant.Id}:${fechaArgentina(tenant.FechaVencimiento)}:${etapa}`;
    const yaAvisado = await prisma.notificacion.findFirst({
      where: { EntidadTipo: ENTIDAD_TIPO_AVISO, EntidadId: entidadId },
      select: { Id: true },
    });
    if (yaAvisado) continue;

    const { adminIds, emails } = await destinatariosAdministradores(tenant.Id);
    const contenido = contenidoAviso(etapa, tenant, dias);
    const urlWhatsapp = urlRenovacionWhatsapp(tenant.Nombre);

    let estadoEmail: ResultadoAviso["email"] = "omitido";
    if (emails.length > 0) {
      const { html, text } = renderEmailAviso(contenido, urlWhatsapp);
      const res = await sendEmail({ to: emails, subject: contenido.asunto, html, text });
      if (res.ok) estadoEmail = "enviado";
      else if (!res.skipped) {
        estadoEmail = "error";
        console.error(`[avisos-vencimiento] Tenant ${tenant.Id}:`, res.error);
      }
    }

    // Notificación in-app para cada administrador (o general si no hay).
    const usuarios: (bigint | null)[] = adminIds.length > 0 ? adminIds : [null];
    await prisma.notificacion.createMany({
      data: usuarios.map((usuarioId) => ({
        TenantId: tenant.Id,
        UsuarioId: usuarioId,
        Tipo: etapa === "vencido" ? "ERROR" : "WARNING",
        Titulo: contenido.titulo,
        Mensaje: contenido.mensaje.slice(0, 500),
        EntidadTipo: ENTIDAD_TIPO_AVISO,
        EntidadId: entidadId,
      })),
    });

    avisos.push({
      tenantId: tenant.Id.toString(),
      etapa,
      destinatarios: emails.length,
      email: estadoEmail,
    });
  }

  return { revisados: tenants.length, avisos };
}
