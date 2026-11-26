import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/handler";
import { procesarAvisosVencimiento } from "@/lib/suscripcion/avisos";

/**
 * GET /api/cron/suscripciones
 *
 * Envía los avisos de vencimiento de suscripción (7 días antes, 1 día antes y
 * al vencer) por email y notificación in-app a los administradores de cada
 * comercio. No bloquea el acceso.
 *
 * Llamado por Vercel Cron una vez por día (ver vercel.json).
 * Seguridad: header Authorization: Bearer CRON_SECRET (mismo patrón que
 * cron/resumen-diario); sin CRON_SECRET solo se permite desde localhost.
 */
export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");

  if (cronSecret) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
  } else {
    const host = req.headers.get("host") || "";
    const isLocal =
      host.startsWith("localhost") || host.startsWith("127.0.0.1");
    if (!isLocal) {
      return NextResponse.json(
        { error: "CRON_SECRET no configurado" },
        { status: 401 },
      );
    }
  }

  try {
    const resumen = await procesarAvisosVencimiento();
    return NextResponse.json(resumen);
  } catch (error) {
    return handleError(error);
  }
}
