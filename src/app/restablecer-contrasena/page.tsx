import type { Metadata } from "next";
import { AuthSimpleShell } from "@/components/auth/AuthSimpleShell";
import RestablecerContrasenaForm from "@/components/auth/RestablecerContrasenaForm";

export const metadata: Metadata = {
  title: "Elegir contraseña nueva | PuntoX",
  robots: { index: false },
};

/**
 * Fuera del grupo (auth): su layout redirige a /dashboard a quien tenga
 * sesión, y aquí se llega con la sesión temporal creada por /auth/confirm.
 */
export default function RestablecerContrasenaPage() {
  return (
    <AuthSimpleShell
      title="Elegí tu contraseña nueva"
      subtitle="Al guardarla se cierran todas tus sesiones abiertas y vas a iniciar sesión con la contraseña nueva."
    >
      <RestablecerContrasenaForm />
    </AuthSimpleShell>
  );
}
