/**
 * Límite de pedidos (rate limiting) para rutas públicas, guardado en Postgres
 * (tabla "RateLimit") para que funcione igual en todas las instancias de
 * Vercel. Ventana fija: cada clave cuenta pedidos durante `ventanaSeg`
 * segundos desde el primero; al vencer, el contador vuelve a 1.
 *
 * Si la base falla, el pedido se permite ("fail open"): un problema del
 * contador nunca debe impedir iniciar sesión.
 */
import { createHash } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import prisma from "@/DB/prisma";

export interface ReglaLimite {
  /** Identifica la regla, ej. "recuperar:ip". */
  nombre: string;
  /** Pedidos permitidos por ventana. */
  limite: number;
  /** Duración de la ventana en segundos. */
  ventanaSeg: number;
}

export type ResultadoLimite =
  | { ok: true; restantes: number }
  | { ok: false; reintentarEnSeg: number };

/** IP del cliente según los headers de Vercel / proxies. */
export function ipDelCliente(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip")?.trim() || "desconocida";
}

/** No se guarda el valor original (IP, usuario): solo un hash. */
function hash(valor: string): string {
  return createHash("sha256").update(valor).digest("hex").slice(0, 32);
}

const claveDe = (regla: ReglaLimite, valor: string) =>
  `${regla.nombre}:${hash(valor.toLowerCase())}`;

/** Suma un pedido a la clave `regla.nombre + valor` y dice si está permitido. */
export async function consumirLimite(
  regla: ReglaLimite,
  valor: string,
): Promise<ResultadoLimite> {
  const clave = claveDe(regla, valor);
  try {
    const filas = await prisma.$queryRaw<{ conteo: number; restan: number }[]>`
      INSERT INTO "RateLimit" ("Clave", "VentanaInicio", "Conteo")
      VALUES (${clave}, now(), 1)
      ON CONFLICT ("Clave") DO UPDATE SET
        "Conteo" = CASE
          WHEN "RateLimit"."VentanaInicio" <= now() - make_interval(secs => ${regla.ventanaSeg})
          THEN 1 ELSE "RateLimit"."Conteo" + 1 END,
        "VentanaInicio" = CASE
          WHEN "RateLimit"."VentanaInicio" <= now() - make_interval(secs => ${regla.ventanaSeg})
          THEN now() ELSE "RateLimit"."VentanaInicio" END
      RETURNING
        "Conteo" AS conteo,
        GREATEST(1, CEIL(EXTRACT(EPOCH FROM (
          "VentanaInicio" + make_interval(secs => ${regla.ventanaSeg}) - now()
        ))))::int AS restan`;
    const { conteo, restan } = filas[0];
    if (conteo > regla.limite) return { ok: false, reintentarEnSeg: restan };
    return { ok: true, restantes: regla.limite - conteo };
  } catch (error) {
    console.error(`[rateLimit] ${regla.nombre}: no se pudo verificar`, error);
    return { ok: true, restantes: regla.limite };
  }
}

/**
 * Vuelve a cero el contador de una clave (ej. el del usuario tras un login
 * correcto). Si la base falla no pasa nada: el contador vence solo.
 */
export async function reiniciarLimite(regla: ReglaLimite, valor: string): Promise<void> {
  try {
    await prisma.$executeRaw`DELETE FROM "RateLimit" WHERE "Clave" = ${claveDe(regla, valor)}`;
  } catch (error) {
    console.error(`[rateLimit] ${regla.nombre}: no se pudo reiniciar`, error);
  }
}

/** Respuesta 429 estándar con Retry-After y un mensaje en castellano. */
export function respuestaLimiteExcedido(reintentarEnSeg: number) {
  const minutos = Math.ceil(reintentarEnSeg / 60);
  const espera =
    reintentarEnSeg < 60
      ? `${reintentarEnSeg} segundos`
      : `${minutos} minuto${minutos !== 1 ? "s" : ""}`;
  return NextResponse.json(
    { error: `Demasiados intentos. Probá de nuevo en ${espera}.` },
    { status: 429, headers: { "Retry-After": String(reintentarEnSeg) } },
  );
}

/**
 * Aplica varias reglas en orden (ej. por IP y por usuario). Devuelve la
 * respuesta 429 de la primera que se exceda, o null si todas permiten.
 */
export async function aplicarLimites(
  reglas: { regla: ReglaLimite; valor: string }[],
): Promise<NextResponse | null> {
  for (const { regla, valor } of reglas) {
    const r = await consumirLimite(regla, valor);
    if (!r.ok) return respuestaLimiteExcedido(r.reintentarEnSeg);
  }
  return null;
}

/** Límites de las rutas públicas de /api/auth. */
export const LIMITES_AUTH = {
  /**
   * Login: 20 por minuto por IP (cuenta también los correctos: deja margen
   * para un comercio con varios cajeros entrando a la vez desde la misma
   * conexión)...
   */
  loginIp: { nombre: "login:ip", limite: 20, ventanaSeg: 60 },
  /**
   * ...y 10 cada 15 minutos por nombre de usuario: frena la prueba de
   * contraseñas contra cuentas que no se bloquean solas (administradores, o
   * comercios con "Bloquear tras intentos" en "Nunca"). Un login correcto
   * lo vuelve a cero.
   */
  loginUsuario: { nombre: "login:usuario", limite: 10, ventanaSeg: 15 * 60 },
  /** Recuperar contraseña: 5 por hora por IP... */
  recuperarIp: { nombre: "recuperar:ip", limite: 5, ventanaSeg: 60 * 60 },
  /** ...y 3 por hora por nombre de usuario (cuida el cupo de emails). */
  recuperarUsuario: { nombre: "recuperar:usuario", limite: 3, ventanaSeg: 60 * 60 },
} satisfies Record<string, ReglaLimite>;
