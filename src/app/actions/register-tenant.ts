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
    // Creo el usuario en supabase
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

    // transaccion prisma
    const tenant = await prisma.$transaction(async (tx) => {
      // Creo todas las tablas del tenant esta relacionado
      const newTenant = await tx.tenant.create({
        data: {
          Nombre: tenantName,
          EstaActivo: true,
        },
      });

      // Buscar una localidad por defecto (la primera disponible)
      const localidadDefault = await tx.localidad.findFirst({
        orderBy: { Id: "asc" },
      });

      if (!localidadDefault) {
        throw new Error("No hay localidades disponibles en la base de datos. Por favor, configure al menos una localidad.");
      }

      const persona = await tx.persona.create({
        data: {
          Apellido: adminApellido,
          Nombre: adminNombre,
          Dni: null,
          Direccion: "Sin dirección",
          Telefono: null,
          Mail: adminEmail,
          LocalidadId: localidadDefault.Id,
          EstaEliminado: false,
          TenantId: newTenant.Id,
        },
      });

      await tx.persona_Empleado.create({
        data: {
          Id: persona.Id,
          Legajo: 1,
          Foto: Buffer.alloc(0),
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          EmpleadoId: persona.Id,
          Nombre: adminEmail,
          EstaBloqueado: false,
          EstaEliminado: false,
          AuthUserId: authUserId,
          TenantId: newTenant.Id,
        },
      });

      let perfilAdmin = await tx.perfiles.findFirst({
        where: {
          Descripcion: "Administrador",
          TenantId: newTenant.Id,
        },
      });

      if (!perfilAdmin) {
        perfilAdmin = await tx.perfiles.create({
          data: {
            Descripcion: "Administrador",
            Tipo: "ADMINISTRADOR",
            EstaEliminado: false,
            TenantId: newTenant.Id,
          },
        });
      } else if (perfilAdmin.Tipo !== "ADMINISTRADOR") {
        // Asegurar que el perfil existente tenga el tipo correcto
        perfilAdmin = await tx.perfiles.update({
          where: { Id: perfilAdmin.Id },
          data: { Tipo: "ADMINISTRADOR" },
        });
      }

      // Definir los permisos básicos que debe tener un administrador
      const permisosBasicos = [
        { clave: "empleados:admin", descripcion: "Administración completa de empleados" },
        { clave: "ventas", descripcion: "Acceso a ventas" },
        { clave: "caja", descripcion: "Acceso a caja" },
        { clave: "clientes", descripcion: "Acceso a clientes" },
        { clave: "productos", descripcion: "Acceso a productos" },
        { clave: "analiticas", descripcion: "Acceso a analíticas" },
        { clave: "configuracion", descripcion: "Acceso a configuración" },
      ];

      // Crear y asignar todos los permisos básicos al rol de administrador
      for (const permisoData of permisosBasicos) {
        // Crear o actualizar el permiso
        const permiso = await tx.permiso.upsert({
          where: {
            Clave_TenantId: {
              Clave: permisoData.clave,
              TenantId: newTenant.Id,
            },
          },
          update: { EstaEliminado: false },
          create: {
            Clave: permisoData.clave,
            Descripcion: permisoData.descripcion,
            TenantId: newTenant.Id,
            EstaEliminado: false,
          },
        });

        // Verificar si el permiso ya está asignado al perfil
        const permisoAsignado = await tx.perfilPermiso.findFirst({
          where: {
            PerfilId: perfilAdmin.Id,
            PermisoId: permiso.Id,
          },
        });

        // Asignar el permiso al perfil de administrador si no está asignado
        if (!permisoAsignado) {
          await tx.perfilPermiso.create({
            data: {
              PerfilId: perfilAdmin.Id,
              PermisoId: permiso.Id,
              TenantId: newTenant.Id,
            },
          });
        }
      }

      await tx.perfilUsuario.create({
        data: {
          Perfil_Id: perfilAdmin.Id,
          Usuario_Id: usuario.Id,
          TenantId: newTenant.Id,
        },
      });

      await tx.configuracion.create({
        data: {
          RazonSocial: tenantName,
          NombreFantasia: tenantName,
          Cuit: "00000000000",
          Telefono: null,
          Celular: null,
          Direccion: "Sin dirección",
          Email: tenantEmail && tenantEmail.length > 0 ? tenantEmail : null,
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
          Foto: null,
          ShowFoto: false,
          TenantId: newTenant.Id,
        },
      });

      return newTenant;
    });

    // actualizo las metadatos del usuario para guardar el id del tenant
    const { error: metaError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      {
        app_metadata: {
          tenantId: tenant.Id.toString(),
        },
      }
    );

    if (metaError) {
      console.error(
        "Error actualizando meta de usuario en Supabase",
        metaError
      );
      return {
        ok: false as const,
        error:
          "No se pudo actualizar el meta del usuario en Supabase: " +
          (metaError?.message ?? "error desconocido"),
      };
    }

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
