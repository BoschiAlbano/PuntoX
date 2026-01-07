/**
 * =====================================================
 * API PARA CAMBIAR SUCURSAL ACTIVA
 * =====================================================
 * 
 * POST /api/sucursales/cambiar
 * Cambia la sucursal activa del usuario
 * 
 * =====================================================
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { switchBranch, getUserBranches } from "@/lib/sucursal";
import { handleError } from "@/lib/errors/handler";

const cambiarSucursalSchema = z.object({
  sucursalId: z.number().int().positive(),
});

/**
 * POST /api/sucursales/cambiar
 * Cambia la sucursal activa
 */
export async function POST(req: NextRequest) {
  try {
    const { error } = await getAuthUser();

    if (error) {
      return error;
    }

    const body = await req.json();
    const data = cambiarSucursalSchema.parse(body);

    // Intentar cambiar la sucursal
    const success = await switchBranch(BigInt(data.sucursalId));

    if (!success) {
      return NextResponse.json(
        { error: "No tiene acceso a esta sucursal" },
        { status: 403 }
      );
    }

    // Obtener info de la sucursal seleccionada
    const branches = await getUserBranches();
    const selectedBranch = branches.find((b) => b.id === BigInt(data.sucursalId));

    return NextResponse.json({
      success: true,
      sucursal: selectedBranch ? {
        id: Number(selectedBranch.id),
        nombre: selectedBranch.nombre,
        esPrincipal: selectedBranch.esPrincipal,
      } : null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues[0]?.message || "Datos inválidos" },
        { status: 400 }
      );
    }
    return handleError(error);
  }
}

