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
    const { data: mfaData } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    
    // Si el usuario tiene 2FA activado pero no lo ha validado
    if (mfaData?.nextLevel === "aal2" && mfaData?.currentLevel === "aal1") {
      // Necesitamos importar cookies al principio del archivo si lo vamos a usar
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      const hasTrustedToken = cookieStore.has("trusted_device_token");
      
      // Si NO es confiable, lo dejamos en la página de login para que complete el 2FA
      if (!hasTrustedToken) {
        return;
      }
    }

    redirect(redirectUrl);
  }
}
