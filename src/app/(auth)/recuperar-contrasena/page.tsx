import type { Metadata } from "next";
import { AuthSimpleShell } from "@/components/auth/AuthSimpleShell";
import RecuperarContrasenaForm from "@/components/auth/RecuperarContrasenaForm";

export const metadata: Metadata = {
  title: "Recuperar contraseña | PuntoX",
  robots: { index: false },
};

export default function RecuperarContrasenaPage() {
  return (
    <AuthSimpleShell
      title="Recuperar contraseña"
      subtitle="Ingresá tu nombre de usuario y te enviamos un link al email de tu cuenta para elegir una contraseña nueva."
    >
      <RecuperarContrasenaForm />
    </AuthSimpleShell>
  );
}
