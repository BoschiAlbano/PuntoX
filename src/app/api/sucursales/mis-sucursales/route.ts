/**
 * =====================================================
 * API PARA OBTENER SUCURSALES DEL USUARIO
 * =====================================================
 * 
 * GET /api/sucursales/mis-sucursales
 * Obtiene las sucursales a las que tiene acceso el usuario actual
 * junto con la sucursal activa
 * 
 * =====================================================
 */

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getUserBranches, getActiveBranchContext, getActiveBranchIdFromCookie } from "@/lib/sucursal";
import { handleError } from "@/lib/errors/handler";

/**
 * GET /api/sucursales/mis-sucursales
 * Obtiene las sucursales del usuario y la activa
 */
export async function GET() {
  try {
    const { error } = await getAuthUser();

    if (error) {
      return error;
    }

    // Obtener sucursales del usuario
    const branches = await getUserBranches();
    
    // Obtener sucursal activa
    const activeBranch = await getActiveBranchContext();

    // Verificar si hay cookie para determinar si ya seleccionó antes
    const cookieBranchId = await getActiveBranchIdFromCookie();
    const tieneCookieValida = cookieBranchId !== null && branches.some(b => b.id === cookieBranchId);
    
    return NextResponse.json({
      sucursales: branches.map((b) => ({
        id: Number(b.id),
        nombre: b.nombre,
        direccion: b.direccion,
        esPrincipal: b.esPrincipal,
        estaActiva: b.estaActiva,
        esDefault: b.esDefault,
      })),
      sucursalActiva: activeBranch ? {
        id: Number(activeBranch.sucursalId),
        nombre: activeBranch.sucursalNombre,
        esPrincipal: activeBranch.esPrincipal,
      } : null,
      // Indica si el usuario necesita seleccionar sucursal
      requiereSeleccion: branches.length > 1 && !activeBranch,
      // Información adicional para debugging
      tieneMultiplesSucursales: branches.length > 1,
      tieneCookieValida: tieneCookieValida,
    });
  } catch (error) {
    return handleError(error);
  }
}

