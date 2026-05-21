import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import { getArcaConfig, verificarConexionArca } from "@/lib/services/arca.service";

export async function GET(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({ req });
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Pasamos 'false' para que permita probar la conexión incluso si el switch de facturación está apagado
    const arcaConfig = await getArcaConfig(BigInt(tenantId), false);
    
    if (!arcaConfig) {
      return NextResponse.json(
        { ok: false, error: "La facturación electrónica no está configurada o habilitada." },
        { status: 400 }
      );
    }

    const resultado = await verificarConexionArca(arcaConfig);

    if (resultado.ok) {
      return NextResponse.json({ 
        ok: true, 
        message: "Conexión exitosa con ARCA",
        puntosDeVenta: resultado.puntosDeVenta
      }, { status: 200 });
    } else {
      return NextResponse.json({ 
        ok: false, 
        error: "Error al conectar con ARCA", 
        details: resultado.error 
      }, { status: 400 });
    }
  } catch (error) {
    return handleError(error);
  }
}
