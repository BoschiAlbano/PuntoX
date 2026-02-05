import db from "@/DB/prisma";
import { Iva } from "../prisma/generated/prisma";
import { Decimal } from "./generated/prisma/runtime/library";
import * as fs from "fs";
import * as path from "path";
import { getSupabaseServiceClient } from "@/lib/supabase/serviceClient";
import { PerfilTipo, Prisma } from "./generated/prisma";
// Condiciones de IVA estándar de Argentina
const condicionesIva = [
  "Responsable Inscripto",
  "Monotributista",
  "Exento",
  "No Responsable",
  "Consumidor Final",
];

const ivas: Iva[] = [
  {
    Descripcion: "21",
    Porcentaje: Decimal(21),
    EstaEliminado: false,
    Id: BigInt(1),
  },
  {
    Descripcion: "10,5",
    Porcentaje: Decimal(10.5),
    EstaEliminado: false,
    Id: BigInt(2),
  },
];

async function seedProvincias() {
  console.log("🌱 Cargando provincias desde JSON...");

  const jsonPath = path.join(__dirname, "json", "provincias.json");

  // Leer el archivo JSON
  const jsonContent = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(jsonContent);

  // Preparar todos los datos para inserción en lote
  const provinciasData = data.provincias
    .filter((prov: any) => prov.id && prov.nombre)
    .map((prov: any) => ({
      Id: BigInt(prov.id),
      Descripcion: prov.nombre,
      EstaEliminado: false,
    }));

  console.log(
    `📦 Preparadas ${provinciasData.length} provincias para insertar...`,
  );

  try {
    // Inserción en lote - mucho más rápido
    const result = await db.provincia.createMany({
      data: provinciasData,
      skipDuplicates: true,
    });

    console.log("✨ Seed de provincias completado!");
    console.log(`✅ Total insertadas: ${result.count}`);
  } catch (error) {
    console.error("❌ Error al cargar provincias:", error);
    throw error;
  }
}
async function seedDepartamentos() {
  console.log("🌱 Cargando departamentos desde JSON...");

  const jsonPath = path.join(__dirname, "json", "departamentos.json");

  // Leer el archivo JSON
  const jsonContent = fs.readFileSync(jsonPath, "utf-8");
  const data = JSON.parse(jsonContent);

  // Preparar todos los datos para inserción en lote
  const departamentosData = data.departamentos
    .filter((dep: any) => dep.id && dep.nombre && dep.provincia?.id)
    .map((dep: any) => ({
      Id: BigInt(dep.id),
      ProvinciaId: BigInt(dep.provincia.id),
      Descripcion: dep.nombre,
      EstaEliminado: false,
    }));

  console.log(
    `� Preparados ${departamentosData.length} departamentos para insertar...`,
  );

  try {
    // Inserción en lote - mucho más rápido
    const result = await db.departamento.createMany({
      data: departamentosData,
      skipDuplicates: true, // Omitir duplicados si existen
    });

    console.log("✨ Seed de departamentos completado!");
    console.log(`✅ Total insertados: ${result.count}`);
  } catch (error) {
    console.error("❌ Error al cargar departamentos:", error);
    throw error;
  }
}
async function seedLocalidades() {
  console.log("🌱 Cargando localidades desde CSV...");
  console.log(
    "⚠️ Este proceso puede tardar un momento debido a la cantidad de datos (~4000 registros)",
  );

  const csvPath = path.join(__dirname, "excel", "localidades.csv");

  // Leer el archivo CSV
  const csvContent = fs.readFileSync(csvPath, "utf-8");
  const lines = csvContent.split("\n");

  // Función para parsear una línea CSV correctamente
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  // Preparar todos los datos en memoria
  const localidadesData: Array<{
    Id: bigint;
    DepartamentoId: bigint;
    Descripcion: string;
    EstaEliminado: boolean;
  }> = [];

  // Saltar la primera línea (encabezados) y procesar cada línea
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();

    // Ignorar líneas vacías
    if (!line) continue;

    // Parsear la línea CSV
    const values = parseCSVLine(line);

    // Extraer los campos necesarios
    // Según el CSV: categoria, centroide_lat, centroide_lon, DepartamentoId, departamento_nombre, fuente, Id, localidad_censal_id, localidad_censal_nombre, municipio_id, municipio_nombre, Descripcion, provincia_id, provincia_nombre
    const id = values[6]; // Id
    const departamentoId = values[3]; // DepartamentoId
    const descripcion = values[11]; // Descripcion

    // Validar que tengamos los datos necesarios
    if (id && descripcion && departamentoId) {
      localidadesData.push({
        Id: BigInt(id),
        DepartamentoId: BigInt(departamentoId),
        Descripcion: descripcion,
        EstaEliminado: false,
      });
    }
  }

  console.log(
    `📦 Preparadas ${localidadesData.length} localidades para insertar...`,
  );

  try {
    // Inserción en lote - mucho más rápido que insertar una por una
    const result = await db.localidad.createMany({
      data: localidadesData,
      skipDuplicates: true,
    });

    console.log("✨ Seed de localidades completado!");
    console.log(`✅ Total insertadas: ${result.count}`);
  } catch (error) {
    console.error("❌ Error al cargar localidades:", error);
    throw error;
  }
}
async function seedSuperAdmin() {
  console.log("🌱 Creando usuario SuperAdmin...");

  // Datos del SuperAdmin
  const SUPER_ADMIN_EMAIL = "superadmin@puntox.com.ar";
  const SUPER_ADMIN_PASSWORD = "12345678";
  const SUPER_ADMIN_USERNAME = "superadmin";
  const TENANT_NAME = "PuntoX - Administración";

  try {
    // Verificar si ya existe un SuperAdmin
    const existingSuperAdmin = await db.usuario.findFirst({
      where: {
        Nombre: SUPER_ADMIN_USERNAME,
        EstaEliminado: false,
      },
    });

    if (existingSuperAdmin) {
      console.log("⚠️ Ya existe un usuario SuperAdmin, omitiendo creación...");
      return;
    }

    // Crear usuario en Supabase
    const { data, error } =
      await getSupabaseServiceClient().auth.admin.createUser({
        email: SUPER_ADMIN_EMAIL,
        password: SUPER_ADMIN_PASSWORD,
        email_confirm: true,
      });

    if (error || !data?.user) {
      console.error("❌ Error creando usuario en Supabase:", error);
      throw new Error(
        "No se pudo crear el usuario en Supabase: " +
          (error?.message ?? "error desconocido"),
      );
    }

    const authUserId = data.user.id;
    console.log("✅ Usuario creado en Supabase");

    // Transacción Prisma para crear todas las entidades relacionadas
    const tenant = await db.$transaction(async (tx) => {
      // Crear Tenant
      const newTenant = await tx.tenant.create({
        data: {
          Nombre: TENANT_NAME,
          EstaActivo: true,
        },
      });
      console.log("✅ Tenant creado");

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
      console.log("✅ Sucursal creada");

      // Buscar una localidad por defecto
      const localidadDefault = await tx.localidad.findFirst({
        orderBy: { Id: "asc" },
      });

      if (!localidadDefault) {
        throw new Error(
          "No hay localidades disponibles. Ejecute primero el seed de localidades.",
        );
      }

      // Crear Persona
      const persona = await tx.persona.create({
        data: {
          Apellido: "Admin",
          Nombre: "Super",
          Dni: null,
          Direccion: "Sin dirección",
          Telefono: null,
          Mail: SUPER_ADMIN_EMAIL,
          LocalidadId: localidadDefault.Id,
          EstaEliminado: false,
          TenantId: newTenant.Id,
        },
      });
      console.log("✅ Persona creada");

      // Crear Empleado
      await tx.persona_Empleado.create({
        data: {
          Id: persona.Id,
          Legajo: 1,
          Foto: Buffer.alloc(0),
        },
      });
      console.log("✅ Empleado creado");

      // Crear Usuario
      const usuario = await tx.usuario.create({
        data: {
          EmpleadoId: persona.Id,
          Nombre: SUPER_ADMIN_USERNAME,
          EstaBloqueado: false,
          EstaEliminado: false,
          AuthUserId: authUserId,
          TenantId: newTenant.Id,
        },
      });
      console.log("✅ Usuario creado");

      // Asignar sucursal al usuario
      await tx.usuarioSucursal.create({
        data: {
          UsuarioId: usuario.Id,
          SucursalId: sucursalCentral.Id,
          TenantId: newTenant.Id,
          EsDefault: true,
        },
      });
      console.log("✅ Usuario asignado a sucursal");

      // Crear Cliente "Consumidor Final" por defecto
      const condicionIvaCF = await tx.condicionIva.findFirst({
        where: {
          Descripcion: { contains: "Consumidor Final", mode: "insensitive" },
        },
      });

      if (condicionIvaCF) {
        const consumidorFinal = await tx.persona.create({
          data: {
            Apellido: "Final",
            Nombre: "Consumidor",
            Dni: null,
            Direccion: "Sin dirección",
            Telefono: null,
            Mail: null,
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
        console.log("✅ Cliente Consumidor Final creado");
      }

      // Crear Perfil SuperAdmin
      const perfilSuperAdmin = await tx.perfiles.create({
        data: {
          Descripcion: "SuperAdmin",
          Tipo: PerfilTipo.SUPERADMIN,
          EstaEliminado: false,
          TenantId: newTenant.Id,
        },
      });
      console.log("✅ Perfil SuperAdmin creado");

      // Definir permisos para SuperAdmin (todos los permisos)
      const permisosBasicos = [
        {
          clave: "empleados:admin",
          descripcion: "Administración completa de empleados",
        },
        { clave: "ventas", descripcion: "Acceso a ventas" },
        { clave: "caja", descripcion: "Acceso a caja" },
        { clave: "clientes", descripcion: "Acceso a clientes" },
        { clave: "productos", descripcion: "Acceso a productos" },
        { clave: "analiticas", descripcion: "Acceso a analíticas" },
        { clave: "configuracion", descripcion: "Acceso a configuración" },
        { clave: "superadmin", descripcion: "Acceso de SuperAdmin" },
      ];

      // Crear y asignar permisos
      for (const permisoData of permisosBasicos) {
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

        await tx.perfilPermiso.create({
          data: {
            PerfilId: perfilSuperAdmin.Id,
            PermisoId: permiso.Id,
            TenantId: newTenant.Id,
          },
        });
      }
      console.log("✅ Permisos creados y asignados");

      // Asignar perfil al usuario
      await tx.perfilUsuario.create({
        data: {
          Perfil_Id: perfilSuperAdmin.Id,
          Usuario_Id: usuario.Id,
          TenantId: newTenant.Id,
        },
      });
      console.log("✅ Perfil asignado al usuario");

      // Crear Configuración
      await tx.configuracion.create({
        data: {
          RazonSocial: TENANT_NAME,
          NombreFantasia: TENANT_NAME,
          Cuit: "00000000000",
          Telefono: null,
          Celular: null,
          Direccion: "Sin dirección",
          Email: SUPER_ADMIN_EMAIL,
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
      console.log("✅ Configuración creada");

      return newTenant;
    });

    // Actualizar metadata del usuario en Supabase
    const { error: metaError } =
      await getSupabaseServiceClient().auth.admin.updateUserById(authUserId, {
        app_metadata: {
          tenantId: tenant.Id.toString(),
        },
      });

    if (metaError) {
      console.error("❌ Error actualizando metadata en Supabase:", metaError);
      throw new Error(
        "No se pudo actualizar el metadata del usuario: " +
          (metaError?.message ?? "error desconocido"),
      );
    }

    console.log("✨ Seed de SuperAdmin completado!");
    console.log(`📧 Email: ${SUPER_ADMIN_EMAIL}`);
    console.log(`🔑 Password: ${SUPER_ADMIN_PASSWORD}`);
    console.log(`👤 Username: ${SUPER_ADMIN_USERNAME}`);
  } catch (error) {
    console.error("❌ Error creando SuperAdmin:", error);
    throw error;
  }
}
async function seedCondicionesIva() {
  console.log("🌱 Cargando condiciones de IVA...");

  for (const descripcion of condicionesIva) {
    await db.condicionIva.create({
      data: {
        Descripcion: descripcion,
        EstaEliminado: false,
      },
    });
  }
  console.log("✨ Seed de condiciones de IVA completado!");
}
async function seedIva() {
  console.log("🌱 Cargando IVA...");

  for (const iva of ivas) {
    await db.iva.create({
      data: {
        Descripcion: iva.Descripcion,
        Porcentaje: iva.Porcentaje,
        EstaEliminado: false,
      },
    });
  }
  console.log("✨ Seed de IVA completado!");
}
async function deleteAllUsersSupabaseAuth() {
  console.log("✨ Borrando usuarios de Supabase Auth...");
  // 1. Listar los usuarios (La API devuelve max 50 por página por defecto, hay que paginar)
  const {
    data: { users },
    error,
  } = await getSupabaseServiceClient().auth.admin.listUsers({ perPage: 1000 });

  if (error) {
    console.error("Error listando:", error);
    return;
  }

  if (users.length === 0) {
    console.log("No hay usuarios para borrar.");
    return;
  }

  console.log(`✨ Encontrados ${users.length} usuarios. Borrando...`);

  // 2. Borrarlos en paralelo
  const deletePromises = users.map((user) =>
    getSupabaseServiceClient().auth.admin.deleteUser(user.id),
  );

  await Promise.all(deletePromises);

  console.log("✨ Todos los usuarios eliminados.");

  // Nota: Si tienes más de 1000 usuarios, deberás ejecutar esto dentro de un bucle `while`.
}
async function main() {
  console.log("🌱 Iniciando seed...");
  await deleteAllUsersSupabaseAuth();
  await seedCondicionesIva();
  await seedIva();
  await seedProvincias();
  await seedDepartamentos();
  await seedLocalidades();
  await seedSuperAdmin();
  console.log("🌱 Finalizado seed...");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
