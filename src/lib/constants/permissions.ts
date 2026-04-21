/**
 * Sistema de permisos de 3 niveles.
 *
 * Fuente unica de verdad: al agregar un modulo aca se derivan automaticamente
 * labels, claves, descripciones y catalogos para UI/scripts.
 */

export const PERMISSION_DEFINITIONS = {
  VENTAS: {
    module: "ventas",
    label: "Ventas",
    page: "ventas:page",
    get: "ventas:get",
    set: "ventas:set",
  },
  CAJA: {
    module: "caja",
    label: "Caja",
    page: "caja:page",
    get: "caja:get",
    set: "caja:set",
  },
  PRODUCTOS: {
    module: "productos",
    label: "Productos",
    page: "productos:page",
    get: "productos:get",
    set: "productos:set",
  },
  PROVEEDORES: {
    module: "proveedores",
    label: "Proveedores",
    page: "proveedores:page",
    get: "proveedores:get",
    set: "proveedores:set",
  },
  COMPRAS: {
    module: "compras",
    label: "Compras",
    page: "compras:page",
    get: "compras:get",
    set: "compras:set",
  },
  EMPLEADOS: {
    module: "empleados",
    label: "Empleados",
    page: "empleados:page",
    get: "empleados:get",
    set: "empleados:set",
  },
  CLIENTES: {
    module: "clientes",
    label: "Clientes",
    page: "clientes:page",
    get: "clientes:get",
    set: "clientes:set",
  },
  REPORTES: {
    module: "reportes",
    label: "Reportes",
    page: "reportes:page",
    get: "reportes:get",
  },
  CONFIGURACION: {
    module: "configuracion",
    label: "Configuracion",
    page: "configuracion:page",
    get: "configuracion:get",
    set: "configuracion:set",
  },
  SUCURSALES: {
    module: "sucursales",
    label: "Sucursales",
    page: "sucursales:page",
    get: "sucursales:get",
    set: "sucursales:set",
  },
  AUDITORIA: {
    module: "auditoria",
    label: "Auditoria",
    page: "auditoria:page",
    get: "auditoria:get",
  },
  ANALITICAS: {
    module: "analiticas",
    label: "Analiticas",
    page: "analiticas:page",
    get: "analiticas:get",
  },
} as const;

type PermissionDefinitions = typeof PERMISSION_DEFINITIONS;
type PermissionDefinitionKey = keyof PermissionDefinitions;
type WritablePermissionDefinitionKey = {
  [K in PermissionDefinitionKey]: PermissionDefinitions[K] extends {
    set: string;
  }
    ? K
    : never;
}[PermissionDefinitionKey];

export type PermissionModule =
  PermissionDefinitions[PermissionDefinitionKey]["module"];
export type WritablePermissionModule =
  PermissionDefinitions[WritablePermissionDefinitionKey]["module"];

export const PAGE_PERMISSIONS = Object.fromEntries(
  Object.entries(PERMISSION_DEFINITIONS).map(([key, definition]) => [
    key,
    definition.page,
  ]),
) as {
  [K in PermissionDefinitionKey]: PermissionDefinitions[K]["page"];
};

export const GET_PERMISSIONS = Object.fromEntries(
  Object.entries(PERMISSION_DEFINITIONS).map(([key, definition]) => [
    key,
    definition.get,
  ]),
) as {
  [K in PermissionDefinitionKey]: PermissionDefinitions[K]["get"];
};

export const SET_PERMISSIONS = Object.fromEntries(
  Object.entries(PERMISSION_DEFINITIONS)
    .filter(
      (
        entry,
      ): entry is [
        WritablePermissionDefinitionKey,
        PermissionDefinitions[WritablePermissionDefinitionKey],
      ] => "set" in entry[1],
    )
    .map(([key, definition]) => [key, definition.set]),
) as {
  [K in WritablePermissionDefinitionKey]: PermissionDefinitions[K] extends {
    set: string;
  }
    ? PermissionDefinitions[K]["set"]
    : never;
};

export type PagePermission =
  (typeof PAGE_PERMISSIONS)[keyof typeof PAGE_PERMISSIONS];
export type GetPermission =
  (typeof GET_PERMISSIONS)[keyof typeof GET_PERMISSIONS];
export type SetPermission =
  (typeof SET_PERMISSIONS)[keyof typeof SET_PERMISSIONS];
export type Permission = PagePermission | GetPermission | SetPermission;

// Alias legacy: evita la colision previa de spreads y mantiene compatibilidad.
export const PERMISSIONS = PAGE_PERMISSIONS;

export const PERMISSION_MODULES = Object.values(PERMISSION_DEFINITIONS).map(
  (definition) => definition.module,
) as PermissionModule[];

export const WRITABLE_MODULES = Object.values(PERMISSION_DEFINITIONS)
  .filter(
    (
      definition,
    ): definition is PermissionDefinitions[WritablePermissionDefinitionKey] =>
      "set" in definition,
  )
  .map((definition) => definition.module) as WritablePermissionModule[];

export const PERMISSION_MODULE_LABELS = Object.fromEntries(
  Object.values(PERMISSION_DEFINITIONS).map((definition) => [
    definition.module,
    definition.label,
  ]),
) as Record<PermissionModule, string>;

export function getModulePermissions(module: PermissionModule): Permission[] {
  const definition = Object.values(PERMISSION_DEFINITIONS).find(
    (item) => item.module === module,
  );

  if (!definition) return [];

  const permissions: Permission[] = [definition.page, definition.get];
  if ("set" in definition) {
    permissions.push(definition.set);
  }

  return permissions;
}

export const ALL_PERMISSIONS = PERMISSION_MODULES.flatMap((module) =>
  getModulePermissions(module),
) as Permission[];

export function getModuleLabel(module: PermissionModule): string {
  return PERMISSION_MODULE_LABELS[module] ?? module;
}

export function getPermissionDescription(permission: string): string {
  const [module, level] = permission.split(":");
  const label = PERMISSION_MODULE_LABELS[module as PermissionModule] ?? module;

  switch (level) {
    case "page":
      return `Acceso a Pagina de ${label}`;
    case "get":
      return `Acceso a Obtener ${label}`;
    case "set":
      return `Acceso a Modificar ${label}`;
    default:
      return `Acceso a ${label}`;
  }
}

export const PERMISSION_DESCRIPTIONS = Object.fromEntries(
  ALL_PERMISSIONS.map((permission) => [
    permission,
    getPermissionDescription(permission),
  ]),
) as Record<Permission, string>;
