/**
 * Revisión de permisos (27/11/2026): rutas que solo pedían sesión y ahora
 * exigen un permiso. Este test fija el permiso de cada una para que no se
 * pierda en un refactor.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PermisoError } from "@/lib/requirePermiso";
import { GET_PERMISSIONS, SET_PERMISSIONS } from "@/lib/constants/comprobantes";
import * as certificados from "./configuracion/fiscal/certificados/route";
import * as puntosVenta from "./configuracion/fiscal/puntos-venta/route";
import * as arcaVerificar from "./configuracion/fiscal/arca/verificar/route";
import * as comprobantes from "./comprobantes/route";
import * as reprocesar from "./facturacion/electronica/[id]/reprocesar/route";
import * as bulkReprocesar from "./facturacion/electronica/bulk-reprocesar/route";
import * as onboarding from "./onboarding/complete/route";
import * as tenant from "./tenant/route";

vi.mock("@/lib/auth/getAuthUser", () => ({ getAuthContext: vi.fn() }));
vi.mock("@/DB/prisma", () => ({ default: {} }));

const req = (method: string) =>
  new NextRequest("http://localhost/api/x", { method, body: method === "GET" || method === "DELETE" ? undefined : "{}" });

type Handler = (req: NextRequest, ctx?: unknown) => Promise<Response>;

const casos: [string, Handler, string, string][] = [
  ["POST certificados ARCA", certificados.POST, "POST", SET_PERMISSIONS.CONFIGURACION],
  ["DELETE certificados ARCA", certificados.DELETE, "DELETE", SET_PERMISSIONS.CONFIGURACION],
  ["GET puntos de venta", puntosVenta.GET, "GET", GET_PERMISSIONS.CONFIGURACION],
  ["PUT puntos de venta", puntosVenta.PUT, "PUT", SET_PERMISSIONS.CONFIGURACION],
  ["GET verificar ARCA", arcaVerificar.GET, "GET", GET_PERMISSIONS.CONFIGURACION],
  ["PATCH comprobante rechazado", comprobantes.PATCH, "PATCH", SET_PERMISSIONS.VENTAS],
  [
    "POST reprocesar factura",
    (r) => (reprocesar.POST as Handler)(r, { params: Promise.resolve({ id: "1" }) }),
    "POST",
    SET_PERMISSIONS.VENTAS,
  ],
  ["POST reprocesar en lote", bulkReprocesar.POST, "POST", SET_PERMISSIONS.VENTAS],
  ["POST completar onboarding", onboarding.POST, "POST", SET_PERMISSIONS.CONFIGURACION],
  ["PUT nombre del comercio", tenant.PUT, "PUT", SET_PERMISSIONS.CONFIGURACION],
];

describe("permisos de rutas corregidas en la revisión", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getAuthContext).mockRejectedValue(new PermisoError("Permiso denegado", 403));
  });

  it.each(casos)("%s exige %s", async (_nombre, handler, method, permiso) => {
    const res = await handler(req(method));
    expect(res.status).toBe(403);
    expect(vi.mocked(getAuthContext).mock.calls[0][0]).toMatchObject({ permission: permiso });
  });
});
