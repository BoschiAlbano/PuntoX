import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";
import { verifyUserBranchAccess } from "@/lib/sucursal/verifyUserBranch";
import prisma from "@/DB/prisma";

const cambiarSucursalSchema = z.object({
  sucursalId: z.number().int().positive(),
});

export async function POST(req: NextRequest) {
  try {
    const { error, tenantId, user } = await getAuthUser();

    if (error) {
      return error;
    }

    const body = await req.json();
    const data = cambiarSucursalSchema.parse(body);

    // Intentar cambiar la sucursal
    const accessResult = await verifyUserBranchAccess(
      BigInt(tenantId),
      user.id,
      BigInt(data.sucursalId)
    );

    if (!accessResult) {
      return NextResponse.json(
        { error: "No tiene acceso a esta sucursal" },
        { status: 403 }
      );
    }

    const { usuarioId } = accessResult;

    await prisma.$transaction([
      prisma.usuarioSucursal.updateMany({
        where: {
          UsuarioId: usuarioId,
          TenantId: BigInt(tenantId),
        },
        data: {
          EsDefault: false,
        },
      }),
      prisma.usuarioSucursal.update({
        where: {
          UsuarioId_SucursalId: {
            UsuarioId: usuarioId,
            SucursalId: BigInt(data.sucursalId),
          },
        },
        data: {
          EsDefault: true,
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    console.log(error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }
    return handleError(error);
  }
}
