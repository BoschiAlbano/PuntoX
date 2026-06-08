import { requireSuperAdminServer } from "@/lib/requireSuperAdmin";
import AdminShell from "./AdminShell";

/**
 * Layout que protege todas las rutas de /admin
 * Solo los SuperAdmin pueden acceder.
 * La verificación de auth corre en el server; el shell visual es client.
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

  return <AdminShell>{children}</AdminShell>;
}
