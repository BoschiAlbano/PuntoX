"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MailCheck } from "lucide-react";
import { authInputClass, authLabelClass, authSubmitClass } from "./AuthSimpleShell";

type Estado = "idle" | "enviando" | "enviado";

export default function RecuperarContrasenaForm() {
  const searchParams = useSearchParams();
  const linkInvalido = searchParams.get("error") === "link_invalido";

  const [username, setUsername] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = username.trim();
    if (valor.length < 2) {
      setError("Ingresá tu nombre de usuario");
      return;
    }

    setEstado("enviando");
    setError("");
    try {
      const res = await fetch("/api/auth/recuperar-contrasena", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: valor }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "No se pudo procesar el pedido");
      }
      setEstado("enviado");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo procesar el pedido. Probá de nuevo.",
      );
      setEstado("idle");
    }
  };

  if (estado === "enviado") {
    return (
      <div className="space-y-5" role="status">
        <div className="flex items-start gap-3 rounded-lg border border-landing-primary-container/20 bg-landing-primary-container/5 p-4">
          <MailCheck
            className="mt-0.5 h-5 w-5 shrink-0 text-landing-primary"
            aria-hidden="true"
          />
          <div className="space-y-2 text-sm leading-relaxed text-landing-on-surface">
            <p>
              Si el usuario existe y tiene un email registrado, te enviamos un
              link para elegir una contraseña nueva.
            </p>
            <p className="text-landing-on-surface-variant">
              Revisá tu bandeja de entrada y la carpeta de spam. El link vence
              pronto y sirve una sola vez.
            </p>
          </div>
        </div>
        <p className="text-xs leading-relaxed text-landing-on-surface-variant">
          ¿No te llegó? Si tu usuario no tiene un email registrado, pedile al
          administrador de tu comercio que te cambie la contraseña.
        </p>
        <Link
          href="/signin"
          className={`${authSubmitClass} inline-flex items-center justify-center`}
        >
          Volver a iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {linkInvalido && (
        <div className="rounded-lg border border-landing-error/20 bg-landing-error-container p-3.5 text-sm text-landing-on-error-container">
          El link no es válido o ya venció. Pedí uno nuevo.
        </div>
      )}

      <div>
        <label htmlFor="username" className={authLabelClass}>
          Nombre de usuario
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError("");
          }}
          disabled={estado === "enviando"}
          className={authInputClass}
          placeholder="juan"
          autoComplete="username"
          autoFocus
          required
        />
      </div>

      {error && (
        <div className="rounded-lg border border-landing-error/20 bg-landing-error-container p-3.5 text-sm text-landing-on-error-container">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={estado === "enviando"}
        className={authSubmitClass}
      >
        {estado === "enviando" ? "Enviando..." : "Enviar link de recuperación"}
      </button>
    </form>
  );
}
