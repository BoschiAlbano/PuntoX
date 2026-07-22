import prisma from "@/DB/prisma";
import { createError } from "@/lib/errors/types";

export interface PlanFeatures {
  maxSucursales: number | null;
  maxUsuarios: number | null;
  maxArticulos: number | null;
  incluyeAFIP: boolean;
}

// Defaults permisivos: ante un JSON faltante, vacío o inválido nunca se
// bloquea nada (evita que un error de parseo tumbe al Plan Ilimitado, que
// hoy solo tiene `{"unlimited":true}` sin las claves de límites).
const DEFAULT_FEATURES: PlanFeatures = {
  maxSucursales: null,
  maxUsuarios: null,
  maxArticulos: null,
  incluyeAFIP: true,
};

function toLimit(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

export function parsePlanFeatures(
  caracteristicas: string | null | undefined,
): PlanFeatures {
  if (!caracteristicas) return { ...DEFAULT_FEATURES };

  let parsed: unknown;
  try {
    parsed = JSON.parse(caracteristicas);
  } catch {
    return { ...DEFAULT_FEATURES };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ...DEFAULT_FEATURES };
  }

  const obj = parsed as Record<string, unknown>;
  return {
    maxSucursales: toLimit(obj.maxSucursales),
    maxUsuarios: toLimit(obj.maxUsuarios),
    maxArticulos: toLimit(obj.maxArticulos),
    incluyeAFIP:
      typeof obj.incluyeAFIP === "boolean" ? obj.incluyeAFIP : true,
  };
}

export async function getPlanFeaturesDeTenant(
  tenantId: number,
): Promise<PlanFeatures> {
  const tenant = await prisma.tenant.findUnique({
    where: { Id: BigInt(tenantId) },
    select: { Plan: { select: { Caracteristicas: true } } },
  });
  return parsePlanFeatures(tenant?.Plan?.Caracteristicas ?? null);
}

type LimiteTipo = "sucursales" | "usuarios" | "articulos";

const LIMITE_CONFIG: Record<
  LimiteTipo,
  {
    featureKey: keyof Pick<
      PlanFeatures,
      "maxSucursales" | "maxUsuarios" | "maxArticulos"
    >;
    contar: (tenantId: bigint) => Promise<number>;
    etiqueta: string;
  }
> = {
  sucursales: {
    featureKey: "maxSucursales",
    contar: (tenantId) =>
      prisma.sucursal.count({
        where: { TenantId: tenantId, EstaEliminado: false },
      }),
    etiqueta: "sucursales",
  },
  usuarios: {
    featureKey: "maxUsuarios",
    contar: (tenantId) =>
      prisma.usuario.count({
        where: { TenantId: tenantId, EstaEliminado: false },
      }),
    etiqueta: "usuarios",
  },
  articulos: {
    featureKey: "maxArticulos",
    contar: (tenantId) =>
      prisma.articulo.count({
        where: { TenantId: tenantId, EstaEliminado: false },
      }),
    etiqueta: "artículos",
  },
};

/**
 * Tira un 403 (`createError.forbidden`) si el tenant ya alcanzó el límite de
 * su plan para `tipo`. Solo bloquea altas nuevas: nunca borra ni desactiva
 * registros existentes, aunque el tenant ya esté por encima del límite.
 */
export async function assertDentroDeLimite(
  tenantId: number,
  tipo: LimiteTipo,
): Promise<void> {
  const config = LIMITE_CONFIG[tipo];
  const features = await getPlanFeaturesDeTenant(tenantId);
  const max = features[config.featureKey];
  if (max === null) return;

  const actual = await config.contar(BigInt(tenantId));
  if (actual >= max) {
    throw createError.forbidden(
      `Tu plan permite hasta ${max} ${config.etiqueta}. Actualizá tu plan para agregar más.`,
    );
  }
}

export async function planIncluyeAFIP(tenantId: number): Promise<boolean> {
  const features = await getPlanFeaturesDeTenant(tenantId);
  return features.incluyeAFIP;
}
