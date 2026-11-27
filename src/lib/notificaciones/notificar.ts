/**
 * Creación de notificaciones in-app dirigidas a usuarios puntuales o a los
 * administradores de un comercio. Nunca lanza: una notificación que no se
 * pudo crear no debe hacer fallar la operación que la originó.
 */
import prisma from "@/DB/prisma";

export type TipoNotificacion = "INFO" | "WARNING" | "ERROR" | "SUCCESS";

export interface DatosNotificacion {
  tipo: TipoNotificacion;
  titulo: string;
  mensaje: string;
  accionUrl?: string | null;
  /** Para deduplicar / agrupar (ej. "SEGURIDAD", "PLAN_LIMITE"). */
  entidadTipo?: string;
  entidadId?: string;
}

/** Ids de Usuario con perfil ADMINISTRADOR (activos) del comercio. */
export async function idsAdministradores(tenantId: bigint): Promise<bigint[]> {
  const admins = await prisma.usuario.findMany({
    where: {
      TenantId: tenantId,
      EstaEliminado: false,
      PerfilUsuario: {
        some: { Perfiles: { Tipo: "ADMINISTRADOR", EstaEliminado: false } },
      },
    },
    select: { Id: true },
  });
  return admins.map((a) => a.Id);
}

/** Crea una notificación para cada usuario indicado. */
export async function notificarUsuarios(
  tenantId: bigint,
  usuarioIds: bigint[],
  datos: DatosNotificacion,
): Promise<void> {
  const destinatarios = [...new Set(usuarioIds.map(String))].map(BigInt);
  if (destinatarios.length === 0) return;
  try {
    await prisma.notificacion.createMany({
      data: destinatarios.map((usuarioId) => ({
        TenantId: tenantId,
        UsuarioId: usuarioId,
        Tipo: datos.tipo,
        Titulo: datos.titulo.slice(0, 200),
        Mensaje: datos.mensaje.slice(0, 500),
        AccionUrl: datos.accionUrl ?? null,
        EntidadTipo: datos.entidadTipo ?? null,
        EntidadId: datos.entidadId ?? null,
      })),
    });
  } catch (error) {
    console.error("[notificar] No se pudo crear la notificación:", datos.titulo, error);
  }
}

/** Notifica a los administradores del comercio (opcionalmente excluyendo a algunos). */
export async function notificarAdministradores(
  tenantId: bigint,
  datos: DatosNotificacion,
  opciones: { excluir?: bigint[] } = {},
): Promise<void> {
  try {
    const excluir = new Set((opciones.excluir ?? []).map(String));
    const admins = (await idsAdministradores(tenantId)).filter(
      (id) => !excluir.has(String(id)),
    );
    await notificarUsuarios(tenantId, admins, datos);
  } catch (error) {
    console.error("[notificar] No se pudo notificar a los administradores:", error);
  }
}
