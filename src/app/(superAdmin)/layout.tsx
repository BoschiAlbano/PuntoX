import { requireSuperAdminServer } from "@/lib/requireSuperAdmin";

/**
 * Layout que protege todas las rutas de /admin
 * Solo los SuperAdmin pueden acceder
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Verificar que el usuario es SuperAdmin
  // Si no lo es, requireSuperAdmin redirige automáticamente
  await requireSuperAdminServer({
    redirectUrl: "/signin",
  });

  return <>{children}</>;
}
