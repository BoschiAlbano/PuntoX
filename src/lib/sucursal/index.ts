/**
 * =====================================================
 * MÓDULO DE SUCURSALES - EXPORTS
 * =====================================================
 */

// Contexto de sucursal
export {
  getActiveBranchContext,
  getActiveBranchIdFromCookie,
  getUserBranches,
  setActiveBranch,
  clearActiveBranch,
  requireBranchContext,
  hasAccessToBranch,
  switchBranch,
  type BranchContext,
  type UserBranch,
} from "./context";

// Helpers de autenticación con sucursal
export {
  getAuthWithBranch,
  getAuthWithOptionalBranch,
  validateBranchAccess,
  type AuthWithBranchResult,
  type AuthWithOptionalBranchResult,
} from "./getAuthWithBranch";

// Prisma con scope
export {
  withScope,
  type ScopeParams,
  type ScopedPrisma,
} from "./scopedPrisma";

// Helper para obtener sucursalId
export {
  getSucursalId,
  requireSucursalId,
} from "./getSucursalId";

