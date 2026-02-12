/**
 * Tests para registrarAuditoria.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { registrarAuditoria } from "./registrarAuditoria";
import prisma from "@/DB/prisma";

vi.mock("@/DB/prisma", () => ({
  default: {
    auditoriaEmpleado: { create: vi.fn().mockResolvedValue({}) },
  },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn().mockResolvedValue({
    get: vi.fn((name: string) =>
      name === "x-forwarded-for" ? "127.0.0.1" : name === "user-agent" ? "Mozilla" : null
    ),
  }),
}));

describe("registrarAuditoria", () => {
  beforeEach(() => vi.clearAllMocks());

  it("registra auditoría con campos mínimos", async () => {
    await registrarAuditoria({
      tenantId: 1,
      usuarioId: 1,
      accion: "CREAR_USUARIO",
    });
    expect(prisma.auditoriaEmpleado.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        TenantId: 1n,
        UsuarioId: 1n,
        Accion: "CREAR_USUARIO",
        Severidad: "INFO",
        EmpleadoId: null,
        UsuarioAfectadoId: null,
        Detalle: null,
        ValorAnterior: null,
        ValorNuevo: null,
      }),
    });
  });

  it("registra auditoría con todos los campos", async () => {
    const req = new NextRequest("http://localhost", {
      headers: { "x-forwarded-for": "1.2.3.4", "user-agent": "Chrome" },
    });
    await registrarAuditoria({
      tenantId: 1,
      usuarioId: 1,
      accion: "CAMBIAR_ROL",
      severidad: "WARNING",
      empleadoId: 2,
      usuarioAfectadoId: 2,
      detalle: "Rol cambiado de Vendedor a Admin",
      valorAnterior: { rol: "Vendedor" },
      valorNuevo: { rol: "Admin" },
      req,
    });
    expect(prisma.auditoriaEmpleado.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        TenantId: 1n,
        UsuarioId: 1n,
        Accion: "CAMBIAR_ROL",
        Severidad: "WARNING",
        EmpleadoId: 2n,
        UsuarioAfectadoId: 2n,
        Detalle: "Rol cambiado de Vendedor a Admin",
        ValorAnterior: JSON.stringify({ rol: "Vendedor" }),
        ValorNuevo: JSON.stringify({ rol: "Admin" }),
        IpAddress: "1.2.3.4",
        UserAgent: "Chrome",
      }),
    });
  });

  it("infiere CRITICAL para ELIMINAR_USUARIO", async () => {
    await registrarAuditoria({
      tenantId: 1,
      usuarioId: 1,
      accion: "ELIMINAR_USUARIO",
    });
    expect(prisma.auditoriaEmpleado.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        Severidad: "CRITICAL",
      }),
    });
  });

  it("infiere WARNING para SUSPENDER_USUARIO", async () => {
    await registrarAuditoria({
      tenantId: 1,
      usuarioId: 1,
      accion: "SUSPENDER_USUARIO",
    });
    expect(prisma.auditoriaEmpleado.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        Severidad: "WARNING",
      }),
    });
  });
});
