import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServerClient } from "@/lib/supabase/serverClient";
import { handleError } from "@/lib/errors/handler";

const savePerfilSchema = z.object({
  nombre: z.string().min(1, "Nombre requerido"),
  razonSocial: z.string().min(1, "Razón social requerida"),
  correo: z.string().email().optional().nullable(),
  telefono: z.string().optional().nullable(),
  dominio: z.string().optional().nullable(),
  cuit: z.string().min(1, "CUIT requerido").max(13, "CUIT inválido"),
});

async function resolveTenantId() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tenantId = user?.user_metadata?.tenantId;
  return tenantId ? Number(tenantId) : null;
}


export async function GET() {
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return NextResponse.json(
      { error: "No autenticado", code: "TENANT_MISSING" },
      { status: 401 }
    );
  }

  try {
    // Obtener Tenant
    const tenant = await prisma.tenant.findUnique({
      where: { Id: BigInt(tenantId) },
      select: {
        Nombre: true,
        Dominio: true,
      },
    });

    if (!tenant) {
      return NextResponse.json(
        { error: "Tenant no encontrado" },
        { status: 404 }
      );
    }

    // Obtener Configuracion vigente (la más reciente no eliminada)
    const configuracion = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      orderBy: {
        Id: "desc",
      },
      select: {
        RazonSocial: true,
        Cuit: true,
        Email: true,
        Telefono: true,
      },
    });

    return NextResponse.json(
      {
        existsConfiguracion: !!configuracion,
        nombre: tenant.Nombre || "",
        razonSocial: configuracion?.RazonSocial || "",
        correo: configuracion?.Email || "",
        telefono: configuracion?.Telefono || "",
        dominio: tenant.Dominio || "",
        cuit: configuracion?.Cuit || "",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

export async function PUT(req: NextRequest) {
  const tenantId = await resolveTenantId();
  if (!tenantId) {
    return NextResponse.json(
      { error: "No autenticado", code: "TENANT_MISSING" },
      { status: 401 }
    );
  }

  const json = await req.json().catch(() => null);
  const parsed = savePerfilSchema.safeParse(json);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos", details: parsed.error.issues },
      { status: 400 }
    );
  }

  const data = parsed.data;

  try {
    // Usar transacción para asegurar atomicidad (actualiza Tenant y Configuracion)
    await prisma.$transaction(async (tx) => {
      // Actualizar Tenant
      await tx.tenant.update({
        where: { Id: BigInt(tenantId) },
        data: {
          Nombre: data.nombre,
          Dominio: data.dominio || null,
        },
      });

      // Buscar Configuracion vigente
      const configuracionVigente = await tx.configuracion.findFirst({
        where: {
          TenantId: BigInt(tenantId),
          EstaEliminado: false,
        },
        orderBy: {
          Id: "desc",
        },
      });

      if (configuracionVigente) {
        // Actualizar Configuracion existente
        await tx.configuracion.update({
          where: { Id: configuracionVigente.Id },
          data: {
            RazonSocial: data.razonSocial,
            Cuit: data.cuit,
            Email: data.correo || null,
            Telefono: data.telefono || null,
          },
        });
      } else {
        // Crear Configuracion mínima válida
        await tx.configuracion.create({
          data: {
            TenantId: BigInt(tenantId),
            RazonSocial: data.razonSocial,
            Cuit: data.cuit,
            Email: data.correo || null,
            Telefono: data.telefono || null,
            Direccion: "SIN DEFINIR",
            LocalidadId: null,
            FacturaDescuentaStock: true,
            PresupuestoDescuentaStock: false,
            RemitoDescuentaStock: true,
            ActualizaCostoDesdeCompra: true,
            ModificaPrecioVentaDesdeCompra: false,
            Imprimir: false,
            Instalada: 1,
            TipoFormaPagoPorDefectoVenta: 0,
            TipoFormaPagoPorDefectoCompra: 0,
            ObservacionEnPieFactura: null,
            UnificarRenglonesIngresarMismoProducto: true,
            IngresoManualCajaInicial: false,
            PuestoCajaSeparado: false,
            ActivarRetiroDeCaja: false,
            MontoMaximoRetiroCaja: 0,
            ActivarBascula: false,
            EtiquetaPorPeso: false,
            CodigoBascula: null,
            EstaEliminado: false,
            ShowFoto: false,
            MostrarPreciosConIva: true,
            AbrirCajonEfectivo: true,
            NumerarPedidosPantalla: true,
          },
        });
      }
    });

    // Retornar datos actualizados (fuera de la transacción para evitar bloqueos)
    const tenant = await prisma.tenant.findUnique({
      where: { Id: BigInt(tenantId) },
      select: {
        Nombre: true,
        Dominio: true,
      },
    });

    const configuracion = await prisma.configuracion.findFirst({
      where: {
        TenantId: BigInt(tenantId),
        EstaEliminado: false,
      },
      orderBy: {
        Id: "desc",
      },
      select: {
        RazonSocial: true,
        Cuit: true,
        Email: true,
        Telefono: true,
      },
    });

    return NextResponse.json(
      {
        existsConfiguracion: !!configuracion,
        nombre: tenant?.Nombre || "",
        razonSocial: configuracion?.RazonSocial || "",
        correo: configuracion?.Email || "",
        telefono: configuracion?.Telefono || "",
        dominio: tenant?.Dominio || "",
        cuit: configuracion?.Cuit || "",
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    return handleError(error);
  }
}

