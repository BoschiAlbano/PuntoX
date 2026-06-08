import { NextRequest, NextResponse } from "next/server";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { handleError } from "@/lib/errors/handler";
import { getAuthContext } from "@/lib/auth/getAuthUser";

/**
 * GET /api/admin/tenants
 * Obtiene todos los tenants con información resumida
 * Requiere SuperAdmin
 */
export async function GET(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({
      req,
    });

    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const searchParams = req.nextUrl.searchParams;
    const search = searchParams.get("q") || searchParams.get("search") || "";
    const status = searchParams.get("status") || "todos";
    const plan = searchParams.get("plan") || "todos";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    // Construir where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { Nombre: { contains: search, mode: "insensitive" } },
        {
          Configuraciones: {
            some: {
              OR: [
                { Email: { contains: search, mode: "insensitive" } },
                { RazonSocial: { contains: search, mode: "insensitive" } },
              ],
              EstaEliminado: false,
            },
          },
        },
      ];
    }

    if (status !== "todos") {
      where.EstaActivo = status === "activo";
    }

    // Total count for pagination (ignoring skip/take)
    const totalTenants = await prisma.tenant.count({ where });

    // Obtener todos los tenants con su configuración más reciente
    const tenants = await prisma.tenant.findMany({
      where,
      skip,
      take: limit,
      select: {
        Id: true,
        Nombre: true,
        Dominio: true,
        EstaActivo: true,
        OnboardingCompleto: true,
        PlanId: true,
        Plan: {
          select: {
            Nombre: true,
          },
        },
        Configuraciones: {
          where: {
            EstaEliminado: false,
          },
          orderBy: {
            Id: "desc",
          },
          take: 1,
          select: {
            Email: true,
            RazonSocial: true,
          },
        },
        Usuarios: {
          where: {
            EstaEliminado: false,
          },
          select: {
            Id: true,
            Persona_Empleado: {
              select: {
                Persona: {
                  select: {
                    Nombre: true,
                    Apellido: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            Usuarios: {
              where: {
                EstaEliminado: false,
              },
            },
          },
        },
      },
      orderBy: {
        Id: "desc",
      },
    });

    // Obtener perfiles de administrador para cada tenant
    const tenantIds = tenants.map((t) => t.Id);
    const perfilesAdmin = await prisma.perfiles.findMany({
      where: {
        TenantId: { in: tenantIds },
        Tipo: "ADMINISTRADOR" as any,
        EstaEliminado: false,
      },
      include: {
        PerfilUsuario: {
          where: {
            Usuario: {
              EstaEliminado: false,
            },
          },
        },
      },
    });

    // Crear mapa de tenantId -> cantidad de admins
    const adminsMap = new Map<bigint, number>();
    perfilesAdmin.forEach((perfil) => {
      const count = perfil.PerfilUsuario.length;
      adminsMap.set(
        perfil.TenantId,
        (adminsMap.get(perfil.TenantId) || 0) + count,
      );
    });

    // Formatear respuesta
    const formattedTenants = tenants.map((tenant) => {
      const adminsCount = adminsMap.get(tenant.Id) || 0;
      const status = tenant.EstaActivo
        ? "activo"
        : tenant.OnboardingCompleto
          ? "cancelado"
          : "pendiente";
      const configuracion = tenant.Configuraciones[0];

      return {
        id: Number(tenant.Id),
        name: tenant.Nombre,
        email: configuracion?.Email || "",
        razonSocial: configuracion?.RazonSocial || "",
        dominio: tenant.Dominio || "",
        status: status as "activo" | "pendiente" | "cancelado",
        plan: tenant.Plan?.Nombre || "Base",
        stores: 1, // Por ahora siempre 1, se puede calcular después
        admins: adminsCount,
        totalUsers: tenant._count.Usuarios,
        onboardingCompleto: tenant.OnboardingCompleto,
        lastLogin: null, // Se puede agregar después
      };
    });

    // Filtrar por plan si es necesario
    let filteredTenants = formattedTenants;
    if (plan !== "todos") {
      filteredTenants = formattedTenants.filter((t) => t.plan === plan);
    }

    // Calcular totales
    const totals = {
      active: formattedTenants.filter((t) => t.status === "activo").length,
      pending: formattedTenants.filter((t) => !t.onboardingCompleto).length,
      canceled: formattedTenants.filter((t) => t.status === "cancelado").length,
      total: formattedTenants.length,
    };

    return NextResponse.json({
      data: filteredTenants,
      pagination: {
        total: totalTenants,
        page,
        limit,
        totalPages: Math.ceil(totalTenants / limit),
      },
      totals,
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * PATCH /api/admin/tenants
 * Actualiza el estado de un tenant (activar/desactivar)
 * Requiere SuperAdmin
 */
export async function PATCH(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({
      req,
    });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await req.json();
    const { tenantId, action } = body;

    if (!tenantId || !action) {
      return NextResponse.json(
        { error: "tenantId y action son requeridos" },
        { status: 400 },
      );
    }

    const updateData: any = {};

    switch (action) {
      case "activate":
        updateData.EstaActivo = true;
        break;
      case "deactivate":
        updateData.EstaActivo = false;
        break;
      case "completeOnboarding":
        updateData.OnboardingCompleto = true;
        break;
      default:
        return NextResponse.json(
          { error: "Acción no válida" },
          { status: 400 },
        );
    }

    const tenant = await prisma.tenant.update({
      where: { Id: BigInt(tenantId) },
      data: updateData,
      select: {
        Id: true,
        Nombre: true,
        EstaActivo: true,
        OnboardingCompleto: true,
      },
    });

    return NextResponse.json({
      success: true,
      tenant: {
        id: Number(tenant.Id),
        name: tenant.Nombre,
        status: tenant.EstaActivo ? "activo" : "cancelado",
        onboardingCompleto: tenant.OnboardingCompleto,
      },
    });
  } catch (error) {
    return handleError(error);
  }
}

/**
 * DELETE /api/admin/tenants
 * Elimina físicamente un tenant y todos sus datos relacionados
 * Requiere SuperAdmin
 */
export async function DELETE(req: NextRequest) {
  try {
    const { isSuperAdmin } = await getAuthContext({
      req,
    });
    if (!isSuperAdmin) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const tenantIdParam = searchParams.get("id");

    if (!tenantIdParam) {
      return NextResponse.json(
        { error: "ID de tenant requerido" },
        { status: 400 },
      );
    }

    const tenantIdNumber = Number(tenantIdParam);
    if (!Number.isInteger(tenantIdNumber)) {
      return NextResponse.json(
        { error: "ID de tenant inválido" },
        { status: 400 },
      );
    }

    const tenantId = BigInt(tenantIdNumber);

    // Verificar que el tenant existe
    const tenantExistente = await prisma.tenant.findUnique({
      where: { Id: tenantId },
      select: { Id: true, Nombre: true },
    });

    if (!tenantExistente) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 },
      );
    }

    // Primero obtener los AuthUserId de los usuarios antes de eliminarlos
    const usuarios = await prisma.usuario.findMany({
      where: { TenantId: tenantId },
      select: { AuthUserId: true },
    });
    const authUserIds = usuarios.map((u) => u.AuthUserId);

    // Eliminar físicamente todo en una transacción
    await prisma.$transaction(async (tx) => {
      // 1. Obtener IDs de comprobantes y formas de pago para eliminar relaciones
      const comprobantes = await tx.comprobante.findMany({
        where: { TenantId: tenantId },
        select: { Id: true },
      });
      const comprobanteIds = comprobantes.map((c) => c.Id);

      const formasPago = await tx.formaPago.findMany({
        where: { TenantId: tenantId },
        select: { Id: true },
      });
      const formaPagoIds = formasPago.map((fp) => fp.Id);

      const movimientos = await tx.movimiento.findMany({
        where: { TenantId: tenantId },
        select: { Id: true },
      });
      const movimientoIds = movimientos.map((m) => m.Id);

      // 2. Eliminar detalles y relaciones de comprobantes
      await tx.detalleComprobante.deleteMany({
        where: { TenantId: tenantId },
      });

      // 3. Eliminar relaciones de formas de pago
      if (formaPagoIds.length > 0) {
        await tx.formaPago_Tarjeta.deleteMany({
          where: { Id: { in: formaPagoIds } },
        });

        await tx.formaPago_CtaCte.deleteMany({
          where: { Id: { in: formaPagoIds } },
        });

        await tx.formaPago_Cheque.deleteMany({
          where: { Id: { in: formaPagoIds } },
        });
      }

      await tx.formaPago.deleteMany({
        where: { TenantId: tenantId },
      });

      // 4. Eliminar comprobantes relacionados
      if (comprobanteIds.length > 0) {
        await tx.comprobante_NotaCredito.deleteMany({
          where: { Id: { in: comprobanteIds } },
        });

        await tx.comprobante_Remito.deleteMany({
          where: { Id: { in: comprobanteIds } },
        });

        await tx.comprobante_Presupuesto.deleteMany({
          where: { Id: { in: comprobanteIds } },
        });

        await tx.comprobante_Factura.deleteMany({
          where: { Id: { in: comprobanteIds } },
        });

        await tx.comprobante_CuentaCorriente.deleteMany({
          where: { Id: { in: comprobanteIds } },
        });

        await tx.comprobante_CtaCteProveedor.deleteMany({
          where: { Id: { in: comprobanteIds } },
        });

        await tx.comprobante_Compra.deleteMany({
          where: { Id: { in: comprobanteIds } },
        });
      }

      // 5. Eliminar movimientos relacionados
      if (movimientoIds.length > 0) {
        await tx.movimiento_CuentaCorrienteProveedor.deleteMany({
          where: { Id: { in: movimientoIds } },
        });

        await tx.movimiento_CuentaCorriente.deleteMany({
          where: { Id: { in: movimientoIds } },
        });
      }

      await tx.movimiento.deleteMany({
        where: { TenantId: tenantId },
      });

      // 6. Eliminar comprobantes
      await tx.comprobante.deleteMany({
        where: { TenantId: tenantId },
      });

      // 7. Eliminar detalles de caja
      await tx.detalleCaja.deleteMany({
        where: { TenantId: tenantId },
      });

      // 8. Eliminar gastos
      await tx.gasto.deleteMany({
        where: { TenantId: tenantId },
      });

      // 9. Eliminar cajas
      await tx.caja.deleteMany({
        where: { TenantId: tenantId },
      });

      // 10. Eliminar depósitos de cheques
      await tx.depositoCheques.deleteMany({
        where: { TenantId: tenantId },
      });

      // 11. Eliminar cheques
      await tx.cheque.deleteMany({
        where: { TenantId: tenantId },
      });

      // 12. Eliminar cuentas bancarias
      await tx.cuentaBancarias.deleteMany({
        where: { TenantId: tenantId },
      });

      // 13. Eliminar bancos
      await tx.banco.deleteMany({
        where: { TenantId: tenantId },
      });

      // 14. Eliminar bajas de artículos
      await tx.bajaArticulo.deleteMany({
        where: { TenantId: tenantId },
      });

      // 15. Eliminar artículos
      await tx.articulo.deleteMany({
        where: { TenantId: tenantId },
      });

      // 16. Eliminar precios por lista
      await tx.precioLista.deleteMany({
        where: { TenantId: tenantId },
      });

      // 17. Eliminar relaciones usuario-perfil
      await tx.perfilUsuario.deleteMany({
        where: { TenantId: tenantId },
      });

      // 18. Eliminar relaciones perfil-permiso
      await tx.perfilPermiso.deleteMany({
        where: { TenantId: tenantId },
      });

      // 19. Eliminar relaciones formulario-perfil
      await tx.formularioPerfil.deleteMany({
        where: { TenantId: tenantId },
      });

      // 20. Eliminar auditoría de empleados (DEBE ir antes de eliminar usuarios)
      await tx.auditoriaEmpleado.deleteMany({
        where: { TenantId: tenantId },
      });

      // 21. Eliminar usuarios de la base de datos
      await tx.usuario.deleteMany({
        where: { TenantId: tenantId },
      });

      // 22. Obtener IDs de personas para eliminar relaciones
      const personas = await tx.persona.findMany({
        where: { TenantId: tenantId },
        select: { Id: true },
      });
      const personaIds = personas.map((p) => p.Id);

      // 23. Eliminar personas (clientes y empleados)
      if (personaIds.length > 0) {
        await tx.persona_Cliente.deleteMany({
          where: { Id: { in: personaIds } },
        });

        await tx.persona_Empleado.deleteMany({
          where: { Id: { in: personaIds } },
        });
      }

      await tx.persona.deleteMany({
        where: { TenantId: tenantId },
      });

      // 24. Eliminar perfiles (PerfilPermiso se elimina en cascada)
      await tx.perfiles.deleteMany({
        where: { TenantId: tenantId },
      });

      // Nota: Permiso es catálogo global — no se elimina al borrar un tenant

      // 26. Eliminar formularios
      await tx.formularios.deleteMany({
        where: { TenantId: tenantId },
      });

      // 27. Eliminar conceptos de gastos
      await tx.conceptoGastos.deleteMany({
        where: { TenantId: tenantId },
      });

      // 28. Eliminar configuraciones
      await tx.configuracion.deleteMany({
        where: { TenantId: tenantId },
      });

      // 29. Eliminar contadores
      await tx.contador.deleteMany({
        where: { TenantId: tenantId },
      });

      // 30. Eliminar marcas
      await tx.marca.deleteMany({
        where: { TenantId: tenantId },
      });

      // 31. Eliminar motivos de baja
      await tx.motivoBajas.deleteMany({
        where: { TenantId: tenantId },
      });

      // 32. Eliminar proveedores
      await tx.proveedor.deleteMany({
        where: { TenantId: tenantId },
      });

      // 33. Eliminar rubros (PuestoTrabajo fue eliminado)
      await tx.rubro.deleteMany({
        where: { TenantId: tenantId },
      });

      // 35. Eliminar tarjetas
      await tx.tarjeta.deleteMany({
        where: { TenantId: tenantId },
      });

      // 36. Eliminar unidades de medida
      await tx.unidadMedida.deleteMany({
        where: { TenantId: tenantId },
      });


      // 38. Finalmente, eliminar el tenant
      await tx.tenant.delete({
        where: { Id: tenantId },
      });
    });

    // Eliminar usuarios de Supabase Auth (después de la transacción de Prisma)
    if (authUserIds.length > 0) {
      const deletePromises = authUserIds.map((authUserId) =>
        getSupabaseServiceClient().auth.admin.deleteUser(authUserId),
      );

      // Ejecutar todas las eliminaciones en paralelo y capturar errores
      const deleteResults = await Promise.allSettled(deletePromises);

      // Verificar si hubo errores (pero no fallar si algunos usuarios ya no existen)
      const errors = deleteResults.filter(
        (result) => result.status === "rejected",
      );

      if (errors.length > 0) {
        console.warn(
          `Advertencia: No se pudieron eliminar ${errors.length} de ${authUserIds.length} usuarios de Supabase Auth.`,
          errors.map((e) => e.reason),
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: `Tenant "${tenantExistente.Nombre}" y todos sus datos han sido eliminados permanentemente`,
      tenantId: tenantIdNumber,
    });
  } catch (error) {
    return handleError(error);
  }
}
