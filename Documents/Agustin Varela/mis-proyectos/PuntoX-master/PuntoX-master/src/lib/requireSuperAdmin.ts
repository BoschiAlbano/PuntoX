import { redirect } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import prisma from "@/DB/prisma";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { PerfilTipo } from "../../prisma/generated/prisma";

export async function requireSuperAdminServer({
  redirectUrl = "/",
}: {
  redirectUrl?: string;
}) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(redirectUrl);
  }

  const dbUser = await prisma.usuario.findUnique({
    where: { AuthUserId: user.id },
    include: {
      PerfilUsuario: {
        include: { Perfiles: true },
      },
    },
  });

  if (!dbUser) {
    redirect(redirectUrl);
  }

  const isSuperAdmin = dbUser.PerfilUsuario.some(
    (pu) => pu.Perfiles.Tipo === PerfilTipo.SUPERADMIN
  );

  if (!isSuperAdmin) {
    redirect(redirectUrl);
  }

  return {
    authUser: user,
    dbUser,
  };
}

export async function requireAuthServer({
  redirectUrl = "/",
}: {
  redirectUrl?: string;
}) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(redirectUrl);
  }
}

export async function requireAuthCliente({
  redirectUrl = "/",
}: {
  redirectUrl?: string;
}) {
  const supabase = await getSupabaseBrowserClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(redirectUrl);
  }
}

export async function NorequireAuthServer({
  redirectUrl = "/",
}: {
  redirectUrl?: string;
}) {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect(redirectUrl);
  }
}
