import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/configuracion/seguridad/intentos-sospechosos/route";
import { getAuthContext } from "@/lib/auth/getAuthUser";
import { PERMISSIONS } from "@/lib/auth/permissions";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { createMockRequest } from "../utils/mocks";

vi.mock("@/lib/auth/getAuthUser", () => ({
  getAuthContext: vi.fn(),
}));

vi.mock("@/DB/prisma", () => ({
  default: {
    $queryRawUnsafe: vi.fn(),
  },
}));

vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }),
}));

describe("GET /api/configuracion/seguridad/intentos-sospechosos", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 401 cuando el contexto autenticado no trae tenantId", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: null } as any);

    const req = createMockRequest(
      "http://localhost:3000/api/configuracion/seguridad/intentos-sospechosos"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(getAuthContext).toHaveBeenCalledWith({
      req,
      permission: PERMISSIONS.CONFIGURACION,
    });
    expect(response.status).toBe(401);
    expect(data.error).toBe("No autenticado");
    expect(prisma.$queryRawUnsafe).not.toHaveBeenCalled();
  });

  it("debe devolver alertas y estadisticas en un escenario real de actividad sospechosa", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: "10" } as any);

    const ultimoCritico = new Date("2026-02-04T10:15:00.000Z");
    const ultimoAdvertencia = new Date("2026-02-04T09:20:00.000Z");
    const intentoReciente = new Date("2026-02-04T10:30:00.000Z");
    const intentoAnterior = new Date("2026-02-04T08:45:00.000Z");

    vi.mocked(prisma.$queryRawUnsafe)
      .mockResolvedValueOnce([
        { IpAddress: "10.0.0.1", count: BigInt(12), ultimoIntento: ultimoCritico },
        {
          IpAddress: "200.8.7.6",
          count: BigInt(4),
          ultimoIntento: ultimoAdvertencia,
        },
      ] as any)
      .mockResolvedValueOnce([
        { IpAddress: "10.0.0.1", count: BigInt(6) },
        { IpAddress: "200.8.7.6", count: BigInt(3) },
      ] as any)
      .mockResolvedValueOnce([{ count: BigInt(6) }] as any)
      .mockResolvedValueOnce([
        {
          Id: BigInt(101),
          FechaIntento: intentoReciente,
          IpAddress: "10.0.0.1",
          Exitoso: false,
          UsuarioId: BigInt(7),
          UsuarioNombre: "Ana Seguridad",
        },
        {
          Id: BigInt(100),
          FechaIntento: intentoAnterior,
          IpAddress: "200.8.7.6",
          Exitoso: false,
          UsuarioId: null,
          UsuarioNombre: null,
        },
      ] as any);

    const req = createMockRequest(
      "http://localhost:3000/api/configuracion/seguridad/intentos-sospechosos"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.$queryRawUnsafe).toHaveBeenCalledTimes(4);

    expect(data.sospechosos).toEqual([
      {
        ipAddress: "10.0.0.1",
        intentos24Horas: 12,
        ultimoIntento: ultimoCritico.toISOString(),
        esCritico: true,
      },
      {
        ipAddress: "200.8.7.6",
        intentos24Horas: 4,
        ultimoIntento: ultimoAdvertencia.toISOString(),
        esCritico: false,
      },
    ]);

    const tiposAlerta = data.alertas.map((alerta: any) => alerta.titulo);
    expect(tiposAlerta).toContain("Múltiples intentos fallidos desde la misma IP");
    expect(tiposAlerta).toContain("Actividad sospechosa en la última hora");
    expect(tiposAlerta).toContain("Intentos desde múltiples ubicaciones");

    expect(data.ultimosIntentos).toEqual([
      {
        id: 101,
        fecha: intentoReciente.toISOString(),
        ipAddress: "10.0.0.1",
        usuarioNombre: "Ana Seguridad",
        usuarioId: 7,
      },
      {
        id: 100,
        fecha: intentoAnterior.toISOString(),
        ipAddress: "200.8.7.6",
        usuarioNombre: null,
        usuarioId: null,
      },
    ]);

    expect(data.estadisticas).toEqual({
      ipsUnicasUltimaHora: 6,
      intentosFallidos24Horas: 2,
    });
  });

  it("debe delegar en handleError cuando falla una consulta", async () => {
    vi.mocked(getAuthContext).mockResolvedValue({ tenantId: "10" } as any);
    const dbError = new Error("Fallo DB");
    vi.mocked(prisma.$queryRawUnsafe).mockRejectedValue(dbError);

    const req = createMockRequest(
      "http://localhost:3000/api/configuracion/seguridad/intentos-sospechosos"
    );
    const response = await GET(req as any);
    const data = await response.json();

    expect(handleError).toHaveBeenCalledWith(dbError);
    expect(response.status).toBe(500);
    expect(data.error).toBe("Error interno");
  });
});
