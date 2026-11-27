import prisma from "@/DB/prisma";
import { notificarAdministradores } from "@/lib/notificaciones/notificar";
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

/** JSON que se guarda en PlanSaaS.Caracteristicas (inverso de parsePlanFeatures). */
export function serializarPlanFeatures(features: PlanFeatures): string {
  return JSON.stringify({
    maxSucursales: features.maxSucursales,
    maxUsuarios: features.maxUsuarios,
    maxArticulos: features.maxArticulos,
    incluyeAFIP: features.incluyeAFIP,
  });
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

/** "1 sucursal", "3 sucursales". */
const cantidad = (n: number, [singular, plural]: [string, string]) =>
  `${n} ${n === 1 ? singular : plural}`;

type LimiteTipo = "sucursales" | "usuarios" | "articulos";

const LIMITE_CONFIG: Record<
  LimiteTipo,
  {
    featureKey: keyof Pick<
      PlanFeatures,
      "maxSucursales" | "maxUsuarios" | "maxArticulos"
    >;
    contar: (tenantId: bigint) => Promise<number>;
    /** [singular, plural] */
    etiqueta: [string, string];
  }
> = {
  sucursales: {
    featureKey: "maxSucursales",
    contar: (tenantId) =>
      prisma.sucursal.count({
        where: { TenantId: tenantId, EstaEliminado: false },
      }),
    etiqueta: ["sucursal", "sucursales"],
  },
  usuarios: {
    featureKey: "maxUsuarios",
    contar: (tenantId) =>
      prisma.usuario.count({
        where: { TenantId: tenantId, EstaEliminado: false },
      }),
    etiqueta: ["usuario", "usuarios"],
  },
  articulos: {
    featureKey: "maxArticulos",
    contar: (tenantId) =>
      prisma.articulo.count({
        where: { TenantId: tenantId, EstaEliminado: false },
      }),
    etiqueta: ["artículo", "artículos"],
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
      `Tu plan permite hasta ${cantidad(max, config.etiqueta)}. Actualizá tu plan para agregar más.`,
    );
  }
}

/**
 * Después de un alta: si el comercio quedó en el máximo de su plan para
 * `tipo`, avisa a los administradores (notificación in-app, sin email).
 * No repite el aviso mientras haya uno igual sin leer. Nunca lanza.
 */
export async function notificarSiAlcanzoLimite(
  tenantId: number,
  tipo: LimiteTipo,
): Promise<boolean> {
  try {
    const config = LIMITE_CONFIG[tipo];
    const max = (await getPlanFeaturesDeTenant(tenantId))[config.featureKey];
    if (max === null) return false;

    const tenant = BigInt(tenantId);
    if ((await config.contar(tenant)) < max) return false;

    const entidadId = `${tipo}:${max}`;
    const pendiente = await prisma.notificacion.findFirst({
      where: { TenantId: tenant, EntidadTipo: "PLAN_LIMITE", EntidadId: entidadId, Leida: false },
      select: { Id: true },
    });
    if (pendiente) return false;

    await notificarAdministradores(tenant, {
      tipo: "WARNING",
      titulo: "Llegaste al límite de tu plan",
      mensaje: `Tu plan permite hasta ${cantidad(max, config.etiqueta)} y ya llegaste al máximo. Para agregar más, cambiá a un plan superior.`,
      entidadTipo: "PLAN_LIMITE",
      entidadId,
    });
    return true;
  } catch (error) {
    console.error("[planes] Aviso de límite alcanzado:", error);
    return false;
  }
}

export async function planIncluyeAFIP(tenantId: number): Promise<boolean> {
  const features = await getPlanFeaturesDeTenant(tenantId);
  return features.incluyeAFIP;
}
