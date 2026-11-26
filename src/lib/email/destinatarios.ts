/**
 * Destinatarios de los emails operativos de un comercio: los usuarios con
 * perfil ADMINISTRADOR (activos, no bloqueados) con email real. Si ninguno
 * tiene email real, se usa el email del comercio (Configuración).
 */
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { esEmailInterno } from "@/lib/auth/generateInternalEmail";

export interface DestinatariosAdmin {
  /** Ids de Usuario de los administradores (para notificaciones in-app). */
  adminIds: bigint[];
  /** Emails reales, en minúscula y sin duplicados. */
  emails: string[];
}

export async function destinatariosAdministradores(
  tenantId: bigint,
): Promise<DestinatariosAdmin> {
  const admins = await prisma.usuario.findMany({
    where: {
      TenantId: tenantId,
      EstaEliminado: false,
      EstaBloqueado: false,
      PerfilUsuario: {
        some: { Perfiles: { Tipo: "ADMINISTRADOR", EstaEliminado: false } },
      },
    },
    select: { Id: true, AuthUserId: true },
  });

  const supabase = getSupabaseServiceClient();
  const emails = new Set<string>();
  for (const admin of admins) {
    const { data } = await supabase.auth.admin.getUserById(admin.AuthUserId);
    const email = data?.user?.email?.toLowerCase();
    if (email && !esEmailInterno(email)) emails.add(email);
  }

  if (emails.size === 0) {
    const config = await prisma.configuracion.findFirst({
      where: { TenantId: tenantId, EstaEliminado: false },
      orderBy: { Id: "desc" }, // misma fila que usa Configuración
      select: { Email: true },
    });
    const email = config?.Email?.trim().toLowerCase();
    if (email && !esEmailInterno(email)) emails.add(email);
  }

  return { adminIds: admins.map((a) => a.Id), emails: [...emails] };
}
