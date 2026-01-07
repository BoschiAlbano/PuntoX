/**
 * =====================================================
 * HELPER DE AUTENTICACIÓN CON CONTEXTO DE SUCURSAL
 * =====================================================
 * 
 * Extiende getAuthUser para incluir el contexto de sucursal.
 * Usar en API routes que requieren scope por sucursal.
 * 
 * =====================================================
 */

import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth/getAuthUser";
import { getActiveBranchContext, getUserBranches, type BranchContext } from "./context";
import prisma from "@/DB/prisma";

/**
 * Resultado de autenticación con sucursal
 */
export type AuthWithBranchResult = {
  tenantId: string;
  usuarioId: bigint;
  sucursalId: bigint;
  sucursalNombre: string;
  error: null;
} | {
  tenantId: null;
  usuarioId: null;
  sucursalId: null;
  sucursalNombre: null;
  error: NextResponse;
};

/**
 * Obtiene autenticación del usuario con contexto de sucursal
 * 
 * @returns Datos de autenticación incluyendo sucursalId, o error
 */
export async function getAuthWithBranch(): Promise<AuthWithBranchResult> {
  // Primero verificar autenticación básica
  const { user, tenantId, error: authError } = await getAuthUser();
  
  if (authError || !user || !tenantId) {
    return {
      tenantId: null,
      usuarioId: null,
      sucursalId: null,
      sucursalNombre: null,
      error: authError || NextResponse.json({ message: "No autenticado" }, { status: 401 }),
    };
  }

  // Obtener usuarioId desde la BD
  const usuario = await prisma.usuario.findFirst({
    where: {
      AuthUserId: user.id,
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    },
    select: {
      Id: true,
    },
  });

  if (!usuario) {
    return {
      tenantId: null,
      usuarioId: null,
      sucursalId: null,
      sucursalNombre: null,
      error: NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 }),
    };
  }

  const usuarioId = usuario.Id;

  // Obtener contexto de sucursal
  const branchContext = await getActiveBranchContext();
  
  if (!branchContext) {
    // Usuario necesita seleccionar sucursal
    return {
      tenantId: null,
      usuarioId: null,
      sucursalId: null,
      sucursalNombre: null,
      error: NextResponse.json(
        { 
          error: "Debe seleccionar una sucursal",
          code: "BRANCH_SELECTION_REQUIRED",
        },
        { status: 400 }
      ),
    };
  }

  return {
    tenantId: String(tenantId),
    usuarioId: usuarioId,
    sucursalId: branchContext.sucursalId,
    sucursalNombre: branchContext.sucursalNombre,
    error: null,
  };
}

/**
 * Resultado de autenticación con sucursal opcional
 * Para endpoints que pueden funcionar sin sucursal (ej: reportes globales)
 */
export type AuthWithOptionalBranchResult = {
  tenantId: string;
  usuarioId: bigint;
  sucursalId: bigint | null;
  sucursalNombre: string | null;
  hasMultipleBranches: boolean;
  availableBranches: Array<{ id: bigint; nombre: string }>;
  error: null;
} | {
  tenantId: null;
  usuarioId: null;
  sucursalId: null;
  sucursalNombre: null;
  hasMultipleBranches: false;
  availableBranches: [];
  error: NextResponse;
};

/**
 * Obtiene autenticación con sucursal opcional
 * Útil para endpoints que pueden funcionar a nivel tenant o sucursal
 * 
 * @returns Datos de autenticación con información de sucursales disponibles
 */
export async function getAuthWithOptionalBranch(): Promise<AuthWithOptionalBranchResult> {
  // Primero verificar autenticación básica
  const { user, tenantId, error: authError } = await getAuthUser();
  
  if (authError || !user || !tenantId) {
    return {
      tenantId: null,
      usuarioId: null,
      sucursalId: null,
      sucursalNombre: null,
      hasMultipleBranches: false,
      availableBranches: [],
      error: authError || NextResponse.json({ message: "No autenticado" }, { status: 401 }),
    };
  }

  // Obtener usuarioId desde la BD
  const usuario = await prisma.usuario.findFirst({
    where: {
      AuthUserId: user.id,
      TenantId: BigInt(tenantId),
      EstaEliminado: false,
    },
    select: {
      Id: true,
    },
  });

  if (!usuario) {
    return {
      tenantId: null,
      usuarioId: null,
      sucursalId: null,
      sucursalNombre: null,
      hasMultipleBranches: false,
      availableBranches: [],
      error: NextResponse.json({ message: "Usuario no encontrado" }, { status: 401 }),
    };
  }

  const usuarioId = usuario.Id;

  // Obtener sucursales del usuario
  const userBranches = await getUserBranches();
  const hasMultipleBranches = userBranches.length > 1;
  
  // Obtener contexto de sucursal (puede ser null)
  const branchContext = await getActiveBranchContext();

  return {
    tenantId: String(tenantId),
    usuarioId: usuarioId,
    sucursalId: branchContext?.sucursalId ?? null,
    sucursalNombre: branchContext?.sucursalNombre ?? null,
    hasMultipleBranches,
    availableBranches: userBranches.map((b) => ({ id: b.id, nombre: b.nombre })),
    error: null,
  };
}

/**
 * Verifica que el usuario tenga acceso a una sucursal específica
 * Útil cuando se recibe sucursalId como parámetro
 * 
 * @param sucursalId - ID de la sucursal a verificar
 * @returns true si tiene acceso
 */
export async function validateBranchAccess(sucursalId: bigint): Promise<{
  isValid: boolean;
  error: NextResponse | null;
}> {
  const { tenantId, error: authError } = await getAuthUser();
  
  if (authError) {
    return { isValid: false, error: authError };
  }

  const userBranches = await getUserBranches();
  const hasAccess = userBranches.some((b) => b.id === sucursalId);
  
  if (!hasAccess) {
    return {
      isValid: false,
      error: NextResponse.json(
        { error: "No tiene acceso a esta sucursal" },
        { status: 403 }
      ),
    };
  }

  return { isValid: true, error: null };
}

