/**
 * Envío de emails propios de la app (no los de Supabase Auth) vía la API
 * REST de Resend. Variables de entorno:
 * - RESEND_API_KEY (obligatoria para enviar; sin ella el envío se omite)
 * - EMAIL_FROM (opcional, default "PuntoX <no-reply@mail.puntox.com.ar>")
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const DEFAULT_FROM = "PuntoX <no-reply@mail.puntox.com.ar>";

export interface SendEmailInput {
  to: string[];
  subject: string;
  html: string;
  text?: string;
}

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; skipped: true; reason: string }
  | { ok: false; skipped?: false; error: string };

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailInput): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("[email] RESEND_API_KEY no configurada: no se envía", subject);
    return { ok: false, skipped: true, reason: "RESEND_API_KEY no configurada" };
  }
  if (to.length === 0) {
    return { ok: false, skipped: true, reason: "Sin destinatarios" };
  }

  try {
    const res = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM || DEFAULT_FROM,
        to,
        subject,
        html,
        ...(text ? { text } : {}),
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error: data?.message || `Resend respondió ${res.status}`,
      };
    }
    return { ok: true, id: data?.id ?? "" };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Error de red",
    };
  }
}
