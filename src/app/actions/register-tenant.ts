"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const registerTenantSchema = z.object({
  tenantName: z.string().min(2),
  tenantEmail: z.string().email().optional().or(z.literal("")),
  adminNombre: z.string().min(1),
  adminApellido: z.string().min(1),
  adminEmail: z.string().email(),
  adminPassword: z.string().min(6),
});

export async function registerTenant(formData: FormData) {
  const parseResult = registerTenantSchema.safeParse({
    tenantName: formData.get("tenantName"),
    tenantEmail: formData.get("tenantEmail"),
    adminNombre: formData.get("adminNombre"),
    adminApellido: formData.get("adminApellido"),
    adminEmail: formData.get("adminEmail"),
    adminPassword: formData.get("adminPassword"),
  });

  if (!parseResult.success) {
    return {
      ok: false as const,
      error: "Datos inválidos en el formulario.",
    };
  }

  const {
    tenantName,
    tenantEmail,
    adminNombre,
    adminApellido,
    adminEmail,
    adminPassword,
  } = parseResult.data;

  try {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: adminEmail,
      password: adminPassword,
      email_confirm: true,
    });

    if (error || !data?.user) {
      console.error("Error creando usuario en Supabase", error);
      return {
        ok: false as const,
        error:
          "No se pudo crear el usuario en Supabase: " +
          (error?.message ?? "error desconocido"),
      };
    }

    const authUserId = data.user.id;
    const LOCALIDAD_DUMMY_ID = BigInt(1000);

    const tenant = await prisma.tenant.create({
      data: {
        Nombre: tenantName,
        Email: tenantEmail && tenantEmail.length > 0 ? tenantEmail : null,
        EstaActivo: true,
      },
    });

    const persona = await prisma.persona.create({
      data: {
        Apellido: adminApellido,
        Nombre: adminNombre,
        Dni: null,
        Direccion: "Sin dirección",
        Telefono: null,
        Mail: adminEmail,
        LocalidadId: LOCALIDAD_DUMMY_ID,
        EstaEliminado: false,
        TenantId: tenant.Id,
      },
    });

    await prisma.persona_Empleado.create({
      data: {
        Id: persona.Id,
        Legajo: 1,
        Foto: Buffer.alloc(0),
      },
    });

    const usuario = await prisma.usuario.create({
      data: {
        EmpleadoId: persona.Id,
        Nombre: adminEmail,
        EstaBloqueado: false,
        EstaEliminado: false,
        AuthUserId: authUserId,
        TenantId: tenant.Id,
      },
    });

    let perfilAdmin = await prisma.perfiles.findFirst({
      where: {
        Descripcion: "Administrador",
        TenantId: tenant.Id,
      },
    });

    if (!perfilAdmin) {
      perfilAdmin = await prisma.perfiles.create({
        data: {
          Descripcion: "Administrador",
          EstaEliminado: false,
          TenantId: tenant.Id,
        },
      });
    }

    await prisma.perfilUsuario.create({
      data: {
        Perfil_Id: perfilAdmin.Id,
        Usuario_Id: usuario.Id,
        TenantId: tenant.Id,
      },
    });

    const deposito = await prisma.deposito.create({
      data: {
        Descripcion: "Depósito principal",
        Ubicacion: "Principal",
        EstaEliminado: false,
        TenantId: tenant.Id,
      },
    });

    await prisma.configuracion.create({
      data: {
        RazonSocial: tenantName,
        NombreFantasia: tenantName,
        Cuit: "00000000000",
        Telefono: null,
        Celular: null,
        Direccion: "Sin dirección",
        Email: tenantEmail && tenantEmail.length > 0 ? tenantEmail : null,
        LocalidadId: LOCALIDAD_DUMMY_ID,
        FacturaDescuentaStock: true,
        PresupuestoDescuentaStock: false,
        RemitoDescuentaStock: true,
        ActualizaCostoDesdeCompra: true,
        ModificaPrecioVentaDesdeCompra: false,
        DepositoId: deposito.Id,
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
        Foto: null,
        ShowFoto: false,
        TenantId: tenant.Id,
      },
    });

    return {
      ok: true as const,
      tenantId: tenant.Id,
      message: "La tienda fue creada con éxito.",
    };
  } catch (err) {
    console.error("Error en registerTenant:", err);
    return {
      ok: false as const,
      error: "Error interno al registrar el comercio.",
    };
  }
}
