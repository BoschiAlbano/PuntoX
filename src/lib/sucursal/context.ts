/**
 * =====================================================
 * CONTEXTO DE SUCURSAL
 * =====================================================
 * 
 * Este módulo maneja el contexto de sucursal activa para el usuario.
 * 
 * Estrategia:
 * - La sucursal activa se guarda en una cookie HttpOnly
 * - Si el usuario tiene solo 1 sucursal, se autoselecciona
 * - Si tiene múltiples, debe seleccionar una
 * - El contexto se valida en cada request del servidor
 * 
 * =====================================================
 */

import { cookies } from "next/headers";
import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";

// Nombre de la cookie para la sucursal activa
const BRANCH_COOKIE_NAME = "puntox_branch_id";
const BRANCH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 días

/**
 * Tipo para el contexto de sucursal
 */
export type BranchContext = {
  sucursalId: bigint;
  sucursalNombre: string;
  esPrincipal: boolean;
};

/**
 * Tipo para sucursal del usuario
 */
export type UserBranch = {
  id: bigint;
  nombre: string;
  direccion: string | null;
  esPrincipal: boolean;
  estaActiva: boolean;
  esDefault: boolean;
};

/**
 * Obtiene las sucursales a las que tiene acceso el usuario actual
 * 
 * @returns Lista de sucursales del usuario
 */
export async function getUserBranches(): Promise<UserBranch[]> {
  const { user, tenantId, error } = await getAuthUser();
  
  if (error || !user || !tenantId) {
    return [];
  }

  // Obtener usuarioId desde la BD usando AuthUserId
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
    console.error("[getUserBranches] Usuario no encontrado en BD para AuthUserId:", user.id);
    return [];
  }

  const usuarioId = usuario.Id;

  // Obtener sucursales asignadas al usuario
  const usuarioSucursales = await prisma.usuarioSucursal.findMany({
    where: {
      UsuarioId: usuarioId,
      TenantId: BigInt(tenantId),
      Sucursal: {
        EstaActiva: true,
        EstaEliminado: false,
      },
    },
    include: {
      Sucursal: {
        select: {
          Id: true,
          Nombre: true,
          Direccion: true,
          EsPrincipal: true,
          EstaActiva: true,
        },
      },
    },
    orderBy: [
      { EsDefault: "desc" },
      { Sucursal: { EsPrincipal: "desc" } },
      { Sucursal: { Nombre: "asc" } },
    ],
  });

  return usuarioSucursales.map((us) => ({
    id: us.Sucursal.Id,
    nombre: us.Sucursal.Nombre,
    direccion: us.Sucursal.Direccion,
    esPrincipal: us.Sucursal.EsPrincipal,
    estaActiva: us.Sucursal.EstaActiva,
    esDefault: us.EsDefault,
  }));
}

/**
 * Obtiene el ID de la sucursal activa desde la cookie
 * 
 * @returns ID de la sucursal activa o null
 */
export async function getActiveBranchIdFromCookie(): Promise<bigint | null> {
  const cookieStore = await cookies();
  const branchCookie = cookieStore.get(BRANCH_COOKIE_NAME);
  
  if (!branchCookie?.value) {
    return null;
  }

  try {
    return BigInt(branchCookie.value);
  } catch {
    return null;
  }
}

/**
 * Establece la sucursal activa en la cookie
 * 
 * @param sucursalId - ID de la sucursal a activar
 */
export async function setActiveBranch(sucursalId: bigint): Promise<void> {
  const cookieStore = await cookies();
  
  cookieStore.set(BRANCH_COOKIE_NAME, sucursalId.toString(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: BRANCH_COOKIE_MAX_AGE,
    path: "/",
  });
}

/**
 * Limpia la cookie de sucursal activa
 */
export async function clearActiveBranch(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(BRANCH_COOKIE_NAME);
}

/**
 * Obtiene el contexto completo de sucursal activa
 * 
 * Lógica:
 * 1. Si hay cookie válida y el usuario tiene acceso, usar esa
 * 2. Si el usuario tiene solo 1 sucursal, autoseleccionar
 * 3. Si tiene múltiples y no hay cookie, retornar null (requiere selección manual)
 * 
 * IMPORTANTE: No autoselecciona cuando hay múltiples sucursales.
 * El usuario debe seleccionar manualmente.
 * 
 * @returns Contexto de sucursal o null si requiere selección
 */
export async function getActiveBranchContext(): Promise<BranchContext | null> {
  const { tenantId, error } = await getAuthUser();
  
  if (error || !tenantId) {
    return null;
  }

  // Obtener sucursales del usuario
  const userBranches = await getUserBranches();
  
  if (userBranches.length === 0) {
    // Usuario sin sucursales asignadas - esto no debería pasar
    console.error(`Usuario sin sucursales asignadas`);
    return null;
  }

  // Si tiene solo 1 sucursal, autoseleccionar
  if (userBranches.length === 1) {
    const branch = userBranches[0];
    await setActiveBranch(branch.id);
    return {
      sucursalId: branch.id,
      sucursalNombre: branch.nombre,
      esPrincipal: branch.esPrincipal,
    };
  }

  // Múltiples sucursales: SOLO verificar cookie existente
  // NO autoseleccionar - el usuario debe elegir manualmente
  const cookieBranchId = await getActiveBranchIdFromCookie();
  
  if (cookieBranchId) {
    // Verificar que el usuario tiene acceso a esa sucursal
    const validBranch = userBranches.find((b) => b.id === cookieBranchId);
    
    if (validBranch) {
      return {
        sucursalId: validBranch.id,
        sucursalNombre: validBranch.nombre,
        esPrincipal: validBranch.esPrincipal,
      };
    }
    
    // Cookie inválida, limpiar
    await clearActiveBranch();
  }

  // No hay cookie válida y hay múltiples sucursales
  // Retornar null para que el usuario seleccione manualmente
  return null;
}

/**
 * Requiere contexto de sucursal.
 * Si no hay sucursal activa, lanza error o redirige.
 * 
 * @throws Error si no hay sucursal activa
 * @returns Contexto de sucursal garantizado
 */
export async function requireBranchContext(): Promise<BranchContext> {
  const context = await getActiveBranchContext();
  
  if (!context) {
    throw new Error("BRANCH_SELECTION_REQUIRED");
  }
  
  return context;
}

/**
 * Verifica si el usuario tiene acceso a una sucursal específica
 * 
 * @param sucursalId - ID de la sucursal a verificar
 * @returns true si tiene acceso, false si no
 */
export async function hasAccessToBranch(sucursalId: bigint): Promise<boolean> {
  const userBranches = await getUserBranches();
  return userBranches.some((b) => b.id === sucursalId);
}

/**
 * Cambia la sucursal activa del usuario
 * 
 * @param sucursalId - ID de la nueva sucursal
 * @returns true si el cambio fue exitoso, false si no tiene acceso
 */
export async function switchBranch(sucursalId: bigint): Promise<boolean> {
  const hasAccess = await hasAccessToBranch(sucursalId);
  
  if (!hasAccess) {
    return false;
  }
  
  await setActiveBranch(sucursalId);
  return true;
}

