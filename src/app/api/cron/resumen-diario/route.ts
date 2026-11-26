import { NextRequest, NextResponse } from "next/server";
import { handleError } from "@/lib/errors/handler";
import { procesarResumenDiario } from "@/lib/resumen/diario";

/**
 * GET /api/cron/resumen-diario
 *
 * Resume el DÍA ANTERIOR completo (hora Argentina) de cada comercio con
 * "Resumen diario" activado: notificación in-app y, si hubo ventas, email a
 * los administradores. Ver src/lib/resumen/diario.ts.
 *
 * Llamado por Vercel Cron a las 10:00 UTC = 07:00 Argentina (vercel.json).
 * Seguridad: requiere header Authorization con CRON_SECRET; sin CRON_SECRET
 * solo se permite desde localhost.
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
    const resultado = await procesarResumenDiario();
    console.log("[resumen-diario] Completado:", resultado);
    return NextResponse.json(resultado);
  } catch (error) {
    return handleError(error);
  }
}
