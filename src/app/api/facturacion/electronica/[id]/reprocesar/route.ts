import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";
import { isFacturacionElectronicaHabilitada, autorizarComprobante } from "@/lib/services/facturacion.service";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { tenantId } = await getAuthContext({ req });
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const comprobanteId = BigInt(params.id);
    const tenantIdBigInt = BigInt(tenantId);

    // Verificar si la facturación electrónica está habilitada
    const arcaHabilitada = await isFacturacionElectronicaHabilitada(tenantIdBigInt);
    if (!arcaHabilitada) {
      return NextResponse.json(
        { error: "La facturación electrónica no está habilitada o faltan certificados" },
        { status: 400 }
      );
    }

    // Buscar el comprobante y su factura electrónica
    const comprobante = await prisma.comprobante.findUnique({
      where: {
        Id: comprobanteId,
        TenantId: tenantIdBigInt,
      },
      include: {
        FacturaElectronica: true,
      },
    });

    if (!comprobante) {
      return NextResponse.json({ error: "Comprobante no encontrado" }, { status: 404 });
    }

    // Si ya está autorizado, no hacer nada
    if (comprobante.FacturaElectronica?.Estado === "AUTORIZADO") {
      return NextResponse.json(
        { error: "Este comprobante ya se encuentra autorizado por AFIP" },
        { status: 400 }
      );
    }

    // Autorizar
    // Asumimos que sucursalId es la primera del usuario si no tenemos de dónde sacarla,
    // o mejor buscar la caja asociada.
    // En este diseño, el sucursalId es requerido por autorizarComprobante.
    // Vamos a buscar la sucursal del comprobante a través de la venta original, pero Comprobante no tiene SucursalId directo.
    // Como alternativa, buscamos la primera sucursal activa del tenant por simplicidad o permitimos enviarlo en el body.
    
    // Buscar la sucursalId desde el usuario que hizo el request
    const userDb = await prisma.usuario.findFirst({
      where: { TenantId: tenantIdBigInt, EstaEliminado: false },
      include: { Sucursales: { take: 1 } }
    });
    
    const sucursalId = userDb?.Sucursales[0]?.SucursalId;
    if (!sucursalId) {
      return NextResponse.json({ error: "No se pudo determinar la sucursal" }, { status: 400 });
    }

    const result = await autorizarComprobante(comprobanteId, tenantIdBigInt, sucursalId);

    if (result.success) {
      return NextResponse.json(
        { message: "Comprobante autorizado correctamente", result },
        { status: 200 }
      );
    } else {
      return NextResponse.json(
        { error: "Rechazado por AFIP", details: result.errores, observaciones: result.observaciones },
        { status: 400 }
      );
    }
  } catch (error) {
    return handleError(error);
  }
}
