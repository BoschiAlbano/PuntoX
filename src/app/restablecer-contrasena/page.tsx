import type { Metadata } from "next";
import { AuthSimpleShell } from "@/components/auth/AuthSimpleShell";
import RestablecerContrasenaForm from "@/components/auth/RestablecerContrasenaForm";

export const metadata: Metadata = {
  title: "Elegir contraseña | PuntoX",
  robots: { index: false },
};

/**
 * Fuera del grupo (auth): su layout redirige a /dashboard a quien tenga
 * sesión, y aquí se llega con la sesión temporal creada por /auth/confirm.
 *
 * ?modo=invitacion → un empleado invitado crea su primera contraseña.
 * Sin modo        → recuperación de contraseña.
 */
export default async function RestablecerContrasenaPage({
  searchParams,
}: {
  searchParams: Promise<{ modo?: string }>;
}) {
  const { modo } = await searchParams;
  const esInvitacion = modo === "invitacion";

  return (
    <AuthSimpleShell
      title={esInvitacion ? "Creá tu contraseña" : "Elegí tu contraseña nueva"}
      subtitle={
        esInvitacion
          ? "Bienvenido a PuntoX. Elegí la contraseña con la que vas a ingresar."
          : "Al guardarla se cierran todas tus sesiones abiertas y vas a iniciar sesión con la contraseña nueva."
      }
    >
      <RestablecerContrasenaForm modo={esInvitacion ? "invitacion" : "recuperacion"} />
    </AuthSimpleShell>
  );
}
