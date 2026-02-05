/**
 * Tests para la API de Auth
 * - POST /api/auth/register: Registro de usuarios
 * - GET /api/auth/me: Obtener información del usuario actual
 * - POST /api/auth/sync-permissions: Sincronizar permisos
 * - POST /api/auth/get-email-by-username: Obtener email por username
 * - POST /api/auth/registrar-intento-login: Registrar intento de login
 * - POST /api/auth/registrar-sesion: Registrar sesión
 *
 * IMPORTANTE: Estos tests NO modifican la implementación de producción.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { POST as RegisterPOST } from "@/app/api/auth/register/route";
import { GET as MeGET } from "@/app/api/auth/me/route";
import { POST as SyncPermissionsPOST } from "@/app/api/auth/sync-permissions/route";
import { POST as GetEmailByUsernamePOST } from "@/app/api/auth/get-email-by-username/route";
import { POST as RegistrarIntentoLoginPOST } from "@/app/api/auth/registrar-intento-login/route";
import { POST as RegistrarSesionPOST } from "@/app/api/auth/registrar-sesion/route";
import prisma from "@/DB/prisma";
import { handleError } from "@/lib/errors/handler";
import { getSupabaseServerClient, getSupabaseServiceClient } from "@/lib/supabase/serverClient";
import { actualizarPermisosEnJWT } from "@/lib/auth/updateUserPermissions";
import { checkRateLimit, isIpBlocked, blockIp } from "@/lib/security/rateLimiter";
import { crearAlertaSeguridad } from "@/lib/security/suspiciousActivity";
import { createMockRequest } from "../utils/mocks";

// Mock de Prisma
vi.mock("@/DB/prisma", () => ({
  default: {
    tenant: {
      findUnique: vi.fn(),
    },
    localidad: {
      findFirst: vi.fn(),
    },
    persona: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    persona_Empleado: {
      create: vi.fn(),
    },
    usuario: {
      findFirst: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
    },
    intentoLogin: {
      create: vi.fn(),
    },
    sesion: {
      findFirst: vi.fn(),
      upsert: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

// Mock de Supabase
vi.mock("@/lib/supabase/serverClient", () => ({
  getSupabaseServerClient: vi.fn(),
  getSupabaseServiceClient: vi.fn(),
}));

// Mock de handleError
vi.mock("@/lib/errors/handler", () => ({
  handleError: vi.fn((error: unknown) => {
    return new Response(JSON.stringify({ error: "Error interno" }), {
      status: 500,
    });
  }),
}));

// Mock de actualizarPermisosEnJWT
vi.mock("@/lib/auth/updateUserPermissions", () => ({
  actualizarPermisosEnJWT: vi.fn(),
}));

// Mock de rate limiter
vi.mock("@/lib/security/rateLimiter", () => ({
  checkRateLimit: vi.fn(),
  isIpBlocked: vi.fn(),
  blockIp: vi.fn(),
}));

// Mock de crearAlertaSeguridad
vi.mock("@/lib/security/suspiciousActivity", () => ({
  crearAlertaSeguridad: vi.fn(),
}));

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createRegisterRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/auth/register", {
      method: "POST",
      body: JSON.stringify(body),
    } as any);

  it("debe retornar 400 cuando faltan campos obligatorios", async () => {
    const req = createRegisterRequest({
      nombre: "Juan",
      // Faltan otros campos
    });
    const response = await RegisterPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Todos los campos obligatorios son requeridos");
  });

  it("debe retornar 400 cuando la contraseña es muy corta", async () => {
    const req = createRegisterRequest({
      nombre: "Juan",
      apellido: "Pérez",
      dni: "12345678",
      direccion: "Calle 1",
      telefono: "1234567890",
      mail: "juan@test.com",
      localidadId: 1,
      nombreUsuario: "juan",
      password: "123", // Muy corta
      tenantId: 1,
    });
    const response = await RegisterPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("La contraseña debe tener al menos 8 caracteres");
  });

  it("debe retornar 400 cuando el tenant no existe", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue(null);

    const req = createRegisterRequest({
      nombre: "Juan",
      apellido: "Pérez",
      dni: "12345678",
      direccion: "Calle 1",
      telefono: "1234567890",
      mail: "juan@test.com",
      localidadId: 1,
      nombreUsuario: "juan",
      password: "password123",
      tenantId: 999,
    });
    const response = await RegisterPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("El Tenant especificado no existe");
  });

  it("debe retornar 400 cuando el email ya está registrado", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Id: BigInt(1),
    } as any);
    vi.mocked(prisma.localidad.findFirst).mockResolvedValue({
      Id: BigInt(1),
      EstaEliminado: false,
    } as any);
    vi.mocked(prisma.persona.findFirst).mockResolvedValue({
      Id: BigInt(1),
      Mail: "juan@test.com",
    } as any);

    const req = createRegisterRequest({
      nombre: "Juan",
      apellido: "Pérez",
      dni: "12345678",
      direccion: "Calle 1",
      telefono: "1234567890",
      mail: "juan@test.com",
      localidadId: 1,
      nombreUsuario: "juan",
      password: "password123",
      tenantId: 1,
    });
    const response = await RegisterPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("El correo electronico ya esta registrado");
  });

  it("debe crear un usuario exitosamente cuando todos los datos son válidos", async () => {
    vi.mocked(prisma.tenant.findUnique).mockResolvedValue({
      Id: BigInt(1),
    } as any);
    vi.mocked(prisma.localidad.findFirst).mockResolvedValue({
      Id: BigInt(1),
      EstaEliminado: false,
    } as any);
    vi.mocked(prisma.persona.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);

    const mockAuthUser = {
      user: {
        id: "auth-user-123",
      },
    };

    vi.mocked(getSupabaseServiceClient).mockReturnValue({
      auth: {
        admin: {
          createUser: vi.fn().mockResolvedValue({
            data: mockAuthUser,
            error: null,
          }),
        },
      },
    } as any);

    const mockPersona = {
      Id: BigInt(100),
      Nombre: "Juan",
      Apellido: "Pérez",
    };

    const mockPersonaEmpleado = {
      Id: BigInt(100),
    };

    const mockUsuario = {
      Id: BigInt(200),
    };

    vi.mocked(prisma.$transaction).mockImplementation(async (fn: any) => {
      const mockTx = {
        persona: {
          create: vi.fn().mockResolvedValue(mockPersona),
        },
        persona_Empleado: {
          create: vi.fn().mockResolvedValue(mockPersonaEmpleado),
        },
        usuario: {
          create: vi.fn().mockResolvedValue(mockUsuario),
        },
      };
      return await fn(mockTx);
    });

    const req = createRegisterRequest({
      nombre: "Juan",
      apellido: "Pérez",
      dni: "12345678",
      direccion: "Calle 1",
      telefono: "1234567890",
      mail: "juan@test.com",
      localidadId: 1,
      nombreUsuario: "juan",
      password: "password123",
      tenantId: 1,
    });
    const response = await RegisterPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("Usuario registrado exitosamente");
    expect(data.userId).toBe(200);
    expect(data.personaId).toBe(100);
  });
});

describe("GET /api/auth/me", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 401 cuando no hay usuario autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: new Error("No autenticado"),
        }),
      },
    } as any);

    const req = createMockRequest("http://localhost:3000/api/auth/me");
    const response = await MeGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("debe retornar información del usuario cuando está autenticado", async () => {
    const mockSupabaseUser = {
      id: "auth-user-123",
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
      },
    } as any);

    const mockDbUser = {
      Id: BigInt(100),
      Nombre: "juan",
      Tenant: {
        Id: BigInt(1),
        Nombre: "Tenant 1",
      },
      Sucursales: [],
      PerfilUsuario: [],
      Persona_Empleado: {
        Persona: {
          Nombre: "Juan",
          Apellido: "Pérez",
          Mail: "juan@test.com",
        },
      },
    };

    vi.mocked(prisma.usuario.findUnique).mockResolvedValue(mockDbUser as any);

    const req = createMockRequest("http://localhost:3000/api/auth/me");
    const response = await MeGET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.Id).toBe(100);
    expect(data.Nombre).toBe("Juan");
    expect(data.Apellido).toBe("Pérez");
  });
});

describe("POST /api/auth/sync-permissions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("debe retornar 401 cuando no hay usuario autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const req = createMockRequest("http://localhost:3000/api/auth/sync-permissions");
    const response = await SyncPermissionsPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("debe sincronizar permisos exitosamente", async () => {
    const mockSupabaseUser = {
      id: "auth-user-123",
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
      },
    } as any);

    vi.mocked(actualizarPermisosEnJWT).mockResolvedValue(undefined);

    const req = createMockRequest("http://localhost:3000/api/auth/sync-permissions");
    const response = await SyncPermissionsPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(actualizarPermisosEnJWT).toHaveBeenCalledWith("auth-user-123");
  });
});

describe("POST /api/auth/get-email-by-username", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createGetEmailRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/auth/get-email-by-username", {
      method: "POST",
      body: JSON.stringify(body),
    } as any);

  it("debe retornar 400 cuando no se proporciona username", async () => {
    const req = createGetEmailRequest({});
    const response = await GetEmailByUsernamePOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Nombre de usuario requerido");
  });

  it("debe retornar 404 cuando el usuario no existe", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue(null);

    const req = createGetEmailRequest({ username: "inexistente" });
    const response = await GetEmailByUsernamePOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe("Usuario no encontrado");
  });

  it("debe retornar el email del usuario cuando existe", async () => {
    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(100),
      Nombre: "juan",
      TenantId: BigInt(1),
      Persona_Empleado: {
        Persona: {
          Mail: "juan@test.com",
          TenantId: BigInt(1),
        },
      },
    } as any);

    const req = createGetEmailRequest({ username: "juan" });
    const response = await GetEmailByUsernamePOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.email).toBe("juan@test.com");
    expect(data.isInternal).toBe(false);
  });
});

describe("POST /api/auth/registrar-intento-login", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createIntentoLoginRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/auth/registrar-intento-login", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Mozilla/5.0",
      },
    } as any);

  it("debe retornar 400 cuando no se proporciona email", async () => {
    const req = createIntentoLoginRequest({});
    const response = await RegistrarIntentoLoginPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email es requerido");
  });

  it("debe registrar un intento de login exitoso", async () => {
    vi.mocked(isIpBlocked).mockResolvedValue(false);
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: true,
      remaining: 5,
      resetAt: new Date(),
    });
    vi.mocked(prisma.intentoLogin.create).mockResolvedValue({
      Id: BigInt(1),
    } as any);

    const req = createIntentoLoginRequest({
      email: "juan@test.com",
      exitoso: true,
      usuarioId: 100,
      tenantId: 1,
    });
    const response = await RegistrarIntentoLoginPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("debe retornar 429 cuando hay demasiados intentos fallidos", async () => {
    vi.mocked(isIpBlocked).mockResolvedValue(false);
    vi.mocked(checkRateLimit).mockResolvedValue({
      allowed: false,
      remaining: 0,
      resetAt: new Date(Date.now() + 15 * 60 * 1000),
    });

    const req = createIntentoLoginRequest({
      email: "juan@test.com",
      exitoso: false,
      motivoFallo: "Contraseña incorrecta",
      tenantId: 1,
    });
    const response = await RegistrarIntentoLoginPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.error).toBeDefined();
    expect(blockIp).toHaveBeenCalled();
    expect(crearAlertaSeguridad).toHaveBeenCalled();
  });
});

describe("POST /api/auth/registrar-sesion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createSesionRequest = (body: any) =>
    new NextRequest("http://localhost:3000/api/auth/registrar-sesion", {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "x-forwarded-for": "192.168.1.1",
        "user-agent": "Mozilla/5.0",
      },
    } as any);

  it("debe retornar 401 cuando no hay usuario autenticado", async () => {
    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: null },
          error: null,
        }),
      },
    } as any);

    const req = createSesionRequest({});
    const response = await RegistrarSesionPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("No autenticado");
  });

  it("debe registrar una sesión exitosamente", async () => {
    const mockSupabaseUser = {
      id: "auth-user-123",
      app_metadata: {
        tenantId: "1",
      },
    };

    vi.mocked(getSupabaseServerClient).mockResolvedValue({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockSupabaseUser },
          error: null,
        }),
      },
    } as any);

    vi.mocked(prisma.usuario.findFirst).mockResolvedValue({
      Id: BigInt(100),
      TenantId: BigInt(1),
    } as any);

    vi.mocked(prisma.sesion.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.sesion.upsert).mockResolvedValue({
      Id: BigInt(1),
    } as any);

    const req = createSesionRequest({
      token: "token-123",
      dispositivo: "Desktop",
      ubicacion: "Buenos Aires",
      esConfiable: true,
    });
    const response = await RegistrarSesionPOST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
