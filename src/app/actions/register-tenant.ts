"use server";

import prisma from "@/DB/prisma";
import bcrypt from "bcryptjs";

export async function registerTenant(prevState: any, formData: FormData) {
  const adminKey = formData.get("adminKey") as string;
  const storeName = formData.get("storeName") as string;
  const storeEmail = formData.get("storeEmail") as string; // Optional in schema?, let's fill it

  const userFirstName = formData.get("firstName") as string;
  const userLastName = formData.get("lastName") as string;
  const userEmail = formData.get("email") as string;
  const userPassword = formData.get("password") as string;
  const username = formData.get("username") as string;
  const userAddress =
    (formData.get("address") as string) || "Direccion no especificada";
  const userPhone = (formData.get("phone") as string) || "0000000000";

  // Validate Admin Key
  if (!process.env.ADMIN_SECRET_KEY) {
    console.error("ADMIN_SECRET_KEY is not defined in environment variables");
    return {
      success: false,
      message: "Error de configuración del servidor (falta clave secreta)",
    };
  }

  if (adminKey !== process.env.ADMIN_SECRET_KEY) {
    return { success: false, message: "Clave de administrador incorrecta" };
  }

  // Basic Validation
  if (
    !storeName ||
    !userFirstName ||
    !userLastName ||
    !userEmail ||
    !userPassword ||
    !username
  ) {
    return { success: false, message: "Faltan campos obligatorios" };
  }

  try {
    await prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      // Tenant has many fields, but minimum valid: Nombre.
      // We'll add Email, EstaActivo=true.
      const tenant = await tx.tenant.create({
        data: {
          Nombre: storeName,
          Email: storeEmail,
          EstaActivo: true,
          // Optional fields null by default
        },
      });

      // 2. Ensure Localidad exists (Required for Persona)
      // We try to find ANY locality. If not, we create a dummy one hierarchy.
      let localidad = await tx.localidad.findFirst();
      if (!localidad) {
        // Create Province -> Dept -> Localidad
        let provincia = await tx.provincia.findFirst();
        if (!provincia) {
          provincia = await tx.provincia.create({
            data: {
              Descripcion: "Provincia por Defecto",
              EstaEliminado: false,
            },
          });
        }
        let depto = await tx.departamento.findFirst({
          where: { ProvinciaId: provincia.Id },
        });
        if (!depto) {
          depto = await tx.departamento.create({
            data: {
              Descripcion: "Departamento por Defecto",
              ProvinciaId: provincia.Id,
              EstaEliminado: false,
            },
          });
        }
        localidad = await tx.localidad.create({
          data: {
            Descripcion: "Localidad por Defecto",
            DepartamentoId: depto.Id,
            EstaEliminado: false,
          },
        });
      }

      // 3. Create Persona
      const persona = await tx.persona.create({
        data: {
          Nombre: userFirstName,
          Apellido: userLastName,
          Direccion: userAddress,
          Mail: userEmail,
          Telefono: userPhone,
          EstaEliminado: false,
          LocalidadId: localidad.Id,
          TenantId: tenant.Id,
        },
      });

      // 4. Create Persona_Empleado
      // Requires Legajo (Int), Foto (Bytes), Id (Foreign Key to Persona)
      const personaEmpleado = await tx.persona_Empleado.create({
        data: {
          Id: persona.Id, // One-to-one relation sharing ID? Schema: Persona_Empleado.Id references Persona.Id
          Legajo: 1, // First employee
          Foto: Buffer.from(""), // Empty buffer
        },
      });

      // 5. Create Usuario
      const hashedPassword = await bcrypt.hash(userPassword, 10);
      const usuario = await tx.usuario.create({
        data: {
          EmpleadoId: personaEmpleado.Id,
          Nombre: username,
          Password: hashedPassword,
          EstaBloqueado: false,
          EstaEliminado: false,
          TenantId: tenant.Id,
        },
      });

      // 6. Ensure Admin Profile
      let adminProfile = await tx.perfiles.findFirst({
        where: { TenantId: tenant.Id, Descripcion: "Administrador" },
      });

      if (!adminProfile) {
        adminProfile = await tx.perfiles.create({
          data: {
            Descripcion: "Administrador",
            EstaEliminado: false,
            TenantId: tenant.Id,
          },
        });
      }

      // 7. Assign Profile to User
      await tx.perfilUsuario.create({
        data: {
          Perfil_Id: adminProfile.Id,
          Usuario_Id: usuario.Id,
          TenantId: tenant.Id,
        },
      });
    });

    return {
      success: true,
      message: "Tienda y administrador creados exitosamente",
    };
  } catch (error: any) {
    console.error("Error creating tenant:", error);
    return {
      success: false,
      message: "Error al crear la tienda: " + error.message,
    };
  }
}
