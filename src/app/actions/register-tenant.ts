"use server";

import { z } from "zod";
import prisma from "@/DB/prisma";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { actualizarPermisosEnJWT } from "@/lib/auth/updateUserPermissions";
import { requireSuperAdminServer } from "@/lib/requireSuperAdmin";
import { PerfilTipo, Prisma } from "../../../prisma/generated/prisma";
import { consumidorFinalSchema } from "@/lib/validations/consumidorFinal.schema";
// Helper para convertir cadenas vacías a undefined
const emptyStringToUndefined = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  z.string().min(2).optional(),
);

const registerTenantSchema = z.object({
  tenantName: z.string().min(2),
  tenantEmail: z.union([z.string().email(), z.literal("")]).optional(),
  adminNombre: z.string().min(1),
  adminApellido: z.string().min(1),
  adminEmail: z.string().email(),
  adminUsername: emptyStringToUndefined, // Opcional: se genera desde email si no se proporciona
  adminPassword: z.string().min(6),
  planId: z.coerce.number().positive("Debe seleccionar un plan válido"),
  // Campos alternativos del otro formulario
  storeName: z.string().min(2).optional(),
  storeEmail: z.union([z.string().email(), z.literal("")]).optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  username: emptyStringToUndefined,
  password: z.string().min(6).optional(),
});

export async function registerTenant(formData: FormData) {
  // Verificar que solo SuperAdmin pueda crear tenants
  try {
    await requireSuperAdminServer({ redirectUrl: "/signin" });
  } catch (error) {
    console.error(error);
    return {
      ok: false as const,
      error: "Solo los SuperAdmin pueden crear nuevos tenants.",
    };
  }

  // Helper para obtener valores del formData y convertir null/empty a undefined
  const getValue = (key: string, altKey?: string): string | undefined => {
    const value = formData.get(key) || (altKey ? formData.get(altKey) : null);
    const strValue = value ? String(value).trim() : "";
    return strValue.length > 0 ? strValue : undefined;
  };

  // Manejar ambos formatos de formulario
  const rawData = {
    tenantName: getValue("tenantName", "storeName"),
    tenantEmail: getValue("tenantEmail", "storeEmail") || "",
    adminNombre: getValue("adminNombre", "firstName"),
    adminApellido: getValue("adminApellido", "lastName"),
    adminEmail: getValue("adminEmail", "email"),
    adminUsername: getValue("adminUsername", "username") || "",
    adminPassword: getValue("adminPassword", "password"),
    planId: getValue("planId"),
    // Campos alternativos
    storeName: getValue("storeName"),
    storeEmail: getValue("storeEmail") || "",
    firstName: getValue("firstName"),
    lastName: getValue("lastName"),
    email: getValue("email"),
    username: getValue("username") || "",
    password: getValue("password"),
  };

  const parseResult = registerTenantSchema.safeParse(rawData);

  if (!parseResult.success) {
    const errorIssues = parseResult.error.issues || [];
    console.error("Error de validación:", JSON.stringify(errorIssues, null, 2));
    const firstError = errorIssues[0];
    const errorMessage = firstError
      ? `Error en ${firstError.path.join(".")}: ${firstError.message}`
      : "Datos inválidos en el formulario.";

    return {
      ok: false as const,
      error: errorMessage,
    };
  }

  const {
    tenantName,
    tenantEmail,
    adminNombre,
    adminApellido,
    adminEmail,
    adminUsername,
    adminPassword,
    planId,
  } = parseResult.data;

  // Generar username desde email si no se proporciona
  // Normalizar: lowercase, sin espacios, solo caracteres permitidos
  const usernameRaw =
    adminUsername && adminUsername.trim().length > 0
      ? adminUsername
      : adminEmail.split("@")[0];
  const usernameFinal = usernameRaw
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "") // Eliminar espacios
    .replace(/[^a-z0-9._-]/g, ""); // Solo permitir letras, números, punto, guion bajo y guion

  try {
    // Creo el usuario en supabase
    const { data, error } =
      await getSupabaseServiceClient().auth.admin.createUser({
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
      // Obtener el plan para decidir si lleva fecha de vencimiento
      const selectedPlan = await tx.planSaaS.findUnique({ where: { Id: planId } });
      let fechaVencimiento: Date | null = null;
      if (selectedPlan && selectedPlan.Nombre !== "Plan Ilimitado") {
        fechaVencimiento = new Date();
        fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
      }

      // Creo todas las tablas del tenant esta relacionado
      const newTenant = await tx.tenant.create({
        data: {
          Nombre: tenantName,
          EstaActivo: true,
          PlanId: planId,
          FechaVencimiento: fechaVencimiento,
        },
      });

      // Crear Sucursal "Casa Central"
      const sucursalCentral = await tx.sucursal.create({
        data: {
          TenantId: newTenant.Id,
          Nombre: "Casa Central",
          EsPrincipal: true,
          EstaActiva: true,
          EstaEliminado: false,
          Direccion: "Sin dirección",
        },
      });

      // Buscar una localidad por defecto (la primera disponible)
      const localidadDefault = await tx.localidad.findFirst({
        orderBy: { Id: "asc" },
      });

      if (!localidadDefault) {
        throw new Error(
          "No hay localidades disponibles en la base de datos. Por favor, configure al menos una localidad.",
        );
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
          Foto: null,
        },
      });

      // Verificar que el username no esté en uso
      const existingUsername = await tx.usuario.findFirst({
        where: {
          Nombre: usernameFinal,
          TenantId: newTenant.Id,
          EstaEliminado: false,
        },
      });

      if (existingUsername) {
        throw new Error(
          `El nombre de usuario "${usernameFinal}" ya está en uso. Por favor, elige otro.`,
        );
      }

      const usuario = await tx.usuario.create({
        data: {
          EmpleadoId: persona.Id,
          Nombre: usernameFinal,
          EstaBloqueado: false,
          EstaEliminado: false,
          AuthUserId: authUserId,
          TenantId: newTenant.Id,
        },
      });

      // Asignar sucursal al usuario
      await tx.usuarioSucursal.create({
        data: {
          UsuarioId: usuario.Id,
          SucursalId: sucursalCentral.Id,
          TenantId: newTenant.Id,
          EsDefault: true,
        },
      });

      // Crear Cliente "Consumidor Final" por defecto
      let condicionIvaCF = await tx.condicionIva.findFirst({
        where: {
          Descripcion: { contains: "Consumidor Final", mode: "insensitive" },
        },
      });

      if (!condicionIvaCF) {
        condicionIvaCF = await tx.condicionIva.findFirst();
      }

      if (condicionIvaCF) {
        const consumidorFinal = await tx.persona.create({
          data: {
            ...consumidorFinalSchema,
            LocalidadId: localidadDefault.Id,
            EstaEliminado: false,
            TenantId: newTenant.Id,
          },
        });

        await tx.persona_Cliente.create({
          data: {
            Id: consumidorFinal.Id,
            CondicionIvaId: condicionIvaCF.Id,
            ActivarCtaCte: false,
            TieneLimiteCompra: false,
            MontoMaximoCtaCte: new Prisma.Decimal(0),
          },
        });
      }

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
            Tipo: PerfilTipo.ADMINISTRADOR,
            EstaEliminado: false,
            TenantId: newTenant.Id,
          },
        });
      } else if (perfilAdmin.Tipo !== PerfilTipo.ADMINISTRADOR) {
        // Asegurar que el perfil existente tenga el tipo correcto
        perfilAdmin = await tx.perfiles.update({
          where: { Id: perfilAdmin.Id },
          data: { Tipo: PerfilTipo.ADMINISTRADOR },
        });
      }

      // El perfil Administrador tiene acceso completo por su Tipo — no necesita permisos explícitos
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

    // Actualizar app_metadata con tenantId
    const { error: metaError } =
      await getSupabaseServiceClient().auth.admin.updateUserById(authUserId, {
        app_metadata: {
          tenantId: tenant.Id.toString(),
        },
      });

    if (metaError) {
      console.error(
        "Error actualizando meta de usuario en Supabase",
        metaError,
      );
      return {
        ok: false as const,
        error:
          "No se pudo actualizar el meta del usuario en Supabase: " +
          (metaError?.message ?? "error desconocido"),
      };
    }

    // Sincronizar permisos al JWT: detecta PerfilTipo.ADMINISTRADOR y escribe isAdministrador: true
    await actualizarPermisosEnJWT(authUserId);

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
