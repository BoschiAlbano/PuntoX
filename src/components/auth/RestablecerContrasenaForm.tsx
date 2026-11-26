"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browserClient";
import { authInputClass, authLabelClass, authSubmitClass } from "./AuthSimpleShell";

const MIN_LENGTH = 8;

type Paso = "cargando" | "sin-sesion" | "mfa" | "contrasena" | "guardando";

/** Traduce los errores de Supabase más comunes al cambiar la contraseña. */
function mensajeDeError(error: { code?: string; message?: string }): string {
  if (error.code === "same_password") {
    return "La contraseña nueva tiene que ser distinta de la anterior.";
  }
  if (error.code === "weak_password") {
    return "La contraseña es muy débil. Usá al menos 8 caracteres combinando letras y números.";
  }
  if (error.code === "session_expired" || error.code === "session_not_found") {
    return "La sesión de recuperación venció. Pedí un link nuevo.";
  }
  return "No se pudo cambiar la contraseña. Probá de nuevo.";
}

interface Props {
  /** "invitacion": primer ingreso de un empleado invitado. */
  modo?: "recuperacion" | "invitacion";
}

export default function RestablecerContrasenaForm({ modo = "recuperacion" }: Props) {
  const esInvitacion = modo === "invitacion";
  const [paso, setPaso] = useState<Paso>("cargando");
  const [username, setUsername] = useState("");
  const [factorId, setFactorId] = useState("");
  const [codigo, setCodigo] = useState("");
  const [password, setPassword] = useState("");
  const [confirmacion, setConfirmacion] = useState("");
  const [mostrar, setMostrar] = useState(false);
  const [error, setError] = useState("");

  // La sesión la crea /auth/confirm al validar el link del email.
  useEffect(() => {
    let cancelado = false;
    (async () => {
      const supabase = getSupabaseBrowserClient();
      const { data } = await supabase.auth.getSession();
      if (cancelado) return;
      if (!data.session) {
        setPaso("sin-sesion");
        return;
      }
      // El usuario invitado trae su nombre de usuario en user_metadata.
      const meta = data.session.user.user_metadata as { username?: string } | undefined;
      if (meta?.username) setUsername(meta.username);

      // Con 2FA activo, la recuperación no debe saltear el segundo factor.
      const { data: aal } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (cancelado) return;
      if (aal?.nextLevel === "aal2" && aal.currentLevel === "aal1") {
        const { data: factors } = await supabase.auth.mfa.listFactors();
        const totp = factors?.totp[0];
        if (totp) {
          setFactorId(totp.id);
          setPaso("mfa");
          return;
        }
      }
      setPaso("contrasena");
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  const verificarCodigo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(codigo)) {
      setError("El código debe tener 6 dígitos");
      return;
    }
    setError("");
    const { error: verifyError } =
      await getSupabaseBrowserClient().auth.mfa.challengeAndVerify({
        factorId,
        code: codigo,
      });
    if (verifyError) {
      setError("Código incorrecto o vencido. Probá de nuevo.");
      return;
    }
    setPaso("contrasena");
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < MIN_LENGTH) {
      setError(`La contraseña debe tener al menos ${MIN_LENGTH} caracteres`);
      return;
    }
    if (password !== confirmacion) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setError("");
    setPaso("guardando");
    const supabase = getSupabaseBrowserClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(mensajeDeError(updateError));
      setPaso("contrasena");
      return;
    }

    // Cierra todas las sesiones (incluida esta): quien tuviera la contraseña
    // anterior pierde el acceso. Se vuelve a entrar con la nueva.
    await supabase.auth.signOut({ scope: "global" }).catch(() => {});
    const reason = esInvitacion ? "cuenta_activada" : "password_reset";
    const q = username ? `&usuario=${encodeURIComponent(username)}` : "";
    window.location.replace(`/signin?reason=${reason}${q}`);
  };

  if (paso === "cargando") {
    return (
      <p className="text-sm text-landing-on-surface-variant" role="status">
        Verificando el link...
      </p>
    );
  }

  if (paso === "sin-sesion") {
    return (
      <div className="space-y-5">
        <div className="rounded-lg border border-landing-error/20 bg-landing-error-container p-3.5 text-sm text-landing-on-error-container">
          {esInvitacion
            ? "La invitación no es válida o ya venció. Pedile a quien te invitó que te la reenvíe."
            : "El link no es válido o ya venció."}
        </div>
        {!esInvitacion && (
          <Link
            href="/recuperar-contrasena"
            className={`${authSubmitClass} inline-flex items-center justify-center`}
          >
            Pedir un link nuevo
          </Link>
        )}
      </div>
    );
  }

  if (paso === "mfa") {
    return (
      <form onSubmit={verificarCodigo} className="space-y-5" noValidate>
        <div className="flex items-start gap-3 rounded-lg border border-landing-primary-container/20 bg-landing-primary-container/5 p-3.5">
          <ShieldCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-landing-primary"
            aria-hidden="true"
          />
          <p className="text-sm leading-relaxed text-landing-on-surface">
            Tu cuenta tiene verificación en dos pasos. Ingresá el código de tu
            app de autenticación para continuar.
          </p>
        </div>
        <div>
          <label htmlFor="codigo" className={authLabelClass}>
            Código de 6 dígitos
          </label>
          <input
            id="codigo"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={codigo}
            onChange={(e) => {
              setCodigo(e.target.value.replace(/\D/g, ""));
              setError("");
            }}
            className={`${authInputClass} text-center tracking-[0.4em]`}
            placeholder="000000"
            autoFocus
          />
        </div>
        {error && (
          <div className="rounded-lg border border-landing-error/20 bg-landing-error-container p-3.5 text-sm text-landing-on-error-container">
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={codigo.length !== 6}
          className={authSubmitClass}
        >
          Verificar código
        </button>
      </form>
    );
  }

  const guardando = paso === "guardando";

  return (
    <form onSubmit={guardar} className="space-y-5" noValidate>
      {username && (
        <div className="rounded-lg border border-landing-outline-variant/60 bg-landing-surface-low p-3.5 text-sm text-landing-on-surface">
          Tu usuario para ingresar es{" "}
          <strong className="font-semibold">{username}</strong>
        </div>
      )}
      <div>
        <label htmlFor="password" className={authLabelClass}>
          {esInvitacion ? "Contraseña" : "Contraseña nueva"}
        </label>
        <div className="relative">
          <input
            id="password"
            type={mostrar ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            disabled={guardando}
            className={`${authInputClass} pr-11`}
            placeholder="••••••••"
            autoComplete="new-password"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setMostrar((v) => !v)}
            className="absolute top-1/2 right-3 -translate-y-1/2 p-1.5 text-landing-outline transition-colors hover:text-landing-on-surface focus:outline-none"
            aria-label={mostrar ? "Ocultar contraseña" : "Mostrar contraseña"}
          >
            {mostrar ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <p className="mt-1.5 text-xs text-landing-on-surface-variant">
          Mínimo {MIN_LENGTH} caracteres.
        </p>
      </div>

      <div>
        <label htmlFor="confirmacion" className={authLabelClass}>
          Repetí la contraseña
        </label>
        <input
          id="confirmacion"
          type={mostrar ? "text" : "password"}
          value={confirmacion}
          onChange={(e) => {
            setConfirmacion(e.target.value);
            setError("");
          }}
          disabled={guardando}
          className={authInputClass}
          placeholder="••••••••"
          autoComplete="new-password"
        />
      </div>

      {error && (
        <div className="rounded-lg border border-landing-error/20 bg-landing-error-container p-3.5 text-sm text-landing-on-error-container">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={guardando || !password || !confirmacion}
        className={authSubmitClass}
      >
        {guardando
          ? "Guardando..."
          : esInvitacion
            ? "Crear contraseña"
            : "Guardar contraseña"}
      </button>
    </form>
  );
}
