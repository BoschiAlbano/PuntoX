"use server";

import prisma from "@/DB/prisma";
import { getAuthUser } from "@/lib/auth/getAuthUser";

export type PerfilNegocioDTO = {
  existsConfiguracion: boolean;
  nombre: string;
  razonSocial: string;
  correo: string;
  telefono: string;
  dominio: string;
  cuit: string;
};

export type SavePerfilNegocioInput = {
  nombre: string;
  razonSocial: string;
  correo: string;
  telefono: string;
  dominio: string;
  cuit: string;
};

const LOCALIDAD_DUMMY_ID = 2014010;

/**
 * Obtiene los datos del perfil del negocio (Tenant + Configuracion vigente)
 */
export async function getPerfilNegocio(): Promise<PerfilNegocioDTO> {
  const { tenantId, error } = await getAuthUser();

  if (error || !tenantId) {
    throw new Error("No autenticado");
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
      throw new Error("Tenant no encontrado");
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

    return {
      existsConfiguracion: !!configuracion,
      nombre: tenant.Nombre || "",
      razonSocial: configuracion?.RazonSocial || "",
      correo: configuracion?.Email || "",
      telefono: configuracion?.Telefono || "",
      dominio: tenant.Dominio || "",
      cuit: configuracion?.Cuit || "",
    };
  } catch (error: any) {
    console.error("Error obteniendo perfil del negocio:", error);
    throw new Error(
      error?.message || "No se pudo obtener el perfil del negocio"
    );
  }
}

/**
 * Guarda los datos del perfil del negocio
 * - Actualiza Tenant (Nombre, Dominio)
 * - Actualiza o crea Configuracion (RazonSocial, Cuit, Email, Telefono)
 */
export async function savePerfilNegocio(
  input: SavePerfilNegocioInput
): Promise<{ success: boolean; error?: string }> {
  const { tenantId, error } = await getAuthUser();

  if (error || !tenantId) {
    return {
      success: false,
      error: "No autenticado",
    };
  }

  try {
    // Actualizar Tenant
    await prisma.tenant.update({
      where: { Id: BigInt(tenantId) },
      data: {
        Nombre: input.nombre,
        Dominio: input.dominio || null,
      },
    });

    // Buscar Configuracion vigente
    const configuracionVigente = await prisma.configuracion.findFirst({
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
      await prisma.configuracion.update({
        where: { Id: configuracionVigente.Id },
        data: {
          RazonSocial: input.razonSocial,
          Cuit: input.cuit,
          Email: input.correo || null,
          Telefono: input.telefono || null,
        },
      });
    } else {
      // Crear Configuracion mínima válida
      await prisma.configuracion.create({
        data: {
          TenantId: BigInt(tenantId),
          RazonSocial: input.razonSocial,
          Cuit: input.cuit,
          Email: input.correo || null,
          Telefono: input.telefono || null,
          Direccion: "SIN DEFINIR",
          LocalidadId: BigInt(LOCALIDAD_DUMMY_ID),
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
        },
      });
    }

    return { success: true };
  } catch (error: any) {
    console.error("Error guardando perfil del negocio:", error);
    return {
      success: false,
      error: error?.message || "No se pudo guardar el perfil del negocio",
    };
  }
}

