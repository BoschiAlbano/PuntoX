/**
 * =====================================================
 * API PARA LIMPIAR COOKIE DE SUCURSAL
 * =====================================================
 * 
 * POST /api/sucursales/limpiar
 * Limpia la cookie de sucursal activa (para logout)
 * 
 * =====================================================
 */

import { NextResponse } from "next/server";
import { clearActiveBranch } from "@/lib/sucursal";

/**
 * POST /api/sucursales/limpiar
 * Limpia la cookie de sucursal
 */
export async function POST() {
  try {
    await clearActiveBranch();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error limpiando cookie de sucursal:", error);
    // Aún así retornar success para no bloquear el logout
    return NextResponse.json({ success: true });
  }
}

