import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { prisma } from "@/lib/prisma";

export async function requireSuperAdmin() {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
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
    redirect("/signin");
  }

  const isSuperAdmin = dbUser.PerfilUsuario.some(
    (pu) => pu.Perfiles.Descripcion === "SuperAdmin"
  );

  if (!isSuperAdmin) {
    redirect("/");
  }

  return {
    authUser: user,
    dbUser,
  };
}
