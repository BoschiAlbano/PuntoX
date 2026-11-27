import { NextRequest, NextResponse } from "next/server";
import { SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import prisma from "@/DB/prisma";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { handleError } from "@/lib/errors/handler";

export async function POST(req: NextRequest) {
  try {
    const { tenantId } = await getAuthContext({ req, permission: SET_PERMISSIONS.CONFIGURACION });

    if (!tenantId) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const tenant = await prisma.tenant.update({
      where: { Id: BigInt(tenantId) },
      data: {
        OnboardingCompleto: true,
      },
    });

    return NextResponse.json({
      success: true,
      onboardingCompleto: tenant.OnboardingCompleto,
    });
  } catch (error) {
    return handleError(error);
  }
}
