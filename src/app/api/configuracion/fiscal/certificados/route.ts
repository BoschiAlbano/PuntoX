import { NextRequest, NextResponse } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import prisma from "@/DB/prisma";
import { encryptText } from "@/lib/services/crypto.service";
import { certificadoUploadSchema } from "@/lib/validations/facturacion.schema";

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({ req });
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const result = certificadoUploadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: result.error.issues },
        { status: 400 }
      );
    }

    const { certificado, clavePrivada } = result.data;

    const config = await prisma.configuracion.findFirst({
      where: { TenantId: BigInt(tenantId), EstaEliminado: false },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    // Encriptar certificado y clave antes de guardar
    const certificadoEncriptado = encryptText(certificado);
    const claveEncriptada = encryptText(clavePrivada);

    await prisma.configuracion.update({
      where: { Id: config.Id },
      data: {
        AfipCertificado: certificadoEncriptado,
        AfipClavePrivada: claveEncriptada,
      },
    });

    return NextResponse.json(
      { message: "Certificados guardados correctamente" },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({ req });
    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const config = await prisma.configuracion.findFirst({
      where: { TenantId: BigInt(tenantId), EstaEliminado: false },
    });

    if (!config) {
      return NextResponse.json(
        { error: "Configuración no encontrada" },
        { status: 404 }
      );
    }

    await prisma.configuracion.update({
      where: { Id: config.Id },
      data: {
        AfipCertificado: null,
        AfipClavePrivada: null,
        AfipHabilitado: false, // Deshabilitar si se borran los certificados
      },
    });

    return NextResponse.json(
      { message: "Certificados eliminados correctamente" },
      { status: 200 }
    );
  } catch (error) {
    return handleError(error);
  }
}
